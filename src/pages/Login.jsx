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
      // Disparar evento para actualizar el estado de autenticación en App.jsx
      window.dispatchEvent(new Event('auth-change'))
      // Pequeño delay para asegurar que el token se guarde antes de navegar
      setTimeout(() => {
        navigate('/productos')
      }, 100)
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
      background: 'var(--kivi-cream)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: 450, 
        width: '100%',
        background: 'white', 
        borderRadius: 16, 
        padding: '40px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #E0E0E0'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img 
            src="/kivi-logo.png" 
            alt="Kivi Logo" 
            style={{ 
              maxWidth: 200, 
              width: '100%',
              height: 'auto',
              marginBottom: 20
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'block'
            }}
          />
          <div style={{ display: 'none', fontSize: 48, marginBottom: 16 }}>🥝</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#000' }}>Área de Trabajadores</h2>
          <p style={{ margin: '12px 0 0 0', color: '#666', fontSize: 14, lineHeight: 1.6 }}>
            Este es el panel de gestión interno de Kivi.<br/>
            Solo personal autorizado puede acceder.
          </p>
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
              fontWeight: 700,
              borderRadius: 12,
              background: loading ? '#ccc' : '#88C4A8',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(136, 196, 168, 0.3)'
            }}
            onMouseOver={e => !loading && (e.target.style.transform = 'scale(1.02)')}
            onMouseOut={e => !loading && (e.target.style.transform = 'scale(1)')}
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
              color: '#88C4A8',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.target.style.textDecoration = 'underline'}
            onMouseOut={e => e.target.style.textDecoration = 'none'}
          >
            ← Volver al catálogo
          </button>
        </div>
      </div>
    </div>
  )
}
