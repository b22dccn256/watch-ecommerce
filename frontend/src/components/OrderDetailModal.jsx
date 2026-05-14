import React, { useState } from "react";
import { X, Printer } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export default function OrderDetailModal({ order, onClose, onSaved }) {
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [form, setForm] = useState({
    carrier: order?.carrier || "",
    carrierTrackingNumber: order?.carrierTrackingNumber || "",
    refundAmount: order?.refundAmount || "",
  });

  if (!order) return null;

  const handleChangeStatus = (newStatus) => {
    if (newStatus === order.status) return;
    // require confirmation for cancel
    if (newStatus === "cancelled") {
      setConfirmConfig({
        title: "Há»§y Ä‘Æ¡n hĂ ng",
        message: "Báº¡n cháº¯c cháº¯n muá»‘n há»§y Ä‘Æ¡n? KhĂ¡ch hĂ ng sáº½ Ä‘Æ°á»£c thĂ´ng bĂ¡o.",
        variant: "danger",
        confirmLabel: "Há»§y Ä‘Æ¡n",
        onConfirm: async () => {
          await performStatusUpdate(newStatus);
        }
      });
      return;
    }
    performStatusUpdate(newStatus);
  };

  const performStatusUpdate = async (newStatus) => {
    setStatusChanging(true);
    try {
      await axios.patch(`/orders/${order._id}/status`, { status: newStatus });
      toast.success("ÄĂ£ cáº­p nháº­t tráº¡ng thĂ¡i");
      if (onSaved) onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lá»—i khi cáº­p nháº­t tráº¡ng thĂ¡i");
    } finally {
      setStatusChanging(false);
      setConfirmConfig(null);
    }
  };

  const saveDetails = async () => {
    setSaving(true);
    try {
      await axios.patch(`/orders/${order._id}`, { carrier: form.carrier, carrierTrackingNumber: form.carrierTrackingNumber, refundAmount: form.refundAmount });
      toast.success("ÄĂ£ lÆ°u chi tiáº¿t");
      if (onSaved) onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lá»—i khi lÆ°u chi tiáº¿t");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    try {
      const win = window.open("", "_blank");
      if (!win) return toast.error("KhĂ´ng thá»ƒ má»Ÿ cá»­a sá»• in");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice</title></head><body><h2>Invoice #${order.orderCode || order._id}</h2><p>KhĂ¡ch: ${order.shippingDetails?.fullName || order.user?.name || ''}</p><p>Äá»‹a chá»‰: ${order.shippingDetails?.address || ''} ${order.shippingDetails?.city || ''}</p><hr/>` +
        `<ul>` + (order.products || []).map(p => `<li>${p.product?.name || p.name} x${p.quantity} - ${order.currency === 'USD' ? '$'+p.price : (p.price?.toLocaleString('vi-VN') + ' â‚«')}</li>`).join('') + `</ul><hr/><p>Tá»•ng: ${order.currency === 'USD' ? '$'+order.totalAmount : (order.totalAmount?.toLocaleString('vi-VN') + ' â‚«')}</p></body></html>`;
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch (e) {
      toast.error("Lá»—i khi in hĂ³a Ä‘Æ¡n");
    }
  };

  return (
    <>
    <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-luxury-dark rounded-2xl w-full max-w-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Chi tiáº¿t Ä‘Æ¡n hĂ ng #{order.orderCode || order._id?.slice(0,8)}</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-2"><Printer className="w-4 h-4" /> In</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">KhĂ¡ch hĂ ng</p>
              <p className="font-bold">{order.shippingDetails?.fullName || order.user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">NgĂ y táº¡o</p>
              <p className="font-bold">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">Äá»‹a chá»‰</p>
            <p className="font-bold">{order.shippingDetails?.address}, {order.shippingDetails?.city}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">ÄÆ¡n vá»‹ váº­n chuyá»ƒn</label>
              <input value={form.carrier} onChange={e => setForm(prev => ({...prev, carrier: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-gray-500">MĂ£ váº­n Ä‘Æ¡n</label>
              <input value={form.carrierTrackingNumber} onChange={e => setForm(prev => ({...prev, carrierTrackingNumber: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">Sáº£n pháº©m</p>
            <ul className="list-disc pl-5">
              {order.products?.map((p, i) => (
                <li key={i} className="text-sm">{p.product?.name || p.name} x{p.quantity} â€” {order.currency === 'USD' ? '$' + p.price : p.price?.toLocaleString('vi-VN') + ' â‚«'}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <select value={order.status} onChange={(e)=>handleChangeStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value={order.status}>{order.status}</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
            <div className="ml-auto text-right">
              <div className="font-bold">{order.currency === 'USD' ? '$' + order.totalAmount : order.totalAmount?.toLocaleString('vi-VN') + ' â‚«'}</div>
              <div className="text-xs text-gray-500">Tráº¡ng thĂ¡i hiá»‡n táº¡i: {order.status}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={saveDetails} disabled={saving} className="px-4 py-2 bg-luxury-gold text-white rounded-lg">{saving ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}</button>
            <button onClick={() => { setForm({ carrier: order?.carrier || '', carrierTrackingNumber: order?.carrierTrackingNumber || ''}); onClose(); }} className="px-4 py-2 border rounded-lg">ÄĂ³ng</button>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}

