import React from "react";
import Input from "../../components/ui/Input";

const ShippingForm = ({ formData, handleChange, errors }) => {
  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-6">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-secondary">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 text-[color:var(--color-gold)]">1</span>
        Thông tin giao hàng
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Họ và tên"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          placeholder="Nguyễn Văn A"
        />
        <Input
          label="Số điện thoại"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          error={errors.phoneNumber}
          placeholder="0912345678"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="nva@example.com"
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Địa chỉ"
          name="address"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="Số nhà, đường, phường/xã"
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Tỉnh/Thành phố"
          name="city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
          placeholder="Hà Nội"
        />
        <Input
          as="textarea"
          label="Ghi chú"
          name="orderNotes"
          value={formData.orderNotes}
          onChange={handleChange}
          placeholder="Lưu ý khi giao hàng"
          rows={4}
        />
      </div>
    </div>
  );
};

export default ShippingForm;
