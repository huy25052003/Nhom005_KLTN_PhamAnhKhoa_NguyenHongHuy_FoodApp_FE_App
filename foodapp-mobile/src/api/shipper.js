// src/api/shipper.js
import { api } from "./axios";

// Lấy danh sách đơn hàng theo trạng thái (cho shipper)
export async function getShipperOrders(status) {
  // Giả sử API backend hỗ trợ filter theo status
  // Nếu backend trả về Page<Order>, ta lấy .content
  const res = await api.get("api/orders", { params: { status, size: 50 } }); 
  return res.data?.content || res.data || []; 
}

// Shipper nhận đơn (Chuyển từ CONFIRMED -> DELIVERING)
export async function pickUpOrder(orderId) {
  const res = await api.put(`api/orders/${orderId}/status`, null, { 
    params: { status: "DELIVERING" } 
  });
  return res.data;
}

// Shipper hoàn thành đơn (Chuyển từ DELIVERING -> DONE)
export async function completeOrder(orderId) {
  const res = await api.put(`api/orders/${orderId}/status`, null, { 
    params: { status: "DONE" } 
  });
  return res.data;
}