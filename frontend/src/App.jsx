import { useEffect, useState } from "react";

import { api } from "./api/client.js";
import Dashboard from "./pages/Dashboard.jsx";

const seedWorkers = [
  { name: "张师傅", phone: "13800000001", vehicle: "4.2米厢货", service_area: "浦东新区", rating: 4.9 },
  { name: "李师傅", phone: "13800000002", vehicle: "金杯面包车", service_area: "徐汇区", rating: 4.8 },
];

export default function App() {
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refresh() {
    const [orderData, workerData] = await Promise.all([api.listOrders(), api.listWorkers()]);
    setOrders(orderData.orders);
    setWorkers(workerData.workers);
    if (workerData.workers.length === 0) {
      await Promise.all(seedWorkers.map((worker) => api.createWorker(worker)));
      const seededWorkers = await api.listWorkers();
      setWorkers(seededWorkers.workers);
    }
  }

  async function run(action, successMessage) {
    try {
      setError("");
      setSuccess("");
      await action();
      await refresh();
      if (successMessage) {
        setSuccess(successMessage);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
      throw err;
    }
  }

  useEffect(() => {
    run(async () => refresh());
  }, []);

  return (
    <>
      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}
      <Dashboard
        orders={orders}
        workers={workers}
        onCreateOrder={(payload) => run(() => api.createOrder(payload), "订单已创建")}
        onCreateWorker={(payload) => run(() => api.createWorker(payload), "师傅已添加")}
        onClaim={(orderId, workerId) => {
          const worker = workers.find((w) => w.id === workerId);
          const workerName = worker ? ` ${worker.name}` : "";
          return run(() => api.claimOrder(orderId, workerId), `${workerName} 已成功抢单`);
        }}
        onAssign={(orderId, workerId) => {
          const worker = workers.find((w) => w.id === workerId);
          const workerName = worker ? ` ${worker.name}` : "";
          return run(() => api.assignOrder(orderId, workerId), `已成功派单给${workerName}`);
        }}
        onProgress={(orderId, payload) => run(() => api.addProgress(orderId, payload), "进度已更新")}
        onReview={(orderId, payload) => run(() => api.createReview(orderId, payload), "评价已提交")}
      />
    </>
  );
}
