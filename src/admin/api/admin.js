// Giữ API style giống seller/api
export async function adminFetchOrders(params = {}) {
  // TODO: call GET /admin/orders
  return { content: [] }
}
export async function adminUpdateOrderStatus(orderId, next, note) {
  // TODO: call PATCH /admin/orders/:id/status
  return { ok: true }
}
export async function adminFetchUsers(params = {}) {
  // TODO: call GET /admin/users
  return { content: [] }
}
export async function adminToggleUserActive(userId, active) {
  // TODO: call PATCH /admin/users/:id
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
