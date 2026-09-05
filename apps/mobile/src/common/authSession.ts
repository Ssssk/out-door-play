export interface AuthSessionAdapter {
  prepareAccessToken: () => Promise<string | undefined>
  refreshAccessToken: () => Promise<string | undefined>
  clearSession: () => void
}

const anonymousAdapter: AuthSessionAdapter = {
  prepareAccessToken: async () => undefined,
  refreshAccessToken: async () => undefined,
  clearSession: () => undefined,
}

let adapter = anonymousAdapter

export const authSession: AuthSessionAdapter = {
  prepareAccessToken: () => adapter.prepareAccessToken(),
  refreshAccessToken: () => adapter.refreshAccessToken(),
  clearSession: () => adapter.clearSession(),
}

export function installAuthSessionAdapter(next: AuthSessionAdapter) {
  adapter = next
}

export function resetAuthSessionAdapter() {
  adapter = anonymousAdapter
}
