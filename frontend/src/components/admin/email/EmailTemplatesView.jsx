import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Save, Plus, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";

const EmailTemplatesView = ({ templates, onUpdateTemplate, onCreateTemplate, onDeleteTemplate }) => {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [resetKey, setResetKey] = useState(0);
	const iframeRef = useRef(null);

	const [isCreating, setIsCreating] = useState(false);
	const [newTemplate, setNewTemplate] = useState({
		name: "",
		subject: "",
		description: "",
		category: "marketing",
	});

	const handleEdit = () => {
		setIsEditing(true);
		if (iframeRef.current) {
			iframeRef.current.contentDocument.designMode = "on";
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setResetKey(prev => prev + 1); // Reset iframe content
	};

	const handleSave = async () => {
		if (!iframeRef.current) return;
		setIsSaving(true);
		const newHtml = "<!DOCTYPE html>\n" + iframeRef.current.contentDocument.documentElement.outerHTML;
		
		const success = await onUpdateTemplate(selectedTemplate._id, { htmlContent: newHtml });
		setIsSaving(false);
		if (success) {
			setSelectedTemplate({ ...selectedTemplate, htmlContent: newHtml });
			setIsEditing(false);
			if (iframeRef.current) {
				iframeRef.current.contentDocument.designMode = "off";
			}
		}
	};

	const handleCreate = async () => {
		setIsSaving(true);
		const defaultHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${newTemplate.name}</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Xin chào,</h2>
        <p>Bắt đầu chỉnh sửa nội dung email của bạn tại đây.</p>
    </div>
</body>
</html>`;
		const success = await onCreateTemplate({ ...newTemplate, htmlContent: defaultHtml });
		setIsSaving(false);
		if (success) {
			setIsCreating(false);
			setNewTemplate({ name: "", subject: "", description: "", category: "marketing" });
		}
	};

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Card Tạo mới */}
				<div 
					className="group cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center p-6 min-h-[300px] hover:border-[#1e40af] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
					onClick={() => setIsCreating(true)}
				>
					<div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[#1e40af] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
						<Plus className="w-6 h-6" />
					</div>
					<h5 className="font-bold text-center text-gray-700 dark:text-gray-300">Tạo mẫu mới</h5>
					<p className="text-xs text-gray-500 text-center mt-2">Thêm mẫu email tùy chỉnh</p>
				</div>
				{templates.map((t) => (
					<div key={t._id} className="group cursor-pointer" onClick={() => { setSelectedTemplate(t); setResetKey(k => k + 1); }}>
						<div className="aspect-[3/4] bg-white border border-luxury-border rounded-3xl mb-3 overflow-hidden group-hover:shadow-2xl transition-all relative">
							<div className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
								<button className="bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg font-bold text-xs">Xem chi tiết</button>
							</div>
							<div className="absolute inset-0 pointer-events-none overflow-hidden bg-gray-50 opacity-80">
								<iframe
									srcDoc={t.htmlContent}
									className="absolute top-0 left-0 w-[250%] h-[250%] border-none origin-top-left scale-[0.4]"
									tabIndex="-1"
								/>
							</div>
						</div>
						<h5 className="font-bold text-center">{t.name}</h5>
						<p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">{t.category}</p>
					</div>
				))}
			</div>

			<AnimatePresence>
				{selectedTemplate && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
						onClick={() => {
							if (!isEditing) setSelectedTemplate(null);
						}}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
						>
							<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
								<div>
									<h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
									<p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
								</div>
								<div className="flex items-center gap-3">
									{isEditing ? (
										<>
											<button
												onClick={handleCancel}
												className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
											>
												Hủy
											</button>
											<button
												onClick={handleSave}
												disabled={isSaving}
												className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-lux-dark rounded-lg text-sm font-bold hover:bg-yellow-500 transition disabled:opacity-50"
											>
												{isSaving ? <span className="animate-spin w-4 h-4 border-2 border-lux-dark border-t-transparent rounded-full"></span> : <Save className="w-4 h-4" />}
												Lưu thay đổi
											</button>
										</>
									) : (
										<>
											<button
												onClick={() => {
													onDeleteTemplate(selectedTemplate._id);
													setSelectedTemplate(null);
												}}
												className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition"
											>
												<Trash2 className="w-4 h-4" /> Xóa mẫu
											</button>
											<button
												onClick={handleEdit}
												className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
											>
												<Edit2 className="w-4 h-4" /> Chỉnh sửa (Kéo thả, bôi đen, xóa chữ)
											</button>
											<button
												onClick={() => setSelectedTemplate(null)}
												className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-2"
											>
												<X className="w-5 h-5 text-gray-500" />
											</button>
										</>
									)}
								</div>
							</div>
							<div className={`p-4 ${isEditing ? 'bg-gray-200' : 'bg-gray-50 dark:bg-black'} overflow-y-auto flex-1 flex flex-col items-center`}>
								{isEditing && (
									<p className="text-xs text-red-500 font-medium mb-3 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
										Chú ý: Trình chỉnh sửa trực quan. Bạn có thể bôi đen chữ để sửa hoặc xóa. Tuyệt đối không xóa các biến như {'{{order.orderCode}}'} hoặc {'{{fullName}}'} vì hệ thống cần dùng để tự động điền thông tin.
									</p>
								)}
								<div className={`w-full max-w-[600px] h-full min-h-[600px] bg-white ${isEditing ? 'shadow-[0_0_0_4px_#3b82f6]' : 'shadow-md'} transition-all overflow-hidden rounded`}>
									<iframe
										key={resetKey}
										ref={iframeRef}
										srcDoc={selectedTemplate.htmlContent}
										className="w-full h-full min-h-[600px] border-none"
										title="Email Preview"
										onLoad={(e) => {
											if (isEditing) {
												e.target.contentDocument.designMode = "on";
											}
										}}
									/>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}

				{isCreating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
						>
							<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
								<h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo mẫu email mới</h3>
								<button onClick={() => setIsCreating(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
									<X className="w-5 h-5 text-gray-500" />
								</button>
							</div>
							<div className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên mẫu</label>
									<input 
										type="text" 
										value={newTemplate.name} 
										onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold" 
										placeholder="Ví dụ: Chúc mừng sinh nhật"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chủ đề email (Subject)</label>
									<input 
										type="text" 
										value={newTemplate.subject} 
										onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold" 
										placeholder="Ví dụ: Chúc mừng sinh nhật khách hàng thân thiết!"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục</label>
									<select 
										value={newTemplate.category}
										onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold"
									>
										<option value="marketing">Marketing</option>
										<option value="transactional">Giao dịch (Transactional)</option>
										<option value="automation">Tự động (Automation)</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
									<textarea 
										value={newTemplate.description} 
										onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold resize-none" 
										rows="3"
										placeholder="Mô tả ngắn về mẫu email này..."
									></textarea>
								</div>
							</div>
							<div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
								<button 
									onClick={() => setIsCreating(false)}
									className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 transition"
								>
									Hủy
								</button>
								<button 
									onClick={handleCreate}
									disabled={isSaving || !newTemplate.name || !newTemplate.subject}
									className="px-4 py-2 bg-luxury-gold text-lux-dark rounded-lg text-sm font-bold hover:bg-yellow-500 transition disabled:opacity-50"
								>
									{isSaving ? 'Đang tạo...' : 'Tạo mới'}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default EmailTemplatesView;
