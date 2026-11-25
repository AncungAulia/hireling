// modules/products/components/ProductList.test.tsx: the four states, with the api module mocked.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/apiClient";
import { ProductList } from "./ProductList";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(search),
}));

const getProducts = vi.fn();
vi.mock("../api/products.api", () => ({
  getProducts: (...args: unknown[]) => getProducts(...args),
  deleteProduct: vi.fn(),
}));

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  search = "";
  getProducts.mockReset();
  replace.mockReset();
});

describe("ProductList", () => {
  it("shows loading first", () => {
    getProducts.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<ProductList />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading products");
  });

  it("shows the error and retries", async () => {
    getProducts.mockRejectedValueOnce(new ApiError("unreachable"));
    getProducts.mockResolvedValueOnce([]);
    renderWithQuery(<ProductList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No products yet")).toBeInTheDocument();
  });

  it("offers to clear a filter that matched nothing", async () => {
    search = "category=drinks";
    getProducts.mockResolvedValue([]);
    renderWithQuery(<ProductList />);

    await userEvent.click(await screen.findByRole("button", { name: "Show all" }));
    expect(getProducts).toHaveBeenCalledWith({ category: "drinks" }, expect.anything());
    expect(replace).toHaveBeenCalledWith("/products?", { scroll: false });
  });

  it("renders rows with formatted values", async () => {
    getProducts.mockResolvedValue([
      { id: "1", name: "Tea", category: "drinks", price: 36750, stock: 1200 },
    ]);
    renderWithQuery(<ProductList />);

    expect(await screen.findByText("Tea")).toBeInTheDocument();
    expect(screen.getByText(/36,750/)).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });

  it("shows no-access without a retry", async () => {
    getProducts.mockRejectedValue(new ApiError("forbidden", 403));
    renderWithQuery(<ProductList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No access");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
