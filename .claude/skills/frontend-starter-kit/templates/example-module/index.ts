// modules/products/index.ts: the public surface. Code outside the feature imports only from here.
export { ProductList } from "./components/ProductList";
export { AddProductForm } from "./components/AddProductForm";
export { useProductQuery, useProductsQuery } from "./api/useProducts";
export type { Product, ProductFilters } from "./schemas/product.schema";
