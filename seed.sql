-- ============================================================
-- SEED DATA - SORVETERIA GELATO MANAGER
-- Dados de exemplo baseados nos dados mock do sistema
-- ============================================================

-- Limpar dados existentes (cuidado em produção!)
-- DELETE FROM recipe_items;
-- DELETE FROM recipes;
-- DELETE FROM products;
-- DELETE FROM ingredients;
-- DELETE FROM categories;
-- DELETE FROM ingredient_categories;

-- ============================================================
-- CATEGORIAS DE PRODUTOS
-- ============================================================

-- Variáveis para armazenar UUIDs
DO $$
DECLARE
    -- Category IDs
    cat_casquinha_id UUID;
    cat_acai_id UUID;
    
    -- Ingredient Category IDs
    cat_laticinios_id UUID;
    cat_frutas_id UUID;
    cat_secos_id UUID;
    cat_quimicos_id UUID;
    cat_embalagens_id UUID;
    
    -- Product IDs
    prod_chocolate_id UUID;
    prod_morango_id UUID;
    prod_creme_id UUID;
    prod_flocos_id UUID;
    prod_pistache_id UUID;
    prod_doce_leite_id UUID;
    prod_menta_id UUID;
    prod_limao_id UUID;
    prod_acai_300_id UUID;
    prod_acai_500_id UUID;
    
    -- Ingredient IDs
    ing_leite_id UUID;
    ing_creme_id UUID;
    ing_condensado_id UUID;
    ing_morango_id UUID;
    ing_limao_id UUID;
    ing_acai_id UUID;
    ing_acucar_id UUID;
    ing_chocolate_id UUID;
    ing_cacau_id UUID;
    ing_pistache_id UUID;
    ing_flocos_id UUID;
    ing_baunilha_id UUID;
    ing_menta_id UUID;
    ing_emulsificante_id UUID;
    ing_estabilizante_id UUID;
    ing_casquinha_id UUID;
    ing_copo300_id UUID;
    ing_copo500_id UUID;
    ing_colher_id UUID;
    
    -- Recipe IDs
    rec_chocolate_id UUID;
    rec_morango_id UUID;
    rec_creme_id UUID;
    rec_pistache_id UUID;
    rec_acai300_id UUID;
    rec_acai500_id UUID;
    
BEGIN
    -- ============================================================
    -- GET CATEGORY IDs
    -- ============================================================
    SELECT id INTO cat_casquinha_id FROM categories WHERE name = 'Casquinha';
    SELECT id INTO cat_acai_id FROM categories WHERE name = 'Açaí';
    
    SELECT id INTO cat_laticinios_id FROM ingredient_categories WHERE name = 'Laticínios';
    SELECT id INTO cat_frutas_id FROM ingredient_categories WHERE name = 'Frutas/Polpas';
    SELECT id INTO cat_secos_id FROM ingredient_categories WHERE name = 'Secos';
    SELECT id INTO cat_quimicos_id FROM ingredient_categories WHERE name = 'Químicos';
    SELECT id INTO cat_embalagens_id FROM ingredient_categories WHERE name = 'Embalagens';
    
    -- ============================================================
    -- PRODUTOS
    -- ============================================================
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Chocolate', cat_casquinha_id, 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg0S42gjv_ihRfsQxQDIbE8_qMUqo5EUQHkpdbc1XxsnenutvynZD8dyX6C6bM_z9YyVQb4UeP5NtOTg15wCCAjMOA9qx99fMcSKBtmQfJe75p8rGyFhZbgC6dfBPZqtUwvyhv4ao7p-WfaZfWMIPNC3mEl934YsR_ZqqhHZ5cndbsS07M7Qr-Kd3pro93DnbYZs5Ls2grD_JJkmD96LufazoFxnX-4FsPLAI06M4GxEp_FbOZ5fGBZlW0rXYURFPAyHygb3JA0Bc')
    RETURNING id INTO prod_chocolate_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Morango', cat_casquinha_id, 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVhvhETRkoMpZ8ZMvZiZCd7h0PdMdSXR1wkwViYL2HSkycLlyJF1kY0Gq6jGqofT2ySO9NOKohM00YdBBztihZyYKhcFXFSfWsNMSli9oIUsihKrcS-ueP6pECly4D62Lf2RqJhw2A0642AaAdLn7D3DQSMyFWwZbqsDYvAZb-d4d66sDYRnAZ3tXhByLxYFSqbDCtXaZ65FC49csl-yoHz7RnN2G07jX-pgwDzEZHLDDFmblKpx_JNX0jejUxMx43W71oGrUegqE')
    RETURNING id INTO prod_morango_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Creme', cat_casquinha_id, 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz2EwyP9dAq39XxZEPeJN5sMgf5DqivvahzdyvibAmoAd-ZnVzMRJoAo3MJ4xfGHH8F1eBSFksxrRF2o1BwwqpdtPP6YmgtU3lTRN5Bu98E_gMDJ4yYrZ6-7y1hPFJNR48fHVupVzNIPJWrjui6Rhq7KpSzYia1h36MmMrIULyODqGjioSxiNvZJPMVU3PfdR0FsXnazN0J6aWla0C1fO9W97ym1X_hsCgcprg1JL8mPeq5eqSxV5wpxWRc-X2_MxpKx_pfCwyQVU')
    RETURNING id INTO prod_creme_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Flocos', cat_casquinha_id, 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKKcySIVwsoo2QLK5U3avRlQx1Id6yQ0ENiS15RzPEgVYFE_rGIPUo0L1PCYVGf73wWwu7p-k2mF4drhzfS_-ADonYCx969TNMz5KtndGdKbpD2uXDfda1AONeIS9vkG3EKO4EM7_nv4uaQoM7wSnHhDQQn-Qr9_M1EIVIdffihYabnx9nBdnSNEr2PSNPXgpq7M4bxEXIL-YcfPHCaa1jcScAdluQDwaxOG-G6lyTxx36xlbSsGvCTScyiW5gG-K0SZS9luy8FuM')
    RETURNING id INTO prod_flocos_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Pistache', cat_casquinha_id, 6.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNzDGeuGOLVE2WpgwVFAP9RJ5TfsL0lZcpLLvWhAF0NrHJJqsYutntwZebRIvCmjnr_e6aSjDXQt-EOd1WXciCQDKdZTnn-eFmHjTOKbukuvYzHoOw4_9I12gh-b8_xmGJpzLF8hazn3nOql4gGSbUf4VAc9gsxULqaAJUm7ENJj5HV0Boj_bl_VyM8TsfL9D1LFzl_VXp18WUtaTJYfbN0ECrh9xvmHVHrlp-BxAx9x6CukYV3ARbZ-VpYjcvI1-cmjzAYgxvL8U')
    RETURNING id INTO prod_pistache_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Doce de Leite', cat_casquinha_id, 6.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRjOZuRf3MqKvX4hEPjFerhBMZx9e8TcKvJtWtVV0Pvd2_3fbRnN2Hdf1jj1hr1S9FJC0WABCGd0nFQHOX6qhauD22FWsLYlI2SlRUJmkNWIFB6C_0lXUM5qWAjV6dhbZ6UoglEDl0bmxiEI6Kdmbef9odAvDsNA03kf7678w1Z4G_Bg_C2j5Dds75mmR4De4JTA6S8AI4I6Xy8iFZKki0wQMyE4fGWIkzzB0QEzkFDopHo_0jqwOP07LQQwc4EvIrN9M5L9MiCns')
    RETURNING id INTO prod_doce_leite_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Menta', cat_casquinha_id, 6.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsBo5vqCeDnANjJGBWj-9-2o3GzsZCkMjogYFnCs8dmqzMiGTbTt3AkRo2y0VFJmVtk7tfN7bkB4LQjjkzvzEJW9hVmNAuqyL-FEOeBYbVdv-aMt_bOAWq2EN9n4edLhq2ZYFbA11QVPuyQUrrASg2sKK-yvRHe_oBysX6Ho3smlAWgHby_n7VYtHGhF6j08sGV7cyT38LQMEUSPgizK70fiqQYZaGo2bnDWI2FUI4sUUnvl_IyvyK-0JJdKXveRN3bHHi6rJRzCY')
    RETURNING id INTO prod_menta_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Limão', cat_casquinha_id, 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBu6uaUY4s1zmAhKdJ0C-yOnSJTMP0lBNDnjuQshYuqGIIyWB6TiGWnHwsG1Jkjuc7quGfZbyCDXJcQ60PhowA3JyzR81HNxevX2YvmIeGq4O5JItixt_CumMl5AHwzM5n0CwjikAIQWAVCxQBg5XFWl0F68Esa8H-YZp8ftMf338ptSzPrsK_ow0E7-rd9Q-ZwA1UhF02eBq4Gq3-lCEsCbRiVlW29Unkbeh1f5xNq2wStvVGMs3Hi9C4x1bk31ANrkKZ8p5Guts0')
    RETURNING id INTO prod_limao_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Açaí 300ml', cat_acai_id, 12.00, 'https://picsum.photos/200/200?random=9')
    RETURNING id INTO prod_acai_300_id;
    
    INSERT INTO products (name, category_id, price, image_url) VALUES
    ('Açaí 500ml', cat_acai_id, 18.00, 'https://picsum.photos/200/200?random=10')
    RETURNING id INTO prod_acai_500_id;
    
    -- ============================================================
    -- INGREDIENTES
    -- ============================================================
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Leite Integral', cat_laticinios_id, 'L', 5.00, 50, 10) RETURNING id INTO ing_leite_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Creme de Leite', cat_laticinios_id, 'L', 8.50, 20, 5) RETURNING id INTO ing_creme_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Leite Condensado', cat_laticinios_id, 'kg', 12.00, 15, 5) RETURNING id INTO ing_condensado_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Polpa de Morango', cat_frutas_id, 'kg', 18.00, 5, 3) RETURNING id INTO ing_morango_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Polpa de Limão', cat_frutas_id, 'kg', 15.00, 8, 3) RETURNING id INTO ing_limao_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Polpa de Açaí', cat_frutas_id, 'kg', 25.00, 12, 5) RETURNING id INTO ing_acai_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Açúcar Refinado', cat_secos_id, 'kg', 4.50, 15, 10) RETURNING id INTO ing_acucar_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Chocolate em Pó 50%', cat_secos_id, 'kg', 35.00, 35, 5) RETURNING id INTO ing_chocolate_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Cacau em Pó', cat_secos_id, 'kg', 45.00, 10, 3) RETURNING id INTO ing_cacau_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Pasta de Pistache', cat_secos_id, 'kg', 120.00, 5, 2) RETURNING id INTO ing_pistache_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Flocos de Arroz', cat_secos_id, 'kg', 18.00, 20, 5) RETURNING id INTO ing_flocos_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Essência de Baunilha', cat_secos_id, 'ml', 0.80, 500, 100) RETURNING id INTO ing_baunilha_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Essência de Menta', cat_secos_id, 'ml', 0.60, 400, 100) RETURNING id INTO ing_menta_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Emulsificante', cat_quimicos_id, 'kg', 28.00, 8, 3) RETURNING id INTO ing_emulsificante_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Estabilizante', cat_quimicos_id, 'kg', 32.00, 10, 3) RETURNING id INTO ing_estabilizante_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Casquinha Pequena', cat_embalagens_id, 'un', 0.35, 500, 100) RETURNING id INTO ing_casquinha_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Copo 300ml', cat_embalagens_id, 'un', 0.25, 300, 100) RETURNING id INTO ing_copo300_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Copo 500ml', cat_embalagens_id, 'un', 0.40, 200, 50) RETURNING id INTO ing_copo500_id;
    
    INSERT INTO ingredients (name, category_id, unit, cost_per_unit, current_stock, min_stock) VALUES
    ('Colher Descartável', cat_embalagens_id, 'un', 0.05, 1000, 200) RETURNING id INTO ing_colher_id;
    
    -- ============================================================
    -- RECEITAS
    -- ============================================================
    
    -- Receita: Chocolate
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_chocolate_id, 1, 5) RETURNING id INTO rec_chocolate_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_chocolate_id, ing_leite_id, 0.1, 'L', 1),
    (rec_chocolate_id, ing_chocolate_id, 0.05, 'kg', 2),
    (rec_chocolate_id, ing_acucar_id, 0.03, 'kg', 3),
    (rec_chocolate_id, ing_emulsificante_id, 0.01, 'kg', 4),
    (rec_chocolate_id, ing_casquinha_id, 1, 'un', 5);
    
    -- Receita: Morango
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_morango_id, 1, 5) RETURNING id INTO rec_morango_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_morango_id, ing_leite_id, 0.08, 'L', 1),
    (rec_morango_id, ing_morango_id, 0.06, 'kg', 2),
    (rec_morango_id, ing_acucar_id, 0.03, 'kg', 3),
    (rec_morango_id, ing_emulsificante_id, 0.01, 'kg', 4),
    (rec_morango_id, ing_casquinha_id, 1, 'un', 5);
    
    -- Receita: Creme
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_creme_id, 1, 5) RETURNING id INTO rec_creme_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_creme_id, ing_leite_id, 0.08, 'L', 1),
    (rec_creme_id, ing_creme_id, 0.04, 'L', 2),
    (rec_creme_id, ing_acucar_id, 0.03, 'kg', 3),
    (rec_creme_id, ing_baunilha_id, 2, 'ml', 4),
    (rec_creme_id, ing_emulsificante_id, 0.01, 'kg', 5),
    (rec_creme_id, ing_casquinha_id, 1, 'un', 6);
    
    -- Receita: Pistache
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_pistache_id, 1, 6) RETURNING id INTO rec_pistache_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_pistache_id, ing_leite_id, 0.08, 'L', 1),
    (rec_pistache_id, ing_pistache_id, 0.03, 'kg', 2),
    (rec_pistache_id, ing_acucar_id, 0.025, 'kg', 3),
    (rec_pistache_id, ing_emulsificante_id, 0.01, 'kg', 4),
    (rec_pistache_id, ing_casquinha_id, 1, 'un', 5);
    
    -- Receita: Açaí 300ml
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_acai_300_id, 1, 3) RETURNING id INTO rec_acai300_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_acai300_id, ing_acai_id, 0.28, 'kg', 1),
    (rec_acai300_id, ing_acucar_id, 0.02, 'kg', 2),
    (rec_acai300_id, ing_estabilizante_id, 0.005, 'kg', 3),
    (rec_acai300_id, ing_copo300_id, 1, 'un', 4),
    (rec_acai300_id, ing_colher_id, 1, 'un', 5);
    
    -- Receita: Açaí 500ml
    INSERT INTO recipes (product_id, yield, prep_time) VALUES
    (prod_acai_500_id, 1, 3) RETURNING id INTO rec_acai500_id;
    
    INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, display_order) VALUES
    (rec_acai500_id, ing_acai_id, 0.46, 'kg', 1),
    (rec_acai500_id, ing_acucar_id, 0.03, 'kg', 2),
    (rec_acai500_id, ing_estabilizante_id, 0.008, 'kg', 3),
    (rec_acai500_id, ing_copo500_id, 1, 'un', 4),
    (rec_acai500_id, ing_colher_id, 1, 'un', 5);
    
    RAISE NOTICE 'Seed data inserido com sucesso! Total: % produtos, % ingredientes, % receitas', 10, 19, 6;
    
END $$;
