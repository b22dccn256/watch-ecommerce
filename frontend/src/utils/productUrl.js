export const buildProductPath = (product) => {
	if (!product?.slug || !product?.slugToken) return null;
	return `/product/${product.slug}--${product.slugToken}`;
};
