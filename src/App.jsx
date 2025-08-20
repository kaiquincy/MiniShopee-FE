import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Orders from './pages/Orders.jsx'
import Notifications from './pages/Notifications.jsx'
import Chat from './pages/Chat.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SellerApp from './seller/SellerApp'


export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<ProtectedRoute><Cart/></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders/></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
          <Route path="chat" element={<ProtectedRoute><Chat/></ProtectedRoute>} />
        </Route>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/seller/*" element={<SellerApp/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}