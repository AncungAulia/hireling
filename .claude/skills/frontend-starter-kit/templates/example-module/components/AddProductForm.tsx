// modules/products/components/AddProductForm.tsx: react-hook-form + zod + shadcn Field + mutation.
// Save button: disabled until something changed, spinner while saving, "saved" label after.
"use client";

import { Controller, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/NumberInput";
import { useCreateProductMutation } from "../api/useProducts";
import {
  productInputSchema,
  type ProductFormValues,
  type ProductInput,
} from "../schemas/product.schema";

// Empty inputs, not invented data.
const EMPTY_FORM: ProductFormValues = { name: "", category: "", price: null, stock: null };

type FormControl = Control<ProductFormValues, unknown, ProductInput>;

function TextField({
  control,
  name,
  label,
}: {
  control: FormControl;
  name: "name" | "category";
  label: string;
}) {
  const id = `product-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input {...field} id={id} aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function AmountField({
  control,
  name,
  label,
  prefix,
  suffix,
}: {
  control: FormControl;
  name: "price" | "stock";
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  const id = `product-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <NumberInput
            id={id}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value}
            onValueChange={field.onChange}
            prefix={prefix}
            suffix={suffix}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function AddProductForm({ onDone }: { onDone?: () => void }) {
  const form = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productInputSchema),
    // Errors appear when a field is left, then update on every keystroke until it is valid.
    mode: "onTouched",
    defaultValues: EMPTY_FORM,
  });
  const createProduct = useCreateProductMutation();
  const { isDirty } = form.formState;
  const justSaved = createProduct.isSuccess && !isDirty;

  function handleSave(values: ProductInput) {
    createProduct.mutate(values, {
      onSuccess: () => {
        form.reset(EMPTY_FORM);
        onDone?.();
      },
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSave)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" />
        <TextField control={form.control} name="category" label="Category" />
        <AmountField control={form.control} name="price" label="Price" prefix="$" />
        <AmountField control={form.control} name="stock" label="Stock" />
        <Button type="submit" disabled={!isDirty || createProduct.isPending}>
          {createProduct.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {justSaved && <Check className="size-4" aria-hidden />}
          {justSaved ? "Product saved" : "Save product"}
        </Button>
      </FieldGroup>
    </form>
  );
}
