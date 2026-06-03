import Input from "../../components/ui/Input";

const ShippingForm = ({
  formData,
  handleChange,
  errors,
  savedAddresses = [],
  selectedAddressId,
  setSelectedAddressId,
  onSelectAddress,
  userEmail,
}) => {
  const showAddressBook = savedAddresses.length > 0;

  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-6">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-secondary">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 text-[color:var(--color-gold)]">
          1
        </span>
        Thông tin giao hàng
      </div>

      {showAddressBook && (
        <div className="mb-5 space-y-2 rounded-2xl border border-[color:var(--color-gold)]/20 bg-[color:var(--color-gold)]/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                Chọn địa chỉ giao hàng
              </p>
              <p className="text-xs text-muted">
                Lấy từ hồ sơ tài khoản, mặc định chọn địa chỉ đã đánh dấu.
              </p>
            </div>
            <select
              value={selectedAddressId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAddressId(value);
                if (value === "manual") {
                  return;
                }
                const selected = savedAddresses.find(
                  (item) => item.id === value,
                );
                if (selected) onSelectAddress(selected);
              }}
              className="input-base h-11 min-w-[220px] rounded-xl"
            >
              <option value="manual">Nhập địa chỉ mới</option>
              {savedAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} - {address.address}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
          placeholder={userEmail || "nva@example.com"}
          disabled={Boolean(userEmail)}
          hint={userEmail ? "Email lấy từ tài khoản đăng nhập" : undefined}
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
