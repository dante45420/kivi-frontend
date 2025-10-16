import { useState, useEffect, useMemo } from 'react'
import { listProducts } from '../api/products'
import PublicNavbar from '../components/PublicNavbar'
import { generateCatalogPDF } from '../utils/pdfGenerator'
import '../styles/globals.css'

export default function Catalogo() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState('default') // default, alphabetical
  const [categoryFilter, setCategoryFilter] = useState('all') // all, fruta, verdura

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    // Ordenar
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // Ordenamiento por defecto: frutas primero, luego verduras, alfabético dentro de cada categoría
      result.sort((a, b) => {
        if (a.category === 'fruta' && b.category !== 'fruta') return -1
        if (a.category !== 'fruta' && b.category === 'fruta') return 1
        if (a.category === 'verdura' && b.category !== 'verdura') return -1
        if (a.category !== 'verdura' && b.category === 'verdura') return 1
        return a.name.localeCompare(b.name)
      })
    }

    return result
  }, [products, categoryFilter, sortBy])

  const whatsappNumber = '56696172764'
  const whatsappMessage = encodeURIComponent('¡Hola! Quiero hacer un pedido 🥝')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 100px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 800, 
            margin: '0 0 8px 0',
            color: 'var(--kivi-text-dark)',
            background: 'linear-gradient(135deg, var(--kivi-green-dark) 0%, var(--kivi-green) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Frutas y Verduras Frescas
          </h1>
          <p style={{ fontSize: 18, color: 'var(--kivi-text)', margin: '0 0 16px 0' }}>
            Todo pedido es personalizable a tu manera
          </p>
          <button
            onClick={() => generateCatalogPDF(products)}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--kivi-green)',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: 18 }}>📄</span>
            Descargar Catálogo PDF
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--kivi-text)' }}>
            Cargando catálogo...
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--kivi-text)' }}>
            No hay productos disponibles
          </div>
        ) : (
          <>
            {/* Category Headers */}
            {sortBy === 'default' && (
              <>
                {categoryFilter === 'all' || categoryFilter === 'fruta' ? (
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 20,
                      color: 'var(--kivi-text-dark)'
                    }}>
                      🍎 Frutas
                    </h2>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: 20 
                    }}>
                      {filteredAndSortedProducts
                        .filter(p => p.category === 'fruta')
                        .map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  </div>
                ) : null}

                {categoryFilter === 'all' || categoryFilter === 'verdura' ? (
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 20,
                      color: 'var(--kivi-text-dark)'
                    }}>
                      🥬 Verduras
                    </h2>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: 20 
                    }}>
                      {filteredAndSortedProducts
                        .filter(p => p.category === 'verdura')
                        .map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  </div>
                ) : null}

                {/* Otros productos (sin categoría) */}
                {(categoryFilter === 'all' || categoryFilter === '') && 
                 filteredAndSortedProducts.filter(p => !p.category || (p.category !== 'fruta' && p.category !== 'verdura')).length > 0 ? (
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 20,
                      color: 'var(--kivi-text-dark)'
                    }}>
                      🛒 Otros
                    </h2>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: 20 
                    }}>
                      {filteredAndSortedProducts
                        .filter(p => !p.category || (p.category !== 'fruta' && p.category !== 'verdura'))
                        .map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Alphabetical view */}
            {sortBy === 'alphabetical' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: 20 
              }}>
                {filteredAndSortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Note */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 48, 
          padding: 24,
          background: 'white',
          borderRadius: 16,
          border: '1px solid #E8E8E8'
        }}>
          <p style={{ 
            fontSize: 16, 
            fontStyle: 'italic', 
            color: 'var(--kivi-text)',
            margin: 0
          }}>
            *Si no encuentras algo, lo buscamos y cobramos 10% menos que el Jumbo*
          </p>
          <div style={{ 
            marginTop: 16, 
            display: 'flex', 
            gap: 16, 
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kivi-text)' }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <span style={{ fontWeight: 600 }}>+56 9 6917 2764</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kivi-text)' }}>
              <span style={{ fontSize: 20 }}>📷</span>
              <span style={{ fontWeight: 600 }}>@kivi.chile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: 'white',
        borderTop: '2px solid var(--kivi-green-soft)',
        padding: '16px 20px',
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        zIndex: 999,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)'
      }}>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          style={{
            flex: 1,
            maxWidth: 250,
            padding: '14px 24px',
            borderRadius: 'var(--radius-pill)',
            border: '2px solid var(--kivi-green)',
            background: filterOpen ? 'var(--kivi-green)' : 'white',
            color: filterOpen ? 'white' : 'var(--kivi-green)',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 18 }}>🔍</span>
          Filtros
        </button>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            maxWidth: 250,
            padding: '14px 24px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            background: 'var(--kivi-green)',
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          Hacer Pedido
        </a>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.4)', 
            display: 'flex', 
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1001,
            padding: 0
          }}
          onClick={() => setFilterOpen(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: 24, 
              fontWeight: 800, 
              marginTop: 0, 
              marginBottom: 24,
              color: 'var(--kivi-text-dark)'
            }}>
              Filtros
            </h3>

            {/* Ordenar por */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 700, 
                marginBottom: 12,
                fontSize: 15,
                color: 'var(--kivi-text)'
              }}>
                Ordenar por
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSortBy('default')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${sortBy === 'default' ? 'var(--kivi-green)' : '#ddd'}`,
                    background: sortBy === 'default' ? 'var(--kivi-green)' : 'white',
                    color: sortBy === 'default' ? 'white' : 'var(--kivi-text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Por Categoría
                </button>
                <button
                  onClick={() => setSortBy('alphabetical')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${sortBy === 'alphabetical' ? 'var(--kivi-green)' : '#ddd'}`,
                    background: sortBy === 'alphabetical' ? 'var(--kivi-green)' : 'white',
                    color: sortBy === 'alphabetical' ? 'white' : 'var(--kivi-text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Alfabético
                </button>
              </div>
            </div>

            {/* Filtrar por categoría */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 700, 
                marginBottom: 12,
                fontSize: 15,
                color: 'var(--kivi-text)'
              }}>
                Categoría
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCategoryFilter('all')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${categoryFilter === 'all' ? 'var(--kivi-green)' : '#ddd'}`,
                    background: categoryFilter === 'all' ? 'var(--kivi-green)' : 'white',
                    color: categoryFilter === 'all' ? 'white' : 'var(--kivi-text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Todas
                </button>
                <button
                  onClick={() => setCategoryFilter('fruta')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${categoryFilter === 'fruta' ? 'var(--kivi-green)' : '#ddd'}`,
                    background: categoryFilter === 'fruta' ? 'var(--kivi-green)' : 'white',
                    color: categoryFilter === 'fruta' ? 'white' : 'var(--kivi-text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🍎 Frutas
                </button>
                <button
                  onClick={() => setCategoryFilter('verdura')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${categoryFilter === 'verdura' ? 'var(--kivi-green)' : '#ddd'}`,
                    background: categoryFilter === 'verdura' ? 'var(--kivi-green)' : 'white',
                    color: categoryFilter === 'verdura' ? 'white' : 'var(--kivi-text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🥬 Verduras
                </button>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setFilterOpen(false)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: 'var(--kivi-green)',
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function ProductCard({ product }) {
  const price = product.catalog?.[0]
  const [showVariants, setShowVariants] = useState(false)

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 16, 
      padding: 20,
      border: '1px solid #E8E8E8',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }}
    onMouseOver={e => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      e.currentTarget.style.transform = 'translateY(-4px)'
    }}
    onMouseOut={e => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    onClick={() => setShowVariants(!showVariants)}
    >
      {/* Product Name */}
      <h3 style={{ 
        fontSize: 20, 
        fontWeight: 800, 
        margin: '0 0 8px 0',
        color: 'var(--kivi-text-dark)'
      }}>
        {product.name}
      </h3>

      {/* Default Price */}
      {price && (
        <div style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: 'var(--kivi-green-dark)',
          marginBottom: 8
        }}>
          ${price.sale_price?.toLocaleString('es-CL')} / {price.unit}
        </div>
      )}

      {/* Category Badge */}
      {product.category && (
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 12,
          fontWeight: 700,
          background: product.category === 'fruta' ? 'var(--kivi-peach)' : 'var(--kivi-mint)',
          color: 'var(--kivi-text-dark)',
          marginBottom: 12
        }}>
          {product.category === 'fruta' ? '🍎 Fruta' : '🥬 Verdura'}
        </span>
      )}

      {/* Variants */}
      {showVariants && product.variants && product.variants.length > 0 && (
        <div style={{ 
          marginTop: 16, 
          paddingTop: 16, 
          borderTop: '1px solid #E8E8E8'
        }}
        onClick={e => e.stopPropagation()}
        >
          <div style={{ 
            fontSize: 13, 
            fontWeight: 700, 
            marginBottom: 12,
            color: 'var(--kivi-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Opciones Disponibles
          </div>
          {product.variants.filter(v => v.active).map(variant => (
            <div key={variant.id} style={{ 
              background: 'var(--kivi-cream)', 
              padding: '10px 12px', 
              borderRadius: 8,
              marginBottom: 8,
              fontSize: 14
            }}>
              <div style={{ fontWeight: 700, color: 'var(--kivi-text-dark)', marginBottom: 4 }}>
                {variant.label}
              </div>
              {variant.price_tiers && variant.price_tiers.length > 0 && (
                <div style={{ fontSize: 13, color: 'var(--kivi-text)' }}>
                  {variant.price_tiers.map((tier, idx) => (
                    <div key={idx}>
                      {tier.min_qty > 1 ? `Desde ${tier.min_qty} ${tier.unit}` : ''}: 
                      <span style={{ fontWeight: 700, color: 'var(--kivi-green-dark)', marginLeft: 4 }}>
                        ${tier.sale_price?.toLocaleString('es-CL')} / {tier.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click to see variants hint */}
      {!showVariants && product.variants && product.variants.filter(v => v.active).length > 0 && (
        <div style={{ 
          fontSize: 12, 
          color: 'var(--kivi-text)', 
          marginTop: 12,
          fontStyle: 'italic'
        }}>
          Toca para ver opciones →
        </div>
      )}
    </div>
  )
}

