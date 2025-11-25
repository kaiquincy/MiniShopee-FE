import api from './client'
export async function placeOrder(method='PAYOS') {
  const { data } = await api.post('/api/orders', { method })
  return data?.result // string
}
export async function listOrders(params = {}) {
  const { page = 0, size = 10, status } = params
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  
  if (status && status !== 'all') {
    queryParams.append('status', status.toUpperCase())
  }
  
  const response = await api.get(`/api/orders?${queryParams.toString()}`)
  return response.data.result
}

export async function getOrderCounts() {
  const response = await api.get('/api/orders/counts')
  return response.data.result
}
