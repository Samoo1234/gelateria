import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useIngredients } from '../hooks/useIngredients';

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: any, items: any[]) => Promise<boolean>;
    initialData?: any;
}

interface RecipeItem {
    ingredient_id: string;
    ingredient_name: string;
    quantity: number;
    unit: string;
    cost: number;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { products } = useProducts();
    const { ingredients } = useIngredients();

    const [productId, setProductId] = useState('');
    const [prepTime, setPrepTime] = useState(5);
    const [recipeYield, setRecipeYield] = useState(1);
    const [items, setItems] = useState<RecipeItem[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setProductId(initialData.product_id || '');
            setPrepTime(initialData.prep_time || 5);
            setRecipeYield(initialData.yield || 1);
            setItems(initialData.items || []);
        }
    }, [initialData]);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const addIngredient = () => {
        if (!selectedIngredient || quantity <= 0) {
            alert('Selecione um ingrediente e quantidade válida');
            return;
        }

        const ingredient = ingredients.find((i: any) => i.id === selectedIngredient);
        if (!ingredient) return;

        const cost = quantity * ingredient.cost_per_unit;

        const newItem: RecipeItem = {
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            quantity,
            unit: ingredient.unit,
            cost
        };

        setItems([...items, newItem]);
        setSelectedIngredient('');
        setQuantity(0);
    };

    const removeIngredient = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

    const handleSave = async () => {
        if (!productId) {
            alert('Selecione um produto');
            return;
        }

        if (items.length === 0) {
            alert('Adicione pelo menos um ingrediente');
            return;
        }

        setSaving(true);

        const recipeData = {
            product_id: productId,
            prep_time: prepTime,
            yield: recipeYield,
        };

        const recipeItems = items.map(item => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            unit: item.unit
        }));

        const success = await onSave(recipeData, recipeItems);

        setSaving(false);

        if (success) {
            // Reset form
            setProductId('');
            setPrepTime(5);
            setRecipeYield(1);
            setItems([]);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {initialData ? 'Editar Receita' : 'Nova Receita'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Product Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Produto *
                        </label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        >
                            <option value="">Selecione um produto</option>
                            {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} - {formatCurrency(product.price)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Prep Time and Yield */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Tempo de Preparo (min)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={prepTime}
                                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Rendimento (unidades)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={recipeYield}
                                onChange={(e) => setRecipeYield(parseInt(e.target.value) || 1)}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Add Ingredient */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Adicionar Ingrediente
                        </label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={selectedIngredient}
                                onChange={(e) => setSelectedIngredient(e.target.value)}
                            >
                                <option value="">Selecione um ingrediente</option>
                                {ingredients.map((ingredient: any) => (
                                    <option key={ingredient.id} value={ingredient.id}>
                                        {ingredient.name} ({ingredient.unit}) - {formatCurrency(ingredient.cost_per_unit)}/{ingredient.unit}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.001"
                                className="w-32 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Qtd"
                                value={quantity || ''}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            />
                            <button
                                onClick={addIngredient}
                                className="px-4 py-2 bg-primary text-gray-900 dark:text-black rounded-lg hover:opacity-90 transition-opacity font-semibold"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>

                    {/* Ingredients List */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Ingredientes ({items.length})
                            </h3>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                Total: {formatCurrency(totalCost)}
                            </span>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10">
                                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">restaurant</span>
                                <p className="text-gray-500 dark:text-gray-400">Nenhum ingrediente adicionado</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-primary/20 text-gray-900 dark:text-white rounded-full text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {item.ingredient_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {item.quantity} {item.unit}
                                            </span>
                                            <span className="text-gray-900 dark:text-white font-semibold min-w-[80px] text-right">
                                                {formatCurrency(item.cost)}
                                            </span>
                                            <button
                                                onClick={() => removeIngredient(index)}
                                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-semibold"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-gray-900 dark:text-black rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar Receita'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeModal;
