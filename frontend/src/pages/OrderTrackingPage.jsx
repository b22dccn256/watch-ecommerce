import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Mail,
    MapPin,
    Package,
    Phone,
    Printer,
    Search,
    Truck,
    User,
} from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import { SkeletonPageShell } from "../components/SkeletonLoaders";

const statusLabel = {
    pending: "Đã đặt hàng",
    confirmed: "Đã xác nhận",
    shipped: "Đang vận chuyển",
    out_for_delivery: "Đang giao hàng",
    delivered: "Đã giao hàng",
    return_requested: "Đang chờ duyệt trả hàng",
    returned: "Đã trả hàng",
    cancelled: "Đã hủy",
};

const statusDotClass = {
    pending: "bg-gray-400",
    confirmed: "bg-gray-500",
    shipped: "bg-gray-600",
    out_for_delivery: "bg-[color:var(--color-gold)]",
    delivered: "bg-[color:var(--color-gold)]",
    return_requested: "bg-gray-500",
    returned: "bg-gray-500",
    cancelled: "bg-gray-500",
};

const timelineStatuses = ["pending", "confirmed", "shipped", "out_for_delivery", "delivered"];

const OrderTrackingPage = () => {
    const { trackingToken } = useParams();
    const navigate = useNavigate();
    const { fetchOrderTracking, currentOrder, loading, error } = useOrderStore();

    useEffect(() => {
        if (trackingToken && trackingToken !== "search") {
            fetchOrderTracking(trackingToken);
        }
    }, [trackingToken, fetchOrderTracking]);

    if (loading) return <SkeletonPageShell rows={6} />;

    if (error) {
        return (
            <div className="min-h-screen pt-24 px-4 pb-16">
                <div className="mx-auto max-w-xl rounded-2xl border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 p-8 text-center">
                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-gold)]/15">
                        <AlertCircle className="h-6 w-6 text-[color:var(--color-gold)]" />
                    </div>
                    <h1 className="hero-title text-3xl text-primary">Không tìm thấy đơn hàng</h1>
                    <p className="mt-3 text-sm text-secondary">{error}</p>
                    <button onClick={() => navigate("/")} className="btn-base btn-primary mt-6 h-11 px-6">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (!currentOrder || trackingToken === "search") {
        return (
            <div className="min-h-screen pt-24 px-4 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-2xl rounded-[1.8rem] border border-black/10 bg-surface p-8 text-center dark:border-white/10"
                >
                    <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-gold)]/10">
                        <Search className="h-8 w-8 text-[color:var(--color-gold)]" />
                    </div>
                    <h1 className="hero-title text-4xl text-primary">Theo dõi đơn hàng</h1>
                    <p className="mt-3 text-sm text-secondary">
                        Nhập mã theo dõi để xem trạng thái đơn hàng theo thời gian thực.
                    </p>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const token = event.target.token.value;
                            if (token) navigate(`/order-tracking/${token}`);
                        }}
                        className="mt-6 space-y-3"
                    >
                        <input
                            name="token"
                            type="text"
                            required
                            placeholder="Dán mã theo dõi vào đây"
                            className="input-base h-11 text-center"
                        />
                        <button type="submit" className="btn-base btn-primary h-11 w-full">
                            Tra cứu ngay
                        </button>
                        <p className="text-xs text-muted pt-2">
                            Mã theo dõi được gửi qua email xác nhận đơn hàng hoặc tại mục hồ sơ của bạn.
                        </p>
                    </form>
                </motion.div>
            </div>
        );
    }

    const currentIndex = Math.max(0, timelineStatuses.indexOf(currentOrder.status));
    const timelineEvents = [...(currentOrder.trackingEvents || [])].reverse();

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 md:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="hero-kicker text-[color:var(--color-gold)] mb-2">Order tracking</p>
                        <h1 className="hero-title text-4xl text-primary">Đơn #{currentOrder.orderCode}</h1>
                        <p className="mt-2 text-sm text-secondary">
                            Đặt ngày {new Date(currentOrder.createdAt).toLocaleDateString("vi-VN")} • {currentOrder.products.length} sản phẩm
                        </p>
                    </div>

                    {currentOrder.estimatedDelivery && (
                        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-surface-soft px-4 py-3 text-sm">
                            <p className="text-muted">Dự kiến giao</p>
                            <p className="font-semibold text-primary">
                                {new Date(currentOrder.estimatedDelivery).toLocaleDateString("vi-VN")}
                            </p>
                        </div>
                    )}
                </div>

                <div className="rounded-[1.4rem] border border-black/10 dark:border-white/10 bg-surface p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-5">
                        {timelineStatuses.map((status, index) => {
                            const isPassed = index <= currentIndex;
                            const dotClass = isPassed ? "bg-[color:var(--color-gold)]" : "bg-gray-300 dark:bg-gray-700";
                            return (
                                <div key={status} className="rounded-xl bg-surface-soft p-3 text-sm">
                                    <p className="inline-flex items-center gap-2 text-secondary">
                                        <span className={`inline-flex h-2 w-2 rounded-full ${dotClass}`} />
                                        {statusLabel[status]}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <section className="lg:col-span-2 space-y-4">
                        <h2 className="hero-title text-2xl text-primary">Lịch sử cập nhật</h2>
                        <div className="space-y-3">
                            {timelineEvents.map((event, index) => (
                                <div key={`${event.timestamp}-${index}`} className="rounded-xl border border-black/10 dark:border-white/10 bg-surface-soft p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="inline-flex items-center gap-2 text-sm text-primary">
                                            <span className={`inline-flex h-2 w-2 rounded-full ${index === 0 ? "bg-[color:var(--color-gold)]" : "bg-gray-400"}`} />
                                            {event.message}
                                        </p>
                                        <span className="text-xs text-muted">
                                            {new Date(event.timestamp).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <p className="mt-2 inline-flex items-center gap-2 text-xs text-secondary">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {event.location}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-[1.3rem] border border-black/10 dark:border-white/10 bg-surface p-5">
                            <h3 className="font-semibold text-primary mb-3">Thông tin giao hàng</h3>
                            <div className="space-y-3 text-sm text-secondary">
                                <p className="inline-flex items-center gap-2"><User className="h-4 w-4 text-muted" />{currentOrder.shippingDetails.fullName}</p>
                                <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-muted" />{currentOrder.shippingDetails.phoneNumber}</p>
                                {currentOrder.shippingDetails.email && (
                                    <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-muted" />{currentOrder.shippingDetails.email}</p>
                                )}
                                <p className="inline-flex items-start gap-2"><MapPin className="h-4 w-4 text-muted mt-0.5" />
                                    <span>{currentOrder.shippingDetails.address}, {currentOrder.shippingDetails.city}</span>
                                </p>
                                <p className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-muted" />{currentOrder.carrier || "Đơn vị vận chuyển"}</p>
                                <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-muted" />{statusLabel[currentOrder.status] || currentOrder.status}</p>
                                <p className="inline-flex items-center gap-2">
                                    <span className={`inline-flex h-2 w-2 rounded-full ${statusDotClass[currentOrder.status] || "bg-gray-400"}`} />
                                    <span className="text-xs text-muted">Mã tracking: {currentOrder.carrierTrackingNumber || "TRK-PENDING"}</span>
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[1.3rem] border border-black/10 dark:border-white/10 bg-surface p-5">
                            <h3 className="font-semibold text-primary mb-3">Sản phẩm</h3>
                            <div className="space-y-3">
                                {currentOrder.products.map((item, index) => (
                                    <div key={`${item.product?._id || index}-${index}`} className="flex items-center gap-3 rounded-lg bg-surface-soft p-2.5 text-sm">
                                        <img src={item.product?.image || "/placeholder.png"} alt={item.product?.name} className="h-12 w-12 rounded-md object-cover" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-primary font-medium">{item.product?.name}</p>
                                            <p className="text-xs text-muted">SL: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-[color:var(--color-gold)]">{item.product?.price?.toLocaleString("vi-VN")} đ</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => window.location.href = `mailto:support@watchstore.com?subject=Inquiry for Order ${currentOrder.orderCode}`}
                                className="btn-base btn-primary h-11"
                            >
                                Liên hệ
                            </button>
                            <button onClick={() => window.print()} className="btn-base btn-outline h-11">
                                <Printer className="h-4 w-4" />
                                In
                            </button>
                        </div>
                    </aside>
                </div>

                <div className="rounded-[1.3rem] border border-black/10 dark:border-white/10 bg-surface p-5 text-center">
                    <p className="text-sm text-secondary mb-3">Tra cứu đơn hàng khác</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const token = event.target.token.value;
                            if (token) navigate(`/order-tracking/${token}`);
                        }}
                        className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row"
                    >
                        <input name="token" type="text" placeholder="Nhập mã theo dõi" className="input-base h-11" />
                        <button type="submit" className="btn-base btn-primary h-11 px-6">Tìm kiếm</button>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .max-w-7xl, .max-w-7xl * { visibility: visible; }
                        .max-w-7xl { position: absolute; left: 0; top: 0; width: 100%; }
                        button { display: none !important; }
                    }
                `,
            }} />
        </div>
    );
};

export default OrderTrackingPage;
