import { useEffect, useState } from 'react'
import { listOrders, getOrderDetail } from '../api/orders'
import { apiFetch } from '../api/client'
import { listProducts } from '../api/products'
import { listPrices } from '../api/prices'
import QualityModal from '../components/QualityModal'
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
  const [custSelect, setCustSelect] = useState('')

  useEffect(() => { listOrders().then(os => { setOrders(os); const lastEmitted = os.find(o => o.status === 'emitido') || os[0]; if (lastEmitted) setSelectedOrder(lastEmitted.id) }).catch(() => {}) ; listProducts().then(setProducts).catch(() => {}) }, [])
  useEffect(() => { if (!selectedOrder) return; getOrderDetail(selectedOrder).then(d => { setDetail(d); const m={}; (d.group_by_product||[]).forEach(g=>{m[g.product_id]=(g.totals?.kg||0)>0?'kg':'unit'}); setRowChargeType(m) }).catch(()=>{}) }, [selectedOrder])
  useEffect(() => { if (!modalOpen || !purchase.product_id) { setPriceList([]); return } listPrices(Number(purchase.product_id)).then(setPriceList).catch(() => {}) }, [modalOpen, purchase.product_id])

  function openQuality(pid){ const p=products.find(x=>x.id===Number(pid)); setQualityProduct(p||null); setShowQuality(true) }
  const parseNum = (v)=>{ const n=parseFloat(v); return isNaN(n)?0:n }

  // Conversión y cálculo automático
  const chargeUnit = purchase.charged_unit === 'unit' ? 'unit' : 'kg'
  const qtyKg = parseNum(purchase.qty_kg)
  const qtyUnit = parseNum(purchase.qty_unit)
  // Nueva conversión minimalista y contextual
  // Si se cobra por kg y hay unidades, se exige "Kilos totales" para esas unidades
  // Si se cobra por unidad y hay kilos, se exige "Unidades totales" para esos kilos
  const unitsKgTotal = purchase.units_kg_total ? parseNum(purchase.units_kg_total) : 0 // unidades totales derivadas de kg
  const kgUnitsTotal = purchase.kg_units_total ? parseNum(purchase.kg_units_total) : 0 // kilos totales derivados de unidades
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
    // Clientes obligatorios si la compra no completa el producto
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
    // Registrar monto facturado esperado: precio venta esperado (de Pedidos) * chargeQty
    try{
      const pid = Number(purchase.product_id)
      const it = (detail?.items||[]).filter(x=>x.product_id===pid).find(x=> Number(x.sale_unit_price||0)>0)
      if (it){ payload.billed_expected = Number(it.sale_unit_price||0) * chargeQty }
    }catch{}
    // Enviar equivalencias explícitas para que contabilidad observe el ratio correcto
    try{
      if (purchase.charged_unit==='kg' && (purchase.kg_units_total||'').toString().trim()){
        payload.eq_qty_kg = Number(purchase.kg_units_total)
      }
      if (purchase.charged_unit==='unit' && (purchase.units_kg_total||'').toString().trim()){
        payload.eq_qty_unit = Number(purchase.units_kg_total)
      }
    }catch{}
    await apiFetch('/purchases',{method:'POST',body:payload}); const d=await getOrderDetail(selectedOrder); setDetail(d); setModalOpen(false); setShowPurchaseForm(false)
  }

  function stateBadge(g){ const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}; const needKg=g.totals?.kg||0, needUnit=g.totals?.unit||0; const gotKg=purchased.kg||0, gotUnit=purchased.unit||0; const hasKg=needKg>0, hasUnit=needUnit>0; const over=(hasKg&&gotKg>needKg)||(hasUnit&&gotUnit>needUnit); const complete=(!hasKg||gotKg===needKg)&&(!hasUnit||gotUnit===needUnit); let cls='badge danger', txt='Faltante'; if(over){ cls='badge warn'; txt='Exceso' } else if(complete){ cls='badge ok'; txt='Listo' } return <span className={cls} style={{ marginTop:6 }}>{txt}</span> }
  function qtySegments(g){ const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}; const needKg=(g.totals?.kg||0); const needUnit=(g.totals?.unit||0); const gotKg=(purchased.kg||0); const gotUnit=(purchased.unit||0); return [`${gotKg}/${needKg} kg`, `${gotUnit}/${needUnit} unit`] }
  function missingSegments(g){ const purchased=(detail?.purchased_by_product||{})[g.product_id]||{}; const needKg=g.totals?.kg||0, needUnit=g.totals?.unit||0; const gotKg=purchased.kg||0, gotUnit=purchased.unit||0; const missKg=Math.max(0,(needKg||0)-(gotKg||0)); const missUnit=Math.max(0,(needUnit||0)-(gotUnit||0)); const parts=[]; if(needKg>0) parts.push(`${missKg} kg`); if(needUnit>0) parts.push(`${missUnit} unit`); return parts }
function openModalFor(g){ const prod=products.find(x=>x.id===Number(g.product_id)); const defUnit=prod?.default_unit||rowChargeType[g.product_id]||'kg'; setPurchase({ product_id:String(g.product_id), qty_kg:'', qty_unit:'', charged_unit:defUnit, price_total:'', price_per_unit:'', vendor:'', notes:'', customers:'', units_kg_total:'', kg_units_total:'' }); setSpecSeen(false); setModalOpen(true); setShowPurchaseForm(false) }

function specsForCurrentProduct(){ if(!detail || !purchase.product_id) return []; const pid=Number(purchase.product_id); return (detail.items||[]).filter(it=>it.product_id===pid && (it.notes||'').trim()).map(it=>`${it.customer_name||'Cliente'}: ${it.notes}`) }
function hasSpecs(){ return (specsForCurrentProduct().length>0) }
function tryTogglePurchase(){ if (hasSpecs() && !specSeen){ setShowSpecsPopup(true); setSpecSeen(true); return } setShowPurchaseForm(v=>!v) }

  return (
    <div className="center">
      <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'8px 0' }}>
        <select className="input" style={{ width:'auto', borderRadius:999, padding:'8px 12px' }} value={selectedOrder || ''} onChange={e=>setSelectedOrder(Number(e.target.value))}>
          {orders.map(o=> (<option key={o.id} value={o.id}>{o.title || `Pedido #${o.id}`}</option>))}
        </select>
      </div>

      {!selectedOrder ? (<div style={{ opacity:0.8, marginTop:16 }}>Selecciona un pedido</div>) : !detail ? (<div>Cargando...</div>) : (
        <div className="card">
          <div className="table">
            <div className="table-header" style={{ gridTemplateColumns:'1.5fr 2fr 0.4fr' }}>
              <div className="th">Producto</div>
              <div className="th">Cantidades</div>
              <div className="th">Info</div>
            </div>
            {(detail.group_by_product||[]).map(g=> (
              <div key={g.product_id} className="table-row" style={{ gridTemplateColumns:'1.5fr 2fr 0.4fr' }}>
                <div className="td">{g.product_name}</div>
                <div className="td" style={{ display:'flex', flexDirection:'column', alignItems:'center', whiteSpace:'normal' }}>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}> {qtySegments(g).map((t,i)=>(<span key={i}>{t}{i<qtySegments(g).length-1?' - ':''}</span>))} </div>
                  {stateBadge(g)}
                </div>
                <div className="td" style={{ padding:'10px 16px', display:'flex', justifyContent:'center', alignItems:'center' }}>
                  <button onClick={()=>openModalFor(g)} className="button ghost" title="Detalle" style={{ padding:'6px 10px' }}>ℹ️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3 style={{ marginTop:0, marginBottom:8 }}>Detalle de compra</h3>
              <button className="button ghost" onClick={()=>setModalOpen(false)}>Cerrar</button>
            </div>
            <div style={{ marginBottom:8, fontWeight:800 }}>{(detail?.products?.[Number(purchase.product_id)]||purchase.product_id)}</div>

            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:8 }}>
              <button className="button ghost" onClick={()=>setShowSpecsPopup(true)}>🗣️ Especificaciones</button>
              <button className="button ghost" onClick={()=>openQuality(Number(purchase.product_id))}>Pro tip</button>
            </div>

            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <button className="button" onClick={()=>{ if(!specSeen && (specsForCurrentProduct().length>0)){ setShowSpecsPopup(true); setSpecSeen(true); return } setShowPurchaseForm(v=>!v) }}>{showPurchaseForm? 'Ocultar compra' : 'Anotar compra'}</button>
            </div>

            {showPurchaseForm && (
              <div style={{ display:'grid', gap:10 }}>
                <label>Tipo de cobro
                  <select value={purchase.charged_unit} onChange={e=>setPurchase({ ...purchase, charged_unit:e.target.value })} className="input">
                    <option value="kg">Por kilo</option>
                    <option value="unit">Por unidad</option>
                  </select>
                </label>
                <label>Kilos comprados
                  <input className="input" placeholder={(detail?.group_by_product||[]).find(x=>String(x.product_id)===purchase.product_id)?.totals?.kg? String(Math.max(0, ((detail.group_by_product.find(x=>String(x.product_id)===purchase.product_id)?.totals?.kg)||0) - (((detail.purchased_by_product||{})[Number(purchase.product_id)]||{}).kg||0))): '0'} value={purchase.qty_kg} onChange={e=>setPurchase({ ...purchase, qty_kg:e.target.value })} />
                </label>
                {chargeUnit==='unit' && qtyKg>0 ? (
                  <label>Conversión — Unidades totales (desde kg)
                    <input className="input" placeholder="Unidades totales (desde kg) – faltante" value={purchase.units_kg_total} onChange={e=>setPurchase({ ...purchase, units_kg_total:e.target.value })} />
                  </label>
                ) : null}
                <label>Unidades compradas
                  <input className="input" placeholder={(detail?.group_by_product||[]).find(x=>String(x.product_id)===purchase.product_id)?.totals?.unit? String(Math.max(0, ((detail.group_by_product.find(x=>String(x.product_id)===purchase.product_id)?.totals?.unit)||0) - (((detail.purchased_by_product||{})[Number(purchase.product_id)]||{}).unit||0))): '0'} value={purchase.qty_unit} onChange={e=>setPurchase({ ...purchase, qty_unit:e.target.value })} />
                </label>
                {chargeUnit==='kg' && qtyUnit>0 ? (
                  <label>Conversión — Kilos totales (desde unid)
                    <input className="input" placeholder="Kilos totales (desde unid) – faltante" value={purchase.kg_units_total} onChange={e=>setPurchase({ ...purchase, kg_units_total:e.target.value })} />
                  </label>
                ) : null}
                <div className="card" style={{ padding:12 }}>
                  <div style={{ display:'grid', gap:8 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:12, opacity:0.7 }}>Total a cobrar ({purchase.charged_unit==='unit'?'unid':'kg'})</div>
                      <div style={{ fontWeight:800, fontSize:18 }}>{chargeQty.toFixed(3).replace(/\.0+$/,'')}</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:12, opacity:0.7 }}>Total a pagar</div>
                      <div style={{ fontWeight:800, fontSize:18 }}>{toCLP(purchase.price_total)}</div>
                    </div>
                    <label>Ingresar total a pagar (opcional)
                      <input className="input" placeholder="$0" value={toCLP(purchase.price_total)} onChange={e=> onChangePriceTotal(e.target.value) } />
                    </label>
                    <label>Costo por {purchase.charged_unit==='unit'?'unidad':'kg'}
                      <input className="input" placeholder="$0" value={toCLP(purchase.price_per_unit)} onChange={e=> onChangePricePerUnit(parseCLP(e.target.value)) } />
                    </label>
                  {/* Precio de venta esperado desde el pedido (variante / override) y monto facturado esperado */}
                  {(() => {
                    try{
                      const pid = Number(purchase.product_id)
                      const it = (detail?.items||[]).filter(x=>x.product_id===pid).find(x=> Number(x.sale_unit_price||0)>0)
                      if(!it) return null
                      const unitPrice = Number(it.sale_unit_price||0)
                      const totalSale = unitPrice * chargeQty
                      return (
                        <div style={{ textAlign:'center', opacity:0.9 }}>
                          <div style={{ fontSize:12 }}>Precio venta esperado (editar en Pedidos)</div>
                          <div style={{ fontWeight:800, fontSize:16 }}>{toCLP(unitPrice)} × {chargeQty.toFixed(3).replace(/\.0+$/,'')} {purchase.charged_unit==='unit'?'unid':'kg'}</div>
                          <div style={{ fontSize:12, opacity:0.8, marginTop:2 }}>Monto facturado esperado</div>
                          <div style={{ fontWeight:800, fontSize:18 }}>{toCLP(totalSale)}</div>
                        </div>
                      )
                    }catch{ return null }
                  })()}
                    {/* Mostrar variante seleccionada si existe en Pedidos para este producto */}
                    {(() => { try{ const pid=Number(purchase.product_id); const row=(detail?.items||[]).find(it=> it.product_id===pid && (it.notes||'').startsWith('variant_id:')); if(!row) return null; const vid = (row.notes||'').split(':',1)[0]? null : null; }catch{return null} })()}
                  </div>
                </div>
                {(() => { const pid=Number(purchase.product_id); const g=(detail?.group_by_product||[]).find(x=>x.product_id===pid); const purchased=(detail?.purchased_by_product||{})[pid]||{ kg:0, unit:0 }; const needKg=(g?.totals?.kg||0), needUnit=(g?.totals?.unit||0); const afterKg=(purchased.kg||0)+qtyKg; const afterUnit=(purchased.unit||0)+qtyUnit; const incomplete=(needKg>afterKg)||(needUnit>afterUnit); const someInput=(qtyKg>0||qtyUnit>0); return (incomplete && someInput) })() ? (
                  <label>Clientes (si incompleto)
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:6, flexWrap:'wrap' }}>
                      <select className="input" value={custSelect} onChange={e=>setCustSelect(e.target.value)} style={{ width:260, textAlign:'center', textAlignLast:'center' }}>
                        <option value="">Seleccionar del pedido…</option>
                        {(() => { try{ const pid=Number(purchase.product_id); const g=(detail?.group_by_product||[]).find(x=>x.product_id===pid); return (g?.customers||[]).map(c=> c.customer_name).filter(Boolean) }catch{return []} })().map((n,i)=> <option key={i} value={n}>{n}</option>)}
                      </select>
                      <button className="button ghost" onClick={()=>{ if(!custSelect) return; const list=(purchase.customers||'').split(',').map(s=>s.trim()).filter(Boolean); if(!list.includes(custSelect)) list.push(custSelect); setPurchase({ ...purchase, customers: list.join(', ') }); setCustSelect('') }}>Agregar</button>
                      <input className="input" placeholder="o escribe: Roberta, Dante" value={purchase.customers} onChange={e=>setPurchase({ ...purchase, customers:e.target.value })} style={{ flex:1 }} />
                    </div>
                  </label>
                ) : null}
                <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  <button onClick={()=>setModalOpen(false)} className="button ghost" style={{ minWidth:120 }}>Cancelar</button>
                  <button onClick={savePurchase} disabled={convRequired} className="button" style={{ minWidth:120, opacity: convRequired? 0.7: 1 }}>Guardar</button>
                </div>
              </div>
            )}

            {showSpecsPopup && (
              <div className="modal-backdrop" style={{ background:'rgba(0,0,0,0.15)' }}>
                <div className="modal" style={{ width:340 }}>
                  <h4 style={{ marginTop:0 }}>Especificaciones del pedido</h4>
                  <div style={{ maxHeight:220, overflow:'auto' }}>
                    {(specsForCurrentProduct().length>0) ? (
                      <ul>
                        {specsForCurrentProduct().map((t,i)=>(<li key={i}>{t}</li>))}
                      </ul>
                    ) : (
                      <div>-</div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8 }}>
                    <button className="button" onClick={()=>setShowSpecsPopup(false)}>Listo</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <QualityModal open={showQuality} onClose={()=>setShowQuality(false)} product={qualityProduct} />
    </div>
  )
}
