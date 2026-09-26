import axios from 'axios'
import type { AxiosResponse } from 'axios'

export interface Envelope<T> { code: number; message: string; data: T; traceId: string }

const request = axios.create({ baseURL: '/v1', timeout: 15_000, withCredentials: true })
let csrfToken = ''
let unauthorizedHandler: (() => void) | undefined

export function configureAuthTransport(options: { csrfToken?: string; onUnauthorized?: () => void }) {
  if (options.csrfToken !== undefined) csrfToken = options.csrfToken
  if (options.onUnauthorized !== undefined) unauthorizedHandler = options.onUnauthorized
}

request.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase()
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) config.headers.set('X-CSRF-Token', csrfToken)
  return config
})

request.interceptors.response.use(undefined, (error: unknown) => {
  const isAuthEndpoint = axios.isAxiosError(error) && String(error.config?.url || '').includes('/admin/auth/')
  if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthEndpoint) unauthorizedHandler?.()
  return Promise.reject(error)
})

export function unwrapEnvelope<T>(envelope: Envelope<T>): T {
  if (envelope.code !== 0) throw new Error(envelope.message)
  return envelope.data
}

async function unwrap<T>(promise: Promise<AxiosResponse<Envelope<T>>>): Promise<T> {
  const response = await promise
  return unwrapEnvelope(response.data)
}

export async function apiGet<T>(url: string): Promise<T> {
  return unwrap(request.get<Envelope<T>>(url))
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(request.post<Envelope<T>>(url, data))
}

export async function apiUpload<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)
  return unwrap(request.post<Envelope<T>>(url, formData))
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(request.patch<Envelope<T>>(url, data))
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(request.put<Envelope<T>>(url, data))
}

export async function apiDelete<T>(url: string): Promise<T> {
  return unwrap(request.delete<Envelope<T>>(url))
}
