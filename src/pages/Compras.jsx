import { useEffect, useState, useMemo } from 'react'
import { listOrders, getOrderDetail } from '../api/orders'
import { apiFetch } from '../api/client'
import { listProducts } from '../api/products'
import QualityModal from '../components/QualityModal'
import PurchaseEditModal from '../components/PurchaseEditModal'
import '../styles/globals.css'

const toCLP = (n) => {
  const x = Number((n || '0').toString().replace(/[^0-9.-]/g, ''))
  return `$${x.toLocaleString('es-CL')}`
}
const parseCLP = (s) => (s ? s.toString().replace(/[^0-9]/g, '') : '')

export default function Compras() {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detail, setDetail] = useState(null)
  const [products, setProducts] = useState([])
  const [showQuality, setShowQuality] = useState(false)
  const [qualityProduct, setQualityProduct] = useState(null)
  const [rowChargeType, setRowChargeType] = useState({})

  const [modalOpen, setModalOpen] = useState(false)
  const [purchase, setPurchase] = useState({ product_id: '', qty_kg: '', qty_unit: '', charged_unit: 'kg', price_total: '', price_per_unit: '', vendor: '', notes: '', customers: '', units_kg_total: '', kg_units_total: '' })
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoModalProduct, setInfoModalProduct] = useState(null)

  // Estados de filtros
  const [filterStatus, setFilterStatus] = useState('all') // all, complete, incomplete
  const [filterCategory, setFilterCategory] = useState('all') // all, fruta, verdura
  const [filterPurchaseType, setFilterPurchaseType] = useState('all') // all, cajon, detalle

  useEffect(() => { 
    listOrders().then(os => { 
      setOrders(os); 
      const lastEmitted = os.find(o => o.status === 'emitido') || os[0]; 
      if (lastEmitted) setSelectedOrder(lastEmitted.id) 
    }).catch(() => {}) 
    listProducts().then(setProducts).catch(() => {})
  }, [])

  useEffect(() => { 
    if (!selectedOrder) return; 
    getOrderDetail(selectedOrder).then(d => { 
      setDetail(d); 
      const m={}; 
      (d.group_by_product||[]).forEach(g=>{m[g.product_id]=(g.totals?.kg||0)>0?'kg':'unit'}); 
      setRowChargeType(m) 
    }).catch(()=>{}) 
  }, [selectedOrder])


  function openQuality(pid){ const p=products.find(x=>x.id===Number(pid)); setQualityProduct(p||null); setShowQuality(true) }
  const parseNum = (v)=>{ const n=parseFloat(v); return isNaN(n)?0:n }

  // Conversión y cálculo automático
  const chargeUnit = purchase.charged_unit === 'unit' ? 'unit' : 'kg'
  const qtyKg = parseNum(purchase.qty_kg)
  const qtyUnit = parseNum(purchase.qty_unit)
  const unitsKgTotal = purchase.units_kg_total ? parseNum(purchase.units_kg_total) : 0
  const kgUnitsTotal = purchase.kg_units_total ? parseNum(purchase.kg_units_total) : 0
  const chargeQty = chargeUnit === 'kg'
    ? (qtyKg + kgUnitsTotal)
    : (qtyUnit + unitsKgTotal)
  // Mostrar equivalencia SI cobro en una unidad diferente a lo comprado
  const convRequired = (chargeUnit==='kg' && qtyUnit>0) || (chargeUnit==='unit' && qtyKg>0)

  function onChangePricePerUnit(val){
    const p = parseNum(val)
    const total = chargeQty > 0 ? (p * chargeQty) : 0
    setPurchase(prev => ({ ...prev, price_per_unit: String(p), price_total: String(total) }))
  }

  function onChangePriceTotal(val){
    const t = parseNum(parseCLP(val))
    const ppu = chargeQty > 0 ? (t / chargeQty) : 0
    setPurchase(prev => ({ ...prev, price_total: String(t), price_per_unit: String(ppu) }))
  }

  async function savePurchase(){
    if(!selectedOrder||!purchase.product_id) return;
    // Validar que si se requiere equivalencia, esté rellenada
    if (convRequired) {
      if (chargeUnit==='kg' && qtyUnit>0 && kgUnitsTotal<=0) {
        alert('⚠️ Debes indicar cuántos kilos son las unidades compradas')
        return
      }
      if (chargeUnit==='unit' && qtyKg>0 && unitsKgTotal<=0) {
        alert('⚠️ Debes indicar cuántas unidades son los kilos comprados')
        return
      }
    }
    // Ya no es requisito especificar clientes en caso de compra incompleta
    let price_per_unit = purchase.price_per_unit ? Number(purchase.price_per_unit) : 0
    let price_total = purchase.price_total ? Number(purchase.price_total) : 0
    if (!price_per_unit && chargeQty>0 && price_total){ price_per_unit = price_total / chargeQty }
    if (!price_total && price_per_unit && chargeQty>0){ price_total = price_per_unit * chargeQty }
    const payload={ order_id:selectedOrder, product_id:Number(purchase.product_id), qty_kg:purchase.qty_kg?Number(purchase.qty_kg):null, qty_unit:purchase.qty_unit?Number(purchase.qty_unit):null, charged_unit:purchase.charged_unit, price_total:price_total||null, price_per_unit:price_per_unit||null, vendor:purchase.vendor||null, notes:purchase.notes||null, customers:purchase.customers?purchase.customers.split(',').map(s=>s.trim()).filter(Boolean):[], };
    try{
      const pid = Number(purchase.product_id)
      const it = (detail?.items||[]).filter(x=>x.product_id===pid).find(x=> Number(x.sale_unit_price||0)>0)
      if (it){ payload.billed_expected = Number(it.sale_unit_price||0) * chargeQty }
    }catch{}
    try{
      if (purchase.charged_unit==='kg' && (purchase.kg_units_total||'').toString().trim()){
        payload.eq_qty_kg = Number(purchase.kg_units_total)
      }
      if (purchase.charged_unit==='unit' && (purchase.units_kg_total||'').toString().trim()){
        payload.eq_qty_unit = Number(purchase.units_kg_total)
      }
    }catch{}
    await apiFetch('/purchases',{method:'POST',body:payload}); 
    await refreshOrderDetail()
    setModalOpen(false)
  }

  async function refreshOrderDetail() {
    if (!selectedOrder) return
    try {
      const d = await getOrderDetail(selectedOrder)
      setDetail(d)
    } catch (err) {
      console.error('Error recargando detalle:', err)
    }
  }

  // Funciones de estado y formato
  function getProductStatus(g){
    const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}
    const needKg=g.totals?.kg||0, needUnit=g.totals?.unit||0
    const gotKg=purchased.kg||0, gotUnit=purchased.unit||0
    const hasKg=needKg>0, hasUnit=needUnit>0
    const over=(hasKg&&gotKg>needKg)||(hasUnit&&gotUnit>needUnit)
    const complete=(!hasKg||gotKg===needKg)&&(!hasUnit||gotUnit===needUnit)
    if(over) return 'excess'
    if(complete) return 'complete'
    return 'incomplete'
  }

  function stateBadge(g){ 
    const status = getProductStatus(g)
    let cls='badge danger', txt='Faltante', bg='#ffebee', color='#d32f2f'
    if(status === 'excess'){ cls='badge warn'; txt='Exceso'; bg='#fff3e0'; color='#f57c00' } 
    else if(status === 'complete'){ cls='badge ok'; txt='Listo'; bg='#e8f5e9'; color='#2e7d32' }
    return <span style={{ padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:600, background:bg, color }}>{txt}</span>
  }

  function qtySegments(g){ 
    const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}
    const needKg=(g.totals?.kg||0); const needUnit=(g.totals?.unit||0)
    const gotKg=(purchased.kg||0); const gotUnit=(purchased.unit||0)
    return [`${gotKg}/${needKg} kg`, `${gotUnit}/${needUnit} unit`] 
  }

  function missingSegments(g){ 
    const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}
    const needKg=g.totals?.kg||0, needUnit=g.totals?.unit||0
    const gotKg=purchased.kg||0, gotUnit=purchased.unit||0
    const missKg=Math.max(0,(needKg||0)-(gotKg||0))
    const missUnit=Math.max(0,(needUnit||0)-(gotUnit||0))
    const parts=[]
    if(needKg>0) parts.push(`${missKg} kg`)
    if(needUnit>0) parts.push(`${missUnit} unit`)
    return parts 
  }

  function openModalFor(g){ 
    const prod=products.find(x=>x.id===Number(g.product_id))
    const defUnit=prod?.default_unit||rowChargeType[g.product_id]||'kg'
    setPurchase({ 
      product_id:String(g.product_id), 
      qty_kg:'', 
      qty_unit:'', 
      charged_unit:defUnit, 
      price_total:'', 
      price_per_unit:'', 
      vendor:'', 
      notes:'', 
      customers:'', 
      units_kg_total:'', 
      kg_units_total:'' 
    })
    setModalOpen(true)
  }


  // Productos filtrados
  const filteredProducts = useMemo(() => {
    if (!detail || !detail.group_by_product) return []
    return detail.group_by_product.filter(g => {
      const product = products.find(p => p.id === g.product_id)
      const status = getProductStatus(g)
      
      // Filtro de estado
      if (filterStatus === 'complete' && status !== 'complete') return false
      if (filterStatus === 'incomplete' && status === 'complete') return false
      
      // Filtro de categoría
      if (filterCategory !== 'all' && product?.category !== filterCategory) return false
      
      // Filtro de tipo de compra
      if (filterPurchaseType !== 'all' && product?.purchase_type !== filterPurchaseType) return false
      
      return true
    })
  }, [detail, products, filterStatus, filterCategory, filterPurchaseType])

  const currentProduct = products.find(p => p.id === Number(purchase.product_id))

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'20px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:28, fontWeight:800 }}>🛒 Compras</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:14 }}>Gestiona tus compras por pedido</p>
      </div>

      {/* Selector de pedido y botón Vuelta Reconocimiento */}
      <div style={{ marginBottom:20, display:'flex', gap:12, alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
        <select 
          className="input" 
          style={{ flex:'1', maxWidth:400, padding:'12px 16px', borderRadius:12, fontSize:15 }} 
          value={selectedOrder || ''} 
          onChange={e=>setSelectedOrder(Number(e.target.value))}
        >
          <option value="">Seleccionar pedido...</option>
          {orders.map(o=> (<option key={o.id} value={o.id}>{o.title || `Pedido #${o.id}`}</option>))}
        </select>
        
      </div>

      {!selectedOrder ? (
        <div style={{ textAlign:'center', opacity:0.6, marginTop:40, fontSize:16 }}>
          👆 Selecciona un pedido para comenzar
        </div>
      ) : !detail ? (
        <div style={{ textAlign:'center', marginTop:40 }}>Cargando...</div>
      ) : (
        <>
          {/* Filtros */}
          <div style={{ marginBottom:24, background:'white', borderRadius:16, padding:16, border:'1px solid #e0e0e0' }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:12, opacity:0.7 }}>🔍 Filtros</div>
            <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Estado del pedido</label>
                <select 
                  className="input" 
                  value={filterStatus} 
                  onChange={e=>setFilterStatus(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                >
                  <option value="all">📋 Todos</option>
                  <option value="complete">✓ Completos</option>
                  <option value="incomplete">⚠️ Incompletos</option>
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Categoría</label>
                <select 
                  className="input" 
                  value={filterCategory} 
                  onChange={e=>setFilterCategory(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                >
                  <option value="all">🥗 Todas</option>
                  <option value="fruta">🍎 Frutas</option>
                  <option value="verdura">🥬 Verduras</option>
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Tipo de compra</label>
                <select 
                  className="input" 
                  value={filterPurchaseType} 
                  onChange={e=>setFilterPurchaseType(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                >
                  <option value="all">🛍️ Todos</option>
                  <option value="cajon">📦 Por cajón</option>
                  <option value="detalle">🛒 Al detalle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', background:'#f8f9fa', borderRadius:16, opacity:0.7 }}>
              No hay productos que coincidan con los filtros seleccionados
            </div>
          ) : (
            <div style={{ display:'grid', gap:16, paddingBottom: 20 }}>
              {filteredProducts.map(g=> {
                const product = products.find(p => p.id === g.product_id)
                return (
                  <div 
                    key={g.product_id} 
                    style={{ 
                      background:'white', 
                      borderRadius:16, 
                      padding:20, 
                      border:'1px solid #e0e0e0',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      gap:16,
                      flexWrap:'wrap'
                    }}
                  >
                    <div style={{ flex:1, minWidth:180 }}>
                      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>
                        {g.product_name}
                </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', fontSize:14, opacity:0.7 }}>
                        {product?.category && (
                          <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:6, fontSize:12 }}>
                            {product.category === 'fruta' ? '🍎 Fruta' : '🥬 Verdura'}
                          </span>
                        )}
                        {product?.purchase_type && (
                          <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:6, fontSize:12 }}>
                            {product.purchase_type === 'cajon' ? '📦 Cajón' : '🛒 Detalle'}
                          </span>
                        )}
                </div>
              </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
                      <div style={{ display:'flex', gap:12, fontSize:15 }}>
                        {qtySegments(g).map((t,i)=>(
                          <span key={i} style={{ fontWeight:600 }}>{t}</span>
            ))}
          </div>
                      {stateBadge(g)}
                    </div>

                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button 
                        onClick={()=>openModalFor(g)} 
                        className="button" 
                        style={{ padding:'10px 20px', borderRadius:12, fontWeight:600, background:'#88C4A8', color:'white', border:'none' }}
                      >
                        📝 Anotar compra
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const product = products.find(p => p.id === g.product_id)
                          setInfoModalProduct({ ...g, product })
                          setShowInfoModal(true)
                        }}
                        style={{
                          padding:'10px 18px',
                          borderRadius:12,
                          background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color:'white',
                          border:'none',
                          cursor:'pointer',
                          fontSize:15,
                          fontWeight:600,
                          transition:'all 0.2s',
                          boxShadow:'0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}
                        title="Ver información del producto y clientes"
                      >
                        💡 Info
                      </button>
                    </div>
                  </div>
                )
              })}
        </div>
          )}
        </>
      )}

      {/* Modal de compra simplificado */}
      {modalOpen && currentProduct && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:500, borderRadius:20, maxHeight:'90vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:'2px solid #f0f0f0' }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>📝 {currentProduct.name}</h3>
              <button onClick={()=>setModalOpen(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', opacity:0.6 }}>✕</button>
            </div>

            {/* Cantidades */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>Cantidad (kg)</label>
                <input 
                  className="input" 
                  type="number" 
                  value={purchase.qty_kg} 
                  onChange={e=>setPurchase({...purchase, qty_kg:e.target.value})}
                  placeholder="0"
                  style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15 }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>Cantidad (unidades)</label>
                <input 
                  className="input" 
                  type="number" 
                  value={purchase.qty_unit} 
                  onChange={e=>setPurchase({...purchase, qty_unit:e.target.value})}
                  placeholder="0"
                  style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15 }}
                />
              </div>
            </div>

            {/* Unidad de cobro */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>Unidad de cobro</label>
              <select 
                className="input" 
                value={purchase.charged_unit} 
                onChange={e=>setPurchase({...purchase, charged_unit:e.target.value})}
                style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15 }}
              >
                <option value="kg">Kilogramo</option>
                <option value="unit">Unidad</option>
              </select>
            </div>

            {/* Equivalencias (SOLO si se necesitan) */}
            {convRequired && (
              <div style={{ background:'#fff3e0', borderRadius:10, padding:16, marginBottom:16, border:'2px solid #ffe0b2' }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'#f57c00' }}>⚠️ Equivalencia necesaria</div>
                {chargeUnit === 'kg' && qtyUnit > 0 && (
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>
                      ¿Cuántos kilos son {qtyUnit} unidades?
                    </label>
                    <input 
                      className="input" 
                      type="text"
                      inputMode="decimal"
                      value={purchase.kg_units_total || ''} 
                      onChange={e=>{
                        const val = e.target.value
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPurchase({...purchase, kg_units_total:val})
                        }
                      }}
                      placeholder="Ej: 12.5"
                      style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15, border:'2px solid #ffe0b2' }}
                    />
                  </div>
                )}
                {chargeUnit === 'unit' && qtyKg > 0 && (
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>
                      ¿Cuántas unidades son {qtyKg} kg?
                    </label>
                    <input 
                      className="input" 
                      type="text"
                      inputMode="decimal"
                      value={purchase.units_kg_total || ''} 
                      onChange={e=>{
                        const val = e.target.value
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPurchase({...purchase, units_kg_total:val})
                        }
                      }}
                      placeholder="Ej: 50"
                      style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15, border:'2px solid #ffe0b2' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Precio */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>
                  Precio/{chargeUnit==='kg'?'kg':'unid'}
                </label>
                <input 
                  className="input" 
                  type="number" 
                  value={purchase.price_per_unit} 
                  onChange={e=>onChangePricePerUnit(e.target.value)}
                  placeholder="0"
                  style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15 }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, marginBottom:6, fontWeight:600 }}>Precio total</label>
                <input 
                  className="input" 
                  type="text" 
                  value={toCLP(purchase.price_total)} 
                  onChange={e=>onChangePriceTotal(e.target.value)}
                  placeholder="$0"
                  style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:15 }}
                />
              </div>
            </div>

            {/* Botones */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
              <button 
                className="button ghost" 
                onClick={()=>setModalOpen(false)}
                style={{ padding:14, borderRadius:12, fontWeight:600, fontSize:15 }}
              >
                Cancelar
              </button>
              <button 
                className="button" 
                onClick={savePurchase}
                style={{ padding:14, borderRadius:12, fontWeight:700, fontSize:15, background:'#88C4A8' }}
              >
                ✓ Guardar compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de calidad */}
      {showQuality && qualityProduct && (
        <QualityModal product={qualityProduct} onClose={()=>setShowQuality(false)} />
      )}

      {/* Modal de edición de compras */}
      {editingPurchase && (
        <PurchaseEditModal 
          purchase={editingPurchase} 
          onClose={() => setEditingPurchase(null)} 
          onSaved={refreshOrderDetail}
        />
      )}

      {/* Modal de información del producto */}
      {showInfoModal && infoModalProduct && (
        <div className="modal-backdrop" onClick={()=>setShowInfoModal(false)}>
          <div 
            className="modal" 
            onClick={e=>e.stopPropagation()} 
            style={{ 
              maxWidth:500, 
              borderRadius:20,
              background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding:0,
              overflow:'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding:'24px 24px 20px 24px',
              background:'rgba(255,255,255,0.95)',
              borderBottom:'3px solid rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <h3 style={{ margin:0, fontSize:22, fontWeight:800, color:'#764ba2' }}>
                  📦 {infoModalProduct.product_name}
                </h3>
                <button 
                  onClick={()=>setShowInfoModal(false)} 
                  style={{ 
                    background:'none', 
                    border:'none', 
                    fontSize:28, 
                    cursor:'pointer', 
                    opacity:0.6,
                    padding:'0 4px',
                    color:'#764ba2'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ 
              maxHeight:'70vh', 
              overflow:'auto', 
              background:'white'
            }}>
              {/* Clientes */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:12, color:'#667eea' }}>
                  👥 Clientes
                </div>
                <div style={{ display:'grid', gap:8 }}>
                  {infoModalProduct.customers.map((c,i)=>(
                    <div 
                      key={i} 
                      style={{ 
                        background:'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                        borderRadius:10, 
                        padding:'12px 16px',
                        borderLeft:'3px solid #667eea'
                      }}
                    >
                      <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>
                        {c.customer_name}
                      </div>
                      <div style={{ fontSize:14, opacity:0.8 }}>
                        {c.qty} {c.unit}
                        {c.has_note && <span style={{ marginLeft:8, fontSize:12, background:'#fff3e0', padding:'2px 8px', borderRadius:6 }}>📝 Con nota</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:12, color:'#667eea' }}>
                  📊 Totales
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {Object.entries(infoModalProduct.totals).filter(([_, v]) => v > 0).map(([unit, value])=>(
                    <div 
                      key={unit}
                      style={{ 
                        background:'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', 
                        borderRadius:10, 
                        padding:'16px',
                        textAlign:'center'
                      }}
                    >
                      <div style={{ fontSize:24, fontWeight:800, color:'#2e7d32' }}>
                        {value}
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#2e7d32', marginTop:4 }}>
                        {unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas y Pro Tips */}
              {(infoModalProduct.product?.notes || infoModalProduct.product?.quality_notes) && (
                <div style={{ padding:'20px 24px' }}>
                  {infoModalProduct.product?.notes && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:'#667eea' }}>
                        📝 Notas
                      </div>
                      <div style={{ 
                        fontSize:14, 
                        opacity:0.9, 
                        background:'#f8f9fa', 
                        padding:'12px 16px', 
                        borderRadius:10,
                        lineHeight:'1.5'
                      }}>
                        {infoModalProduct.product.notes}
                      </div>
                    </div>
                  )}

                  {infoModalProduct.product?.quality_notes && (
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:'#f57c00' }}>
                        ⭐ Pro Tip
                      </div>
                      <div style={{ 
                        fontSize:14, 
                        opacity:0.9, 
                        background:'#fff3e0', 
                        padding:'12px 16px', 
                        borderRadius:10,
                        lineHeight:'1.5',
                        border:'1px solid #ffe0b2'
                      }}>
                        {infoModalProduct.product.quality_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'16px 24px', background:'rgba(255,255,255,0.95)' }}>
              <button 
                onClick={()=>setShowInfoModal(false)}
                style={{ 
                  width:'100%', 
                  padding:14, 
                  borderRadius:12, 
                  fontWeight:700,
                  fontSize:15,
                  background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color:'white',
                  border:'none',
                  cursor:'pointer',
                  boxShadow:'0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
