import api from './client'

export async function getCart() {
  const { data } = await api.get('/api/carts')
  return data?.result
}
export async function addToCart(productId, quantity=1) {
  const { data } = await api.post('/api/carts', null, { params: { productId, quantity } })
  return data?.result
}
export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/api/carts/items/${itemId}`)
  return data?.result
}
export async function clearCart() {
  const { data } = await api.delete('/api/carts')
  return data?.result
}
