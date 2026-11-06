export const serverError = 'Pripojenie k serveru zlyhalo. Skús to znova.'

export async function request(path, options = {}) {
  const response = await fetch(`/api/v1/${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
    cache: 'no-store'
  })
  const body = response.status === 204 ? null : await response.json()
  return { status: response.status, body }
}

export async function post(path, data) {
  const csrf = await request('auth/csrf')
  if (csrf.status !== 200 || !csrf.body?.token) throw new Error(serverError)

  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf.body.token
    },
    body: JSON.stringify(data)
  })
}
