import DOMPurify from "dompurify";

const EmailTemplatesView = ({ templates }) => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{templates.map((t) => (
			<div key={t._id} className="group cursor-pointer">
				<div className="aspect-[3/4] bg-white border border-luxury-border rounded-3xl mb-3 overflow-hidden group-hover:shadow-2xl transition-all relative">
					<div className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
						<button className="bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg font-bold text-xs">Preview</button>
					</div>
					<div
						className="p-4 scale-50 origin-top text-[8px] opacity-40 select-none"
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(t.htmlContent || "", { USE_PROFILES: { html: true } })
						}}
					/>
				</div>
				<h5 className="font-bold text-center">{t.name}</h5>
				<p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">{t.category}</p>
			</div>
		))}
	</div>
);

export default EmailTemplatesView;
