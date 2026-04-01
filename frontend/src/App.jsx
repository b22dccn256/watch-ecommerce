import React, { createContext, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import WishlistPage from "./pages/WishlistPage";
import DeliveryPolicyPage from "./pages/DeliveryPolicyPage";
import WarrantyPage from "./pages/WarrantyPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import ContactPage from "./pages/ContactPage";
import OrderLookupPage from "./pages/OrderLookupPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import CompareModal from "./components/CompareModal";
import LoadingSpinner from "./components/LoadingSpinner";
import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";
import axios from "./lib/axios";
import { useThemeStore } from "./stores/useThemeStore";
import { useWishlistStore } from "./stores/useWishlistStore";
import { ShimmerStyle } from "./components/SkeletonLoaders";
import { useCompareStore } from "./stores/useCompareStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { resources } from "./i18n";

// Scroll to top khi navigate
const ScrollToTop = () => {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, [pathname]);
	return null;
};


// Simple i18n/context provider
export const I18nContext = createContext({ t: (k) => k, lang: 'vi', currency: 'vnd' });

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const [resendLoading, setResendLoading] = useState(false);
	const { getCartItems } = useCartStore();
	const { wishlist, fetchWishlist, mergeWishlist, syncFromLocalStorage } = useWishlistStore();
	const { theme } = useThemeStore();
	const { isOpen, setIsOpen, compareItems } = useCompareStore();
	const { lang, currency } = useSettingsStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const t = (key) => resources[lang]?.translation[key] || key;

	useEffect(() => {
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [theme]);

	// Initialize Wishlist and handle Multi-tab Sync
	useEffect(() => {
		fetchWishlist(!!user);

		const handleStorageChange = (e) => {
			if (e.key === "wishlist") {
				syncFromLocalStorage();
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [fetchWishlist, user, syncFromLocalStorage]);

	useEffect(() => {
		if (!user) return;

		const syncCartAndFetch = async () => {
			await useCartStore.getState().syncLocalCartToServer();
			await getCartItems();
		};
		
		syncCartAndFetch();
		mergeWishlist();
	}, [getCartItems, mergeWishlist, user]);

	if (checkingAuth) return <LoadingSpinner />;

	const isVerifiedUser = user && (user.emailVerified || user.role === "admin");
	const privateRoute = (component) => {
		if (!user) return <Navigate to='/login' />;
		if (user.role !== "admin" && !user.emailVerified) return <Navigate to='/verify-email' />;
		return component;
	};

	return (
		<I18nContext.Provider value={{ t, lang, currency }}>
			<div className={`min-h-screen relative theme-transition ${theme === 'dark' ? 'bg-luxury-dark text-white' : 'bg-white text-black'}`}>
				<ShimmerStyle />
				<ScrollToTop />
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute inset-0'>
					<div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full ${theme === 'dark'
							? 'bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15)_0%,rgba(46,95,74,0.05)_45%,rgba(15,15,15,0.9)_100%)]'
							: 'bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1)_0%,rgba(240,240,240,0.4)_45%,rgba(255,255,255,1)_100%)]'
						}`} />
				</div>
			</div>

			<div className='relative z-50 pt-20 min-h-screen flex flex-col'>
				<Navbar />
				{user && user.role !== "admin" && !user.emailVerified && (
					<div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8 py-3 bg-gradient-to-r from-amber-200 to-amber-300 border-b border-amber-400 text-amber-900 shadow-sm flex justify-between items-center gap-3">
						<div>
							<p className="font-semibold">Email của bạn chưa được xác thực</p>
							<p className="text-sm">Vui lòng kiểm tra email và click link xác thực để tránh bị hạn chế tạo đơn hàng.</p>
						</div>
						<button
							className={`px-4 py-2 rounded-md font-semibold ${resendLoading ? 'bg-gray-300 text-gray-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
							onClick={async () => {
								try {
									setResendLoading(true);
									const res = await axios.post('/auth/resend-verification');
									toast.success(res.data.message || 'Đã gửi lại email xác thực');
								} catch (err) {
									const msg = err?.response?.data?.message || 'Gửi lại email xác thực thất bại';
									toast.error(msg);
								} finally {
									setResendLoading(false);
								}
							}}
							disabled={resendLoading}
						>
							{resendLoading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
						</button>
					</div>
				)}
				<main className='flex-1'>
					<Routes>
							<Route path='/' element={isVerifiedUser ? <HomePage /> : user ? <Navigate to='/verify-email' /> : <HomePage />} />
							<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
							<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
							<Route path='/verify-email' element={<VerifyEmailPage />} />
							<Route
								path='/secret-dashboard'
								element={user?.role === "admin" || user?.role === "staff" ? <AdminPage /> : <Navigate to='/login' />}
							/>
							<Route path="/catalog" element={<CatalogPage />} />
							<Route path='/category/:category' element={<CatalogPage />} />
							<Route path="/about" element={<AboutPage />} />
							<Route path='/cart' element={privateRoute(<CartPage />)} />
							<Route path='/checkout' element={privateRoute(<CheckoutPage />)} />
							<Route path='/profile' element={privateRoute(<ProfilePage />)} />
							<Route path='/wishlist' element={privateRoute(<WishlistPage />)} />
						<Route path='/delivery-policy' element={<DeliveryPolicyPage />} />
						<Route path='/warranty' element={<WarrantyPage />} />
						<Route path='/size-guide' element={<SizeGuidePage />} />
						<Route path='/contact' element={<ContactPage />} />
						<Route path='/order-lookup' element={<OrderLookupPage />} />
						<Route path='/privacy-policy' element={<PrivacyPolicyPage />} />
						<Route path='/terms' element={<TermsOfServicePage />} />
						<Route
							path='/purchase-success'
								element={privateRoute(<PurchaseSuccessPage />)}
							/>
							<Route path='/purchase-cancel' element={privateRoute(<PurchaseCancelPage />)} />
						<Route path='/payment/vnpay-return' element={<PaymentReturnPage method="vnpay" />} />
						<Route path='/payment/momo-return' element={<PaymentReturnPage method="momo" />} />
						<Route path='/payment/zalopay-return' element={<PaymentReturnPage method="zalopay" />} />
						<Route path="/product/:id" element={<ProductDetailPage />} />
						<Route path="/order-tracking/:trackingToken?" element={<OrderTrackingPage />} />
					</Routes>
				</main>
				<Footer />
			</div>
			<Toaster
				toastOptions={{
					style: {
						background: '#18181b',
						color: '#fff',
						border: '1px solid #D4AF37',
					},
					success: {
						iconTheme: {
							primary: '#D4AF37',
							secondary: '#18181b',
						},
					},
				}}
			/>
			<ChatBot />
			<CompareModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

			{/* Floating Compare Button */}
			{compareItems.length > 0 && !isOpen && (
				<button 
					onClick={() => setIsOpen(true)}
					className="fixed bottom-24 right-6 bg-emerald-600 dark:bg-yellow-400 text-white dark:text-black p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] dark:shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:scale-110 transition flex items-center justify-center z-40"
					title="So sánh sản phẩm"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3-8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
					<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0f0c08]">
						{compareItems.length}
					</span>
				</button>
			)}
			</div>
		</I18nContext.Provider>
	);
}

export default App;
