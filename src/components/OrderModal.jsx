import { useState } from 'react'
import { generateInvoicePDF } from '../utils/pdfGenerator'

export default function OrderModal({ orderData, onClose, editingCharge, setEditingCharge, saveChargeEdit, products }) {
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [expandedProducts, setExpandedProducts] = useState({})

  if (!orderData) return null

  const orderId = orderData.order.id

  function handleDownloadInvoice() {
    // Preparar items del pedido
    const items = []
    
    if (orderData.customers) {
      orderData.customers.forEach(cust => {
        if (cust.products) {
          cust.products.forEach(prod => {
            items.push({
              product_name: prod.product_name,
              qty: prod.charged_qty || prod.qty || 0,
              unit: prod.charged_unit || prod.unit || 'kg',
              sale_unit_price: prod.unit_price || 0,
              notes: prod.notes
            })
          })
        }
      })
    }

    generateInvoicePDF(orderData.order, items, null)
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
              {orderData.order.title || `Pedido #${orderId}`}
            </h2>
            <div style={{ marginTop:8, display:'flex', gap:12, fontSize:14, opacity:0.7 }}>
              <span>Pedido #{orderId}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadInvoice()
              }}
              style={{
                padding:'10px 20px',
                borderRadius:999,
                border:'none',
                background:'var(--kivi-green)',
                color:'white',
                fontWeight:700,
                fontSize:14,
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                gap:8,
                transition:'all 0.2s'
              }}
              onMouseOver={e=> e.target.style.transform='scale(1.05)'}
              onMouseOut={e=> e.target.style.transform='scale(1)'}
            >
              <span>📄</span>
              Descargar Factura
            </button>
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
              <div style={{ fontSize:22, fontWeight:700 }}>${orderData.billed.toLocaleString('es-CL')}</div>
            </div>
            <div style={{ padding:20, background:'#f8f9fa', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>💵 Costo</div>
              <div style={{ fontSize:22, fontWeight:700 }}>${orderData.cost.toLocaleString('es-CL')}</div>
            </div>
            <div style={{ padding:20, background:'#f8f9fa', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>❗ Deuda</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#d32f2f' }}>${orderData.due.toLocaleString('es-CL')}</div>
            </div>
            <div style={{ padding:20, background:'#e8f5e9', borderRadius:16 }}>
              <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>📈 Utilidad</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#2e7d32' }}>
                ${orderData.profit_amount.toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>{orderData.profit_pct.toFixed(1)}%</div>
            </div>
          </div>

          {/* Estado de Compra */}
          <div style={{ 
            padding:16, 
            borderRadius:16, 
            marginBottom:28,
            background: orderData.purchase_status==='complete'?'#e8f5e9':(orderData.purchase_status==='over'?'#fff3e0':'#ffebee'),
            border: `2px solid ${orderData.purchase_status==='complete'?'#2e7d32':(orderData.purchase_status==='over'?'#f57c00':'#d32f2f')}`
          }}>
            <div style={{ 
              fontSize:16, 
              fontWeight:600,
              color: orderData.purchase_status==='complete'?'#2e7d32':(orderData.purchase_status==='over'?'#f57c00':'#d32f2f')
            }}>
              {orderData.purchase_status==='complete'?'✓ Pedido Completo':(orderData.purchase_status==='over'?'⚠ Exceso en Compras':'⏳ Compras Incompletas')}
            </div>
          </div>

          {/* Clientes */}
          <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>👥 Clientes</div>
          {orderData.customers && orderData.customers.map((cust)=> {
            const custKey = `${orderId}-${cust.customer_id}`
            const isCustExpanded = expandedCustomers[custKey]
            
            return (
              <div key={cust.customer_id} style={{ marginBottom:16 }}>
                <button
                  onClick={() => setExpandedCustomers(prev => ({ ...prev, [custKey]: !prev[custKey] }))}
                  style={{ 
                    width:'100%', 
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
                    {cust.customer_name}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontWeight:700, color:'#2e7d32', fontSize:18 }}>
                      ${cust.billed.toLocaleString('es-CL')}
                    </span>
                    <button
                      style={{
                        padding: '2px 8px',
                        background: isCustExpanded ? '#88C4A8' : '#f5f5f5',
                        color: isCustExpanded ? 'white' : '#666',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {isCustExpanded ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </button>

                {/* Productos */}
                {isCustExpanded && (
                  <div style={{ marginTop:12, marginLeft:16 }}>
                    {cust.products.map((prod)=> {
                      const prodKey = `${orderId}-${cust.customer_id}-${prod.product_id}`
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
                                ({prod.qty.toFixed(1)} {prod.unit === 'kg' ? 'kg' : 'U.'})
                              </span>
                            </span>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontWeight:600 }}>${prod.total_billed.toLocaleString('es-CL')}</span>
                              <span style={{ fontSize:20 }}>
                                {prod.purchase_status === 'complete' ? '✓' : 
                                 prod.purchase_status === 'over' ? '⚠' : '❗'}
                              </span>
                            </div>
                          </button>

                          {/* Detalles y edición */}
                          {isProdExpanded && (
                            <div style={{ marginTop:10, marginLeft:16, padding:16, background:'#f8f9fa', borderRadius:12 }}>
                              {prod.charges.map((charge)=> (
                                <div key={charge.id} style={{ marginBottom:12 }}>
                                  {editingCharge?.chargeId === charge.id ? (
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
                                  ) : (
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:10, background:'white', borderRadius:8 }}>
                                      <span style={{ fontSize:15 }}>
                                        {(charge.charged_qty ?? charge.qty).toFixed(1)} {charge.unit} × ${charge.unit_price.toLocaleString('es-CL')}
                                      </span>
                                      <button 
                                        onClick={()=>setEditingCharge({
                                          chargeId:charge.id, 
                                          qty:charge.charged_qty ?? charge.qty, 
                                          price:charge.unit_price
                                        })}
                                        className="button ghost"
                                        style={{ padding:'6px 14px', fontSize:14 }}
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
      </div>
    </div>
  )
}

