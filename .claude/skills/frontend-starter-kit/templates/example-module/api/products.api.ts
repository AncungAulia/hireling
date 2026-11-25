// modules/products/api/products.api.ts: HTTP calls only; responses are validated.
import { z } from "zod";
import { apiClient, parseResponse } from "@/lib/apiClient";
import {
  productSchema,
  type Product,
  type ProductFilters,
  type ProductInput,
} from "../schemas/product.schema";

export async function getProducts(
  filters: ProductFilters,
  signal?: AbortSignal,
): Promise<Product[]> {
  const { data } = await apiClient.get("/products", { params: filters, signal });
  return parseResponse(z.array(productSchema), data);
}

export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const { data } = await apiClient.get(`/products/${encodeURIComponent(id)}`, { signal });
  return parseResponse(productSchema, data);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await apiClient.post("/products", input);
  return parseResponse(productSchema, data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${encodeURIComponent(id)}`);
}
