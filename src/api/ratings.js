import api from './client'
export async function getRatings(productId){
  const { data } = await api.get(`/api/ratings/product/${productId}`)
  return data?.result || []
}
export async function addRating(payload){
  const { data } = await api.post('/api/ratings', payload)
  return data?.result
}
