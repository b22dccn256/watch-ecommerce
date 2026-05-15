import { useState, useEffect } from "react";

export const useCheckoutForm = (user) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    orderNotes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedData = localStorage.getItem("checkoutFormData");

    if (savedData) {
      setFormData(JSON.parse(savedData));
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("checkoutFormData", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = "Họ và tên là bắt buộc";

    const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
    if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = "Số điện thoại là bắt buộc";
    else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
      nextErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!formData.email.trim()) nextErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
    validateForm,
    proceedToReview,
  };
};
