// lib/services/productService.ts
import { databases } from "@/lib/config/appwrite";
import { Query } from "appwrite";
import {
  Product,
  CreateProductData,
  UpdateProductData,
} from "@/lib/types/product";

const DATABASE_ID = "693818e8000bdb7d6add";
const COLLECTION_ID = "products";

/**
 * Fetches all products from the database, ordered by creation date (newest first)
 */
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.orderDesc("$createdAt")]
    );
    return response.documents as unknown as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
};

/**
 * Creates a new product in the database
 */
export const createProduct = async (data: CreateProductData): Promise<Product> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      "unique()",
      {
        name: data.name,
        category: data.category,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        quantity: data.quantity,
      }
    );
    return response as unknown as Product;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product");
  }
};

/**
 * Updates an existing product in the database
 */
export const updateProduct = async (
  productId: string,
  data: UpdateProductData
): Promise<Product> => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      productId,
      {
        name: data.name,
        category: data.category,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        quantity: data.quantity,
      }
    );
    return response as unknown as Product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
  }
};

/**
 * Deletes a product from the database
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
};
