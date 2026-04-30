'use client'

import { create } from 'zustand'
import { keycloak } from '@/lib/keycloak'
import { generateCodeVerifier, generateCodeChallenge, generateState, parseJwtClaims, type JwtClaims } from '@/lib/auth'

const REFRESH_TOKEN_KEY = 'crash_refresh_token'
const PKCE_VERIFIER_KEY = 'crash_pkce_verifier'
const PKCE_STATE_KEY = 'crash_pkce_state'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface AuthState {
  accessToken: string | null
  user: Pick<JwtClaims, 'sub' | 'preferred_username' | 'email'> | null
  isLoading: boolean

  initiateLogin: () => Promise<void>
  handleCallback: (code: string, state: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  restoreSession: () => Promise<void>
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefresh(expiresIn: number) {
  if (refreshTimer) clearTimeout(refreshTimer)
  const delay = Math.max(10_000, (expiresIn - 30) * 1000)
  refreshTimer = setTimeout(() => {
    useAuthStore.getState().refreshAccessToken()
  }, delay)
}

async function fetchTokens(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(keycloak.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: keycloak.clientId, ...body }).toString()
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token request failed: ${err}`)
  }

  return res.json() as Promise<TokenResponse>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,

  initiateLogin: async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
    sessionStorage.setItem(PKCE_STATE_KEY, state)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: keycloak.clientId,
      redirect_uri: keycloak.redirectUri,
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state
    })

    window.location.href = `${keycloak.authUrl}?${params}`
  },

  handleCallback: async (code, state) => {
    set({ isLoading: true })

    try {
      const savedState = sessionStorage.getItem(PKCE_STATE_KEY)
      const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)

      if (!savedState || savedState !== state) {
        throw new Error('State mismatch — possível ataque CSRF')
      }
      if (!verifier) {
        throw new Error('Code verifier ausente')
      }

      sessionStorage.removeItem(PKCE_STATE_KEY)
      sessionStorage.removeItem(PKCE_VERIFIER_KEY)

      const data = await fetchTokens({
        grant_type: 'authorization_code',
        code,
        redirect_uri: keycloak.redirectUri,
        code_verifier: verifier
      })

      const claims = parseJwtClaims(data.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      scheduleRefresh(data.expires_in)

      set({
        accessToken: data.access_token,
        user: { sub: claims.sub, preferred_username: claims.preferred_username, email: claims.email },
        isLoading: false
      })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: () => {
    if (refreshTimer) clearTimeout(refreshTimer)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({ accessToken: null, user: null })

    const params = new URLSearchParams({
      client_id: keycloak.clientId,
      post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/`
    })
    if (refreshToken) params.set('refresh_token', refreshToken)

    window.location.href = `${keycloak.logoutUrl}?${params}`
  },

  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return false

    try {
      const data = await fetchTokens({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })

      const claims = parseJwtClaims(data.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      scheduleRefresh(data.expires_in)

      set({
        accessToken: data.access_token,
        user: { sub: claims.sub, preferred_username: claims.preferred_username, email: claims.email }
      })

      return true
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      set({ accessToken: null, user: null })
      return false
    }
  },

  restoreSession: async () => {
    const { isLoading, accessToken } = get()
    if (isLoading || accessToken) return

    set({ isLoading: true })
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      set({ isLoading: false })
      return
    }

    await get().refreshAccessToken()
    set({ isLoading: false })
  }
}))
