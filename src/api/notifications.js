import api from './client'
export async function myNotifications(){
  const { data } = await api.get('/api/notifications')
  return data?.result || []
}
export async function markRead(id){
  const { data } = await api.post(`/api/notifications/${id}/read`)
  return data?.result
}
export async function unreadCount(){
  const { data } = await api.get('/api/notifications/unread-count')
  return data?.result || 0
}
