import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "./NumberInput";

function Harness({ decimals = 0, initial = null }: { decimals?: number; initial?: number | null }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <NumberInput
        aria-label="Amount"
        value={value}
        onValueChange={setValue}
        decimals={decimals}
        prefix="$"
      />
      <output>{value === null ? "empty" : String(value)}</output>
    </>
  );
}

describe("NumberInput", () => {
  it("groups thousands while typing and stores the raw number", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText("Amount"), "1250000");
    expect(screen.getByLabelText("Amount")).toHaveValue("1,250,000");
    expect(screen.getByRole("status")).toHaveTextContent("1250000");
  });

  it("drops leading zeros and stays empty when cleared", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Amount");
    await userEvent.type(input, "007");
    expect(input).toHaveValue("7");
    await userEvent.clear(input);
    expect(input).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("empty");
  });

  it("keeps decimals up to the limit", async () => {
    render(<Harness decimals={2} />);
    await userEvent.type(screen.getByLabelText("Amount"), "12.345");
    expect(screen.getByLabelText("Amount")).toHaveValue("12.34");
    expect(screen.getByRole("status")).toHaveTextContent("12.34");
  });

  it("shows the prefix inside the field and follows outside values", () => {
    render(<Harness initial={36750} />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue("36,750");
  });
});
