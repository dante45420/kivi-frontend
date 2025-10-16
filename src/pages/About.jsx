import PublicNavbar from '../components/PublicNavbar'
import '../styles/globals.css'

export default function About() {
  const whatsappNumber = '56696172764'
  const whatsappMessage = encodeURIComponent('¡Hola! Quiero hacer un pedido 🥝')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🥝</div>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            margin: '0 0 16px 0',
            color: 'var(--kivi-text-dark)',
            background: 'linear-gradient(135deg, var(--kivi-green-dark) 0%, var(--kivi-green) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Kivi - Frutas y Verduras Frescas
          </h1>
          <p style={{ 
            fontSize: 20, 
            color: 'var(--kivi-text)', 
            lineHeight: 1.6,
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Tu proveedor de confianza para frutas y verduras frescas de la mejor calidad
          </p>
        </div>

        {/* About Us */}
        <div style={{ 
          background: 'white', 
          borderRadius: 24, 
          padding: 40,
          marginBottom: 32,
          border: '1px solid #E8E8E8'
        }}>
          <h2 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 24,
            color: 'var(--kivi-text-dark)'
          }}>
            ¿Quiénes Somos?
          </h2>
          <p style={{ 
            fontSize: 18, 
            lineHeight: 1.8, 
            color: 'var(--kivi-text)',
            marginBottom: 20
          }}>
            En <strong>Kivi</strong>, nos dedicamos a ofrecer frutas y verduras de la más alta calidad, 
            frescas y seleccionadas cuidadosamente para nuestros clientes. Creemos que cada persona 
            merece acceso a productos frescos y saludables.
          </p>
          <p style={{ 
            fontSize: 18, 
            lineHeight: 1.8, 
            color: 'var(--kivi-text)'
          }}>
            Nuestro compromiso es brindarte un servicio personalizado, donde cada pedido se adapta 
            a tus necesidades específicas. Trabajamos directamente con productores locales para 
            garantizar la frescura y calidad de cada producto.
          </p>
        </div>

        {/* Features */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 40
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: 16, 
            padding: 32,
            border: '1px solid #E8E8E8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍎</div>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              marginBottom: 12,
              color: 'var(--kivi-text-dark)'
            }}>
              Productos Frescos
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.6,
              margin: 0
            }}>
              Seleccionamos cuidadosamente cada producto para garantizar la máxima frescura y calidad
            </p>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: 16, 
            padding: 32,
            border: '1px solid #E8E8E8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              marginBottom: 12,
              color: 'var(--kivi-text-dark)'
            }}>
              Pedidos Personalizados
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.6,
              margin: 0
            }}>
              Cada pedido es personalizable a tu manera, adaptándonos a lo que necesitas
            </p>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: 16, 
            padding: 32,
            border: '1px solid #E8E8E8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              marginBottom: 12,
              color: 'var(--kivi-text-dark)'
            }}>
              Mejores Precios
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.6,
              margin: 0
            }}>
              Si no encuentras algo, lo buscamos y cobramos 10% menos que el Jumbo
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--kivi-green-soft) 0%, var(--kivi-green) 100%)', 
          borderRadius: 24, 
          padding: 48,
          textAlign: 'center',
          marginBottom: 40
        }}>
          <h2 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 16,
            color: 'var(--kivi-text-dark)'
          }}>
            ¿Listo para hacer tu pedido?
          </h2>
          <p style={{ 
            fontSize: 18, 
            color: 'var(--kivi-text)', 
            marginBottom: 32,
            lineHeight: 1.6
          }}>
            Explora nuestro catálogo y contáctanos por WhatsApp para hacer tu pedido personalizado
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                borderRadius: 'var(--radius-pill)',
                background: 'white',
                color: 'var(--kivi-text-dark)',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: '2px solid white'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Ver Catálogo
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--kivi-green-dark)',
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: '2px solid var(--kivi-green-dark)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 32,
          border: '1px solid #E8E8E8',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: 24, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 24,
            color: 'var(--kivi-text-dark)'
          }}>
            Contáctanos
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: 32, 
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: 18,
            color: 'var(--kivi-text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📞</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--kivi-text-dark)' }}>WhatsApp</div>
                <div>+56 9 6917 2764</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📷</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--kivi-text-dark)' }}>Instagram</div>
                <div>@kivi.chile</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

