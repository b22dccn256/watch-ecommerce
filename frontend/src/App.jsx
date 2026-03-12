import { Navigate, Route, Routes } from "react-router-dom";
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

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import ChatBot from "./components/ChatBot";

import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";
import { useThemeStore } from "./stores/useThemeStore";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems, getWishlistItems } = useCartStore();
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

	useEffect(() => {
		if (!user) return;
		getCartItems();
		getWishlistItems();
	}, [getCartItems, getWishlistItems, user]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className={`min-h-screen relative theme-transition ${theme === 'dark' ? 'bg-luxury-dark text-white' : 'bg-white text-black'}`}>
			{/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute inset-0'>
					<div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full ${
						theme === 'dark' 
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
						<Route
							path='/purchase-success'
							element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
						/>
						<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
						<Route path="/product/:id" element={<ProductDetailPage />} />
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
