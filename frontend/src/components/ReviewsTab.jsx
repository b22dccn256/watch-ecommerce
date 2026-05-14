import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, Search, Filter, ShieldCheck, EyeOff, Trash2, Check, X, User, ExternalLink, CornerDownRight, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { confirmToast } from "../lib/confirmToast";

// MOCK DATA for Admin UI demonstration
const INITIAL_REVIEWS = [
	{
		_id: "r1",
		user: { name: "Nguyá»…n VÄƒn A", avatar: null },
		product: { name: "Rolex Submariner Date 41mm", _id: "p1" },
		rating: 5,
		comment: "Äá»“ng há»“ ráº¥t Ä‘áº¹p, Ä‘Ăºng nhÆ° mĂ´ táº£. Giao hĂ ng nhanh bá»c ká»¹.",
		images: [],
		status: "approved", // pending, approved, hidden
		createdAt: new Date(Date.now() - 86400000).toISOString()
	},
	{
		_id: "r2",
		user: { name: "Tráº§n Thá»‹ B", avatar: null },
		product: { name: "Omega Speedmaster Moonwatch", _id: "p2" },
		rating: 3,
		comment: "Há»™p bá»‹ mĂ³p chĂºt trong quĂ¡ trĂ¬nh váº­n chuyá»ƒn, nhÆ°ng Ä‘á»“ng há»“ an toĂ n. Chá» support pháº£n há»“i.",
		images: ["https://via.placeholder.com/150"],
		status: "pending",
		createdAt: new Date(Date.now() - 3600000).toISOString()
	},
	{
		_id: "r3",
		user: { name: "LĂª Minh C", avatar: null },
		product: { name: "Patek Philippe Nautilus", _id: "p3" },
		rating: 1,
		comment: "Spam comment test xxxxxxxxxx",
		images: [],
		status: "hidden",
		createdAt: new Date(Date.now() - 250000000).toISOString()
	}
];

const INITIAL_QUESTIONS = [
	{
		_id: "q1",
		user: { name: "HoĂ ng Duy" },
		product: { name: "Rolex Submariner Date 41mm", _id: "p1" },
		question: "DĂ²ng nĂ y cĂ³ sáºµn á»Ÿ showroom quáº­n 1 khĂ´ng shop?",
		answer: "Dáº¡ sáº£n pháº©m hiá»‡n Ä‘ang cĂ³ sáºµn táº¡i showroom quáº­n 1, anh cĂ³ thá»ƒ ghĂ© xem trá»±c tiáº¿p áº¡.",
		isAnswered: true,
		createdAt: new Date(Date.now() - 170000000).toISOString()
	},
	{
		_id: "q2",
		user: { name: "Pháº¡m TĂ¹ng" },
		product: { name: "Omega Speedmaster Moonwatch", _id: "p2" },
		question: "Báº£o hĂ nh quá»‘c táº¿ máº¥y nÄƒm váº­y?",
		answer: null,
		isAnswered: false,
		createdAt: new Date(Date.now() - 600000).toISOString()
	}
];

const renderStars = (rating) => {
	return [...Array(5)].map((_, i) => (
		<Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
	));
};

const ReviewsTab = () => {
	const [activeSection, setActiveSection] = useState("reviews"); // reviews, qa

	// Reviews State
	const [reviews, setReviews] = useState(INITIAL_REVIEWS);
	const [reviewFilter, setReviewFilter] = useState("all");
	const [reviewRating, setReviewRating] = useState("all");
	const [selectedReview, setSelectedReview] = useState(null);

	// Q&A State
	const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
	const [qaFilter, setQaFilter] = useState("all");
	const [selectedQuestion, setSelectedQuestion] = useState(null);
	const [replyContent, setReplyContent] = useState("");

	// --- REVIEWS LOGIC ---
	const filteredReviews = useMemo(() => {
		return reviews.filter(r => {
			if (reviewFilter !== "all" && r.status !== reviewFilter) return false;
			if (reviewRating !== "all" && r.rating !== Number(reviewRating)) return false;
			return true;
		});
	}, [reviews, reviewFilter, reviewRating]);

	const updateReviewStatus = (id, newStatus) => {
		setReviews(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
		toast.success(`ÄĂ£ chuyá»ƒn tráº¡ng thĂ¡i thĂ nh: ${newStatus}`);
		if (selectedReview?._id === id) setSelectedReview(null);
	};

	const deleteReview = (id) => {
		confirmToast("XĂ³a vÄ©nh viá»…n Ä‘Ă¡nh giĂ¡ nĂ y?", () => {
			setReviews(prev => prev.filter(r => r._id !== id));
			toast.success("ÄĂ£ xĂ³a Ä‘Ă¡nh giĂ¡");
			if (selectedReview?._id === id) setSelectedReview(null);
		});
	};

	const reviewStats = useMemo(() => {
		const total = reviews.length;
		const avg = total > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : 0;
		const pending = reviews.filter(r => r.status === "pending").length;
		const hidden = reviews.filter(r => r.status === "hidden").length;
		return { total, avg, pending, hidden };
	}, [reviews]);

	// --- Q&A LOGIC ---
	const filteredQuestions = useMemo(() => {
		return questions.filter(q => {
			if (qaFilter === "answered" && !q.isAnswered) return false;
			if (qaFilter === "unanswered" && q.isAnswered) return false;
			return true;
		});
	}, [questions, qaFilter]);

	const submitReply = (e) => {
		e.preventDefault();
		if (!replyContent.trim()) return;
		
		setQuestions(prev => prev.map(q => 
			q._id === selectedQuestion._id ? { ...q, answer: replyContent, isAnswered: true } : q
		));
		toast.success("ÄĂ£ gá»­i cĂ¢u tráº£ lá»i");
		setSelectedQuestion(null);
		setReplyContent("");
	};

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
						<MessageSquare className="text-luxury-gold w-8 h-8" />
						Reviews & Q&A
					</h1>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm">
						Quáº£n lĂ½ Ä‘Ă¡nh giĂ¡ sáº£n pháº©m vĂ  cĂ¢u há»i tá»« khĂ¡ch hĂ ng.
					</p>
				</div>
			</div>

			{/* Sub-tabs Navigation */}
			<div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-luxury-border pb-px">
				<button
					onClick={() => setActiveSection("reviews")}
					className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
						activeSection === "reviews"
							? "border-luxury-gold text-luxury-gold" 
							: "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
					}`}
				>
					ÄĂ¡nh GiĂ¡ ({reviews.length})
					{reviewStats.pending > 0 && <span className="bg-red-500 w-2 h-2 rounded-full ml-1" />}
					{activeSection === "reviews" && <motion.div layoutId="activeRevTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />}
				</button>
				<button
					onClick={() => setActiveSection("qa")}
					className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
						activeSection === "qa"
							? "border-luxury-gold text-luxury-gold" 
							: "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
					}`}
				>
					Há»i ÄĂ¡p ({questions.length})
					{questions.filter(q => !q.isAnswered).length > 0 && <span className="bg-amber-500 w-2 h-2 rounded-full ml-1" />}
					{activeSection === "qa" && <motion.div layoutId="activeRevTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />}
				</button>
			</div>

			{activeSection === "reviews" ? (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
					
					{/* Stats Grid */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
						<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl">
							<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tá»•ng Reviews</p>
							<p className="text-2xl font-bold mt-1 text-blue-500">{reviewStats.total}</p>
						</div>
						<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl">
							<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rating Trung BĂ¬nh</p>
							<p className="text-2xl font-bold mt-1 text-yellow-500 flex items-center gap-1">
								{reviewStats.avg} <Star className="w-5 h-5 fill-yellow-500" />
							</p>
						</div>
						<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl">
							<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chá» Duyá»‡t</p>
							<p className="text-2xl font-bold mt-1 text-red-400">{reviewStats.pending}</p>
						</div>
						<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl">
							<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ÄĂ£ áº¨n</p>
							<p className="text-2xl font-bold mt-1 text-gray-500">{reviewStats.hidden}</p>
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-wrap gap-3">
						<select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)} className="bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white outline-none">
							<option value="all">Táº¥t cáº£ tráº¡ng thĂ¡i</option>
							<option value="pending">â³ Chá» duyá»‡t</option>
							<option value="approved">âœ… ÄĂ£ duyá»‡t</option>
							<option value="hidden">đŸ‘ï¸ ÄĂ£ áº©n</option>
						</select>
						<select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} className="bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white outline-none">
							<option value="all">Táº¥t cáº£ sao</option>
							<option value="5">â­â­â­â­â­ (5)</option>
							<option value="4">â­â­â­â­ (4)</option>
							<option value="3">â­â­â­ (3)</option>
							<option value="2">â­â­ (2)</option>
							<option value="1">â­ (1)</option>
						</select>
					</div>

					{/* Table Reviews */}
					<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl overflow-hidden shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-100 dark:divide-luxury-border">
								<thead className="bg-gray-50 dark:bg-luxury-darker">
									<tr>
										<th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">KhĂ¡ch hĂ ng</th>
										<th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sáº£n pháº©m</th>
										<th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">ÄĂ¡nh giĂ¡</th>
										<th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Ná»™i dung (TrĂ­ch dáº«n)</th>
										<th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">NgĂ y</th>
										<th className="px-5 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tráº¡ng thĂ¡i</th>
										<th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">HĂ nh Ä‘á»™ng</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100 dark:divide-luxury-border">
									{filteredReviews.length === 0 ? (
										<tr><td colSpan="7" className="text-center py-8 text-gray-400">KhĂ´ng cĂ³ Ä‘Ă¡nh giĂ¡ nĂ o phĂ¹ há»£p.</td></tr>
									) : (
										filteredReviews.map(r => (
											<tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
												<td className="px-5 py-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
															<User className="w-3 h-3 text-gray-500" />
														</div>
														<span className="text-sm font-semibold text-gray-900 dark:text-white">{r.user.name}</span>
													</div>
												</td>
												<td className="px-5 py-4 whitespace-nowrap">
													<a href={`#`} className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1 group">
														{r.product.name.substring(0, 20)}... <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
													</a>
												</td>
												<td className="px-5 py-4 whitespace-nowrap">
													<div className="flex">{renderStars(r.rating)}</div>
												</td>
												<td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
													{r.comment}
												</td>
												<td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
													{new Date(r.createdAt).toLocaleDateString("vi-VN")}
												</td>
												<td className="px-5 py-4 whitespace-nowrap text-center">
													{r.status === "pending" && <span className="px-2 py-1 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold uppercase">Chá» duyá»‡t</span>}
													{r.status === "approved" && <span className="px-2 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold uppercase">ÄĂ£ duyá»‡t</span>}
													{r.status === "hidden" && <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded text-[10px] font-bold uppercase">ÄĂ£ áº©n</span>}
												</td>
												<td className="px-5 py-4 whitespace-nowrap text-right">
													<div className="flex justify-end gap-1">
														<button onClick={() => setSelectedReview(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Xem chi tiáº¿t">
															<Check className="w-4 h-4" /> {/* Click to view & approve */}
														</button>
														<button onClick={() => deleteReview(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="XĂ³a xĂ³a">
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

				</motion.div>
			) : (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
					
					{/* Filters */}
					<div className="flex gap-3">
						<button onClick={() => setQaFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${qaFilter === "all" ? "bg-luxury-gold text-white border-luxury-gold" : "bg-white dark:bg-luxury-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-luxury-border"}`}>
							Táº¥t cáº£
						</button>
						<button onClick={() => setQaFilter("unanswered")} className={`relative px-4 py-2 text-sm font-bold rounded-lg border transition ${qaFilter === "unanswered" ? "bg-luxury-gold text-white border-luxury-gold" : "bg-white dark:bg-luxury-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-luxury-border"}`}>
							ChÆ°a tráº£ lá»i {questions.filter(q => !q.isAnswered).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-luxury-darker" />}
						</button>
						<button onClick={() => setQaFilter("answered")} className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${qaFilter === "answered" ? "bg-luxury-gold text-white border-luxury-gold" : "bg-white dark:bg-luxury-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-luxury-border"}`}>
							ÄĂ£ tráº£ lá»i
						</button>
					</div>

					{/* Q&A List Cards */}
					<div className="grid gap-4">
						{filteredQuestions.length === 0 ? (
							<div className="text-center py-12 text-gray-400 bg-white dark:bg-luxury-dark rounded-xl border border-gray-100 dark:border-luxury-border">KhĂ´ng cĂ³ cĂ¢u há»i nĂ o.</div>
						) : (
							filteredQuestions.map(q => (
								<div key={q._id} className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5 shadow-sm space-y-4">
									<div className="flex justify-between items-start gap-4">
										<div>
											<div className="flex items-center gap-2 mb-1">
												<span className="font-bold text-gray-900 dark:text-white">{q.user.name}</span>
												<span className="text-xs text-gray-400">â€¢ {new Date(q.createdAt).toLocaleDateString("vi-VN")}</span>
												{!q.isAnswered && <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold uppercase rounded">Cáº§n tráº£ lá»i</span>}
											</div>
											<p className="text-sm text-gray-700 dark:text-gray-200">{q.question}</p>
											<p className="text-xs text-blue-500 hover:underline mt-2 flex items-center gap-1 cursor-pointer">Sáº£n pháº©m: {q.product.name} <ExternalLink className="w-3 h-3" /></p>
										</div>
										<button 
											onClick={() => { setSelectedQuestion(q); setReplyContent(q.answer || ""); }}
											className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition"
										>
											{q.isAnswered ? "Sá»­a cĂ¢u tráº£ lá»i" : "Tráº£ lá»i ngay"}
										</button>
									</div>

									{q.isAnswered && (
										<div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border-l-2 border-luxury-gold flex gap-3 mt-4">
											<CornerDownRight className="w-4 h-4 text-luxury-gold mt-0.5 shrink-0" />
											<div>
												<p className="text-xs font-bold text-luxury-gold mb-1">Cá»­a hĂ ng tráº£ lá»i:</p>
												<p className="text-sm text-gray-700 dark:text-gray-300">{q.answer}</p>
											</div>
										</div>
									)}
								</div>
							))
						)}
					</div>
				</motion.div>
			)}

			{/* Review Detail Modal */}
			<AnimatePresence>
				{selectedReview && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReview(null)}>
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-bold">Chi tiáº¿t ÄĂ¡nh GiĂ¡</h3>
								<button onClick={() => setSelectedReview(null)}><X className="w-5 h-5 text-gray-400" /></button>
							</div>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
										<User className="w-5 h-5 text-gray-500" />
									</div>
									<div>
										<p className="font-bold text-gray-900 dark:text-white">{selectedReview.user.name}</p>
										<p className="text-xs text-gray-400">{new Date(selectedReview.createdAt).toLocaleString("vi-VN")}</p>
									</div>
								</div>
								
								<div className="flex">{renderStars(selectedReview.rating)}</div>
								
								<p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-luxury-dark p-3 rounded-lg">
									{selectedReview.comment}
								</p>

								{selectedReview.images && selectedReview.images.length > 0 && (
									<div className="flex gap-2">
										{selectedReview.images.map((img, i) => (
											<img key={i} src={img} alt="Review" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
										))}
									</div>
								)}

								<div className="pt-4 flex gap-3 border-t border-gray-100 dark:border-luxury-border">
									{selectedReview.status !== "approved" && (
										<button onClick={() => updateReviewStatus(selectedReview._id, "approved")} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2">
											<ShieldCheck className="w-4 h-4" /> Duyá»‡t hiá»ƒn thá»‹
										</button>
									)}
									{selectedReview.status !== "hidden" && (
										<button onClick={() => updateReviewStatus(selectedReview._id, "hidden")} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
											<EyeOff className="w-4 h-4" /> áº¨n Ä‘Ă¡nh giĂ¡
										</button>
									)}
								</div>
							</div>
						</motion.div>
					</div>
				)}

				{/* Q&A Reply Modal */}
				{selectedQuestion && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQuestion(null)}>
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-500" /> Pháº£n há»“i cĂ¢u há»i</h3>
								<button onClick={() => setSelectedQuestion(null)}><X className="w-5 h-5 text-gray-400" /></button>
							</div>
							
							<div className="bg-gray-50 dark:bg-luxury-dark p-3 rounded-lg mb-4">
								<p className="text-xs text-gray-500 mb-1 font-bold">{selectedQuestion.user.name} há»i:</p>
								<p className="text-sm text-gray-800 dark:text-gray-200">{selectedQuestion.question}</p>
							</div>

							<form onSubmit={submitReply}>
								<label className="block text-xs font-bold text-gray-500 uppercase mb-2">CĂ¢u tráº£ lá»i tá»« cá»­a hĂ ng</label>
								<textarea
									required rows="4"
									value={replyContent}
									onChange={e => setReplyContent(e.target.value)}
									placeholder="Nháº­p cĂ¢u tráº£ lá»i..."
									className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-luxury-gold"
								/>
								<div className="flex justify-end gap-3 mt-4">
									<button type="button" onClick={() => setSelectedQuestion(null)} className="px-4 py-2 border dark:border-gray-700 rounded-lg text-sm font-bold">Há»§y</button>
									<button type="submit" className="px-6 py-2 bg-luxury-gold hover:bg-yellow-500 text-luxury-dark rounded-lg text-sm font-bold">Gá»­i pháº£n há»“i</button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default ReviewsTab;

