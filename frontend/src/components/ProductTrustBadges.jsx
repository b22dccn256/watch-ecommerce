import { ShieldCheck, Award, Zap, Clock } from "lucide-react";

const ProductTrustBadges = ({ product, stock }) => {
  const isLimitedStock = stock > 0 && stock <= 3;
  const isExclusive = product.exclusive || stock <= 1;

  return (
    <div className="space-y-4">
      {/* Authenticity & Trust Row */}
      <div className="flex flex-wrap gap-2">
        <div className="trust-badge authenticity">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Xác thực 100%</span>
        </div>

        <div className="trust-badge">
          <Award className="h-3.5 w-3.5" />
          <span>Bảo hành quốc tế</span>
        </div>

        {isLimitedStock && (
          <div className="stock-indicator limited">
            <Zap className="h-3 w-3" />
            <span>Còn {stock} chiếc</span>
          </div>
        )}

        {isExclusive && (
          <div className="stock-indicator exclusive">
            <Clock className="h-3 w-3" />
            <span>Độc quyền</span>
          </div>
        )}
      </div>

      {/* Trust signaling copy */}
      <div className="text-[11px] leading-relaxed text-secondary space-y-1">
        <p>✓ Được phép bán chính thức của hãng</p>
        <p>✓ Hỗ trợ tư vấn & dịch vụ cao cấp 24/7</p>
        <p>✓ Giao hàng & xuất hóa đơn an toàn</p>
      </div>
    </div>
  );
};

export default ProductTrustBadges;
