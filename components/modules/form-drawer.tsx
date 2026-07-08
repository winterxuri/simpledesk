"use client";

import { Drawer } from "@/components/ui/drawer";

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  className = "max-w-lg",
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className}
    >
      {children}
    </Drawer>
  );
}
