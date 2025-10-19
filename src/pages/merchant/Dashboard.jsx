import { useState, useEffect } from 'react'
import { getMerchantProducts, createMerchantOrder } from '../../api/merchant'
import { getUserData } from '../../api/auth'
import '../../styles/globals.css'

export default function MerchantDashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('category') // 'category' | 'vendor'
  const [notes, setNotes] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
    const cartKey = `${product.id}-${vendor.vendor_id}-${vendor.variant_id || 'null'}`
    const existingIndex = cart.findIndex(
      item => `${item.product_id}-${item.vendor_id}-${item.variant_id || 'null'}` === cartKey
    )

    const minQty = vendor.min_qty || 1

    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].qty += minQty
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
          min_qty: minQty,
          qty: minQty
        }
      ])
    }
  }

  function updateCartQty(index, newQty) {
    const item = cart[index]
    const minQty = item.min_qty || 1
    
    if (newQty <= 0) {
      removeFromCart(index)
      return
    }
    
    if (newQty < minQty) {
      alert(`La cantidad mínima para este producto es ${minQty} ${item.unit === 'unit' ? 'unidades' : 'kg'}`)
      return
    }
    
    const newCart = [...cart]
    newCart[index].qty = newQty
    setCart(newCart)
  }

  function removeFromCart(index) {
    setCart(cart.filter((_, i) => i !== index))
  }

  function clearCart() {
    setCart([])
    localStorage.removeItem('merchant_cart')
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) {
      alert('El carrito está vacío')
      return
    }

    if (!confirm('¿Confirmar pedido?')) return

    setSubmitting(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          vendor_id: item.vendor_id,
          quantity: item.qty,
          unit_price: item.price,
          unit: item.unit
        })),
        notes: notes || null,
        delivery_address: deliveryAddress || null
      }

      await createMerchantOrder(orderData)
      alert('¡Pedido creado exitosamente!')
      clearCart()
      setCartOpen(false)
      setNotes('')
      setDeliveryAddress('')
    } catch (e) {
      alert('Error al crear pedido: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Agrupar productos según el sortBy
  const groupedProducts = () => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    )

    if (sortBy === 'vendor') {
      // Agrupar por proveedor
      const groups = {}
      filtered.forEach(product => {
        product.vendors.forEach(vendor => {
          if (!groups[vendor.vendor_name]) {
            groups[vendor.vendor_name] = []
          }
          groups[vendor.vendor_name].push({ ...product, selectedVendor: vendor })
        })
      })
      return Object.entries(groups).map(([vendorName, items]) => ({
        key: vendorName,
        title: `Proveedor: ${vendorName}`,
        products: items
      }))
    } else {
      // Agrupar por categoría
      const groups = {
        'fruta': [],
        'verdura': [],
        'otro': []
      }
      filtered.forEach(product => {
        const cat = product.category || 'otro'
        groups[cat].push(product)
      })
      
      const categoryLabels = {
        'fruta': 'Frutas',
        'verdura': 'Verduras',
        'otro': 'Otros'
      }

      return Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([cat, items]) => ({
          key: cat,
          title: categoryLabels[cat] || cat,
          products: items
        }))
    }
  }

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
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0' }}>
          Catálogo B2B
        </h1>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 16 }}>
          Bienvenido, {userData?.business_name || 'Comerciante'}
        </p>
      </div>

      {/* Filtros y ordenamiento */}
      <div style={{ 
        background: 'white', 
        padding: 20, 
        borderRadius: 16, 
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'center'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>
            Ordenar por:
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: 12,
              fontSize: 14,
              minWidth: 150,
              cursor: 'pointer'
            }}
          >
            <option value="category">Tipo de Producto</option>
            <option value="vendor">Proveedor</option>
          </select>
        </div>
      </div>

      {/* Productos agrupados */}
      {groupedProducts().map(group => (
        <div key={group.key} style={{ marginBottom: 40 }}>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '3px solid #000'
          }}>
            {group.title}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {group.products.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
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
                    {sortBy === 'vendor' && product.selectedVendor ? (
                      // Modo proveedor: mostrar solo el vendor seleccionado
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          background: '#f0f0f0',
                          borderRadius: 12,
                          fontSize: 13
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            ${product.selectedVendor.price.toLocaleString('es-CL')} / {product.selectedVendor.unit === 'unit' ? 'unidad' : product.selectedVendor.unit}
                          </div>
                          <div style={{ opacity: 0.7 }}>
                            {product.selectedVendor.variant_label || 'Sin variante'}
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product, product.selectedVendor)}
                          style={{
                            padding: '8px 16px',
                            background: '#4caf50',
                            border: 'none',
                            borderRadius: 999,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + Agregar
                        </button>
                      </div>
                    ) : (
                      // Modo categoría: mostrar todos los vendors
                      product.vendors.map((vendor, vidx) => (
                        <div
                          key={vidx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            background: '#f0f0f0',
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
                            {vendor.min_qty && vendor.min_qty > 1 && (
                              <div style={{ fontSize: '11px', color: '#ff9800', fontWeight: 600, marginTop: '2px' }}>
                                Mínimo: {vendor.min_qty} {vendor.unit === 'unit' ? 'un' : 'kg'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product, vendor)}
                            style={{
                              padding: '8px 16px',
                              background: '#4caf50',
                              border: 'none',
                              borderRadius: 999,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#fff',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Agregar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {groupedProducts().length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
          No se encontraron productos
        </div>
      )}

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#4caf50',
          padding: '16px 24px',
          borderRadius: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000
        }}
        onClick={() => setCartOpen(true)}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>
              Carrito ({cartCount})
            </div>
            <div style={{ fontSize: 14, color: '#fff', opacity: 0.9 }}>
              ${cartTotal.toLocaleString('es-CL')}
            </div>
          </div>
        </div>
      )}

      {/* Modal del carrito */}
      {cartOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
        onClick={() => setCartOpen(false)}
        >
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                Tu Carrito
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 8
                }}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                El carrito está vacío
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{
                      padding: 16,
                      background: '#f5f5f5',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {item.vendor_name}
                          {item.variant_label && ` • ${item.variant_label}`}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                          ${item.price.toLocaleString('es-CL')} / {item.unit === 'unit' ? 'unidad' : item.unit}
                        </div>
                        {item.min_qty && item.min_qty > 1 && (
                          <div style={{ fontSize: 11, color: '#ff9800', fontWeight: 600, marginTop: 2 }}>
                            Mínimo: {item.min_qty} {item.unit === 'unit' ? 'un' : 'kg'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => updateCartQty(idx, item.qty - 1)}
                          style={{
                            width: 32,
                            height: 32,
                            border: '1px solid #ddd',
                            background: 'white',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateCartQty(idx, parseFloat(e.target.value) || 0)}
                          style={{
                            width: 60,
                            textAlign: 'center',
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        />
                        <button
                          onClick={() => updateCartQty(idx, item.qty + 1)}
                          style={{
                            width: 32,
                            height: 32,
                            border: '1px solid #ddd',
                            background: 'white',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(idx)}
                          style={{
                            width: 32,
                            height: 32,
                            border: '1px solid #f44336',
                            background: 'white',
                            color: '#f44336',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 16, minWidth: 80, textAlign: 'right' }}>
                        ${(item.price * item.qty).toLocaleString('es-CL')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campos adicionales */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                    Dirección de entrega (opcional)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Ingresa la dirección..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Comentarios o instrucciones especiales..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: 14,
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Total y botones */}
                <div style={{
                  borderTop: '2px solid #ddd',
                  paddingTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Total:</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#4caf50' }}>
                    ${cartTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={clearCart}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Vaciar Carrito
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: submitting ? '#ccc' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
