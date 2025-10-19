import { useState, useEffect } from 'react'
import { listVendors, createVendor } from '../api/vendors'
import { batchUpdateVendorPrices } from '../api/adminVendors'
import { listVariants } from '../api/variants'
import '../styles/globals.css'

export default function VueltaReconocimientoModal({ open, onClose, products, onSuccess }) {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [prices, setPrices] = useState({}) // {product_id: {price, unit, variants: {variant_id: {price, unit}}}}
  const [saving, setSaving] = useState(false)
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [productVariants, setProductVariants] = useState({}) // {product_id: [variants]}
  const [expandedProducts, setExpandedProducts] = useState({}) // {product_id: boolean}

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
      initialPrices[p.product_id] = {
        product_name: p.product_name,
        product_category: p.category || 'otro',
        price: '',
        unit: p.default_unit || 'kg',
        variants: {}
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

    const pricesArray = []
    
    Object.entries(prices).forEach(([productId, data]) => {
      // Precio base (sin variante)
      if (data.price && parseFloat(data.price) > 0) {
        pricesArray.push({
          product_id: parseInt(productId),
          variant_id: null,
          base_price: parseFloat(data.price),
          unit: data.unit,
          markup_percentage: 20
        })
      }
      
      // Precios de variantes
      if (data.variants) {
        Object.entries(data.variants).forEach(([variantId, variantData]) => {
          if (variantData.price && parseFloat(variantData.price) > 0) {
            pricesArray.push({
              product_id: parseInt(productId),
              variant_id: parseInt(variantId),
              base_price: parseFloat(variantData.price),
              unit: variantData.unit,
              markup_percentage: 20
            })
          }
        })
      }
    })

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

  function updatePrice(productId, field, value) {
    setPrices(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }))
  }

  function updateVariantPrice(productId, variantId, field, value) {
    setPrices(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        variants: {
          ...prev[productId].variants,
          [variantId]: {
            ...(prev[productId].variants[variantId] || {}),
            [field]: value
          }
        }
      }
    }))
  }

  function toggleProduct(productId) {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  if (!open) return null

  // Agrupar y ordenar productos por categoría
  const categorizedProducts = {}
  
  products.forEach(product => {
    const category = product.category || 'otro'
    if (!categorizedProducts[category]) {
      categorizedProducts[category] = []
    }
    categorizedProducts[category].push(product)
  })

  // Ordenar categorías y productos alfabéticamente
  const categoryOrder = { 'fruta': 0, 'verdura': 1, 'otro': 2 }
  const categoryLabels = { 'fruta': 'Frutas', 'verdura': 'Verduras', 'otro': 'Otros' }
  
  const sortedCategories = Object.entries(categorizedProducts).sort((a, b) => {
    const orderA = categoryOrder[a[0]] ?? 999
    const orderB = categoryOrder[b[0]] ?? 999
    return orderA - orderB
  })

  sortedCategories.forEach(([_, prods]) => {
    prods.sort((a, b) => a.product_name.localeCompare(b.product_name))
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
        padding: '16px',
        zIndex: 2000,
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0',
          margin: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Simple */}
        <div style={{ 
          padding: '24px',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#000' }}>
              Reconocimiento de Precios
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Registra los precios que preguntaste hoy
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f5f5f5',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '20px',
          background: 'var(--kivi-cream)'
        }}>
          {/* Selección de proveedor */}
          <div style={{ 
            marginBottom: '20px',
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #E0E0E0'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#000'
            }}>
              Proveedor *
            </label>
            
            {!showNewVendor ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewVendor(true)}
                  style={{
                    padding: '12px 20px',
                    background: '#88C4A8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + Nuevo
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="text"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  style={{
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '14px'
                  }}
                  onKeyPress={e => e.key === 'Enter' && handleCreateVendor()}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCreateVendor}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#88C4A8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => { setShowNewVendor(false); setNewVendorName('') }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Productos por categoría */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {sortedCategories.map(([category, categoryProducts]) => (
              <div key={category}>
                {/* Header de Categoría Simple */}
                <div style={{ 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #88C4A8'
                }}>
                  <h3 style={{ 
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#000'
                  }}>
                    {categoryLabels[category] || category}
                  </h3>
                </div>

                {/* Productos */}
                <div style={{ display: 'grid', gap: '8px' }}>
                  {categoryProducts.map(product => {
                    const hasVariants = productVariants[product.product_id]?.length > 0
                    const isExpanded = expandedProducts[product.product_id]
                    const priceData = prices[product.product_id]

                    return (
                      <div 
                        key={product.product_id}
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid #E0E0E0'
                        }}
                      >
                        {/* Header del producto */}
                        <div style={{
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          borderBottom: '1px solid #f5f5f5'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#000' }}>
                              {product.product_name}
                            </div>
                            {hasVariants && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                {productVariants[product.product_id].length} variantes
                              </div>
                            )}
                          </div>
                          {hasVariants && (
                            <button
                              onClick={() => toggleProduct(product.product_id)}
                              style={{
                                padding: '6px 12px',
                                background: isExpanded ? '#88C4A8' : '#f5f5f5',
                                color: isExpanded ? 'white' : '#666',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {isExpanded ? 'Ocultar' : 'Variantes'}
                            </button>
                          )}
                        </div>

                        {/* Precio base */}
                        <div style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '13px', color: '#666', minWidth: '80px' }}>
                              Precio base:
                            </div>
                            <input
                              type="number"
                              placeholder="0"
                              value={priceData?.price || ''}
                              onChange={e => updatePrice(product.product_id, 'price', e.target.value)}
                              style={{
                                flex: 1,
                                minWidth: '80px',
                                maxWidth: '120px',
                                padding: '8px',
                                border: '1px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                            />
                            <select
                              value={priceData?.unit || 'kg'}
                              onChange={e => updatePrice(product.product_id, 'unit', e.target.value)}
                              style={{
                                padding: '8px',
                                border: '1px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                background: 'white'
                              }}
                            >
                              <option value="kg">kg</option>
                              <option value="unit">un</option>
                            </select>
                          </div>
                        </div>

                        {/* Variantes (desplegable) */}
                        {hasVariants && isExpanded && (
                          <div style={{ 
                            padding: '12px',
                            borderTop: '1px solid #f5f5f5',
                            background: '#fafafa',
                            display: 'grid',
                            gap: '8px'
                          }}>
                            {productVariants[product.product_id].map(variant => {
                              const variantPrice = priceData?.variants?.[variant.id]
                              
                              return (
                                <div key={variant.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: '12px', color: '#666', minWidth: '80px', fontWeight: 500 }}>
                                    {variant.label}:
                                  </div>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={variantPrice?.price || ''}
                                    onChange={e => updateVariantPrice(product.product_id, variant.id, 'price', e.target.value)}
                                    style={{
                                      flex: 1,
                                      minWidth: '80px',
                                      maxWidth: '120px',
                                      padding: '8px',
                                      border: '1px solid #E0E0E0',
                                      borderRadius: '8px',
                                      fontSize: '13px'
                                    }}
                                  />
                                  <select
                                    value={variantPrice?.unit || priceData?.unit || 'kg'}
                                    onChange={e => updateVariantPrice(product.product_id, variant.id, 'unit', e.target.value)}
                                    style={{
                                      padding: '8px',
                                      border: '1px solid #E0E0E0',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      background: 'white'
                                    }}
                                  >
                                    <option value="kg">kg</option>
                                    <option value="unit">un</option>
                                  </select>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          gap: '8px',
          background: 'white',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '12px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '12px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: '#666'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedVendor}
            style={{
              flex: 2,
              minWidth: '160px',
              padding: '12px',
              background: (saving || !selectedVendor) ? '#ccc' : '#88C4A8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (saving || !selectedVendor) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Precios'}
          </button>
        </div>
      </div>
    </div>
  )
}
