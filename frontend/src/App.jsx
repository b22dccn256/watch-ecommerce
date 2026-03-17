import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

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
import OrderTrackingPage from "./pages/OrderTrackingPage";
import WishlistPage from "./pages/WishlistPage";
import DeliveryPolicyPage from "./pages/DeliveryPolicyPage";
import WarrantyPage from "./pages/WarrantyPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import ContactPage from "./pages/ContactPage";
import OrderLookupPage from "./pages/OrderLookupPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import ChatBot from "./components/ChatBot";

import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";
import { useThemeStore } from "./stores/useThemeStore";
import { useWishlistStore } from "./stores/useWishlistStore";

// Scroll to top khi navigate
const ScrollToTop = () => {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, [pathname]);
	return null;
};

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const { wishlist, fetchWishlist, mergeWishlist, syncFromLocalStorage } = useWishlistStore();
	const { theme } = useThemeStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

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
		getCartItems();
		mergeWishlist();
	}, [getCartItems, mergeWishlist, user]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className={`min-h-screen relative theme-transition ${theme === 'dark' ? 'bg-luxury-dark text-white' : 'bg-white text-black'}`}>
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
				<main className='flex-1'>
					<Routes>
						<Route path='/' element={<HomePage />} />
						<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
						<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
						<Route
							path='/secret-dashboard'
							element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
						/>
						<Route path="/catalog" element={<CatalogPage />} />
						<Route path='/category/:category' element={<CatalogPage />} />
						<Route path="/about" element={<AboutPage />} />
						<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
						<Route path='/checkout' element={user ? <CheckoutPage /> : <Navigate to='/login' />} />
						<Route path='/profile' element={user ? <ProfilePage /> : <Navigate to='/login' />} />
						<Route path='/wishlist' element={user ? <WishlistPage /> : <Navigate to='/login' />} />

						{/* Public Policy & Support Routes */}
						<Route path='/delivery-policy' element={<DeliveryPolicyPage />} />
						<Route path='/warranty' element={<WarrantyPage />} />
						<Route path='/size-guide' element={<SizeGuidePage />} />
						<Route path='/contact' element={<ContactPage />} />
						<Route path='/order-lookup' element={<OrderLookupPage />} />
						<Route path='/privacy-policy' element={<PrivacyPolicyPage />} />
						<Route path='/terms' element={<TermsOfServicePage />} />
						<Route
							path='/purchase-success'
							element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
						/>
						<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
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
		</div>
	);
}

export default App;
