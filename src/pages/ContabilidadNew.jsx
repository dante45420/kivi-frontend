import { useEffect, useState } from 'react'
import { ordersSummary, customersSummary, updateChargePrice, updateChargeQuantity, createPayment, listLots, assignLotToCustomer, markLotAsWaste, processLot, returnChargeToExcess } from '../api/accounting'
import { listCustomers } from '../api/customers'
import { listProducts } from '../api/products'
import { listOrders } from '../api/orders'
import OrderModal from '../components/OrderModal'
import CustomerModal from '../components/CustomerModal'
import '../styles/globals.css'

export default function ContabilidadNew(){
  const [orderCards, setOrderCards] = useState([])
  const [customerCards, setCustomerCards] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  
  // Modales
  const [orderModal, setOrderModal] = useState(null)
  const [customerModal, setCustomerModal] = useState(null)
  
  // Estados de edición
  const [editingCharge, setEditingCharge] = useState(null)
  
  // Estados para excedentes
  const [lots, setLots] = useState([])
  const [assignForm, setAssignForm] = useState({ lot_id:'', customer_id:'', order_id:'', unit_price:'', qty:'' })
  const [processForm, setProcessForm] = useState({ from_lot:'', to_product:'', input_kg:'', output_qty:'', unit:'unit' })
  
  // Filtros
  const [orderFilter, setOrderFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('')
  
  // Módulo de pagos
  const [showPayments, setShowPayments] = useState(true)
  const [paymentForm, setPaymentForm] = useState({ customer_id:'', order_id:'', amount:'', date:'' })

  useEffect(()=>{ 
    loadAll()
    listCustomers().then(setCustomers).catch(()=>{}) 
    listProducts().then(setProducts).catch(()=>{})
    listOrders().then(setOrders).catch(()=>{})
    listLots().then(setLots).catch(()=>{})
  },[])

  async function loadAll() {
    try {
      const ordersData = await ordersSummary(true)
      setOrderCards(ordersData)
      const customersData = await customersSummary(true)
      setCustomerCards(customersData)
    } catch(err) {
      console.error(err)
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
      setLots(await listLots())
      loadAll()
      alert('✓ Excedente asignado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo asignar el excedente'))
    }
  }

  async function doProcess(){ 
    const lot = lots.find(l=> String(l.id)===String(processForm.from_lot))
    if(!lot) return
    try {
      await processLot({ 
        from_product_id: lot.product_id, 
        to_product_id: Number(processForm.to_product), 
        input_qty_kg: Number(processForm.input_kg||lot.qty_kg||0), 
        output_qty: Number(processForm.output_qty||0), 
        unit: processForm.unit||'unit' 
      })
      setProcessForm({ from_lot:'', to_product:'', input_kg:'', output_qty:'', unit:'unit' })
      setLots(await listLots())
      alert('✓ Excedente procesado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo procesar'))
    }
  }

  // Funciones de filtrado
  const filteredOrderCards = orderCards.filter(o => {
    const matchesText = !orderFilter || 
      (o.order.title && o.order.title.toLowerCase().includes(orderFilter.toLowerCase())) ||
      o.order.id.toString().includes(orderFilter)
    const matchesStatus = orderStatusFilter === 'all' || o.purchase_status === orderStatusFilter
    return matchesText && matchesStatus
  })

  const filteredCustomerCards = customerCards.filter(c => {
    return !customerFilter || 
      (c.customer.name && c.customer.name.toLowerCase().includes(customerFilter.toLowerCase())) ||
      c.customer.id.toString().includes(customerFilter)
  })

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


  async function handleRegisterPayment() {
    if (!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount) {
      alert('Falta completar: cliente, pedido y monto')
      return
    }
    try {
      await createPayment({
        customer_id: Number(paymentForm.customer_id),
        order_id: Number(paymentForm.order_id),
        amount: Number(paymentForm.amount),
        method: 'efectivo',
        reference: paymentForm.date || null
      })
      setPaymentForm({ customer_id:'', order_id:'', amount:'', date:'' })
      await loadAll()
      alert('✓ Pago registrado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo registrar el pago'))
    }
  }

  function fillFullAmount(customerId) {
    const customer = customerCards.find(c=> c.customer.id === Number(customerId))
    if (customer && customer.due > 0) {
      setPaymentForm(f=> ({ ...f, amount: customer.due.toString() }))
    }
  }

  function getCustomerOrders(customerId) {
    if (!customerId) return []
    const customer = customerCards.find(c=> c.customer.id === Number(customerId))
    return customer?.orders || []
  }

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1400, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'24px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:32, fontWeight:800 }}>📊 Contabilidad</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Gestión financiera detallada</p>
      </div>

      {/* Módulo de Pagos */}
      <div style={{ marginBottom:40 }}>
        <button
          onClick={() => setShowPayments(!showPayments)}
          style={{
            width:'100%',
            padding:'20px',
            background:'#88C4A8',
            border:'none',
            borderRadius:20,
            color:'white',
            fontSize:20,
            fontWeight:700,
            cursor:'pointer',
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            boxShadow:'0 4px 12px rgba(102, 126, 234, 0.3)',
            transition:'all 0.2s'
          }}
        >
          <span>💰 Registrar Pago</span>
          <button
            style={{
              padding: '4px 10px',
              background: showPayments ? '#88C4A8' : '#f5f5f5',
              color: showPayments ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {showPayments ? 'Ocultar' : 'Ver pagos'}
          </button>
        </button>

        {showPayments && (
          <div style={{ 
            marginTop:16, 
            background:'white', 
            borderRadius:20, 
            padding:24, 
            border:'1px solid #e0e0e0',
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display:'grid', gap:16 }}>
              {/* Cliente */}
              <div>
                <label style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600 }}>
                  Cliente
                </label>
                <select
                  className="input"
                  value={paymentForm.customer_id}
                  onChange={e=> {
                    setPaymentForm(f=> ({ ...f, customer_id: e.target.value, order_id:'', amount:'' }))
                  }}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, fontSize:15 }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {customerCards.map(c=> (
                    <option key={c.customer.id} value={c.customer.id}>
                      {c.customer.name} {c.due > 0 ? `— Deuda: $${c.due.toLocaleString('es-CL')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pedido */}
              {paymentForm.customer_id && (
                <div>
                  <label style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600 }}>
                    Pedido
                  </label>
                  <select
                    className="input"
                    value={paymentForm.order_id}
                    onChange={e=> setPaymentForm(f=> ({ ...f, order_id: e.target.value }))}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, fontSize:15 }}
                  >
                    <option value="">Seleccionar pedido...</option>
                    {getCustomerOrders(paymentForm.customer_id).map(ord=> (
                      <option key={ord.order_id} value={ord.order_id}>
                        Pedido #{ord.order_id} — ${ord.billed.toLocaleString('es-CL')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monto */}
              <div>
                <label style={{ display:'block', marginBottom:8, fontSize:14, fontWeight:600 }}>
                  Monto
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    type="number"
                    className="input"
                    placeholder="Monto a pagar"
                    value={paymentForm.amount}
                    onChange={e=> setPaymentForm(f=> ({ ...f, amount: e.target.value }))}
                    style={{ flex:1, padding:'12px 16px', borderRadius:12, fontSize:15 }}
                  />
                  {paymentForm.customer_id && (
                    <button
                      onClick={() => fillFullAmount(paymentForm.customer_id)}
                      className="button"
                      style={{ 
                        padding:'12px 20px', 
                        borderRadius:12, 
                        background:'#e8f5e9', 
                        color:'#2e7d32',
                        border:'1px solid #2e7d32',
                        fontWeight:600,
                        fontSize:14,
                        whiteSpace:'nowrap'
                      }}
                    >
                      💯 Pagar Todo
                    </button>
                  )}
                </div>
                {paymentForm.customer_id && (() => {
                  const customer = customerCards.find(c=> c.customer.id === Number(paymentForm.customer_id))
                  return customer && customer.due > 0 ? (
                    <div style={{ marginTop:6, fontSize:13, opacity:0.7 }}>
                      Deuda total: ${customer.due.toLocaleString('es-CL')}
                    </div>
                  ) : null
                })()}
              </div>

              {/* Botón */}
              <button
                onClick={handleRegisterPayment}
                className="button"
                disabled={!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount}
                style={{
                  width:'100%',
                  padding:'14px',
                  borderRadius:12,
                  background: (!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount) ? '#e0e0e0' : '#88C4A8',
                  color:'white',
                  border:'none',
                  fontSize:16,
                  fontWeight:700,
                  cursor: (!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount) ? 'not-allowed' : 'pointer',
                  boxShadow: (!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                ✓ Registrar Pago
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen por Pedido */}
      <div style={{ marginBottom:40 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <h3 style={{ fontSize:24, fontWeight:700, margin:0 }}>📦 Por Pedido</h3>
          
          {/* Filtros */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <input 
              type="text"
              className="input"
              placeholder="Buscar pedido..."
              value={orderFilter}
              onChange={e=> setOrderFilter(e.target.value)}
              style={{ width:200, padding:'8px 14px' }}
            />
            <select 
              className="input"
              value={orderStatusFilter}
              onChange={e=> setOrderStatusFilter(e.target.value)}
              style={{ width:150, padding:'8px 14px' }}
            >
              <option value="all">Todos</option>
              <option value="complete">✓ Completos</option>
              <option value="incomplete">⏳ Incompletos</option>
              <option value="over">⚠ Exceso</option>
            </select>
          </div>
        </div>
        
        {/* Cards con scroll horizontal */}
        <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:16 }}>
          {filteredOrderCards.map((o)=> (
            <div 
              key={o.order.id}
              onClick={() => setOrderModal(o)}
              style={{ 
                minWidth:320,
                maxWidth:320,
                background:'white', 
                borderRadius:20, 
                border:'1px solid #e0e0e0',
                overflow:'hidden',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                transition:'all 0.2s',
                cursor:'pointer'
              }}
            >
              <div style={{ padding:'24px' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:700, marginBottom:12 }}>
                    {o.order.title || `Pedido #${o.order.id}`}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ 
                      padding:'6px 14px', 
                      borderRadius:12, 
                      fontSize:13, 
                      fontWeight:600,
                      background: o.purchase_status==='complete'?'#e8f5e9':(o.purchase_status==='over'?'#fff3e0':'#ffebee'),
                      color: o.purchase_status==='complete'?'#2e7d32':(o.purchase_status==='over'?'#f57c00':'#d32f2f')
                    }}>
                      {o.purchase_status==='complete'?'✓ Completo':(o.purchase_status==='over'?'⚠ Exceso':'⏳ Incompleto')}
                    </span>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Facturado</div>
                    <div style={{ fontSize:18, fontWeight:700 }}>${o.billed.toLocaleString('es-CL')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Costo</div>
                    <div style={{ fontSize:18, fontWeight:700 }}>${o.cost.toLocaleString('es-CL')}</div>
                  </div>
                </div>

                <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Deuda</div>
                      <div style={{ fontSize:18, fontWeight:700, color:'#d32f2f' }}>${o.due.toLocaleString('es-CL')}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Utilidad</div>
                      <div style={{ fontSize:18, fontWeight:700, color:'#2e7d32' }}>
                        ${o.profit_amount.toLocaleString('es-CL')}
                      </div>
                      <div style={{ fontSize:11, opacity:0.6 }}>{o.profit_pct.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen por Cliente */}
      <div style={{ marginBottom:40 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <h3 style={{ fontSize:24, fontWeight:700, margin:0 }}>👤 Por Cliente</h3>
          
          {/* Filtro */}
          <input 
            type="text"
            className="input"
            placeholder="Buscar cliente..."
            value={customerFilter}
            onChange={e=> setCustomerFilter(e.target.value)}
            style={{ width:200, padding:'8px 14px' }}
          />
        </div>
        
        {/* Cards con scroll horizontal */}
        <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:16 }}>
          {filteredCustomerCards.map((c)=> (
            <div 
              key={c.customer.id}
              onClick={() => setCustomerModal(c)}
              style={{ 
                minWidth:320,
                maxWidth:320,
                background:'white', 
                borderRadius:20, 
                border:'1px solid #e0e0e0',
                overflow:'hidden',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                transition:'all 0.2s',
                cursor:'pointer'
              }}
            >
              <div style={{ padding:'24px' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:700, marginBottom:12 }}>
                    {c.customer.name}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Facturado</div>
                    <div style={{ fontSize:18, fontWeight:700 }}>${c.billed.toLocaleString('es-CL')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Pagado</div>
                    <div style={{ fontSize:18, fontWeight:700 }}>${c.paid.toLocaleString('es-CL')}</div>
                  </div>
                </div>

                <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:16 }}>
                  <div>
                    <div style={{ fontSize:12, opacity:0.6, marginBottom:4 }}>Deuda</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'#d32f2f' }}>
                      ${c.due.toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      <OrderModal 
        orderData={orderModal}
        onClose={() => setOrderModal(null)}
        editingCharge={editingCharge}
        setEditingCharge={setEditingCharge}
        saveChargeEdit={saveChargeEdit}
        products={products}
      />
      
      <CustomerModal 
        customerData={customerModal}
        onClose={() => setCustomerModal(null)}
        editingCharge={editingCharge}
        setEditingCharge={setEditingCharge}
        saveChargeEdit={saveChargeEdit}
        orders={orders}
        onUpdate={loadAll}
      />

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
              onChange={e=> setAssignForm(f=> ({...f, lot_id:e.target.value}))}
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
            <select 
              className="input" 
              value={assignForm.customer_id}
              onChange={e=> setAssignForm(f=> ({...f, customer_id:e.target.value}))}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="input" 
              value={assignForm.order_id}
              onChange={e=> setAssignForm(f=> ({...f, order_id:e.target.value}))}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar pedido (opcional)...</option>
              {orders.map(o=> <option key={o.id} value={o.id}>{o.title || `Pedido #${o.id}`}</option>)}
            </select>
            <input 
              className="input" 
              type="number" 
              placeholder="Precio de venta por unidad/kg"
              value={assignForm.unit_price}
              onChange={e=> setAssignForm(f=> ({...f, unit_price:e.target.value}))}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            />
            <input 
              className="input" 
              type="number" 
              placeholder="Cantidad (opcional, por defecto todo)"
              value={assignForm.qty}
              onChange={e=> setAssignForm(f=> ({...f, qty:e.target.value}))}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            />
            <button 
              className="button" 
              onClick={assignExcess}
              style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600 }}
            >
              ✓ Asignar Excedente
            </button>
          </div>
        </div>

        {/* Procesar (Transformar) */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:20, marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>🔄 Procesar (Transformar)</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              id="process-lot-select"
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar excedente para procesar...</option>
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
            <button 
              className="button" 
              onClick={async()=>{
                const select = document.getElementById('process-lot-select')
                const lotId = select.value
                if (!lotId) return
                try {
                  await processLot({ lot_id: Number(lotId) })
                  await loadAll()
                  select.value = ''
                  alert('✓ Excedente procesado correctamente')
                } catch(err) {
                  alert('Error: ' + (err.message || 'No se pudo procesar'))
                }
              }}
              style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600 }}
            >
              🔄 Procesar
            </button>
          </div>
        </div>

        {/* Marcar como Merma */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0e0e0', padding:20, marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>🗑️ Marcar como Merma</div>
          <div style={{ display:'grid', gap:12 }}>
            <select 
              className="input" 
              id="waste-lot-select"
              style={{ width:'100%', padding:'12px 16px', borderRadius:12 }}
            >
              <option value="">Seleccionar excedente para merma...</option>
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
            <button 
              className="button" 
              onClick={async()=>{
                const select = document.getElementById('waste-lot-select')
                const lotId = select.value
                if (!lotId) return
                if (!confirm('¿Marcar este excedente como merma (pérdida)?')) return
                try {
                  await markLotAsWaste(Number(lotId))
                  setLots(await listLots())
                  select.value = ''
                  alert('✓ Excedente marcado como merma')
                } catch(err) {
                  alert('Error: ' + (err.message || 'No se pudo marcar como merma'))
                }
              }}
              style={{ width:'100%', padding:'12px', borderRadius:12, fontWeight:600, background:'#d32f2f', color:'white' }}
            >
              🗑️ Marcar como Merma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
