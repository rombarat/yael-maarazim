import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-xl border bg-white px-4 text-[17px] text-ink placeholder:text-muted/60 transition-colors focus:outline-none focus-visible:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-surface/50";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, optional, optionalLabel = "(לא חובה)", children, className }: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
        {label}
        {optional && <span className="ms-1.5 font-normal text-muted">{optionalLabel}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[14px] text-alert" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[14px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && rest.id ? `${rest.id}-error` : rest["aria-describedby"]}
      className={clsx(control, "h-12", invalid ? "border-alert" : "border-line", className)}
    />
  );
}

export function Textarea({ className, invalid, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={clsx(control, "min-h-24 py-3 leading-relaxed", invalid ? "border-alert" : "border-line", className)}
    />
  );
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select {...rest} className={clsx(control, "h-12 appearance-none border-line bg-white pe-4", className)}>
      {children}
    </select>
  );
}
