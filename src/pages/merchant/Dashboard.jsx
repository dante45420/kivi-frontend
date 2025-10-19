import { useState, useEffect } from 'react'
import { getMerchantProducts } from '../../api/merchant'
import { getUserData } from '../../api/auth'
import '../../styles/globals.css'

export default function MerchantDashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const userData = getUserData()

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await getMerchantProducts()
      setProducts(data)
    } catch (e) {
      alert('Error al cargar productos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // Cargar carrito del localStorage
    const savedCart = localStorage.getItem('merchant_cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Guardar carrito al cambiar
  useEffect(() => {
    localStorage.setItem('merchant_cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product, vendor) {
    const existingIndex = cart.findIndex(
      item => item.product_id === product.id && item.vendor_id === vendor.vendor_id
    )

    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].qty += 1
      setCart(newCart)
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          variant_id: vendor.variant_id,
          variant_label: vendor.variant_label,
          vendor_id: vendor.vendor_id,
          vendor_name: vendor.vendor_name,
          unit: vendor.unit,
          price: vendor.price,
          qty: 1
        }
      ])
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !filterCategory || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 18, opacity: 0.6 }}>Cargando catálogo...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--kivi-text-dark)' }}>
          Catálogo B2B
        </h1>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 16 }}>
          Bienvenido, {userData?.business_name || 'Comerciante'}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: 'white', 
        padding: 20, 
        borderRadius: 16, 
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 16px',
            border: '1px solid #ddd',
            borderRadius: 12,
            fontSize: 14
          }}
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #ddd',
            borderRadius: 12,
            fontSize: 14,
            minWidth: 150
          }}
        >
          <option value="">Todas las categorías</option>
          <option value="fruta">Frutas</option>
          <option value="verdura">Verduras</option>
          <option value="otro">Otros</option>
        </select>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
          No se encontraron productos
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
                transition: 'all 0.2s'
              }}
            >
              {product.image_url && (
                <div style={{ 
                  width: '100%',
                  height: 180,
                  background: '#f5f5f5',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={e => e.target.style.display = 'none'}
                  />
                </div>
              )}
              
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>
                  {product.name}
                </h3>
                
                {/* Opciones de vendedores */}
                <div style={{ display: 'grid', gap: 8 }}>
                  {product.vendors.map((vendor, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        background: 'var(--kivi-cream)',
                        borderRadius: 12,
                        fontSize: 13
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {vendor.vendor_name}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          ${vendor.price.toLocaleString('es-CL')} / {vendor.unit === 'unit' ? 'unidad' : vendor.unit}
                          {vendor.variant_label && ` • ${vendor.variant_label}`}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product, vendor)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--kivi-green)',
                          border: 'none',
                          borderRadius: 999,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#000',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'var(--kivi-green)',
          padding: '16px 24px',
          borderRadius: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000
        }}
        onClick={() => window.location.href = '/merchant/cart'}
        >
          <span style={{ fontSize: 24 }}>🛒</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#000' }}>
              {cartCount} {cartCount === 1 ? 'producto' : 'productos'}
            </div>
            <div style={{ fontSize: 14, color: '#000', opacity: 0.8 }}>
              ${cartTotal.toLocaleString('es-CL')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

