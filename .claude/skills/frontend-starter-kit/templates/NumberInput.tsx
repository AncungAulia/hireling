// src/components/shared/NumberInput.tsx: the one input for every formatted number
// (money, plain numbers, percentages, quantities). Shows "1,250,000" while typing, stores 1250000,
// keeps prefix/suffix inside the field, drops leading zeros, and stays empty (null) when cleared.
"use client";

import { useState, type ComponentProps } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { LOCALE } from "@/lib/format";

const parts = new Intl.NumberFormat(LOCALE).formatToParts(1234.5);
const DECIMAL = parts.find((p) => p.type === "decimal")?.value ?? ",";

type NumberInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue" | "onChange" | "type" | "prefix"
> & {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  /** Shown inside the field before the value, e.g. "$". */
  prefix?: string;
  /** Shown inside the field after the value, e.g. "%", "kg". */
  suffix?: string;
  /** Digits allowed after the decimal separator. 0 = whole numbers only. */
  decimals?: number;
  allowNegative?: boolean;
};

function display(value: number | null | undefined, decimals: number): string {
  if (value == null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimals }).format(value);
}

/** Turn what the person typed into a tidy draft and its numeric value. */
function parse(text: string, decimals: number, allowNegative: boolean) {
  const negative = allowNegative && text.trim().startsWith("-");
  const [intRaw = "", ...fracRaw] = text.split(DECIMAL);
  const intDigits = intRaw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const hasDecimal = decimals > 0 && fracRaw.length > 0;
  const fracDigits = fracRaw.join("").replace(/\D/g, "").slice(0, decimals);
  const sign = negative ? "-" : "";

  if (!intDigits && !hasDecimal) return { draft: sign, value: null };

  const whole = intDigits || "0";
  const draft =
    sign +
    new Intl.NumberFormat(LOCALE).format(Number(whole)) +
    (hasDecimal ? DECIMAL + fracDigits : "");
  return { draft, value: Number(`${sign}${whole}.${fracDigits || "0"}`) };
}

export function NumberInput({
  value,
  onValueChange,
  prefix,
  suffix,
  decimals = 0,
  allowNegative = false,
  ...inputProps
}: NumberInputProps) {
  const [draft, setDraft] = useState(() => display(value, decimals));
  // Follow outside changes (form reset, server data) without an effect.
  const shown =
    parse(draft, decimals, allowNegative).value === (value ?? null)
      ? draft
      : display(value, decimals);

  return (
    <InputGroup>
      {prefix && (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        {...inputProps}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={shown}
        onChange={(event) => {
          const next = parse(event.target.value, decimals, allowNegative);
          setDraft(next.draft);
          onValueChange(next.value);
        }}
      />
      {suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
