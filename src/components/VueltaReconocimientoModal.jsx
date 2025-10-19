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
      // Agregar entrada sin variante por defecto
      const key = `${p.product_id}-null`
      initialPrices[key] = {
        product_id: p.product_id,
        product_name: p.product_name,
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
      alert('Proveedor creado')
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleSave() {
    if (!selectedVendor) {
      alert('Debes seleccionar un proveedor')
      return
    }

    // Filtrar solo los productos con precio ingresado
    const pricesArray = Object.values(prices)
      .filter(data => data.price && parseFloat(data.price) > 0)
      .map(data => ({
        product_id: data.product_id,
        variant_id: data.variant_id,
        base_price: parseFloat(data.price),
        unit: data.unit,
        markup_percentage: 20 // Default 20%
      }))

    if (pricesArray.length === 0) {
      alert('Debes ingresar al menos un precio')
      return
    }

    setSaving(true)
    try {
      const result = await batchUpdateVendorPrices(parseInt(selectedVendor), pricesArray)
      alert(`Éxito: ${result.created_count} creados, ${result.updated_count} actualizados`)
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

    // Agregar una fila con la primera variante disponible que no esté ya agregada
    const existingVariantIds = Object.values(prices)
      .filter(p => p.product_id === productId && p.variant_id)
      .map(p => p.variant_id)

    const availableVariant = variants.find(v => !existingVariantIds.includes(v.id))
    
    if (!availableVariant) {
      alert('Ya agregaste todas las variantes de este producto')
      return
    }

    const key = `${productId}-${availableVariant.id}`
    const product = products.find(p => p.product_id === productId)
    
    setPrices(prev => ({
      ...prev,
      [key]: {
        product_id: productId,
        product_name: product?.product_name || '',
        variant_id: availableVariant.id,
        variant_label: availableVariant.label,
        price: '',
        unit: product?.default_unit || 'kg'
      }
    }))
  }

  function removeVariantRow(key) {
    setPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[key]
      return newPrices
    })
  }

  function toggleProduct(productId) {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  if (!open) return null

  // Agrupar precios por producto
  const groupedPrices = {}
  Object.entries(prices).forEach(([key, data]) => {
    if (!groupedPrices[data.product_id]) {
      groupedPrices[data.product_id] = []
    }
    groupedPrices[data.product_id].push({ key, ...data })
  })

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        zIndex: 2000,
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              Vuelta de Reconocimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Registra precios por producto y variante
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              lineHeight: 1,
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '20px 24px'
        }}>
          {/* Selección de proveedor */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '13px', 
              fontWeight: 600,
              color: '#333'
            }}>
              Proveedor *
            </label>
            
            {!showNewVendor ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'white',
                    cursor: 'pointer'
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
                    background: '#4caf50',
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
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
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
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => { setShowNewVendor(false); setNewVendorName('') }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de productos */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                Productos ({products.length})
              </label>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Solo completa los precios que preguntaste
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {products.map(product => {
                const productPrices = groupedPrices[product.product_id] || []
                const hasVariants = productVariants[product.product_id]?.length > 0
                const isExpanded = expandedProducts[product.product_id]

                return (
                  <div 
                    key={product.product_id}
                    style={{
                      background: '#fafafa',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    {/* Header del producto */}
                    <div 
                      onClick={() => hasVariants && toggleProduct(product.product_id)}
                      style={{
                        padding: '12px 16px',
                        cursor: hasVariants ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'white'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                          {product.product_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Pedido: {product.totals?.qty || 0} {product.totals?.unit || 'kg'}
                          {hasVariants && ` • ${productVariants[product.product_id].length} variantes`}
                        </div>
                      </div>
                      {hasVariants && (
                        <div style={{ 
                          fontSize: '20px', 
                          color: '#666',
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          ▼
                        </div>
                      )}
                    </div>

                    {/* Filas de precio */}
                    <div style={{ display: isExpanded || !hasVariants ? 'block' : 'none' }}>
                      {productPrices.map((priceData) => {
                        const isDefaultRow = !priceData.variant_id

                        return (
                          <div 
                            key={priceData.key}
                            style={{
                              padding: '12px 16px',
                              borderTop: '1px solid #e0e0e0',
                              display: 'grid',
                              gridTemplateColumns: 'auto 100px 70px auto',
                              gap: '8px',
                              alignItems: 'center',
                              background: priceData.variant_id ? '#f5f5f5' : 'white'
                            }}
                          >
                            {/* Variante selector o label */}
                            {hasVariants && !isDefaultRow ? (
                              <select
                                value={priceData.variant_id || ''}
                                onChange={e => {
                                  const variantId = parseInt(e.target.value)
                                  const variant = productVariants[product.product_id]?.find(v => v.id === variantId)
                                  updatePrice(priceData.key, 'variant_id', variantId)
                                  updatePrice(priceData.key, 'variant_label', variant?.label || '')
                                }}
                                style={{
                                  padding: '8px 12px',
                                  border: '1px solid #ddd',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  background: 'white'
                                }}
                              >
                                {productVariants[product.product_id]?.map(v => (
                                  <option key={v.id} value={v.id}>{v.label}</option>
                                ))}
                              </select>
                            ) : (
                              <div style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
                                {priceData.variant_label || 'Sin variante'}
                              </div>
                            )}
                            
                            {/* Input precio */}
                            <input
                              type="number"
                              placeholder="Precio"
                              value={priceData.price || ''}
                              onChange={e => updatePrice(priceData.key, 'price', e.target.value)}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '13px',
                                textAlign: 'right'
                              }}
                              min="0"
                              step="1"
                            />
                            
                            {/* Selector unidad */}
                            <select
                              value={priceData.unit || 'kg'}
                              onChange={e => updatePrice(priceData.key, 'unit', e.target.value)}
                              style={{
                                padding: '8px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '13px',
                                background: 'white'
                              }}
                            >
                              <option value="kg">kg</option>
                              <option value="unit">un</option>
                            </select>

                            {/* Botón eliminar (solo para filas de variantes) */}
                            {!isDefaultRow && (
                              <button
                                onClick={() => removeVariantRow(priceData.key)}
                                style={{
                                  padding: '6px 10px',
                                  background: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {/* Botón agregar variante */}
                      {hasVariants && isExpanded && (
                        <div style={{ padding: '8px 16px', borderTop: '1px solid #e0e0e0' }}>
                          <button
                            onClick={() => addVariantRow(product.product_id)}
                            style={{
                              padding: '8px 16px',
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              width: '100%'
                            }}
                          >
                            + Agregar Variante
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div style={{ 
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: '12px',
          background: '#fafafa'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px',
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: '#333'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedVendor}
            style={{
              flex: 2,
              padding: '14px',
              background: (saving || !selectedVendor) ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (saving || !selectedVendor) ? 'not-allowed' : 'pointer',
              fontSize: '15px',
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
