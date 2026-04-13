import { cn } from "../../lib/cn";

const sizeClasses = {
	sm: "h-9 px-3 text-xs",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-5 text-sm",
};

const variantClasses = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-current",
};

const Button = ({
	as: Component = "button",
	type,
	variant = "primary",
	size = "md",
	className,
	children,
	...props
}) => {
	const resolvedType = Component === "button" ? type || "button" : undefined;

	return (
		<Component
			type={resolvedType}
			className={cn(
				"font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
				variantClasses[variant],
				sizeClasses[size],
				className
			)}
			{...props}
		>
			{children}
		</Component>
	);
};

export default Button;
