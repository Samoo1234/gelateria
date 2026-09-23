-- ============================================================
-- MIGRATION: Módulo de Formulação Técnica de Sorvetes, Açaí e Picolés
-- Database: Supabase PostgreSQL (odcqfmkmfasptnqzypcl)
-- ============================================================

-- 1. Extensões na tabela 'recipes'
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS name VARCHAR(200),
ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(30) DEFAULT 'COMMERCIAL_ASSEMBLY' CHECK (recipe_type IN ('MANUFACTURING', 'COMMERCIAL_ASSEMBLY')),
ADD COLUMN IF NOT EXISTS base_type VARCHAR(20) DEFAULT 'MILK' CHECK (base_type IN ('MILK', 'WATER', 'NEUTRAL')),
ADD COLUMN IF NOT EXISTS target_weight_g DECIMAL(10, 2) DEFAULT 10000,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('DRAFT', 'APPROVED', 'ARCHIVED')),
ADD COLUMN IF NOT EXISTS target_fat_pct DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS target_msnf_pct DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS target_sugar_pct DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS target_total_solids_pct DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS target_pod DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS target_pac DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS calculated_metrics JSONB;

-- 2. Garantir que as 6 fichas existentes permaneçam classificadas como fichas de montagem/venda comercial
UPDATE public.recipes 
SET recipe_type = 'COMMERCIAL_ASSEMBLY' 
WHERE recipe_type IS NULL OR recipe_type = 'COMMERCIAL_ASSEMBLY';

-- 3. Extensões na tabela 'recipe_items'
ALTER TABLE public.recipe_items
ADD COLUMN IF NOT EXISTS is_closing_ingredient BOOLEAN DEFAULT false;

-- 4. Criação da tabela de Perfis Técnicos dos Ingredientes (ingredient_technical_profiles)
CREATE TABLE IF NOT EXISTS public.ingredient_technical_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE UNIQUE,
    water_pct DECIMAL(5, 2) DEFAULT 0.00,
    total_solids_pct DECIMAL(5, 2) DEFAULT 0.00,
    fat_pct DECIMAL(5, 2) DEFAULT 0.00,
    msnf_pct DECIMAL(5, 2) DEFAULT 0.00, -- Extrato Seco Desengordurado do Leite (ESDL)
    lactose_pct DECIMAL(5, 2) DEFAULT 0.00,
    sucrose_pct DECIMAL(5, 2) DEFAULT 0.00,
    other_sugars_pct DECIMAL(5, 2) DEFAULT 0.00,
    pod_factor DECIMAL(6, 3) DEFAULT 0.000, -- Poder Edulcorante relativo à Sacarose (Sacarose = 1.000)
    pac_factor DECIMAL(6, 3) DEFAULT 0.000, -- Poder Anticongelante relativo à Sacarose (Sacarose = 1.000)
    density_g_ml DECIMAL(6, 3) DEFAULT 1.000, -- Densidade para conversão rigorosa de L/ml em g
    is_mix_ingredient BOOLEAN DEFAULT true, -- False para descartáveis/embalagens (casquinha, copo, colher)
    data_status VARCHAR(20) DEFAULT 'ESTIMATED' CHECK (data_status IN ('CONFIRMED', 'ESTIMATED', 'MISSING')),
    source VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ingredient_technical_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ingredient_technical_profiles' AND policyname = 'Allow read access to everyone'
    ) THEN
        CREATE POLICY "Allow read access to everyone" 
        ON public.ingredient_technical_profiles 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ingredient_technical_profiles' AND policyname = 'Allow write access to authenticated users'
    ) THEN
        CREATE POLICY "Allow write access to authenticated users" 
        ON public.ingredient_technical_profiles 
        FOR ALL 
        USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
    END IF;
END $$;

-- 5. Atualização atômica da RPC complete_production_batch corrigindo o yield e consumo
CREATE OR REPLACE FUNCTION public.complete_production_batch(
    p_batch_id UUID,
    p_produced_quantity NUMERIC,
    p_loss_quantity NUMERIC,
    p_employee_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch RECORD;
    v_recipe RECORD;
    v_item RECORD;
    v_ratio NUMERIC;
    v_consumed_qty NUMERIC(10, 3);
    v_yield NUMERIC;
    v_item_cost NUMERIC(10, 2);
    v_total_actual_cost NUMERIC(10, 2) := 0;
BEGIN
    SELECT * INTO v_batch FROM public.production_batches WHERE id = p_batch_id;
    IF v_batch.id IS NULL THEN
        RAISE EXCEPTION 'Lote % não encontrado.', p_batch_id;
    END IF;

    IF v_batch.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Este lote já foi concluído anteriormente.';
    END IF;

    SELECT * INTO v_recipe FROM public.recipes WHERE id = v_batch.recipe_id;
    IF v_recipe.id IS NULL THEN
        RAISE EXCEPTION 'Receita vinculada ao lote não encontrada.';
    END IF;

    -- Obter o rendimento padrão da receita em kg (ou unidades), usando 'yield'
    v_yield := GREATEST(COALESCE(v_recipe.yield::NUMERIC, 1.0), 0.001);

    -- Proporção de escala baseada no produzido + perdas em relação ao rendimento base
    v_ratio := (p_produced_quantity + COALESCE(p_loss_quantity, 0)) / v_yield;

    -- Consumo atômico dos ingredientes da receita
    FOR v_item IN 
        SELECT ri.*, COALESCE(itp.is_mix_ingredient, true) as is_mix, ing.cost_per_unit
        FROM public.recipe_items ri
        JOIN public.ingredients ing ON ing.id = ri.ingredient_id
        LEFT JOIN public.ingredient_technical_profiles itp ON itp.ingredient_id = ri.ingredient_id
        WHERE ri.recipe_id = v_recipe.id
    LOOP
        v_consumed_qty := ROUND(v_item.quantity * v_ratio, 3);
        v_item_cost := ROUND(v_consumed_qty * v_item.cost_per_unit, 2);
        v_total_actual_cost := v_total_actual_cost + v_item_cost;

        -- Decrementa estoque do ingrediente
        UPDATE public.ingredients
        SET current_stock = GREATEST(0.0, current_stock - v_consumed_qty),
            last_updated = NOW()
        WHERE id = v_item.ingredient_id;

        -- Registra movimentação de saída rastreável
        INSERT INTO public.inventory_movements (
            ingredient_id,
            movement_type,
            quantity,
            unit,
            reason,
            employee_id,
            notes
        ) VALUES (
            v_item.ingredient_id,
            'OUT',
            v_consumed_qty,
            v_item.unit,
            'PRODUCTION',
            p_employee_id,
            'Consumo no lote ' || v_batch.batch_code
        );
    END LOOP;

    -- Se houver perda no processo de produção, registrar com rastreabilidade
    IF COALESCE(p_loss_quantity, 0) > 0 THEN
        INSERT INTO public.stock_losses (
            product_id,
            batch_id,
            employee_id,
            loss_type,
            quantity,
            unit,
            reason
        ) VALUES (
            v_batch.product_id,
            p_batch_id,
            p_employee_id,
            'PRODUCTION_ERROR',
            p_loss_quantity,
            'kg',
            COALESCE(p_notes, 'Perda registrada na conclusão do lote')
        );
    END IF;

    -- Atualizar lote para COMPLETED, fixando o custo histórico real consumido
    UPDATE public.production_batches
    SET status = 'COMPLETED',
        produced_quantity = p_produced_quantity,
        loss_quantity = COALESCE(p_loss_quantity, 0),
        actual_cost = v_total_actual_cost,
        completed_at = NOW(),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_batch_id;

    -- Auditoria
    INSERT INTO public.audit_logs (
        employee_id,
        action,
        entity,
        entity_id,
        details
    ) VALUES (
        p_employee_id,
        'PRODUCTION_COMPLETE',
        'production_batches',
        p_batch_id::TEXT,
        jsonb_build_object(
            'batch_code', v_batch.batch_code,
            'produced_quantity', p_produced_quantity,
            'loss_quantity', p_loss_quantity,
            'actual_cost', v_total_actual_cost
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'batch_code', v_batch.batch_code,
        'produced_quantity', p_produced_quantity,
        'loss_quantity', p_loss_quantity,
        'actual_cost', v_total_actual_cost,
        'status', 'COMPLETED'
    );
END;
$$;
