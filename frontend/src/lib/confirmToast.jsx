import { toast } from "react-hot-toast";

export const confirmToast = (message, onConfirm) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3 min-w-[250px]">
        <p className="font-medium text-white">{message}</p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            Hủy
          </button>
          <button
            className="px-4 py-1.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    ),
    { duration: 5000 },
  );
};
