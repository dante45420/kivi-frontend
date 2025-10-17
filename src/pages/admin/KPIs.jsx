import { useState, useEffect } from 'react'
import { getKpisOverview, getTopProducts } from '../../api/adminKpis'
import '../../styles/globals.css'

export default function KPIs() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  
  // Filtros
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [recompraDays, setRecompraDays] = useState(15)
  const [activoDays, setActivoDays] = useState(15)

  async function loadData() {
    setLoading(true)
    try {
      const params = {
        recompra_days: recompraDays,
        activo_days: activoDays
      }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      const [kpisData, topData] = await Promise.all([
        getKpisOverview(params),
        getTopProducts({ ...params, limit: 10 })
      ])
      
      setKpis(kpisData)
      setTopProducts(topData)
    } catch (e) {
      alert('Error al cargar KPIs: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--kivi-text)', opacity: 0.6 }}>
          Cargando KPIs...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--kivi-text-dark)' }}>
          📊 KPIs del Negocio
        </h1>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 16 }}>
          Métricas clave de rendimiento
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 20, 
        marginBottom: 28,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>⚙️ Filtros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Desde
            </label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Hasta
            </label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Días para recompra
            </label>
            <input
              type="number"
              className="input"
              value={recompraDays}
              onChange={e => setRecompraDays(parseInt(e.target.value) || 15)}
              style={{ width: '100%' }}
              min="1"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Días cliente activo
            </label>
            <input
              type="number"
              className="input"
              value={activoDays}
              onChange={e => setActivoDays(parseInt(e.target.value) || 15)}
              style={{ width: '100%' }}
              min="1"
            />
          </div>
        </div>
        
        <button
          className="button"
          onClick={loadData}
          style={{ marginTop: 16, background: 'var(--kivi-green)', fontWeight: 600 }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tarjetas de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Ticket Promedio */}
        <KPICard
          title="💰 Ticket Promedio"
          icon="💵"
          data={kpis?.ticket_promedio}
          renderContent={(data) => (
            <>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--kivi-green-dark)', marginBottom: 12 }}>
                ${data.total?.toLocaleString('es-CL') || 0}
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <strong>Utilidad:</strong> ${data.utilidad?.toLocaleString('es-CL') || 0} 
                <span style={{ marginLeft: 8, color: 'var(--kivi-green-dark)', fontWeight: 700 }}>
                  ({data.margen_utilidad_porcentaje || 0}%)
                </span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                📦 {data.num_pedidos || 0} pedidos • 👥 {data.num_clientes || 0} clientes
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                Promedio/pedido: ${data.promedio_por_pedido?.toLocaleString('es-CL') || 0}
              </div>
            </>
          )}
        />

        {/* Tasa de Recompra */}
        <KPICard
          title="🔄 Tasa de Recompra"
          icon="📈"
          data={kpis?.tasa_recompra}
          renderContent={(data) => (
            <>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--kivi-green-dark)', marginBottom: 12 }}>
                {data.tasa_porcentaje || 0}%
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                {data.recompraron || 0} de {data.total_clientes || 0} clientes
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Periodo: {data.plazo_dias || 15} días
              </div>
            </>
          )}
        />

        {/* Clientes Activos */}
        <KPICard
          title="👥 Clientes Activos"
          icon="✅"
          data={kpis?.clientes}
          renderContent={(data) => (
            <>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--kivi-green-dark)', marginBottom: 12 }}>
                {data.activos || 0}
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <strong>{data.tasa_actividad_porcentaje || 0}%</strong> del total histórico
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Total histórico: {data.total_historico || 0}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                🆕 {data.nuevos_mes || 0} nuevos este mes
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                (Últimos {data.filtro_dias || 15} días)
              </div>
            </>
          )}
        />
      </div>

      {/* Top Productos */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 20, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>
          🏆 Top 10 Productos
        </h3>
        
        {topProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
            No hay datos en el periodo seleccionado
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {topProducts.map((product, idx) => (
              <div
                key={product.product_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: idx < 3 ? 'var(--kivi-cream)' : '#f8f8f8',
                  borderRadius: 12,
                  border: idx < 3 ? '2px solid var(--kivi-green-soft)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: idx < 3 ? 'var(--kivi-green-dark)' : '#999',
                    minWidth: 30
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--kivi-text-dark)' }}>
                      {product.product_name}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                      {product.cantidad_vendida?.toFixed(1)} unidades vendidas
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                    ${product.ingresos_totales?.toLocaleString('es-CL')}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    ingresos
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente reutilizable para tarjeta de KPI
function KPICard({ title, icon, data, renderContent }) {
  if (!data) return null
  
  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '2px solid var(--kivi-cream)'
    }}>
      <div style={{ 
        fontSize: 14, 
        fontWeight: 700, 
        marginBottom: 16,
        color: 'var(--kivi-text)',
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </div>
      {renderContent(data)}
    </div>
  )
}

