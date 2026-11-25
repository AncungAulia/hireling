// modules/products/components/DeleteProductButton.tsx: an irreversible action behind ConfirmDialog.
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDeleteProductMutation } from "../api/useProducts";
import type { Product } from "../schemas/product.schema";

export function DeleteProductButton({ product }: { product: Pick<Product, "id" | "name"> }) {
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProductMutation();

  function handleConfirm() {
    deleteProduct.mutate(product.id, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${product.name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete product ${product.name}?`}
        description="This product will be removed from the list and can't be restored."
        confirmLabel="Delete product"
        destructive
        pending={deleteProduct.isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
