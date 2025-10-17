import api from './client'

export async function fetchProducts(params = {}) {
  const { data } = await api.get('/api/products', { params })
  const res = data?.result
  // hỗ trợ cả Page và mảng
  return Array.isArray(res) ? { content: res, totalElements: res.length } : res
}

export async function fetchProductById(id) {
  const { data } = await api.get(`/api/products/${id}`)
  return data?.result
}


export async function getSimilarProducts(productId, { limit = 12, priceBand } = {}) {
  const params = { limit }
  if (priceBand !== undefined) params.priceBand = priceBand // để mặc định undefined = bỏ qua
  const { data } = await api.get(`/api/products/${productId}/similar`, { params })
  // API wrapper của bạn trả về { code, message, result }
  const arr = data?.result ?? []
  return Array.isArray(arr) ? arr : []
}