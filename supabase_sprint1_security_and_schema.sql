-- ============================================================
-- GELATO MANAGER V2 - MIGRATION SPRINT 1
-- Objetivo: Segurança, RBAC, RLS, Correção de Funções/Views
-- e Expansão do Modelo para PDV Touch (Peso, Bolas, Caixa, Pagamentos)
-- ============================================================

-- 1. CORREÇÃO DE FUNÇÕES PL/PGSQL (SET search_path = public)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_recipe_item_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    ing_cost DECIMAL(10, 2);
BEGIN
    SELECT cost_per_unit INTO ing_cost
    FROM public.ingredients
    WHERE id = NEW.ingredient_id;

    NEW.cost = COALESCE(ing_cost, 0) * NEW.quantity;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_recipe_total_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    target_recipe_id UUID;
    total DECIMAL(10, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_recipe_id = OLD.recipe_id;
    ELSE
        target_recipe_id = NEW.recipe_id;
    END IF;

    SELECT COALESCE(SUM(cost), 0) INTO total
    FROM public.recipe_items
    WHERE recipe_id = target_recipe_id;

    UPDATE public.recipes
    SET total_cost = total, updated_at = NOW()
    WHERE id = target_recipe_id;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ingredient_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF NEW.movement_type = 'IN' THEN
        UPDATE public.ingredients
        SET current_stock = current_stock + NEW.quantity,
            last_updated = NOW(),
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.movement_type = 'OUT' THEN
        UPDATE public.ingredients
        SET current_stock = current_stock - NEW.quantity,
            last_updated = NOW(),
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
        UPDATE public.ingredients
        SET current_stock = NEW.quantity,
            last_updated = NOW(),
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    target_order_id UUID;
    order_subtotal DECIMAL(10, 2);
    order_discount DECIMAL(10, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_order_id = OLD.order_id;
    ELSE
        target_order_id = NEW.order_id;
    END IF;

    SELECT COALESCE(SUM(subtotal), 0) INTO order_subtotal
    FROM public.order_items
    WHERE order_id = target_order_id;

    SELECT COALESCE(discount, 0) INTO order_discount
    FROM public.orders
    WHERE id = target_order_id;

    UPDATE public.orders
    SET subtotal = order_subtotal,
        total = GREATEST(order_subtotal - order_discount, 0),
        updated_at = NOW()
    WHERE id = target_order_id;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    today_str VARCHAR(8);
    seq_num INT;
    new_order_num VARCHAR(50);
BEGIN
    today_str = TO_CHAR(NOW(), 'YYYYMMDD');

    SELECT COUNT(*) + 1 INTO seq_num
    FROM public.orders
    WHERE order_number LIKE 'ORD-' || today_str || '-%';

    new_order_num = 'ORD-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.order_number = new_order_num;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_cost(prod_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    cost DECIMAL(10, 2);
BEGIN
    SELECT total_cost INTO cost
    FROM public.recipes
    WHERE product_id = prod_id AND is_active = true;

    RETURN COALESCE(cost, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_margin(prod_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    prod_price DECIMAL(10, 2);
    prod_cost DECIMAL(10, 2);
BEGIN
    SELECT price INTO prod_price FROM public.products WHERE id = prod_id;
    SELECT total_cost INTO prod_cost FROM public.recipes WHERE product_id = prod_id AND is_active = true;

    IF prod_price IS NULL OR prod_price = 0 THEN
        RETURN 0;
    END IF;

    RETURN ((prod_price - COALESCE(prod_cost, 0)) / prod_price) * 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_atividade_heartbeat()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.atividade_heartbeat WHERE data_hora < NOW() - INTERVAL '7 days';
END;
$$;

-- 2. CORREÇÃO DAS VIEWS COM SECURITY INVOKER = TRUE
-- ============================================================

DROP VIEW IF EXISTS public.v_products_with_cost CASCADE;
DROP VIEW IF EXISTS public.v_recipes_detailed CASCADE;
DROP VIEW IF EXISTS public.v_sales_statistics CASCADE;
DROP VIEW IF EXISTS public.v_low_stock_ingredients CASCADE;

CREATE VIEW public.v_products_with_cost WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.name,
    p.price,
    c.name AS category_name,
    p.image_url,
    r.id AS recipe_id,
    r.total_cost,
    (p.price - COALESCE(r.total_cost, 0.00)) AS profit,
    CASE 
        WHEN p.price > 0 THEN ((p.price - COALESCE(r.total_cost, 0.00)) / p.price) * 100
        ELSE 0
    END AS margin_percentage,
    p.is_active,
    p.created_at,
    p.updated_at
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.recipes r ON r.product_id = p.id;

CREATE VIEW public.v_recipes_detailed WITH (security_invoker = true) AS
SELECT 
    r.id AS recipe_id,
    p.id AS product_id,
    p.name AS product_name,
    r.yield,
    r.prep_time,
    r.total_cost,
    COALESCE(
        json_agg(
            json_build_object(
                'ingredient_id', i.id,
                'ingredient_name', i.name,
                'quantity', ri.quantity,
                'unit', ri.unit,
                'cost', ri.cost
            ) ORDER BY ri.display_order
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
    ) AS ingredients
FROM public.recipes r
JOIN public.products p ON r.product_id = p.id
LEFT JOIN public.recipe_items ri ON ri.recipe_id = r.id
LEFT JOIN public.ingredients i ON ri.ingredient_id = i.id
WHERE r.is_active = true
GROUP BY r.id, p.id, p.name, r.yield, r.prep_time, r.total_cost;

CREATE VIEW public.v_sales_statistics WITH (security_invoker = true) AS
SELECT 
    DATE(order_date) AS sale_date,
    COUNT(id) AS total_orders,
    SUM(total) AS total_revenue,
    AVG(total) AS average_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM public.orders
WHERE status <> 'Cancelled'
GROUP BY DATE(order_date)
ORDER BY sale_date DESC;

CREATE VIEW public.v_low_stock_ingredients WITH (security_invoker = true) AS
SELECT 
    i.id,
    i.name,
    ic.name AS category_name,
    i.current_stock,
    i.min_stock,
    i.unit,
    s.name AS supplier_name,
    s.phone AS supplier_phone,
    s.email AS supplier_email
FROM public.ingredients i
LEFT JOIN public.ingredient_categories ic ON i.category_id = ic.id
LEFT JOIN public.suppliers s ON i.supplier_id = s.id
WHERE i.current_stock <= i.min_stock AND i.is_active = true;

-- 3. ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_movements_employee_id ON public.inventory_movements(employee_id);

-- 4. EXPANSÃO DO MODELO RELACIONAL PARA GELATO MANAGER V2
-- ============================================================

-- Extensão de produtos (formas de venda: peso, bola, unidade, combo, adicional)
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'UNIT' CHECK (sale_type IN ('WEIGHT', 'SCOOP', 'UNIT', 'COMBO', 'ADDON')),
    ADD COLUMN IF NOT EXISTS is_flavor BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS stock_trackable BOOLEAN DEFAULT true;

-- Atualizar produtos existentes do seed com seus tipos corretos
UPDATE public.products SET sale_type = 'SCOOP', is_flavor = true WHERE name IN ('Chocolate', 'Morango', 'Creme', 'Flocos', 'Pistache', 'Doce de Leite', 'Menta', 'Limão');
UPDATE public.products SET sale_type = 'UNIT' WHERE name LIKE '%Açaí%';

-- Recipientes com Tara Pré-cadastrada
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tare_weight NUMERIC(10, 3) NOT NULL DEFAULT 0.000, -- em kg (ex: 0.015 = 15g)
    sale_type VARCHAR(20) NOT NULL DEFAULT 'WEIGHT' CHECK (sale_type IN ('WEIGHT', 'SCOOP', 'BOTH')),
    scoop_capacity INTEGER DEFAULT 1,
    price NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir recipientes padrão caso ainda não existam
INSERT INTO public.containers (name, tare_weight, sale_type, scoop_capacity, price)
VALUES 
    ('Pote Térmico Pequeno (250g)', 0.015, 'WEIGHT', 1, 0.00),
    ('Pote Térmico Médio (500g)', 0.022, 'WEIGHT', 2, 0.00),
    ('Pote Térmico Grande (1kg)', 0.035, 'WEIGHT', 3, 0.00),
    ('Copo Pequeno (1 Bola)', 0.008, 'SCOOP', 1, 0.00),
    ('Copo Médio (2 Bolas)', 0.012, 'SCOOP', 2, 0.00),
    ('Copo Grande (3 Bolas)', 0.016, 'SCOOP', 3, 0.00),
    ('Casquinha Crocante Simples', 0.010, 'SCOOP', 1, 0.00),
    ('Cascão Artesanal Especial', 0.018, 'SCOOP', 2, 2.50)
ON CONFLICT DO NOTHING;

-- Terminais PDV
CREATE TABLE IF NOT EXISTS public.terminals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.terminals (code, name)
VALUES 
    ('CAIXA-01', 'Terminal Caixa Principal'),
    ('CAIXA-02', 'Terminal Caixa Rápido')
ON CONFLICT (code) DO NOTHING;

-- Sessões de Caixa (Abertura, Movimentação e Fechamento)
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closing_expected_amount NUMERIC(10, 2),
    closing_actual_amount NUMERIC(10, 2),
    difference NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_employee_id ON public.cash_register_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_register_sessions(status);

-- Movimentações de Caixa (Sangria e Suprimento)
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('SUPPLY', 'BLEED')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagamentos Múltiplos / Split de Pagamento
CREATE TABLE IF NOT EXISTS public.order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'VALE_REFEICAO', 'OUTRO')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    change_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);

-- Extensão da tabela orders para associar caixa e terminal
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.cash_register_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL;

-- Extensão de order_items para suportar venda por peso, tara e opções de sabores/adicionais
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS container_id UUID REFERENCES public.containers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(10, 3) DEFAULT 0.000,
    ADD COLUMN IF NOT EXISTS tare_weight NUMERIC(10, 3) DEFAULT 0.000,
    ADD COLUMN IF NOT EXISTS net_weight NUMERIC(10, 3) DEFAULT 0.000,
    ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'UNIT',
    ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;

-- Gestão de Cubas de Sorvete (Rastreabilidade e QR Code)
CREATE TABLE IF NOT EXISTS public.tubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    flavor_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    capacity_kg NUMERIC(10, 3) DEFAULT 5.000,
    current_weight_kg NUMERIC(10, 3) DEFAULT 5.000,
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('PREPARING', 'AVAILABLE', 'IN_USE', 'LOW', 'EMPTY', 'CLEANING', 'INACTIVE')),
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trilha de Auditoria para Ações Sensíveis
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    terminal_code VARCHAR(50),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Extensão da tabela employees para autenticação e PIN de acesso rápido
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS auth_user_id UUID,
    ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);

-- 5. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividade_heartbeat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE ACESSO (POLICIES) RLS
-- ============================================================

-- Catálogo Público (Leitura aberta para exibição e PDV)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read categories" ON public.categories;
    CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read products" ON public.products;
    CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read containers" ON public.containers;
    CREATE POLICY "Public read containers" ON public.containers FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read settings" ON public.settings;
    CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read terminals" ON public.terminals;
    CREATE POLICY "Public read terminals" ON public.terminals FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read tubs" ON public.tubs;
    CREATE POLICY "Public read tubs" ON public.tubs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read recipes" ON public.recipes;
    CREATE POLICY "Public read recipes" ON public.recipes FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read recipe_items" ON public.recipe_items;
    CREATE POLICY "Public read recipe_items" ON public.recipe_items FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read ingredients" ON public.ingredients;
    CREATE POLICY "Public read ingredients" ON public.ingredients FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read ingredient_categories" ON public.ingredient_categories;
    CREATE POLICY "Public read ingredient_categories" ON public.ingredient_categories FOR SELECT USING (true);

    -- Permissões operacionais de escrita para Catálogo / Receitas
    DROP POLICY IF EXISTS "Manage categories" ON public.categories;
    CREATE POLICY "Manage categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage products" ON public.products;
    CREATE POLICY "Manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage containers" ON public.containers;
    CREATE POLICY "Manage containers" ON public.containers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage settings" ON public.settings;
    CREATE POLICY "Manage settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage ingredients" ON public.ingredients;
    CREATE POLICY "Manage ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage recipes" ON public.recipes;
    CREATE POLICY "Manage recipes" ON public.recipes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Manage recipe_items" ON public.recipe_items;
    CREATE POLICY "Manage recipe_items" ON public.recipe_items FOR ALL USING (true) WITH CHECK (true);

    -- Permissões de Vendas (Pedidos, Itens e Pagamentos)
    DROP POLICY IF EXISTS "Operational read orders" ON public.orders;
    CREATE POLICY "Operational read orders" ON public.orders FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Operational insert orders" ON public.orders;
    CREATE POLICY "Operational insert orders" ON public.orders FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational update orders" ON public.orders;
    CREATE POLICY "Operational update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational read order_items" ON public.order_items;
    CREATE POLICY "Operational read order_items" ON public.order_items FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Operational insert order_items" ON public.order_items;
    CREATE POLICY "Operational insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational read order_payments" ON public.order_payments;
    CREATE POLICY "Operational read order_payments" ON public.order_payments FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Operational insert order_payments" ON public.order_payments;
    CREATE POLICY "Operational insert order_payments" ON public.order_payments FOR INSERT WITH CHECK (true);

    -- Caixa e Movimentações
    DROP POLICY IF EXISTS "Operational read cash_sessions" ON public.cash_register_sessions;
    CREATE POLICY "Operational read cash_sessions" ON public.cash_register_sessions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Operational manage cash_sessions" ON public.cash_register_sessions;
    CREATE POLICY "Operational manage cash_sessions" ON public.cash_register_sessions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational read cash_movements" ON public.cash_movements;
    CREATE POLICY "Operational read cash_movements" ON public.cash_movements FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Operational insert cash_movements" ON public.cash_movements;
    CREATE POLICY "Operational insert cash_movements" ON public.cash_movements FOR INSERT WITH CHECK (true);

    -- Estoque e Auditoria
    DROP POLICY IF EXISTS "Operational manage inventory_movements" ON public.inventory_movements;
    CREATE POLICY "Operational manage inventory_movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational manage customers" ON public.customers;
    CREATE POLICY "Operational manage customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational manage employees" ON public.employees;
    CREATE POLICY "Operational manage employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational manage suppliers" ON public.suppliers;
    CREATE POLICY "Operational manage suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational insert audit_logs" ON public.audit_logs;
    CREATE POLICY "Operational insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Operational read audit_logs" ON public.audit_logs;
    CREATE POLICY "Operational read audit_logs" ON public.audit_logs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Heartbeat access" ON public.atividade_heartbeat;
    CREATE POLICY "Heartbeat access" ON public.atividade_heartbeat FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 7. PROCEDURE TRANSACIONAL ATÔMICA: finalize_sale()
-- Garante cálculo server-side de preço, verificação de caixa,
-- inserção de pedido, itens, pagamentos e baixa em estoque com rollback total.
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_sale(p_sale_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_customer_id UUID := NULL;
    v_employee_id UUID := NULL;
    v_terminal_id UUID := NULL;
    v_session_id UUID := NULL;
    v_notes TEXT := NULL;
    v_discount NUMERIC(10, 2) := 0.00;
    v_calculated_subtotal NUMERIC(10, 2) := 0.00;
    v_calculated_total NUMERIC(10, 2) := 0.00;
    
    v_item JSONB;
    v_item_product_id UUID;
    v_item_container_id UUID;
    v_item_sale_type VARCHAR(20);
    v_item_qty INTEGER;
    v_item_gross_weight NUMERIC(10, 3);
    v_item_tare_weight NUMERIC(10, 3);
    v_item_net_weight NUMERIC(10, 3);
    v_official_unit_price NUMERIC(10, 2);
    v_item_subtotal NUMERIC(10, 2);
    v_item_options JSONB;
    
    v_payment JSONB;
    v_payment_method VARCHAR(50);
    v_payment_amount NUMERIC(10, 2);
    v_payment_change NUMERIC(10, 2);
    v_total_paid NUMERIC(10, 2) := 0.00;
BEGIN
    -- 1. Extração de cabeçalho do payload
    IF p_sale_payload->>'customer_id' IS NOT NULL AND p_sale_payload->>'customer_id' <> '' THEN
        v_customer_id := (p_sale_payload->>'customer_id')::UUID;
    END IF;

    IF p_sale_payload->>'employee_id' IS NOT NULL AND p_sale_payload->>'employee_id' <> '' THEN
        v_employee_id := (p_sale_payload->>'employee_id')::UUID;
    END IF;

    IF p_sale_payload->>'terminal_id' IS NOT NULL AND p_sale_payload->>'terminal_id' <> '' THEN
        v_terminal_id := (p_sale_payload->>'terminal_id')::UUID;
    END IF;

    IF p_sale_payload->>'session_id' IS NOT NULL AND p_sale_payload->>'session_id' <> '' THEN
        v_session_id := (p_sale_payload->>'session_id')::UUID;
    END IF;

    v_notes := p_sale_payload->>'notes';
    v_discount := COALESCE((p_sale_payload->>'discount')::NUMERIC, 0.00);

    -- 2. Validar se existem itens no pedido
    IF jsonb_array_length(p_sale_payload->'items') = 0 THEN
        RAISE EXCEPTION 'O pedido não pode ser finalizado sem itens.';
    END IF;

    -- 3. Criar registro inicial do pedido (orders)
    INSERT INTO public.orders (
        customer_id,
        employee_id,
        terminal_id,
        session_id,
        status,
        subtotal,
        discount,
        total,
        notes
    ) VALUES (
        v_customer_id,
        v_employee_id,
        v_terminal_id,
        v_session_id,
        'Delivered',
        0.00,
        v_discount,
        0.00,
        v_notes
    ) RETURNING id, order_number INTO v_order_id, v_order_number;

    -- 4. Processar cada item com busca oficial de preço no banco (anti-tampering)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale_payload->'items')
    LOOP
        v_item_product_id := (v_item->>'product_id')::UUID;
        v_item_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
        v_item_options := COALESCE(v_item->'options', '{}'::jsonb);
        
        IF v_item->>'container_id' IS NOT NULL AND v_item->>'container_id' <> '' THEN
            v_item_container_id := (v_item->>'container_id')::UUID;
        ELSE
            v_item_container_id := NULL;
        END IF;

        -- Buscar preço oficial e sale_type no banco
        SELECT price, sale_type INTO v_official_unit_price, v_item_sale_type
        FROM public.products
        WHERE id = v_item_product_id AND is_active = true;

        IF v_official_unit_price IS NULL THEN
            RAISE EXCEPTION 'Produto % não encontrado ou inativo.', v_item_product_id;
        END IF;

        -- Calcular subtotal de acordo com o tipo de venda
        IF v_item_sale_type = 'WEIGHT' THEN
            v_item_gross_weight := COALESCE((v_item->>'gross_weight')::NUMERIC, 0.000);
            v_item_tare_weight := COALESCE((v_item->>'tare_weight')::NUMERIC, 0.000);
            v_item_net_weight := GREATEST(v_item_gross_weight - v_item_tare_weight, 0.000);
            
            -- Para venda por peso, o preço unitário oficial é o preço por kg
            v_item_subtotal := ROUND(v_item_net_weight * v_official_unit_price, 2);
        ELSE
            v_item_gross_weight := 0.000;
            v_item_tare_weight := 0.000;
            v_item_net_weight := 0.000;
            v_item_subtotal := ROUND(v_item_qty * v_official_unit_price, 2);
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;

        -- Inserir o item do pedido
        INSERT INTO public.order_items (
            order_id,
            product_id,
            container_id,
            sale_type,
            quantity,
            gross_weight,
            tare_weight,
            net_weight,
            unit_price,
            subtotal,
            options
        ) VALUES (
            v_order_id,
            v_item_product_id,
            v_item_container_id,
            v_item_sale_type,
            v_item_qty,
            v_item_gross_weight,
            v_item_tare_weight,
            v_item_net_weight,
            v_official_unit_price,
            v_item_subtotal,
            v_item_options
        );
    END LOOP;

    -- 5. Calcular e atualizar total do pedido
    v_calculated_total := GREATEST(v_calculated_subtotal - v_discount, 0.00);

    UPDATE public.orders
    SET subtotal = v_calculated_subtotal,
        total = v_calculated_total,
        updated_at = NOW()
    WHERE id = v_order_id;

    -- 6. Processar Pagamentos (Split Payment)
    IF p_sale_payload->'payments' IS NOT NULL AND jsonb_array_length(p_sale_payload->'payments') > 0 THEN
        FOR v_payment IN SELECT * FROM jsonb_array_elements(p_sale_payload->'payments')
        LOOP
            v_payment_method := v_payment->>'payment_method';
            v_payment_amount := (v_payment->>'amount')::NUMERIC;
            v_payment_change := COALESCE((v_payment->>'change_amount')::NUMERIC, 0.00);

            INSERT INTO public.order_payments (
                order_id,
                payment_method,
                amount,
                change_amount
            ) VALUES (
                v_order_id,
                v_payment_method,
                v_payment_amount,
                v_payment_change
            );

            v_total_paid := v_total_paid + v_payment_amount;
        END LOOP;

        IF v_total_paid < v_calculated_total THEN
            RAISE EXCEPTION 'Valor total pago (R$ %) é inferior ao total do pedido (R$ %).', v_total_paid, v_calculated_total;
        END IF;
    END IF;

    -- 7. Registrar Auditoria Operacional
    INSERT INTO public.audit_logs (
        employee_id,
        action,
        entity,
        entity_id,
        details
    ) VALUES (
        v_employee_id,
        'FINALIZAR_VENDA',
        'orders',
        v_order_id::TEXT,
        jsonb_build_object(
            'order_number', v_order_number,
            'total', v_calculated_total,
            'subtotal', v_calculated_subtotal,
            'items_count', jsonb_array_length(p_sale_payload->'items'),
            'total_paid', v_total_paid
        )
    );

    -- 8. Retornar dados do pedido finalizado
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_calculated_subtotal,
        'discount', v_discount,
        'total', v_calculated_total,
        'total_paid', v_total_paid
    );
END;
$$;

-- 8. CRON JOB DE LIMPEZA DO HEARTBEAT
-- Agendamento para executar a cada semana limpando registros com mais de 7 dias
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('limpar_atividade_heartbeat');
        PERFORM cron.schedule('limpar_atividade_heartbeat', '0 4 * * 0', 'DELETE FROM public.atividade_heartbeat WHERE data_hora < NOW() - INTERVAL ''7 days'';');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
