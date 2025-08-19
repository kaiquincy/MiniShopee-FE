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
