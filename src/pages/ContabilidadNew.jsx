import { useEffect, useState } from 'react'
import { ordersSummary, customersSummary, updateChargePrice, updateChargeQuantity, createPayment, reassignCharge, listChargesByOrder, listExcess } from '../api/accounting'
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
  
  // Filtros
  const [orderFilter, setOrderFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('')
  
  // Módulo de pagos
  const [showPayments, setShowPayments] = useState(true)
  const [paymentForm, setPaymentForm] = useState({ customer_id:'', order_id:'', amount:'', date:'' })
  
  // Módulo de reasignación
  const [showReassign, setShowReassign] = useState(false)
  const [reassignForm, setReassignForm] = useState({ order_id:'', product_id:'', from_customer:'', to_customer:'', qty:'', unit_price:'' })
  const [availableCharges, setAvailableCharges] = useState([])
  const [excessData, setExcessData] = useState([])

  useEffect(()=>{ 
    loadAll()
    listCustomers().then(setCustomers).catch(()=>{}) 
    listProducts().then(setProducts).catch(()=>{})
    listOrders().then(setOrders).catch(()=>{})
    loadExcess()
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

  async function loadExcess() {
    try {
      const excess = await listExcess()
      setExcessData(excess)
    } catch(err) {
      console.error(err)
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
        date: paymentForm.date || new Date().toISOString()
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

  async function loadChargesForOrder(orderId) {
    if (!orderId) return
    try {
      const charges = await listChargesByOrder(orderId)
      setAvailableCharges(charges)
    } catch(err) {
      console.error(err)
    }
  }

  async function handleReassign() {
    if (!reassignForm.product_id || !reassignForm.to_customer || !reassignForm.qty || !reassignForm.unit_price) {
      alert('Completa todos los campos: producto, cliente nuevo, cantidad y precio')
      return
    }
    
    try {
      // Crear nuevo charge para el cliente destino
      const selectedCharge = availableCharges.find(c=> c.product_id === Number(reassignForm.product_id))
      if (!selectedCharge) {
        alert('No se encontró el producto seleccionado')
        return
      }

      await reassignCharge({
        customer_id: Number(reassignForm.to_customer),
        order_id: Number(reassignForm.order_id),
        original_order_id: Number(reassignForm.order_id),  // Marcar el pedido original para rastrear excedente
        product_id: Number(reassignForm.product_id),
        qty: Number(reassignForm.qty),
        unit: selectedCharge.unit,
        unit_price: Number(reassignForm.unit_price),
        total: Number(reassignForm.qty) * Number(reassignForm.unit_price),
        status: 'pending'
      })
      
      setReassignForm({ order_id:'', product_id:'', from_customer:'', to_customer:'', qty:'', unit_price:'' })
      setAvailableCharges([])
      await loadAll()
      await loadExcess()
      alert('✓ Producto reasignado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo reasignar'))
    }
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
            boxShadow:'0 4px 12px rgba(136, 196, 168, 0.3)',
            transition:'all 0.2s'
          }}
        >
          <span>💰 Registrar Pago</span>
          <span style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            {showPayments ? 'Ocultar' : 'Mostrar'}
          </span>
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
                      💯 Todo
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
                  boxShadow: (!paymentForm.customer_id || !paymentForm.order_id || !paymentForm.amount) ? 'none' : '0 4px 12px rgba(136, 196, 168, 0.3)'
                }}
              >
                ✓ Registrar Pago
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Módulo de Reasignación (Excedentes) */}
      <div style={{ marginBottom:40 }}>
        <button
          onClick={() => setShowReassign(!showReassign)}
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
            boxShadow:'0 4px 12px rgba(136, 196, 168, 0.3)',
            transition:'all 0.2s'
          }}
        >
          <span>🔄 Reasignar Producto (Excedentes)</span>
          <span style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            {showReassign ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showReassign && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            marginTop: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ fontSize:14, color:'#666', marginBottom:20 }}>
              Usa esta función cuando compres de más o necesites reasignar un producto de un cliente a otro
            </p>

            {/* Paso 1: Seleccionar pedido con excedente */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:8 }}>
                1️⃣ Selecciona el pedido con excedente
              </label>
              <select
                value={reassignForm.order_id}
                onChange={e=> {
                  setReassignForm(f=> ({...f, order_id:e.target.value, product_id:'', from_customer:'', to_customer:'', qty:'', unit_price:''}))
                  loadChargesForOrder(e.target.value)
                }}
                style={{ 
                  width:'100%', 
                  padding:12, 
                  borderRadius:10, 
                  border:'1px solid #ddd', 
                  fontSize:15,
                  background:'white'
                }}
              >
                <option value="">Selecciona un pedido...</option>
                {excessData.map(ex=> (
                  <option key={ex.order.id} value={ex.order.id}>
                    Pedido #{ex.order.id} - {ex.order.title} - ({ex.excesses.length} producto{ex.excesses.length !== 1 ? 's' : ''} con excedente)
                  </option>
                ))}
              </select>
            </div>

            {reassignForm.order_id && (
              <>
                {/* Paso 2: Producto excedente y cantidad */}
                <div style={{ 
                  display:'grid', 
                  gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', 
                  gap:16, 
                  marginBottom:20 
                }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:8 }}>
                      2️⃣ Producto con excedente
                    </label>
                    <select
                      value={reassignForm.product_id}
                      onChange={e=> {
                        const selectedOrder = excessData.find(ex=> ex.order.id === Number(reassignForm.order_id))
                        const excess = selectedOrder?.excesses.find(ex=> ex.product_id === Number(e.target.value))
                        const charge = availableCharges.find(c=> c.product_id === Number(e.target.value))
                        setReassignForm(f=> ({
                          ...f, 
                          product_id:e.target.value,
                          qty: excess ? excess.excess_qty.toString() : (charge ? charge.qty.toString() : ''),
                          unit_price: charge ? charge.unit_price.toString() : ''
                        }))
                      }}
                      style={{ 
                        width:'100%', 
                        padding:12, 
                        borderRadius:10, 
                        border:'1px solid #ddd', 
                        fontSize:15,
                        background:'white'
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {(() => {
                        const selectedOrder = excessData.find(ex=> ex.order.id === Number(reassignForm.order_id))
                        return selectedOrder?.excesses.map(ex=> (
                          <option key={ex.product_id} value={ex.product_id}>
                            {ex.product_name} - Excedente: {ex.excess_qty} {ex.unit}
                          </option>
                        )) || []
                      })()}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:8 }}>
                      Cantidad a reasignar
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={reassignForm.qty}
                      onChange={e=> setReassignForm(f=> ({...f, qty:e.target.value}))}
                      style={{ 
                        width:'100%', 
                        padding:12, 
                        borderRadius:10, 
                        border:'1px solid #ddd', 
                        fontSize:15 
                      }}
                      placeholder="kg o unidades"
                    />
                  </div>
                </div>

                {/* Paso 3: Cliente destino y precio */}
                <div style={{ 
                  display:'grid', 
                  gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', 
                  gap:16, 
                  marginBottom:20 
                }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:8 }}>
                      3️⃣ Cliente nuevo (destino)
                    </label>
                    <select
                      value={reassignForm.to_customer}
                      onChange={e=> setReassignForm(f=> ({...f, to_customer:e.target.value}))}
                      style={{ 
                        width:'100%', 
                        padding:12, 
                        borderRadius:10, 
                        border:'1px solid #ddd', 
                        fontSize:15,
                        background:'white'
                      }}
                    >
                      <option value="">Selecciona cliente...</option>
                      {customers.map(c=> (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:8 }}>
                      Precio por unidad ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={reassignForm.unit_price}
                      onChange={e=> setReassignForm(f=> ({...f, unit_price:e.target.value}))}
                      style={{ 
                        width:'100%', 
                        padding:12, 
                        borderRadius:10, 
                        border:'1px solid #ddd', 
                        fontSize:15 
                      }}
                      placeholder="Precio"
                    />
                  </div>
                </div>

                {/* Preview del total */}
                {reassignForm.qty && reassignForm.unit_price && (
                  <div style={{ 
                    background:'linear-gradient(135deg, #f0f9f5 0%, #e8f5e9 100%)', 
                    padding:16, 
                    borderRadius:12, 
                    border:'2px solid #88C4A8',
                    fontSize:16,
                    fontWeight:600,
                    color:'#2e7d32',
                    marginBottom:20,
                    textAlign:'center'
                  }}>
                    Total a facturar: ${(Number(reassignForm.qty) * Number(reassignForm.unit_price)).toLocaleString('es-CL')}
                  </div>
                )}

                {/* Botón de reasignación */}
                <button
                  onClick={handleReassign}
                  disabled={!reassignForm.product_id || !reassignForm.to_customer || !reassignForm.qty || !reassignForm.unit_price}
                  style={{
                    width:'100%',
                    padding:'14px',
                    borderRadius:12,
                    background: (!reassignForm.product_id || !reassignForm.to_customer || !reassignForm.qty || !reassignForm.unit_price) ? '#e0e0e0' : '#88C4A8',
                    color:'white',
                    border:'none',
                    fontSize:16,
                    fontWeight:700,
                    cursor: (!reassignForm.product_id || !reassignForm.to_customer || !reassignForm.qty || !reassignForm.unit_price) ? 'not-allowed' : 'pointer',
                    boxShadow: (!reassignForm.product_id || !reassignForm.to_customer || !reassignForm.qty || !reassignForm.unit_price) ? 'none' : '0 4px 12px rgba(136, 196, 168, 0.3)',
                    transition:'all 0.2s'
                  }}
                >
                  ✓ Reasignar Producto
                </button>
              </>
            )}
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
              style={{ width:200, padding:'8px 14px', borderRadius:10 }}
            />
            <select 
              className="input"
              value={orderStatusFilter}
              onChange={e=> setOrderStatusFilter(e.target.value)}
              style={{ width:150, padding:'8px 14px', borderRadius:10 }}
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
              onMouseEnter={e=> e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e=> e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
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
            style={{ width:200, padding:'8px 14px', borderRadius:10 }}
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
              onMouseEnter={e=> e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e=> e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
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
        onUpdate={loadAll}
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
    </div>
  )
}
