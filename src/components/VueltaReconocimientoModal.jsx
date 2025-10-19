import { useState, useEffect } from 'react'
import { listVendors, createVendor } from '../api/vendors'
import { batchUpdateVendorPrices } from '../api/adminVendors'
import '../styles/globals.css'

export default function VueltaReconocimientoModal({ open, onClose, products, onSuccess }) {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [prices, setPrices] = useState({}) // {product_id: {price, unit}}
  const [saving, setSaving] = useState(false)
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')

  useEffect(() => {
    if (open) {
      loadVendors()
      // Inicializar precios con valores vacíos
      const initialPrices = {}
      products.forEach(p => {
        initialPrices[p.product_id] = {
          price: '',
          unit: p.default_unit || 'kg'
        }
      })
      setPrices(initialPrices)
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

  async function handleCreateVendor() {
    if (!newVendorName.trim()) return
    try {
      await createVendor({ name: newVendorName.trim(), notes: '' })
      await loadVendors()
      setNewVendorName('')
      setShowNewVendor(false)
      alert('✓ Proveedor creado')
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
    const pricesArray = Object.entries(prices)
      .filter(([_, data]) => data.price && parseFloat(data.price) > 0)
      .map(([product_id, data]) => ({
        product_id: parseInt(product_id),
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
      alert(`✓ Éxito: ${result.created_count} creados, ${result.updated_count} actualizados`)
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

  if (!open) return null

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 2000 }}
    >
      <div 
        className="modal"
        style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 800 }}>
          🚶 Vuelta de Reconocimiento
        </h2>
        
        <p style={{ marginBottom: 24, color: 'var(--kivi-text)', lineHeight: 1.6 }}>
          Registra rápidamente los precios que te dijeron los proveedores. Solo ingresa los precios de los productos que preguntaste.
        </p>

        {/* Selección de proveedor */}
        <div style={{ marginBottom: 24, padding: 20, background: 'var(--kivi-cream)', borderRadius: 16 }}>
          <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
            Proveedor *
          </label>
          
          {!showNewVendor ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                value={selectedVendor}
                onChange={e => setSelectedVendor(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600
                }}
              >
                <option value="">Seleccionar proveedor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewVendor(true)}
                style={{
                  padding: '12px 20px',
                  background: 'var(--kivi-green)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                + Nuevo
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                type="text"
                value={newVendorName}
                onChange={e => setNewVendorName(e.target.value)}
                placeholder="Nombre del proveedor"
                style={{
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 12,
                  fontSize: 15
                }}
                onKeyPress={e => e.key === 'Enter' && handleCreateVendor()}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleCreateVendor}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--kivi-green)',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Crear
                </button>
                <button
                  onClick={() => { setShowNewVendor(false); setNewVendorName('') }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#ddd',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de productos */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>
            Productos del pedido ({products.length})
          </h3>
          
          <div style={{ display: 'grid', gap: 12, maxHeight: 400, overflowY: 'auto', padding: '0 4px' }}>
            {products.map(product => (
              <div 
                key={product.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: 16,
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 12
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {product.product_name}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
                    Pedido: {product.totals?.qty || 0} {product.totals?.unit || 'kg'}
                  </div>
                </div>
                
                <input
                  type="number"
                  placeholder="Precio"
                  value={prices[product.product_id]?.price || ''}
                  onChange={e => updatePrice(product.product_id, 'price', e.target.value)}
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    textAlign: 'right'
                  }}
                  min="0"
                  step="1"
                />
                
                <span style={{ fontSize: 14, opacity: 0.7 }}>$</span>
                
                <select
                  value={prices[product.product_id]?.unit || 'kg'}
                  onChange={e => updatePrice(product.product_id, 'unit', e.target.value)}
                  style={{
                    width: 80,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                >
                  <option value="kg">/ kg</option>
                  <option value="unit">/ un</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving || !selectedVendor}
            style={{
              flex: 1,
              padding: '14px',
              background: (saving || !selectedVendor) ? '#ccc' : 'var(--kivi-green)',
              border: 'none',
              borderRadius: 12,
              cursor: (saving || !selectedVendor) ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 700,
              color: (saving || !selectedVendor) ? '#666' : '#000'
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar Todos los Precios'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '14px 24px',
              background: '#ddd',
              border: 'none',
              borderRadius: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 700
            }}
          >
            Cancelar
          </button>
        </div>

        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#e3f2fd', 
          borderRadius: 8,
          fontSize: 13,
          color: '#1976d2'
        }}>
          💡 <strong>Tip:</strong> Solo ingresa precios para los productos que preguntaste. Los demás puedes dejarlos vacíos.
        </div>
      </div>
    </div>
  )
}

