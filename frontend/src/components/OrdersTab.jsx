import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Clock, Truck, Download, Plus, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";

const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

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

    const stats = [
        { label: "Total Volume", value: "$2,845,900", change: "+14.2%", icon: ShieldCheck },
        { label: "Pending Review", value: "18", subValue: "Estimated value: $412k", action: "Action Required", icon: AlertCircle },
        { label: "AI Trust Efficiency", value: "94.8%", subValue: "142 orders auto-confirmed today", icon: ShieldCheck },
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
                    <button className='flex items-center gap-2 px-4 py-2 bg-luxury-dark border border-luxury-border rounded-xl text-sm font-bold text-white hover:bg-white/5 transition'>
                        <Download className='w-4 h-4' /> Export
                    </button>
                    <button className='flex items-center gap-2 px-6 py-2 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-luxury-gold-light transition shadow-lg shadow-luxury-gold/20'>
                        <Plus className='w-4 h-4' /> Create Order
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
                                {stat.change && <p className='text-emerald-400 text-xs font-bold'>{stat.change} from last month</p>}
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
                <div className='p-6 border-b border-luxury-border/50 flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-2 p-1 bg-luxury-darker rounded-xl border border-luxury-border'>
                        {["All Orders", "Pending", "Shipping", "Completed", "Cancelled"].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "All Orders" ? "bg-luxury-gold text-luxury-dark" : "text-luxury-text-muted hover:text-white"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button className='flex items-center gap-2 px-4 py-2 bg-luxury-darker border border-luxury-border rounded-xl text-xs font-bold text-luxury-text-muted hover:text-white transition'>
                        <Filter className='w-4 h-4' /> More Filters
                    </button>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='text-left bg-luxury-darker/30'>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Order ID</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Date</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Customer & Watch</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Total</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Status</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>AI Trust Score</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-luxury-border/30'>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-emerald-400">Loading orders...</td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} className='group hover:bg-white/5 transition-colors'>
                                    <td className='px-6 py-6 font-bold text-white'>#{order._id.substring(0, 8).toUpperCase()}</td>
                                    <td className='px-6 py-6 text-sm text-luxury-text-muted'>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className='px-6 py-6'>
                                        <div className='font-bold text-white'>{order.user?.name || "Unknown"}</div>
                                        <div className='text-[10px] text-luxury-gold mt-0.5'>{order.products.length} Items</div>
                                    </td>
                                    <td className='px-6 py-6 font-bold text-white'>${order.totalAmount?.toLocaleString()}</td>
                                    <td className='px-6 py-6'>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${order.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className='px-6 py-6'>
                                        <div className='w-24'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <span className='text-[10px] font-bold text-white'>99%</span>
                                                <span className={`text-[8px] font-bold text-emerald-400`}>AUTO</span>
                                            </div>
                                            <div className='h-1.5 w-full bg-luxury-darker rounded-full overflow-hidden'>
                                                <div
                                                    className={`h-full rounded-full bg-emerald-500`}
                                                    style={{ width: '99%' }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className='px-6 py-6 text-right'>
                                        <div className='flex items-center justify-end gap-2'>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className='p-2 bg-luxury-dark border border-luxury-border rounded-lg text-luxury-text-muted hover:text-luxury-gold transition-colors'
                                            >
                                                <Eye className='w-4 h-4' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='p-6 bg-luxury-darker/30 flex items-center justify-between'>
                    <p className='text-[10px] text-luxury-text-muted italic'>Showing {orders.length} orders</p>
                    <div className='flex items-center gap-2'>
                        <button className='p-1.5 rounded-lg border border-luxury-border text-luxury-text-muted hover:text-white transition cursor-not-allowed opacity-50'>
                            <ChevronLeft className='w-4 h-4' />
                        </button>
                        <div className='flex items-center gap-1'>
                            <span className='w-8 h-8 flex items-center justify-center rounded-lg bg-luxury-gold text-luxury-dark text-xs font-bold'>1</span>
                            <span className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-luxury-border text-luxury-text-muted text-xs font-medium cursor-pointer transition'>2</span>
                            <span className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-luxury-border text-luxury-text-muted text-xs font-medium cursor-pointer transition'>3</span>
                        </div>
                        <button className='p-1.5 rounded-lg border border-luxury-border text-luxury-text-muted hover:text-white transition'>
                            <ChevronRight className='w-4 h-4' />
                        </button>
                    </div>
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
                                    <p className="font-bold text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted">Total Amount</p>
                                    <p className="font-bold text-emerald-400">${selectedOrder.totalAmount?.toLocaleString()}</p>
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
                                            <span className="font-bold text-luxury-gold">${item.product?.price?.toLocaleString()}</span>
                                        </div>
                                    ))}
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
