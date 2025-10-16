import { useState } from 'react'
import { apiFetch } from '../api/client'
import '../styles/globals.css'

const toCLP = (n) => {
  const x = Number((n || '0').toString().replace(/[^0-9.-]/g, ''))
  return `$${x.toLocaleString('es-CL')}`
}

export default function PurchaseEditModal({ purchase, onClose, onSaved }) {
  const [editing, setEditing] = useState({
    qty_kg: purchase.qty_kg || 0,
    qty_unit: purchase.qty_unit || 0,
    charged_unit: purchase.charged_unit || 'kg'
  })
  const [loading, setLoading] = useState(false)

  async function handleUpdateQuantity() {
    setLoading(true)
    try {
      await apiFetch(`/purchases/${purchase.id}/quantity`, {
        method: 'PATCH',
        body: {
          qty_kg: parseFloat(editing.qty_kg) || 0,
          qty_unit: parseFloat(editing.qty_unit) || 0
        }
      })
      alert('Cantidad actualizada correctamente')
      onSaved()
      onClose()
    } catch (err) {
      alert('Error al actualizar cantidad: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateChargedUnit() {
    setLoading(true)
    try {
      await apiFetch(`/purchases/${purchase.id}/charged_unit`, {
        method: 'PATCH',
        body: {
          charged_unit: editing.charged_unit
        }
      })
      alert('Unidad de cobro actualizada correctamente')
      onSaved()
      onClose()
    } catch (err) {
      alert('Error al actualizar unidad: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta compra?')) return
    
    setLoading(true)
    try {
      await apiFetch(`/purchases/${purchase.id}`, {
        method: 'DELETE'
      })
      alert('Compra eliminada correctamente')
      onSaved()
      onClose()
    } catch (err) {
      alert('Error al eliminar compra: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{ zIndex: 2000 }}
    >
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 800 }}>
          Editar Compra
        </h3>

        {/* Info de la compra */}
        <div style={{ 
          background: 'var(--kivi-cream)', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 20,
          fontSize: 14
        }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Proveedor:</strong> {purchase.vendor || 'No especificado'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Precio total:</strong> {toCLP(purchase.price_total)}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Precio por unidad:</strong> {toCLP(purchase.price_per_unit)} / {purchase.charged_unit}
          </div>
          {purchase.notes && (
            <div>
              <strong>Notas:</strong> {purchase.notes}
            </div>
          )}
        </div>

        {/* Editar cantidades */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Cantidades
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, opacity: 0.7 }}>
                Cantidad (kg)
              </label>
              <input 
                className="input"
                type="number"
                step="0.01"
                value={editing.qty_kg}
                onChange={e => setEditing({ ...editing, qty_kg: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, opacity: 0.7 }}>
                Cantidad (unidades)
              </label>
              <input 
                className="input"
                type="number"
                step="1"
                value={editing.qty_unit}
                onChange={e => setEditing({ ...editing, qty_unit: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10 }}
              />
            </div>
          </div>
          <button
            className="button"
            onClick={handleUpdateQuantity}
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: 12, 
              padding: '10px', 
              borderRadius: 10,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Guardando...' : 'Actualizar Cantidades'}
          </button>
        </div>

        {/* Editar unidad de cobro */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Unidad de Cobro
          </h4>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button
              onClick={() => setEditing({ ...editing, charged_unit: 'kg' })}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: 'var(--radius-pill)',
                border: `2px solid ${editing.charged_unit === 'kg' ? 'var(--kivi-green)' : '#ddd'}`,
                background: editing.charged_unit === 'kg' ? 'var(--kivi-green)' : 'white',
                color: editing.charged_unit === 'kg' ? 'white' : 'var(--kivi-text)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Kilogramos
            </button>
            <button
              onClick={() => setEditing({ ...editing, charged_unit: 'unit' })}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: 'var(--radius-pill)',
                border: `2px solid ${editing.charged_unit === 'unit' ? 'var(--kivi-green)' : '#ddd'}`,
                background: editing.charged_unit === 'unit' ? 'var(--kivi-green)' : 'white',
                color: editing.charged_unit === 'unit' ? 'white' : 'var(--kivi-text)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Unidades
            </button>
          </div>
          {editing.charged_unit !== purchase.charged_unit && (
            <button
              className="button secondary"
              onClick={handleUpdateChargedUnit}
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: 10,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Guardando...' : 'Cambiar Unidad de Cobro'}
            </button>
          )}
        </div>

        {/* Eliminar compra */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: '#f44336',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.background = '#d32f2f')}
            onMouseOut={e => !loading && (e.currentTarget.style.background = '#f44336')}
          >
            🗑️ Eliminar Compra
          </button>
        </div>

        {/* Botón cerrar */}
        <button
          className="button ghost"
          onClick={onClose}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: 10,
            opacity: loading ? 0.6 : 1
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

