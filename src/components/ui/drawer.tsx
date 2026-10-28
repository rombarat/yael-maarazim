"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { useModal } from "./use-modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Side panel that slides in from the inline-end side (left in RTL). Traps focus while open. */
export function Drawer({ open, onClose, title, children, footer, className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "animate-drawer-in absolute inset-y-0 left-0 flex w-full max-w-[440px] flex-col bg-paper shadow-2xl",
          className,
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-[26px] leading-none">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            className="-me-2 flex size-11 items-center justify-center rounded-full hover:bg-surface"
            aria-label="סגירה"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>}
      </div>
    </div>
  );
}
