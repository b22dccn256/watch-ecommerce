import { Clock } from "lucide-react";

const AutomationCard = ({ title, desc, active, onToggle }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-3xl flex items-start gap-5 md:gap-6 group hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
    <div className="flex-1 space-y-3 font-sans">
      <div className="flex items-center gap-3">
        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
          {title}
        </h4>
        <span
          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
            active
              ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
              : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
          }`}
        >
          {active ? "Đang chạy" : "Đã tắt"}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[90%]">
        {desc || "Mẫu email tiếp thị tự động"}
      </p>
    </div>

    <div className="shrink-0 flex flex-col items-center gap-2">
      {/* Nút Toggle Switch */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
        }`}
        role="switch"
        aria-checked={active}
      >
        <span className="sr-only">Toggle automation</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {active ? "Bật" : "Tắt"}
      </span>
    </div>
  </div>
);

const EmailAutomationView = ({ templates = [], onUpdateTemplate }) => {
  const marketingTemplates = templates.filter(
    (t) => t.category === "marketing",
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-700 dark:text-amber-400">
        <Clock className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          Các tiến trình tự động được xử lý bởi BullMQ Worker & Redis mỗi 1 giờ.
          (Chỉ áp dụng cho mẫu email Marketing)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketingTemplates.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500">
            Không có mẫu email nào thuộc danh mục "Marketing". Vui lòng tạo hoặc
            cập nhật danh mục trong tab Mẫu Email.
          </div>
        ) : (
          marketingTemplates.map((template) => (
            <AutomationCard
              key={template._id}
              title={template.name}
              desc={template.description}
              active={template.isActive}
              onToggle={() =>
                onUpdateTemplate(template._id, { isActive: !template.isActive })
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EmailAutomationView;
