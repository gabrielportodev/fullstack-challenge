import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      const refreshed = await useAuthStore.getState().refreshAccessToken()
      if (refreshed) {
        const token = useAuthStore.getState().accessToken
        error.config.headers.Authorization = `Bearer ${token}`
        return api.request(error.config)
      }
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
