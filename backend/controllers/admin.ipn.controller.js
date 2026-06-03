import ProcessedIPN from "../models/processedIPN.model.js";
import Order from "../models/order.model.js";
import { logAction } from "../middleware/permission.middleware.js";

export const listFailedIPNs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filter = { status: "failed" };
    const total = await ProcessedIPN.countDocuments(filter);
    const items = await ProcessedIPN.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin.ipn] listFailedIPNs failed:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const linkIPNToOrder = async (req, res) => {
  try {
    const { transactionId, orderCode, provider = "vnpay" } = req.body;
    if (!transactionId || !orderCode)
      return res
        .status(400)
        .json({ message: "transactionId and orderCode required" });

    const existing = await ProcessedIPN.findOne({ provider, transactionId });
    if (existing && existing.status === "processed") {
      return res.status(409).json({ message: "Transaction already processed" });
    }

    const order = await Order.findOne({ orderCode });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.transactionId = transactionId;
      order.ipnVerified = true;
      order.paidAt = new Date();
      order.trackingEvents.push({
        status: "confirmed",
        message: `Reconciled IPN ${transactionId} via admin`,
        timestamp: new Date(),
        updatedBy: req.user?._id || "system",
      });
      await order.save();
    }

    // Create or update ProcessedIPN as processed
    await ProcessedIPN.findOneAndUpdate(
      { provider, transactionId },
      {
        provider,
        transactionId,
        orderCode,
        status: "processed",
        payload: {
          reconciledBy: req.user?._id || "admin",
          reconciledAt: new Date(),
        },
        processedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    await logAction({
      req,
      action: "ADMIN_RECONCILE_IPN",
      targetId: order._id,
      targetModel: "Order",
      details: `Linked ${transactionId} -> ${orderCode}`,
    });

    res.json({
      success: true,
      message: "IPN linked and order marked paid",
      orderCode,
    });
  } catch (err) {
    console.error("[admin.ipn] linkIPNToOrder failed:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const renderReconcilePage = (req, res) => {
  // Minimal protected HTML admin page; frontend will use fetch with credentials
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><title>Reconcile IPNs</title></head><body>
  <h2>Failed IPNs</h2>
  <div id="list"></div>
  <script>
  async function getCsrf(){ const r=await fetch('/api/csrf-token',{credentials:'include'}); return (await r.json()).token; }
  async function load(){ const r=await fetch('/api/admin/ipns/failed',{credentials:'include'}); const j=await r.json(); const container=document.getElementById('list'); container.innerHTML=''; j.items.forEach(it=>{
    const el=document.createElement('div'); el.style.border='1px solid #ccc'; el.style.padding='8px'; el.style.margin='6px';
    el.innerHTML = '<b>txn:</b> ' + (it.transactionId || '') + ' <b>orderCode:</b> ' + (it.orderCode || '') + ' <pre>' + JSON.stringify(it.payload) + '</pre>';
    const inputTxn=document.createElement('input'); inputTxn.placeholder='txn id'; inputTxn.value=it.transactionId||'';
    const inputOrder=document.createElement('input'); inputOrder.placeholder='order code'; inputOrder.value=it.orderCode||'';
    const btn=document.createElement('button'); btn.textContent='Link & Mark Paid'; btn.onclick=async ()=>{
      const token=await getCsrf();
      const body={ transactionId: inputTxn.value.trim(), orderCode: inputOrder.value.trim(), provider: it.provider };
      const res=await fetch('/api/admin/ipns/link',{method:'POST',credentials:'include',headers:{'content-type':'application/json','x-csrf-token':token},body:JSON.stringify(body)});
      if(res.ok){ alert('Linked'); load(); } else { alert('Error: '+(await res.text())); }
    };
    el.appendChild(document.createElement('br'));
    el.appendChild(inputTxn); el.appendChild(inputOrder); el.appendChild(btn);
    container.appendChild(el);
  }); }
  load();
  </script>
  </body></html>`;
  res.send(html);
};

export default { listFailedIPNs, linkIPNToOrder, renderReconcilePage };
