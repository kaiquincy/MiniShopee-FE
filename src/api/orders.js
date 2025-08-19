import api from './client'
export async function placeOrder(method='PAYOS') {
  const { data } = await api.post('/api/orders', { method })
  return data?.result // string
}
export async function listOrders() {
  const { data } = await api.get('/api/orders')
  return data?.result || []
}
