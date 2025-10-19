import { useState } from 'react'
import { returnChargeToExcess, changeChargeOrder } from '../api/accounting'
import { generateInvoicePDF } from '../utils/pdfGenerator'

export default function CustomerModal({ 
  customerData, 
  onClose, 
  editingCharge, 
  setEditingCharge, 
  saveChargeEdit,
  orders,
  onUpdate
}) {
  const [expandedOrders, setExpandedOrders] = useState({})
  const [expandedProducts, setExpandedProducts] = useState({})
  const [changingOrderCharge, setChangingOrderCharge] = useState(null)

  if (!customerData) return null

  const customerId = customerData.customer.id

  async function handleSaveOrderChange() {
    if (!changingOrderCharge || !changingOrderCharge.newOrderId) return
    try {
      await changeChargeOrder(changingOrderCharge.chargeId, Number(changingOrderCharge.newOrderId))
      setChangingOrderCharge(null)
      await onUpdate()
      alert('✓ Pedido cambiado correctamente')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo cambiar el pedido'))
    }
  }

  async function handleReturnToExcess(chargeId) {
    if (!confirm('¿Devolver este producto a excedentes?')) return
    try {
      await returnChargeToExcess(chargeId, {})
      await onUpdate()
      alert('✓ Producto devuelto a excedentes')
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo devolver'))
    }
  }


  return (
    <div 
      onClick={onClose}
      style={{ 
        position:'fixed', 
        inset:0, 
        background:'rgba(0,0,0,0.6)', 
        display:'flex', 
        alignItems:'center', 
        justifyContent:'center', 
        zIndex:1000, 
        padding:16,
        backdropFilter:'blur(4px)'
      }}
    >
      <div 
        onClick={e=> e.stopPropagation()} 
        style={{ 
          background:'white', 
          borderRadius:24, 
          maxWidth:900, 
          width:'100%', 
          maxHeight:'90vh', 
          overflow:'auto', 
          boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding:'24px 28px', 
          borderBottom:'1px solid #e0e0e0',
          position:'sticky',
          top:0,
          background:'white',
          zIndex:1,
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center'
        }}>
          <div>
            <h2 style={{ margin:0, fontSize:26, fontWeight:800 }}>
              {customerData.customer.name}
            </h2>
            <div style={{ marginTop:8, display:'flex', gap:12, fontSize:14, opacity:0.7 }}>
              <span>Cliente #{customerId}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button 
              onClick={onClose}
              style={{ 
                width:40, 
                height:40, 
                borderRadius:'50%', 
                border:'none', 
                background:'#f5f5f5',
                cursor:'pointer',
                fontSize:20,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                transition:'all 0.2s'
              }}
              onMouseOver={e=> e.target.style.background='#e0e0e0'}
              onMouseOut={e=> e.target.style.background='#f5f5f5'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:28 }}>
          {/* Resumen Financiero */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:16, marginBottom:28 }}>
            <div style={{ padding:20, background:'#f8f9fa', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>💰 Facturado</div>
              <div style={{ fontSize:22, fontWeight:700 }}>${customerData.billed.toLocaleString('es-CL')}</div>
            </div>
            <div style={{ padding:20, background:'#e8f5e9', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>✓ Pagado</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#2e7d32' }}>${customerData.paid.toLocaleString('es-CL')}</div>
            </div>
            <div style={{ padding:20, background:'#ffebee', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>❗ Deuda</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#d32f2f' }}>${customerData.due.toLocaleString('es-CL')}</div>
            </div>
          </div>

          {/* Pedidos */}
          <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>📦 Pedidos</div>
          {customerData.orders && customerData.orders.map((ord)=> {
            const ordKey = `${customerId}-${ord.order_id}`
            const isOrdExpanded = expandedOrders[ordKey]
            
            return (
              <div key={ord.order_id} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button
                    onClick={() => setExpandedOrders(prev => ({ ...prev, [ordKey]: !prev[ordKey] }))}
                    style={{ 
                      flex:1,
                      padding:'16px 20px', 
                      background:'#f8f9fa', 
                      border:'none', 
                      borderRadius:16,
                      textAlign:'left',
                      cursor:'pointer',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      fontSize:16,
                      transition:'all 0.2s'
                    }}
                    onMouseOver={e=> e.target.style.background='#e8eaed'}
                    onMouseOut={e=> e.target.style.background='#f8f9fa'}
                  >
                    <span style={{ fontWeight:600, fontSize:17 }}>
                      Pedido #{ord.order_id}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontWeight:700, fontSize:18 }}>
                        ${ord.billed.toLocaleString('es-CL')}
                      </span>
                      <button
                        style={{
                          padding: '2px 8px',
                          background: isOrdExpanded ? '#88C4A8' : '#f5f5f5',
                          color: isOrdExpanded ? 'white' : '#666',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {isOrdExpanded ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Generar factura solo para este pedido y este cliente
                      const orderInfo = orders?.find(o => o.id === ord.order_id) || { id: ord.order_id, name: `Pedido #${ord.order_id}` }
                      const items = []
                      
                      if (ord.products) {
                        ord.products.forEach(prod => {
                          items.push({
                            product_name: prod.product_name,
                            qty: prod.charged_qty ?? prod.qty ?? 0,
                            unit: prod.unit || 'kg',
                            sale_unit_price: prod.unit_price || 0,
                            notes: prod.notes
                          })
                        })
                      }
                      
                      generateInvoicePDF(orderInfo, items, customerData.customer)
                    }}
                    style={{
                      padding:'16px 20px',
                      background:'var(--kivi-green)',
                      border:'none',
                      borderRadius:16,
                      cursor:'pointer',
                      fontSize:14,
                      fontWeight:600,
                      color:'white',
                      whiteSpace:'nowrap',
                      transition:'all 0.2s'
                    }}
                    onMouseOver={e=> e.target.style.background='var(--kivi-green-dark)'}
                    onMouseOut={e=> e.target.style.background='var(--kivi-green)'}
                  >
                    📄 Factura
                  </button>
                </div>

                {/* Productos del pedido */}
                {isOrdExpanded && ord.products && (
                  <div style={{ marginTop:12, marginLeft:16 }}>
                    {ord.products.map((prod)=> {
                      const prodKey = `${customerId}-${ord.order_id}-${prod.product_id}`
                      const isProdExpanded = expandedProducts[prodKey]
                      
                      return (
                        <div key={prod.product_id} style={{ marginBottom:12 }}>
                          <button
                            onClick={() => setExpandedProducts(prev => ({ ...prev, [prodKey]: !prev[prodKey] }))}
                            style={{ 
                              width:'100%', 
                              padding:'12px 16px', 
                              background:'white', 
                              border:'1px solid #e0e0e0', 
                              borderRadius:12,
                              textAlign:'left',
                              cursor:'pointer',
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              fontSize:15
                            }}
                          >
                            <span>
                              {prod.product_name}
                              <span style={{ marginLeft:8, opacity:0.6, fontSize:14 }}>
                                ({(prod.charged_qty ?? prod.qty).toFixed(1)} {prod.unit === 'kg' ? 'kg' : 'U.'})
                              </span>
                            </span>
                            <span style={{ fontWeight:600, fontSize:16 }}>
                              ${prod.total.toLocaleString('es-CL')}
                            </span>
                          </button>

                          {/* Detalles y botones */}
                          {isProdExpanded && (
                            <div style={{ marginTop:10, marginLeft:16, padding:16, background:'#f8f9fa', borderRadius:12 }}>
                              {editingCharge?.chargeId === prod.charge_id ? (
                                <div style={{ display:'grid', gap:10 }}>
                                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                    <input 
                                      type="number"
                                      placeholder="Cantidad"
                                      value={editingCharge.qty}
                                      onChange={e=> setEditingCharge({...editingCharge, qty:e.target.value})}
                                      className="input"
                                      style={{ padding:'10px 14px', fontSize:15 }}
                                    />
                                    <input 
                                      type="number"
                                      placeholder="Precio"
                                      value={editingCharge.price}
                                      onChange={e=> setEditingCharge({...editingCharge, price:e.target.value})}
                                      className="input"
                                      style={{ padding:'10px 14px', fontSize:15 }}
                                    />
                                  </div>
                                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                    <button onClick={saveChargeEdit} className="button" style={{ padding:'10px', fontSize:15 }}>
                                      ✓ Guardar
                                    </button>
                                    <button onClick={()=>setEditingCharge(null)} className="button ghost" style={{ padding:'10px', fontSize:15 }}>
                                      ✕ Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : changingOrderCharge?.chargeId === prod.charge_id ? (
                                <div style={{ display:'grid', gap:10 }}>
                                  <select 
                                    className="input"
                                    value={changingOrderCharge.newOrderId}
                                    onChange={e=> setChangingOrderCharge({...changingOrderCharge, newOrderId:e.target.value})}
                                    style={{ padding:'10px 14px', fontSize:15 }}
                                  >
                                    <option value="">Seleccionar pedido...</option>
                                    {orders.map(o=> (
                                      <option key={o.id} value={o.id}>{o.title || `Pedido #${o.id}`}</option>
                                    ))}
                                  </select>
                                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                    <button onClick={handleSaveOrderChange} className="button" style={{ padding:'10px', fontSize:15 }}>
                                      ✓ Cambiar
                                    </button>
                                    <button onClick={()=>setChangingOrderCharge(null)} className="button ghost" style={{ padding:'10px', fontSize:15 }}>
                                      ✕ Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:10, background:'white', borderRadius:8, marginBottom:10 }}>
                                    <div>
                                      <div style={{ fontSize:15, fontWeight:600 }}>
                                        ${prod.unit_price.toLocaleString('es-CL')} por {prod.unit === 'kg' ? 'kg' : 'unidad'}
                                      </div>
                                      <div style={{ fontSize:13, opacity:0.6, marginTop:4 }}>
                                        {(prod.charged_qty ?? prod.qty).toFixed(1)} {prod.unit} × ${prod.unit_price.toLocaleString('es-CL')} = ${prod.total.toLocaleString('es-CL')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                    <button 
                                      onClick={()=>setEditingCharge({
                                        chargeId:prod.charge_id, 
                                        qty:prod.charged_qty ?? prod.qty, 
                                        price:prod.unit_price
                                      })}
                                      className="button ghost"
                                      style={{ padding:'8px 16px', fontSize:14, flex:1 }}
                                    >
                                      ✏️ Editar Precio/Cantidad
                                    </button>
                                    <button 
                                      onClick={()=>setChangingOrderCharge({chargeId:prod.charge_id, newOrderId:''})}
                                      className="button ghost"
                                      style={{ padding:'8px 16px', fontSize:14, flex:1 }}
                                    >
                                      🔄 Cambiar Pedido
                                    </button>
                                    <button 
                                      onClick={()=>handleReturnToExcess(prod.charge_id)}
                                      style={{ 
                                        padding:'8px 16px', 
                                        borderRadius:8, 
                                        background:'#fff3e0', 
                                        border:'1px solid #f57c00',
                                        color:'#f57c00',
                                        cursor:'pointer',
                                        fontSize:14,
                                        fontWeight:600,
                                        flex:1
                                      }}
                                    >
                                      📦 Devolver a Excedentes
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
      </div>
    </div>
  )
}

