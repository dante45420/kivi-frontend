import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Productos from './pages/Productos'
import Pedidos from './pages/Pedidos'
import Compras from './pages/Compras'
import Kpis from './pages/Kpis'
import Contabilidad from './pages/ContabilidadNew'
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import About from './pages/About'
import { getToken, getUserType, verifyCurrentToken, clearToken } from './api/auth'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Función helper para obtener la ruta por defecto según el tipo de usuario
function getDefaultRoute() {
  return '/productos'
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken())
  const [isVerifying, setIsVerifying] = useState(true)

  // Verificar token al cargar la app
  useEffect(() => {
    async function checkTokenValidity() {
      if (!getToken()) {
        setIsVerifying(false)
        return
      }

      const result = await verifyCurrentToken()
      
      if (!result.valid) {
        // Token inválido, hacer logout
        console.warn('Token inválido, cerrando sesión:', result.error)
        clearToken()
        setIsAuthenticated(false)
        window.location.href = '/login'
      }
      
      setIsVerifying(false)
    }

    checkTokenValidity()
  }, [])

  useEffect(() => {
    // Función para actualizar el estado de autenticación
    const checkAuth = () => {
      setIsAuthenticated(!!getToken())
    }

    // Escuchar cambios en el estado de autenticación
    window.addEventListener('auth-change', checkAuth)
    
    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [])

  // Mostrar loading mientras verifica el token
  if (isVerifying) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div>Verificando sesión...</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: isAuthenticated ? 12 : 0 }}>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Catalogo />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
        <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
        <Route path="/kpis" element={<ProtectedRoute><Kpis /></ProtectedRoute>} />
        <Route path="/contabilidad" element={<ProtectedRoute><Contabilidad /></ProtectedRoute>} />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={isAuthenticated ? getDefaultRoute() : "/"} replace />} />
      </Routes>
    </div>
  )
}
// Force rebuild Mon Oct 20 21:19:41 -03 2025
