import Campaign from "../models/campaign.model.js";

// ── Cache active campaigns for 30 seconds to avoid repeated DB hits ──
let _campaignCache = { data: null, fetchedAt: 0 };
const CAMPAIGN_CACHE_TTL = 30000; // 30s

const isNodeTestRunner =
  (process.execArgv &&
    process.execArgv.some((a) => String(a).includes("--test"))) ||
  process.env.NODE_ENV === "test";

async function getActiveCampaignsCached() {
  const now = Date.now();
  // In test runner, avoid reading campaigns from DB to keep tests deterministic
  if (isNodeTestRunner) return [];
  if (
    _campaignCache.data &&
    now - _campaignCache.fetchedAt < CAMPAIGN_CACHE_TTL
  ) {
    return _campaignCache.data;
  }
  console.time("[timing] Campaign.find Active");
  _campaignCache.data = await Campaign.find({
    status: "Active",
    isActive: true,
  }).lean();
  console.timeEnd("[timing] Campaign.find Active");
  _campaignCache.fetchedAt = now;
  return _campaignCache.data;
}

// Helper to bust cache after campaign changes
export function bustCampaignCache() {
  _campaignCache.data = null;
  _campaignCache.fetchedAt = 0;
}

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
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    // Map product gender to group name candidates
    if (product?.gender === "male") {
      categoryCandidates.push("đồng hồ nam");
    } else if (product?.gender === "female") {
      categoryCandidates.push("đồng hồ nữ");
    } else if (product?.gender === "unisex") {
      categoryCandidates.push("đồng hồ unisex");
    }

    // Map product movement/type to group name candidates
    if (product?.type === "automatic") {
      categoryCandidates.push("cơ tự động (automatic)");
    } else if (product?.type === "mechanical") {
      categoryCandidates.push("cơ lên cót tay (hand-wound)");
      categoryCandidates.push("cơ lên cót");
    } else if (product?.type === "quartz") {
      categoryCandidates.push("bộ máy pin (quartz)");
    } else if (product?.type === "solar") {
      categoryCandidates.push("năng lượng ánh sáng (solar)");
    } else if (product?.type === "digital") {
      categoryCandidates.push("đồng hồ điện tử (digital)");
      categoryCandidates.push("điện tử");
    } else if (product?.type === "smartwatch") {
      categoryCandidates.push("đồng hồ thông minh (smartwatch)");
      categoryCandidates.push("đồng hồ thông minh");
    }

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
      // Use cached campaigns instead of querying DB every time
      console.time("[timing] applyCampaignToProducts");
      const activeCampaigns = await getActiveCampaignsCached();
      console.log(`[timing] activeCampaignsCount=${activeCampaigns.length}`);

      if (activeCampaigns.length === 0) {
        return isArray ? productList : productList[0];
      }

      // Map products to include dynamic pricing
      const processedProducts = productList.map((prod) => {
        // If the product is a mongoose document, convert it to a plain object
        // to allow injecting new fields like `originalPrice` or `salePercentage`
        const product = prod.toObject ? prod.toObject() : { ...prod };

        // Find applicable campaigns (Global or matching category)
        const applicableCampaigns = activeCampaigns.filter(
          (c) =>
            c.isGlobal ||
            CampaignService.matchesCampaignGroup(c.group, product),
        );

        if (applicableCampaigns.length > 0) {
          // If multiple campaigns apply, take the one with the highest discount
          const bestCampaign = applicableCampaigns.reduce((prev, current) =>
            prev.discountPercentage > current.discountPercentage
              ? prev
              : current,
          );

          product.originalPrice = product.price;
          product.salePercentage = bestCampaign.discountPercentage;
          product.price = Math.round(
            product.price * (1 - bestCampaign.discountPercentage / 100),
          );
          product.activeCampaignName = bestCampaign.name;
          product.campaignEndDate = bestCampaign.endDate;
        }

        return product;
      });

      console.timeEnd("[timing] applyCampaignToProducts");
      return isArray ? processedProducts : processedProducts[0];
    } catch (error) {
      console.error("Error applying campaigns to products:", error);
      // In case of error, just return the original products to avoid breaking the site
      return isArray ? productList : productList[0];
    }
  }
}

export default CampaignService;
