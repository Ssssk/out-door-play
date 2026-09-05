export function allowedAdminOrigins(): Set<string> {
  const configured = process.env.NODE_ENV === 'production'
    ? process.env.ADMIN_ALLOWED_ORIGINS || ''
    : [process.env.ADMIN_ALLOWED_ORIGINS, process.env.CORS_ORIGINS, 'http://localhost:5174,http://127.0.0.1:5174'].filter(Boolean).join(',')
  return new Set(configured.split(',').map((origin) => origin.trim()).filter(Boolean))
}

export function isAdminOriginAllowed(origin: string | undefined): boolean {
  return Boolean(origin && allowedAdminOrigins().has(origin))
}
