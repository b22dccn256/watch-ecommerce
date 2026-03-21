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
	`}</style>
);

// ── 1. ProductCard Skeleton (dùng cho CatalogPage, FeaturedProducts) ──────────
export const SkeletonProductCard = () => (
	<div className="group relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
		{/* Image placeholder */}
		<div className="w-full aspect-square bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light rounded-t-lg" />

		{/* Info section */}
		<div className="p-5 flex flex-col gap-3 flex-1">
			{/* Brand */}
			<div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
			{/* Name */}
			<div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
			<div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
			{/* Stars */}
			<div className="flex gap-1 mt-1">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
				))}
			</div>
			{/* Price */}
			<div className="mt-auto h-8 w-2/5 rounded bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
			{/* Button */}
			<div className="h-9 w-full rounded-full bg-gray-200 dark:bg-zinc-800 skeleton-shimmer skeleton-shimmer-light" />
		</div>
	</div>
);

// ── 2. CartItem Skeleton (dùng cho CartPage) ──────────────────────────────────
export const SkeletonCartItem = () => (
	<div className="rounded-lg border p-4 md:p-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
		<div className="flex flex-col md:flex-row gap-6 items-center">
			{/* Image */}
			<div className="h-24 w-24 md:h-32 md:w-32 rounded bg-gray-200 dark:bg-zinc-700 flex-shrink-0 skeleton-shimmer skeleton-shimmer-light" />

			{/* Info */}
			<div className="flex-1 w-full space-y-3">
				<div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				<div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				<div className="flex gap-4 pt-2">
					<div className="h-7 w-20 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
					<div className="h-7 w-20 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				</div>
			</div>

			{/* Qty + Price */}
			<div className="flex flex-col items-end gap-3">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
					<div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
					<div className="w-7 h-7 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				</div>
				<div className="h-7 w-28 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
			</div>
		</div>
	</div>
);

// ── 3. ProductsTable Row Skeleton (dùng cho Admin ProductsList) ───────────────
export const SkeletonTableRow = () => (
	<tr>
		<td className="px-6 py-4">
			<div className="flex items-center gap-3">
				<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light flex-shrink-0" />
				<div className="h-4 w-36 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
			</div>
		</td>
		<td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" /></td>
		<td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" /></td>
		<td className="px-6 py-4"><div className="h-5 w-20 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" /></td>
		<td className="px-6 py-4"><div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" /></td>
		<td className="px-6 py-4"><div className="h-7 w-7 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" /></td>
	</tr>
);

// ── 4. OrderSummary Skeleton (sidebar giỏ hàng) ───────────────────────────────
export const SkeletonOrderSummary = () => (
	<div className="rounded-lg border p-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
		<div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
		{[...Array(4)].map((_, i) => (
			<div key={i} className="flex justify-between">
				<div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
				<div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light" />
			</div>
		))}
		<div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-light mt-2" />
	</div>
);

// ── Injector: export ShimmerStyle để mount 1 lần ở App level ─────────────────
export { ShimmerStyle };
