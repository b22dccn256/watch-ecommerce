import { useEffect, useState, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AccountPages from "./pages/AccountPages";
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
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BrandsPage from "./pages/BrandsPage";
import FAQPage from "./pages/FAQPage";
import ComparePage from "./pages/ComparePage";
import NotFoundPage from "./pages/NotFoundPage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import CompareModal from "./components/CompareModal";
import MobileCTA from "./components/MobileCTA";
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
import { I18nContext } from "./contexts/I18nContext";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { useStorefrontStore } from "./stores/useStorefrontStore";
import PromoPopup from "./components/PromoPopup";

// Scroll to top khi navigate
const ScrollToTop = () => {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, [pathname]);
	return null;
};

function App() {
	const location = useLocation();
	const { user, checkAuth, checkingAuth } = useUserStore();
	const [resendLoading, setResendLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const cooldownRef = useRef(null);
	const { getCartItems } = useCartStore();
	const { fetchWishlist, mergeWishlist, syncFromLocalStorage } = useWishlistStore();
	const { theme, setTheme } = useThemeStore();
	const { isOpen, setIsOpen } = useCompareStore();
	const { lang, currency } = useSettingsStore();
	const { config, fetchConfig } = useStorefrontStore();

	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Fetch CSRF token on app startup
	useEffect(() => {
		axios.get("/csrf-token");
	}, []);

	const t = (key) => resources[lang]?.translation[key] || key;

	// 1. Theme Color Presets
	useEffect(() => {
		const root = document.documentElement;
		if (!config) return;

		if (config.themePreset === "emerald") {
			root.style.setProperty("--color-gold", "#10b981");
		} else if (config.themePreset === "platinum") {
			root.style.setProperty("--color-gold", "#475569");
		} else {
			// Midnight Gold (Default)
			root.style.setProperty("--color-gold", "#c7a06d");
		}
	}, [config]);

	// 2. Initialize default themeMode on guest first-visit (preview live in dashboard)
	useEffect(() => {
		if (!config) return;
		const isDashboard = window.location.pathname.startsWith("/secret-dashboard");
		const initialized = sessionStorage.getItem("theme_initialized");

		if (isDashboard || !initialized) {
			const mode = config.themeMode || "dark";
			if (mode === "system") {
				const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
				setTheme(isDark ? "dark" : "light");
			} else {
				setTheme(mode);
			}
			if (!isDashboard) {
				sessionStorage.setItem("theme_initialized", "true");
			}
		}
	}, [config, setTheme]);

	// 3. Render active theme class
	useEffect(() => {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [theme]);

	// 4. Dynamic SEO Metadata, Favicon & Custom CSS Update
	useEffect(() => {
		if (!config) return;
		if (config.seoTitle) {
			document.title = config.seoTitle;
		}
		if (config.seoMetaDesc) {
			let metaDesc = document.querySelector('meta[name="description"]');
			if (!metaDesc) {
				metaDesc = document.createElement('meta');
				metaDesc.setAttribute('name', 'description');
				document.head.appendChild(metaDesc);
			}
			metaDesc.setAttribute('content', config.seoMetaDesc);
		}
		// Dynamic favicon
		if (config.favicon) {
			let favicon = document.querySelector('link[rel="icon"]');
			if (!favicon) {
				favicon = document.createElement('link');
				favicon.setAttribute('rel', 'icon');
				document.head.appendChild(favicon);
			}
			favicon.setAttribute('href', config.favicon);
		}
		// Dynamic custom CSS injection
		const styleId = 'storefront-custom-css';
		let styleEl = document.getElementById(styleId);
		if (config.customCSS) {
			if (!styleEl) {
				styleEl = document.createElement('style');
				styleEl.id = styleId;
				document.head.appendChild(styleEl);
			}
			styleEl.textContent = config.customCSS;
		} else if (styleEl) {
			styleEl.remove();
		}
	}, [config]);

	// Resend cooldown timer
	useEffect(() => {
		if (resendCooldown > 0) {
			cooldownRef.current = setInterval(() => setResendCooldown((p) => p - 1), 1000);
		}
		return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
	}, [resendCooldown]);

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
		if (!user || !user.emailVerified && user.role !== "admin") return;

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
		<GlobalErrorBoundary>
		<I18nContext.Provider value={{ t, lang, currency }}>
			<div className={`min-h-screen relative ${theme === 'dark' ? 'bg-[color:var(--color-bg)] text-[color:var(--color-primary)]' : 'bg-[color:var(--color-bg)] text-[color:var(--color-primary)]'}`}>
				<ShimmerStyle />
				<ScrollToTop />
            
			<div className={`relative ${!location.pathname.startsWith('/secret-dashboard') ? (config?.announcementEnabled ? 'pt-24' : 'pt-16') : ''} min-h-screen flex flex-col`}>
				{/* Hide customer-facing Navbar/Footer/overlays on admin routes */}
				{!location.pathname.startsWith('/secret-dashboard') && <Navbar />}
				{user && user.role !== "admin" && !user.emailVerified && (
					<div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8 py-2.5 bg-amber-50/95 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 flex justify-between items-center gap-3">
						<div className="min-w-0">
							<p className="text-sm font-semibold">Tài khoản cần xác minh bảo mật</p>
							<p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">Chúng tôi đã gửi email xác minh. Vui lòng mở email và nhấn nút xác thực để kích hoạt tài khoản.</p>
						</div>
						<button
							className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
								resendLoading || resendCooldown > 0
									? 'bg-amber-200/50 dark:bg-amber-800/30 text-amber-500 cursor-not-allowed'
									: 'bg-amber-500 text-white hover:bg-amber-600'
							}`}
							onClick={async () => {
								if (resendLoading || resendCooldown > 0) return;
								try {
									setResendLoading(true);
									const res = await axios.post('/auth/resend-verification', { email: user.email });
									toast.success(res.data.message || 'Đã gửi lại email xác minh');
									setResendCooldown(60);
								} catch (err) {
									const msg = err?.response?.data?.message || 'Gửi lại email xác minh thất bại';
									toast.error(msg);
								} finally {
									setResendLoading(false);
								}
							}}
							disabled={resendLoading || resendCooldown > 0}
						>
							{resendLoading ? 'Đang gửi...' : resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại email xác minh'}
						</button>
					</div>
				)}
				<main className='flex-1 pb-20 sm:pb-0'>
					<AnimatePresence mode="wait">
						<motion.div
							key={location.pathname}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.12 }}
						>
					<Routes location={location}>
							<Route path='/' element={isVerifiedUser ? <HomePage /> : user ? <Navigate to='/verify-email' /> : <HomePage />} />
							<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
							<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
							<Route path='/verify-email/:token?' element={<VerifyEmailPage />} />
							<Route path='/forgot-password' element={<ForgotPasswordPage />} />
							<Route path='/reset-password/:token?' element={<ResetPasswordPage />} />
							<Route
								path='/secret-dashboard'
								element={user?.role === "admin" || user?.role === "staff" ? <AdminPage /> : <Navigate to='/login' />}
							/>
							<Route path="/catalog" element={<CatalogPage />} />
							<Route path='/category/:category' element={<CatalogPage />} />
							<Route path="/about" element={<AboutPage />} />
							<Route path="/compare" element={<ComparePage />} />
							<Route path='/cart' element={privateRoute(<CartPage />)} />
							<Route path='/checkout' element={privateRoute(<CheckoutPage />)} />
							<Route path='/profile' element={privateRoute(<AccountPages />)} />
							<Route path='/wishlist' element={privateRoute(<WishlistPage />)} />
						<Route path='/delivery-policy' element={<DeliveryPolicyPage />} />
						<Route path='/warranty' element={<WarrantyPage />} />
						<Route path='/size-guide' element={<SizeGuidePage />} />
						<Route path='/contact' element={<ContactPage />} />
						<Route path='/brands' element={<BrandsPage />} />
						<Route path='/order-lookup' element={<OrderLookupPage />} />
						<Route path='/privacy-policy' element={<PrivacyPolicyPage />} />
						<Route path='/terms' element={<TermsOfServicePage />} />
						<Route path='/faq' element={<FAQPage />} />
						<Route path='/support' element={<FAQPage />} />
						<Route path='/purchase-success' element={<PurchaseSuccessPage />} />
							<Route path='/purchase-cancel' element={privateRoute(<PurchaseCancelPage />)} />
						<Route path='/payment/vnpay-return' element={<PaymentReturnPage method="vnpay" />} />
							<Route path="/product/:slugToken" element={<ProductDetailPage />} />
						<Route path="/order-tracking/:trackingToken?" element={<OrderTrackingPage />} />
						<Route path='*' element={<NotFoundPage />} />
					</Routes>
						</motion.div>
					</AnimatePresence>
				</main>
				{!location.pathname.startsWith('/secret-dashboard') && <Footer />}
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
						{!location.pathname.startsWith('/secret-dashboard') && (
							<>
								{(!config || config.showChatBot) && <ChatBot />}
								<MobileCTA />
								<CompareModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
								<PromoPopup config={config} />
							</>
						)}
			</div>
		</I18nContext.Provider>
		</GlobalErrorBoundary>
	);
}

export default App;
