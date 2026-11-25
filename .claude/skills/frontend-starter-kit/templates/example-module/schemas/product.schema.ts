// modules/products/schemas/product.schema.ts: one source of truth for shapes and types.
import { z } from "zod";
import { requiredNumber } from "@/lib/schemas";

/** What the API returns. */
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number().int(),
});
export type Product = z.infer<typeof productSchema>;

/** What the add-product form sends. Number fields start empty (null) and must be filled. */
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  price: requiredNumber("Price is required").pipe(z.number().min(0, "Price can't be negative")),
  stock: requiredNumber("Stock is required").pipe(
    z.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  ),
});
export type ProductFormValues = z.input<typeof productInputSchema>;
export type ProductInput = z.output<typeof productInputSchema>;

/** Filters live in the URL; this is their typed form. */
export type ProductFilters = { category?: string };
