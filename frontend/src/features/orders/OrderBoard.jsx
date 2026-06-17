import { AlertCircle, ClipboardList, Loader2, Truck } from "lucide-react";
import { useState } from "react";

import StatusBadge from "../../components/StatusBadge.jsx";

export default function OrderBoard({ orders, workers, onClaim, onAssign }) {
  const [selectedClaim, setSelectedClaim] = useState({});
  const [selectedAssign, setSelectedAssign] = useState({});
  const [claimingOrderId, setClaimingOrderId] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState(null);

  async function handleClaim(orderId, value) {
    setSelectedClaim((prev) => ({ ...prev, [orderId]: value }));
    if (!value || claimingOrderId || assigningOrderId) return;
    const workerId = Number(value);
    setClaimingOrderId(orderId);
    try {
      await onClaim(orderId, workerId);
    } catch (_err) {
    } finally {
      setClaimingOrderId(null);
      setSelectedClaim((prev) => ({ ...prev, [orderId]: "" }));
    }
  }

  async function handleAssign(orderId, value) {
    setSelectedAssign((prev) => ({ ...prev, [orderId]: value }));
    if (!value || claimingOrderId || assigningOrderId) return;
    const workerId = Number(value);
    setAssigningOrderId(orderId);
    try {
      await onAssign(orderId, workerId);
    } catch (_err) {
    } finally {
      setAssigningOrderId(null);
      setSelectedAssign((prev) => ({ ...prev, [orderId]: "" }));
    }
  }

  function canSelectWorker(worker) {
    return worker.status === "available";
  }

  function workerOptionLabel(worker) {
    const stateLabel = worker.status === "available" ? "可接单" : worker.status === "busy" ? "服务中" : "离线";
    return `${worker.name}（${stateLabel}）`;
  }

  const hasAvailableWorkers = workers.some((w) => canSelectWorker(w));
  const anyBusy = claimingOrderId !== null || assigningOrderId !== null;

  return (
    <div className="panel">
      <div className="panel-title">
        <ClipboardList size={20} />
        <h3>订单池与派单</h3>
        {anyBusy && (
          <span className="inline-spinner">
            <Loader2 size={16} className="spin" />
            <span>处理中…</span>
          </span>
        )}
      </div>
      {!hasAvailableWorkers && workers.length > 0 && (
        <div className="notice-bar">
          <AlertCircle size={16} />
          <span>当前没有可接单的师傅，请先将师傅设置为可接单状态</span>
        </div>
      )}
      <div className="order-list">
        {orders.map((order) => {
          const isClaiming = claimingOrderId === order.id;
          const isAssigning = assigningOrderId === order.id;
          const orderBusy = isClaiming || isAssigning;
          return (
            <article className={`order-card ${orderBusy ? "order-card-busy" : ""}`} key={order.id}>
              <div className="order-card-head">
                <div>
                  <h4>{order.customer_name}</h4>
                  <p>{order.move_date} {order.move_time}</p>
                </div>
                <StatusBadge status={order.status} label={order.status_label} />
              </div>
              <div className="route">
                <span>{order.origin}</span>
                <Truck size={16} />
                <span>{order.destination}</span>
              </div>
              <p className="muted">物品：{order.items || "未填写"}</p>
              <div className="assignment">
                <span>抢单师傅：{order.claimed_by?.name || "暂无"}</span>
                <span>派单师傅：{order.assigned_to?.name || "暂无"}</span>
              </div>
              <div className="button-row">
                <div className="select-wrap">
                  {isClaiming && (
                    <span className="select-overlay">
                      <Loader2 size={16} className="spin" />
                      <span>抢单处理中…</span>
                    </span>
                  )}
                  <select
                    aria-label="选择抢单师傅"
                    value={selectedClaim[order.id] || ""}
                    onChange={(e) => handleClaim(order.id, e.target.value)}
                    disabled={order.status !== "pending" || !hasAvailableWorkers || orderBusy || anyBusy}
                    title={order.status !== "pending" ? "只有待抢单订单可以抢单" : !hasAvailableWorkers ? "当前没有可接单的师傅" : orderBusy ? "正在处理，请稍候" : "选择师傅进行抢单"}
                  >
                    <option value="">
                      {isClaiming ? "抢单处理中…" : order.status !== "pending" ? "不可抢单" : !hasAvailableWorkers ? "无可接单师傅" : "师傅抢单"}
                    </option>
                    {workers.map((worker) => (
                      <option
                        value={worker.id}
                        key={worker.id}
                        disabled={!canSelectWorker(worker)}
                      >
                        {workerOptionLabel(worker)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="select-wrap">
                  {isAssigning && (
                    <span className="select-overlay">
                      <Loader2 size={16} className="spin" />
                      <span>派单处理中…</span>
                    </span>
                  )}
                  <select
                    aria-label="选择派单师傅"
                    value={selectedAssign[order.id] || ""}
                    onChange={(e) => handleAssign(order.id, e.target.value)}
                    disabled={(order.status === "completed" || order.status === "in_progress") || !hasAvailableWorkers || orderBusy || anyBusy}
                    title={order.status === "completed" || order.status === "in_progress" ? "当前订单状态不能派单" : !hasAvailableWorkers ? "当前没有可接单的师傅" : orderBusy ? "正在处理，请稍候" : "选择师傅进行派单"}
                  >
                    <option value="">
                      {isAssigning ? "派单处理中…" : order.status === "completed" || order.status === "in_progress" ? "不可派单" : !hasAvailableWorkers ? "无可接单师傅" : "平台派单"}
                    </option>
                    {workers.map((worker) => (
                      <option
                        value={worker.id}
                        key={worker.id}
                        disabled={!canSelectWorker(worker)}
                      >
                        {workerOptionLabel(worker)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          );
        })}
        {orders.length === 0 && <p className="empty">暂无订单</p>}
      </div>
    </div>
  );
}
