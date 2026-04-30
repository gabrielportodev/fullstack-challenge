const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080'
const REALM = 'crash-game'
const CLIENT_ID = 'crash-game-client'
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/callback`

export const keycloak = {
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
  authUrl: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`,
  tokenUrl: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
  logoutUrl: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`
} as const
