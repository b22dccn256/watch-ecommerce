import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, PlusCircle, Trash, Power, Check, Copy, Percent, DollarSign, Calendar, X, AlertTriangle } from "lucide-react";
import { useCouponStore } from "../stores/useCouponStore";
import toast from "react-hot-toast";
import { confirmToast } from "../lib/confirmToast";

const CreateCouponModal = ({ onClose }) => {
	const { createCoupon, loading } = useCouponStore();
	const [formData, setFormData] = useState({
		code: "",
		type: "percent",
		discountValue: "",
		minOrderAmount: "",
		maxUses: "",
		expirationDate: "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		const success = await createCoupon({
			...formData,
			discountValue: Number(formData.discountValue),
			minOrderAmount: Number(formData.minOrderAmount) || 0,
			maxUses: Number(formData.maxUses) || 0,
		});
		if (success) onClose();
	};

	const generateCode = () => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let code = "";
		for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
		setFormData({ ...formData, code });
	};

	let previewText = "ChÆ°a cĂ³ ná»™i dung giáº£m giĂ¡ há»£p lá»‡.";
	if (formData.discountValue) {
		const val = formData.type === "percent" ? `${formData.discountValue}%` : `${Number(formData.discountValue).toLocaleString("vi-VN")}Ä‘`;
		const min = formData.minOrderAmount ? `cho Ä‘Æ¡n tá»« ${Number(formData.minOrderAmount).toLocaleString("vi-VN")}Ä‘` : "cho má»i Ä‘Æ¡n hĂ ng";
		const uses = formData.maxUses ? `tá»‘i Ä‘a ${formData.maxUses} láº§n` : "khĂ´ng giá»›i háº¡n sá»‘ láº§n";
		previewText = `Giáº£m ${val} ${min}, ${uses}.`;
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
			onClick={onClose}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 10 }}
				className="w-full max-w-2xl bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-2xl shadow-xl overflow-hidden my-8"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-luxury-border">
					<h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-luxury-gold">
						<PlusCircle className="w-5 h-5 text-luxury-gold" />
						Táº¡o MĂ£ Giáº£m GiĂ¡ Má»›i
					</h2>
					<button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors">
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* Code generation */}
					<div>
						<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">MĂ£ Coupon *</label>
						<div className="flex gap-3">
							<input
								type="text" required
								value={formData.code}
								onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
								placeholder="VD: SUMMER2024"
								className="flex-1 bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition uppercase"
							/>
							<button 
								type="button" 
								onClick={generateCode}
								className="px-4 py-2 border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-dark rounded-xl font-bold text-sm transition"
							>
								Táº¡o ngáº«u nhiĂªn
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Loáº¡i giáº£m giĂ¡ */}
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Loáº¡i giáº£m giĂ¡</label>
							<div className="flex bg-gray-100 dark:bg-luxury-dark p-1 rounded-xl">
								<button
									type="button"
									onClick={() => setFormData({ ...formData, type: "percent", discountValue: "" })}
									className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition ${formData.type === "percent" ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}
								>
									<Percent className="w-4 h-4" /> Pháº§n trÄƒm
								</button>
								<button
									type="button"
									onClick={() => setFormData({ ...formData, type: "fixed", discountValue: "" })}
									className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition ${formData.type === "fixed" ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}
								>
									<DollarSign className="w-4 h-4" /> Sá»‘ tiá»n
								</button>
							</div>
						</div>

						{/* GiĂ¡ trá»‹ giáº£m */}
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
								GiĂ¡ trá»‹ giáº£m ({formData.type === "percent" ? "%" : "VNÄ"}) *
							</label>
							<input
								type="number" required min="1" max={formData.type === "percent" ? 100 : undefined}
								value={formData.discountValue}
								onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
								placeholder={formData.type === "percent" ? "VD: 10" : "VD: 500000"}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* ÄÆ¡n tá»‘i thiá»ƒu */}
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ÄÆ¡n hĂ ng tá»‘i thiá»ƒu (VNÄ)</label>
							<input
								type="number" min="0"
								value={formData.minOrderAmount}
								onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
								placeholder="VD: 2000000 (Äá»ƒ trá»‘ng = 0)"
							/>
						</div>

						{/* Sá»‘ láº§n dĂ¹ng tá»‘i Ä‘a */}
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sá»‘ láº§n dĂ¹ng tá»‘i Ä‘a</label>
							<input
								type="number" min="1"
								value={formData.maxUses}
								onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
								placeholder="VD: 100 (Äá»ƒ trá»‘ng = VĂ´ háº¡n)"
							/>
						</div>
					</div>

					{/* NgĂ y háº¿t háº¡n */}
					<div>
						<label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">NgĂ y háº¿t háº¡n *</label>
						<div className="relative">
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="datetime-local" required
								value={formData.expirationDate}
								onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
							/>
						</div>
					</div>

					{/* Preview Box */}
					<div className="bg-luxury-gold/10 border border-luxury-gold/20 p-4 rounded-xl flex items-start gap-3">
						<Tag className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
						<div>
							<p className="text-sm font-bold text-luxury-gold">Xem trÆ°á»›c quy táº¯c</p>
							<p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{previewText}</p>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-luxury-border">
						<button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-luxury-border text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition">
							Há»§y
						</button>
						<button 
							type="submit" 
							disabled={loading || !formData.code}
							className="px-8 py-2.5 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold shadow-lg hover:bg-white transition disabled:opacity-50"
						>
							Táº¡o MĂ£
						</button>
					</div>
				</form>
			</motion.div>
		</motion.div>
	);
};

const CouponsTab = () => {
	const { coupons, loading, fetchCoupons, deleteCoupon, toggleCoupon } = useCouponStore();
	const [showModal, setShowModal] = useState(false);
	const [copiedId, setCopiedId] = useState(null);

	useEffect(() => {
		fetchCoupons();
	}, [fetchCoupons]);

	const handleCopy = (code, id) => {
		navigator.clipboard.writeText(code);
		setCopiedId(id);
		toast.success("ÄĂ£ copy mĂ£: " + code);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const stats = useMemo(() => {
		const now = new Date();
		let active = 0, expired = 0, todayUses = 0;
		coupons.forEach(c => {
			const isExp = new Date(c.expirationDate) < now;
			if (isExp) expired++;
			else if (c.isActive) active++;
			
			// Use real data from API
			todayUses += (c.usedToday || 0);
		});
		return {
			total: coupons.length,
			active,
			expired,
			todayUses
		};
	}, [coupons]);

	const statCards = [
		{ label: "Tá»”NG MĂƒ GIáº¢M GIĂ", value: stats.total, color: "text-blue-500", bg: "bg-blue-500/10" },
		{ label: "ÄANG KĂCH HOáº T", value: stats.active, color: "text-emerald-500", bg: "bg-emerald-500/10" },
		{ label: "ÄĂƒ Háº¾T Háº N", value: stats.expired, color: "text-red-500", bg: "bg-red-500/10" },
		{ label: "LÆ¯á»¢T DĂ™NG HĂ”M NAY", value: stats.todayUses, color: "text-luxury-gold", bg: "bg-luxury-gold/10" },
	];

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Top Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
						<Tag className="text-luxury-gold w-8 h-8" />
						Quáº£n lĂ½ MĂ£ Giáº£m GiĂ¡
					</h1>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm">
						Thiáº¿t láº­p mĂ£ khuyáº¿n mĂ£i, voucher theo pháº§n trÄƒm hoáº·c sá»‘ tiá»n cá»‘ Ä‘á»‹nh.
					</p>
				</div>
				<button 
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-white hover:scale-105 transition-all shadow-lg"
				>
					<PlusCircle className="w-4 h-4" /> Táº O MĂƒ Má»I
				</button>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
				{statCards.map((stat, idx) => (
					<div key={idx} className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-6 rounded-2xl flex flex-col justify-between overflow-hidden relative group">
						<div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-luxury-gold/0 to-luxury-gold/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
						<p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest relative z-10">{stat.label}</p>
						<p className={`text-3xl font-bold mt-2 relative z-10 ${stat.color}`}>{stat.value}</p>
					</div>
				))}
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-none rounded-xl overflow-hidden border border-gray-100 dark:border-transparent">
				<div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
					<table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
						<thead className="bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm sticky top-0 z-10">
							<tr>
								<th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">MĂ£ (Coupon Code)</th>
								<th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">Loáº¡i Giáº£m</th>
								<th className="px-5 py-4 text-right text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">ÄÆ¡n tá»‘i thiá»ƒu</th>
								<th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">ÄĂ£ DĂ¹ng</th>
								<th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">Háº¿t LĂªn</th>
								<th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">Tráº¡ng ThĂ¡i</th>
								<th className="px-5 py-4 text-right text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">HĂ nh Äá»™ng</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
							{coupons.length === 0 && !loading ? (
								<tr>
									<td colSpan="7" className="text-center py-16 text-gray-400 dark:text-gray-500">
										<Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
										<p className="font-medium">ChÆ°a cĂ³ mĂ£ giáº£m giĂ¡ nĂ o</p>
									</td>
								</tr>
							) : (
								coupons.map((coupon) => {
									const isExpiringSoon = new Date(coupon.expirationDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
									const isExpired = new Date(coupon.expirationDate) < new Date();
									
									return (
										<tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
											{/* Code Badge */}
											<td className="px-5 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<div className="bg-luxury-gold text-luxury-dark font-mono font-bold text-xs px-3 py-1 rounded-md shadow-sm tracking-widest border border-yellow-500">
														{coupon.code}
													</div>
													<button 
														onClick={() => handleCopy(coupon.code, coupon._id)}
														className="p-1 text-gray-400 hover:text-luxury-gold transition-colors"
														title="Copy"
													>
														{copiedId === coupon._id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
													</button>
												</div>
											</td>
											
											{/* Type & Value */}
											<td className="px-5 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
													{coupon.type === "percent" ? <Percent className="w-4 h-4 text-blue-500" /> : <DollarSign className="w-4 h-4 text-emerald-500" />}
													{coupon.type === "percent" ? `${coupon.discountValue}%` : `${Number(coupon.discountValue).toLocaleString("vi-VN")}â‚«`}
												</div>
											</td>

											{/* Min order */}
											<td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
												{coupon.minOrderAmount > 0 ? `${Number(coupon.minOrderAmount).toLocaleString("vi-VN")}â‚«` : "â€”"}
											</td>

											{/* Uses */}
											<td className="px-5 py-4 whitespace-nowrap text-center text-sm">
												<span className="font-bold text-gray-900 dark:text-white">{coupon.usedCount || 0}</span>
												<span className="text-gray-500 dark:text-gray-400"> / {coupon.maxUses > 0 ? coupon.maxUses : "âˆ"}</span>
											</td>

											{/* Expiry */}
											<td className="px-5 py-4 whitespace-nowrap">
												<div className={`text-sm ${isExpired ? "text-gray-400 line-through" : isExpiringSoon ? "text-red-500 font-bold" : "text-gray-900 dark:text-white"}`}>
													{new Date(coupon.expirationDate).toLocaleDateString("vi-VN")}
												</div>
												{isExpiringSoon && !isExpired && <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" /> Sáº¯p háº¿t háº¡n</div>}
											</td>

											{/* Status */}
											<td className="px-5 py-4 whitespace-nowrap">
												{isExpired ? (
													<span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">Háº¿t háº¡n</span>
												) : coupon.isActive ? (
													<span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
												) : (
													<span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider">Disabled</span>
												)}
											</td>

											{/* Actions */}
											<td className="px-5 py-4 whitespace-nowrap text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														onClick={() => toggleCoupon(coupon._id)}
														disabled={isExpired}
														className={`p-1.5 rounded-lg transition-colors ${coupon.isActive && !isExpired ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100" : isExpired ? "text-gray-300 opacity-50 cursor-not-allowed" : "text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"}`}
														title={coupon.isActive ? "Táº¯t mĂ£" : "Báº­t mĂ£"}
													>
														<Power className="h-4 w-4" />
													</button>
													<button
														onClick={() => {
															confirmToast("Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a mĂ£ nĂ y?", () => {
																deleteCoupon(coupon._id);
															});
														}}
														className="p-1.5 text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
														title="XĂ³a mĂ£"
													>
														<Trash className="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			<AnimatePresence>
				{showModal && <CreateCouponModal onClose={() => setShowModal(false)} />}
			</AnimatePresence>
		</div>
	);
};

export default CouponsTab;

