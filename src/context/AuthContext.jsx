import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      setUser({ username: 'me' }) // placeholder
    }
  }, [token])

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password })
    // linh hoạt: backend có thể trả result là string token hoặc object { token: ... }
    const tk = data?.result?.token || data?.result || data?.token
    if (!tk) throw new Error('Không nhận được token')
    setToken(tk)
  }

  const register = async (payload) => {
    await api.post('/api/auth/register', payload)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return <AuthCtx.Provider value={{ token, user, login, register, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
