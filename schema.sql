-- ============================================================
-- SCHEMA SQL COMPLETO - SORVETERIA GELATO MANAGER
-- Database: Supabase (PostgreSQL)
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: categories
-- Descrição: Categorias de produtos (Casquinha, Copo, Açaí, etc)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: products
-- Descrição: Produtos da sorveteria (sabores, açaí, bebidas, etc)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: ingredient_categories
-- Descrição: Categorias de ingredientes
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: suppliers
-- Descrição: Fornecedores de ingredientes
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: ingredients
-- Descrição: Ingredientes utilizados nas receitas
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'g', 'L', 'ml', 'un')),
    cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    current_stock DECIMAL(10, 3) DEFAULT 0,
    min_stock DECIMAL(10, 3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: recipes
-- Descrição: Receitas/Fichas técnicas dos produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    yield INTEGER NOT NULL DEFAULT 1 CHECK (yield > 0),
    prep_time INTEGER, -- tempo de preparo em minutos
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id)
);

-- ============================================================
-- TABELA: recipe_items
-- Descrição: Items/ingredientes de cada receita
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'g', 'L', 'ml', 'un')),
    cost DECIMAL(10, 2) DEFAULT 0.00,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: employees
-- Descrição: Funcionários da sorveteria
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    hire_date DATE,
    salary DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: customers
-- Descrição: Clientes da sorveteria (opcional, para pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    birth_date DATE,
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: orders
-- Descrição: Pedidos/vendas realizadas
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled')),
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: order_items
-- Descrição: Items de cada pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: inventory_movements
-- Descrição: Movimentações de estoque (entrada/saída)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    reason VARCHAR(200),
    notes TEXT,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: settings
-- Descrição: Configurações do sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    data_type VARCHAR(50) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- Ingredients
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier_id);
CREATE INDEX idx_ingredients_active ON ingredients(is_active);
CREATE INDEX idx_ingredients_name ON ingredients(name);

-- Recipes
CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipes_active ON recipes(is_active);

-- Recipe Items
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_ingredient ON recipe_items(ingredient_id);

-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_employee ON orders(employee_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Inventory Movements
CREATE INDEX idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- Employees
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);

-- Customers
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_categories_updated_at BEFORE UPDATE ON ingredient_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_items_updated_at BEFORE UPDATE ON recipe_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGERS PARA CÁLCULO AUTOMÁTICO DE CUSTOS
-- ============================================================

-- Função para atualizar custo total da receita
CREATE OR REPLACE FUNCTION update_recipe_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recipes
    SET total_cost = (
        SELECT COALESCE(SUM(cost), 0)
        FROM recipe_items
        WHERE recipe_id = NEW.recipe_id
    )
    WHERE id = NEW.recipe_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar custo quando recipe_items muda
CREATE TRIGGER update_recipe_cost_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON recipe_items
    FOR EACH ROW EXECUTE FUNCTION update_recipe_total_cost();

-- Função para calcular custo do item da receita
CREATE OR REPLACE FUNCTION calculate_recipe_item_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cost = (
        SELECT NEW.quantity * i.cost_per_unit
        FROM ingredients i
        WHERE i.id = NEW.ingredient_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular custo do item
CREATE TRIGGER calculate_item_cost_before_insert_update
    BEFORE INSERT OR UPDATE ON recipe_items
    FOR EACH ROW EXECUTE FUNCTION calculate_recipe_item_cost();

-- ============================================================
-- TRIGGERS PARA ATUALIZAR ESTOQUE
-- ============================================================

-- Função para atualizar estoque do ingrediente
CREATE OR REPLACE FUNCTION update_ingredient_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'IN' THEN
        UPDATE ingredients
        SET current_stock = current_stock + NEW.quantity,
            last_updated = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.movement_type = 'OUT' THEN
        UPDATE ingredients
        SET current_stock = current_stock - NEW.quantity,
            last_updated = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
        UPDATE ingredients
        SET current_stock = NEW.quantity,
            last_updated = NOW()
        WHERE id = NEW.ingredient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para movimentações de estoque
CREATE TRIGGER update_stock_on_movement
    AFTER INSERT ON inventory_movements
    FOR EACH ROW EXECUTE FUNCTION update_ingredient_stock();

-- ============================================================
-- TRIGGERS PARA PEDIDOS
-- ============================================================

-- Função para calcular total do pedido
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
    ),
    total = (
        SELECT COALESCE(SUM(subtotal), 0) - COALESCE(discount, 0)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total quando order_items muda
CREATE TRIGGER update_order_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number = 'OS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence para número de pedido
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger para gerar número de pedido
CREATE TRIGGER generate_order_number_before_insert
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View: Produtos com custo e margem
CREATE OR REPLACE VIEW v_products_with_cost AS
SELECT 
    p.id,
    p.name,
    p.price,
    c.name as category_name,
    p.image_url,
    r.id as recipe_id,
    r.total_cost,
    (p.price - COALESCE(r.total_cost, 0)) as profit,
    CASE 
        WHEN p.price > 0 THEN ((p.price - COALESCE(r.total_cost, 0)) / p.price * 100)
        ELSE 0 
    END as margin_percentage,
    p.is_active,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN recipes r ON r.product_id = p.id;

-- View: Ingredientes com estoque baixo
CREATE OR REPLACE VIEW v_low_stock_ingredients AS
SELECT 
    i.id,
    i.name,
    ic.name as category_name,
    i.current_stock,
    i.min_stock,
    i.unit,
    s.name as supplier_name,
    s.phone as supplier_phone,
    s.email as supplier_email
FROM ingredients i
LEFT JOIN ingredient_categories ic ON i.category_id = ic.id
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.current_stock <= i.min_stock
AND i.is_active = true;

-- View: Receitas completas com ingredientes
CREATE OR REPLACE VIEW v_recipes_detailed AS
SELECT 
    r.id as recipe_id,
    p.id as product_id,
    p.name as product_name,
    r.yield,
    r.prep_time,
    r.total_cost,
    json_agg(
        json_build_object(
            'ingredient_id', i.id,
            'ingredient_name', i.name,
            'quantity', ri.quantity,
            'unit', ri.unit,
            'cost', ri.cost
        ) ORDER BY ri.display_order
    ) as ingredients
FROM recipes r
JOIN products p ON r.product_id = p.id
LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
WHERE r.is_active = true
GROUP BY r.id, p.id, p.name, r.yield, r.prep_time, r.total_cost;

-- View: Estatísticas de vendas
CREATE OR REPLACE VIEW v_sales_statistics AS
SELECT 
    DATE(o.order_date) as sale_date,
    COUNT(o.id) as total_orders,
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value,
    COUNT(DISTINCT o.customer_id) as unique_customers
FROM orders o
WHERE o.status != 'Cancelled'
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- ============================================================
-- FUNÇÕES ÚTEIS
-- ============================================================

-- Função: Obter custo atual de um produto
CREATE OR REPLACE FUNCTION get_product_cost(p_product_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_cost DECIMAL(10, 2);
BEGIN
    SELECT total_cost INTO v_cost
    FROM recipes
    WHERE product_id = p_product_id
    AND is_active = true;
    
    RETURN COALESCE(v_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Função: Obter margem de lucro de um produto
CREATE OR REPLACE FUNCTION get_product_margin(p_product_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    v_price DECIMAL(10, 2);
    v_cost DECIMAL(10, 2);
    v_margin DECIMAL(5, 2);
BEGIN
    SELECT price INTO v_price
    FROM products
    WHERE id = p_product_id;
    
    v_cost := get_product_cost(p_product_id);
    
    IF v_price > 0 THEN
        v_margin := ((v_price - v_cost) / v_price * 100);
    ELSE
        v_margin := 0;
    END IF;
    
    RETURN v_margin;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DADOS INICIAIS (SEED DATA)
-- ============================================================

-- Inserir categorias de produtos
INSERT INTO categories (name, display_order) VALUES
    ('Casquinha', 1),
    ('Copo', 2),
    ('Açaí', 3),
    ('Milkshake', 4),
    ('Bebidas', 5)
ON CONFLICT (name) DO NOTHING;

-- Inserir categorias de ingredientes
INSERT INTO ingredient_categories (name) VALUES
    ('Laticínios'),
    ('Frutas/Polpas'),
    ('Secos'),
    ('Químicos'),
    ('Embalagens'),
    ('Outros')
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO settings (key, value, data_type, description) VALUES
    ('currency', 'BRL', 'string', 'Moeda utilizada'),
    ('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário'),
    ('tax_rate', '0', 'number', 'Taxa de imposto em %'),
    ('min_margin_alert', '30', 'number', 'Margem mínima de lucro para alerta'),
    ('store_name', 'Sorveteria Gelato', 'string', 'Nome da loja'),
    ('store_address', '', 'string', 'Endereço da loja'),
    ('store_phone', '', 'string', 'Telefone da loja'),
    ('auto_calculate_cost', 'true', 'boolean', 'Calcular custos automaticamente')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PERMISSÕES E SEGURANÇA (RLS - Row Level Security)
-- ============================================================

-- Habilitar RLS em todas as tabelas (opcional)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- etc...

-- Exemplo de política RLS (descomentar e ajustar conforme necessário)
-- CREATE POLICY "Allow all for authenticated users" ON products
--     FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================

-- Comentários finais
COMMENT ON TABLE products IS 'Produtos da sorveteria';
COMMENT ON TABLE ingredients IS 'Ingredientes utilizados nas receitas';
COMMENT ON TABLE recipes IS 'Fichas técnicas dos produtos';
COMMENT ON TABLE recipe_items IS 'Ingredientes de cada receita';
COMMENT ON TABLE orders IS 'Pedidos/vendas realizadas';
COMMENT ON TABLE order_items IS 'Itens de cada pedido';
COMMENT ON TABLE inventory_movements IS 'Movimentações de estoque';
COMMENT ON TABLE employees IS 'Funcionários da sorveteria';
COMMENT ON TABLE customers IS 'Clientes da sorveteria';
COMMENT ON TABLE settings IS 'Configurações do sistema';
