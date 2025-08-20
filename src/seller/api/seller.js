import api from '../../api/client'

// --- ORDERS ---
export async function fetchOrders({ page=0, size=20, status, q } = {}) {
  // TẠM: dùng /api/orders (trả đơn của current user). 
  // Nếu backend có endpoint cho seller (ví dụ /api/seller/orders) hãy đổi sang đó.
  const { data } = await api.get('/api/orders', { params: { page, size, status, q } })
  return data?.result || []
}

export async function updateOrderStatus(orderId, target, note) {
  // Bạn đã có endpoint: /api/ordersworkflow/{id}/status (theo Postman bạn đính kèm)
  const { data } = await api.post(`/api/ordersworkflow/${orderId}/status`, { target, note })
  return data?.result
}

// --- PRODUCTS ---
export async function fetchProducts({ page=0, size=20, name } = {}) {
  const { data } = await api.get('/api/products', { params: { page, size, name } })
  const res = data?.result
  return Array.isArray(res) ? { content: res } : res
}

export async function createProduct(payload) {
  const { data } = await api.post('/api/products', payload)
  return data?.result
}

export async function getProduct(id) {
  const { data } = await api.get(`/api/products/${id}`)
  return data?.result
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/api/products/${id}`, payload)
  return data?.result
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/api/products/${id}`)
  return data?.result
}
