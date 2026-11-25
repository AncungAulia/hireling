// src/components/shared/ResponsiveDialog.tsx: a dialog on tablet and desktop, a bottom drawer on mobile.
// Use it for short forms and pickers. Long forms on mobile use a full-screen sheet instead (ui-rules §4).
"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TABLET_UP = "(min-width: 768px)";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isTabletUp = useMediaQuery(TABLET_UP);

  if (isTabletUp) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
