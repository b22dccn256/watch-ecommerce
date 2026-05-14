export function formatCurrency(amount, currency = 'vnd', lang = 'vi') {
  if (currency === 'usd') {
    return amount.toLocaleString(lang === 'vi' ? 'en-US' : 'en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }
  // Default VND
  return amount.toLocaleString(lang === 'en' ? 'vi-VN' : 'vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
}