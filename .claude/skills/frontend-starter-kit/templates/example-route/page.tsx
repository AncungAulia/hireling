// src/app/(dashboard)/products/page.tsx: a thin route. It renders the module; a component using
// useSearchParams sits inside <Suspense>.
import { Suspense } from "react";
import { LoadingState } from "@/components/shared/PageStates";
import { AddProductForm, ProductList } from "@/modules/products";

export default function ProductsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6">
      <AddProductForm />
      <Suspense fallback={<LoadingState />}>
        <ProductList />
      </Suspense>
    </main>
  );
}
