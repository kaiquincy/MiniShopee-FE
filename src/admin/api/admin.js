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
  const { data } = await api.get(`/api/admin/products`)
  return {content: data?.result?.content || []}
}

export async function adminUpdateProductStatus(productId, status) {
  const { data } = await api.patch(`/api/admin/products/${productId}/status`, {
    status, // e.g. "ACTIVE" | "INACTIVE" | "PROCESSING" | ...
  })

  // supports { result: { ok: true } } or similar
  return data?.result ?? data
}


// GET tree
export async function adminFetchCategoryTree(params = {}) {
  // ví dụ backend: GET /api/admin/categories/tree
  const { data } = await api.get("/api/categories/tree", { params })
  return { content: data?.result || [] }
}

// CREATE category (parentId null => root, parentId = id => child)
export async function adminCreateCategory(payload) {
  // payload ví dụ: { name, slug, parentId }
  const { data } = await api.post("/api/categories", payload)
  return { content: data?.result }
}

// UPDATE category
export async function adminUpdateCategory(categoryId, payload) {
  const { data } = await api.put(`/api/categories/${categoryId}`, payload)
  return { content: data?.result }
}

// DELETE category
export async function adminDeleteCategory(categoryId) {
  const { data } = await api.delete(`/api/categories/${categoryId}`)
  return { ok: true, content: data?.result }
}

export async function adminFetchOptions() {
  const { data } = await api.get("/api/admin/options")
  return { content: data?.result }
}

export async function adminSetOptions(payload) {
  const { data } = await api.post("/api/admin/options", payload)
  return { content: data?.result }
}