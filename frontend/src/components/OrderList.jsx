import { Search, Download, Eye } from 'lucide-react';
import useOrdersList from '../hooks/useOrdersList';

export default function OrderList({ onOpenOrder }) {
  const { orders, loading, search, setSearch, exportCsv } = useOrdersList();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đơn hàng</h1>
          <p className="text-sm text-gray-500">Danh sách đơn hàng admin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn, SĐT..."
              className="pl-9 pr-3 py-2 rounded-xl border"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button type="button" onClick={exportCsv} className="px-3 py-2 bg-white border rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="py-2">Mã Đơn</th>
              <th className="py-2">Khách hàng</th>
              <th className="py-2">Tổng tiền</th>
              <th className="py-2">Trạng thái</th>
              <th className="py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400">
                  Không tìm thấy đơn hàng
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-t">
                  <td className="py-3 font-bold">{o.orderCode || (o._id || '').slice(0, 8)}</td>
                  <td className="py-3">{o.shippingDetails?.fullName || o.user?.name || 'N/A'}</td>
                  <td className="py-3">{o.totalAmount?.toLocaleString?.() || o.totalAmount} ₫</td>
                  <td className="py-3">{o.status}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenOrder?.(o)}
                      className="px-2 py-1 border rounded flex items-center gap-2 ml-auto"
                    >
                      <Eye className="w-4 h-4" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
