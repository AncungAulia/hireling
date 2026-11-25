import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddProductForm } from "./AddProductForm";

const createProduct = vi.fn();
vi.mock("../api/products.api", () => ({
  createProduct: (...args: unknown[]) => createProduct(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddProductForm />
    </QueryClientProvider>,
  );
}

beforeEach(() => createProduct.mockReset());

describe("AddProductForm", () => {
  it("keeps save disabled until something changes", async () => {
    renderForm();
    const save = screen.getByRole("button", { name: "Save product" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name"), "Tea");
    expect(save).toBeEnabled();
  });

  it("requires the number fields instead of sending 0", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Name"), "Tea");
    await userEvent.type(screen.getByLabelText("Category"), "Drinks");
    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    expect(await screen.findByText("Price is required")).toBeInTheDocument();
    expect(screen.getByText("Stock is required")).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("sends typed numbers and shows the saved label", async () => {
    createProduct.mockResolvedValue({
      id: "1",
      name: "Tea",
      category: "Drinks",
      price: 15000,
      stock: 10,
    });
    renderForm();
    await userEvent.type(screen.getByLabelText("Name"), "Tea");
    await userEvent.type(screen.getByLabelText("Category"), "Drinks");
    await userEvent.type(screen.getByLabelText("Price"), "15000");
    await userEvent.type(screen.getByLabelText("Stock"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    expect(await screen.findByRole("button", { name: "Product saved" })).toBeDisabled();
    expect(createProduct.mock.calls[0][0]).toEqual({
      name: "Tea",
      category: "Drinks",
      price: 15000,
      stock: 10,
    });
  });

  it("shows a required error when a field is left empty", async () => {
    renderForm();
    await userEvent.click(screen.getByLabelText("Name"));
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    await userEvent.tab();
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Name"), "T");
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });
});
