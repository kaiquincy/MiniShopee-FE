import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Cart from './pages/Cart.jsx'
import Chat from './pages/Chat.jsx'
import Checkout from './pages/Checkout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Notifications from './pages/Notifications.jsx'
import Orders from './pages/Orders.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Products from './pages/Products.jsx'
import Register from './pages/Register.jsx'
import SellerApp from './seller/SellerApp'
import AccountAddresses from './pages/AccountAddresses'
import ReturnPage from './pages/Return.jsx'
import CancelPage from './pages/Cancel.jsx'
import AdminApp from './admin/AdminApp.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path='products' element={<Products />}/>
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<ProtectedRoute><Cart/></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders/></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
          <Route path="chat" element={<ProtectedRoute><Chat/></ProtectedRoute>} />
          <Route path="account/addresses" element={<ProtectedRoute><AccountAddresses/></ProtectedRoute>} />
          <Route path="payment/return" element={<ReturnPage />} />
          <Route path="payment/cancel" element={<CancelPage />} />

          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/seller/*" element={<SellerApp/>} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}