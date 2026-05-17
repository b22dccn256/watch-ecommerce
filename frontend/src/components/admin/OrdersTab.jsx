import { useState } from "react";
import OrderList from "../OrderList";
import OrderDetailModal from "../OrderDetailModal";

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
    setSelectedOrder(null);
  };

  return (
    <div>
      <OrderList
        key={refreshKey}
        onOpenOrder={(o) => setSelectedOrder(o)}
      />
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
