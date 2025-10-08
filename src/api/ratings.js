import api from './client'
export async function getRatings(productId){
  const { data } = await api.get(`/api/ratings/product/${productId}`)
  return data?.result || []
}
export async function addRating(payload){
  const { data } = await api.post('/api/ratings', payload)
  return data?.result
}

export async function getRatingSummary(productId){
  const { data } = await api.get(`/api/ratings/product/${productId}/summary`)
  return data?.result
}


// POST /api/ratings/:id/like  body: { liked: boolean }
// response: { likeCount: number, likedByMe: boolean }
export async function toggleRatingLike(id, liked) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/ratings/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ liked })
  })
  if (!res.ok) throw new Error('toggle like failed')
  return res.json()
}