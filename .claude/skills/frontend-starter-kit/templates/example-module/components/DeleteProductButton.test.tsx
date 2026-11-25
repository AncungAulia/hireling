import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeleteProductButton } from "./DeleteProductButton";

const deleteProduct = vi.fn();
vi.mock("../api/products.api", () => ({
  deleteProduct: (...args: unknown[]) => deleteProduct(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderButton() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DeleteProductButton product={{ id: "p1", name: "Tea" }} />
    </QueryClientProvider>,
  );
}

beforeEach(() => deleteProduct.mockReset());

describe("DeleteProductButton", () => {
  it("asks for confirmation before deleting", async () => {
    deleteProduct.mockResolvedValue(undefined);
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: "Delete Tea" }));
    expect(await screen.findByText("Delete product Tea?")).toBeInTheDocument();
    expect(deleteProduct).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith("p1", expect.anything()));
  });

  it("does nothing when cancelled", async () => {
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Delete Tea" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(deleteProduct).not.toHaveBeenCalled();
  });
});
