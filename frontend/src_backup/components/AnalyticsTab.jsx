import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, Trophy, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart, PieChart, Pie, Cell, Legend } from "recharts";

const DAYS_OPTIONS = [{ label: "7 ngày", value: 7 }, { label: "30 ngày", value: 30 }, { label: "90 ngày", value: 90 }];
const formatVND = (v) => { if (v >= 1e9) return (v/1e9).toFixed(1)+" tỷ"; if (v >= 1e6) return (v/1e6).toFixed(1)+" tr"; return v?.toLocaleString("vi-VN"); };

const SkeletonBlock = ({ h = "h-4", w = "w-full", className = "" }) => (
  <div className={`${h} ${w} rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse ${className}`} />
);

const KpiSkeleton = () => (
  <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5 space-y-3">
    <SkeletonBlock h="h-3" w="w-24" />
    <SkeletonBlock h="h-7" w="w-32" />
    <SkeletonBlock h="h-3" w="w-16" />
  </div>
);

const ChartSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-end gap-2 h-48">
      {[60,85,45,90,70,55,80,65,40,75].map((h,i) => (
        <div key={i} className="flex-1 bg-gray-100 dark:bg-white/5 rounded-sm animate-pulse" style={{height:`${h}%`}} />
      ))}
    </div>
  </div>
);

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
      <ShoppingCart className="w-6 h-6 text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border p-3 rounded-xl shadow-xl text-xs">
      <p className="font-bold text-gray-900 dark:text-white mb-1.5">{label}</p>
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
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg ${delta.positive ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10" : "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-400/10"}`}>
      {delta.positive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
      {delta.positive ? "+" : ""}{delta.delta}%
    </span>
  );
};

const KpiCard = ({ title, value, icon: Icon, gradient, delta, loading }) => {
  if (loading) return <KpiSkeleton />;
  return (
    <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5 relative overflow-hidden group hover:border-luxury-gold/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${gradient}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <DeltaBadge delta={delta} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{value}</p>
    </div>
  );
};

const AnalyticsTab = () => {
  const [data, setData] = useState({ users:0, products:0, totalSales:0, totalRevenue:0, aov:0, totalOrdersPlaced:0, conversionRate:0, paymentStats:[], wristSizeStats:[] });
  const [prevData, setPrevData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [days, setDays] = useState(7);
  const [topProducts, setTopProducts] = useState([]);
  const [bottomProducts, setBottomProducts] = useState([]);
  const [plData, setPlData] = useState(null);
  const chartRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const fetchRef = useRef({ promise: null, lastFetched: 0, lastDays: null });

  useEffect(() => {
    const obs = new ResizeObserver(entries => setChartReady((entries[0]?.contentRect?.width || 0) > 0));
    if (chartRef.current) obs.observe(chartRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const now = Date.now();
      const fs = fetchRef.current;
      if (fs.promise) return;
      if (fs.lastDays === days && now - fs.lastFetched < 15000) return;
      setIsLoading(true);
      fs.promise = (async () => {
        try {
          const [cur, topRes, botRes] = await Promise.allSettled([
            axios.get(`/analytics?days=${days}&includePrev=true`),
            axios.get(`/products?sort=best_selling&limit=8`),
            axios.get(`/products/inventory/alerts?limit=8`),
          ]);
          if (cur.status === "fulfilled") {
            const d = cur.value.data;
            const ps = (d.dailySales||[]).reduce((s,x)=>s+x.sales,0);
            const pr = (d.dailySales||[]).reduce((s,x)=>s+x.revenue,0);
            setData({ users:d.users, products:d.products, totalSales:ps, totalRevenue:pr, aov:ps>0?Math.round(pr/ps):0, totalOrdersPlaced:d.totalOrdersPlaced||0, conversionRate:d.conversionRate||0, paymentStats:d.paymentStats||[], wristSizeStats:d.wristSizeStats||[] });
            setDailySalesData(d.dailySales||[]);
            if (d.prevDailySales) {
              const pvs = d.prevDailySales.reduce((s,x)=>s+x.sales,0);
              const pvr = d.prevDailySales.reduce((s,x)=>s+x.revenue,0);
              setPrevData({ totalRevenue:pvr, totalSales:pvs, aov:pvs>0?Math.round(pvr/pvs):0 });
            }
          }
          if (topRes.status==="fulfilled") setTopProducts(topRes.value.data?.products?.slice(0,8)||[]);
          if (botRes.status==="fulfilled") setBottomProducts(botRes.value.data?.products?.slice(0,8)||[]);
          try { const pl = await axios.get(`/analytics/pl?days=${days}`); setPlData(pl.data); } catch {}
        } catch (e) { console.error(e); } finally {
          fs.lastFetched=Date.now(); fs.lastDays=days; fs.promise=null; setIsLoading(false);
        }
      })();
    };
    fetch();
  }, [days]);

  const getDelta = (cur, prev) => {
    if (!prev || prev===0) return null;
    const d = ((cur-prev)/prev)*100;
    return { delta: d.toFixed(1), positive: d >= 0 };
  };

  const handleExportCSV = () => {
    if (!dailySalesData.length) return;
    const csv = ["Ngày,Đơn hàng,Doanh thu", ...dailySalesData.map(d=>`${d.name},${d.sales},${d.revenue}`)].join("\n");
    const a = Object.assign(document.createElement("a"),{ href:URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})), download:`analytics_${days}d_${new Date().toISOString().split("T")[0]}.csv` });
    a.click();
  };

  const hasChart = dailySalesData.some(d=>d.sales>0||d.revenue>0);
  const revDelta = prevData ? getDelta(data.totalRevenue, prevData.totalRevenue) : null;
  const saleDelta = prevData ? getDelta(data.totalSales, prevData.totalSales) : null;
  const PIE_COLORS = ["#c9a96e","#3b82f6","#10b981","#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Tổng quan hiệu suất</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{days} ngày gần nhất</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={()=>window.open("/api/products/export","_blank")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition">
            <Download className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard loading={isLoading} title="Tổng người dùng" value={data.users.toLocaleString()} icon={Users} gradient="bg-emerald-500" />
        <KpiCard loading={isLoading} title="Tổng sản phẩm" value={data.products.toLocaleString()} icon={Package} gradient="bg-blue-500" />
        <KpiCard loading={isLoading} title="Đơn hàng" value={data.totalSales.toLocaleString()} icon={ShoppingCart} gradient="bg-violet-500" delta={saleDelta} />
        <KpiCard loading={isLoading} title="Doanh thu" value={formatVND(data.totalRevenue)+" ₫"} icon={DollarSign} gradient="bg-amber-500" delta={revDelta} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:"Giá trị đơn TB (AOV)", value: formatVND(data.aov)+" ₫" },
          { label:"Đơn đã thanh toán",   value: (data.totalOrdersPlaced||0).toLocaleString()+" đơn" },
          { label:"Tỷ lệ chuyển đổi",   value: (() => { const r=data.conversionRate>0?data.conversionRate:data.totalSales>0?(data.totalOrdersPlaced/data.totalSales)*100:0; return r>0?r.toFixed(2)+"%":"—"; })() },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
            {isLoading ? <KpiSkeleton /> : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{item.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Doanh thu & Đơn hàng</h3>
          </div>
          <div className="flex gap-1.5">
            {DAYS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={()=>setDays(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${days===opt.value ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-luxury-border text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? <ChartSkeleton /> : !hasChart ? (
          <EmptyChart message={`Chưa có đơn hàng đã thanh toán trong ${days} ngày qua`} />
        ) : (
          <div ref={chartRef} style={{width:"100%",height:300}}>
            {chartReady && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{fontSize:11}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize:11}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>formatVND(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r:4}} name="Đơn hàng" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} dot={false} activeDot={{r:4}} name="Doanh thu (₫)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Payment & Wrist Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Doanh thu theo Thanh toán</h3>
          {isLoading ? <ChartSkeleton /> : !data.paymentStats?.length ? (
            <EmptyChart message="Chưa có dữ liệu thanh toán" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.paymentStats} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {data.paymentStats.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%4]} />)}
                </Pie>
                <Tooltip formatter={v=>formatVND(v)+" ₫"} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Top Size Cổ Tay</h3>
          {isLoading ? <ChartSkeleton /> : !data.wristSizeStats?.length ? (
            <EmptyChart message="Chưa có dữ liệu size" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.wristSizeStats} layout="vertical" margin={{left:8}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis type="number" tick={{fontSize:11}} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="size" tick={{fontSize:11}} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill:"transparent"}} />
                <Bar dataKey="count" fill="#c9a96e" radius={[0,4,4,0]} maxBarSize={20} name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Top 8 Bán chạy
          </h3>
          {isLoading ? <div className="space-y-3">{Array(5).fill(0).map((_,i)=><SkeletonBlock key={i} h="h-10"/>)}</div>
          : topProducts.length === 0 ? <p className="text-xs text-gray-400 py-4 text-center">Chưa có dữ liệu</p>
          : topProducts.map((p,i) => (
            <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-luxury-border/50 last:border-0">
              <span className="text-[10px] font-bold text-gray-400 w-5 flex-shrink-0">#{i+1}</span>
              {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400">{p.brand?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-luxury-gold">{(p.salesCount||0).toLocaleString()} bán</p>
                <p className="text-[10px] text-gray-400">Tồn: {p.stock}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Tồn Kho Thấp
          </h3>
          {isLoading ? <div className="space-y-3">{Array(5).fill(0).map((_,i)=><SkeletonBlock key={i} h="h-10"/>)}</div>
          : bottomProducts.length === 0 ? <p className="text-xs text-gray-400 py-4 text-center">Không có cảnh báo 🎉</p>
          : bottomProducts.map(p => (
            <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-luxury-border/50 last:border-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-center w-10 flex-shrink-0 ${p.stock===0?"text-red-400 bg-red-400/10":"text-amber-400 bg-amber-400/10"}`}>
                {p.stock===0?"HẾT":p.stock}
              </span>
              {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400">Ngưỡng: {p.lowStockThreshold}</p>
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">{p.price?.toLocaleString("vi-VN")} ₫</p>
            </div>
          ))}
        </div>
      </div>

      {/* P&L */}
      {plData && (
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-luxury-gold" /> Báo Cáo P&L
            </h3>
            <span className="text-[10px] text-gray-400">{plData.summary?.days} ngày gần nhất</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label:"Doanh thu",     value:formatVND(plData.summary?.totalRevenue||0)+" ₫", color:"text-blue-500 dark:text-blue-400" },
              { label:"Giá vốn",       value:formatVND(plData.summary?.totalCogs||0)+" ₫",     color:"text-orange-500 dark:text-orange-400" },
              { label:"Lợi nhuận gộp", value:formatVND(plData.summary?.totalGrossProfit||0)+" ₫", color:"text-emerald-500 dark:text-emerald-400" },
              { label:"Biên LN",       value:(plData.summary?.totalMargin||0).toFixed(1)+"%", color:"text-luxury-gold" },
            ].map(item=>(
              <div key={item.label} className="bg-gray-50 dark:bg-luxury-darker rounded-lg p-3 border border-gray-100 dark:border-luxury-border">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                <p className={`text-base font-bold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {plData.daily?.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plData.daily} margin={{top:4,right:8,left:8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>formatVND(v)} tick={{fontSize:10}} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v,n)=>[formatVND(v)+" ₫", n==="revenue"?"Doanh thu":n==="cogs"?"Giá vốn":"Lợi nhuận"]} />
                <Legend formatter={v=>v==="revenue"?"Doanh thu":v==="cogs"?"Giá vốn":"Lợi nhuận gộp"} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={20} />
                <Bar dataKey="cogs" fill="#f97316" radius={[4,4,0,0]} maxBarSize={20} />
                <Bar dataKey="grossProfit" fill="#10b981" radius={[4,4,0,0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-gray-400 mt-2">* Giá vốn dùng costPrice từ sản phẩm. Nếu không có, ước tính 60% giá bán.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
