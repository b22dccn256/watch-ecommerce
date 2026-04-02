import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, ShoppingBag, Lock, LogOut, ChevronRight, Eye, EyeOff, Package, ExternalLink, Truck, Copy, XCircle, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useOrderStore } from "../stores/useOrderStore";
import { Link } from "react-router-dom";

const ProfilePage = () => {
	const { user, logout, updateProfile, changePassword, loading: userLoading } = useUserStore();
	const { orders, fetchMyOrders, loading: ordersLoading, cancelOrder } = useOrderStore();
	const [activeTab, setActiveTab] = useState("info");
	const [selectedOrder, setSelectedOrder] = useState(null);

	// Profile Form State
	const [profileData, setProfileData] = useState({
		name: user?.name || "",
		phone: user?.phone || "",
	});
	const [profileErrors, setProfileErrors] = useState({ name: "", phone: "" });

	// Validation rules (same as backend)
	const NAME_REGEX = /^[\p{L}\s]{2,50}$/u;
	const PHONE_REGEX = /^(0[35789])\d{8}$/;

	const validateProfileField = (field, value) => {
		if (field === "name") {
			if (!value.trim()) return "Tên không được để trống";
			if (!NAME_REGEX.test(value.trim())) return "Tên chỉ chứa chữ cái và khoảng trắng (2–50 ký tự)";
		}
		if (field === "phone" && value.trim()) {
			if (!PHONE_REGEX.test(value.trim())) return "Số ĐT không hợp lệ (10 số, bắt đầu 03/05/07/08/09)";
		}
		return "";
	};

	// Password Form State
	const [pwdData, setPwdData] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPasswords, setShowPasswords] = useState({
		old: false,
		newPwd: false,
		confirm: false,
	});

	useEffect(() => {
		if (user) {
			setProfileData({
				name: user.name,
				phone: user.phone || "",
			});
			fetchMyOrders();
		}
	}, [user, fetchMyOrders]);

	const handleProfileChange = (e) => {
		const { name, value } = e.target;
		setProfileData((prev) => ({ ...prev, [name]: value }));
		// Clear error on type
		if (profileErrors[name]) setProfileErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleProfileBlur = (e) => {
		const { name, value } = e.target;
		const error = validateProfileField(name, value);
		setProfileErrors((prev) => ({ ...prev, [name]: error }));
	};

	const handleProfileSubmit = async (e) => {
		e.preventDefault();
		// Validate all fields before submitting
		const nameErr = validateProfileField("name", profileData.name);
		const phoneErr = validateProfileField("phone", profileData.phone);
		if (nameErr || phoneErr) {
			setProfileErrors({ name: nameErr, phone: phoneErr });
			return;
		}
		await updateProfile(profileData);
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		const success = await changePassword(pwdData);
		if (success) {
			setPwdData({
				oldPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		}
	};

	const menuItems = [
		{ id: "info", label: "Thông tin cá nhân", icon: UserIcon },
		{ id: "orders", label: "Lịch sử đơn hàng", icon: ShoppingBag },
		{ id: "password", label: "Đổi mật khẩu", icon: Lock },
	];

	const getStatusColor = (status) => {
		switch (status) {
			case "delivered":
			case "completed":
				return "text-emerald-400 bg-emerald-400/10";
			case "shipping":
				return "text-blue-400 bg-blue-400/10";
			case "pending":
			case "confirmed":
				return "text-yellow-400 bg-yellow-400/10";
			case "cancelled":
				return "text-red-400 bg-red-400/10";
			default:
				return "text-gray-400 bg-gray-400/10";
		}
	};

	const getStatusText = (status) => {
		switch (status) {
			case "delivered":
			case "completed": return "HOÀN THÀNH";
			case "shipping": return "ĐANG GIAO";
			case "pending": return "ĐANG CHỜ";
			case "confirmed": return "ĐÃ XÁC NHẬN";
			case "cancelled": return "ĐÃ HỦY";
			default: return status?.toUpperCase();
		}
	};

	return (
		<div className='min-h-screen pt-28 pb-20 px-4'>
			<div className='max-w-6xl mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
					{/* SIDEBAR */}
					<div className='lg:col-span-1 space-y-6'>
						<div className='bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none rounded-2xl p-6 flex flex-col items-center text-center'>
							<div className='w-24 h-24 rounded-full bg-luxury-gold/10 border-2 border-luxury-gold flex items-center justify-center mb-4 overflow-hidden'>
								{user?.avatar ? (
									<img src={user.avatar} alt={user.name} className='w-full h-full object-cover' />
								) : (
									<UserIcon className='w-12 h-12 text-luxury-gold' />
								)}
							</div>
							<h2 className='text-xl font-bold text-gray-900 dark:text-white'>{user?.name || "Khách hàng"}</h2>
							<p className='text-luxury-gold text-xs font-semibold tracking-wider uppercase mt-1'>
								{user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
							</p>
							{/* Reward Points Display */}
							{typeof user?.rewardPoints === 'number' && (
								<div className="mt-3 flex flex-col items-center">
									<span className="text-xs text-gray-500 dark:text-luxury-text-muted">Điểm thưởng hiện tại</span>
									<span className="text-2xl font-bold text-luxury-gold">{user.rewardPoints.toLocaleString("vi-VN")} điểm</span>
									{typeof user?.totalPointsEarned === 'number' && (
										<span className="text-[10px] text-gray-400 dark:text-luxury-text-muted mt-1">Tổng tích lũy: {user.totalPointsEarned.toLocaleString("vi-VN")} điểm</span>
									)}
								</div>
							)}
						</div>

						<nav className='bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none rounded-2xl overflow-hidden'>
							{menuItems.map((item) => (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors border-b border-gray-100 dark:border-luxury-border last:border-0 ${activeTab === item.id
										? "bg-luxury-gold/10 text-luxury-gold"
										: "text-gray-500 dark:text-luxury-text-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
										}`}
								>
									<div className='flex items-center gap-3'>
										<item.icon className='w-5 h-5' />
										{item.label}
									</div>
									<ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? "rotate-90" : ""}`} />
								</button>
							))}
							<button
								onClick={logout}
								className='w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-400 hover:bg-red-400/5 transition-colors'
							>
								<LogOut className='w-5 h-5' />
								Đăng xuất
							</button>
						</nav>
					</div>

					{/* CONTENT */}
					<div className='lg:col-span-3 space-y-8'>
						<AnimatePresence mode='wait'>
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								key={activeTab}
								className='bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none rounded-3xl p-8 min-h-[500px]'
							>
								{activeTab === "info" && (
									<form onSubmit={handleProfileSubmit} className='space-y-8'>
										<div>
											<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Hồ sơ cá nhân</h1>
											<p className='text-gray-500 dark:text-luxury-text-muted mt-2'>Quản lý thông tin tài khoản của bạn.</p>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
											<div className='space-y-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Họ và tên <span className="text-red-500">*</span></label>
												<input
													type="text"
													name="name"
													value={profileData.name}
													onChange={handleProfileChange}
													onBlur={handleProfileBlur}
													className={`w-full bg-gray-50 dark:bg-luxury-dark border ${profileErrors.name ? "border-red-400 focus:border-red-400" : "border-gray-200 dark:border-luxury-border focus:border-luxury-gold"} text-gray-900 dark:text-white px-5 py-3 rounded-xl focus:outline-none transition`}
													required
												/>
												{profileErrors.name && (
													<p className="flex items-center gap-1 text-xs text-red-500 mt-1">
														<AlertCircle className="h-3 w-3 flex-shrink-0" />{profileErrors.name}
													</p>
												)}
											</div>
											<div className='space-y-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Số điện thoại</label>
												<input
													type="text"
													name="phone"
													value={profileData.phone}
													onChange={handleProfileChange}
													onBlur={handleProfileBlur}
													placeholder="Ví dụ: 0912345678"
													className={`w-full bg-gray-50 dark:bg-luxury-dark border ${profileErrors.phone ? "border-red-400 focus:border-red-400" : "border-gray-200 dark:border-luxury-border focus:border-luxury-gold"} text-gray-900 dark:text-white px-5 py-3 rounded-xl focus:outline-none transition`}
												/>
												{profileErrors.phone && (
													<p className="flex items-center gap-1 text-xs text-red-500 mt-1">
														<AlertCircle className="h-3 w-3 flex-shrink-0" />{profileErrors.phone}
													</p>
												)}
											</div>
											<div className='space-y-2 col-span-1 md:col-span-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Email (Không thể thay đổi)</label>
												<div className='relative'>
													<input
														type="email"
														value={user?.email || ""}
														disabled
														className='w-full bg-gray-100 dark:bg-luxury-dark/50 border border-gray-200 dark:border-luxury-border text-gray-500 dark:text-luxury-text-muted px-5 py-3 rounded-xl cursor-not-allowed'
													/>
													<Lock className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-luxury-text-muted' />
												</div>
											</div>
										</div>

										<div className='flex justify-end pt-4'>
											<button
												type="submit"
												disabled={userLoading}
												className='bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-10 py-4 rounded-xl font-bold transition duration-300 shadow-lg shadow-luxury-gold/20 disabled:opacity-50'
											>
												{userLoading ? "Đang xử lý..." : "Lưu thay đổi"}
											</button>
										</div>
									</form>
								)}

								{activeTab === "orders" && (
									<div className='space-y-8'>
										<div className='flex items-center justify-between'>
											<h1 className='text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3'>
												<ShoppingBag className='w-8 h-8 text-luxury-gold' /> Lịch sử đơn hàng
											</h1>
										</div>

										{ordersLoading ? (
											<div className='space-y-4'>
												{[1, 2, 3].map((i) => (
													<div key={i} className='h-20 bg-white/5 animate-pulse rounded-2xl border border-luxury-border' />
												))}
											</div>
										) : orders.length > 0 ? (
											<div className='overflow-x-auto'>
												<table className='w-full'>
													<thead>
														<tr className='text-left border-b border-gray-100 dark:border-luxury-border'>
															<th className='pb-4 text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Đơn hàng</th>
															<th className='pb-4 text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Ngày đặt</th>
															<th className='pb-4 text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Tổng cộng</th>
															<th className='pb-4 text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Trạng thái</th>
															<th className='pb-4 text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider text-right'>Chi tiết</th>
														</tr>
													</thead>
													<tbody className='divide-y divide-gray-100 dark:divide-luxury-border'>
														{orders.map((order) => (
															<tr
																key={order._id}
																onClick={() => setSelectedOrder(order)}
																className='group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer'
															>
																<td className='py-6'>
																	<div className='font-bold text-gray-900 dark:text-white'>#{order.orderCode || order._id.slice(-6).toUpperCase()}</div>
																	<div className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>{order.products?.length} sản phẩm</div>
																</td>
																<td className='py-6 text-gray-500 dark:text-luxury-text-muted text-sm'>
																	{new Date(order.createdAt).toLocaleDateString("vi-VN")}
																</td>
																<td className='py-6 font-bold text-luxury-gold'>
																	{order.totalAmount?.toLocaleString("vi-VN")}đ
																</td>
																<td className='py-6'>
																	<span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusColor(order.status)}`}>
																		{getStatusText(order.status)}
																	</span>
																</td>
																<td className='py-6 text-right'>
																	<div className='flex items-center gap-2 justify-end'>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setSelectedOrder(order);
																			}}
																			className='p-2 hover:bg-luxury-gold/10 rounded-full transition-colors group-hover:text-luxury-gold text-gray-400 dark:text-gray-400'
																			title="Xem chi tiết"
																		>
																			<Eye className='w-5 h-5' />
																		</button>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setSelectedOrder(order);
																			}}
																			className='hidden xl:inline-flex items-center gap-1 rounded-full border border-luxury-border px-3 py-1 text-[11px] font-semibold text-gray-600 dark:text-luxury-text-muted hover:border-luxury-gold hover:text-luxury-gold transition-colors'
																		>
																			Xem chi tiết
																		</button>
																		{order.trackingToken && (
																			<Link
																				to={`/order-tracking/${order.trackingToken}`}
																				onClick={(e) => e.stopPropagation()}
																				className='p-2 hover:bg-emerald-500/10 rounded-full transition-colors text-gray-400 hover:text-emerald-500'
																				title="Theo dõi vận chuyển"
																			>
																				<ExternalLink className='w-5 h-5' />
																			</Link>
																		)}
																		{order.status === 'pending' && (
																			<button
																				onClick={async (e) => {
																					e.stopPropagation();
																					if (window.confirm(`Hủy đơn hàng #${order.orderCode}? Hành động này không thể hoàn tác.`)) {
																						await cancelOrder(order._id);
																					}
																				}}
																				className='p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-400 hover:text-red-500'
																				title="Hủy đơn hàng"
																			>
																				<XCircle className='w-5 h-5' />
																			</button>
																		)}
																		{/* Request Return button for delivered orders */}
																		{order.status === 'delivered' && (
																			<button
																				onClick={async (e) => {
																					e.stopPropagation();
																					if (window.confirm(`Yêu cầu trả hàng cho đơn #${order.orderCode}?`)) {
																						await requestReturnOrder(order._id);
																					}
																				}}
																				className='p-2 hover:bg-yellow-400/10 rounded-full transition-colors text-gray-400 hover:text-yellow-500'
																				title="Yêu cầu trả hàng"
																			>
																				<Package className='w-5 h-5' />
																			</button>
																		)}
																	</div>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										) : (
											<div className='flex flex-col items-center justify-center py-20 text-center gap-4'>
												<div className='w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center'>
													<Package className='w-10 h-10 text-gray-400 dark:text-luxury-text-muted opacity-20' />
												</div>
												<div>
													<h3 className='text-xl font-bold text-gray-900 dark:text-white'>Chưa có đơn hàng nào</h3>
													<p className='text-gray-500 dark:text-luxury-text-muted mt-2'>Bắt đầu mua sắm để nhận những ưu đãi tốt nhất.</p>
												</div>
												<Link to='/catalog' className='mt-4 bg-luxury-gold text-luxury-dark px-8 py-3 rounded-xl font-bold hover:bg-luxury-gold-light transition duration-300'>
													Mua sắm ngay
												</Link>
											</div>
										)}
									</div>
								)}

								{activeTab === "password" && (
									<form onSubmit={handlePasswordSubmit} className='space-y-8'>
										<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Đổi mật khẩu</h1>
										<div className='max-w-md space-y-6'>
											<div className='space-y-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Mật khẩu hiện tại</label>
												<div className='relative'>
													<input
														type={showPasswords.old ? "text" : "password"}
														value={pwdData.oldPassword}
														onChange={(e) => setPwdData({ ...pwdData, oldPassword: e.target.value })}
														className='w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border focus:border-luxury-gold text-gray-900 dark:text-white px-5 py-3 pr-12 rounded-xl focus:outline-none transition'
														required
													/>
													<button type='button' onClick={() => setShowPasswords(p => ({ ...p, old: !p.old }))} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition'>
														{showPasswords.old ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
													</button>
												</div>
											</div>
											<div className='space-y-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Mật khẩu mới</label>
												<div className='relative'>
													<input
														type={showPasswords.newPwd ? "text" : "password"}
														value={pwdData.newPassword}
														onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
														className='w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border focus:border-luxury-gold text-gray-900 dark:text-white px-5 py-3 pr-12 rounded-xl focus:outline-none transition'
														required
													/>
													<button type='button' onClick={() => setShowPasswords(p => ({ ...p, newPwd: !p.newPwd }))} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition'>
														{showPasswords.newPwd ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
													</button>
												</div>
											</div>
											<div className='space-y-2'>
												<label className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>Xác nhận mật khẩu mới</label>
												<div className='relative'>
													<input
														type={showPasswords.confirm ? "text" : "password"}
														value={pwdData.confirmPassword}
														onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
														className='w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border focus:border-luxury-gold text-gray-900 dark:text-white px-5 py-3 pr-12 rounded-xl focus:outline-none transition'
														required
													/>
													<button type='button' onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition'>
														{showPasswords.confirm ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
													</button>
												</div>
											</div>
											<button
												type='submit'
												disabled={userLoading}
												className='w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark py-4 rounded-xl font-bold transition duration-300 disabled:opacity-50'
											>
												{userLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
											</button>
										</div>
									</form>
								)}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>

			{/* ORDER DETAIL MODAL */}
			<AnimatePresence>
				{selectedOrder && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'
						onClick={() => setSelectedOrder(null)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							className='bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-2xl rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'
							onClick={(e) => e.stopPropagation()}
						>
							<div className='p-8'>
								{/* Header */}
								<div className='flex justify-between items-start mb-8'>
									<div>
										<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
											Chi tiết đơn hàng #{selectedOrder.orderCode || selectedOrder._id.slice(-6).toUpperCase()}
										</h2>
										<p className='text-gray-500 dark:text-luxury-text-muted text-sm flex items-center gap-2'>
											Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
											{selectedOrder.trackingToken && (
												<button
													onClick={() => {
														navigator.clipboard.writeText(selectedOrder.trackingToken);
														toast.success("Đã sao chép mã theo dõi!");
													}}
													className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-400 hover:text-luxury-gold transition-colors"
													title="Sao chép mã theo dõi"
												>
													<Copy size={14} />
												</button>
											)}
										</p>
									</div>
									<button
										onClick={() => setSelectedOrder(null)}
										className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white'
									>
										<ChevronRight className='w-6 h-6 rotate-180' />
									</button>
								</div>

								{/* Order Status Timeline with Tracking Link */}
								<div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
											<Truck className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<p className="text-sm font-bold text-white uppercase tracking-tight">Trạng thái: {getStatusText(selectedOrder.status)}</p>
											<p className="text-[10px] text-emerald-500 font-medium">Cập nhật lúc: {new Date(selectedOrder.updatedAt).toLocaleTimeString("vi-VN")}</p>
										</div>
									</div>
									<Link
										to={`/order-tracking/${selectedOrder.trackingToken}`}
										className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
									>
										Theo dõi hành trình <ExternalLink className="w-4 h-4" />
									</Link>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
									{/* Shipping Info */}
									<div className='bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-luxury-border'>
										<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest mb-4'>Thông tin giao hàng</h3>
										<div className='space-y-3 text-sm'>
											<p className='text-gray-900 dark:text-white'><span className='text-gray-500 dark:text-luxury-text-muted'>Người nhận:</span> {selectedOrder.shippingDetails?.fullName}</p>
											<p className='text-gray-900 dark:text-white'><span className='text-gray-500 dark:text-luxury-text-muted'>Số điện thoại:</span> {selectedOrder.shippingDetails?.phoneNumber}</p>
											<p className='text-gray-900 dark:text-white'><span className='text-gray-500 dark:text-luxury-text-muted'>Địa chỉ:</span> {selectedOrder.shippingDetails?.address}</p>
										</div>
									</div>

									{/* Payment Info */}
									<div className='bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-luxury-border'>
										<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest mb-4'>Thanh toán</h3>
										<div className='space-y-3 text-sm'>
											<p className='text-gray-900 dark:text-white'><span className='text-gray-500 dark:text-luxury-text-muted'>Phương thức:</span> {selectedOrder.paymentMethod?.toUpperCase()}</p>
											<p className='text-gray-900 dark:text-white'>
												<span className='text-gray-500 dark:text-luxury-text-muted'>Trạng thái:</span>{" "}
												<span className={selectedOrder.paymentStatus === "paid" ? "text-emerald-500 dark:text-emerald-400" : "text-yellow-600 dark:text-yellow-400"}>
													{selectedOrder.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
												</span>
											</p>
											<p className='text-2xl font-bold text-luxury-gold mt-4'>
												{selectedOrder.totalAmount?.toLocaleString("vi-VN")}đ
											</p>
										</div>
									</div>
								</div>

								{/* Product List */}
								<div className='space-y-4 mb-8'>
									<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest'>Sản phẩm</h3>
									<div className='border border-gray-100 dark:border-luxury-border rounded-2xl overflow-hidden'>
										{selectedOrder.products?.map((item, idx) => (
											<div key={idx} className='flex items-center gap-4 p-4 border-b border-gray-100 dark:border-luxury-border last:border-0 bg-gray-50 dark:bg-white/5'>
												<div className='w-20 h-20 bg-gray-100 dark:bg-luxury-dark rounded-xl overflow-hidden border border-gray-200 dark:border-luxury-border flex-shrink-0'>
													<img src={item.product?.image} alt={item.product?.name} className='w-full h-full object-cover' />
												</div>
												<div className='flex-grow min-w-0'>
													<h4 className='text-gray-900 dark:text-white font-bold truncate'>{item.product?.name}</h4>
													<p className='text-gray-500 dark:text-luxury-text-muted text-xs mt-1'>Số lượng: {item.quantity}</p>
												</div>
												<div className='text-right'>
													<p className='text-luxury-gold font-bold'>{item.price?.toLocaleString("vi-VN")}đ</p>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Order Status Timeline */}
								<div className='pt-6 border-t border-luxury-border'>
									<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest mb-6'>Trạng thái đơn hàng</h3>
									<div className='relative flex justify-between'>
										{[
											{ key: "pending", label: "Đang chờ" },
											{ key: "confirmed", label: "Đã xác nhận" },
											{ key: "shipping", label: "Đang giao" },
											{ key: "completed", label: "Hoàn thành" },
										].map((step, idx, arr) => {
											const statuses = ["pending", "confirmed", "shipping", "delivered", "completed"];
											const currentIdx = statuses.indexOf(selectedOrder.status === "delivered" ? "completed" : selectedOrder.status);
											const isDone = idx <= currentIdx;

											return (
												<div key={step.key} className='flex flex-col items-center relative z-10 flex-1'>
													<div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors duration-500 ${isDone ? "bg-luxury-gold text-luxury-dark" : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-luxury-text-muted border border-gray-200 dark:border-luxury-border"}`}>
														{isDone ? <Eye className='w-4 h-4' /> : idx + 1}
													</div>
													<span className={`text-[10px] font-bold uppercase tracking-tighter ${isDone ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-luxury-text-muted"}`}>
														{step.label}
													</span>
													{idx < arr.length - 1 && (
														<div className={`absolute left-1/2 top-4 w-full h-[2px] -z-10 ${idx < currentIdx ? "bg-luxury-gold" : "bg-gray-100 dark:bg-white/10"}`} />
													)}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default ProfilePage;
