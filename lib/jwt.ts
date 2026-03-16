import crypto from 'crypto'

type InterDashboardPayload = {
  action?: string
  exp?: number
  iat?: number
  iss?: string
  nbf?: number
  sub?: string
  [key: string]: unknown
}

export type InterDashboardAuthResult = {
  valid: boolean
  method: 'jwt' | 'api_key' | null
  payload?: InterDashboardPayload
  reason?: string
}

function getJwtSecrets() {
  return [
    process.env.INTER_DASHBOARD_JWT_SECRET,
    process.env.PRODUCER_DASHBOARD_WEBHOOK_SECRET,
  ].filter((value): value is string => Boolean(value))
}

function getApiKeys() {
  return [
    process.env.BUYER_API_KEY,
    process.env.INTER_DASHBOARD_API_KEY,
    process.env.PRODUCER_DASHBOARD_API_KEY,
  ].filter((value): value is string => Boolean(value))
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padding), 'base64')
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function parseBearerToken(authHeader: string | null) {
  if (!authHeader) {
    return null
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function verifyHs256Jwt(token: string, secret: string): InterDashboardAuthResult {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return { valid: false, method: null, reason: 'Malformed JWT' }
  }

  const [encodedHeader, encodedPayload, signature] = parts

  try {
    const header = JSON.parse(decodeBase64Url(encodedHeader).toString('utf8')) as { alg?: string }
    const payload = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8')) as InterDashboardPayload

    if (header.alg !== 'HS256') {
      return { valid: false, method: null, reason: 'Unsupported JWT algorithm' }
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (!safeEqual(signature, expectedSignature)) {
      return { valid: false, method: null, reason: 'Invalid JWT signature' }
    }

    const now = Math.floor(Date.now() / 1000)

    if (typeof payload.nbf === 'number' && now < payload.nbf) {
      return { valid: false, method: null, reason: 'JWT is not active yet' }
    }

    if (typeof payload.exp === 'number' && now >= payload.exp) {
      return { valid: false, method: null, reason: 'JWT has expired' }
    }

    return {
      valid: true,
      method: 'jwt',
      payload,
    }
  } catch {
    return { valid: false, method: null, reason: 'Invalid JWT payload' }
  }
}

export function validateInterDashboardAuth(
  authHeader: string | null,
  apiKey: string | null
): InterDashboardAuthResult {
  const token = parseBearerToken(authHeader)
  const jwtSecrets = getJwtSecrets()

  if (token && jwtSecrets.length > 0) {
    for (const secret of jwtSecrets) {
      const result = verifyHs256Jwt(token, secret)
      if (result.valid) {
        return result
      }
    }
  }

  const expectedApiKeys = getApiKeys()
  const providedApiKeys = [apiKey, token].filter((value): value is string => Boolean(value))

  if (providedApiKeys.some((providedKey) => expectedApiKeys.some((expectedKey) => safeEqual(providedKey, expectedKey)))) {
    return {
      valid: true,
      method: 'api_key',
    }
  }

  return {
    valid: false,
    method: null,
    reason: 'No valid inter-dashboard credentials provided',
  }
}
