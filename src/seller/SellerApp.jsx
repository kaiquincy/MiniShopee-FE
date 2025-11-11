import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SellerLayout from './components/SellerLayout'
import SellerOrders from './pages/SellerOrders'
import SellerProducts from './pages/SellerProducts'
import SellerProductNew from './pages/SellerProductNew'
import SellerProductEdit from './pages/SellerProductEdit'
import SellerInventory from './pages/SellerInventory'
import SellerAnalytics from './pages/SellerAnalytics'
import SellerChat from './pages/SellerChat'

export default function SellerApp() {
  const { token, user } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (user && user.role !== 'SELLER') return <Navigate to="/" replace />

  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="products/new" element={<SellerProductNew />} />
        <Route path="products/:id/edit" element={<SellerProductEdit />} />
        <Route path="inventory" element={<SellerInventory />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="chat" element={<SellerChat />} />
      </Route>
    </Routes>
  )
}
