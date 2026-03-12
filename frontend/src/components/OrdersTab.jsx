import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, XCircle, Download, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
    pending: "text-yellow-400 bg-yellow-400/10",
    confirmed: "text-blue-400 bg-blue-400/10",
    shipped: "text-purple-400 bg-purple-400/10",
    delivered: "text-emerald-400 bg-emerald-400/10",
    cancelled: "text-red-400 bg-red-400/10",
};
const FILTER_TABS = ["All Orders", ...STATUS_OPTIONS];

const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [activeFilter, setActiveFilter] = useState("All Orders");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get("/orders");
                setOrders(res.data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = activeFilter === "All Orders"
        ? orders
        : orders.filter(o => o.status === activeFilter);

    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(true);
        try {
            await axios.patch(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            toast.success(`Đã cập nhật trạng thái: ${newStatus}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredOrders.length === 0) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }
        const rows = filteredOrders.map(o => ({
            "Mã đơn": o._id,
            "Khách hàng": o.user?.name || "N/A",
            "Email": o.user?.email || "N/A",
            "Trạng thái": o.status,
            "Thanh toán": o.paymentStatus,
            "Phương thức": o.paymentMethod,
            "Tổng tiền": o.totalAmount,
            "Ngày tạo": new Date(o.createdAt).toLocaleString("vi-VN"),
        }));
        const headers = Object.keys(rows[0]).join(",");
        const csvRows = rows.map(r => Object.values(r).map(v => `"${v}"`).join(","));
        const csvContent = [headers, ...csvRows].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders_${activeFilter}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Đã xuất ${filteredOrders.length} đơn ra CSV`);
    };

    const stats = [
        { label: "Total Volume", value: orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString("vi-VN") + " ₫", icon: ShieldCheck },
        { label: "Pending Review", value: orders.filter(o => o.status === "pending").length.toString(), action: "Action Required", icon: AlertCircle },
        { label: "AI Trust Efficiency", value: "94.8%", subValue: "Auto-confirmed orders", icon: ShieldCheck },
    ];

    return (
        <div className='space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-4xl font-bold text-white tracking-tight'>Order Management</h1>
                    <p className='text-luxury-text-muted max-w-2xl'>
                        Securely verify and confirm high-value timepiece transactions.
                    </p>
                </div>
                <div className='flex gap-3'>
                    <button
                        onClick={handleExportCSV}
                        className='flex items-center gap-2 px-4 py-2 bg-luxury-dark border border-luxury-border rounded-xl text-sm font-bold text-white hover:bg-white/5 transition'
                    >
                        <Download className='w-4 h-4' /> Export CSV ({filteredOrders.length})
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {stats.map((stat, idx) => (
                    <div key={idx} className='bg-luxury-dark border border-luxury-border p-6 rounded-2xl relative overflow-hidden'>
                        <div className='relative z-10 space-y-4'>
                            <p className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest flex items-center gap-2'>
                                <stat.icon className='w-3 h-3 text-luxury-gold' /> {stat.label}
                            </p>
                            <div className='space-y-1'>
                                <h3 className='text-3xl font-bold text-white'>{stat.value}</h3>
                                {stat.subValue && <p className='text-luxury-text-muted text-[10px]'>{stat.subValue}</p>}
                            </div>
                            {stat.action && (
                                <span className='inline-block px-2 py-1 bg-luxury-gold/10 text-luxury-gold text-[10px] font-bold rounded-md'>
                                    {stat.action}
                                </span>
                            )}
                        </div>
                        <div className='absolute -right-4 -bottom-4 opacity-5'>
                            <stat.icon className='w-24 h-24' />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Table */}
            <div className='bg-luxury-dark border border-luxury-border rounded-3xl overflow-hidden shadow-2xl'>
                <div className='p-6 border-b border-luxury-border/50 flex flex-wrap items-center gap-2'>
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${activeFilter === tab ? "bg-luxury-gold text-luxury-dark" : "text-luxury-text-muted hover:text-white"}`}
                        >
                            {tab === "All Orders"
                                ? `Tất cả (${orders.length})`
                                : `${tab} (${orders.filter(o => o.status === tab).length})`
                            }
                        </button>
                    ))}
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='text-left bg-luxury-darker/30'>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Order ID</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Date</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Customer</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Total</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Status</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Payment</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-luxury-border/30'>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-emerald-400">Loading orders...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-luxury-text-muted">Không có đơn hàng nào</td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order._id} className='group hover:bg-white/5 transition-colors'>
                                    <td className='px-6 py-6 font-bold text-white'>#{order._id.substring(0, 8).toUpperCase()}</td>
                                    <td className='px-6 py-6 text-sm text-luxury-text-muted'>
                                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className='px-6 py-6'>
                                        <div className='font-bold text-white'>{order.user?.name || "Unknown"}</div>
                                        <div className='text-[10px] text-luxury-gold mt-0.5'>{order.products.length} Items</div>
                                    </td>
                                    <td className='px-6 py-6 font-bold text-white'>
                                        {order.currency === "USD"
                                            ? "$" + order.totalAmount?.toLocaleString()
                                            : order.totalAmount?.toLocaleString("vi-VN") + " ₫"}
                                    </td>
                                    <td className='px-6 py-6'>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${STATUS_COLORS[order.status] || "text-gray-400 bg-gray-400/10"}`}>
                                            {order.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className='px-6 py-6'>
                                        <span className={`px-2 py-1 rounded text-[9px] font-bold ${order.paymentStatus === "paid" ? "text-emerald-400 bg-emerald-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                                            {order.paymentStatus?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className='px-6 py-6 text-right'>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className='p-2 bg-luxury-dark border border-luxury-border rounded-lg text-luxury-text-muted hover:text-luxury-gold transition-colors'
                                        >
                                            <Eye className='w-4 h-4' />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='p-6 bg-luxury-darker/30 flex items-center justify-between'>
                    <p className='text-[10px] text-luxury-text-muted italic'>
                        Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
                    </p>
                </div>
            </div>

            {/* Modal Detail Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-luxury-dark border border-luxury-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Order Details #{selectedOrder._id?.substring(0, 8).toUpperCase()}</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-luxury-text-muted hover:text-white transition"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-luxury-text-muted">Customer Name</p>
                                    <p className="font-bold text-white">{selectedOrder.user?.name}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Email</p>
                                    <p className="font-bold text-white">{selectedOrder.user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Date</p>
                                    <p className="font-bold text-white">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Total Amount</p>
                                    <p className="font-bold text-emerald-400">
                                        {selectedOrder.currency === "USD"
                                            ? "$" + selectedOrder.totalAmount?.toLocaleString()
                                            : selectedOrder.totalAmount?.toLocaleString("vi-VN") + " ₫"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Payment Method</p>
                                    <p className="font-bold text-white uppercase">{selectedOrder.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Payment Status</p>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${selectedOrder.paymentStatus === "paid" ? "text-emerald-400 bg-emerald-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                                        {selectedOrder.paymentStatus?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-luxury-border">
                                <h3 className="font-bold text-white mb-4">Products</h3>
                                <div className="space-y-3">
                                    {selectedOrder.products.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-luxury-darker p-3 rounded-lg border border-luxury-border">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{item.product?.name || "Unknown Product"}</span>
                                                <span className="text-xs text-luxury-text-muted">Qty: {item.quantity}</span>
                                            </div>
                                            <span className="font-bold text-luxury-gold">
                                                {selectedOrder.currency === "USD"
                                                    ? "$" + item.product?.price?.toLocaleString()
                                                    : item.product?.price?.toLocaleString("vi-VN") + " ₫"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cập nhật trạng thái đơn hàng */}
                            <div className="pt-4 border-t border-luxury-border">
                                <h3 className="font-bold text-white mb-3">Cập nhật trạng thái</h3>
                                <div className="flex gap-3 items-center">
                                    <select
                                        defaultValue={selectedOrder.status}
                                        onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                                        disabled={updatingStatus}
                                        className="flex-1 bg-luxury-darker border border-luxury-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-luxury-gold transition disabled:opacity-50"
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${STATUS_COLORS[selectedOrder.status] || ""}`}>
                                        {updatingStatus ? "Đang cập nhật..." : selectedOrder.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
