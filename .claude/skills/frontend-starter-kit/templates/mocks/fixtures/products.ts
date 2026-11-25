// src/mocks/fixtures/products.ts: example data for mock mode and tests. App code never imports this.
// Parsed through the real schema, so a fixture can never have a shape the API would not return.
import { z } from "zod";
import { productSchema } from "@/modules/products/schemas/product.schema";

export const productFixtures = z.array(productSchema).parse([
  { id: "p-1", name: "Jasmine Tea", category: "Drinks", price: 36750, stock: 1200 },
  { id: "p-2", name: "Robusta Coffee", category: "Drinks", price: 58000, stock: 340 },
  { id: "p-3", name: "Cane Sugar", category: "Staples", price: 17500, stock: 0 },
]);
