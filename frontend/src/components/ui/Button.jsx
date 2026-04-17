import { cn } from "../../lib/cn";

const sizeClasses = {
	sm: "h-9 px-3.5 text-xs",
	md: "h-11 px-5 text-sm",
	lg: "h-12 px-6 text-sm",
};

const variantClasses = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	outline: "btn-outline",
	ghost: "btn-ghost",
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
				"btn-base",
				variantClasses[variant] || variantClasses.primary,
				sizeClasses[size] || sizeClasses.md,
				className
			)}
			{...props}
		>
			{children}
		</Component>
	);
};

export default Button;
