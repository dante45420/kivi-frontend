import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Productos from './pages/Productos'
import Pedidos from './pages/Pedidos'
import Compras from './pages/Compras'
import Despachos from './pages/Despachos'
import Kpis from './pages/Kpis'
import Precios from './pages/Precios'
import PreciosCompetidores from './pages/PreciosCompetidores'
import Contabilidad from './pages/Contabilidad'
import Login from './pages/Login'

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 12 }}>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/despachos" element={<Despachos />} />
        <Route path="/kpis" element={<Kpis />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/precios/competidores" element={<PreciosCompetidores />} />
        <Route path="/contabilidad" element={<Contabilidad />} />
        <Route path="*" element={<Navigate to="/productos" replace />} />
      </Routes>
    </div>
  )
}
