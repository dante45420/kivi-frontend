import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import '../styles/globals.css'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{ 
      background: 'white', 
      borderBottom: '2px solid var(--kivi-cream)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '12px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        {/* Logo */}
        <NavLink 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            textDecoration: 'none'
          }}
        >
          <img 
            src="/kivi-logo.png" 
            alt="Kivi" 
            style={{ 
              height: 50,
              width: 'auto'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </NavLink>

        {/* Navigation Desktop */}
        <nav className="nav-desktop" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <NavLink 
            to="/" 
            className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
            style={{ 
              textDecoration: 'none', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--kivi-text-dark)',
              transition: 'all 0.2s'
            }}
          >
            Catálogo
          </NavLink>
          <NavLink 
            to="/about" 
            className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
            style={{ 
              textDecoration: 'none', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--kivi-text-dark)',
              transition: 'all 0.2s'
            }}
          >
            Sobre Nosotros
          </NavLink>
          <NavLink 
            to="/login" 
            style={{ 
              textDecoration: 'none', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius-pill)',
              fontWeight: 700,
              fontSize: 15,
              background: 'var(--kivi-green)',
              color: 'white',
              transition: 'all 0.2s',
              border: '2px solid var(--kivi-green)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--kivi-green-dark)'
              e.currentTarget.style.borderColor = 'var(--kivi-green-dark)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--kivi-green)'
              e.currentTarget.style.borderColor = 'var(--kivi-green)'
            }}
          >
            Iniciar Sesión
          </NavLink>
        </nav>

        {/* Hamburger Toggle Mobile */}
        <button 
          className="nav-toggle"
          onClick={() => setOpen(v => !v)}
          aria-label="menu"
          style={{
            display: 'none',
            background: '#000',
            color: '#fff',
            border: '1px solid #444',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 600
          }}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="nav-mobile" style={{ 
          borderTop: '1px solid var(--kivi-cream)', 
          background: 'white'
        }}>
          <div style={{ 
            maxWidth: 1200, 
            margin: '0 auto', 
            padding: '12px 20px', 
            display: 'grid', 
            gap: 8, 
            justifyItems: 'stretch' 
          }} onClick={() => setOpen(false)}>
            <NavLink 
              to="/" 
              style={({isActive}) => ({
                display: 'block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '12px 14px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: isActive ? 'var(--kivi-green-soft)' : 'white',
                color: '#000',
                fontWeight: 600
              })}
            >
              Catálogo
            </NavLink>
            <NavLink 
              to="/about" 
              style={({isActive}) => ({
                display: 'block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '12px 14px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: isActive ? 'var(--kivi-green-soft)' : 'white',
                color: '#000',
                fontWeight: 600
              })}
            >
              Sobre Nosotros
            </NavLink>
            <NavLink 
              to="/login" 
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '12px 14px',
                borderRadius: 999,
                border: '2px solid var(--kivi-green)',
                background: 'var(--kivi-green)',
                color: 'white',
                fontWeight: 700
              }}
            >
              Iniciar Sesión
            </NavLink>
          </div>
        </div>
      )}

      <style>{`
        .nav-link:hover {
          background: var(--kivi-cream);
          color: var(--kivi-text-dark);
        }
        .nav-link.active {
          background: var(--kivi-green-soft);
          color: var(--kivi-text-dark);
        }
        
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .nav-toggle {
            display: block !important;
          }
        }
        
        @media (min-width: 769px) {
          .nav-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
