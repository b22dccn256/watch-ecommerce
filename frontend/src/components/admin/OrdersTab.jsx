import React, { useState } from "react";
import OrderList from "../OrderList";
import OrderDetailModal from "../OrderDetailModal";

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  return (
    <div className="p-0">
      <OrderList onOpenOrder={(o) => setSelectedOrder(o)} />
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
