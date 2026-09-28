export const AUTH_STORAGE_KEY = 'tracevault_authenticated'

export function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    || sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
}

export function authenticate({ remember = false } = {}) {
  const preferredStorage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage

  otherStorage.removeItem(AUTH_STORAGE_KEY)
  preferredStorage.setItem(AUTH_STORAGE_KEY, 'true')
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
