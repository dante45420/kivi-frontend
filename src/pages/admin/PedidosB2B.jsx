import { useState, useEffect } from 'react'
import { listAllMerchantOrders, updateMerchantOrderStatus } from '../../api/adminMerchant'
import '../../styles/globals.css'

export default function AdminPedidosB2B() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await listAllMerchantOrders()
      setOrders(data)
    } catch (e) {
      alert('Error al cargar pedidos B2B: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateMerchantOrderStatus(orderId, newStatus)
      await loadOrders()
      alert('Estado actualizado correctamente')
    } catch (e) {
      alert('Error al actualizar estado: ' + e.message)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

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

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus)

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Cargando pedidos B2B...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Pedidos B2B (Mayoristas)
        </h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="preparing">En Preparación</option>
          <option value="ready">Listo</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: '#f5f5f5', 
          borderRadius: 12,
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: 18, color: '#666', fontWeight: 500 }}>
            No hay pedidos B2B {filterStatus !== 'all' ? `con estado "${getStatusLabel(filterStatus)}"` : ''}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredOrders.map(order => (
            <div 
              key={order.id}
              style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                padding: 20,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    Pedido #{order.id}
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                    <strong>Merchant:</strong> {order.merchant_business_name || order.merchant_email}
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
                  {order.delivery_address && (
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      <strong>Dirección:</strong> {order.delivery_address}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{
                      background: getStatusColor(order.status),
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">En Preparación</option>
                    <option value="ready">Listo</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: '#2196f3',
                marginBottom: 16
              }}>
                Total: ${order.total_amount?.toLocaleString('es-CL') || '0'}
              </div>

              {order.items && order.items.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: '#333' }}>
                    Detalle del pedido:
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {order.items.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: 12,
                          background: '#f9f9f9',
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                          {item.variant_label && (
                            <div style={{ fontSize: 12, color: '#666' }}>Variante: {item.variant_label}</div>
                          )}
                          <div style={{ fontSize: 12, color: '#666' }}>
                            Proveedor: {item.vendor_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            {item.quantity} {item.unit} × ${item.unit_price?.toLocaleString('es-CL')}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#2196f3', textAlign: 'right' }}>
                          ${(item.quantity * item.unit_price)?.toLocaleString('es-CL')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.notes && (
                <div style={{ 
                  padding: 12, 
                  background: '#fff3cd', 
                  borderRadius: 6,
                  fontSize: 13,
                  marginTop: 12
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Notas del cliente:</div>
                  {order.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

