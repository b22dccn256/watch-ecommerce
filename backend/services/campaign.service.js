import Campaign from "../models/campaign.model.js";

class CampaignService {
    /**
     * A.3 Fix: Adapter between Campaign.group (string) and Product.categoryId (ObjectId).
     * Campaign.group is a human-readable string (e.g. "Đồng hồ Nam"),
     * while Product.categoryId is an ObjectId reference to Category collection.
     * 
     * This method performs a multi-candidate lookup to bridge the gap:
     * it checks category.name, category.slug, product.collectionName, and even
     * the ObjectId toString as fallbacks. This allows campaigns to match products
     * regardless of whether the group was stored as a name or slug.
     * 
     * TODO: Long-term, consider storing categoryId reference in Campaign.group
     * for a more reliable and rename-proof match.
     */
    static matchesCampaignGroup(campaignGroup, product) {
        if (!campaignGroup) return false;

        const normalizedGroup = String(campaignGroup).trim().toLowerCase();
        if (["entire catalog", "toàn bộ danh mục"].includes(normalizedGroup)) {
            return true;
        }

        const category = product?.categoryId;
        const categoryCandidates = [
            product?.category,
            product?.categoryName,
            product?.collectionName,
            category?.name,
            category?.slug,
            category?._id?.toString(),
        ].filter(Boolean).map((value) => String(value).trim().toLowerCase());

        return categoryCandidates.includes(normalizedGroup);
    }

    /**
     * Applies active campaigns to an array of products and dynamically calculates salePrice.
     * @param {Array|Object} products - An array of products or a single product object
     * @returns {Array|Object} Products with potentially updated `price` and a new `originalPrice` field
     */
    static async applyCampaignToProducts(products) {
        if (!products) return products;

        const isArray = Array.isArray(products);
        const productList = isArray ? products : [products];

        try {
            // Find all active campaigns
            const activeCampaigns = await Campaign.find({
                status: "Active",
                isActive: true
            });

            if (activeCampaigns.length === 0) {
                return isArray ? productList : productList[0];
            }

            // Map products to include dynamic pricing
            const processedProducts = productList.map((prod) => {
                // If the product is a mongoose document, convert it to a plain object
                // to allow injecting new fields like `originalPrice` or `salePercentage`
                const product = prod.toObject ? prod.toObject() : { ...prod };

                // Find applicable campaigns (Global or matching category)
                const applicableCampaigns = activeCampaigns.filter(c =>
                    c.isGlobal || CampaignService.matchesCampaignGroup(c.group, product)
                );

                if (applicableCampaigns.length > 0) {
                    // If multiple campaigns apply, take the one with the highest discount
                    const bestCampaign = applicableCampaigns.reduce((prev, current) =>
                        (prev.discountPercentage > current.discountPercentage) ? prev : current
                    );

                    product.originalPrice = product.price;
                    product.salePercentage = bestCampaign.discountPercentage;
                    product.price = Math.round(product.price * (1 - bestCampaign.discountPercentage / 100));
                    product.activeCampaignName = bestCampaign.name;
                    product.campaignEndDate = bestCampaign.endDate;
                }

                return product;
            });

            return isArray ? processedProducts : processedProducts[0];
        } catch (error) {
            console.error("Error applying campaigns to products:", error);
            // In case of error, just return the original products to avoid breaking the site
            return isArray ? productList : productList[0];
        }
    }
}

export default CampaignService;
