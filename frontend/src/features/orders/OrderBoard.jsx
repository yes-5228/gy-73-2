import { AlertCircle, ClipboardList, Truck } from "lucide-react";
import { useState } from "react";

import StatusBadge from "../../components/StatusBadge.jsx";

export default function OrderBoard({ orders, workers, onClaim, onAssign }) {
  const [selectedClaim, setSelectedClaim] = useState({});
  const [selectedAssign, setSelectedAssign] = useState({});

  function handleClaim(orderId, value) {
    setSelectedClaim((prev) => ({ ...prev, [orderId]: value }));
    if (value) {
      onClaim(orderId, Number(value));
      setSelectedClaim((prev) => ({ ...prev, [orderId]: "" }));
    }
  }

  function handleAssign(orderId, value) {
    setSelectedAssign((prev) => ({ ...prev, [orderId]: value }));
    if (value) {
      onAssign(orderId, Number(value));
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

  return (
    <div className="panel">
      <div className="panel-title">
        <ClipboardList size={20} />
        <h3>订单池与派单</h3>
      </div>
      {!hasAvailableWorkers && workers.length > 0 && (
        <div className="notice-bar">
          <AlertCircle size={16} />
          <span>当前没有可接单的师傅，请先将师傅设置为可接单状态</span>
        </div>
      )}
      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
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
              <select
                aria-label="选择抢单师傅"
                value={selectedClaim[order.id] || ""}
                onChange={(e) => handleClaim(order.id, e.target.value)}
                disabled={order.status !== "pending" || !hasAvailableWorkers}
                title={order.status !== "pending" ? "只有待抢单订单可以抢单" : !hasAvailableWorkers ? "当前没有可接单的师傅" : "选择师傅进行抢单"}
              >
                <option value="">{order.status !== "pending" ? "不可抢单" : !hasAvailableWorkers ? "无可接单师傅" : "师傅抢单"}</option>
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
              <select
                aria-label="选择派单师傅"
                value={selectedAssign[order.id] || ""}
                onChange={(e) => handleAssign(order.id, e.target.value)}
                disabled={order.status === "completed" || order.status === "in_progress" || !hasAvailableWorkers}
                title={order.status === "completed" || order.status === "in_progress" ? "当前订单状态不能派单" : !hasAvailableWorkers ? "当前没有可接单的师傅" : "选择师傅进行派单"}
              >
                <option value="">{order.status === "completed" || order.status === "in_progress" ? "不可派单" : !hasAvailableWorkers ? "无可接单师傅" : "平台派单"}</option>
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
          </article>
        ))}
        {orders.length === 0 && <p className="empty">暂无订单</p>}
      </div>
    </div>
  );
}
