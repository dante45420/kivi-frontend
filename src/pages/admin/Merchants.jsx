import { useState, useEffect } from 'react'
import { listMerchants, createMerchant, updateMerchant, toggleMerchantStatus, deleteMerchant } from '../../api/adminMerchants'
import '../../styles/globals.css'

export default function Merchants() {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState('create') // 'create' | 'edit'
  const [currentMerchant, setCurrentMerchant] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  
  // Formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    business_name: '',
    contact_name: '',
    phone: '',
    address: '',
    rut: '',
    is_active: true
  })

  useEffect(() => {
    loadMerchants()
  }, [])

  async function loadMerchants() {
    setLoading(true)
    try {
      const data = await listMerchants()
      setMerchants(data)
    } catch (e) {
      alert('Error al cargar comerciantes: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditMode('create')
    setFormData({
      email: '',
      password: '',
      business_name: '',
      contact_name: '',
      phone: '',
      address: '',
      rut: '',
      is_active: true
    })
    setCurrentMerchant(null)
    setModalOpen(true)
  }

  function openEdit(merchant) {
    setEditMode('edit')
    setFormData({
      email: merchant.email,
      password: '',
      business_name: merchant.business_name,
      contact_name: merchant.contact_name || '',
      phone: merchant.phone || '',
      address: merchant.address || '',
      rut: merchant.rut || '',
      is_active: merchant.is_active
    })
    setCurrentMerchant(merchant)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!formData.email || !formData.business_name) {
      alert('Email y nombre del negocio son obligatorios')
      return
    }

    if (editMode === 'create' && !formData.password) {
      alert('La contraseña es obligatoria para crear un comerciante')
      return
    }

    try {
      let result
      if (editMode === 'create') {
        result = await createMerchant(formData)
        // Guardar contraseña temporalmente para mostrarla
        if (result.plain_password) {
          const temp = { ...result }
          setShowPassword(prev => ({ ...prev, [temp.id]: result.plain_password }))
        }
        alert(`✓ Comerciante creado\n\n📧 Email: ${result.email}\n🔑 Contraseña: ${result.plain_password}\n\n¡Guarda esta contraseña!`)
      } else {
        result = await updateMerchant(currentMerchant.id, formData)
        alert('✓ Comerciante actualizado')
      }
      
      setModalOpen(false)
      await loadMerchants()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleToggle(merchant) {
    try {
      await toggleMerchantStatus(merchant.id)
      await loadMerchants()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleDelete(merchant) {
    if (!confirm(`¿Eliminar a ${merchant.business_name}?\nEsta acción no se puede deshacer.`)) return
    
    try {
      await deleteMerchant(merchant.id)
      alert('✓ Comerciante eliminado')
      await loadMerchants()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, opacity: 0.5 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--kivi-text-dark)' }}>
            🏢 Gestión de Comerciantes
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 16 }}>
            Administra clientes B2B y mayoristas
          </p>
        </div>
        <button
          className="button"
          onClick={openCreate}
          style={{ background: 'var(--kivi-green)', fontWeight: 700, padding: '12px 24px' }}
        >
          ➕ Crear Comerciante
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Total Comerciantes</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
            {merchants.length}
          </div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Activos</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#2e7d32' }}>
            {merchants.filter(m => m.is_active).length}
          </div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Inactivos</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#d32f2f' }}>
            {merchants.filter(m => !m.is_active).length}
          </div>
        </div>
      </div>

      {/* Lista de comerciantes */}
      {merchants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#f5f5f5', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No hay comerciantes</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Crea el primero usando el botón de arriba</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--kivi-cream)' }}>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Negocio</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Contacto</th>
                  <th style={thStyle}>Teléfono</th>
                  <th style={thStyle}>RUT</th>
                  <th style={thStyle}>Último Login</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map(merchant => (
                  <tr key={merchant.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: merchant.is_active ? '#e8f5e9' : '#ffebee',
                        color: merchant.is_active ? '#2e7d32' : '#d32f2f'
                      }}>
                        {merchant.is_active ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{merchant.business_name}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>ID: {merchant.id}</div>
                    </td>
                    <td style={tdStyle}>{merchant.email}</td>
                    <td style={tdStyle}>{merchant.contact_name || '-'}</td>
                    <td style={tdStyle}>{merchant.phone || '-'}</td>
                    <td style={tdStyle}>{merchant.rut || '-'}</td>
                    <td style={tdStyle}>
                      {merchant.last_login ? new Date(merchant.last_login).toLocaleDateString('es-CL') : 'Nunca'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openEdit(merchant)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--kivi-green)',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleToggle(merchant)}
                          style={{
                            padding: '6px 12px',
                            background: merchant.is_active ? '#ff9800' : '#4caf50',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#fff'
                          }}
                        >
                          {merchant.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(merchant)}
                          style={{
                            padding: '6px 12px',
                            background: '#d32f2f',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#fff'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 600, borderRadius: 20, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h3 style={{ margin: '0 0 24px 0', fontSize: 22, fontWeight: 700 }}>
              {editMode === 'create' ? '➕ Crear Comerciante' : '✏️ Editar Comerciante'}
            </h3>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Email * (para login)
                </label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={e => setFormData(v => ({ ...v, email: e.target.value }))}
                  placeholder="comerciante@ejemplo.com"
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Contraseña {editMode === 'create' ? '*' : '(dejar vacío para mantener actual)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.password}
                  onChange={e => setFormData(v => ({ ...v, password: e.target.value }))}
                  placeholder={editMode === 'create' ? 'Mínimo 4 caracteres' : 'Nueva contraseña...'}
                  style={{ width: '100%', padding: '12px 14px' }}
                />
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  ⚠️ Esta contraseña será visible solo una vez
                </div>
              </div>

              {/* Nombre del Negocio */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.business_name}
                  onChange={e => setFormData(v => ({ ...v, business_name: e.target.value }))}
                  placeholder="Ej: Distribuidora Central"
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              </div>

              {/* Nombre de Contacto */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.contact_name}
                  onChange={e => setFormData(v => ({ ...v, contact_name: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={e => setFormData(v => ({ ...v, phone: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              </div>

              {/* RUT */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  RUT
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.rut}
                  onChange={e => setFormData(v => ({ ...v, rut: e.target.value }))}
                  placeholder="12.345.678-9"
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              </div>

              {/* Dirección */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Dirección
                </label>
                <textarea
                  className="input"
                  value={formData.address}
                  onChange={e => setFormData(v => ({ ...v, address: e.target.value }))}
                  placeholder="Dirección completa..."
                  rows={2}
                  style={{ width: '100%', padding: '12px 14px', resize: 'vertical' }}
                />
              </div>

              {/* Estado */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(v => ({ ...v, is_active: e.target.checked }))}
                    style={{ width: 20, height: 20 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    Cuenta activa (puede iniciar sesión)
                  </span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                className="button"
                onClick={handleSave}
                style={{ flex: 1, background: 'var(--kivi-green)', fontWeight: 700, padding: '14px' }}
              >
                {editMode === 'create' ? '✓ Crear' : '💾 Guardar'}
              </button>
              <button
                className="button"
                onClick={() => setModalOpen(false)}
                style={{ flex: 1, background: '#ddd', fontWeight: 700, padding: '14px' }}
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
  padding: '14px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--kivi-text)',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '14px 12px',
  fontSize: 14,
  color: 'var(--kivi-text-dark)'
}

