import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Productos from './pages/Productos'
import Pedidos from './pages/Pedidos'
import Compras from './pages/Compras'
import Despachos from './pages/Despachos'
import Kpis from './pages/Kpis'
import Precios from './pages/Precios'
import PreciosCompetidores from './pages/PreciosCompetidores'
import Contabilidad from './pages/ContabilidadNew'
import Login from './pages/Login'
import Landing from './pages/Landing'
import { getToken } from './api/auth'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!getToken())
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: isAuthenticated ? 12 : 0 }}>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/productos" replace /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/productos" replace /> : <Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
        <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
        <Route path="/despachos" element={<ProtectedRoute><Despachos /></ProtectedRoute>} />
        <Route path="/kpis" element={<ProtectedRoute><Kpis /></ProtectedRoute>} />
        <Route path="/precios" element={<ProtectedRoute><Precios /></ProtectedRoute>} />
        <Route path="/precios/competidores" element={<ProtectedRoute><PreciosCompetidores /></ProtectedRoute>} />
        <Route path="/contabilidad" element={<ProtectedRoute><Contabilidad /></ProtectedRoute>} />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/productos" : "/"} replace />} />
      </Routes>
    </div>
  )
}
