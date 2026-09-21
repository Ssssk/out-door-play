import { authSession } from '@/common/authSession'

export interface ApiEnvelope<T> {
  code: number | string
  message: string
  data: T
  traceId?: string
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 0,
    public readonly traceId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type RequestOptions = Omit<Partial<UniApp.RequestOptions>, 'method'> & {
  method?: UniApp.RequestOptions['method'] | 'PATCH'
  auth?: 'none' | 'optional' | 'required'
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3100/v1'
const authenticatedModes = new Set<RequestOptions['auth']>(['optional', 'required'])

function isSuccessCode(code: number | string) {
  return code === 0 || code === 200 || code === '0'
}

function errorFromResponse(response: UniApp.RequestSuccessCallbackResult) {
  const body = response.data as Partial<ApiEnvelope<unknown>> | undefined
  return new ApiError(
    typeof body?.code === 'string' ? body.code : `HTTP_${response.statusCode}`,
    body?.message || `请求失败（${response.statusCode}）`,
    response.statusCode,
    body?.traceId,
  )
}

function send<T>(path: string, options: RequestOptions, accessToken?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${path}`,
      // 当前 @dcloudio/types 的联合类型遗漏 PATCH，uni.request 运行时与服务端均支持。
      method: (options.method || 'GET') as UniApp.RequestOptions['method'],
      data: options.data,
      timeout: options.timeout || 5000,
      header: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.header || {}),
      },
      success: (response) => {
        const body = response.data as ApiEnvelope<T> | T
        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (body && typeof body === 'object' && 'code' in body) {
            const envelope = body as ApiEnvelope<T>
            if (isSuccessCode(envelope.code)) resolve(envelope.data)
            else reject(new ApiError(String(envelope.code), envelope.message, response.statusCode, envelope.traceId))
          } else resolve(body as T)
        } else reject(errorFromResponse(response))
      },
      fail: (error) => reject(new ApiError('COMMON_NETWORK_ERROR', error.errMsg || '网络请求失败')),
    })
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth || 'none'
  const method = String(options.method || 'GET').toUpperCase()
  let accessToken: string | undefined

  if (authenticatedModes.has(auth)) {
    accessToken = await authSession.prepareAccessToken()
    if (auth === 'required' && !accessToken) {
      throw new ApiError('AUTH_REQUIRED', '请先登录', 401)
    }
  }

  try {
    return await send<T>(path, options, accessToken)
  } catch (error) {
    const unauthorized = error instanceof ApiError && error.statusCode === 401
    if (!unauthorized || auth === 'none') throw error

    // GET 可以安全重放；写请求仅在发送前主动刷新，收到 401 后绝不自动重放。
    if (method === 'GET') {
      const refreshedToken = await authSession.refreshAccessToken()
      if (refreshedToken) return send<T>(path, options, refreshedToken)
    }

    authSession.clearSession()
    throw error
  }
}

export async function uploadFile<T>(path: string, filePath: string, name = 'file'): Promise<T> {
  const accessToken = await authSession.prepareAccessToken()
  if (!accessToken) throw new ApiError('AUTH_REQUIRED', '请先登录', 401)
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}${path}`,
      filePath,
      name,
      header: { Authorization: `Bearer ${accessToken}` },
      success: (response) => {
        let body: ApiEnvelope<T> | undefined
        try { body = JSON.parse(response.data) as ApiEnvelope<T> } catch { body = undefined }
        if (response.statusCode >= 200 && response.statusCode < 300 && body && isSuccessCode(body.code)) {
          resolve(body.data)
        } else if (body) {
          reject(new ApiError(String(body.code), body.message || `上传失败（${response.statusCode}）`, response.statusCode, body.traceId))
        } else {
          reject(new ApiError(`HTTP_${response.statusCode}`, `上传失败（${response.statusCode}）`, response.statusCode))
        }
      },
      fail: (error) => reject(new ApiError('COMMON_NETWORK_ERROR', error.errMsg || '上传失败')),
    })
  })
}

export const apiBaseUrl = BASE_URL
