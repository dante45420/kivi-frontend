import { useState, useEffect } from 'react'
import { listVariants } from '../api/variants'
import { batchUpdateVendorPrices } from '../api/adminVendors'
import '../styles/globals.css'

export default function AnotarPrecioModal({ open, onClose, product, vendorId, vendorName, onSuccess }) {
  const [variants, setVariants] = useState([])
  const [prices, setPrices] = useState({
    base: { price: '', unit: product?.default_unit || 'kg' },
    variants: {}
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && product) {
      loadVariants()
      setPrices({
        base: { price: '', unit: product.default_unit || 'kg' },
        variants: {}
      })
    }
  }, [open, product])

  async function loadVariants() {
    if (!product?.product_id) return
    try {
      const data = await listVariants(product.product_id)
      setVariants(data || [])
    } catch (e) {
      console.error('Error loading variants:', e)
      setVariants([])
    }
  }

  async function handleSave() {
    console.log('🔍 [1] handleSave iniciado')
    console.log('🔍 [2] vendorId:', vendorId, '| tipo:', typeof vendorId)
    console.log('🔍 [3] product:', product)
    console.log('🔍 [4] prices.base:', prices.base)
    console.log('🔍 [5] prices.variants:', prices.variants)
    
    if (!vendorId || vendorId === '') {
      alert('⚠️ Debes seleccionar un proveedor en el dropdown de abajo primero')
      return
    }

    const pricesArray = []
    
    // Verificar si hay variantes con precios
    const variantPrices = []
    if (prices.variants && typeof prices.variants === 'object') {
      Object.entries(prices.variants).forEach(([variantId, variantData]) => {
        console.log(`🔍 [6] Procesando variante ${variantId}:`, variantData)
        if (variantData && variantData.price && parseFloat(variantData.price) > 0) {
          variantPrices.push({
            product_id: product.product_id,
            variant_id: parseInt(variantId),
            base_price: parseFloat(variantData.price),
            unit: variantData.unit || prices.base.unit || 'kg',
            markup_percentage: 20,
            min_qty: 1.0
          })
        }
      })
    }

    console.log('🔍 [7] variantPrices construido:', variantPrices)

    // Si hay precios de variantes, usar solo esos
    if (variantPrices.length > 0) {
      pricesArray.push(...variantPrices)
    } 
    // Si no hay variantes con precio, usar el precio base
    else if (prices.base && prices.base.price && parseFloat(prices.base.price) > 0) {
      pricesArray.push({
        product_id: product.product_id,
        variant_id: null,
        base_price: parseFloat(prices.base.price),
        unit: prices.base.unit || 'kg',
        markup_percentage: 20,
        min_qty: 1.0
      })
    }

    console.log('🔍 [8] pricesArray FINAL:', pricesArray)
    console.log('🔍 [9] pricesArray.length:', pricesArray.length)

    if (pricesArray.length === 0) {
      alert('⚠️ Debes ingresar al menos un precio')
      return
    }

    setSaving(true)
    try {
      const vendorIdInt = parseInt(vendorId)
      console.log('🔍 [10] vendorIdInt:', vendorIdInt)
      
      if (isNaN(vendorIdInt)) {
        throw new Error('ID de proveedor inválido')
      }
      
      console.log('🔍 [11] Llamando a batchUpdateVendorPrices con:', {
        vendorIdInt,
        pricesArray
      })
      
      const result = await batchUpdateVendorPrices(vendorIdInt, pricesArray)
      console.log('🔍 [12] Respuesta exitosa:', result)
      
      alert(`✓ Precio${pricesArray.length > 1 ? 's' : ''} guardado${pricesArray.length > 1 ? 's' : ''}`)
      onSuccess?.()
      onClose()
    } catch (e) {
      console.error('❌ [ERROR COMPLETO]:', e)
      console.error('❌ [ERROR MESSAGE]:', e.message)
      console.error('❌ [ERROR STACK]:', e.stack)
      alert('❌ Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function updateBasePrice(field, value) {
    setPrices(prev => ({
      ...prev,
      base: { ...prev.base, [field]: value }
    }))
  }

  function updateVariantPrice(variantId, field, value) {
    setPrices(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        [variantId]: {
          ...prev.variants[variantId],
          [field]: value
        }
      }
    }))
  }

  if (!open || !product) return null

  const hasVariants = variants.length > 0

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px 20px',
          background: 'linear-gradient(135deg, #88C4A8 0%, #6FA891 100%)',
          color: 'white'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            {product.product_name}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            📍 {vendorName}
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '20px'
        }}>
          {/* Precio base */}
          <div style={{ marginBottom: hasVariants ? '24px' : '0' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#666',
              marginBottom: '12px'
            }}>
              Precio {hasVariants ? 'base' : ''}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  $
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={prices.base.price}
                  onChange={e => updateBasePrice('price', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 28px',
                    border: '2px solid #E0E0E0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#88C4A8'}
                  onBlur={e => e.target.style.borderColor = '#E0E0E0'}
                />
              </div>
              <select
                value={prices.base.unit}
                onChange={e => updateBasePrice('unit', e.target.value)}
                style={{
                  padding: '14px 12px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="kg">kg</option>
                <option value="unit">un</option>
              </select>
            </div>
          </div>

          {/* Variantes */}
          {hasVariants && (
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#666',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📦 Variantes</span>
                <span style={{ 
                  fontSize: '11px',
                  background: '#88C4A8',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>
                  {variants.length}
                </span>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {variants.map(variant => (
                  <div key={variant.id}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: '#88C4A8',
                      marginBottom: '8px'
                    }}>
                      {variant.label}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#999',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          value={prices.variants[variant.id]?.price || ''}
                          onChange={e => updateVariantPrice(variant.id, 'price', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 26px',
                            border: '2px solid #E0E0E0',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'border 0.2s'
                          }}
                          onFocus={e => e.target.style.borderColor = '#88C4A8'}
                          onBlur={e => e.target.style.borderColor = '#E0E0E0'}
                        />
                      </div>
                      <select
                        value={prices.variants[variant.id]?.unit || prices.base.unit}
                        onChange={e => updateVariantPrice(variant.id, 'unit', e.target.value)}
                        style={{
                          padding: '12px 10px',
                          border: '2px solid #E0E0E0',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: 'white',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="kg">kg</option>
                        <option value="unit">un</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 20px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: '14px',
              background: saving ? '#ccc' : 'linear-gradient(135deg, #88C4A8 0%, #6FA891 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(136, 196, 168, 0.3)'
            }}
          >
            {saving ? 'Guardando...' : '✓ Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

