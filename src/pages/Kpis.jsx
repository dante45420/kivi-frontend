import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import '../styles/globals.css'

export default function Kpis() {
  const [kpis, setKpis] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('revenue') // revenue, quantity, profit
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    loadKpis()
    loadTopProducts()
  }, [dateFrom, dateTo, sortBy, limit])

  async function loadKpis() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      const data = await apiFetch(`/admin/kpis/overview?${params.toString()}`)
      setKpis(data)
    } catch (err) {
      console.error('Error al cargar KPIs:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTopProducts() {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      params.append('sort_by', sortBy)
      params.append('limit', limit)
      
      const data = await apiFetch(`/admin/kpis/productos-top?${params.toString()}`)
      setTopProducts(data)
    } catch (err) {
      console.error('Error al cargar productos top:', err)
    }
  }

  function setRangePreset(days) {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - days)
    
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        Cargando KPIs...
      </div>
    )
  }

  if (!kpis) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
        No hay datos disponibles
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', margin: '20px 0 32px 0' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800 }}>📊 KPIs del Negocio</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 15 }}>
          Métricas clave del rendimiento
        </p>
      </div>

      {/* Filtros de fecha */}
      <div style={{ 
        background: 'white', 
        borderRadius: 16, 
        padding: 24, 
        marginBottom: 32,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🗓️ Filtrar por periodo</div>
        
        {/* Botones rápidos */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: (!dateFrom && !dateTo) ? '#88C4A8' : 'white',
              color: (!dateFrom && !dateTo) ? 'white' : '#333',
              border: '2px solid #88C4A8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Todo el tiempo
          </button>
          <button
            onClick={() => setRangePreset(7)}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'white',
              color: '#333',
              border: '2px solid #ddd',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setRangePreset(15)}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'white',
              color: '#333',
              border: '2px solid #ddd',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Últimos 15 días
          </button>
          <button
            onClick={() => setRangePreset(30)}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'white',
              color: '#333',
              border: '2px solid #ddd',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Últimos 30 días
          </button>
        </div>

        {/* Selectores de fecha personalizados */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                fontSize: 14
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                fontSize: 14
              }}
            />
          </div>
        </div>

        {kpis.periodo && (kpis.periodo.desde || kpis.periodo.hasta) && (
          <div style={{ 
            marginTop: 12, 
            fontSize: 13, 
            color: '#666',
            fontStyle: 'italic'
          }}>
            📅 Mostrando datos desde {kpis.periodo.desde || 'el inicio'} hasta {kpis.periodo.hasta || 'hoy'}
          </div>
        )}
      </div>

      {/* Grid de KPIs principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 20,
        marginBottom: 32
      }}>
        {/* Total Facturado */}
        <KpiCard
          title="💰 Total Facturado"
          value={`$${kpis.ticket_promedio.total.toLocaleString('es-CL')}`}
          subtitle={`${kpis.ticket_promedio.num_pedidos} pedidos`}
          color="#4caf50"
        />

        {/* Utilidad Total */}
        <KpiCard
          title="📈 Utilidad Total"
          value={`$${kpis.ticket_promedio.utilidad.toLocaleString('es-CL')}`}
          subtitle={`${kpis.ticket_promedio.margen_utilidad_porcentaje.toFixed(1)}% margen`}
          color="#2196f3"
        />

        {/* Costos Totales */}
        <KpiCard
          title="💸 Costos Totales"
          value={`$${kpis.ticket_promedio.costos.toLocaleString('es-CL')}`}
          subtitle="Compras realizadas"
          color="#ff9800"
        />

        {/* Promedio por Pedido */}
        <KpiCard
          title="🛒 Promedio por Pedido"
          value={`$${kpis.ticket_promedio.promedio_por_pedido.toLocaleString('es-CL')}`}
          subtitle="Ticket promedio"
          color="#9c27b0"
        />

        {/* Clientes Activos */}
        <KpiCard
          title="👥 Clientes Vigentes"
          value={kpis.clientes.activos.toString()}
          subtitle={`de ${kpis.clientes.total_historico} totales (${kpis.clientes.filtro_dias} días)`}
          color="#00bcd4"
        />

        {/* Clientes Recurrentes */}
        <KpiCard
          title="🔄 Clientes Recurrentes"
          value={kpis.tasa_recompra.recompraron.toString()}
          subtitle={`${kpis.tasa_recompra.tasa_porcentaje.toFixed(1)}% tasa de recompra`}
          color="#e91e63"
        />

        {/* Promedio por Cliente */}
        <KpiCard
          title="👤 Promedio por Cliente"
          value={`$${kpis.ticket_promedio.promedio_por_cliente.toLocaleString('es-CL')}`}
          subtitle={`${kpis.ticket_promedio.num_clientes} clientes únicos`}
          color="#3f51b5"
        />

        {/* Nuevos Clientes Este Mes */}
        <KpiCard
          title="✨ Nuevos Este Mes"
          value={kpis.clientes.nuevos_mes.toString()}
          subtitle="Clientes nuevos"
          color="#8bc34a"
        />
      </div>

      {/* Productos Top */}
      <div style={{ 
        background: 'white', 
        borderRadius: 16, 
        padding: 24,
        marginBottom: 32,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🏆 Productos Top</h3>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <option value="revenue">Por Ingresos</option>
              <option value="quantity">Por Cantidad</option>
              <option value="profit">Por Utilidad</option>
            </select>

            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            No hay datos de productos para mostrar
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, fontSize: 13 }}>#</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, fontSize: 13 }}>Producto</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Cantidad</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Ingresos</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Costos</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr 
                    key={product.product_id}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: idx % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 600, color: '#666' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 600 }}>
                      {product.product_name}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right' }}>
                      {product.cantidad_vendida.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#4caf50' }}>
                      ${product.ingresos_totales.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right', color: '#ff9800' }}>
                      ${product.costos_totales.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: product.utilidad >= 0 ? '#2196f3' : '#f44336' }}>
                      ${product.utilidad.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Desglose por Cliente */}
      {kpis.ticket_promedio.desglose_clientes && kpis.ticket_promedio.desglose_clientes.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 24,
          marginBottom: 32,
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>👥 Desglose por Cliente</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, fontSize: 13 }}>Cliente</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Total Facturado</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Pedidos</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>Promedio/Pedido</th>
                </tr>
              </thead>
              <tbody>
                {kpis.ticket_promedio.desglose_clientes.map((cliente, idx) => (
                  <tr 
                    key={cliente.customer_id}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: idx % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 600 }}>
                      {cliente.customer_name}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: '#4caf50' }}>
                      ${cliente.total.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right' }}>
                      {cliente.num_pedidos}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, textAlign: 'right', color: '#2196f3' }}>
                      ${cliente.promedio_por_pedido.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #e0e0e0',
      transition: 'all 0.2s',
      cursor: 'default'
    }}
    onMouseOver={e => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      e.currentTarget.style.transform = 'translateY(-4px)'
    }}
    onMouseOut={e => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ 
        fontSize: 32, 
        fontWeight: 800, 
        color: color,
        marginBottom: 8,
        lineHeight: 1
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#999' }}>
        {subtitle}
      </div>
    </div>
  )
}
