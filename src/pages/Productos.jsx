import { useEffect, useState } from 'react'
import { listProducts, createProduct, updateProduct } from '../api/products'
import { listVariants, createVariant, updateVariant, deleteVariant, listVariantTiers, createVariantTier } from '../api/variants'
import ImageUploader from '../components/ImageUploader'
import { generateCatalogPDF } from '../utils/pdfGenerator'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

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
      name: editValues.name,
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
    alert('✓ Producto actualizado')
  }

  // Filtrar productos
  const filteredItems = items.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ padding:'20px', maxWidth:1400, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:800, margin:'0 0 8px 0', color:'var(--kivi-text-dark)' }}>
            🛍️ Productos
          </h1>
          <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Gestiona tu catálogo de productos</p>
        </div>
        
        <button
          onClick={async () => {
            if (items.length === 0) {
              alert('No hay productos para descargar')
              return
            }
            try {
              // Cargar productos con precios oficiales (sin costos)
              const productsData = await listProducts(false)
              
              // Cargar variantes y tiers para cada producto
              const productsWithVariants = await Promise.all(
                productsData.map(async (product) => {
                  try {
                    const variants = await listVariants(product.id)
                    const variantsWithTiers = await Promise.all(
                      variants.map(async (variant) => {
                        try {
                          const tiers = await listVariantTiers(product.id, variant.id)
                          return { ...variant, price_tiers: tiers }
                        } catch {
                          return { ...variant, price_tiers: [] }
                        }
                      })
                    )
                    return { ...product, variants: variantsWithTiers }
                  } catch {
                    return { ...product, variants: [] }
                  }
                })
              )
              
              // Los vendedores usan el catálogo oficial con los precios establecidos
              generateCatalogPDF(productsWithVariants)
            } catch (err) {
              alert('Error al generar el catálogo: ' + (err.message || 'Error desconocido'))
            }
          }}
          disabled={loading || items.length === 0}
          style={{
            padding: '12px 24px',
            borderRadius: 16,
            border: 'none',
            background: (loading || items.length === 0) ? '#ccc' : '#e74c3c',
            color: (loading || items.length === 0) ? '#666' : 'white',
            fontWeight: 700,
            fontSize: 15,
            cursor: (loading || items.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: (loading || items.length === 0) ? 0.6 : 1,
            boxShadow: (loading || items.length === 0) ? 'none' : '0 4px 12px rgba(231, 76, 60, 0.3)'
          }}
          onMouseOver={e => {
            if (!loading && items.length > 0) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.4)'
            }
          }}
          onMouseOut={e => {
            if (!loading && items.length > 0) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)'
            }
          }}
          title="Descargar catálogo con precios oficiales"
        >
          <span>📄</span>
          Catálogo (Precios Oficiales)
        </button>
      </div>

      {/* Crear Producto */}
      <div style={{ 
        background:'linear-gradient(135deg, var(--kivi-green-soft) 0%, var(--kivi-blue-soft) 100%)', 
        padding:24, 
        borderRadius:20, 
        marginBottom:28,
        boxShadow:'0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin:'0 0 16px 0', fontSize:18, fontWeight:700 }}>➕ Nuevo Producto</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:'1 1 250px', minWidth:200 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:14, fontWeight:600 }}>Nombre</label>
            <input 
              className="input" 
              placeholder="Ej: Manzana Royal Gala" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              style={{ width:'100%' }}
            />
          </div>
          <div style={{ flex:'0 1 180px', minWidth:150 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:14, fontWeight:600 }}>Precio inicial</label>
            <input 
              className="input" 
              type="number"
              placeholder="$1500" 
              value={newSale} 
              onChange={e => setNewSale(e.target.value)} 
              style={{ width:'100%' }}
            />
          </div>
          <button 
            className="button" 
            onClick={handleCreate}
            style={{ 
              height:44,
              paddingLeft:28,
              paddingRight:28,
              background:'var(--kivi-green)',
              fontWeight:700,
              fontSize:15
            }}
          >
            Crear Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input 
          className="input"
          placeholder="🔍 Buscar productos..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex:'1 1 300px', minWidth:200 }}
        />
        <select 
          className="input"
          value={filterCategory} 
          onChange={e => setFilterCategory(e.target.value)}
          style={{ flex:'0 1 200px' }}
        >
          <option value="">Todas las categorías</option>
          <option value="fruta">🍎 Frutas</option>
          <option value="verdura">🥬 Verduras</option>
        </select>
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, fontSize:16, opacity:0.6 }}>
          Cargando productos...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📦</div>
          <p style={{ fontSize:18, opacity:0.6, margin:0 }}>
            {searchTerm || filterCategory ? 'No se encontraron productos' : 'No hay productos creados'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display:'grid', 
          gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', 
          gap:20 
        }}>
          {filteredItems.map(p => {
            const currentPrice = (p.catalog && p.catalog[0]) ? p.catalog[0].sale_price : 0
            const categoryEmoji = p.category === 'fruta' ? '🍎' : p.category === 'verdura' ? '🥬' : '📦'
            
            return (
              <div 
                key={p.id} 
                style={{ 
                  background:'white',
                  borderRadius:20,
                  overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  transition:'all 0.3s',
                  cursor:'pointer',
                  border:'2px solid transparent'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--kivi-green)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
                onClick={() => openEdit(p)}
              >
                {/* Imagen */}
                <div style={{ 
                  width:'100%', 
                  height:180, 
                  background: p.quality_photo_url 
                    ? `url(${p.quality_photo_url}) center/cover` 
                    : 'linear-gradient(135deg, var(--kivi-cream) 0%, var(--kivi-green-soft) 100%)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontSize:64,
                  position:'relative'
                }}>
                  {!p.quality_photo_url && categoryEmoji}
                  {p.category && (
                    <div style={{
                      position:'absolute',
                      top:12,
                      right:12,
                      background:'rgba(255,255,255,0.95)',
                      padding:'6px 12px',
                      borderRadius:20,
                      fontSize:12,
                      fontWeight:600,
                      backdropFilter:'blur(8px)'
                    }}>
                      {p.category === 'fruta' ? '🍎 Fruta' : p.category === 'verdura' ? '🥬 Verdura' : ''}
            </div>
                  )}
                </div>

                {/* Contenido */}
                <div style={{ padding:20 }}>
                  <h3 style={{ 
                    margin:'0 0 12px 0', 
                    fontSize:18, 
                    fontWeight:700,
                    color:'var(--kivi-text-dark)',
                    overflow:'hidden',
                    textOverflow:'ellipsis',
                    whiteSpace:'nowrap'
                  }}>
                    {p.name}
                  </h3>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Precio</div>
                      <div style={{ fontSize:24, fontWeight:800, color:'var(--kivi-green-dark)' }}>
                        ${Number(currentPrice || 0).toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Unidad</div>
                      <div style={{ 
                        fontSize:14, 
                        fontWeight:600,
                        background:'var(--kivi-cream)',
                        padding:'4px 12px',
                        borderRadius:12
                      }}>
                        {p.default_unit === 'kg' ? 'kg' : 'U.'}
                      </div>
                    </div>
                  </div>

                  {/* Variantes */}
                  {p.variants && p.variants.length > 0 && (
                    <div style={{ 
                      fontSize:12, 
                      opacity:0.7,
                      padding:'8px 12px',
                      background:'var(--kivi-cream)',
                      borderRadius:12,
                      marginBottom:12
                    }}>
                      🏷️ {p.variants.length} variante{p.variants.length !== 1 ? 's' : ''}
                </div>
                  )}

                  <button 
                    className="button"
                    style={{ 
                      width:'100%',
                      background:'var(--kivi-green)',
                      fontWeight:600
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(p)
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Edición */}
      {editOpen && (
        <div 
          className="modal-backdrop"
          onClick={() => setEditOpen(false)}
        >
          <div 
            className="modal" 
            style={{ maxWidth:'95%', width:620, maxHeight:'95vh', overflow:'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              position:'sticky', 
              top:0, 
              background:'white', 
              zIndex:10,
              paddingBottom:16,
              marginBottom:20,
              borderBottom:'2px solid var(--kivi-cream)'
            }}>
              <h2 style={{ margin:'0 0 8px 0', fontSize:26, fontWeight:800, color:'var(--kivi-text-dark)' }}>
                {editValues.name}
              </h2>
              <p style={{ margin:0, opacity:0.6, fontSize:14 }}>Editar información del producto</p>
            </div>
            
            {/* IMAGEN */}
            <div style={{ 
              background:'linear-gradient(135deg, var(--kivi-cream) 0%, var(--kivi-green-soft) 100%)', 
              padding:24, 
              borderRadius:20, 
              marginBottom:20 
            }}>
              <h4 style={{ margin:'0 0 16px 0', fontSize:18, fontWeight:700 }}>📸 Imagen del Producto</h4>
              
              {/* Preview */}
              {editValues.quality_photo_url && (
                <div style={{ 
                  width:'100%', 
                  height:220, 
                  borderRadius:16,
                  background:`url(${editValues.quality_photo_url}) center/cover`,
                  marginBottom:16,
                  border:'3px solid white',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
                }} />
              )}

              <ImageUploader 
                value={editValues.quality_photo_url}
                onChange={(url) => setEditValues(v => ({ ...v, quality_photo_url: url }))}
              />
            </div>

            {/* BÁSICO */}
            <div style={{ 
              background:'white', 
              padding:24, 
              borderRadius:20, 
              marginBottom:20,
              border:'2px solid var(--kivi-cream)'
            }}>
              <h4 style={{ margin:'0 0 20px 0', fontSize:18, fontWeight:700 }}>⚙️ Configuración Básica</h4>
              
              <div style={{ display:'grid', gap:16 }}>
                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    Nombre del producto
                  </span>
                  <input
                    className="input"
                    value={editValues.name}
                    onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                    placeholder="Ej: Manzana Fuji"
                    style={{ width:'100%' }}
                  />
                </label>

                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    Unidad de cobro
                  </span>
                  <select 
                    className="input" 
                    value={editValues.default_unit} 
                    onChange={e => setEditValues(v => ({ ...v, default_unit: e.target.value }))} 
                    style={{ width:'100%' }}
                  >
                    <option value="kg">⚖️ Kilogramo (kg)</option>
                    <option value="unit">📦 Unidad (U.)</option>
                </select>
              </label>

                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    Categoría
                  </span>
                  <select 
                    className="input" 
                    value={editValues.category} 
                    onChange={e => setEditValues(v => ({ ...v, category: e.target.value }))} 
                    style={{ width:'100%' }}
                  >
                    <option value="">Sin categoría</option>
                    <option value="fruta">🍎 Fruta</option>
                    <option value="verdura">🥬 Verdura</option>
                </select>
              </label>

                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    Tipo de compra
                  </span>
                  <select 
                    className="input" 
                    value={editValues.purchase_type} 
                    onChange={e => setEditValues(v => ({ ...v, purchase_type: e.target.value }))} 
                    style={{ width:'100%' }}
                  >
                    <option value="detalle">🛒 Al detalle (suelto)</option>
                    <option value="cajon">📦 Por cajón</option>
                    </select>
                  </label>

                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    Precio por {editValues.default_unit === 'kg' ? 'kg' : 'unidad'}
                  </span>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="$0" 
                    value={editValues.sale_price} 
                    onChange={e=> setEditValues(v=>({ ...v, sale_price:e.target.value }))} 
                    style={{ width:'100%', fontSize:18, fontWeight:600 }}
                  />
              </label>

                <label style={{ display:'block' }}>
                  <span style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600, color:'var(--kivi-text)' }}>
                    💡 Pro Tip (Notas de calidad)
                  </span>
                  <textarea 
                    rows={3} 
                    className="input" 
                    placeholder="Ej: Mejor en temporada de verano, buscar color uniforme..."
                    value={editValues.quality_notes} 
                    onChange={e => setEditValues(v => ({ ...v, quality_notes: e.target.value }))} 
                    style={{ width:'100%', resize:'vertical' }} 
                  />
                  </label>
                </div>

              <button 
                className="button" 
                onClick={saveBasic} 
                style={{ 
                  width:'100%', 
                  marginTop:20,
                  background:'var(--kivi-green)',
                  fontSize:16,
                  fontWeight:700,
                  padding:'14px'
                }}
              >
                💾 Guardar Configuración
              </button>
            </div>

            {/* VARIANTES */}
            <div style={{ 
              background:'white', 
              padding:24, 
              borderRadius:20, 
              marginBottom:20,
              border:'2px solid var(--kivi-cream)'
            }}>
              <h4 style={{ margin:'0 0 20px 0', fontSize:18, fontWeight:700 }}>🏷️ Variantes de Precio</h4>

              {/* Nueva Variante */}
              <div style={{ 
                padding:20, 
                background:'linear-gradient(135deg, var(--kivi-blue-soft) 0%, var(--kivi-lavender) 100%)', 
                borderRadius:16, 
                marginBottom:20 
              }}>
                <h5 style={{ margin:'0 0 12px 0', fontSize:15, fontWeight:700 }}>➕ Nueva Variante</h5>
                <input 
                  className="input" 
                  placeholder="Nombre (ej: kivi, premium, mayorista)" 
                  value={newVariant.label} 
                  onChange={e=> setNewVariant(v=>({ ...v, label:e.target.value }))} 
                  style={{ width:'100%', marginBottom:12 }}
                />
                {newVariant.label.trim() && (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <input 
                        type="number" 
                        className="input" 
                        placeholder="Cantidad mínima" 
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
                    <button 
                      className="button" 
                      onClick={async()=>{
                        const name = newVariant.label.trim()
                        const minq = Number(newVariant.min_qty||'')
                        const price = Number(newVariant.sale_price||'')
                        if(!name || !minq || !price){ alert('Completa todos los campos'); return }
                const v = await createVariant({ product_id:editValues.id, label:name })
                await createVariantTier({ product_id:editValues.id, variant_id: v.id, min_qty: minq, unit: (editValues.default_unit||'kg'), sale_price: price })
                        setNewVariant({ label:'', min_qty:'', sale_price:'' })
                setEditVariants(await listVariants(editValues.id))
                setEditTiers(await listVariantTiers(editValues.id))
                        alert('✓ Variante creada')
                      }}
                      style={{ width:'100%', background:'white', fontWeight:600 }}
                    >
                      Crear Variante
                    </button>
              </>
              )}
              </div>

              {/* Variantes Existentes */}
              <h5 style={{ margin:'0 0 12px 0', fontSize:15, fontWeight:700, opacity:0.8 }}>📋 Variantes Actuales</h5>
              {editVariants.length === 0 ? (
                <div style={{ textAlign:'center', padding:32, opacity:0.5, fontSize:14 }}>
                  No hay variantes creadas
                </div>
              ) : (
                <div style={{ display:'grid', gap:12 }}>
                  {editVariants.map(v=> {
                    const isEditing = editingVariantId === v.id
                    const tiers = editTiers.filter(t=> String(t.variant_id||'')===String(v.id||''))
                    
                    return (
                      <div key={v.id} style={{ 
                        padding:16, 
                        background:v.active ? 'var(--kivi-cream)' : '#f5f5f5', 
                        borderRadius:12,
                        border:`2px solid ${v.active ? 'var(--kivi-green-soft)' : '#e0e0e0'}`
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                          <div style={{ fontWeight:700, fontSize:16, color:'var(--kivi-text-dark)' }}>
                            {v.label} {!v.active && <span style={{ opacity:0.5, fontSize:13, fontWeight:400 }}>(inactiva)</span>}
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
                              style={{ padding:'6px 14px', fontSize:13 }}
                            >
                              {isEditing ? 'Cancelar' : '✏️ Editar'}
                            </button>
                            <button 
                              className="button ghost" 
                              onClick={async ()=> {
                                if(confirm(`¿Eliminar variante "${v.label}"?`)){
                                  try {
                                    await deleteVariant(v.id)
                                    setEditVariants(await listVariants(editValues.id))
                                    setEditTiers(await listVariantTiers(editValues.id))
                                    alert('✓ Variante eliminada')
                                  } catch(e) {
                                    alert('Error al eliminar')
                                  }
                                }
                              }}
                              style={{ padding:'6px 14px', fontSize:13, color:'#e74c3c' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {!isEditing ? (
                          <div style={{ fontSize:14 }}>
                            {tiers.map(t=> (
                              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', opacity:0.8 }}>
                                <span>≥ {t.min_qty} {t.unit}</span>
                                <span style={{ fontWeight:700 }}>${t.sale_price.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                            {tiers.length === 0 && <div style={{ opacity:0.5, fontSize:13 }}>Sin escalas de precio</div>}
                    </div>
                        ) : (
                          <div style={{ display:'grid', gap:12, marginTop:12 }}>
                            <div>
                              <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600 }}>
                                Nombre de la variante
                              </label>
                              <input 
                                className="input" 
                                placeholder="Ej: M, L, Premium" 
                                value={editingVariant.label} 
                                onChange={e=> setEditingVariant(v=>({ ...v, label:e.target.value }))}
                                style={{ width:'100%' }}
                              />
                            </div>
                            
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                              <div>
                                <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600 }}>
                                  Cantidad mínima
                                </label>
                                <input 
                                  type="number"
                                  className="input" 
                                  placeholder="1" 
                                  value={editingVariant.min_qty} 
                                  onChange={e=> setEditingVariant(v=>({ ...v, min_qty:e.target.value }))}
                                  style={{ width:'100%' }}
                                />
                              </div>
                              
                              <div>
                                <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600 }}>
                                  Precio
                                </label>
                                <input 
                                  type="number"
                                  className="input" 
                                  placeholder="$0" 
                                  value={editingVariant.sale_price} 
                                  onChange={e=> setEditingVariant(v=>({ ...v, sale_price:e.target.value }))}
                                  style={{ width:'100%' }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600 }}>
                                Estado
                              </label>
                              <select 
                                className="input" 
                                value={editingVariant.active? '1':'0'} 
                                onChange={e=> setEditingVariant(v=>({ ...v, active:e.target.value==='1' }))}
                                style={{ width:'100%' }}
                              >
                                <option value="1">✓ Activa</option>
                                <option value="0">✗ Inactiva</option>
                              </select>
                            </div>
                            
                            <button 
                              className="button" 
                              onClick={async()=>{ 
                                // Actualizar variante (nombre y estado)
                                await updateVariant(v.id, { label:editingVariant.label, active:editingVariant.active })
                                
                                // Actualizar precio (tier)
                                const tier = tiers[0]
                                if(tier && editingVariant.sale_price) {
                                  const { updateVariantTier } = await import('../api/variants')
                                  await updateVariantTier(tier.id, {
                                    min_qty: parseFloat(editingVariant.min_qty) || 1,
                                    sale_price: parseFloat(editingVariant.sale_price) || 0
                                  })
                                }
                                
                                setEditVariants(await listVariants(editValues.id))
                                setEditTiers(await listVariantTiers(editValues.id))
                                setEditingVariantId(null)
                                alert('✓ Variante actualizada')
                              }}
                              style={{ width:'100%', background:'var(--kivi-green)' }}
                            >
                              💾 Guardar Cambios
                            </button>
                  </div>
                        )}
              </div>
                    )
                  })}
              </div>
              )}
            </div>

            <button 
              className="button ghost" 
              onClick={() => setEditOpen(false)} 
              style={{ width:'100%', padding:'14px', fontSize:16 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
