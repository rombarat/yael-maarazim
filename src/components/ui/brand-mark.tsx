import Image from "next/image";
import clsx from "clsx";
import { brand } from "@/config/brand";

/** The logo if the business has one, otherwise the name as a wordmark in the display face. */
export function BrandMark({
  className,
  textClassName,
  priority,
  invert,
}: {
  /** Height classes for the logo image, e.g. "h-11 w-auto" */
  className?: string;
  /** Size classes for the wordmark fallback */
  textClassName?: string;
  priority?: boolean;
  /** White version for dark backgrounds */
  invert?: boolean;
}) {
  if (brand.logo) {
    return (
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={brand.logo.width}
        height={brand.logo.height}
        priority={priority}
        className={clsx(className, invert && "brightness-0 invert opacity-90")}
      />
    );
  }
  return (
    <span dir="auto" className={clsx("font-display leading-none", invert ? "text-white" : "text-brand", textClassName ?? "text-[28px]")}>
      {brand.name}
    </span>
  );
}
