import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Package, ShoppingCart, DollarSign,
  TrendingUp, ArrowUpRight, ArrowDownRight, Download, Trophy, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar, BarChart, PieChart, Pie, Cell, Legend,
} from "recharts";
import useAnalyticsData from "../../hooks/useAnalyticsData";

  const DAYS_OPTIONS = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
];
const PIE_COLORS = ["#c9a96e", "#3b82f6", "#10b981", "#8b5cf6"];
const formatVND = (v) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + " tỷ";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + " tr";
  return v?.toLocaleString("vi-VN");
};

/* ── Micro components ── */
const SkeletonBlock = ({ h = "h-4", w = "w-full" }) => (
  <div className={`${h} ${w} rounded-lg bg-black/8 dark:bg-white/8 animate-pulse`} />
);

const KpiSkeleton = () => (
  <div className="rounded-xl border border-black/8 dark:border-white/8 bg-surface p-5 space-y-3">
    <SkeletonBlock h="h-3" w="w-24" />
    <SkeletonBlock h="h-7" w="w-32" />
    <SkeletonBlock h="h-3" w="w-16" />
  </div>
);

const ChartSkeleton = () => (
  <div className="flex items-end gap-2 h-48">
    {[60, 85, 45, 90, 70, 55, 80, 65, 40, 75].map((h, i) => (
      <div key={i} className="flex-1 bg-black/8 dark:bg-white/8 rounded-sm animate-pulse" style={{ height: `${h}%` }} />
    ))}
  </div>
);

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-12 h-12 rounded-xl bg-[color:var(--color-surface-2)] flex items-center justify-center">
      <ShoppingCart className="w-6 h-6 text-muted" />
    </div>
    <p className="text-sm text-muted">{message}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/10 bg-surface p-3 shadow-xl text-xs dark:border-white/10">
      <p className="font-bold text-primary mb-1.5">{label}</p>
      {payload.map(e => (
        <p key={e.name} className="mt-0.5" style={{ color: e.color }}>
          {e.name === "revenue" ? `Doanh thu: ${formatVND(e.value)} ₫` : `Đơn hàng: ${e.value}`}
        </p>
      ))}
    </div>
  );
};

const DeltaBadge = ({ delta }) => {
  if (!delta) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
      delta.positive
        ? "text-emerald-600 bg-emerald-500/10"
        : "text-red-500 bg-red-500/10"
    }`}>
      {delta.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {delta.positive ? "+" : ""}{delta.delta}%
    </span>
  );
};

  const KpiCard = ({ title, value, icon: Icon, gradient, delta, loading, badge, subtext }) => {
  if (loading) return <KpiSkeleton />;
  return (
    <div className="card-admin transition hover:border-[color:var(--color-gold)]/25">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${gradient}`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
          <div className="flex items-center gap-1.5">
            {badge}
            <DeltaBadge delta={delta} />
          </div>
      </div>
        <p className="text-[11px] text-secondary font-medium leading-tight">{title}</p>
        <p className="text-lg font-bold text-primary mt-0.5 tracking-tight">{value}</p>
          {subtext && <p className="text-[10px] text-muted mt-0.5">{subtext}</p>}
    </div>
  );
};


const CardShell = ({ title, icon: Icon, children, action }) => (
  <div className="rounded-xl border border-black/6 bg-surface p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-primary flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-[color:var(--color-gold)]" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const PieStatsCard = ({ title, loading, data, emptyMessage, legendFormatter, tooltipFormatter }) => (
  <CardShell title={title}>
    {loading ? <ChartSkeleton /> : !data?.length ? (
      <EmptyChart message={emptyMessage} />
    ) : (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
          <Legend formatter={legendFormatter} />
        </PieChart>
      </ResponsiveContainer>
    )}
  </CardShell>
);

/* ── Main component ── */
const AnalyticsTab = () => {
  const {
    data, isLoading, dailySalesData, days, setDays,
    topProducts, bottomProducts, plData,
    hasChart, revDelta, saleDelta, exportCsv,
  } = useAnalyticsData();

  // Date range selector state
  const [rangeType, setRangeType] = useState(7); // 7,30,90 or 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const applyRange = (type) => {
    if (type === 'custom') {
      // compute days diff if both dates present
      if (customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        const diff = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
        setDays(diff);
      }
    } else {
      setDays(type);
    }
    setRangeType(type);
  };

  const noTransactions = (data.totalRevenue === 0 || !data.totalRevenue) && (data.totalSales === 0 || !data.totalSales);

  const chartRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver(entries => setChartReady((entries[0]?.contentRect?.width || 0) > 0));
    if (chartRef.current) obs.observe(chartRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Tổng quan hiệu suất</h2>
          <p className="text-[11px] text-secondary mt-0.5">{days} ngày gần nhất</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md border border-green-500/15 bg-green-500/6 text-green-600 transition hover:bg-green-500/12 dark:text-green-400"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={() => window.open("/api/products/export", "_blank")}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md border border-blue-500/15 bg-blue-500/6 text-blue-600 transition hover:bg-blue-500/12 dark:text-blue-400"
          >
            <Download className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      {/* KPI Groups: Sales vs Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-secondary">Khối Bán hàng</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <KpiCard
              loading={isLoading}
              title="Đơn hàng"
              value={data.totalSales.toLocaleString()}
              icon={ShoppingCart}
              gradient="bg-violet-500"
              delta={saleDelta}
              badge={data.cancellationRate > 0 ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-500">{data.cancellationRate.toFixed(1)}% hủy/hoàn</span> : null}
            />
            <KpiCard loading={isLoading} title="Doanh thu thực tế" value={formatVND(data.totalRevenue) + " ₫"} icon={DollarSign} gradient="bg-amber-500" delta={revDelta} />
            <KpiCard
              loading={isLoading}
              title="Dòng tiền dự kiến"
              value={formatVND(data.pendingRevenue || 0) + " ₫"}
              icon={ArrowUpRight}
              gradient="bg-sky-500"
              subtext={data.pendingCount ? `${data.pendingCount.toLocaleString()} đơn đang đi đường` : "Chưa phát sinh dòng tiền dự kiến"}
            />
            <KpiCard loading={isLoading} title="Giá trị đơn trung bình (AOV)" value={formatVND(data.aov) + " ₫"} icon={DollarSign} gradient="bg-emerald-400" />
            <KpiCard loading={isLoading} title="Tỷ lệ chuyển đổi" value={(data.conversionRate > 0 ? data.conversionRate.toFixed(2) + '%' : '—')} icon={TrendingUp} gradient="bg-blue-400" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-secondary">Khối Vận hành</p>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard loading={isLoading} title="Tổng người dùng" value={data.users.toLocaleString()} icon={Users} gradient="bg-emerald-500" />
            <KpiCard loading={isLoading} title="Tổng sản phẩm" value={data.products.toLocaleString()} icon={Package} gradient="bg-blue-500" />
            <KpiCard loading={isLoading} title="Hàng sắp hết" value={String((data.lowStockCount || 0))} icon={AlertTriangle} gradient="bg-amber-400" />
            <KpiCard loading={isLoading} title="Đơn đã thanh toán" value={(data.totalOrdersPlaced || 0).toLocaleString() + " đơn"} icon={Download} gradient="bg-violet-200" />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <CardShell
        title="Doanh thu & Đơn hàng"
        icon={TrendingUp}
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {DAYS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => applyRange(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    days === opt.value && rangeType !== 'custom'
                      ? "bg-[color:var(--color-gold)] text-white"
                      : "bg-[color:var(--color-surface-2)] text-secondary hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => { setRangeType('custom'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${rangeType === 'custom' ? "bg-[color:var(--color-gold)] text-white" : "bg-[color:var(--color-surface-2)] text-secondary"}`}
              >
                Tùy chỉnh
              </button>
            </div>
            {rangeType === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-xs px-2 py-1 border rounded-md" />
                <span className="text-xs text-secondary">→</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-xs px-2 py-1 border rounded-md" />
                <button onClick={() => applyRange('custom')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-[color:var(--color-gold)] text-white">Áp dụng</button>
              </div>
            )}
          </div>
        }
      >
        {isLoading ? <ChartSkeleton /> : !hasChart ? (
          <EmptyChart message={`Chưa có đơn hàng đã thanh toán trong ${days} ngày qua`} />
        ) : (
          <div ref={chartRef} style={{ width: "100%", height: 300 }}>
            {chartReady && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatVND(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Đơn hàng" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Doanh thu (₫)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardShell>

      {/* Payment & Watch Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PieStatsCard
          title="Doanh thu theo Thanh toán"
          loading={isLoading}
          data={data.paymentStats}
          emptyMessage="Chưa có dữ liệu thanh toán"
          tooltipFormatter={(v) => [formatVND(v) + " ₫", "Doanh thu"]}
          legendFormatter={(v) => v}
        />
        <PieStatsCard
          title="Máy Cơ vs Máy Pin"
          loading={isLoading}
          data={data.watchTypeStats}
          emptyMessage="Chưa có dữ liệu phân loại máy"
          tooltipFormatter={(v, _, payload) => [`${v} chiếc`, payload?.payload?.name || "Loại máy"]}
          legendFormatter={(v) => v}
        />
        <PieStatsCard
          title="Màu mặt số được chuộng"
          loading={isLoading}
          data={data.dialColorStats}
          emptyMessage="Chưa có dữ liệu màu mặt số"
          tooltipFormatter={(v, _, payload) => [`${v} chiếc`, payload?.payload?.name || "Màu mặt số"]}
          legendFormatter={(v) => v}
        />
      </div>

      <CardShell title="Top Size Cổ Tay">
        {isLoading ? <ChartSkeleton /> : !data.wristSizeStats?.length ? (
          <EmptyChart message="Chưa có dữ liệu size" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.wristSizeStats} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="size" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" fill="#c9a96e" radius={[0, 4, 4, 0]} maxBarSize={20} name="Số lượng" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardShell>

      {/* Top Products & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {noTransactions ? (
          <CardShell title="Dữ liệu giao dịch" icon={Trophy}>
            <div className="py-8 text-center">
              <p className="text-sm text-muted">Chưa có dữ liệu giao dịch trong khoảng thời gian đã chọn.</p>
              <p className="text-xs text-muted mt-2">Hãy chờ có đơn hàng hoặc thay đổi bộ lọc thời gian.</p>
            </div>
          </CardShell>
        ) : (
          <CardShell title="Top 8 Bán chạy" icon={Trophy}>
            {isLoading ? (
              <div className="space-y-3">{Array(5).fill(0).map((_, i) => <SkeletonBlock key={i} h="h-10" />)}</div>
            ) : topProducts.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Chưa có dữ liệu</p>
            ) : topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-black/5 dark:border-white/5 last:border-0">
                <span className="text-[10px] font-bold text-muted w-5 flex-shrink-0">#{i + 1}</span>
                {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary truncate">{p.name}</p>
                  <p className="text-[10px] text-muted">{p.brand?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[color:var(--color-gold)]">{(p.salesCount || 0).toLocaleString()} bán</p>
                  <p className="text-[10px] text-muted">Tồn: {p.stock}</p>
                </div>
              </div>
            ))}
          </CardShell>
        )}

        <CardShell title="Tồn Kho Thấp" icon={AlertTriangle}>
          {isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <SkeletonBlock key={i} h="h-10" />)}</div>
          ) : bottomProducts.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">Không có cảnh báo 🎉</p>
          ) : bottomProducts.map(p => (
            <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-black/5 dark:border-white/5 last:border-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-center w-10 flex-shrink-0 ${
                p.stock === 0 ? "text-red-400 bg-red-500/10" : "text-amber-500 bg-amber-500/10"
              }`}>
                {p.stock === 0 ? "HẾT" : p.stock}
              </span>
              {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary truncate">{p.name}</p>
                <p className="text-[10px] text-muted">Ngưỡng: {p.lowStockThreshold}</p>
              </div>
              <p className="text-xs font-semibold text-secondary flex-shrink-0">{p.price?.toLocaleString("vi-VN")} ₫</p>
            </div>
          ))}
        </CardShell>
      </div>

      {/* P&L Report */}
      {plData && (
        <CardShell title="Báo Cáo P&L" icon={TrendingUp}>
          <span className="text-[10px] text-muted">{plData.summary?.days} ngày gần nhất</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 mb-5">
            {[
              { label: "Doanh thu", value: formatVND(plData.summary?.totalRevenue || 0) + " ₫", color: "text-blue-500" },
              { label: "Giá vốn", value: formatVND(plData.summary?.totalCogs || 0) + " ₫", color: "text-orange-500" },
              { label: "Lợi nhuận gộp", value: formatVND(plData.summary?.totalGrossProfit || 0) + " ₫", color: "text-emerald-500" },
              { label: "Biên LN", value: (plData.summary?.totalMargin || 0).toFixed(1) + "%", color: "text-[color:var(--color-gold)]" },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-[color:var(--color-surface-2)] p-3">
                <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{item.label}</p>
                <p className={`text-base font-bold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {plData.daily?.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plData.daily} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatVND(v)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v, n) => [formatVND(v) + " ₫", n === "revenue" ? "Doanh thu" : n === "cogs" ? "Giá vốn" : "Lợi nhuận"]} />
                <Legend formatter={v => v === "revenue" ? "Doanh thu" : v === "cogs" ? "Giá vốn" : "Lợi nhuận gộp"} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="cogs" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="grossProfit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-muted mt-2">* Giá vốn dùng costPrice từ sản phẩm. Nếu không có, ước tính 60% giá bán.</p>
        </CardShell>
      )}
    </div>
  );
};

export default AnalyticsTab;
