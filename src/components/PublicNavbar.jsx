import { NavLink } from 'react-router-dom'
import '../styles/globals.css'

export default function PublicNavbar() {
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
              height: 60,
              width: 'auto'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </NavLink>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
      </div>

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
          header nav {
            gap: 8px;
          }
          .nav-link {
            padding: 8px 14px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </header>
  )
}
