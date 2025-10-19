import { useState, useEffect } from 'react'
import { listVendors, createVendor } from '../api/vendors'
import { batchUpdateVendorPrices } from '../api/adminVendors'
import { listVariants } from '../api/variants'
import '../styles/globals.css'

export default function VueltaReconocimientoModal({ open, onClose, products, onSuccess }) {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [prices, setPrices] = useState({}) // {uniqueKey: {product_id, variant_id, price, unit}}
  const [saving, setSaving] = useState(false)
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [productVariants, setProductVariants] = useState({}) // {product_id: [variants]}

  useEffect(() => {
    if (open) {
      loadVendors()
      loadProductVariants()
      initializePrices()
    }
  }, [open, products])

  async function loadVendors() {
    try {
      const data = await listVendors()
      setVendors(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadProductVariants() {
    const variantsMap = {}
    for (const product of products) {
      try {
        const variants = await listVariants(product.product_id)
        if (variants && variants.length > 0) {
          variantsMap[product.product_id] = variants
        }
      } catch (e) {
        console.error(`Error loading variants for product ${product.product_id}:`, e)
      }
    }
    setProductVariants(variantsMap)
  }

  function initializePrices() {
    const initialPrices = {}
    products.forEach(p => {
      // Solo agregar entrada sin variante por defecto
      const key = `${p.product_id}-null`
      initialPrices[key] = {
        product_id: p.product_id,
        product_name: p.product_name,
        product_category: p.category || 'otro',
        variant_id: null,
        variant_label: null,
        price: '',
        unit: p.default_unit || 'kg'
      }
    })
    setPrices(initialPrices)
  }

  async function handleCreateVendor() {
    if (!newVendorName.trim()) return
    try {
      await createVendor({ name: newVendorName.trim(), notes: '' })
      await loadVendors()
      setNewVendorName('')
      setShowNewVendor(false)
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleSave() {
    if (!selectedVendor) {
      alert('Debes seleccionar un proveedor')
      return
    }

    const pricesArray = Object.values(prices)
      .filter(data => data.price && parseFloat(data.price) > 0)
      .map(data => ({
        product_id: data.product_id,
        variant_id: data.variant_id,
        base_price: parseFloat(data.price),
        unit: data.unit,
        markup_percentage: 20
      }))

    if (pricesArray.length === 0) {
      alert('Debes ingresar al menos un precio')
      return
    }

    setSaving(true)
    try {
      const result = await batchUpdateVendorPrices(parseInt(selectedVendor), pricesArray)
      alert(`✓ Guardado: ${result.created_count} nuevos, ${result.updated_count} actualizados`)
      onSuccess && onSuccess()
      onClose()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function updatePrice(key, field, value) {
    setPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  function addVariantRow(productId) {
    const variants = productVariants[productId] || []
    if (variants.length === 0) {
      alert('Este producto no tiene variantes')
      return
    }

    const product = products.find(p => p.product_id === productId)
    
    // Encontrar la primera variante que no tenga precio aún
    const existingVariantIds = Object.values(prices)
      .filter(p => p.product_id === productId && p.variant_id)
      .map(p => p.variant_id)

    const availableVariant = variants.find(v => !existingVariantIds.includes(v.id))
    
    if (!availableVariant) {
      alert('Ya agregaste todas las variantes disponibles')
      return
    }

    const key = `${productId}-${availableVariant.id}-${Date.now()}`
    
    setPrices(prev => ({
      ...prev,
      [key]: {
        product_id: productId,
        product_name: product?.product_name || '',
        product_category: product?.category || 'otro',
        variant_id: availableVariant.id,
        variant_label: availableVariant.label,
        price: '',
        unit: product?.default_unit || 'kg'
      }
    }))
  }

  function removeVariantRow(key) {
    // No permitir eliminar la fila base (sin variante)
    if (prices[key] && !prices[key].variant_id) {
      return
    }
    
    setPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[key]
      return newPrices
    })
  }

  if (!open) return null

  // Agrupar y ordenar productos por categoría
  const categorizedProducts = {}
  const priceEntries = Object.entries(prices)

  priceEntries.forEach(([key, data]) => {
    const category = data.product_category || 'otro'
    if (!categorizedProducts[category]) {
      categorizedProducts[category] = {}
    }
    if (!categorizedProducts[category][data.product_id]) {
      categorizedProducts[category][data.product_id] = {
        product_name: data.product_name,
        product_id: data.product_id,
        rows: []
      }
    }
    categorizedProducts[category][data.product_id].rows.push({ key, ...data })
  })

  // Ordenar categorías y productos alfabéticamente
  const categoryOrder = { 'fruta': 0, 'verdura': 1, 'otro': 2 }
  const categoryLabels = { 'fruta': 'Frutas', 'verdura': 'Verduras', 'otro': 'Otros' }
  
  const sortedCategories = Object.entries(categorizedProducts).sort((a, b) => {
    const orderA = categoryOrder[a[0]] ?? 999
    const orderB = categoryOrder[b[0]] ?? 999
    return orderA - orderB
  })

  sortedCategories.forEach(([_, products]) => {
    Object.values(products).sort((a, b) => a.product_name.localeCompare(b.product_name))
  })

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        zIndex: 2000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Elegante */}
        <div style={{ 
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Reconocimiento de Precios
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Registra los precios que preguntaste hoy
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '18px',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'white',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '24px 28px',
          background: '#fafafa'
        }}>
          {/* Selección de proveedor - Card elegante */}
          <div style={{ 
            marginBottom: '24px',
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#333'
            }}>
              Proveedor *
            </label>
            
            {!showNewVendor ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    border: '2px solid #e8e8e8',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 500,
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewVendor(true)}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '15px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                >
                  + Nuevo
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <input
                  type="text"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e8e8e8',
                    borderRadius: '12px',
                    fontSize: '15px',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                  onKeyPress={e => e.key === 'Enter' && handleCreateVendor()}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCreateVendor}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '15px'
                    }}
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => { setShowNewVendor(false); setNewVendorName('') }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e8e8e8',
                      color: '#333',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '15px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Productos por categoría */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {sortedCategories.map(([category, productGroups]) => {
              const sortedProducts = Object.values(productGroups).sort((a, b) => 
                a.product_name.localeCompare(b.product_name)
              )
              
              return (
                <div key={category}>
                  {/* Header de Categoría - Estilo Uber/Cornershop */}
                  <div style={{ 
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '3px solid transparent',
                    backgroundImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: '100% 3px',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom'
                  }}>
                    <h3 style={{ 
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#333',
                      letterSpacing: '-0.5px'
                    }}>
                      {categoryLabels[category] || category}
                    </h3>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      {sortedProducts.length} {sortedProducts.length === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>

                  {/* Productos de esta categoría */}
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {sortedProducts.map(productGroup => {
                      const hasVariants = productVariants[productGroup.product_id]?.length > 0

                      return (
                        <div 
                          key={productGroup.product_id}
                          style={{
                            background: 'white',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {/* Header del producto */}
                          <div style={{
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%)',
                            borderBottom: '1px solid #e8e8e8',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '16px', color: '#333', marginBottom: '2px' }}>
                                {productGroup.product_name}
                              </div>
                              {hasVariants && (
                                <div style={{ fontSize: '12px', color: '#667eea', fontWeight: 600 }}>
                                  {productVariants[productGroup.product_id].length} variantes disponibles
                                </div>
                              )}
                            </div>
                            {hasVariants && (
                              <button
                                onClick={() => addVariantRow(productGroup.product_id)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                }}
                              >
                                + Variante
                              </button>
                            )}
                          </div>

                          {/* Filas de precio */}
                          <div style={{ padding: '12px' }}>
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {productGroup.rows.map((priceData) => {
                                const isVariant = !!priceData.variant_id
                                
                                return (
                                  <div 
                                    key={priceData.key}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: hasVariants ? '1fr auto 90px 80px auto' : '1fr auto 90px 80px',
                                      gap: '10px',
                                      alignItems: 'center',
                                      padding: '12px',
                                      background: isVariant ? '#f8f9ff' : 'white',
                                      borderRadius: '12px',
                                      border: isVariant ? '2px dashed #d0d7ff' : '2px solid #f0f0f0'
                                    }}
                                  >
                                    {/* Variante selector o label */}
                                    {hasVariants && isVariant ? (
                                      <select
                                        value={priceData.variant_id || ''}
                                        onChange={e => {
                                          const variantId = parseInt(e.target.value)
                                          const variant = productVariants[productGroup.product_id]?.find(v => v.id === variantId)
                                          updatePrice(priceData.key, 'variant_id', variantId)
                                          updatePrice(priceData.key, 'variant_label', variant?.label || '')
                                        }}
                                        style={{
                                          padding: '10px 12px',
                                          border: '2px solid #e8e8e8',
                                          borderRadius: '10px',
                                          fontSize: '14px',
                                          background: 'white',
                                          fontWeight: 500
                                        }}
                                      >
                                        {productVariants[productGroup.product_id]?.map(v => (
                                          <option key={v.id} value={v.id}>{v.label}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div style={{ 
                                        fontSize: '14px', 
                                        color: isVariant ? '#667eea' : '#666',
                                        fontWeight: isVariant ? 600 : 500,
                                        paddingLeft: '4px'
                                      }}>
                                        {priceData.variant_label || 'Precio base'}
                                      </div>
                                    )}
                                    
                                    {/* Símbolo $ */}
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>$</div>
                                    
                                    {/* Input precio */}
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={priceData.price || ''}
                                      onChange={e => updatePrice(priceData.key, 'price', e.target.value)}
                                      style={{
                                        padding: '10px 12px',
                                        border: '2px solid #e8e8e8',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                      }}
                                      onFocus={e => {
                                        e.target.style.borderColor = '#667eea'
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                                      }}
                                      onBlur={e => {
                                        e.target.style.borderColor = '#e8e8e8'
                                        e.target.style.boxShadow = 'none'
                                      }}
                                      min="0"
                                      step="1"
                                    />
                                    
                                    {/* Selector unidad */}
                                    <select
                                      value={priceData.unit || 'kg'}
                                      onChange={e => updatePrice(priceData.key, 'unit', e.target.value)}
                                      style={{
                                        padding: '10px 12px',
                                        border: '2px solid #e8e8e8',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        background: 'white',
                                        fontWeight: 600
                                      }}
                                    >
                                      <option value="kg">kg</option>
                                      <option value="unit">un</option>
                                    </select>

                                    {/* Botón eliminar (solo para filas de variantes) */}
                                    {hasVariants && isVariant && (
                                      <button
                                        onClick={() => removeVariantRow(priceData.key)}
                                        style={{
                                          width: '36px',
                                          height: '36px',
                                          background: '#ffebee',
                                          color: '#f44336',
                                          border: 'none',
                                          borderRadius: '10px',
                                          cursor: 'pointer',
                                          fontSize: '20px',
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#f44336'}
                                        onMouseLeave={e => e.target.style.background = '#ffebee'}
                                        onMouseOver={e => e.target.style.color = 'white'}
                                        onMouseOut={e => e.target.style.color = '#f44336'}
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer con botones */}
        <div style={{ 
          padding: '20px 28px',
          borderTop: '1px solid #e8e8e8',
          display: 'flex',
          gap: '12px',
          background: 'white'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '16px',
              background: 'white',
              border: '2px solid #e8e8e8',
              borderRadius: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: '#666',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !saving && (e.target.style.background = '#f5f5f5')}
            onMouseLeave={e => e.target.style.background = 'white'}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedVendor}
            style={{
              flex: 2,
              padding: '16px',
              background: (saving || !selectedVendor) 
                ? '#e8e8e8' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: (saving || !selectedVendor) ? '#999' : 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: (saving || !selectedVendor) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: (saving || !selectedVendor) ? 'none' : '0 4px 16px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !saving && selectedVendor && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            {saving ? 'Guardando...' : `Guardar Precios`}
          </button>
        </div>
      </div>
    </div>
  )
}
