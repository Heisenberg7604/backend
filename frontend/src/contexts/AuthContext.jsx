import { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/apiService'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      apiService.setAuthToken(token)
      // Verify token is still valid
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await apiService.get('/auth/profile')
      if (response.success) {
        setUser(response.data.user)
        setIsAuthenticated(true)
      } else {
        logout()
      }
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password })
      if (response.success) {
        const { user, token } = response.data
        localStorage.setItem('admin_token', token)
        apiService.setAuthToken(token)
        setUser(user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    apiService.setAuthToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
