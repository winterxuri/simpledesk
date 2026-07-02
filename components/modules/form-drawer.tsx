"use client";

import { Drawer } from "@/components/ui/drawer";

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-lg"
    >
      {children}
    </Drawer>
  );
}
