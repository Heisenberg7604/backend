import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response.data
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token')
          window.location.href = '/admin/login'
        }
        return Promise.reject(error.response?.data || error)
      }
    )
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.Authorization = `Bearer ${token}`
    } else {
      delete this.api.defaults.headers.Authorization
    }
  }

  async get(url, config = {}) {
    return this.api.get(url, config)
  }

  async post(url, data, config = {}) {
    return this.api.post(url, data, config)
  }

  async put(url, data, config = {}) {
    return this.api.put(url, data, config)
  }

  async patch(url, data, config = {}) {
    return this.api.patch(url, data, config)
  }

  async delete(url, config = {}) {
    return this.api.delete(url, config)
  }
}

export const apiService = new ApiService()
