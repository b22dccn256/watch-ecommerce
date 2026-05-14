import React from "react";
import { Link } from "react-router-dom";

class GlobalErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, errorMessage: "" };
	}

	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			errorMessage: error?.message || "ÄĂ£ xáº£y ra lá»—i khĂ´ng mong muá»‘n.",
		};
	}

	componentDidCatch(error, info) {
		console.error("[GlobalErrorBoundary]", error, info);
	}

	handleReload = () => {
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-[#0f0c08] text-gray-900 dark:text-white">
					<div className="max-w-lg w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-xl">
						<p className="text-sm uppercase tracking-widest text-gray-500 mb-2">System Error</p>
						<h1 className="text-3xl font-bold mb-3">á»¨ng dá»¥ng gáº·p sá»± cá»‘</h1>
						<p className="text-gray-600 dark:text-gray-300 mb-2">{this.state.errorMessage}</p>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Báº¡n cĂ³ thá»ƒ táº£i láº¡i trang hoáº·c quay vá» trang chá»§.</p>
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<button
								onClick={this.handleReload}
								className="px-5 py-3 rounded-xl bg-luxury-gold text-luxury-dark font-semibold hover:bg-luxury-gold-light transition-colors"
							>
								Táº£i láº¡i trang
							</button>
							<Link
								to="/"
								className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								Vá» trang chá»§
							</Link>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default GlobalErrorBoundary;

