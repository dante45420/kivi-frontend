import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, setToken } from '../api/auth'
import '../styles/globals.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      setToken(response.token)
      navigate('/productos')
      window.location.reload() // Recargar para actualizar el estado de autenticación
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: 400, 
        width: '100%',
        background: 'white', 
        borderRadius: 20, 
        padding: '40px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🥝</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Iniciar Sesión</h2>
          <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: 14 }}>Accede a tu panel de gestión</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: 12,
                fontSize: 16
              }}
            />
          </div>

          <div>
            <input
              type="password"
              className="input"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: 12,
                fontSize: 16
              }}
            />
          </div>

          {error && (
            <div style={{ 
              padding: 12, 
              background: '#fee', 
              color: '#c00', 
              borderRadius: 8,
              fontSize: 14,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 12,
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: 14,
              textDecoration: 'underline'
            }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
