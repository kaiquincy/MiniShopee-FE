import api from './client'
export async function myRooms(){
  const { data } = await api.get('/api/chats/rooms')
  return data?.result || []
}
export async function openRoom(peerUserId){
  const { data } = await api.post('/api/chats/rooms', { peerUserId })
  return data?.result
}
export async function history(roomId, page=0, size=20){
  const { data } = await api.get(`/api/chats/rooms/${roomId}/messages`, { params: { page, size } })
  return data?.result
}

export async function sendMessage(roomId, content){
  const { data } = await api.post(`/api/chats/rooms/${roomId}/messages`, { content })
  return data?.result
}

export async function uploadImage(file){
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post(`/api/files/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  return data ? data : {}; // { imageUrl, fileName, size }
}