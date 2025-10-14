import { useEffect, useState } from 'react'
import { ordersSummary, customersSummary, updateChargePrice, updateChargeQuantity, changeChargeOrder, returnChargeToExcess, listLots, assignLotToCustomer, markLotAsWaste } from '../api/accounting'
import { listCustomers } from '../api/customers'
import { listProducts } from '../api/products'
import { listOrders } from '../api/orders'
import '../styles/globals.css'

export default function ContabilidadNew(){
  const [orderCards, setOrderCards] = useState([])
  const [customerCards, setCustomerCards] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [lots, setLots] = useState([])
  
  // Estados de expansión
  const [expandedOrders, setExpandedOrders] = useState({})
  const [expandedOrderCustomers, setExpandedOrderCustomers] = useState({})
  const [expandedOrderProducts, setExpandedOrderProducts] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [expandedCustomerOrders, setExpandedCustomerOrders] = useState({})
  const [expandedCustomerProducts, setExpandedCustomerProducts] = useState({})
  
  // Estados de edición
  const [editingCharge, setEditingCharge] = useState(null)
  const [changingOrderCharge, setChangingOrderCharge] = useState(null)
  
  // Formulario de asignación de excedentes
  const [assignForm, setAssignForm] = useState({ lot_id:'', customer_id:'', order_id:'', unit_price:'', qty:'' })

  useEffect(()=>{ 
    loadAll()
    listCustomers().then(setCustomers).catch(()=>{}) 
    listProducts().then(setProducts).catch(()=>{})
    listOrders().then(setOrders).catch(()=>{})
  },[])

  async function loadAll() {
    try {
      const ordersData = await ordersSummary(true)
      setOrderCards(ordersData)
      const customersData = await customersSummary(true)
      setCustomerCards(customersData)
      const lotsData = await listLots()
      setLots(lotsData)
    } catch(err) {
      console.error(err)
    }
  }

  function toggleOrder(orderId) {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  function toggleOrderCustomer(orderId, customerId) {
    const key = `${orderId}-${customerId}`
    setExpandedOrderCustomers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleOrderProduct(orderId, customerId, productId) {
    const key = `${orderId}-${customerId}-${productId}`
    setExpandedOrderProducts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleCustomer(customerId) {
    setExpandedCustomers(prev => ({ ...prev, [customerId]: !prev[customerId] }))
  }

  function toggleCustomerOrder(customerId, orderId) {
    const key = `${customerId}-${orderId}`
    setExpandedCustomerOrders(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleCustomerProduct(customerId, orderId, productId) {
    const key = `${customerId}-${orderId}-${productId}`
    setExpandedCustomerProducts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function saveChargeEdit() {
    if (!editingCharge) return
    try {
      await updateChargePrice(editingCharge.chargeId, Number(editingCharge.price))
      await updateChargeQuantity(editingCharge.chargeId, Number(editingCharge.qty))
      setEditingCharge(null)
      await loadAll()
      alert('✓ Actualizado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo actualizar'))
    }
  }

  async function saveOrderChange() {
    if (!changingOrderCharge) return
    try {
      await changeChargeOrder(changingOrderCharge.chargeId, Number(changingOrderCharge.newOrderId))
      setChangingOrderCharge(null)
      await loadAll()
      alert('✓ Pedido cambiado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo cambiar'))
    }
  }

  async function returnToExcess(chargeId) {
    if (!confirm('¿Devolver este producto a excedentes?')) return
    try {
      await returnChargeToExcess(chargeId, {})
      await loadAll()
      alert('✓ Producto devuelto a excedentes')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo devolver'))
    }
  }

  async function assignExcess() {
    if (!assignForm.lot_id || !assignForm.customer_id) return
    try {
      await assignLotToCustomer(Number(assignForm.lot_id), {
        customer_id: Number(assignForm.customer_id),
        order_id: assignForm.order_id ? Number(assignForm.order_id) : null,
        unit_price: assignForm.unit_price ? Number(assignForm.unit_price) : null,
        qty: assignForm.qty ? Number(assignForm.qty) : null
      })
      setAssignForm({ lot_id:'', customer_id:'', order_id:'', unit_price:'', qty:'' })
      await loadAll()
      alert('✓ Excedente asignado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo asignar'))
    }
  }

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'24px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:32, fontWeight:800 }}>📊 Contabilidad</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Gestión financiera detallada</p>
      </div>

      {/* Resumen por Pedido */}
      <div style={{ marginBottom:32 }}>
        <h3 style={{ fontSize:22, fontWeight:700, marginBottom:16 }}>📦 Por Pedido</h3>
        
        <div style={{ display:'grid', gap:12 }}>
          {orderCards.map((o)=> {
            const orderId = o.order.id
            const isExpanded = expandedOrders[orderId]
            
            return (
              <div 
                key={orderId}
                style={{ 
                  background:'white', 
                  borderRadius:16, 
                  border:'1px solid #e0e0e0',
                  overflow:'hidden'
                }}
              >
                {/* Nivel 1: Resumen del pedido */}
                <button 
                  onClick={() => toggleOrder(orderId)}
                  style={{ 
                    width:'100%', 
                    padding:'20px', 
                    background:'none', 
                    border:'none', 
                    textAlign:'left', 
                    cursor:'pointer',
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center'
                  }}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>
                      {isExpanded ? '▼' : '▶'} {o.order.title || `Pedido #${orderId}`}
                    </div>
                    <div style={{ display:'flex', gap:20, fontSize:15, opacity:0.8 }}>
                      <span>💰 ${o.billed.toLocaleString('es-CL')}</span>
                      <span>💵 ${o.cost.toLocaleString('es-CL')}</span>
                      <span style={{ color:'#2e7d32', fontWeight:600 }}>
                        📈 ${o.profit_amount.toLocaleString('es-CL')} ({o.profit_pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <span style={{ 
                    padding:'8px 16px', 
                    borderRadius:12, 
                    fontSize:14, 
                    fontWeight:600,
                    background: o.purchase_status==='complete'?'#e8f5e9':(o.purchase_status==='over'?'#fff3e0':'#ffebee'),
                    color: o.purchase_status==='complete'?'#2e7d32':(o.purchase_status==='over'?'#f57c00':'#d32f2f')
                  }}>
                    {o.purchase_status==='complete'?'✓ Completo':(o.purchase_status==='over'?'⚠ Exceso':'⏳ Incompleto')}
                  </span>
                </button>

                {/* Nivel 2: Clientes */}
                {isExpanded && o.customers && (
                  <div style={{ padding:'0 20px 20px 20px', borderTop:'1px solid #f0f0f0' }}>
                    {o.customers.map((cust)=> {
                      const custKey = `${orderId}-${cust.customer_id}`
                      const isCustExpanded = expandedOrderCustomers[custKey]
                      
                      return (
                        <div key={cust.customer_id} style={{ marginTop:12 }}>
                          <button
                            onClick={() => toggleOrderCustomer(orderId, cust.customer_id)}
                            style={{ 
                              width:'100%', 
                              padding:'12px 16px', 
                              background:'#f8f9fa', 
                              border:'none', 
                              borderRadius:12,
                              textAlign:'left',
                              cursor:'pointer',
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              fontSize:16
                            }}
                          >
                            <span style={{ fontWeight:600 }}>
                              {isCustExpanded ? '▼' : '▶'} {cust.customer_name}
                            </span>
                            <span style={{ fontWeight:700, color:'#2e7d32' }}>
                              ${cust.billed.toLocaleString('es-CL')}
                            </span>
                          </button>

                          {/* Nivel 3: Productos */}
                          {isCustExpanded && (
                            <div style={{ marginTop:8, marginLeft:20 }}>
                              {cust.products.map((prod)=> {
                                const prodKey = `${orderId}-${cust.customer_id}-${prod.product_id}`
                                const isProdExpanded = expandedOrderProducts[prodKey]
                                
                                return (
                                  <div key={prod.product_id} style={{ marginTop:8 }}>
                                    <button
                                      onClick={() => toggleOrderProduct(orderId, cust.customer_id, prod.product_id)}
                                      style={{ 
                                        width:'100%', 
                                        padding:'10px 14px', 
                                        background:'white', 
                                        border:'1px solid #e0e0e0', 
                                        borderRadius:10,
                                        textAlign:'left',
                                        cursor:'pointer',
                                        display:'flex',
                                        justifyContent:'space-between',
                                        alignItems:'center',
                                        fontSize:15
                                      }}
                                    >
                                      <span>
                                        {isProdExpanded ? '▼' : '▶'} {prod.product_name}
                                        <span style={{ marginLeft:8, opacity:0.7, fontSize:14 }}>
                                          ({prod.qty.toFixed(1)} {prod.unit === 'kg' ? 'kg' : 'U.'})
                                        </span>
                                      </span>
                                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <span>${prod.total_billed.toLocaleString('es-CL')}</span>
                                        <span style={{ fontSize:18 }}>
                                          {prod.purchase_status === 'complete' ? '✓' : 
                                           prod.purchase_status === 'over' ? '⚠' : '❗'}
                                        </span>
                                      </div>
                                    </button>

                                    {/* Nivel 4: Detalles y edición */}
                                    {isProdExpanded && (
                                      <div style={{ marginTop:8, marginLeft:16, padding:12, background:'#f8f9fa', borderRadius:8 }}>
                                        {prod.charges.map((charge)=> (
                                          <div key={charge.id} style={{ marginBottom:8 }}>
                                            {editingCharge?.chargeId === charge.id ? (
                                              <div style={{ display:'grid', gap:8 }}>
                                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                                  <input 
                                                    type="number"
                                                    placeholder="Cantidad"
                                                    value={editingCharge.qty}
                                                    onChange={e=> setEditingCharge({...editingCharge, qty:e.target.value})}
                                                    className="input"
                                                    style={{ padding:'8px' }}
                                                  />
                                                  <input 
                                                    type="number"
                                                    placeholder="Precio"
                                                    value={editingCharge.price}
                                                    onChange={e=> setEditingCharge({...editingCharge, price:e.target.value})}
                                                    className="input"
                                                    style={{ padding:'8px' }}
                                                  />
                                                </div>
                                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                                  <button onClick={saveChargeEdit} className="button" style={{ padding:'8px' }}>
                                                    ✓ Guardar
                                                  </button>
                                                  <button onClick={()=>setEditingCharge(null)} className="button ghost" style={{ padding:'8px' }}>
                                                    ✕ Cancelar
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:8 }}>
                                                <span style={{ fontSize:14 }}>
                                                  {(charge.charged_qty ?? charge.qty).toFixed(1)} {charge.unit} × ${charge.unit_price.toLocaleString('es-CL')}
                                                </span>
                                                <button 
                                                  onClick={()=>setEditingCharge({
                                                    chargeId:charge.id, 
                                                    qty:charge.charged_qty ?? charge.qty, 
                                                    price:charge.unit_price
                                                  })}
                                                  className="button ghost"
                                                  style={{ padding:'4px 12px', fontSize:13 }}
                                                >
                                                  ✏️ Editar
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumen por Cliente */}
      <div style={{ marginBottom:32 }}>
        <h3 style={{ fontSize:22, fontWeight:700, marginBottom:16 }}>👤 Por Cliente</h3>
        
        <div style={{ display:'grid', gap:12 }}>
          {customerCards.map((c)=> {
            const customerId = c.customer.id
            const isExpanded = expandedCustomers[customerId]
            
            return (
              <div 
                key={customerId}
                style={{ 
                  background:'white', 
                  borderRadius:16, 
                  border:'1px solid #e0e0e0',
                  overflow:'hidden'
                }}
              >
                {/* Nivel 1: Resumen del cliente */}
                <button 
                  onClick={() => toggleCustomer(customerId)}
                  style={{ 
                    width:'100%', 
                    padding:'20px', 
                    background:'none', 
                    border:'none', 
                    textAlign:'left', 
                    cursor:'pointer',
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>
                      {isExpanded ? '▼' : '▶'} {c.customer.name}
                    </div>
                    <div style={{ display:'flex', gap:20, fontSize:15, opacity:0.8 }}>
                      <span>💰 ${c.billed.toLocaleString('es-CL')}</span>
                      <span>✓ ${c.paid.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, opacity:0.7, marginBottom:4 }}>Deuda</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'#d32f2f' }}>
                      ${c.due.toLocaleString('es-CL')}
                    </div>
                  </div>
                </button>

                {/* Nivel 2: Pedidos */}
                {isExpanded && c.orders && (
                  <div style={{ padding:'0 20px 20px 20px', borderTop:'1px solid #f0f0f0' }}>
                    {c.orders.map((ord)=> {
                      const ordKey = `${customerId}-${ord.order_id}`
                      const isOrdExpanded = expandedCustomerOrders[ordKey]
                      
                      return (
                        <div key={ord.order_id} style={{ marginTop:12 }}>
                          <button
                            onClick={() => toggleCustomerOrder(customerId, ord.order_id)}
                            style={{ 
                              width:'100%', 
                              padding:'12px 16px', 
                              background:'#f8f9fa', 
                              border:'none', 
                              borderRadius:12,
                              textAlign:'left',
                              cursor:'pointer',
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              fontSize:16
                            }}
                          >
                            <span style={{ fontWeight:600 }}>
                              {isOrdExpanded ? '▼' : '▶'} Pedido #{ord.order_id}
                            </span>
                            <span style={{ fontWeight:700 }}>
                              ${ord.billed.toLocaleString('es-CL')}
                            </span>
                          </button>

                          {/* Nivel 3: Productos del pedido */}
                          {isOrdExpanded && ord.products && (
                            <div style={{ marginTop:8, marginLeft:20 }}>
                              {ord.products.map((prod)=> {
                                const prodKey = `${customerId}-${ord.order_id}-${prod.product_id}`
                                const isProdExpanded = expandedCustomerProducts[prodKey]
                                
                                return (
                                  <div key={prod.product_id} style={{ marginTop:8 }}>
                                    <button
                                      onClick={() => toggleCustomerProduct(customerId, ord.order_id, prod.product_id)}
                                      style={{ 
                                        width:'100%', 
                                        padding:'10px 14px', 
                                        background:'white', 
                                        border:'1px solid #e0e0e0', 
                                        borderRadius:10,
                                        textAlign:'left',
                                        cursor:'pointer',
                                        display:'flex',
                                        justifyContent:'space-between',
                                        alignItems:'center',
                                        fontSize:15
                                      }}
                                    >
                                      <span>
                                        {isProdExpanded ? '▼' : '▶'} {prod.product_name}
                                        <span style={{ marginLeft:8, opacity:0.7, fontSize:14 }}>
                                          ({(prod.charged_qty ?? prod.qty).toFixed(1)} {prod.unit === 'kg' ? 'kg' : 'U.'})
                                        </span>
                                      </span>
                                      <span style={{ fontWeight:600 }}>
                                        ${prod.total.toLocaleString('es-CL')}
                                      </span>
                                    </button>

                                    {/* Nivel 4: Detalles y botones */}
                                    {isProdExpanded && (
                                      <div style={{ marginTop:8, marginLeft:16, padding:12, background:'#f8f9fa', borderRadius:8 }}>
                                        {editingCharge?.chargeId === prod.charge_id ? (
                                          <div style={{ display:'grid', gap:8 }}>
                                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                              <input 
                                                type="number"
                                                placeholder="Cantidad"
                                                value={editingCharge.qty}
                                                onChange={e=> setEditingCharge({...editingCharge, qty:e.target.value})}
                                                className="input"
                                                style={{ padding:'8px' }}
                                              />
                                              <input 
                                                type="number"
                                                placeholder="Precio"
                                                value={editingCharge.price}
                                                onChange={e=> setEditingCharge({...editingCharge, price:e.target.value})}
                                                className="input"
                                                style={{ padding:'8px' }}
                                              />
                                            </div>
                                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                              <button onClick={saveChargeEdit} className="button" style={{ padding:'8px' }}>
                                                ✓ Guardar
                                              </button>
                                              <button onClick={()=>setEditingCharge(null)} className="button ghost" style={{ padding:'8px' }}>
                                                ✕ Cancelar
                                              </button>
                                            </div>
                                          </div>
                                        ) : changingOrderCharge?.chargeId === prod.charge_id ? (
                                          <div style={{ display:'grid', gap:8 }}>
                                            <select 
                                              className="input"
                                              value={changingOrderCharge.newOrderId}
                                              onChange={e=> setChangingOrderCharge({...changingOrderCharge, newOrderId:e.target.value})}
                                              style={{ padding:'8px' }}
                                            >
                                              <option value="">Seleccionar pedido...</option>
                                              {orders.map(o=> (
                                                <option key={o.id} value={o.id}>{o.title || `Pedido #${o.id}`}</option>
                                              ))}
                                            </select>
                                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                              <button onClick={saveOrderChange} className="button" style={{ padding:'8px' }}>
                                                ✓ Cambiar
                                              </button>
                                              <button onClick={()=>setChangingOrderCharge(null)} className="button ghost" style={{ padding:'8px' }}>
                                                ✕ Cancelar
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <div style={{ fontSize:14, marginBottom:12 }}>
                                              <span style={{ opacity:0.7 }}>Precio unitario: </span>
                                              <span style={{ fontWeight:600 }}>${prod.unit_price.toLocaleString('es-CL')} / {prod.unit === 'kg' ? 'kg' : 'U.'}</span>
                                            </div>
                                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                                              <button 
                                                onClick={()=>setEditingCharge({
                                                  chargeId:prod.charge_id, 
                                                  qty:prod.charged_qty ?? prod.qty, 
                                                  price:prod.unit_price
                                                })}
                                                className="button"
                                                style={{ padding:'8px', fontSize:13 }}
                                              >
                                                ✏️ Editar
                                              </button>
                                              <button 
                                                onClick={()=>setChangingOrderCharge({chargeId:prod.charge_id, newOrderId:''})}
                                                className="button ghost"
                                                style={{ padding:'8px', fontSize:13 }}
                                              >
                                                🔄 Pedido
                                              </button>
                                              <button 
                                                onClick={()=>returnToExcess(prod.charge_id)}
                                                className="button ghost"
                                                style={{ padding:'8px', fontSize:13, background:'#fff3e0' }}
                                              >
                                                ↩️ Devolver
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Gestión de Excedentes */}
      <div style={{ marginBottom:32 }}>
        <h3 style={{ fontSize:22, fontWeight:700, marginBottom:16 }}>🔄 Gestionar Excedentes</h3>
        
        {/* Asignar a Cliente */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:20, marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>📤 Asignar a Cliente</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              value={assignForm.lot_id} 
              onChange={e=>setAssignForm(v=>({ ...v, lot_id:e.target.value }))} 
              style={{ padding:'12px' }}
            >
              <option value="">Seleccionar excedente...</option>
              {lots.filter(l=> l.status==='unassigned').map(l=> {
                const product = products.find(p=> p.id === l.product_id)
                return (
                  <option key={l.id} value={l.id}>
                    {product?.name || `Producto #${l.product_id}`} — {l.qty_kg||l.qty_unit} {l.qty_kg?'kg':'U.'}
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
                  style={{ padding:'12px' }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <input 
                  className="input" 
                  type="number"
                  placeholder="Cantidad (opcional)" 
                  value={assignForm.qty} 
                  onChange={e=>setAssignForm(v=>({ ...v, qty:e.target.value }))} 
                  style={{ padding:'12px' }}
                />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="ID Pedido (opcional)" 
                    value={assignForm.order_id} 
                    onChange={e=>setAssignForm(v=>({ ...v, order_id:e.target.value }))} 
                    style={{ padding:'12px' }}
                  />
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Precio (opcional)" 
                    value={assignForm.unit_price} 
                    onChange={e=>setAssignForm(v=>({ ...v, unit_price:e.target.value }))} 
                    style={{ padding:'12px' }}
                  />
                </div>

                <button 
                  className="button" 
                  onClick={assignExcess} 
                  disabled={!assignForm.customer_id}
                  style={{ padding:'12px', fontSize:16, fontWeight:600 }}
                >
                  ✓ Asignar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Marcar como Merma */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:20 }}>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>🗑️ Marcar como Merma</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              id="waste-lot-select"
              style={{ padding:'12px' }}
            >
              <option value="">Seleccionar excedente...</option>
              {lots.filter(l=> l.status==='unassigned').map(l=> {
                const product = products.find(p=> p.id === l.product_id)
                return (
                  <option key={l.id} value={l.id}>
                    {product?.name || `Producto #${l.product_id}`} — {l.qty_kg||l.qty_unit} {l.qty_kg?'kg':'U.'}
                  </option>
                )
              })}
            </select>
            <button 
              className="button" 
              onClick={async()=>{
                const select = document.getElementById('waste-lot-select')
                const lotId = select.value
                if (!lotId) return
                if (!confirm('¿Marcar este excedente como merma?')) return
                try {
                  await markLotAsWaste(Number(lotId))
                  await loadAll()
                  select.value = ''
                  alert('✓ Marcado como merma')
                } catch(err) {
                  alert('Error: ' + (err.message || 'No se pudo marcar'))
                }
              }}
              style={{ padding:'12px', fontSize:16, fontWeight:600, background:'#d32f2f', color:'white' }}
            >
              🗑️ Marcar como Merma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

