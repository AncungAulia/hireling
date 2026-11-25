// modules/products/api/useProducts.ts: the only way components reach product data.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createProduct, deleteProduct, getProduct, getProducts } from "./products.api";
import { productKeys } from "./products.keys";
import type { ProductFilters } from "../schemas/product.schema";

export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }) => getProducts(filters, signal),
  });
}

export function useProductQuery(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success("Product saved");
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted");
      return queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}
