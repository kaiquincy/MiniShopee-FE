import api from './client'

  /**
   * Lấy danh sách rating có phân trang
   * @param {number|string} productId 
   * @param {{ page?: number, size?: number, sort?: string }} options 
   * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number, size: number, last: boolean, first: boolean}>}
   */
  export async function getRatings(productId, { page = 0, size = 10, sort = 'createdAt,DESC' } = {}) {
    const params = { page, size, sort }

    const { data } = await api.get(`/api/ratings/product/${productId}`, { params })

    const res = data?.result ?? {}

    return {
      content: Array.isArray(res.content) ? res.content : [],
      totalElements: Number(res.totalElements ?? 0),
      totalPages: Number(res.totalPages ?? 0),
      number: Number(res.number ?? page),
      size: Number(res.size ?? size),
      last: Boolean(res.last ?? false),
      first: Boolean(res.first ?? false),
      sort
    }
  }


export async function addRating(payload){
  console.log(payload)
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