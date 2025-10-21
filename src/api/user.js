import api from './client'


export async function getMyInfo() {
  const { data } = await api.get(`/api/user`)
  return data?.result
}

export async function updateUserInfo(payload) {
  const { data } = await api.put(`/api/user`, payload)
  return data?.message
}