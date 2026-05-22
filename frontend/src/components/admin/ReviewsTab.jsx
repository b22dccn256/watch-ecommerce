import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, ShieldCheck, EyeOff, Trash2, Check, X, User, ExternalLink, CornerDownRight, MessageCircle } from "lucide-react";
import { renderStars } from "../../lib/renderStars";
import { useReviewsManagement } from "../../hooks/useReviewsManagement";

const ReviewsTab = () => {
	const {
		activeSection, setActiveSection, loading,
		reviews, questions,
		reviewFilter, setReviewFilter,
		reviewRating, setReviewRating,
		selectedReview, setSelectedReview,
		qaFilter, setQaFilter,
		selectedQuestion, setSelectedQuestion,
		replyContent, setReplyContent,
		filteredReviews, filteredQuestions, reviewStats,
		updateReviewStatus, deleteReview, submitReply,
	} = useReviewsManagement();

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<h2 className="text-2xl font-semibold text-primary flex items-center gap-3">
						<MessageSquare className="w-6 h-6 text-[color:var(--color-gold)]" />
						Reviews & Q&A
					</h2>
					<p className="text-sm text-secondary">
						Quản lý đánh giá sản phẩm và câu hỏi từ khách hàng.
					</p>
				</div>
			</div>

			{/* Sub-tabs */}
			<div className="flex flex-wrap gap-1 border-b border-black/8 dark:border-white/8 pb-px">
				{[
					{ key: "reviews", label: `Đánh Giá (${reviews.length})`, dot: reviewStats.pending > 0, dotColor: "bg-red-500" },
					{ key: "qa", label: `Hỏi Đáp (${questions.length})`, dot: questions.filter(q => !q.isAnswered).length > 0, dotColor: "bg-amber-500" },
				].map(tab => (
					<button
						key={tab.key}
						onClick={() => setActiveSection(tab.key)}
						className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition relative ${
							activeSection === tab.key
								? "border-[color:var(--color-gold)] text-[color:var(--color-gold)]"
								: "border-transparent text-secondary hover:text-primary"
						}`}
					>
						{tab.label}
						{tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />}
					</button>
				))}
			</div>

			{loading && <p className="text-sm text-muted">Đang tải dữ liệu...</p>}

			{/* Reviews Section */}
			{activeSection === "reviews" ? (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[
							{ label: "Tổng Reviews", value: reviewStats.total, color: "text-blue-500" },
							{ label: "Rating TB", value: <span className="flex items-center gap-1">{reviewStats.avg} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></span>, color: "text-yellow-500" },
							{ label: "Chờ Duyệt", value: reviewStats.pending, color: "text-red-500" },
							{ label: "Đã Ẩn", value: reviewStats.hidden, color: "text-muted" },
						].map((stat, i) => (
							<div key={i} className="rounded-2xl border border-black/8 dark:border-white/8 bg-surface p-5">
								<p className="text-[10px] font-semibold text-muted uppercase tracking-[0.18em]">{stat.label}</p>
								<p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
							</div>
						))}
					</div>

					{/* Filters */}
					<div className="flex flex-wrap gap-3">
						<select
							value={reviewFilter}
							onChange={(e) => setReviewFilter(e.target.value)}
							className="rounded-lg border border-black/10 dark:border-white/10 bg-surface px-4 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-gold)]"
						>
							<option value="all">Tất cả trạng thái</option>
							<option value="pending">⏳ Chờ duyệt</option>
							<option value="approved">✅ Đã duyệt</option>
							<option value="hidden">👁️ Đã ẩn</option>
						</select>
						<select
							value={reviewRating}
							onChange={(e) => setReviewRating(e.target.value)}
							className="rounded-lg border border-black/10 dark:border-white/10 bg-surface px-4 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-gold)]"
						>
							<option value="all">Tất cả sao</option>
							{[5,4,3,2,1].map(n => <option key={n} value={n}>{"⭐".repeat(n)} ({n})</option>)}
						</select>
					</div>

					{/* Table */}
					<div className="rounded-2xl border border-black/8 dark:border-white/8 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="border-b border-black/8 dark:border-white/8 bg-[color:var(--color-surface-2)]">
									<tr>
										{["Khách hàng","Sản phẩm","Đánh giá","Nội dung","Ngày","Trạng thái","Hành động"].map(h => (
											<th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted uppercase tracking-[0.12em] whitespace-nowrap">{h}</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-black/5 dark:divide-white/5">
									{filteredReviews.length === 0 ? (
										<tr><td colSpan="7" className="text-center py-10 text-muted">Không có đánh giá nào phù hợp.</td></tr>
									) : filteredReviews.map(r => (
										<tr key={r._id} className="transition hover:bg-[color:var(--color-surface-2)]">
											<td className="px-5 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<div className="w-7 h-7 rounded-full bg-[color:var(--color-surface-2)] border border-black/8 dark:border-white/8 flex items-center justify-center">
														<User className="w-3.5 h-3.5 text-muted" />
													</div>
													<span className="text-sm font-medium text-primary">{r.user.name}</span>
												</div>
											</td>
											<td className="px-5 py-4 whitespace-nowrap">
												<span className="text-sm text-luxury-gold hover:underline flex items-center gap-1 cursor-pointer">
													{r.product.name.substring(0, 18)}… <ExternalLink className="w-3 h-3" />
												</span>
											</td>
											<td className="px-5 py-4 whitespace-nowrap">
												<div className="flex">{renderStars(r.rating)}</div>
											</td>
											<td className="px-5 py-4 text-sm text-secondary max-w-xs truncate">{r.comment}</td>
											<td className="px-5 py-4 whitespace-nowrap text-sm text-muted">
												{new Date(r.createdAt).toLocaleDateString("vi-VN")}
											</td>
											<td className="px-5 py-4 whitespace-nowrap text-center">
												{r.status === "pending" && <span className="px-2.5 py-1 bg-luxury-gold/10 text-luxury-gold rounded-full text-[10px] font-semibold uppercase">Chờ duyệt</span>}
												{r.status === "approved" && <span className="px-2.5 py-1 bg-luxury-gold/10 text-luxury-gold rounded-full text-[10px] font-semibold uppercase">Đã duyệt</span>}
												{r.status === "hidden" && <span className="px-2.5 py-1 bg-black/8 text-muted dark:bg-white/8 rounded-full text-[10px] font-semibold uppercase">Đã ẩn</span>}
											</td>
											<td className="px-5 py-4 whitespace-nowrap text-right">
												<div className="flex justify-end gap-1">
													<button onClick={() => setSelectedReview(r)} className="p-1.5 rounded-lg text-luxury-gold hover:bg-luxury-gold/10 transition" title="Xem chi tiết">
														<Check className="w-4 h-4" />
													</button>
													<button onClick={() => deleteReview(r._id)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/8 transition" title="Xóa">
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</motion.div>
			) : (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
					{/* Q&A Filters */}
					<div className="flex gap-2">
						{[["all","Tất cả"],["unanswered","Chưa trả lời"],["answered","Đã trả lời"]].map(([val, lbl]) => (
							<button
								key={val}
								onClick={() => setQaFilter(val)}
								className={`relative px-4 py-2 text-sm font-semibold rounded-lg border transition ${
									qaFilter === val
										? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)] text-white"
										: "border-black/10 dark:border-white/10 text-secondary hover:text-primary"
								}`}
							>
								{lbl}
								{val === "unanswered" && questions.filter(q => !q.isAnswered).length > 0 && (
									<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface" />
								)}
							</button>
						))}
					</div>

					{/* Q&A Cards */}
					<div className="grid gap-4">
						{filteredQuestions.length === 0 ? (
							<div className="text-center py-12 text-muted rounded-2xl border border-black/8 dark:border-white/8">Không có câu hỏi nào.</div>
						) : filteredQuestions.map(q => (
							<div key={q._id} className="rounded-2xl border border-black/8 dark:border-white/8 bg-surface p-5 space-y-4">
								<div className="flex justify-between items-start gap-4">
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span className="font-semibold text-primary">{q.user.name}</span>
											<span className="text-xs text-muted">• {new Date(q.createdAt).toLocaleDateString("vi-VN")}</span>
											{!q.isAnswered && <span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold text-[10px] font-semibold uppercase rounded-full">Cần trả lời</span>}
										</div>
										<p className="text-sm text-secondary">{q.question}</p>
										<p className="text-xs text-luxury-gold hover:underline mt-2 flex items-center gap-1 cursor-pointer">
											Sản phẩm: {q.product.name} <ExternalLink className="w-3 h-3" />
										</p>
									</div>
									<button
										onClick={() => { setSelectedQuestion(q); setReplyContent(q.answer || ""); }}
										className="shrink-0 px-4 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-sm font-semibold text-secondary transition hover:text-primary hover:border-[color:var(--color-gold)]"
									>
										{q.isAnswered ? "Sửa câu trả lời" : "Trả lời ngay"}
									</button>
								</div>
								{q.isAnswered && (
									<div className="bg-[color:var(--color-surface-2)] p-3 rounded-xl border-l-2 border-[color:var(--color-gold)] flex gap-3">
										<CornerDownRight className="w-4 h-4 text-[color:var(--color-gold)] mt-0.5 shrink-0" />
										<div>
											<p className="text-xs font-bold text-[color:var(--color-gold)] mb-1">Cửa hàng trả lời:</p>
											<p className="text-sm text-secondary">{q.answer}</p>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</motion.div>
			)}

			<AnimatePresence>
				{/* Review Detail Modal */}
				{selectedReview && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReview(null)}>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-black/10 dark:border-white/10 bg-surface shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<div className="flex justify-between items-center mb-5">
								<h3 className="text-base font-semibold text-primary">Chi tiết Đánh Giá</h3>
								<button onClick={() => setSelectedReview(null)} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
							</div>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center">
										<User className="w-5 h-5 text-muted" />
									</div>
									<div>
										<p className="font-semibold text-primary">{selectedReview.user.name}</p>
										<p className="text-xs text-muted">{new Date(selectedReview.createdAt).toLocaleString("vi-VN")}</p>
									</div>
								</div>
								<div className="flex">{renderStars(selectedReview.rating)}</div>
								<p className="text-sm text-secondary bg-[color:var(--color-surface-2)] p-3 rounded-xl">{selectedReview.comment}</p>
								{selectedReview.images?.length > 0 && (
									<div className="flex gap-2">
										{selectedReview.images.map((img, i) => (
											<img key={i} src={img} alt="Review" className="w-20 h-20 object-cover rounded-xl border border-black/8 dark:border-white/8" />
										))}
									</div>
								)}
								<div className="pt-4 flex gap-3 border-t border-black/8 dark:border-white/8">
									{selectedReview.status !== "approved" && (
										<button onClick={() => updateReviewStatus(selectedReview._id, "approved")} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2">
											<ShieldCheck className="w-4 h-4" /> Duyệt hiển thị
										</button>
									)}
									{selectedReview.status !== "hidden" && (
										<button onClick={() => updateReviewStatus(selectedReview._id, "hidden")} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-secondary font-semibold text-sm flex items-center justify-center gap-2 hover:text-primary">
											<EyeOff className="w-4 h-4" /> Ẩn đánh giá
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
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-black/10 dark:border-white/10 bg-surface shadow-2xl p-6"
							onClick={e => e.stopPropagation()}
						>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-base font-semibold text-primary flex items-center gap-2"><MessageCircle className="w-5 h-5 text-luxury-gold" /> Phản hồi câu hỏi</h3>
								<button onClick={() => setSelectedQuestion(null)} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
							</div>
							<div className="bg-[color:var(--color-surface-2)] p-3 rounded-xl mb-4">
								<p className="text-xs text-muted mb-1 font-semibold">{selectedQuestion.user.name} hỏi:</p>
								<p className="text-sm text-primary">{selectedQuestion.question}</p>
							</div>
							<form onSubmit={submitReply}>
								<label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.14em] mb-2">Câu trả lời từ cửa hàng</label>
								<textarea
									required rows="4"
									value={replyContent}
									onChange={e => setReplyContent(e.target.value)}
									placeholder="Nhập câu trả lời..."
									className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] resize-none transition"
								/>
								<div className="flex justify-end gap-3 mt-4">
									<button type="button" onClick={() => setSelectedQuestion(null)} className="px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-sm font-semibold text-secondary hover:text-primary transition">Hủy</button>
									<button type="submit" className="px-6 py-2 rounded-full border border-[color:var(--color-gold)] text-[color:var(--color-gold)] text-sm font-semibold transition hover:bg-[color:var(--color-gold)] hover:text-white">Gửi phản hồi</button>
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
