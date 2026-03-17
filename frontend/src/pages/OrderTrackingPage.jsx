import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderStore } from "../stores/useOrderStore";
import {
    Package,
    ClipboardCheck,
    Truck,
    MapPin,
    CheckCircle2,
    Printer,
    Calendar,
    Clock,
    ChevronRight,
    Search,
    AlertCircle,
    User,
    Phone,
    Mail,
    CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";

const OrderTrackingPage = () => {
    const { trackingToken } = useParams();
    const navigate = useNavigate();
    const { fetchOrderTracking, currentOrder, loading, error } = useOrderStore();

    useEffect(() => {
        if (trackingToken && trackingToken !== "search") {
            fetchOrderTracking(trackingToken);
        }
    }, [trackingToken, fetchOrderTracking]);

    const steps = [
        { status: "pending", label: "Đã đặt hàng", icon: Package },
        { status: "confirmed", label: "Đã xác nhận", icon: ClipboardCheck },
        { status: "shipped", label: "Đang vận chuyển", icon: Truck },
        { status: "out_for_delivery", label: "Đang giao hàng", icon: MapPin },
        { status: "delivered", label: "Đã giao hàng", icon: CheckCircle2 },
    ];

    const getStatusIndex = (status) => {
        const index = steps.findIndex(step => step.status === status);
        return index !== -1 ? index : 0;
    };

    const currentStepIndex = currentOrder ? getStatusIndex(currentOrder.status) : 0;

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#0d0d0d]"><LoadingSpinner /></div>;

    if (error) return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/50 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center"
            >
                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-red-500 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Không tìm thấy đơn hàng</h1>
                <p className="text-gray-400 mb-8">{error}</p>
                <button
                    onClick={() => navigate("/")}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                    Về trang chủ
                </button>
            </motion.div>
        </div>
    );

    if (!currentOrder || trackingToken === "search") return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900/40 border border-gray-800 p-10 rounded-3xl max-w-2xl w-full text-center"
            >
                <div className="bg-emerald-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                    <Search className="text-emerald-500 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Theo Dõi Đơn Hàng</h1>
                <p className="text-gray-400 mb-10 leading-relaxed">
                    Nhập mã theo dõi của bạn để xem trạng thái đơn hàng theo thời gian thực.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const token = e.target.token.value;
                        if (token) navigate(`/order-tracking/${token}`);
                    }}
                    className="space-y-4"
                >
                    <input
                        name="token"
                        type="text"
                        required
                        placeholder="Dán mã theo dõi vào đây..."
                        className="w-full bg-gray-900 border border-gray-800 text-white px-8 py-5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-center font-mono text-sm placeholder:font-sans"
                    />
                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold px-8 py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        THEO DÕI ĐƠN HÀNG
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold pt-4">Mã theo dõi được gửi qua email xác nhận đơn hàng, hoặc xem trong <a href="/profile" className="text-emerald-500 hover:underline">Hồ sơ của tôi</a></p>
                </form>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 pt-24 pb-16 px-4 md:px-8 transition-colors duration-300">
            {/* Header section */}
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-2"
                    >
                        <p className="text-emerald-500 font-medium tracking-widest text-xs uppercase">Order Tracking</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Order <span className="text-emerald-500">#{currentOrder.orderCode}</span>
                        </h1>
                        <div className="flex items-center gap-4 text-gray-500 text-sm">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                            <span className="flex items-center gap-1">{currentOrder.products.length} Items</span>
                        </div>
                    </motion.div>

                    {currentOrder.estimatedDelivery && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Truck className="w-20 h-20 -rotate-12" />
                            </div>
                            <p className="text-emerald-500/70 text-xs font-semibold uppercase tracking-widest mb-1">Estimated Delivery</p>
                            <h2 className="text-2xl font-bold text-emerald-400">{new Date(currentOrder.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
                            <p className="text-emerald-500/60 text-xs mt-1">{currentOrder.carrier || "Standard Shipping"}</p>
                        </motion.div>
                    )}
                </div>

                {/* Status Stepper */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl"
                >
                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 px-4">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[2.25rem] left-10 right-10 h-[2px] bg-gray-800 z-0">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            />
                        </div>

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center group">
                                    <div
                                        className={`w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive
                                            ? "bg-emerald-500 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                                            : "bg-gray-800 text-gray-500 border border-gray-700"
                                            } ${isCurrent ? "scale-110 ring-4 ring-emerald-500/20" : ""}`}
                                    >
                                        <Icon className={`w-8 h-8 ${isActive ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className={`text-sm font-bold uppercase tracking-widest ${isActive ? "text-emerald-400" : "text-gray-500"}`}>
                                            {step.label}
                                        </p>
                                        {isActive && index < currentStepIndex && (
                                            <p className="text-[10px] text-emerald-500/50 mt-1 uppercase font-bold tracking-tighter">Completed</p>
                                        )}
                                        {isCurrent && (
                                            <p className="text-[10px] text-emerald-300 mt-1 uppercase font-bold tracking-tighter animate-pulse">In Progress</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Search className="text-emerald-500 w-5 h-5" />
                            <h3 className="text-xl font-bold">Status Updates</h3>
                        </div>

                        <div className="space-y-6 relative ml-4">
                            {/* Vertical Line */}
                            <div className="absolute top-0 bottom-0 left-[21px] w-[2px] bg-gradient-to-b from-emerald-500/50 via-gray-800 to-transparent z-0" />

                            {currentOrder.trackingEvents?.map((event, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative z-10 pl-16 group"
                                >
                                    {/* Icon Background */}
                                    <div className={`absolute top-0 left-0 w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${index === 0
                                        ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        : "bg-gray-900 border-gray-800 text-gray-500 group-hover:border-emerald-500/50"
                                        }`}>
                                        {index === 0 ? <Clock className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>

                                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${index === 0
                                        ? "bg-gray-900/60 border-emerald-500/30 ring-1 ring-emerald-500/10"
                                        : "bg-gray-900/30 border-gray-800 hover:border-gray-700"
                                        }`}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                                            <h4 className={`font-bold text-lg ${index === 0 ? "text-emerald-400" : "text-white"}`}>
                                                {event.message}
                                            </h4>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                                                {new Date(event.timestamp).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-gray-400 text-sm italic">
                                                <MapPin className="w-4 h-4 text-emerald-500/60" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )).reverse()}
                        </div>
                    </div>

                    {/* Right Column: Order Info */}
                    <div className="space-y-8">
                        {/* Product Summary */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-800 bg-gray-800/20">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Package className="w-5 h-5 text-emerald-500" /> Product Details
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {currentOrder.products.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 group-hover:border-emerald-500/50 transition-colors">
                                            <img
                                                src={item.product?.image || "/placeholder.png"}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold font-mono">Watch Series</p>
                                            <h5 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{item.product?.name}</h5>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-gray-500 text-sm">Qty: {item.quantity}</span>
                                                <span className="text-emerald-400 font-bold font-mono">{item.product?.price?.toLocaleString()} VND</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Shipping Info */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-800 bg-gray-800/20">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <MapPin className="w-5 h-5 text-emerald-500" /> Shipping Info
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest">Delivery Address</p>
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <User className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                                            <p className="text-white font-medium">{currentOrder.shippingDetails.fullName}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Phone className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                                            <p className="text-white font-medium">{currentOrder.shippingDetails.phoneNumber}</p>
                                        </div>
                                        {currentOrder.shippingDetails.email && (
                                            <div className="flex gap-3">
                                                <Mail className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                                                <p className="text-white font-medium truncate">{currentOrder.shippingDetails.email}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                                            <div className="text-white font-medium leading-relaxed">
                                                {currentOrder.shippingDetails.address},<br />
                                                {currentOrder.shippingDetails.city}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-800">
                                    <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest mb-2">Carrier Details</p>
                                    <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-emerald-400" />
                                            <span className="text-sm font-medium">{currentOrder.carrier || "DHL Express"}</span>
                                        </div>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-bold tracking-tighter shrink-0">{currentOrder.carrierTrackingNumber || "TRK-PENDING"}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => window.location.href = `mailto:support@watchstore.com?subject=Inquiry for Order ${currentOrder.orderCode}`}
                                className="flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-95"
                            >
                                <Mail className="w-5 h-5" /> Contact
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all border border-gray-700 active:scale-95"
                            >
                                <Printer className="w-5 h-5" /> Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tracking Search Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 pt-16 border-t border-gray-800/50 text-center max-w-2xl mx-auto"
                >
                    <h4 className="text-white font-bold mb-4">Theo dõi đơn hàng khác?</h4>
                    <p className="text-gray-500 text-sm mb-8">Nhập mã theo dõi trong email xác nhận đơn hàng của bạn.</p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const token = e.target.token.value;
                            if (token) navigate(`/order-tracking/${token}`);
                        }}
                        className="flex gap-2"
                    >
                        <input
                            name="token"
                            type="text"
                            placeholder="Dán mã theo dõi vào đây..."
                            className="flex-1 bg-gray-900 border border-gray-800 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-4 rounded-2xl transition-all"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </motion.div>
            </div>

            {/* Print-only CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .max-w-7xl, .max-w-7xl * { visibility: visible; }
                    .max-w-7xl { position: absolute; left: 0; top: 0; width: 100%; }
                    button, .pt-24 { display: none !important; }
                    .bg-[#0d0d0d] { background: white !important; color: black !important; }
                    .text-white, .text-gray-100 { color: black !important; }
                    .bg-gray-900, .bg-gray-800 { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
                    .border-gray-800, .border-gray-700 { border-color: #eee !important; }
                    .text-emerald-500, .text-emerald-400 { color: #059669 !important; }
                }
            `}} />
        </div>
    );
};

export default OrderTrackingPage;
