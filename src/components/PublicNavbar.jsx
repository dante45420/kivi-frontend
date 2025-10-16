import { NavLink } from 'react-router-dom'
import '../styles/globals.css'

export default function PublicNavbar() {
  return (
    <header style={{ 
      background: 'var(--kivi-cream)', 
      borderBottom: '1px solid #E8E8E8',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '16px 20px', 
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
            gap: 8, 
            textDecoration: 'none',
            color: 'var(--kivi-text-dark)',
            fontWeight: 800,
            fontSize: 24
          }}
        >
          <span style={{ fontSize: 28 }}>🥝</span>
          <span>Kivi</span>
        </NavLink>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <NavLink 
            to="/" 
            className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
            style={{ 
              textDecoration: 'none', 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--kivi-text)',
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
              padding: '8px 16px', 
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--kivi-text)',
              transition: 'all 0.2s'
            }}
          >
            Sobre Nosotros
          </NavLink>
        </nav>
      </div>

      <style>{`
        .nav-link:hover {
          background: var(--kivi-green-soft);
          color: var(--kivi-text-dark);
        }
        .nav-link.active {
          background: var(--kivi-green);
          color: white;
        }
        
        @media (max-width: 600px) {
          header nav {
            gap: 8px;
          }
          .nav-link {
            padding: 6px 12px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </header>
  )
}

