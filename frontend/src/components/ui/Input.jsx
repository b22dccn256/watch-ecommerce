import { cn } from "../../lib/cn";

const Input = ({
  as: Component = "input",
  className,
  label,
  hint,
  error,
  containerClassName,
  ...props
}) => {
  const describedBy = error ? `${props.name || props.id}-error` : hint ? `${props.name || props.id}-hint` : undefined;

  return (
    <label className={cn("block space-y-2", containerClassName)}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          {label}
        </span>
      )}
      <Component
        className={cn("input-base", error && "border-red-400 focus:border-red-500 focus:shadow-none", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <span id={`${props.name || props.id}-error`} className="text-xs text-red-500">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${props.name || props.id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </label>
  );
};

export default Input;
