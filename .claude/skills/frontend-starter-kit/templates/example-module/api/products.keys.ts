// modules/products/api/products.keys.ts
import type { ProductFilters } from "../schemas/product.schema";

export const productKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) => [...productKeys.all, "list", filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};
