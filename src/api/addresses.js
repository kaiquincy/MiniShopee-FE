import api from './client'

// lấy tất cả địa chỉ của current user
export async function getAddresses() {
  const { data } = await api.get('/api/addresses')
  return data?.result || []
}

export async function createAddress(payload) {
  const { data } = await api.post('/api/addresses', payload)
  return data?.result
}

export async function updateAddress(id, payload) {
  const { data } = await api.put(`/api/addresses/${id}`, payload)
  return data?.result
}

export async function deleteAddress(id) {
  const { data } = await api.delete(`/api/addresses/${id}`)
  return data?.result
}

export async function makeDefaultAddress(id) {
  const { data } = await api.post(`/api/addresses/${id}/default`)
  return data?.result
}
