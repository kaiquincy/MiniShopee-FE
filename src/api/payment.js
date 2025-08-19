import api from './client'
export async function initiatePayment(method='PAYOS'){
  const { data } = await api.post('/api/payments/initiate', { method })
  return data?.result || data // tuỳ backend
}
