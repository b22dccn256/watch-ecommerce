import { useEffect, useState, useMemo, useCallback } from "react";

export const useCheckoutForm = (user) => {
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState("manual");
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    orderNotes: "",
  });
  const [errors, setErrors] = useState({});

  const savedAddresses = useMemo(() => {
    const book = Array.isArray(user?.addressBook) ? user.addressBook : [];
    const normalizedBook = book
      .map((item, index) => ({
        id: item?.id || String(index),
        label: item?.label || `Địa chỉ ${index + 1}`,
        fullName: item?.fullName || user?.name || "",
        phone: item?.phone || user?.phone || "",
        address: item?.address || "",
        city: item?.city || "",
        isDefault: Boolean(item?.isDefault),
      }))
      .filter((item) => item.address && item.city);

    if (normalizedBook.length > 0) return normalizedBook;

    if (user?.address) {
      return [
        {
          id: "legacy-default",
          label: "Địa chỉ mặc định",
          fullName: user?.name || "",
          phone: user?.phone || "",
          address: user.address,
          city: "",
          isDefault: true,
        },
      ];
    }

    return [];
  }, [user]);

  const applyAddress = useCallback(
    (address) => {
      if (!address) return;
      setFormData((prev) => ({
        ...prev,
        fullName: address.fullName || user?.name || prev.fullName || "",
        phoneNumber: address.phone || user?.phone || prev.phoneNumber || "",
        email: user?.email || prev.email || "",
        address: address.address || prev.address || "",
        city: address.city || prev.city || "",
      }));
    },
    [user],
  );

  useEffect(() => {
    const savedData = localStorage.getItem("checkoutFormData");

    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData((prev) => ({
        ...prev,
        ...parsed.formData,
        email: user?.email || parsed.formData?.email || "",
      }));
      setSelectedAddressId(parsed.selectedAddressId || "manual");
      return;
    }

    if (user) {
      const defaultAddress =
        savedAddresses.find((item) => item.isDefault) || savedAddresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        applyAddress(defaultAddress);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
      }));
    }
  }, [user, savedAddresses, applyAddress]);

  useEffect(() => {
    localStorage.setItem(
      "checkoutFormData",
      JSON.stringify({ formData, selectedAddressId }),
    );
  }, [formData, selectedAddressId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim())
      nextErrors.fullName = "Họ và tên là bắt buộc";

    const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
    if (!formData.phoneNumber.trim())
      nextErrors.phoneNumber = "Số điện thoại là bắt buộc";
    else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
      nextErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!user?.email && !formData.email.trim())
      nextErrors.email = "Email là bắt buộc";
    else if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (!formData.address.trim()) nextErrors.address = "Địa chỉ là bắt buộc";
    if (!formData.city.trim()) nextErrors.city = "Tỉnh/Thành phố là bắt buộc";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const proceedToReview = () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep(2);
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    errors,
    handleChange,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    applyAddress,
    validateForm,
    proceedToReview,
  };
};
