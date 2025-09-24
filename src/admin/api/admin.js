import api from '../../api/client'


// Giữ API style giống seller/api
export async function adminFetchOrders(params = {}) {
  const { data } = await api.get(`/api/admin/orders`)
  return {content: data?.result}
}
export async function adminUpdateOrderStatus(orderId, next, note) {
  // TODO: call PATCH /admin/orders/:id/status
  return { ok: true }
}
export async function adminFetchUsers(params = {}) {
  // TODO: call GET /admin/users
  const { data } = await api.get(`/api/admin/users`)
  return {content: data?.result}
}
export async function adminToggleUserActive(userId, active) {
  // TODO: call PATCH /admin/users/:id
  return { ok: true }
}

export async function adminUpdateUserStatus(userId, status) {
  // TODO: call PATCH /admin/orders/:id/status
  return { ok: true }
}

export async function adminFetchProducts(params = {}) {
  // TODO: call GET /admin/products
  return { content: [] }
}
export async function adminToggleProductVisible(productId, visible) {
  // TODO: call PATCH /admin/products/:id
  return { ok: true }
}
