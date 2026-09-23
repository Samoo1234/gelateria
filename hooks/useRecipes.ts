import { useState, useEffect } from 'react';
import {
    getRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    createManufacturingFormula
} from '../services/recipeService';

export const useRecipes = (initialFilter: 'MANUFACTURING' | 'COMMERCIAL_ASSEMBLY' | 'ALL' = 'ALL') => {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [filter, setFilter] = useState<'MANUFACTURING' | 'COMMERCIAL_ASSEMBLY' | 'ALL'>(initialFilter);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRecipes = async (typeFilter = filter) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getRecipes(typeFilter);
            setRecipes(data || []);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes(filter);
    }, [filter]);

    const addRecipe = async (recipeData: any, items: any[]) => {
        try {
            await createRecipe(recipeData, items);
            await fetchRecipes(filter);
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating recipe:', err);
            return false;
        }
    };

    const addManufacturingFormulaAction = async (params: any) => {
        try {
            await createManufacturingFormula(params);
            await fetchRecipes(filter);
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating manufacturing formula:', err);
            return false;
        }
    };

    const editRecipe = async (id: string, updates: any) => {
        try {
            await updateRecipe(id, updates);
            await fetchRecipes(filter);
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
            await fetchRecipes(filter);
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
        filter,
        setFilter,
        refetch: () => fetchRecipes(filter),
        addRecipe,
        addManufacturingFormula: addManufacturingFormulaAction,
        editRecipe,
        removeRecipe
    };
};
