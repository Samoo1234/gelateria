import { useState, useEffect } from 'react';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../services/recipeService';

export const useRecipes = () => {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRecipes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getRecipes();
            setRecipes(data || []);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const addRecipe = async (recipeData: any, items: any[]) => {
        try {
            await createRecipe(recipeData, items);
            await fetchRecipes();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating recipe:', err);
            return false;
        }
    };

    const editRecipe = async (id: string, updates: any) => {
        try {
            await updateRecipe(id, updates);
            await fetchRecipes();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error updating recipe:', err);
            return false;
        }
    };

    const removeRecipe = async (id: string) => {
        try {
            await deleteRecipe(id);
            await fetchRecipes();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error deleting recipe:', err);
            return false;
        }
    };

    return {
        recipes,
        loading,
        error,
        refetch: fetchRecipes,
        addRecipe,
        editRecipe,
        removeRecipe
    };
};
