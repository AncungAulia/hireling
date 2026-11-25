// modules/products/components/ProductList.tsx: filter from the URL, four honest states.
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/PageStates";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useProductsQuery } from "../api/useProducts";
import { DeleteProductButton } from "./DeleteProductButton";

export function ProductList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = params.get("category") ?? undefined;

  const query = useProductsQuery({ category });

  function handleClearFilter() {
    const next = new URLSearchParams(params);
    next.delete("category");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  if (query.isPending) return <LoadingState label="Loading products…" />;

  if (query.isError) {
    return (
      <ErrorState title="Couldn't load products" error={query.error} onRetry={() => query.refetch()} />
    );
  }

  if (query.data.length === 0) {
    return category ? (
      <EmptyState
        title={`No products in the "${category}" category`}
        action={
          <Button variant="outline" size="sm" onClick={handleClearFilter}>
            Show all
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No products yet"
        description="Products you add will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="w-12 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {query.data.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(product.price)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(product.stock)}</TableCell>
            <TableCell className="text-right">
              <DeleteProductButton product={product} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
