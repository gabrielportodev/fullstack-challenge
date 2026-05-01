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
    const config = error.config as typeof error.config & { _retried?: boolean }
    if (error.response?.status === 401 && !config._retried) {
      config._retried = true
      const refreshed = await useAuthStore.getState().refreshAccessToken()
      if (refreshed) {
        const token = useAuthStore.getState().accessToken
        config.headers.Authorization = `Bearer ${token}`
        return api.request(config)
      }
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
