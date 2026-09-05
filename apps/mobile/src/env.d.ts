/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEV_IDENTITY_ENABLED?: string
  readonly UNI_PLATFORM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
