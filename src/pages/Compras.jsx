import { useEffect, useState, useMemo } from 'react'
import { listOrders, getOrderDetail } from '../api/orders'
import { apiFetch } from '../api/client'
import { listProducts } from '../api/products'
import { listPrices } from '../api/prices'
import { listVendors } from '../api/vendors'
import { batchUpdateVendorPrices } from '../api/adminVendors'
import QualityModal from '../components/QualityModal'
import PurchaseEditModal from '../components/PurchaseEditModal'
import VueltaReconocimientoModal from '../components/VueltaReconocimientoModal'
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
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showSpecsPopup, setShowSpecsPopup] = useState(false)
  const [specSeen, setSpecSeen] = useState(false)
  const [purchase, setPurchase] = useState({ product_id: '', qty_kg: '', qty_unit: '', charged_unit: 'kg', price_total: '', price_per_unit: '', vendor: '', notes: '', customers: '', units_kg_total: '', kg_units_total: '' })
  const [priceList, setPriceList] = useState([])
  const [existingPurchases, setExistingPurchases] = useState([])
  const [editingPurchase, setEditingPurchase] = useState(null)

  // Estados de filtros
  const [filterStatus, setFilterStatus] = useState('all') // all, complete, incomplete
  const [filterCategory, setFilterCategory] = useState('all') // all, fruta, verdura
  const [filterPurchaseType, setFilterPurchaseType] = useState('all') // all, cajon, detalle
  
  // Modal Vuelta de Reconocimiento
  const [reconModalOpen, setReconModalOpen] = useState(false)
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [reconPrices, setReconPrices] = useState({}) // {product_id: {price, unit}}

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

  useEffect(() => { 
    if (!modalOpen || !purchase.product_id) { setPriceList([]); setExistingPurchases([]); return } 
    listPrices(Number(purchase.product_id)).then(setPriceList).catch(() => {})
    // Cargar compras existentes para este producto en este pedido
    if (selectedOrder) {
      apiFetch('/purchases').then(allPurchases => {
        const filtered = allPurchases.filter(p => 
          p.order_id === selectedOrder && p.product_id === Number(purchase.product_id)
        )
        setExistingPurchases(filtered)
      }).catch(() => {})
    }
  }, [modalOpen, purchase.product_id, selectedOrder])

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
  const convRequired = (chargeUnit==='kg' && qtyUnit>0 && kgUnitsTotal<=0) || (chargeUnit==='unit' && qtyKg>0 && unitsKgTotal<=0)

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
    if (convRequired){ alert('Falta ingresar la equivalencia entre unidades y kilos'); return }
    try{
      if(!detail || !purchase.product_id){}
      else{
        const pid = Number(purchase.product_id)
        const g = (detail.group_by_product||[]).find(x=>x.product_id===pid)
        const purchased = (detail.purchased_by_product||{})[pid]||{ kg:0, unit:0 }
        const needKg = (g?.totals?.kg||0), needUnit=(g?.totals?.unit||0)
        const afterKg = (purchased.kg||0) + qtyKg
        const afterUnit = (purchased.unit||0) + qtyUnit
        const incomplete = (needKg>afterKg) || (needUnit>afterUnit)
        const hasCustomers = !!((purchase.customers||'').trim())
        if (incomplete && !hasCustomers){ alert('Clientes son obligatorios si no completas el producto'); return }
      }
    }catch{}
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
    setModalOpen(false); 
    setShowPurchaseForm(false)
  }

  async function refreshOrderDetail() {
    if (!selectedOrder) return
    try {
      const d = await getOrderDetail(selectedOrder)
      setDetail(d)
      // Recargar compras existentes si el modal está abierto
      if (modalOpen && purchase.product_id) {
        const allPurchases = await apiFetch('/purchases')
        const filtered = allPurchases.filter(p => 
          p.order_id === selectedOrder && p.product_id === Number(purchase.product_id)
        )
        setExistingPurchases(filtered)
      }
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
    setSpecSeen(false)
    setModalOpen(true)
    setShowPurchaseForm(false) 
  }

  function specsForCurrentProduct(){ 
    if(!detail || !purchase.product_id) return []
    const pid=Number(purchase.product_id)
    return (detail.items||[]).filter(it=>it.product_id===pid && (it.notes||'').trim()).map(it=>`${it.customer_name||'Cliente'}: ${it.notes}`) 
  }

function hasSpecs(){ return (specsForCurrentProduct().length>0) }
  function tryTogglePurchase(){ 
    if (hasSpecs() && !specSeen){ 
      setShowSpecsPopup(true); 
      setSpecSeen(true); 
      return 
    } 
    setShowPurchaseForm(v=>!v) 
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
        
        {selectedOrder && (
          <button
            onClick={() => setReconModalOpen(true)}
            style={{
              padding:'12px 24px',
              background:'var(--kivi-green)',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontSize:15,
              fontWeight:700,
              color:'#000',
              transition:'all 0.2s',
              whiteSpace:'nowrap'
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            🚚 Vuelta de Reconocimiento
          </button>
        )}
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
            <div style={{ display:'grid', gap:16 }}>
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

                    <div>
                      <button 
                        onClick={()=>openModalFor(g)} 
                        className="button" 
                        style={{ padding:'10px 20px', borderRadius:12, fontWeight:600 }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                )
              })}
        </div>
          )}
        </>
      )}

      {/* Modal de detalle/compra */}
      {modalOpen && currentProduct && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:600, borderRadius:20, maxHeight:'90vh', overflow:'auto' }}>
            <div style={{ borderBottom:'1px solid #f0f0f0', paddingBottom:16, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h3 style={{ margin:0, fontSize:22, fontWeight:700 }}>{currentProduct.name}</h3>
                <button onClick={()=>setModalOpen(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', opacity:0.6 }}>✕</button>
            </div>
              
              {(currentProduct.category || currentProduct.purchase_type) && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {currentProduct.category && (
                    <span style={{ background:'#f0f0f0', padding:'6px 12px', borderRadius:8, fontSize:13 }}>
                      {currentProduct.category === 'fruta' ? '🍎 Fruta' : '🥬 Verdura'}
                    </span>
                  )}
                  {currentProduct.purchase_type && (
                    <span style={{ background:'#f0f0f0', padding:'6px 12px', borderRadius:8, fontSize:13 }}>
                      {currentProduct.purchase_type === 'cajon' ? '📦 Cajón' : '🛒 Detalle'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Información de cantidades */}
            <div style={{ background:'#f8f9fa', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:12, opacity:0.7 }}>📊 Cantidades</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:14 }}>
                {(() => {
                  const g = (detail.group_by_product||[]).find(x=>x.product_id===Number(purchase.product_id))
                  if (!g) return null
                  const segments = qtySegments(g)
                  const missing = missingSegments(g)
                  return (
                    <>
                      <div>
                        <div style={{ opacity:0.6, fontSize:12, marginBottom:4 }}>Comprado</div>
                        <div style={{ fontWeight:600 }}>{segments[0]}</div>
                        <div style={{ fontWeight:600 }}>{segments[1]}</div>
                      </div>
                      <div>
                        <div style={{ opacity:0.6, fontSize:12, marginBottom:4 }}>Faltante</div>
                        {missing.map((m,i)=>(
                          <div key={i} style={{ fontWeight:600, color:'#d32f2f' }}>{m}</div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Clientes que pidieron este producto */}
            {(() => {
              const pid = Number(purchase.product_id)
              const items = (detail?.items||[]).filter(it=>it.product_id===pid)
              if (items.length === 0) return null
              return (
                <div style={{ background:'#f8f9fa', borderRadius:12, padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:12, opacity:0.7 }}>👥 Clientes</div>
                  <div style={{ display:'grid', gap:8 }}>
                    {items.map((it,i)=>(
                      <div key={i} style={{ fontSize:14, padding:'8px 12px', background:'white', borderRadius:8 }}>
                        <div style={{ fontWeight:600 }}>{it.customer_name}</div>
                        <div style={{ fontSize:13, opacity:0.7 }}>{it.qty} {it.unit}</div>
                        {it.notes && <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>📝 {it.notes}</div>}
                    </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Compras existentes */}
            {existingPurchases.length > 0 && (
              <div style={{ background:'#e8f5e9', borderRadius:12, padding:16, marginBottom:16, border:'1px solid #c8e6c9' }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'#2e7d32' }}>📦 Compras Registradas</div>
                <div style={{ display:'grid', gap:8 }}>
                  {existingPurchases.map((p,i)=>(
                    <div key={i} style={{ fontSize:13, padding:'10px 12px', background:'white', borderRadius:8, border:'1px solid #e0e0e0' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ fontWeight:700, color:'var(--kivi-text-dark)' }}>
                          {p.vendor || 'Sin proveedor'}
                        </div>
                        <button
                          onClick={() => setEditingPurchase(p)}
                          style={{
                            background:'var(--kivi-green)',
                            color:'white',
                            border:'none',
                            padding:'4px 12px',
                            borderRadius:6,
                            fontSize:12,
                            fontWeight:600,
                            cursor:'pointer'
                          }}
                        >
                          Editar
                        </button>
                      </div>
                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>
                        <strong>Cantidad:</strong> {p.qty_kg ? `${p.qty_kg} kg` : ''} {p.qty_unit ? `${p.qty_unit} unidades` : ''}
                      </div>
                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>
                        <strong>Precio:</strong> {toCLP(p.price_total)} ({toCLP(p.price_per_unit)} / {p.charged_unit})
                    </div>
                      {p.notes && (
                        <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>
                          📝 {p.notes}
                        </div>
                      )}
                  </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precios históricos */}
            {priceList.length > 0 && (
              <div style={{ background:'#f8f9fa', borderRadius:12, padding:16, marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:12, opacity:0.7 }}>💰 Precios históricos</div>
                <div style={{ display:'grid', gap:6 }}>
                  {priceList.slice(0,3).map((p,i)=>(
                    <div key={i} style={{ fontSize:13, padding:'6px 10px', background:'white', borderRadius:6 }}>
                      {toCLP(p.price_per_unit || 0)} / {p.unit} — {p.vendor || 'Sin proveedor'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Especificaciones/notas */}
            {hasSpecs() && (
              <div style={{ background:'#fff3e0', borderRadius:12, padding:16, marginBottom:16, border:'1px solid #ffe0b2' }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:8, color:'#f57c00' }}>📝 Especificaciones de clientes</div>
                <div style={{ fontSize:13, opacity:0.8 }}>
                  {specsForCurrentProduct().map((s,i)=>(
                    <div key={i} style={{ marginBottom:4 }}>• {s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para abrir formulario de compra */}
            {!showPurchaseForm && (
              <button 
                className="button" 
                onClick={tryTogglePurchase}
                style={{ width:'100%', padding:14, borderRadius:12, fontWeight:600, fontSize:15 }}
              >
                ➕ Registrar compra
              </button>
            )}

            {/* Formulario de compra */}
            {showPurchaseForm && (
              <div style={{ borderTop:'1px solid #e0e0e0', paddingTop:16 }}>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>📝 Nueva compra</div>
                
                {/* Cantidades */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Cantidad (kg)</label>
                    <input 
                      className="input" 
                      type="number" 
                      value={purchase.qty_kg} 
                      onChange={e=>setPurchase({...purchase, qty_kg:e.target.value})}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Cantidad (unidades)</label>
                    <input 
                      className="input" 
                      type="number" 
                      value={purchase.qty_unit} 
                      onChange={e=>setPurchase({...purchase, qty_unit:e.target.value})}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                    />
                  </div>
                </div>

                {/* Unidad de cobro */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Unidad de cobro</label>
                  <select 
                    className="input" 
                    value={purchase.charged_unit} 
                    onChange={e=>setPurchase({...purchase, charged_unit:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                  >
                    <option value="kg">Kilogramo</option>
                    <option value="unit">Unidad</option>
                  </select>
                </div>

                {/* Equivalencias (si se necesitan) */}
                {convRequired && (
                  <div style={{ background:'#fff3e0', borderRadius:10, padding:12, marginBottom:16, border:'1px solid #ffe0b2' }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#f57c00' }}>⚠️ Equivalencia necesaria</div>
                    {chargeUnit === 'kg' && qtyUnit > 0 && (
                      <div>
                        <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>
                          Kilos totales de las {qtyUnit} unidades
                        </label>
                        <input 
                          className="input" 
                          type="number" 
                          value={purchase.kg_units_total} 
                          onChange={e=>setPurchase({...purchase, kg_units_total:e.target.value})}
                          style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                        />
                      </div>
                    )}
                    {chargeUnit === 'unit' && qtyKg > 0 && (
                      <div>
                        <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>
                          Unidades totales de los {qtyKg} kg
                        </label>
                        <input 
                          className="input" 
                          type="number" 
                          value={purchase.units_kg_total} 
                          onChange={e=>setPurchase({...purchase, units_kg_total:e.target.value})}
                          style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Precio */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Precio por {chargeUnit==='kg'?'kg':'unidad'}</label>
                    <input 
                      className="input" 
                      type="number" 
                      value={purchase.price_per_unit} 
                      onChange={e=>onChangePricePerUnit(e.target.value)}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Precio total</label>
                    <input 
                      className="input" 
                      type="text" 
                      value={toCLP(purchase.price_total)} 
                      onChange={e=>onChangePriceTotal(e.target.value)}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                    />
                  </div>
                </div>

                {/* Proveedor */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Proveedor</label>
                  <input 
                    className="input" 
                    value={purchase.vendor} 
                    onChange={e=>setPurchase({...purchase, vendor:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                  />
                </div>

                {/* Clientes (si aplica) */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Clientes (separados por coma, si aplica)</label>
                  <input 
                    className="input" 
                    value={purchase.customers} 
                    onChange={e=>setPurchase({...purchase, customers:e.target.value})}
                    placeholder="Ej: Juan, María"
                    style={{ width:'100%', padding:'10px 12px', borderRadius:10 }}
                  />
                </div>

                {/* Notas */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, marginBottom:6, opacity:0.7 }}>Notas</label>
                  <textarea 
                    className="input" 
                    value={purchase.notes} 
                    onChange={e=>setPurchase({...purchase, notes:e.target.value})}
                    rows={3}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:10, resize:'vertical' }}
                  />
                </div>

                {/* Botones */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <button 
                    className="button ghost" 
                    onClick={()=>setShowPurchaseForm(false)}
                    style={{ padding:12, borderRadius:12, fontWeight:600 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="button" 
                    onClick={savePurchase}
                    style={{ padding:12, borderRadius:12, fontWeight:600 }}
                  >
                    ✓ Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de especificaciones */}
      {showSpecsPopup && (
        <div className="modal-backdrop" onClick={()=>setShowSpecsPopup(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:400, borderRadius:20 }}>
            <h3 style={{ margin:'0 0 16px 0', fontSize:18, fontWeight:700 }}>📝 Especificaciones</h3>
            <div style={{ fontSize:14, marginBottom:16, opacity:0.8 }}>
              {specsForCurrentProduct().map((s,i)=>(
                <div key={i} style={{ marginBottom:8 }}>• {s}</div>
              ))}
            </div>
            <button 
              className="button" 
              onClick={()=>{setShowSpecsPopup(false); setShowPurchaseForm(true)}}
              style={{ width:'100%', padding:12, borderRadius:12, fontWeight:600 }}
            >
              Continuar con la compra
            </button>
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

      {/* Modal Vuelta de Reconocimiento */}
      {reconModalOpen && (
        <VueltaReconocimientoModal
          open={reconModalOpen}
          onClose={() => setReconModalOpen(false)}
          products={products.map(p => ({
            product_id: p.id,
            product_name: p.name,
            default_unit: p.default_unit || 'kg',
            category: p.category
          }))}
          onSuccess={() => {
            alert('✓ Precios actualizados correctamente')
            setReconModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
