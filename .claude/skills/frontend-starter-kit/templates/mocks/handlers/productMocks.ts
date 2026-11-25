// src/mocks/handlers/productMocks.ts: mock endpoints of the products module.
// Delete a handler as soon as the backend serves that endpoint; the rest keep working.
import type MockAdapter from "axios-mock-adapter";
import { productInputSchema, type Product } from "@/modules/products/schemas/product.schema";
import { productFixtures } from "../fixtures/products";
import { parseBody, pathParam } from "../mockUtils";

const PRODUCT_PATH = /^\/products\/([^/]+)$/;

export function registerProductMocks(mock: MockAdapter) {
  // In-memory copy: changes last until the page reloads.
  let products: Product[] = [...productFixtures];

  mock.onGet("/products").reply((config) => {
    const category: string | undefined = config.params?.category;
    return [200, category ? products.filter((p) => p.category === category) : products];
  });

  mock.onGet(PRODUCT_PATH).reply((config) => {
    const id = pathParam(PRODUCT_PATH, config);
    const product = products.find((p) => p.id === id);
    return product ? [200, product] : [404, { message: "Product not found" }];
  });

  mock.onPost("/products").reply((config) => {
    const body = parseBody(productInputSchema, config);
    if (!body.ok) return body.reply;
    const product: Product = { id: crypto.randomUUID(), ...body.data };
    products = [...products, product];
    return [201, product];
  });

  mock.onDelete(PRODUCT_PATH).reply((config) => {
    const id = pathParam(PRODUCT_PATH, config);
    if (!products.some((p) => p.id === id)) return [404, { message: "Product not found" }];
    products = products.filter((p) => p.id !== id);
    return [204];
  });
}
