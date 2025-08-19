import './polyfills' 
import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import system from './theme.js'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from './components/ui/toaster.jsx'
import { CartProvider } from './context/CartContext'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
