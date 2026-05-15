/**
 * SkeletonLoaders.jsx
 * Tập trung tất cả skeleton loading components vào một file.
 * Dùng CSS animation shimmer thay vì chỉ animate-pulse để trông premium hơn.
 */

// ── Base shimmer keyframe (inject 1 lần vào DOM) ─────────────────────────────
const ShimmerStyle = () => (
	<style>{`
		@keyframes shimmer {
			0%   { background-position: -600px 0; }
			100% { background-position: 600px 0; }
		}
		.skeleton-shimmer {
			background: linear-gradient(90deg,
				rgba(255,255,255,0.03) 25%,
				rgba(255,255,255,0.08) 50%,
				rgba(255,255,255,0.03) 75%
			);
			background-size: 600px 100%;
			animation: shimmer 1.6s infinite linear;
		}
		.skeleton-shimmer-light {
			background: linear-gradient(90deg,
				rgba(0,0,0,0.04) 25%,
				rgba(0,0,0,0.09) 50%,
				rgba(0,0,0,0.04) 75%
			);
			background-size: 600px 100%;
			animation: shimmer 1.6s infinite linear;
		}
		.skeleton-shimmer-premium {
			background: linear-gradient(90deg,
				rgba(212,175,55,0.05) 25%,
				rgba(212,175,55,0.12) 50%,
				rgba(212,175,55,0.05) 75%
			);
			background-size: 600px 100%;
			animation: shimmer 1.6s infinite linear;
		}
	`}</style>
);

// ── 1. ProductCard Skeleton (dùng cho CatalogPage, FeaturedProducts) ──────────
export const SkeletonProductCard = () => (
	<div className="group relative flex flex-col h-full w-full overflow-hidden rounded-3xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.35)]">
		{/* Image placeholder */}
		<div className="w-full aspect-[4/5] bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium rounded-t-3xl" />

		{/* Info section */}
		<div className="p-5 flex flex-col gap-3 flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,240,0.98))] dark:bg-zinc-900">
			{/* Brand */}
			<div className="h-3 w-1/4 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
			{/* Name */}
			<div className="h-5 w-3/4 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
			<div className="h-5 w-1/2 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
			{/* Stars */}
			<div className="flex gap-1 mt-1">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
				))}
			</div>
			{/* Price */}
			<div className="mt-auto h-8 w-2/5 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
			{/* Button */}
			<div className="h-10 w-full rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-premium" />
		</div>
	</div>
);

// ── 2. CartItem Skeleton (dùng cho CartPage) ──────────────────────────────────
export const SkeletonCartItem = () => (
	<div className="rounded-2xl border p-4 md:p-6 border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.35)]">
		<div className="flex flex-col md:flex-row gap-6 items-center">
			{/* Image */}
			<div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-gray-200 dark:bg-zinc-700 flex-shrink-0 skeleton-shimmer skeleton-shimmer-premium" />

			{/* Info */}
			<div className="flex-1 w-full space-y-3">
				<div className="h-5 w-3/4 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				<div className="h-4 w-1/3 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				<div className="flex gap-4 pt-2">
					<div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				</div>
			</div>

			{/* Qty + Price */}
			<div className="flex flex-col items-end gap-3">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
					<div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				</div>
				<div className="h-7 w-28 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				<div className="h-7 w-28 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			</div>
		</div>
	</div>
);

// ── 3. ProductsTable Row Skeleton (dùng cho Admin ProductsList) ───────────────
export const SkeletonTableRow = () => (
	<tr>
		<td className="px-6 py-4">
			<div className="flex items-center gap-3">
				<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium flex-shrink-0" />
				<div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			</div>
		</td>
		<td className="px-6 py-4"><div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" /></td>
		<td className="px-6 py-4"><div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" /></td>
		<td className="px-6 py-4"><div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" /></td>
		<td className="px-6 py-4"><div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" /></td>
		<td className="px-6 py-4"><div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" /></td>
	</tr>
);

// ── 4. OrderSummary Skeleton (sidebar giỏ hàng) ───────────────────────────────
export const SkeletonOrderSummary = () => (
	<div className="rounded-2xl border p-6 border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.35)]">
		<div className="h-6 w-1/2 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
		{[...Array(4)].map((_, i) => (
			<div key={i} className="flex justify-between">
				<div className="h-4 w-1/3 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				<div className="h-4 w-1/4 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			</div>
		))}
		<div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium mt-2" />
	</div>
);

// ── 5. Generic page shell skeleton ───────────────────────────────────────────
export const SkeletonPageShell = ({ rows = 4 }) => (
	<div className="min-h-screen pt-28 pb-16 px-4">
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="h-10 w-72 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			<div className="h-5 w-1/2 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			<div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.35)]">
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				))}
			</div>
		</div>
	</div>
);

// ── 6. Product detail skeleton ───────────────────────────────────────────────
export const SkeletonProductDetail = () => (
	<div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
		<div className="max-w-7xl mx-auto space-y-5">
			<div className="h-4 w-80 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
				<div className="lg:col-span-6 space-y-4">
					<div className="aspect-square rounded-[2rem] bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="flex gap-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="h-20 w-20 rounded-2xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
						))}
					</div>
				</div>
				<div className="lg:col-span-6 space-y-4">
					<div className="h-6 w-40 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-10 w-4/5 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-5 w-1/2 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-32 rounded-2xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-14 rounded-2xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
					<div className="h-14 rounded-2xl bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium" />
				</div>
			</div>
		</div>
	</div>
);

// ── Injector: export ShimmerStyle để mount 1 lần ở App level ─────────────────
export { ShimmerStyle };
