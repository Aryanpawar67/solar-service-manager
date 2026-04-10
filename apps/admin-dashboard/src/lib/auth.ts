// In-memory JWT store — never persisted to localStorage (XSS risk)
let _token: string | null = null;
let _user: { id: number; email: string; name: string; role: string } | null = null;

export function setToken(token: string, user: typeof _user) {
  _token = token;
  _user = user;
}

export function clearToken() {
  _token = null;
  _user = null;
}

export function getToken(): string | null {
  return _token;
}

export function getUser() {
  return _user;
}

export function isAuthenticated(): boolean {
  return _token !== null;
}
