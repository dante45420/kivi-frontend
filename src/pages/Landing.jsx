import { useNavigate } from 'react-router-dom'
import '../styles/globals.css'

export default function Landing() {
  const navigate = useNavigate()

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
        maxWidth: 600, 
        background: 'white', 
        borderRadius: 24, 
        padding: '48px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {/* Logo/Icono */}
        <div style={{ fontSize: 64, marginBottom: 24 }}>🥝</div>
        
        {/* Título */}
        <h1 style={{ 
          fontSize: 42, 
          fontWeight: 800, 
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Kivi
        </h1>
        
        {/* Subtítulo */}
        <p style={{ 
          fontSize: 20, 
          color: '#666', 
          margin: '0 0 32px 0',
          lineHeight: 1.6
        }}>
          Sistema de gestión comercial inteligente
        </p>
        
        {/* Características */}
        <div style={{ 
          display: 'grid', 
          gap: 16, 
          marginBottom: 40,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
            <span style={{ fontSize: 24 }}>📦</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Gestión de Pedidos</div>
              <div style={{ fontSize: 14, color: '#888' }}>Administra pedidos, clientes y productos de forma eficiente</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Contabilidad en Tiempo Real</div>
              <div style={{ fontSize: 14, color: '#888' }}>Seguimiento de facturación, pagos y rentabilidad</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Control de Inventario</div>
              <div style={{ fontSize: 14, color: '#888' }}>Gestiona compras, stock y proveedores inteligentemente</div>
            </div>
          </div>
        </div>
        
        {/* Botón de Login */}
        <button 
          className="button"
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 18,
            fontWeight: 600,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Iniciar Sesión →
        </button>
        
        {/* Footer */}
        <div style={{ marginTop: 32, fontSize: 13, color: '#999' }}>
          Optimiza tu negocio con Kivi
        </div>
      </div>
    </div>
  )
}

