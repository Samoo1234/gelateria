import { useState, useEffect } from 'react';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '../services/ingredientService';

export const useIngredients = () => {
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchIngredients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getIngredients();
            setIngredients(data || []);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching ingredients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngredients();
    }, []);

    const addIngredient = async (ingredientData: any) => {
        try {
            await createIngredient(ingredientData);
            await fetchIngredients();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating ingredient:', err);
            return false;
        }
    };

    const editIngredient = async (id: string, updates: any) => {
        try {
            await updateIngredient(id, updates);
            await fetchIngredients();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error updating ingredient:', err);
            return false;
        }
    };

    const removeIngredient = async (id: string) => {
        try {
            await deleteIngredient(id);
            await fetchIngredients();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error deleting ingredient:', err);
            return false;
        }
    };

    return {
        ingredients,
        loading,
        error,
        refetch: fetchIngredients,
        addIngredient,
        editIngredient,
        removeIngredient
    };
};
