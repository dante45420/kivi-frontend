import { useState, useEffect } from 'react'
import { listMerchantOrders } from '../../api/merchant'
import '../../styles/globals.css'

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await listMerchantOrders()
      setOrders(data)
    } catch (e) {
      alert('Error al cargar pedidos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Cargando pedidos...</div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'confirmed': return '#2196f3'
      case 'preparing': return '#9c27b0'
      case 'ready': return '#4caf50'
      case 'delivered': return '#00bcd4'
      case 'cancelled': return '#f44336'
      default: return '#666'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmado'
      case 'preparing': return 'En Preparación'
      case 'ready': return 'Listo'
      case 'delivered': return 'Entregado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        📦 Mis Pedidos
      </h1>

      {orders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: '#f5f5f5', 
          borderRadius: 12,
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 18, color: '#666', fontWeight: 500 }}>
            Aún no has realizado ningún pedido
          </div>
          <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            Ve al catálogo y comienza a agregar productos a tu carrito
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map(order => (
            <div 
              key={order.id}
              style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedOrder?.id === order.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2196f3'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    Pedido #{order.id}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {new Date(order.created_at).toLocaleDateString('es-CL', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{
                  background: getStatusColor(order.status),
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: '#2196f3',
                marginBottom: 12
              }}>
                ${order.total_amount?.toLocaleString('es-CL') || '0'}
              </div>

              {selectedOrder?.id === order.id && order.items && (
                <div style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: '1px solid #e0e0e0' 
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                    Detalle del pedido:
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {order.items.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: 8,
                          background: '#f9f9f9',
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                          {item.variant_label && (
                            <div style={{ fontSize: 12, color: '#666' }}>{item.variant_label}</div>
                          )}
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {item.quantity} × ${item.unit_price?.toLocaleString('es-CL')}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#2196f3' }}>
                          ${(item.quantity * item.unit_price)?.toLocaleString('es-CL')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div style={{ 
                      marginTop: 12, 
                      padding: 12, 
                      background: '#fff3cd', 
                      borderRadius: 6,
                      fontSize: 13
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>📝 Notas:</div>
                      {order.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

