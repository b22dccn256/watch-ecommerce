import { cn } from "../../lib/cn";

const toneStyles = {
	neutral: "bg-white/90 text-gray-700 border border-black/10",
	accent: "bg-luxury-gold/90 text-lux-dark border border-luxury-gold/70",
	danger: "bg-red-500 text-white border border-red-400",
	success: "bg-emerald-500 text-white border border-emerald-400",
	dark: "bg-black/70 text-white border border-white/20",
};

const ProductBadge = ({ tone = "neutral", className, children }) => {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
				toneStyles[tone],
				className
			)}
		>
			{children}
		</span>
	);
};

export default ProductBadge;
