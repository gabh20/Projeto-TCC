import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type User = {
  id: number
  nome: string
  email: string
  telefone: string | null
  data: string | null
  criadoEm: string
  atualizadoEm: string
}

type AuthResponse = {
  user: User
  token: string
}

type RegisterForm = {
  name: string
  email: string
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
}

type LoginForm = Pick<RegisterForm, 'email' | 'password'>

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const tokenStorageKey = 'tcc-auth-token'

const emptyRegisterForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
}

const emptyLoginForm: LoginForm = {
  email: '',
  password: '',
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a solicitação.'
}

function normalizeEmail(value: string) {
  return value.replace(/\s/g, '').toLowerCase()
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ''
  }

  const areaCode = digits.slice(0, 2)
  const number = digits.slice(2)
  const firstPartLength = digits.length === 11 ? 5 : 4
  const firstPart = number.slice(0, firstPartLength)
  const secondPart = number.slice(firstPartLength)

  return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ''}`
}

function maskBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseBirthDate(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 8) {
    return null
  }

  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4))
  const date = new Date(Date.UTC(year, month - 1, day))
  const today = new Date()
  const maximum = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const minimum = new Date(Date.UTC(1900, 0, 1))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date < minimum ||
    date > maximum
  ) {
    return null
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  })
  const hasJson = response.headers.get('content-type')?.includes('application/json')
  const data = hasJson ? await response.json() : null

  if (!response.ok) {
    const message = data?.errors?.[0] ?? data?.message ?? 'Erro inesperado.'
    throw new Error(message)
  }

  return data as T
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Não informado'
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

function formatPhone(value: string | null) {
  if (!value) {
    return 'Não informado'
  }

  const digits = value.replace(/\D/g, '').slice(0, 11)
  const areaCode = digits.slice(0, 2)
  const number = digits.slice(2)

  if (digits.length <= 10) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`
}

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginForm, setLoginForm] = useState<LoginForm>(emptyLoginForm)
  const [registerForm, setRegisterForm] = useState<RegisterForm>(emptyRegisterForm)
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? '')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadSession(activeToken: string) {
    const [profile, registeredUsers] = await Promise.all([
      apiRequest<User>('/auth/me', { token: activeToken }),
      apiRequest<User[]>('/users', { token: activeToken }),
    ])

    setCurrentUser(profile)
    setUsers(registeredUsers)
  }

  useEffect(() => {
    if (!token) {
      return
    }

    loadSession(token).catch(() => {
      localStorage.removeItem(tokenStorageKey)
      setToken('')
      setCurrentUser(null)
      setUsers([])
    })
  }, [token])

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })

      localStorage.setItem(tokenStorageKey, result.token)
      setToken(result.token)
      setCurrentUser(result.user)
      setLoginForm(emptyLoginForm)
      setMessage('Login realizado.')
      await loadSession(result.token)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('As senhas não coincidem.')
      return
    }

    const phone = registerForm.phone.replace(/\D/g, '')
    const birthDate = parseBirthDate(registerForm.birthDate)

    if (phone.length !== 10 && phone.length !== 11) {
      setMessage('Informe um telefone com DDD.')
      return
    }

    if (!birthDate) {
      setMessage('Informe uma data de nascimento válida.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone,
          birthDate,
          password: registerForm.password,
        }),
      })

      localStorage.setItem(tokenStorageKey, result.token)
      setToken(result.token)
      setCurrentUser(result.user)
      setRegisterForm(emptyRegisterForm)
      setMessage('Cadastro criado.')
      await loadSession(result.token)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function logout() {
    localStorage.removeItem(tokenStorageKey)
    setToken('')
    setCurrentUser(null)
    setUsers([])
    setMessage('')
  }

  if (currentUser && token) {
    return (
      <main className="app-shell">
        <section className="dashboard-header">
          <div>
            <span className="eyebrow">Sessão validada</span>
            <h1>{currentUser.nome}</h1>
            <p>{currentUser.email}</p>
          </div>
          <div className="header-actions">
            <button type="button" className="secondary-button" onClick={() => loadSession(token)}>
              Atualizar
            </button>
            <button type="button" className="primary-button" onClick={logout}>
              Sair
            </button>
          </div>
        </section>

        <section className="profile-grid">
          <div className="info-card">
            <span>Telefone</span>
            <strong>{formatPhone(currentUser.telefone)}</strong>
          </div>
          <div className="info-card">
            <span>Nascimento</span>
            <strong>{formatDate(currentUser.data)}</strong>
          </div>
        </section>

        <section className="table-section">
          <div className="section-title">
            <h2>Usuários cadastrados</h2>
            <span>{users.length} registros</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Nascimento</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{formatPhone(user.telefone)}</td>
                    <td>{formatDate(user.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`auth-shell auth-shell-${mode}`}>
      <div className="auth-content">
        <div className="auth-brand">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <strong>Portal de Clientes | Deploy automatizado</strong>
        </div>

        <section className="auth-panel" aria-live="polite">
          <div className="panel-heading">
            <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
            <p>
              {mode === 'login'
                ? 'Acesse o sistema com suas credenciais.'
                : 'Preencha os dados abaixo.'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={submitLogin}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((form) => ({ ...form, email: normalizeEmail(event.target.value) }))
                  }
                  required
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((form) => ({ ...form, password: event.target.value }))
                  }
                  required
                />
              </label>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister}>
              <label>
                Nome
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((form) => ({ ...form, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((form) => ({
                      ...form,
                      email: normalizeEmail(event.target.value),
                    }))
                  }
                  required
                />
              </label>
              <div className="profile-fields">
                <label>
                  Telefone
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    value={registerForm.phone}
                    onChange={(event) =>
                      setRegisterForm((form) => ({
                        ...form,
                        phone: maskPhone(event.target.value),
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Nascimento
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    value={registerForm.birthDate}
                    onChange={(event) =>
                      setRegisterForm((form) => ({
                        ...form,
                        birthDate: maskBirthDate(event.target.value),
                      }))
                    }
                    required
                  />
                </label>
              </div>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((form) => ({ ...form, password: event.target.value }))
                  }
                  minLength={8}
                  required
                />
              </label>
              <label>
                Confirmar senha
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((form) => ({ ...form, confirmPassword: event.target.value }))
                  }
                  minLength={8}
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Cadastrar'}
              </button>
            </form>
          )}

          {message && <p className="form-message">{message}</p>}
        </section>

        <p className="auth-switch">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
          <button
            type="button"
            onClick={() => {
              setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
              setMessage('')
            }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </div>
    </main>
  )
}

export default App
