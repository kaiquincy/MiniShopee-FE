import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthCtx = createContext(null)

/** Giải mã payload JWT an toàn (không xác thực chữ ký, chỉ đọc claim) */
function decodeJwt(token) {
  try {
    const [, payload] = token.split('.')
    // JWT dùng base64url → thay '-' '_' trước khi atob
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!token) {
        localStorage.removeItem('token')
        setUser(null)
        return
      }
      localStorage.setItem('token', token)

      // 1) Lấy từ JWT (nhanh, không call mạng)
      const claims = decodeJwt(token)
      const role = claims.role || claims.roles || claims.authorities || 'user'
      const username = claims?.sub || claims?.username || 'me'
      const baseUser = { username, role }

      // console.log(baseUser)

      setUser(baseUser)

      // 2) (tuỳ chọn) gọi /me để lấy chuẩn từ server
      // try {
      //   const { data } = await api.get('/api/auth/me') // nếu BE chưa có, có thể bỏ
      //   if (!cancelled) {
      //     const serverUser = data?.result || data
      //     // hợp nhất: roles ưu tiên server nếu có
      //     const merged = {
      //       ...baseUser,
      //       ...serverUser,
      //       roles: serverUser?.roles?.length ? serverUser.roles : roles
      //     }
      //     setUser(merged)
      //   }
      // } catch {
      //   // không có /me thì giữ baseUser
      // }
    }
    bootstrap()
    return () => { cancelled = true }
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
