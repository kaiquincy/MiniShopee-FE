// context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getCart as apiGetCart, addToCart as apiAdd, removeCartItem as apiRemove, clearCart as apiClear } from '../api/cart'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGetCart()
      setCart(data || { items: [], grandTotal: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  // gọi 1 lần khi app mount
  useEffect(() => { load() }, [load])

  // helpers gọi API rồi refresh
  const addToCart = useCallback(async (productId, quantity = 1) => {
    await apiAdd(productId, quantity)
    await load()
  }, [load])

  const removeCartItem = useCallback(async (itemId) => {
    await apiRemove(itemId)
    await load()
  }, [load])

  const clearCart = useCallback(async () => {
    await apiClear()
    await load()
  }, [load])

  // tổng quantity
  const cartCount = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
  }, [cart])

  const value = { cart, cartCount, loading, reloadCart: load, addToCart, removeCartItem, clearCart }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
