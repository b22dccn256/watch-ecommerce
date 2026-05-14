import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Ghost, RefreshCw, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const AITab = () => {
	const [isRunningOrders, setIsRunningOrders] = useState(false);
	const [isRunningUsers, setIsRunningUsers] = useState(false);
	const [logs, setLogs] = useState([
		{ time: new Date().toLocaleTimeString(), msg: "Há»‡ thá»‘ng AI Ä‘ang á»Ÿ tráº¡ng thĂ¡i chá»...", type: "info" },
	]);

	const addLog = (msg, type = "info") => {
		setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 10));
	};

	const handleConfirmOrders = async () => {
		setIsRunningOrders(true);
		addLog("Äang khá»Ÿi cháº¡y AI phĂ¢n tĂ­ch Ä‘Æ¡n hĂ ng...", "process");
		try {
			const res = await axios.post("/ai/automation/confirm-orders");
			addLog(res.data.message, "success");
			toast.success(res.data.message);
		} catch {
			addLog("Lá»—i khi cháº¡y AI xĂ¡c nháº­n Ä‘Æ¡n hĂ ng", "error");
			toast.error("Lá»—i AI xĂ¡c nháº­n Ä‘Æ¡n hĂ ng");
		} finally {
			setIsRunningOrders(false);
		}
	};

	const handleCleanupUsers = async () => {
		setIsRunningUsers(true);
		addLog("Äang quĂ©t tĂ i khoáº£n spam/khĂ´ng há»£p lá»‡...", "process");
		try {
			const res = await axios.post("/ai/automation/cleanup-users");
			addLog(res.data.message, "success");
			toast.success(res.data.message);
		} catch {
			addLog("Lá»—i khi dá»n dáº¹p tĂ i khoáº£n rĂ¡c", "error");
			toast.error("Lá»—i xĂ³a tĂ i khoáº£n rĂ¡c");
		} finally {
			setIsRunningUsers(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<ShieldCheck className="w-7 h-7 text-luxury-gold" />
						Há»‡ Thá»‘ng Tá»± Äá»™ng HĂ³a AI
					</h2>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm mt-1">Sá»­ dá»¥ng trĂ­ tuá»‡ nhĂ¢n táº¡o Ä‘á»ƒ tá»‘i Æ°u hĂ³a váº­n hĂ nh cá»­a hĂ ng.</p>
				</div>
				<div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
					<div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
					<span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-nowrap">Há»‡ thá»‘ng Ä‘ang hoáº¡t Ä‘á»™ng</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* AI Order Confirmation */}
				<motion.div 
					whileHover={{ y: -5 }}
					className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-3xl p-8 space-y-6 relative overflow-hidden group shadow-xl dark:shadow-none"
				>
					<div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-luxury-gold/10 transition-colors" />
					
					<div className="flex items-start justify-between">
						<div className="p-3 bg-luxury-gold/10 rounded-2xl">
							<Zap className="w-6 h-6 text-luxury-gold" />
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">XĂ¡c Nháº­n ÄÆ¡n ThĂ´ng Minh</h3>
						<p className="text-sm text-gray-500 dark:text-luxury-text-muted leading-relaxed">
							AI phĂ¢n tĂ­ch dá»¯ liá»‡u khĂ¡ch hĂ ng, lá»‹ch sá»­ mua hĂ ng vĂ  thĂ´ng tin váº­n chuyá»ƒn Ä‘á»ƒ tá»± Ä‘á»™ng phĂª duyá»‡t cĂ¡c Ä‘Æ¡n COD há»£p lá»‡.
						</p>
					</div>

					<ul className="space-y-3">
						<li className="flex items-center gap-3 text-xs text-gray-500 dark:text-luxury-text-muted">
							<CheckCircle2 className="w-4 h-4 text-emerald-500" /> PhĂ¢n tĂ­ch rá»§i ro gian láº­n (Fraud Detection)
						</li>
						<li className="flex items-center gap-3 text-xs text-gray-500 dark:text-luxury-text-muted">
							<CheckCircle2 className="w-4 h-4 text-emerald-500" /> XĂ¡c thá»±c cháº¥t lÆ°á»£ng thĂ´ng tin giao hĂ ng
						</li>
					</ul>

					<button 
						onClick={handleConfirmOrders}
						disabled={isRunningOrders}
						className="w-full py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border text-gray-700 dark:text-white hover:bg-luxury-gold dark:hover:bg-luxury-gold hover:text-luxury-dark rounded-xl font-bold transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md dark:shadow-none"
					>
						{isRunningOrders ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
						KĂ­ch hoáº¡t AI PhĂª Duyá»‡t
					</button>
				</motion.div>

				{/* AI Spam Cleanup */}
				<motion.div 
					whileHover={{ y: -5 }}
					className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-3xl p-8 space-y-6 relative overflow-hidden group shadow-xl dark:shadow-none"
				>
					<div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />

					<div className="flex items-start justify-between">
						<div className="p-3 bg-red-500/10 rounded-2xl">
							<Ghost className="w-6 h-6 text-red-400" />
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Dá»n Dáº¹p TĂ i Khoáº£n RĂ¡c</h3>
						<p className="text-sm text-gray-500 dark:text-luxury-text-muted leading-relaxed">
							Sá»­ dá»¥ng quy táº¯c Naming Patterns vĂ  Behavior Analysis Ä‘á»ƒ phĂ¡t hiá»‡n vĂ  loáº¡i bá» cĂ¡c tĂ i khoáº£n clone, spam hoáº·c khĂ´ng hoáº¡t Ä‘á»™ng.
						</p>
					</div>

					<ul className="space-y-3">
						<li className="flex items-center gap-3 text-xs text-gray-500 dark:text-luxury-text-muted">
							<AlertTriangle className="w-4 h-4 text-amber-500" /> Nháº­n diá»‡n User qua Regex & Naming
						</li>
						<li className="flex items-center gap-3 text-xs text-gray-500 dark:text-luxury-text-muted">
							<AlertTriangle className="w-4 h-4 text-amber-500" /> Tá»± Ä‘á»™ng xĂ³a tĂ i khoáº£n khĂ´ng phĂ¡t sinh Ä‘Æ¡n hĂ ng
						</li>
					</ul>

					<button 
						onClick={handleCleanupUsers}
						disabled={isRunningUsers}
						className="w-full py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border text-gray-700 dark:text-white hover:bg-red-500 dark:hover:bg-red-500 hover:text-white rounded-xl font-bold transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md dark:shadow-none"
					>
						{isRunningUsers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
						QuĂ©t & Dá»n Dáº¹p Spam
					</button>
				</motion.div>
			</div>

			{/* AI Logs / Status */}
			<div className="bg-slate-950 dark:bg-luxury-darker border border-slate-900 dark:border-luxury-border rounded-3xl p-6 shadow-2xl">
				<div className="flex items-center gap-2 mb-4">
					<Terminal className="w-4 h-4 text-luxury-gold" />
					<h3 className="text-sm font-bold text-white uppercase tracking-widest">Nháº­t kĂ½ AI System</h3>
				</div>
				<div className="space-y-3 font-mono text-[11px]">
					{logs.map((log, i) => (
						<div key={i} className="flex gap-4 border-l border-slate-800 dark:border-luxury-border pl-4">
							<span className="text-slate-600 dark:text-luxury-text-muted whitespace-nowrap">[{log.time}]</span>
							<span className={
								log.type === "success" ? "text-emerald-400" : 
								log.type === "error" ? "text-red-400" : 
								log.type === "process" ? "text-luxury-gold animate-pulse" : 
								"text-white"
							}>
								{log.msg}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default AITab;

