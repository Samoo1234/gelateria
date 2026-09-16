import { useState, useEffect } from 'react';
import { getProductsWithCost, createProduct, updateProduct, deleteProduct } from '../services/productService';

export const useProducts = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProductsWithCost();
            setProducts(data || []);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addProduct = async (productData: any) => {
        try {
            await createProduct(productData);
            await fetchProducts();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating product:', err);
            return false;
        }
    };

    const editProduct = async (id: string, updates: any) => {
        try {
            await updateProduct(id, updates);
            await fetchProducts();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error updating product:', err);
            return false;
        }
    };

    const removeProduct = async (id: string) => {
        try {
            await deleteProduct(id);
            await fetchProducts();
            return true;
        } catch (err) {
            setError(err as Error);
            console.error('Error deleting product:', err);
            return false;
        }
    };

    return {
        products,
        loading,
        error,
        refetch: fetchProducts,
        addProduct,
        editProduct,
        removeProduct
    };
};
