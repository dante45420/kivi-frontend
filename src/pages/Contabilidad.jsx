import { useEffect, useMemo, useState } from 'react'
import { listCharges, listPayments, createPayment, listLots, processLot, ordersSummary, customersSummary, updateChargePrice, updateChargeQuantity, assignLotToCustomer } from '../api/accounting'
import { getOrderDetail } from '../api/orders'
import { listCustomers } from '../api/customers'
import { listProducts } from '../api/products'
import '../styles/globals.css'

export default function Contabilidad(){
  const [period, setPeriod] = useState('7 dias')
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [charges, setCharges] = useState([])
  const [payments, setPayments] = useState([])
  const [lots, setLots] = useState([])
  const [payForm, setPayForm] = useState({ amount:'', method:'', reference:'', order_id:'' })
  const [processForm, setProcessForm] = useState({ from_lot:'', to_product:'', input_kg:'', output_qty:'', unit:'unit' })
  const [assignForm, setAssignForm] = useState({ lot_id:'', customer_id:'', order_id:'', unit_price:'' })
  const [orderCards, setOrderCards] = useState([])
  const [customerCards, setCustomerCards] = useState([])
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState(null) // { chargeId, price, qty }

  useEffect(()=>{ 
    listCustomers().then(setCustomers).catch(()=>{}) 
    listProducts().then(setProducts).catch(()=>{})
  },[])
  useEffect(()=>{
    async function load(){
      if (selectedCustomer){
        const ch = await listCharges({ customer_id:Number(selectedCustomer), status:'pending' })
        setCharges(ch)
        setPayments(await listPayments({ customer_id:Number(selectedCustomer) }))
        const orderIds = Array.from(new Set(ch.map(c=> c.order_id).filter(Boolean)))
        if (orderIds.length>0){ setPayForm(v=> ({ ...v, order_id: String(orderIds[0]) })) }
      }
      setLots(await listLots())
    }
    load().catch(()=>{})
  },[selectedCustomer])
  useEffect(()=>{ ordersSummary().then(setOrderCards).catch(()=>{}); customersSummary(false).then(setCustomerCards).catch(()=>{}) },[])

  const dueTotal = useMemo(()=> charges.reduce((s,c)=> s + Math.max(0,(c.total - c.discount_amount)), 0), [charges])

  async function addPayment(){ 
    if(!selectedCustomer||!payForm.amount) return
    const payload={ customer_id:Number(selectedCustomer), amount:Number(payForm.amount), method:payForm.method||null, reference:payForm.reference||null, applications:[] }
    if ((payForm.order_id||'').trim()) payload.order_id = Number(payForm.order_id)
    await createPayment(payload)
    setPayForm({ amount:'', method:'', reference:'', order_id:'' })
    setPayments(await listPayments({ customer_id:Number(selectedCustomer) }))
    setCharges(await listCharges({ customer_id:Number(selectedCustomer), status:'pending' }))
  }
  
  async function doProcess(){ 
    const lot = lots.find(l=> String(l.id)===String(processForm.from_lot))
    if(!lot) return
    await processLot({ 
      from_product_id: lot.product_id, 
      to_product_id: Number(processForm.to_product), 
      input_qty_kg: Number(processForm.input_kg||lot.qty_kg||0), 
      output_qty: Number(processForm.output_qty||0), 
      unit: processForm.unit||'unit' 
    })
    setProcessForm({ from_lot:'', to_product:'', input_kg:'', output_qty:'', unit:'unit' })
    setLots(await listLots())
  }

  async function saveCharge() {
    if (!editingCharge) return
    await updateChargePrice(editingCharge.chargeId, Number(editingCharge.price))
    await updateChargeQuantity(editingCharge.chargeId, Number(editingCharge.qty))
    setEditingCharge(null)
    // Recargar datos del cliente
    const rows = await customersSummary(true)
    const row = rows.find(r=> r.customer.id === customerDetail.customer.id)
    setCustomerDetail(row || customerDetail)
  }

  async function assignExcess() {
    if (!assignForm.lot_id || !assignForm.customer_id) return
    await assignLotToCustomer(Number(assignForm.lot_id), {
      customer_id: Number(assignForm.customer_id),
      order_id: assignForm.order_id ? Number(assignForm.order_id) : null,
      unit_price: assignForm.unit_price ? Number(assignForm.unit_price) : null
    })
    setAssignForm({ lot_id:'', customer_id:'', order_id:'', unit_price:'' })
    setLots(await listLots())
    // Recargar datos
    ordersSummary().then(setOrderCards).catch(()=>{})
    customersSummary(false).then(setCustomerCards).catch(()=>{})
  }

  return (
    <div className="center" style={{ padding:'0 12px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'20px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:28, fontWeight:800 }}>📊 Contabilidad</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:14 }}>Resumen financiero y gestión de pagos</p>
      </div>

      {/* Filtros de periodo */}
      <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:20 }}>
        <select className="input" value={period} onChange={e=>setPeriod(e.target.value)} style={{ maxWidth:200, textAlign:'center', textAlignLast:'center', padding:'10px 16px', borderRadius:12 }}>
          <option>7 dias</option>
          <option>1 mes</option>
          <option>1 año</option>
          <option>Histórica</option>
        </select>
      </div>

      {/* Sección: Resumen por Pedido */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>📦 Por Pedido</h3>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
      </div>

        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
          {orderCards.map((o,i)=> (
            <button 
              key={i} 
              className="button ghost" 
              onClick={async()=>{ setOrderDetail(await getOrderDetail(o.order.id)); setOrderModalOpen(true) }} 
              style={{ 
                minWidth:280, 
                textAlign:'left', 
                background:'white', 
                borderRadius:16, 
                border:'1px solid #e0e0e0', 
                padding:16,
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                transition:'all 0.2s',
              }}
              onMouseOver={e=> e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={e=> e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{o.order.title || `Pedido #${o.order.id}`}</div>
                <span className={`badge ${o.purchase_status==='complete'?'ok':(o.purchase_status==='over'?'warn':'danger')}`} style={{ fontSize:11 }}>
                  {o.purchase_status==='complete'?'✓ Listo':(o.purchase_status==='over'?'⚠ Exceso':'⏳ Faltante')}
                </span>
              </div>
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, fontSize:13 }}>
                <div>
                  <div style={{ opacity:0.6, fontSize:11 }}>Comprado</div>
                  <div style={{ fontWeight:600 }}>${Number(o.bought_money||0).toLocaleString('es-CL')}</div>
                </div>
                <div>
                  <div style={{ opacity:0.6, fontSize:11 }}>Falta</div>
                  <div style={{ fontWeight:600 }}>${Number(o.missing_money||0).toLocaleString('es-CL')}</div>
                </div>
                <div>
                  <div style={{ opacity:0.6, fontSize:11 }}>Costo</div>
                  <div style={{ fontWeight:600 }}>${Number(o.cost||0).toLocaleString('es-CL')}</div>
                </div>
                <div>
                  <div style={{ opacity:0.6, fontSize:11 }}>Facturado</div>
                  <div style={{ fontWeight:600 }}>${o.billed.toLocaleString('es-CL')}</div>
                </div>
              </div>

              {(o.bought_tags?.length||0)>0 || (o.missing_tags?.length||0)>0 ? (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                  {(o.bought_tags||[]).slice(0,4).map((t,idx)=> (
                    <span key={`b${idx}`} className="badge ok" style={{ fontSize:10 }}>
                      {t.kg>0?`${t.kg}kg`:''}{t.kg>0&&t.unit>0?' · ':''}{t.unit>0?`${t.unit}u`:''}
                    </span>
                  ))}
                  {(o.missing_tags||[]).slice(0,4).map((t,idx)=> (
                    <span key={`m${idx}`} className="badge danger" style={{ fontSize:10 }}>
                      {t.kg>0?`${t.kg}kg`:''}{t.kg>0&&t.unit>0?' · ':''}{t.unit>0?`${t.unit}u`:''}
                    </span>
                  ))}
                </div>
              ) : null}

              <div style={{ height:1, background:'#f0f0f0', margin:'12px 0' }} />
              
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <div>
                  <div style={{ opacity:0.6, fontSize:11 }}>Deuda</div>
                  <div style={{ fontWeight:700, color:'#d32f2f' }}>${o.due.toLocaleString('es-CL')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ opacity:0.6, fontSize:11 }}>Utilidad</div>
                  <div style={{ fontWeight:700, color:'#2e7d32' }}>
                    ${Number(o.profit_amount||0).toLocaleString('es-CL')} ({Number(o.profit_pct||0).toFixed(1)}%)
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sección: Resumen por Cliente */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>👤 Por Cliente</h3>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
        </div>
        
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
          {customerCards.map((c,i)=> (
            <button 
              key={i} 
              className="button ghost" 
              onClick={async()=>{ 
                const rows=await customersSummary(true)
                const row=rows.find(r=> r.customer.id===c.customer.id)
                setCustomerDetail(row||c)
                setCustomerModalOpen(true)
              }} 
              style={{ 
                minWidth:240, 
                textAlign:'left', 
                background:'white', 
                borderRadius:16, 
                border:'1px solid #e0e0e0', 
                padding:16,
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                transition:'all 0.2s',
              }}
              onMouseOver={e=> e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={e=> e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}
            >
              <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>{c.customer.name}</div>
              
              <div style={{ display:'grid', gap:6, fontSize:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ opacity:0.6 }}>Facturado</span>
                  <span style={{ fontWeight:600 }}>${c.billed.toLocaleString('es-CL')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ opacity:0.6 }}>Pagado</span>
                  <span style={{ fontWeight:600 }}>${c.paid.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div style={{ height:1, background:'#f0f0f0', margin:'10px 0' }} />
              
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, opacity:0.6 }}>Deuda</span>
                <span style={{ fontWeight:700, fontSize:16, color:'#d32f2f' }}>${c.due.toLocaleString('es-CL')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sección: Registrar Pago */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>💰 Registrar Pago</h3>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
        </div>

        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:16 }}>
          <div style={{ display:'grid', gap:12, marginBottom:12 }}>
            <select 
              className="input" 
              value={selectedCustomer} 
              onChange={e=>setSelectedCustomer(e.target.value)} 
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {selectedCustomer && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    placeholder="ID Pedido" 
                    value={payForm.order_id} 
                    onChange={e=>setPayForm(v=>({ ...v, order_id:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Monto" 
                    value={payForm.amount} 
                    onChange={e=>setPayForm(v=>({ ...v, amount:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    placeholder="Método (ej: Transferencia)" 
                    value={payForm.method} 
                    onChange={e=>setPayForm(v=>({ ...v, method:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                  <input 
                    className="input" 
                    placeholder="Referencia" 
                    value={payForm.reference} 
                    onChange={e=>setPayForm(v=>({ ...v, reference:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                </div>

                <button 
                  className="button" 
                  onClick={addPayment} 
                  disabled={!selectedCustomer || !payForm.amount || !(payForm.order_id||'').trim()}
                  style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600 }}
                >
                  ✓ Registrar pago
                </button>

                {/* Resumen del cliente seleccionado */}
                <div style={{ background:'#f8f9fa', borderRadius:12, padding:12, marginTop:4 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, textAlign:'center', fontSize:13 }}>
                    <div>
                      <div style={{ opacity:0.6, fontSize:11 }}>Por cobrar</div>
                      <div style={{ fontWeight:700, fontSize:16 }}>${dueTotal.toLocaleString('es-CL')}</div>
                    </div>
                    <div>
                      <div style={{ opacity:0.6, fontSize:11 }}>Pagos</div>
                      <div style={{ fontWeight:700, fontSize:16 }}>${payments.reduce((s,p)=> s + (p.amount||0),0).toLocaleString('es-CL')}</div>
                    </div>
                    <div>
                      <div style={{ opacity:0.6, fontSize:11 }}>Descuentos</div>
                      <div style={{ fontWeight:700, fontSize:16 }}>${charges.reduce((s,c)=> s + (c.discount_amount||0),0).toLocaleString('es-CL')}</div>
                    </div>
          </div>
          </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sección: Procesar Excedentes */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>🔄 Gestionar Excedentes</h3>
          <div style={{ height:1, background:'#ddd', flex:1 }} />
      </div>

        {/* Asignar a Cliente */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:16, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>📤 Asignar a Cliente (Venta)</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              value={assignForm.lot_id} 
              onChange={e=>setAssignForm(v=>({ ...v, lot_id:e.target.value }))} 
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar excedente...</option>
              {lots.filter(l=> (l.status||'')==='unassigned').map(l=> {
                const product = products.find(p=> p.id === l.product_id)
                const productName = product ? product.name : `Producto #${l.product_id}`
                return (
                  <option key={l.id} value={l.id}>
                    {productName} — {l.qty_kg||l.qty_unit} {(l.qty_kg?'kg':'unid')}
                  </option>
                )
              })}
            </select>

            {assignForm.lot_id && (
              <>
                <select 
                  className="input" 
                  value={assignForm.customer_id} 
                  onChange={e=>setAssignForm(v=>({ ...v, customer_id:e.target.value }))} 
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
                >
                  <option value="">Seleccionar cliente...</option>
            {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="ID Pedido (opcional)" 
                    value={assignForm.order_id} 
                    onChange={e=>setAssignForm(v=>({ ...v, order_id:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Precio (opcional)" 
                    value={assignForm.unit_price} 
                    onChange={e=>setAssignForm(v=>({ ...v, unit_price:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                </div>

                <button 
                  className="button" 
                  onClick={assignExcess} 
                  disabled={!assignForm.lot_id || !assignForm.customer_id}
                  style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600 }}
                >
                  ✓ Asignar como Venta
                </button>
              </>
            )}
          </div>
        </div>

        {/* Procesar (transformar) */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:16 }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>🔄 Procesar (Transformar)</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              value={processForm.from_lot} 
              onChange={e=>setProcessForm(v=>({ ...v, from_lot:e.target.value }))} 
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar excedente...</option>
              {lots.filter(l=> (l.status||'')==='unassigned').map(l=> (
                <option key={l.id} value={l.id}>
                  #{l.id} — P{l.product_id} — {l.qty_kg||l.qty_unit} {(l.qty_kg?'kg':'unid')}
                </option>
              ))}
            </select>

            {processForm.from_lot && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="ID Producto jugo" 
                    value={processForm.to_product} 
                    onChange={e=>setProcessForm(v=>({ ...v, to_product:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Kg entrada" 
                    value={processForm.input_kg} 
                    onChange={e=>setProcessForm(v=>({ ...v, input_kg:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
        </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Cantidad salida" 
                    value={processForm.output_qty} 
                    onChange={e=>setProcessForm(v=>({ ...v, output_qty:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  />
                  <select 
                    className="input" 
                    value={processForm.unit} 
                    onChange={e=>setProcessForm(v=>({ ...v, unit:e.target.value }))} 
                    style={{ padding:'12px 16px', borderRadius:12 }}
                  >
                    <option value="unit">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="lt">Litro</option>
                  </select>
            </div>

                <button 
                  className="button" 
                  onClick={doProcess} 
                  disabled={!processForm.from_lot || !processForm.to_product}
                  style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600 }}
                >
                  ✓ Procesar
                </button>
              </>
            )}
          </div>

          {lots.length > 0 && (
            <div style={{ marginTop:16, borderTop:'1px solid #f0f0f0', paddingTop:12 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8, opacity:0.7 }}>Lotes disponibles:</div>
              <div style={{ maxHeight:180, overflow:'auto' }}>
                {lots.map((l,i)=> (
                  <div 
                    key={i} 
                    style={{ 
                      display:'flex', 
                      justifyContent:'space-between', 
                      padding:'8px 12px', 
                      background: i%2===0 ? '#f8f9fa' : 'white',
                      borderRadius:8,
                      fontSize:13,
                      marginBottom:4
                    }}
                  >
                    <div style={{ fontWeight:500 }}>#{l.id} — Prod {l.product_id}</div>
                    <div style={{ opacity:0.8 }}>
                      {l.qty_kg? `${l.qty_kg} kg` : `${l.qty_unit||0} unid`} · <span style={{ fontSize:11, opacity:0.6 }}>{l.status}</span>
      </div>
      </div>
                ))}
        </div>
            </div>
          )}
        </div>
      </div>

      {orderModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:600, borderRadius:20 }}>
            <div style={{ borderBottom:'1px solid #f0f0f0', paddingBottom:16, marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>📦 {orderDetail?.order?.title || 'Pedido'}</h3>
            </div>
            
            <div style={{ maxHeight:320, overflow:'auto', marginBottom:16 }}>
              {(orderDetail?.items||[]).map(it=> {
                const alloc = Number(it.allocated_qty||0)
                const missing = Math.max(0, Number(it.qty||0) - alloc)
                return (
                  <div 
                    key={it.id} 
                    style={{ 
                      background:'#f8f9fa', 
                      borderRadius:12, 
                      padding:12, 
                      marginBottom:8,
                      border:'1px solid #e8e8e8'
                    }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{it.product_name}</div>
                        <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>{it.customer_name}</div>
                      </div>
                      <div style={{ textAlign:'right', fontWeight:600 }}>{it.qty} {it.unit}</div>
                    </div>
                    
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {alloc>0 ? (
                        <span className="badge ok" style={{ fontSize:11 }}>
                          ✓ comprado {alloc}{it.unit==='unit'?'u':'kg'}
                        </span>
                      ) : null}
                      {missing>0 ? (
                        <span className="badge danger" style={{ fontSize:11 }}>
                          ⏳ falta {missing}{it.unit==='unit'?'u':'kg'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <button 
              className="button" 
              onClick={()=>setOrderModalOpen(false)}
              style={{ width:'100%', padding:12, borderRadius:12, fontWeight:600 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {customerModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:600, borderRadius:20 }}>
            <div style={{ borderBottom:'1px solid #f0f0f0', paddingBottom:16, marginBottom:16 }}>
              <h3 style={{ margin:'0 0 12px 0', fontSize:20, fontWeight:700 }}>👤 {customerDetail?.customer?.name || 'Cliente'}</h3>
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, textAlign:'center' }}>
                <div style={{ background:'#f8f9fa', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>Facturado</div>
                  <div style={{ fontWeight:700, fontSize:20 }}>${Number(customerDetail?.billed||0).toLocaleString('es-CL')}</div>
                </div>
                <div style={{ background:'#f8f9fa', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>Pagado</div>
                  <div style={{ fontWeight:700, fontSize:20 }}>${Number(customerDetail?.paid||0).toLocaleString('es-CL')}</div>
                </div>
                <div style={{ background:'#fff3e0', borderRadius:12, padding:16, border:'1px solid #ffe0b2' }}>
                  <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>Deuda</div>
                  <div style={{ fontWeight:700, fontSize:20, color:'#d32f2f' }}>${Number(customerDetail?.due||0).toLocaleString('es-CL')}</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:12, opacity:0.7 }}>Pedidos:</div>
              <div style={{ maxHeight:400, overflow:'auto' }}>
              {(customerDetail?.orders||[]).map((o,i)=> (
                  <div 
                    key={i} 
                    style={{ 
                      background: i%2===0 ? '#f8f9fa' : 'white',
                      borderRadius:10,
                      padding:16,
                      marginBottom:12,
                      border:'1px solid #e8e8e8'
                    }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ fontWeight:600, fontSize:16 }}>Pedido #{o.order_id||'-'}</div>
                      <div style={{ display:'flex', gap:12, fontSize:14 }}>
                        <span>💰 ${Number(o.billed||0).toLocaleString('es-CL')}</span>
                        <span>✓ ${Number(o.paid||0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                    
                    {/* Productos del pedido */}
                    {(o.products||[]).length > 0 && (
                      <div style={{ borderTop:'1px solid #e8e8e8', paddingTop:12, marginTop:12 }}>
                        {o.products.map((p,idx)=> (
                          <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, padding:'10px 0', gap:12 }}>
                            <span style={{ opacity:0.8, flex:1, fontWeight:500 }}>{p.product_name}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              {editingCharge?.chargeId === p.charge_id ? (
                                <>
                                  <input 
                                    type="number"
                                    placeholder="Cant"
                                    value={editingCharge.qty}
                                    onChange={e=> setEditingCharge({...editingCharge, qty:e.target.value})}
                                    style={{ width:70, padding:'6px 10px', borderRadius:6, border:'1px solid #ddd', fontSize:14 }}
                                  />
                                  <span style={{ fontSize:14 }}>{p.unit} ×</span>
                                  <input 
                                    type="number"
                                    placeholder="Precio"
                                    value={editingCharge.price}
                                    onChange={e=> setEditingCharge({...editingCharge, price:e.target.value})}
                                    style={{ width:90, padding:'6px 10px', borderRadius:6, border:'1px solid #ddd', fontSize:14 }}
                                    autoFocus
                                  />
                                  <button onClick={saveCharge} style={{ padding:'6px 10px', borderRadius:6, background:'#2e7d32', color:'white', border:'none', cursor:'pointer', fontSize:12 }}>✓</button>
                                  <button onClick={()=>setEditingCharge(null)} style={{ padding:'6px 10px', borderRadius:6, background:'#d32f2f', color:'white', border:'none', cursor:'pointer', fontSize:12 }}>✕</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ fontWeight:600, fontSize:14 }}>
                                    {p.charged_qty ?? p.qty} {p.unit} × ${Number(p.unit_price||0).toLocaleString('es-CL')}
                                  </span>
                                  <button 
                                    onClick={()=>setEditingCharge({chargeId:p.charge_id, price:p.unit_price, qty:p.charged_qty ?? p.qty})} 
                                    style={{ padding:'4px 8px', borderRadius:6, background:'#f0f0f0', border:'none', cursor:'pointer', fontSize:12 }}
                                  >
                                    ✏️
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
            </div>
            
            <button 
              className="button" 
              onClick={()=>setCustomerModalOpen(false)}
              style={{ width:'100%', padding:12, borderRadius:12, fontWeight:600 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


