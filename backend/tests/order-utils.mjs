// Pure, testable calculateTotals implementation that accepts productLookup and campaignApplier
export async function calculateTotalsPure(products, coupon, city, productLookup, campaignApplier) {
  let subtotal = 0;
  for (const item of products) {
    const product = await productLookup(item._id || item.id);
    if (!product) throw new Error('Product not found');
    const applied = await campaignApplier(product);
    subtotal += applied.price * item.quantity;
  }

  let discount = 0;
  if (coupon) {
    // simple percent or fixed
    if (coupon.type === 'percent') {
      discount = Math.round((coupon.discountValue / 100) * subtotal);
    } else {
      discount = coupon.discountValue;
    }
  }

  const totalAfterDiscount = subtotal - discount;

  const FREE_SHIP_THRESHOLD = 5000000;
  const BIG_CITY_FEE = 30000;
  const OTHER_PROVINCE_FEE = 50000;
  const BIG_CITIES = ['hà nội','ha noi','hn','hồ chí minh','ho chi minh','hcm','tp.hcm','tp hcm','sài gòn','sai gon'];

  let shippingFee = 0;
  if (products.length > 0) {
    if (totalAfterDiscount >= FREE_SHIP_THRESHOLD) shippingFee = 0;
    else if (!city || BIG_CITIES.includes((city||'').toLowerCase().trim())) shippingFee = BIG_CITY_FEE;
    else shippingFee = OTHER_PROVINCE_FEE;
  }

  const total = totalAfterDiscount + shippingFee;
  return { subtotal, discount, shippingFee, total };
}
