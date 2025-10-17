import PublicNavbar from '../components/PublicNavbar'
import '../styles/globals.css'

export default function About() {
  const whatsappNumber = '56969172764'
  const whatsappMessage = encodeURIComponent('¡Hola! Quiero hacer un pedido 🥝')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <img 
            src="/kivi-logo.png" 
            alt="Kivi Logo" 
            style={{ 
              maxWidth: 280, 
              width: '100%',
              height: 'auto',
              marginBottom: 24
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'block'
            }}
          />
          <div style={{ display: 'none', fontSize: 80, marginBottom: 16 }}>🥝</div>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            margin: '0 0 16px 0',
            color: '#000'
          }}>
            Frutas y Verduras Frescas
          </h1>
          <p style={{ 
            fontSize: 20, 
            color: 'var(--kivi-text)', 
            lineHeight: 1.6,
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'justify'
          }}>
            Tu proveedor de confianza para frutas y verduras frescas de la mejor calidad, 
            con entrega a domicilio y pedidos 100% personalizables.
          </p>
        </div>

        {/* Entrega Rápida */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--kivi-green-soft) 0%, var(--kivi-mint) 100%)', 
          borderRadius: 24, 
          padding: 40,
          marginBottom: 32,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚚</div>
          <h2 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 16,
            color: '#000'
          }}>
            Entrega en Menos de 24 Horas
          </h2>
          <p style={{ 
            fontSize: 18, 
            lineHeight: 1.8, 
            color: 'var(--kivi-text)',
            maxWidth: 700,
            margin: '0 auto',
            textAlign: 'justify'
          }}>
            Realizamos entregas a domicilio en tiempo récord. Haz tu pedido hoy y recíbelo mañana, 
            fresco y perfecto para tu consumo. Trabajamos con eficiencia para que nunca te falte 
            lo que necesitas.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 40
        }}>
          {/* Frescura Garantizada */}
          <div style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: 36,
            border: '2px solid var(--kivi-green-soft)',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 800, 
              marginBottom: 16,
              color: '#000'
            }}>
              Frescura Garantizada
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.7,
              margin: 0,
              textAlign: 'justify'
            }}>
              No trabajamos con stock. Compramos exactamente lo que necesitas el mismo día de tu entrega, 
              asegurando que cada producto llegue en su punto perfecto de frescura. Sin intermediarios, 
              directo del productor a tu mesa.
            </p>
          </div>

          {/* Personalización Total */}
          <div style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: 36,
            border: '2px solid var(--kivi-blue-soft)',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 800, 
              marginBottom: 16,
              color: '#000'
            }}>
              Personalización Total
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.7,
              margin: 0,
              textAlign: 'justify'
            }}>
              Tú decides todo: el nivel de madurez que prefieres, el tamaño de cada fruta o verdura, 
              la calidad (para jugo o primera calidad), y cualquier otra preferencia que tengas. 
              Si no especificas, nosotros seleccionamos productos verdes de la mejor calidad disponible.
            </p>
          </div>

          {/* Mejores Precios */}
          <div style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: 36,
            border: '2px solid var(--kivi-orange)',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💰</div>
            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 800, 
              marginBottom: 16,
              color: '#000'
            }}>
              Precios Competitivos
            </h3>
            <p style={{ 
              fontSize: 16, 
              color: 'var(--kivi-text)', 
              lineHeight: 1.7,
              margin: 0,
              textAlign: 'justify'
            }}>
              Ofrecemos precios justos y competitivos. Si no encuentras algo en nuestro catálogo, 
              lo buscamos especialmente para ti y te lo ofrecemos con un 10% de descuento respecto 
              a grandes cadenas como Jumbo.
            </p>
          </div>
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
            color: '#000'
          }}>
            ¿Quiénes Somos?
          </h2>
          <p style={{ 
            fontSize: 18, 
            lineHeight: 1.8, 
            color: 'var(--kivi-text)',
            marginBottom: 20,
            textAlign: 'justify'
          }}>
            En <strong>Kivi</strong>, nos dedicamos a revolucionar la forma en que compras frutas 
            y verduras. Creemos que cada persona merece acceso a productos frescos, de calidad y 
            adaptados a sus necesidades específicas, sin tener que pagar de más o conformarse con 
            productos que llevan días en stock.
          </p>
          <p style={{ 
            fontSize: 18, 
            lineHeight: 1.8, 
            color: 'var(--kivi-text)',
            textAlign: 'justify'
          }}>
            Nuestro compromiso es brindarte un servicio 100% personalizado. Trabajamos directamente 
            con productores locales, comprando únicamente lo que necesitas el día de tu entrega, 
            garantizando frescura absoluta y eliminando desperdicios. Cada pedido es único, porque 
            cada cliente es único.
          </p>
        </div>

        {/* CTA Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--kivi-green) 0%, var(--kivi-green-dark) 100%)', 
          borderRadius: 24, 
          padding: 48,
          textAlign: 'center',
          marginBottom: 40,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <h2 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 16,
            color: 'white'
          }}>
            ¿Listo para hacer tu pedido?
          </h2>
          <p style={{ 
            fontSize: 18, 
            color: 'rgba(255,255,255,0.95)', 
            marginBottom: 32,
            lineHeight: 1.6,
            textAlign: 'justify',
            maxWidth: 600,
            margin: '0 auto 32px auto'
          }}>
            Explora nuestro catálogo actualizado y contáctanos por WhatsApp para hacer tu pedido 
            personalizado. ¡Estamos listos para atenderte!
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
                color: 'var(--kivi-green-dark)',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: '2px solid white'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              📖 Ver Catálogo
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                borderRadius: 'var(--radius-pill)',
                background: '#25D366',
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: '2px solid #25D366'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src="/whatsapp-icon.png" alt="WhatsApp" style={{ width: 24, height: 24 }} />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: 36,
          border: '1px solid #E8E8E8',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: 26, 
            fontWeight: 800, 
            marginTop: 0,
            marginBottom: 28,
            color: '#000'
          }}>
            Contáctanos
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: 40, 
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: 18,
            color: 'var(--kivi-text)'
          }}>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#25D366'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--kivi-text)'}
            >
              <img src="/whatsapp-icon.png" alt="WhatsApp" style={{ width: 32, height: 32 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#000', marginBottom: 4 }}>WhatsApp</div>
                <div>+56 9 6917 2764</div>
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
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#E1306C'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--kivi-text)'}
            >
              <img src="/instagram-icon.png" alt="Instagram" style={{ width: 32, height: 32 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#000', marginBottom: 4 }}>Instagram</div>
                <div>@kivi.chile</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
