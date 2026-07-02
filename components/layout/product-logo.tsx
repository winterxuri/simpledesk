import { PRODUCT_ICON_PATH, PRODUCT_NAME } from "@/config/product";
import { cn } from "@/lib/utils";

type ProductMarkProps = {
  className?: string;
  decorative?: boolean;
};

type ProductLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function ProductMark({
  className,
  decorative = false
}: ProductMarkProps) {
  return (
    <img
      src={PRODUCT_ICON_PATH}
      alt={decorative ? "" : PRODUCT_NAME}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
      className={cn("h-10 w-10 shrink-0 rounded-lg", className)}
    />
  );
}

export function ProductLogo({
  className,
  markClassName,
  wordmarkClassName
}: ProductLogoProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <ProductMark decorative className={markClassName} />
      <span className={cn("truncate font-semibold", wordmarkClassName)}>
        {PRODUCT_NAME}
      </span>
    </span>
  );
}
