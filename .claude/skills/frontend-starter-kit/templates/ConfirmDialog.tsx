// src/components/shared/ConfirmDialog.tsx: the one confirmation for risky or irreversible actions.
// Tablet and desktop get a centered AlertDialog; mobile gets a bottom drawer with the main action on
// top and cancel below. The parent owns `open` and `pending` (e.g. mutation.isPending).
"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TABLET_UP = "(min-width: 768px)";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the action and its object, e.g. "Delete product Jasmine Tea?" */
  title: string;
  /** States the consequence, e.g. "This product will be removed from the list and can't be restored." */
  description: string;
  /** Verb + object, e.g. "Delete product". Never "OK" or "Yes". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isTabletUp = useMediaQuery(TABLET_UP);
  const variant = destructive ? "destructive" : "default";
  const confirmContent = (
    <>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {confirmLabel}
    </>
  );
  // While the action runs, the dialog stays open so its result can be seen.
  const handleOpenChange = (next: boolean) => {
    if (!pending) onOpenChange(next);
  };

  if (isTabletUp) {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction variant={variant} disabled={pending} onClick={onConfirm}>
              {confirmContent}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button variant={variant} disabled={pending} onClick={onConfirm}>
            {confirmContent}
          </Button>
          <DrawerClose disabled={pending} render={<Button variant="outline" />}>
            {cancelLabel}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
