export const buildProductPath = (product) => {
	if (!product?.slug) return null;
	const token = product.slugToken || product._id;
	if (!token) return null;
	return `/product/${product.slug}--${token}`;
};
