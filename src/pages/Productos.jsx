import { useEffect, useState } from 'react'
import { listProducts, createProduct, updateProduct } from '../api/products'
import { listVariants, createVariant, updateVariant, deleteVariant, listVariantTiers, createVariantTier } from '../api/variants'
import QualityModal from '../components/QualityModal'
import '../styles/globals.css'

export default function Productos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editValues, setEditValues] = useState({ id: null, name: '', default_unit: 'kg', category:'', purchase_type:'detalle', sale_price:'', quality_notes: '', quality_photo_url: '' })
  const [editVariants, setEditVariants] = useState([])
  const [editTiers, setEditTiers] = useState([])
  const [editingVariantId, setEditingVariantId] = useState(null)
  const [editingVariant, setEditingVariant] = useState({ label:'', active:true, min_qty:'', sale_price:'' })
  const [newVariant, setNewVariant] = useState({ label:'', min_qty:'', sale_price:'' })
  const [newName, setNewName] = useState('')
  const [newSale, setNewSale] = useState('')
  const [expandedNames, setExpandedNames] = useState({})

  async function load() { setLoading(true); try { setItems(await listProducts()) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    const name = newName.trim()
    const sale = parseFloat(newSale)
    if (!name) return
    if (!newSale || isNaN(sale) || sale <= 0) { alert('Precio de venta requerido (>0)'); return }
    await createProduct({ name, default_unit: 'kg', sale_price: sale })
    setNewName(''); setNewSale(''); load()
  }

  async function openEdit(p) { 
    const currentPrice = (p.catalog && p.catalog[0]) ? p.catalog[0].sale_price : ''
    setEditValues({ 
      id: p.id, 
      name: p.name,
      default_unit: p.default_unit || 'kg',
      category: p.category || '',
      purchase_type: p.purchase_type || 'detalle',
      sale_price: currentPrice, 
      quality_notes: p.quality_notes || '', 
      quality_photo_url: p.quality_photo_url || '' 
    })
    setEditOpen(true)
    setEditingVariantId(null)
    setEditingVariant({ label:'', active:true, min_qty:'', sale_price:'' })
    setNewVariant({ label:'', min_qty:'', sale_price:'' })
    try{ 
      setEditVariants(await listVariants(p.id))
      setEditTiers(await listVariantTiers(p.id))
    }catch{} 
  }
  
  async function saveBasic() {
    const payload = { 
      default_unit: editValues.default_unit,
      category: editValues.category || null,
      purchase_type: editValues.purchase_type || 'detalle',
      quality_notes: editValues.quality_notes, 
      quality_photo_url: editValues.quality_photo_url 
    }
    const clean = String(editValues.sale_price||'').replace(/[^0-9.]/g,'')
    if(clean) payload.sale_price = Number(clean)
    await updateProduct(editValues.id, payload)
    setEditValues(v=>({ ...v, sale_price: clean }))
    await load()
  }

  return (
    <div className="center">
      <h2 style={{ marginTop: 8 }}>Productos</h2>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap:'wrap' }}>
        <input className="input" placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} style={{ maxWidth: 260 }} />
        <input className="input" placeholder="Precio venta inicial" value={newSale} onChange={e => setNewSale(e.target.value)} style={{ maxWidth: 200 }} />
        <button className="button" onClick={handleCreate}>Agregar</button>
      </div>

      {loading ? 'Cargando...' : (
        <div className="card">
          <div className="table">
            <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1.2fr 0.6fr' }}>
              <div className="th">Producto</div>
              <div className="th">Precio/Unidad</div>
              <div className="th">Acción</div>
            </div>
            {items.map(p => (
              <div key={p.id} className="table-row" style={{ gridTemplateColumns: '1.5fr 1.2fr 0.6fr' }}>
                <div className="td">
                  <span
                    title={p.name}
                    onClick={() => setExpandedNames(v => ({ ...v, [p.id]: !v[p.id] }))}
                    style={expandedNames[p.id] ? { cursor:'pointer' } : { cursor:'pointer', display:'inline-block', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  >{p.name}</span>
                </div>
                <div className="td" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div>{/* Precio default + unidad */}
                    {(() => { try{ const c = (p.catalog||[])[0]; return c? `$${Number(c.sale_price||0).toLocaleString('es-CL')} / ${c.unit||p.default_unit||'kg'}` : `- / ${p.default_unit||'kg'}` }catch{return `${p.default_unit||'kg'}` } })()}
                  </div>
                </div>
                <div className="td" style={{ padding: '10px 16px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button className="button" onClick={() => openEdit(p)}>Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:'95%', width:480, maxHeight:'95vh', overflow:'auto' }}>
            <h3 style={{ margin:'0 0 16px 0', textAlign:'center' }}>{editValues.name}</h3>
            
            {/* BÁSICO */}
            <div className="card" style={{ padding:16, marginBottom:12 }}>
              <h4 style={{ margin:'0 0 12px 0', fontSize:16 }}>⚙️ Configuración Básica</h4>
              
              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Unidad de cobro</span>
                <select className="input" value={editValues.default_unit} onChange={e => setEditValues(v => ({ ...v, default_unit: e.target.value }))} style={{ width:'100%' }}>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="unit">Unidad (unit)</option>
                </select>
              </label>

              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Categoría</span>
                <select className="input" value={editValues.category} onChange={e => setEditValues(v => ({ ...v, category: e.target.value }))} style={{ width:'100%' }}>
                  <option value="">Sin categoría</option>
                  <option value="fruta">🍎 Fruta</option>
                  <option value="verdura">🥬 Verdura</option>
                </select>
              </label>

              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Tipo de compra</span>
                <select className="input" value={editValues.purchase_type} onChange={e => setEditValues(v => ({ ...v, purchase_type: e.target.value }))} style={{ width:'100%' }}>
                  <option value="detalle">🛒 Al detalle (suelto)</option>
                  <option value="cajon">📦 Por cajón</option>
                </select>
              </label>

              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Precio por {editValues.default_unit === 'kg' ? 'kg' : 'unidad'}</span>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="$0" 
                  value={editValues.sale_price} 
                  onChange={e=> setEditValues(v=>({ ...v, sale_price:e.target.value }))} 
                  style={{ width:'100%' }}
                />
              </label>

              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Imagen (URL)</span>
                <input className="input" value={editValues.quality_photo_url} onChange={e => setEditValues(v => ({ ...v, quality_photo_url: e.target.value }))} style={{ width:'100%' }} />
              </label>

              <label style={{ display:'block', marginBottom:12 }}>
                <span style={{ display:'block', marginBottom:4, fontSize:14, opacity:0.8 }}>Pro Tip</span>
                <textarea rows={3} className="input" value={editValues.quality_notes} onChange={e => setEditValues(v => ({ ...v, quality_notes: e.target.value }))} style={{ width:'100%', resize:'vertical' }} />
              </label>

              <button className="button" onClick={saveBasic} style={{ width:'100%' }}>Guardar configuración</button>
              </div>

            {/* VARIANTES */}
            <div className="card" style={{ padding:16, marginBottom:12 }}>
              <h4 style={{ margin:'0 0 12px 0', fontSize:16 }}>🏷️ Variantes de Precio</h4>

              {/* Nueva Variante */}
              <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, marginBottom:12 }}>
                <h5 style={{ margin:'0 0 8px 0', fontSize:14 }}>➕ Nueva Variante</h5>
                <input 
                  className="input" 
                  placeholder="Nombre de variante (ej: kivi, premium)" 
                  value={newVariant.label} 
                  onChange={e=> setNewVariant(v=>({ ...v, label:e.target.value }))} 
                  style={{ width:'100%', marginBottom:8 }}
                />
                {newVariant.label.trim() && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Cant mín" 
                      value={newVariant.min_qty} 
                      onChange={e=> setNewVariant(v=>({ ...v, min_qty:e.target.value }))}
                    />
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Precio" 
                      value={newVariant.sale_price} 
                      onChange={e=> setNewVariant(v=>({ ...v, sale_price:e.target.value }))}
                    />
                </div>
              )}
                {newVariant.label.trim() && (
                  <button 
                    className="button" 
                    onClick={async()=>{
                      const name = newVariant.label.trim()
                      const minq = Number(newVariant.min_qty||'')
                      const price = Number(newVariant.sale_price||'')
                if(!name || !minq || !price){ alert('Completa nombre, cantidad mínima y precio'); return }
                const v = await createVariant({ product_id:editValues.id, label:name })
                await createVariantTier({ product_id:editValues.id, variant_id: v.id, min_qty: minq, unit: (editValues.default_unit||'kg'), sale_price: price })
                      setNewVariant({ label:'', min_qty:'', sale_price:'' })
                setEditVariants(await listVariants(editValues.id))
                setEditTiers(await listVariantTiers(editValues.id))
                    }}
                    style={{ width:'100%', marginTop:8 }}
                  >
                    Crear variante
                  </button>
                )}
              </div>

              {/* Variantes Existentes */}
              <h5 style={{ margin:'0 0 8px 0', fontSize:14 }}>📋 Variantes Actuales</h5>
              {editVariants.length === 0 ? (
                <div style={{ textAlign:'center', padding:16, opacity:0.6, fontSize:14 }}>
                  No hay variantes creadas
                </div>
              ) : (
                <div style={{ display:'grid', gap:8 }}>
                  {editVariants.map(v=> {
                    const isEditing = editingVariantId === v.id
                    const tiers = editTiers.filter(t=> String(t.variant_id||'')===String(v.id||''))
                    
                    return (
                      <div key={v.id} style={{ padding:12, background:'#f8f9fa', borderRadius:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ fontWeight:600, fontSize:15 }}>
                            {v.label} {!v.active && <span style={{ opacity:0.5, fontSize:12 }}>(inactiva)</span>}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button 
                              className="button ghost" 
                              onClick={()=> {
                                if(isEditing) {
                                  setEditingVariantId(null)
                                  setEditingVariant({ label:'', active:true, min_qty:'', sale_price:'' })
                                } else {
                                  setEditingVariantId(v.id)
                                  const tier = tiers[0] || {}
                                  setEditingVariant({ 
                                    label:v.label, 
                                    active:v.active, 
                                    min_qty: tier.min_qty || '', 
                                    sale_price: tier.sale_price || '' 
                                  })
                                }
                              }}
                              style={{ padding:'4px 12px', fontSize:13 }}
                            >
                              {isEditing ? 'Cancelar' : '✏️'}
                            </button>
                            <button 
                              className="button ghost" 
                              onClick={async ()=> {
                                if(confirm(`¿Eliminar variante "${v.label}"?`)){
                                  try {
                                    await deleteVariant(v.id)
                                    const newVars = await listVariants(editValues.id)
                                    setEditVariants(newVars)
                                    const newTiers = await listVariantTiers(editValues.id)
                                    setEditTiers(newTiers)
                                    alert('Variante eliminada')
                                  } catch(e) {
                                    alert('Error al eliminar variante')
                                  }
                                }
                              }}
                              style={{ padding:'4px 12px', fontSize:13, color:'#e74c3c' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {!isEditing ? (
                          <div style={{ fontSize:13, opacity:0.8 }}>
                            {tiers.map(t=> (
                              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
                                <span>≥ {t.min_qty} {t.unit}</span>
                                <span>${t.sale_price.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                            {tiers.length === 0 && <div style={{ opacity:0.5 }}>Sin escalas de precio</div>}
                    </div>
                        ) : (
                          <div style={{ display:'grid', gap:8, marginTop:8 }}>
                            <input 
                              className="input" 
                              placeholder="Nombre" 
                              value={editingVariant.label} 
                              onChange={e=> setEditingVariant(v=>({ ...v, label:e.target.value }))}
                            />
                            <select 
                              className="input" 
                              value={editingVariant.active? '1':'0'} 
                              onChange={e=> setEditingVariant(v=>({ ...v, active:e.target.value==='1' }))}
                            >
                              <option value="1">Activa</option>
                              <option value="0">Inactiva</option>
                            </select>
                            <button 
                              className="button" 
                              onClick={async()=>{ 
                                await updateVariant(v.id, { label:editingVariant.label, active:editingVariant.active })
                                setEditVariants(await listVariants(editValues.id))
                                setEditingVariantId(null)
                              }}
                              style={{ width:'100%' }}
                            >
                              Guardar cambios
                            </button>
                  </div>
                        )}
              </div>
                    )
                  })}
              </div>
              )}
            </div>

            <button className="button ghost" onClick={() => setEditOpen(false)} style={{ width:'100%' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
