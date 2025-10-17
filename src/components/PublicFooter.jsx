export default function PublicFooter() {
  const whatsappNumber = '56969172764'
  const whatsappMessage = encodeURIComponent('¡Hola! Quiero hacer un pedido 🥝')

  return (
    <footer style={{ 
      background: 'linear-gradient(135deg, var(--kivi-green-dark) 0%, var(--kivi-green) 100%)',
      color: 'white',
      padding: '40px 20px 24px 20px',
      marginTop: 60
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 40,
        marginBottom: 32
      }}>
        {/* Logo y descripción */}
        <div>
          <img 
            src="/kivi-logo.png" 
            alt="Kivi" 
            style={{ 
              height: 50,
              width: 'auto',
              marginBottom: 16,
              filter: 'brightness(0) invert(1)' // Hace el logo blanco
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'block'
            }}
          />
          <div style={{ display: 'none', fontSize: 32, marginBottom: 16 }}>🥝 Kivi</div>
          <p style={{ 
            margin: 0, 
            opacity: 0.95, 
            lineHeight: 1.6,
            fontSize: 15
          }}>
            Frutas y verduras frescas con entrega en menos de 24 horas. 
            Pedidos 100% personalizables a tu manera.
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: 18, 
            fontWeight: 800 
          }}>
            Enlaces
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a 
              href="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                opacity: 0.9,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.9}
            >
              📖 Catálogo
            </a>
            <a 
              href="/about" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                opacity: 0.9,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.9}
            >
              ℹ️ Sobre Nosotros
            </a>
            <a 
              href="/login" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                opacity: 0.9,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.9}
            >
              🔐 Iniciar Sesión
            </a>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: 18, 
            fontWeight: 800 
          }}>
            Contáctanos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'white', 
                textDecoration: 'none',
                opacity: 0.95,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.opacity = 1
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.opacity = 0.95
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <img 
                src="/whatsapp-icon.png" 
                alt="WhatsApp" 
                style={{ 
                  width: 32, 
                  height: 32,
                  filter: 'brightness(0) invert(1)'
                }} 
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>WhatsApp</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>+56 9 6917 2764</div>
              </div>
            </a>
            
            <a 
              href="https://instagram.com/kivi.chile"
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'white', 
                textDecoration: 'none',
                opacity: 0.95,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.opacity = 1
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.opacity = 0.95
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <img 
                src="/instagram-icon.png" 
                alt="Instagram" 
                style={{ 
                  width: 32, 
                  height: 32,
                  filter: 'brightness(0) invert(1)'
                }} 
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Instagram</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>@kivi.chile</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: 24,
        textAlign: 'center',
        fontSize: 14,
        opacity: 0.8
      }}>
        © {new Date().getFullYear()} Kivi - Frutas y Verduras Frescas. Todos los derechos reservados.
      </div>
    </footer>
  )
}

