import { useState, useEffect } from 'react'
import { listCustomers, updateCustomer, deleteCustomer } from '../api/customers'
import '../styles/globals.css'

export default function Clientes() {
  const [customers, setCustomers] = useState([])
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      const data = await listCustomers()
      setCustomers(data)
    } catch(err) {
      console.error('Error cargando clientes:', err)
    }
  }

  async function handleSave() {
    if (!editingCustomer.id || !editingCustomer.name || !editingCustomer.phone) {
      alert('⚠️ Nombre y teléfono son obligatorios')
      return
    }
    
    try {
      await updateCustomer(editingCustomer.id, {
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        rut: editingCustomer.rut || null,
        nickname: editingCustomer.nickname || null,
        preferences: editingCustomer.preferences || null,
        personality: editingCustomer.personality || null,
        address: editingCustomer.address || null,
        email: editingCustomer.email || null
      })
      alert('✓ Cliente actualizado correctamente')
      setEditingCustomer(null)
      await loadCustomers()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo actualizar el cliente'))
    }
  }

  async function handleDelete(customerId) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    
    try {
      await deleteCustomer(customerId)
      alert('✓ Cliente eliminado correctamente')
      await loadCustomers()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo eliminar el cliente'))
    }
  }

  const filteredCustomers = customers.filter(c => 
    !searchTerm || 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.rut?.includes(searchTerm) ||
    c.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'24px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:32, fontWeight:800 }}>👥 Clientes</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Gestiona tus clientes</p>
      </div>

      {/* Búsqueda */}
      <div style={{ marginBottom:24 }}>
        <input
          type="text"
          placeholder="🔍 Buscar cliente..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="input"
          style={{ 
            width:'100%', 
            padding:'14px 20px', 
            borderRadius:16, 
            fontSize:16,
            border:'2px solid #e0e0e0'
          }}
        />
      </div>

      {/* Lista de clientes */}
      <div style={{ display:'grid', gap:16, marginBottom:24 }}>
        {filteredCustomers.map((c, idx) => (
          <div
            key={c.id}
            style={{
              background:'white',
              borderRadius:20,
              padding:24,
              border:'1px solid #e0e0e0',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
              transition:'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>
                  {c.name}
                </div>
                <div style={{ display:'grid', gap:6, fontSize:14, opacity:0.8 }}>
                  {c.nickname && <div><span style={{ fontWeight:600 }}>Apodo:</span> {c.nickname}</div>}
                  {c.phone && <div><span style={{ fontWeight:600 }}>📱:</span> {c.phone}</div>}
                  {c.email && <div><span style={{ fontWeight:600 }}>📧:</span> {c.email}</div>}
                  {c.rut && <div><span style={{ fontWeight:600 }}>RUT:</span> {c.rut}</div>}
                  {c.address && <div><span style={{ fontWeight:600 }}>📍:</span> {c.address}</div>}
                </div>
                {(c.preferences || c.personality) && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f0f0f0' }}>
                    {c.preferences && (
                      <div style={{ fontSize:13, marginBottom:6 }}>
                        <span style={{ fontWeight:600, opacity:0.7 }}>Gustos:</span> {c.preferences}
                      </div>
                    )}
                    {c.personality && (
                      <div style={{ fontSize:13 }}>
                        <span style={{ fontWeight:600, opacity:0.7 }}>Personalidad:</span> {c.personality}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ display:'flex', gap:8, marginLeft:16 }}>
                <button
                  onClick={() => setEditingCustomer(c)}
                  style={{
                    padding:'10px 16px',
                    borderRadius:12,
                    background:'#88C4A8',
                    color:'white',
                    border:'none',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:600,
                    transition:'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background='#5aa073'}
                  onMouseOut={e => e.currentTarget.style.background='#88C4A8'}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    padding:'10px 16px',
                    borderRadius:12,
                    background:'#f44336',
                    color:'white',
                    border:'none',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:600,
                    transition:'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background='#d32f2f'}
                  onMouseOut={e => e.currentTarget.style.background='#f44336'}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div style={{ 
          textAlign:'center', 
          padding:60, 
          background:'white', 
          borderRadius:20,
          border:'2px dashed #e0e0e0'
        }}>
          <div style={{ fontSize:48, marginBottom:16 }}>👤</div>
          <div style={{ fontSize:18, fontWeight:600, opacity:0.7 }}>
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingCustomer && (
        <div className="modal-backdrop" onClick={() => setEditingCustomer(null)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ 
              maxWidth:600, 
              borderRadius:20,
              background:'white',
              padding:0,
              overflow:'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding:'24px', 
              background:'linear-gradient(135deg, #88C4A8 0%, #5aa073 100%)',
              color:'white'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:24, fontWeight:700 }}>
                  ✏️ Editar Cliente
                </h3>
                <button
                  onClick={() => setEditingCustomer(null)}
                  style={{
                    background:'rgba(255,255,255,0.2)',
                    border:'none',
                    borderRadius:'50%',
                    width:36,
                    height:36,
                    color:'white',
                    cursor:'pointer',
                    fontSize:20,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding:'24px', maxHeight:'70vh', overflow:'auto' }}>
              <div style={{ display:'grid', gap:16 }}>
                {/* Nombre y Teléfono */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingCustomer.name || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                      placeholder="Nombre completo"
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingCustomer.phone || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                      placeholder="+56..."
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                </div>

                {/* RUT y Apodo */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      RUT
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingCustomer.rut || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, rut: e.target.value})}
                      placeholder="12.345.678-9"
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      Apodo
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingCustomer.nickname || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, nickname: e.target.value})}
                      placeholder="Apodo"
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                </div>

                {/* Email y Dirección */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={editingCustomer.email || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
                      placeholder="cliente@email.com"
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingCustomer.address || ''}
                      onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})}
                      placeholder="Dirección"
                      style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                    />
                  </div>
                </div>

                {/* Gustos y Personalidad */}
                <div>
                  <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                    Gustos/Preferencias
                  </label>
                  <textarea
                    className="input"
                    value={editingCustomer.preferences || ''}
                    onChange={e => setEditingCustomer({...editingCustomer, preferences: e.target.value})}
                    placeholder="Ej: Le gustan las frutas maduras, no le gustan las bananas..."
                    rows={3}
                    style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15, resize:'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                    Personalidad
                  </label>
                  <textarea
                    className="input"
                    value={editingCustomer.personality || ''}
                    onChange={e => setEditingCustomer({...editingCustomer, personality: e.target.value})}
                    placeholder="Ej: Muy detallista, le gusta hablar mucho..."
                    rows={3}
                    style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15, resize:'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              padding:'20px 24px', 
              borderTop:'1px solid #f0f0f0',
              display:'flex',
              gap:12
            }}>
              <button
                onClick={() => setEditingCustomer(null)}
                style={{
                  flex:1,
                  padding:14,
                  borderRadius:12,
                  background:'#f5f5f5',
                  color:'#666',
                  border:'none',
                  cursor:'pointer',
                  fontSize:15,
                  fontWeight:600
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!editingCustomer.name || !editingCustomer.phone}
                style={{
                  flex:2,
                  padding:14,
                  borderRadius:12,
                  background:(!editingCustomer.name || !editingCustomer.phone) ? '#ccc' : '#88C4A8',
                  color:'white',
                  border:'none',
                  cursor:(!editingCustomer.name || !editingCustomer.phone) ? 'not-allowed' : 'pointer',
                  fontSize:15,
                  fontWeight:700,
                  boxShadow:(!editingCustomer.name || !editingCustomer.phone) ? 'none' : '0 2px 8px rgba(136, 196, 168, 0.3)'
                }}
              >
                ✓ Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

