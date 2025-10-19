import { useState, useEffect } from 'react'
import { listVendorPrices, createVendorPrice, updateVendorPrice, deleteVendorPrice, toggleVendorPriceAvailability } from '../../api/adminVendors'
import { listVendors, createVendor } from '../../api/vendors'
import { listProducts } from '../../api/products'
import { listVariants } from '../../api/variants'
import '../../styles/globals.css'

export default function Proveedores() {
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  
  // Filtros
  const [filterVendor, setFilterVendor] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterAvailable, setFilterAvailable] = useState(false)
  
  // Modal de edición
  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState('create') // 'create' | 'edit'
  const [editValues, setEditValues] = useState({})
  const [variants, setVariants] = useState([])
  
  // Modal crear proveedor
  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorNotes, setNewVendorNotes] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const params = {}
      if (filterVendor) params.vendor_id = filterVendor
      if (filterProduct) params.product_id = filterProduct
      if (filterAvailable) params.available_only = true
      
      const [pricesData, vendorsData, productsData] = await Promise.all([
        listVendorPrices(params),
        listVendors(),
        listProducts()
      ])
      
      setPrices(pricesData)
      setVendors(vendorsData)
      setProducts(productsData)
    } catch (e) {
      alert('Error al cargar datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleToggle(priceId) {
    try {
      await toggleVendorPriceAvailability(priceId)
      await loadData()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleDelete(priceId) {
    if (!confirm('¿Eliminar este precio?')) return
    try {
      await deleteVendorPrice(priceId)
      await loadData()
      alert('✓ Precio eliminado')
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  function openCreate() {
    setEditMode('create')
    setEditValues({
      vendor_id: '',
      product_id: '',
      variant_id: null,
      price_per_kg: '',
      price_per_unit: '',
      unit: 'kg',
      markup_percentage: 20,
      final_price: '',
      is_available: true
    })
    setVariants([])
    setEditOpen(true)
  }

  function openEdit(price) {
    setEditMode('edit')
    setEditValues({
      id: price.id,
      vendor_id: price.vendor_id,
      product_id: price.product_id,
      variant_id: price.variant_id,
      price_per_kg: price.price_per_kg || '',
      price_per_unit: price.price_per_unit || '',
      unit: price.unit,
      markup_percentage: price.markup_percentage || 0,
      final_price: price.final_price,
      is_available: price.is_available
    })
    if (price.product_id) {
      listVariants(price.product_id).then(v => setVariants(v)).catch(() => {})
    }
    setEditOpen(true)
  }

  async function handleProductChange(productId) {
    setEditValues(v => ({ ...v, product_id: productId, variant_id: null }))
    if (productId) {
      try {
        const v = await listVariants(productId)
        setVariants(v)
      } catch (e) {
        setVariants([])
      }
    } else {
      setVariants([])
    }
  }

  async function handleSave() {
    try {
      // El backend espera 'cost_price' que es el precio base
      const costPrice = editValues.unit === 'kg' 
        ? parseFloat(editValues.price_per_kg || 0) 
        : parseFloat(editValues.price_per_unit || 0)

      if (!costPrice || costPrice <= 0) {
        alert('Debes ingresar un precio mayor a 0')
        return
      }

      const payload = {
        product_id: parseInt(editValues.product_id),
        variant_id: editValues.variant_id ? parseInt(editValues.variant_id) : null,
        unit: editValues.unit,
        cost_price: costPrice,
        markup_percentage: parseFloat(editValues.markup_percentage || 0),
        is_available: editValues.is_available
      }
      
      if (editMode === 'create') {
        await createVendorPrice(parseInt(editValues.vendor_id), payload)
        alert('✓ Precio creado')
      } else {
        await updateVendorPrice(editValues.id, payload)
        alert('✓ Precio actualizado')
      }
      
      setEditOpen(false)
      await loadData()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleCreateVendor() {
    if (!newVendorName.trim()) {
      alert('El nombre del proveedor es obligatorio')
      return
    }
    try {
      await createVendor({
        name: newVendorName.trim(),
        notes: newVendorNotes.trim() || ''
      })
      alert('✓ Proveedor creado correctamente')
      setVendorModalOpen(false)
      setNewVendorName('')
      setNewVendorNotes('')
      await loadData()
    } catch (e) {
      alert('Error al crear proveedor: ' + e.message)
    }
  }

  // Calcular precio final automáticamente
  useEffect(() => {
    if (editOpen) {
      const basePrice = editValues.unit === 'kg' 
        ? parseFloat(editValues.price_per_kg || 0) 
        : parseFloat(editValues.price_per_unit || 0)
      const markup = parseFloat(editValues.markup_percentage || 0)
      const finalPrice = basePrice * (1 + markup / 100)
      setEditValues(v => ({ ...v, final_price: finalPrice.toFixed(0) }))
    }
  }, [editValues.price_per_kg, editValues.price_per_unit, editValues.markup_percentage, editValues.unit])

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--kivi-text)', opacity: 0.6 }}>
          Cargando proveedores...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--kivi-text-dark)' }}>
            Gestión de Proveedores
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 16 }}>
            Precios y disponibilidad para comerciantes B2B
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="button"
            onClick={() => setVendorModalOpen(true)}
            style={{ background: '#2196f3', color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Crear Proveedor
          </button>
          <button
            className="button"
            onClick={openCreate}
            style={{ background: '#4caf50', color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Agregar Precio
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 20, 
        marginBottom: 28,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Filtros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Proveedor
            </label>
            <select
              className="input"
              value={filterVendor}
              onChange={e => setFilterVendor(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todos</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Producto
            </label>
            <select
              className="input"
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterAvailable}
                onChange={e => setFilterAvailable(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Solo disponibles
              </span>
            </label>
          </div>
        </div>
        
        <button
          className="button"
          onClick={loadData}
          style={{ marginTop: 16, background: '#4caf50', color: 'white', fontWeight: 600 }}
        >
          Aplicar Filtros
        </button>
      </div>

      {/* Tabla de Precios */}
      <div style={{ 
        background: 'white', 
        borderRadius: 20, 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {prices.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', opacity: 0.5 }}>
            No hay precios que coincidan con los filtros
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--kivi-cream)' }}>
                  <th style={thStyle}>Proveedor</th>
                  <th style={thStyle}>Producto</th>
                  <th style={thStyle}>Variante</th>
                  <th style={thStyle}>Precio Base</th>
                  <th style={thStyle}>Margen</th>
                  <th style={thStyle}>Precio Final</th>
                  <th style={thStyle}>Unidad</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Fuente</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, idx) => {
                  const basePrice = price.unit === 'kg' ? price.price_per_kg : price.price_per_unit
                  return (
                    <tr 
                      key={price.id}
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        background: idx % 2 === 0 ? 'white' : '#fafafa'
                      }}
                    >
                      <td style={tdStyle}>{price.vendor_name}</td>
                      <td style={tdStyle}>
                        <strong>{price.product_name}</strong>
                      </td>
                      <td style={tdStyle}>
                        {price.variant_label || '-'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700 }}>
                          ${basePrice?.toLocaleString('es-CL')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--kivi-green-dark)', fontWeight: 600 }}>
                          +{price.markup_percentage}%
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                          ${price.final_price?.toLocaleString('es-CL')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#f0f0f0', 
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {price.unit === 'kg' ? 'kg' : 'unidad'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleToggle(price.id)}
                          style={{
                            padding: '6px 12px',
                            background: price.is_available ? 'var(--kivi-green-soft)' : '#ffcccc',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            color: price.is_available ? 'var(--kivi-green-dark)' : '#c62828',
                            transition: 'all 0.2s'
                          }}
                        >
                          {price.is_available ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          fontSize: 11, 
                          opacity: 0.6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {price.source === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => openEdit(price)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--kivi-blue-soft)',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(price.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ffcccc',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#c62828'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {editOpen && (
        <div 
          className="modal-backdrop"
          onClick={() => setEditOpen(false)}
        >
          <div 
            className="modal"
            style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 24px 0', fontSize: 22, fontWeight: 800 }}>
              {editMode === 'create' ? '➕ Agregar Precio' : '✏️ Editar Precio'}
            </h2>
            
            <div style={{ display: 'grid', gap: 16 }}>
              {editMode === 'create' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    Proveedor *
                  </label>
                  <select
                    className="input"
                    value={editValues.vendor_id}
                    onChange={e => setEditValues(v => ({ ...v, vendor_id: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">Seleccionar...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Producto *
                </label>
                <select
                  className="input"
                  value={editValues.product_id}
                  onChange={e => handleProductChange(e.target.value)}
                  disabled={editMode === 'edit'}
                  style={{ width: '100%' }}
                >
                  <option value="">Seleccionar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              {variants.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    Variante (opcional)
                  </label>
                  <select
                    className="input"
                    value={editValues.variant_id || ''}
                    onChange={e => setEditValues(v => ({ ...v, variant_id: e.target.value || null }))}
                    disabled={editMode === 'edit'}
                    style={{ width: '100%' }}
                  >
                    <option value="">Sin variante</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Unidad *
                </label>
                <select
                  className="input"
                  value={editValues.unit}
                  onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="unit">Unidad</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Precio Base (costo del proveedor) *
                </label>
                <input
                  type="number"
                  className="input"
                  value={editValues.unit === 'kg' ? editValues.price_per_kg : editValues.price_per_unit}
                  onChange={e => {
                    if (editValues.unit === 'kg') {
                      setEditValues(v => ({ ...v, price_per_kg: e.target.value }))
                    } else {
                      setEditValues(v => ({ ...v, price_per_unit: e.target.value }))
                    }
                  }}
                  placeholder="$0"
                  style={{ width: '100%' }}
                  min="0"
                  step="1"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Margen de ganancia (%) *
                </label>
                <input
                  type="number"
                  className="input"
                  value={editValues.markup_percentage}
                  onChange={e => setEditValues(v => ({ ...v, markup_percentage: e.target.value }))}
                  placeholder="20"
                  style={{ width: '100%' }}
                  min="0"
                  step="1"
                />
              </div>
              
              <div style={{ 
                background: 'var(--kivi-cream)', 
                padding: 16, 
                borderRadius: 12,
                border: '2px solid var(--kivi-green-soft)'
              }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  💰 Precio Final (comerciante paga)
                </label>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                  ${editValues.final_price ? parseFloat(editValues.final_price).toLocaleString('es-CL') : 0}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editValues.is_available}
                    onChange={e => setEditValues(v => ({ ...v, is_available: e.target.checked }))}
                    style={{ width: 20, height: 20 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    Disponible para comerciantes
                  </span>
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                className="button"
                onClick={handleSave}
                style={{ flex: 1, background: 'var(--kivi-green)', fontWeight: 600 }}
              >
                💾 Guardar
              </button>
              <button
                className="button"
                onClick={() => setEditOpen(false)}
                style={{ flex: 1, background: '#ddd', fontWeight: 600 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Proveedor */}
      {vendorModalOpen && (
        <div className="modal-backdrop" onClick={() => setVendorModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700, color: 'var(--kivi-text-dark)' }}>
              🏢 Crear Nuevo Proveedor
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Nombre del Proveedor *
              </label>
              <input
                type="text"
                className="input"
                value={newVendorName}
                onChange={e => setNewVendorName(e.target.value)}
                placeholder="Ej: Proveedor Central"
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Notas (opcional)
              </label>
              <textarea
                className="input"
                value={newVendorNotes}
                onChange={e => setNewVendorNotes(e.target.value)}
                placeholder="Información adicional del proveedor..."
                rows={3}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="button"
                onClick={handleCreateVendor}
                style={{ flex: 1, background: 'var(--kivi-green)', fontWeight: 600 }}
              >
                ✓ Crear Proveedor
              </button>
              <button
                className="button"
                onClick={() => {
                  setVendorModalOpen(false)
                  setNewVendorName('')
                  setNewVendorNotes('')
                }}
                style={{ flex: 1, background: '#ddd', fontWeight: 600 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = {
  padding: '16px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--kivi-text)',
  borderBottom: '2px solid var(--kivi-green-soft)'
}

const tdStyle = {
  padding: '14px 12px',
  fontSize: 14,
  color: 'var(--kivi-text-dark)'
}

