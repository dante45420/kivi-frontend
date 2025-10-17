import { useState, useEffect, useMemo } from 'react'
import { listProducts } from '../api/products'
import { listVariants, listVariantTiers } from '../api/variants'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
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
      
      // Cargar variantes y price tiers para cada producto
      const productsWithVariants = await Promise.all(
        data.map(async (product) => {
          try {
            const variants = await listVariants(product.id)
            
            // Cargar price tiers para cada variante
            const variantsWithTiers = await Promise.all(
              variants.map(async (variant) => {
                try {
                  const tiers = await listVariantTiers(product.id, variant.id)
                  return { ...variant, price_tiers: tiers }
                } catch {
                  return { ...variant, price_tiers: [] }
                }
              })
            )
            
            return { ...product, variants: variantsWithTiers }
          } catch {
            return { ...product, variants: [] }
          }
        })
      )
      
      setProducts(productsWithVariants)
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

  const whatsappNumber = '56969172764'
  const whatsappMessage = encodeURIComponent('¡Hola! Quiero hacer un pedido 🥝')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kivi-cream)' }}>
      <PublicNavbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 100px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Logo */}
          <div style={{ marginBottom: 24 }}>
            <img 
              src="/kivi-logo.png" 
              alt="Kivi Logo" 
              style={{ 
                maxWidth: 300, 
                width: '100%',
                height: 'auto'
              }}
              onError={(e) => {
                // Fallback si no hay logo
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />
            <div style={{ display: 'none', fontSize: 80, margin: '20px 0' }}>🥝</div>
          </div>
          
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            margin: '0 0 12px 0',
            color: '#000',
            letterSpacing: '-0.5px'
          }}>
            Frutas y Verduras Frescas
          </h1>
          <p style={{ fontSize: 18, color: 'var(--kivi-text)', margin: '0 0 24px 0' }}>
            Todo pedido es personalizable a tu manera
          </p>
          <button
            onClick={() => generateCatalogPDF(products)}
            style={{
              padding: '14px 28px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: '#88C4A8',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(136, 196, 168, 0.3)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(136, 196, 168, 0.4)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(136, 196, 168, 0.3)'
            }}
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
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 8,
                      color: '#000'
                    }}>
                      Frutas
                    </h2>
                    <div style={{ 
                      height: 3, 
                      width: 80,
                      background: '#88C4A8',
                      borderRadius: 2,
                      marginBottom: 24
                    }}></div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
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
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 8,
                      color: '#000'
                    }}>
                      Verduras
                    </h2>
                    <div style={{ 
                      height: 3, 
                      width: 80,
                      background: '#88C4A8',
                      borderRadius: 2,
                      marginBottom: 24
                    }}></div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
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
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={{ 
                      fontSize: 32, 
                      fontWeight: 800, 
                      marginBottom: 8,
                      color: '#000'
                    }}>
                      Otros
                    </h2>
                    <div style={{ 
                      height: 3, 
                      width: 80,
                      background: '#88C4A8',
                      borderRadius: 2,
                      marginBottom: 24
                    }}></div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
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

      <PublicFooter />
    </div>
  )
}

function ProductCard({ product }) {
  const price = product.catalog?.[0]

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 12, 
      padding: 0,
      border: '1px solid #E0E0E0',
      transition: 'all 0.2s',
      overflow: 'hidden'
    }}
    onMouseOver={e => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseOut={e => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      {/* Imagen del producto */}
      {product.quality_photo_url && (
        <div style={{ 
          width: '100%',
          height: 200,
          background: '#F5F5F5',
          overflow: 'hidden'
        }}>
          <img 
            src={product.quality_photo_url} 
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}

      <div style={{ padding: 20 }}>
        {/* Product Name & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 800, 
            margin: 0,
            color: '#000',
            flex: 1
          }}>
            {product.name}
          </h3>
          {price && (
            <div style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#888',
              marginLeft: 12,
              whiteSpace: 'nowrap'
            }}>
              ${price.sale_price?.toLocaleString('es-CL')}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>
                /{price.unit}
              </span>
            </div>
          )}
        </div>

        {/* Variantes - cuadrados uno al lado del otro */}
        {product.variants && product.variants.filter(v => v.active).length > 0 && (
          <div style={{ 
            marginTop: 16, 
            paddingTop: 16, 
            borderTop: '1px solid #E8E8E8'
          }}>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              marginBottom: 10,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Opciones
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 8
            }}>
              {product.variants.filter(v => v.active).map(variant => {
                // Tomar el primer price tier como referencia
                const mainTier = variant.price_tiers?.[0]
                return (
                  <div key={variant.id} style={{ 
                    background: 'var(--kivi-cream)', 
                    padding: '10px', 
                    borderRadius: 8,
                    textAlign: 'center',
                    border: '1px solid #E8E8E8',
                    minHeight: 70,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4
                  }}>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#000', 
                      fontSize: 13,
                      marginBottom: 2
                    }}>
                      {variant.label}
                    </div>
                    {mainTier && (
                      <div style={{ 
                        fontSize: 15, 
                        fontWeight: 700, 
                        color: '#888'
                      }}>
                        ${mainTier.sale_price?.toLocaleString('es-CL')}
                      </div>
                    )}
                    {variant.price_tiers && variant.price_tiers.length > 1 && (
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                        + {variant.price_tiers.length - 1} más
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

