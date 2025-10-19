import { useState, useEffect } from 'react'
import { getKpisOverview, getTopProducts } from '../../api/adminKpis'
import '../../styles/globals.css'

export default function KPIs() {
  const [mode, setMode] = useState('tradicional') // 'tradicional' | 'b2b'
  const [loading, setLoading] = useState(false)
  
  // KPIs data
  const [ticketData, setTicketData] = useState(null)
  const [recompraData, setRecompraData] = useState(null)
  const [clientesData, setClientesData] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  
  // Filtros individuales por KPI
  const [ticketFilters, setTicketFilters] = useState({ date_from: '', date_to: '' })
  const [recompraFilters, setRecompraFilters] = useState({ date_from: '', date_to: '', days: 15 })
  const [clientesFilters, setClientesFilters] = useState({ days: 15 })
  const [topFilters, setTopFilters] = useState({ date_from: '', date_to: '', limit: 10, sort_by: 'revenue' })

  // Carga individual de cada KPI
  async function loadTicket() {
    try {
      const params = { ...ticketFilters }
      const data = await getKpisOverview(params)
      setTicketData(data.ticket_promedio)
    } catch (e) {
      console.error('Error ticket:', e)
    }
  }

  async function loadRecompra() {
    try {
      const params = { 
        date_from: recompraFilters.date_from,
        date_to: recompraFilters.date_to,
        recompra_days: recompraFilters.days 
      }
      const data = await getKpisOverview(params)
      setRecompraData(data.tasa_recompra)
    } catch (e) {
      console.error('Error recompra:', e)
    }
  }

  async function loadClientes() {
    try {
      const params = { activo_days: clientesFilters.days }
      const data = await getKpisOverview(params)
      setClientesData(data.clientes)
    } catch (e) {
      console.error('Error clientes:', e)
    }
  }

  async function loadTop() {
    try {
      const data = await getTopProducts({ 
        ...topFilters,
        limit: topFilters.limit,
        sort_by: topFilters.sort_by
      })
      setTopProducts(data)
    } catch (e) {
      console.error('Error top products:', e)
    }
  }

  // Cargar todos al inicio
  useEffect(() => {
    setLoading(true)
    Promise.all([loadTicket(), loadRecompra(), loadClientes(), loadTop()])
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, opacity: 0.5 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 20px 100px 20px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header minimalista */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 800, 
          margin: 0, 
          color: 'var(--kivi-text-dark)',
          letterSpacing: '-0.5px'
        }}>
          KPIs
        </h1>
      </div>

      {/* Grid de KPIs */}
      <div style={{ display: 'grid', gap: 24, marginBottom: 32 }}>
        
        {/* TICKET PROMEDIO */}
        <KPICard
          title="Ticket Promedio"
          emoji="💰"
          filters={
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="date"
                value={ticketFilters.date_from}
                onChange={e => setTicketFilters(v => ({ ...v, date_from: e.target.value }))}
                placeholder="Desde"
                style={inputStyle}
              />
              <input
                type="date"
                value={ticketFilters.date_to}
                onChange={e => setTicketFilters(v => ({ ...v, date_to: e.target.value }))}
                placeholder="Hasta"
                style={inputStyle}
              />
              <button onClick={loadTicket} style={buttonStyle}>
                Actualizar
              </button>
            </div>
          }
          content={
            ticketData ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                    ${ticketData.total?.toLocaleString('es-CL') || 0}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>total promedio</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                  <div>
                    <span style={{ opacity: 0.6 }}>Utilidad:</span>
                    <div style={{ fontWeight: 700, color: 'var(--kivi-green-dark)' }}>
                      ${ticketData.utilidad?.toLocaleString('es-CL') || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6 }}>Margen:</span>
                    <div style={{ fontWeight: 700, color: 'var(--kivi-green-dark)' }}>
                      {ticketData.margen_utilidad_porcentaje || 0}%
                    </div>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6 }}>Pedidos:</span>
                    <div style={{ fontWeight: 700 }}>{ticketData.num_pedidos || 0}</div>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6 }}>Clientes:</span>
                    <div style={{ fontWeight: 700 }}>{ticketData.num_clientes || 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontSize: 14 }}>Sin datos</div>
            )
          }
        />

        {/* TASA DE RECOMPRA */}
        <KPICard
          title="Tasa de Recompra"
          emoji="🔄"
          filters={
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="date"
                value={recompraFilters.date_from}
                onChange={e => setRecompraFilters(v => ({ ...v, date_from: e.target.value }))}
                placeholder="Desde"
                style={inputStyle}
              />
              <input
                type="date"
                value={recompraFilters.date_to}
                onChange={e => setRecompraFilters(v => ({ ...v, date_to: e.target.value }))}
                placeholder="Hasta"
                style={inputStyle}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={recompraFilters.days}
                  onChange={e => setRecompraFilters(v => ({ ...v, days: parseInt(e.target.value) || 15 }))}
                  placeholder="Días"
                  min="1"
                  style={{ ...inputStyle, width: 70 }}
                />
                <span style={{ fontSize: 13, opacity: 0.6, whiteSpace: 'nowrap' }}>días</span>
              </div>
              <button onClick={loadRecompra} style={buttonStyle}>
                Actualizar
              </button>
            </div>
          }
          content={
            recompraData ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                    {recompraData.tasa_porcentaje || 0}%
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    {recompraData.recompraron || 0} de {recompraData.total_clientes || 0} clientes recompraron
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontSize: 14 }}>Sin datos</div>
            )
          }
        />

        {/* CLIENTES ACTIVOS */}
        <KPICard
          title="Clientes Activos"
          emoji="👥"
          filters={
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={clientesFilters.days}
                  onChange={e => setClientesFilters({ days: parseInt(e.target.value) || 15 })}
                  placeholder="Días"
                  min="1"
                  style={{ ...inputStyle, width: 70 }}
                />
                <span style={{ fontSize: 13, opacity: 0.6, whiteSpace: 'nowrap' }}>días</span>
              </div>
              <button onClick={loadClientes} style={buttonStyle}>
                Actualizar
              </button>
            </div>
          }
          content={
            clientesData ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                    {clientesData.activos || 0}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    {clientesData.tasa_actividad_porcentaje || 0}% del total histórico ({clientesData.total_historico || 0})
                  </div>
                </div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ opacity: 0.6 }}>Nuevos este mes:</span>
                  <span style={{ fontWeight: 700, marginLeft: 8 }}>{clientesData.nuevos_mes || 0}</span>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontSize: 14 }}>Sin datos</div>
            )
          }
        />

        {/* TOP PRODUCTOS */}
        <KPICard
          title="Top Productos"
          emoji="🏆"
          filters={
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={topFilters.sort_by}
                onChange={e => setTopFilters(v => ({ ...v, sort_by: e.target.value }))}
                style={inputStyle}
              >
                <option value="revenue">💰 Por Monto</option>
                <option value="quantity">📦 Por Unidades</option>
                <option value="profit">💎 Por Utilidad</option>
              </select>
              <input
                type="date"
                value={topFilters.date_from}
                onChange={e => setTopFilters(v => ({ ...v, date_from: e.target.value }))}
                placeholder="Desde"
                style={inputStyle}
              />
              <input
                type="date"
                value={topFilters.date_to}
                onChange={e => setTopFilters(v => ({ ...v, date_to: e.target.value }))}
                placeholder="Hasta"
                style={inputStyle}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, opacity: 0.6, whiteSpace: 'nowrap' }}>Top</span>
                <input
                  type="number"
                  value={topFilters.limit}
                  onChange={e => setTopFilters(v => ({ ...v, limit: parseInt(e.target.value) || 10 }))}
                  min="1"
                  max="50"
                  style={{ ...inputStyle, width: 60 }}
                />
              </div>
              <button onClick={loadTop} style={buttonStyle}>
                Actualizar
              </button>
            </div>
          }
          content={
            topProducts.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {topProducts.map((product, idx) => (
                  <div
                    key={product.product_id}
                    style={{
                      padding: 12,
                      background: idx < 3 ? 'var(--kivi-cream)' : '#fafafa',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          fontWeight: 800, 
                          color: idx < 3 ? 'var(--kivi-green-dark)' : '#999',
                          minWidth: 24
                        }}>
                          #{idx + 1}
                        </div>
                        <div style={{ fontWeight: 700 }}>{product.product_name}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--kivi-green-dark)' }}>
                        ${product.ingresos_totales?.toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div>
                        <span style={{ opacity: 0.6 }}>Unidades:</span>
                        <div style={{ fontWeight: 700 }}>{product.cantidad_vendida?.toFixed(1)}</div>
                      </div>
                      <div>
                        <span style={{ opacity: 0.6 }}>Costos:</span>
                        <div style={{ fontWeight: 700, color: '#d32f2f' }}>
                          ${product.costos_totales?.toLocaleString('es-CL')}
                        </div>
                      </div>
                      <div>
                        <span style={{ opacity: 0.6 }}>Utilidad:</span>
                        <div style={{ fontWeight: 700, color: product.utilidad >= 0 ? 'var(--kivi-green-dark)' : '#d32f2f' }}>
                          ${product.utilidad?.toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontSize: 14, textAlign: 'center', padding: 20 }}>
                No hay datos
              </div>
            )
          }
        />
      </div>

      {/* Toggle fijo abajo (centrado) */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}>
        <button
          onClick={() => setMode(m => m === 'tradicional' ? 'b2b' : 'tradicional')}
          style={{
            padding: '14px 32px',
            background: mode === 'tradicional' ? 'var(--kivi-green)' : 'var(--kivi-blue-soft)',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 700,
            color: '#000',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          {mode === 'tradicional' ? '👤 Clientes Tradicionales' : '🏢 Comerciantes B2B'}
          <span style={{ opacity: 0.6, fontSize: 13 }}>↔</span>
        </button>
      </div>
    </div>
  )
}

// Componente de tarjeta KPI minimalista
function KPICard({ title, emoji, filters, content }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #e0e0e0',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '20px 24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: expanded ? 'var(--kivi-cream)' : 'white',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{emoji}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--kivi-text-dark)' }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: 20, opacity: 0.5, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▼
        </span>
      </div>
      
      {/* Content */}
      <div style={{ padding: '20px 24px' }}>
        {content}
      </div>
      
      {/* Filtros (colapsables) */}
      {expanded && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          background: '#fafafa'
        }}>
          {filters}
        </div>
      )}
    </div>
  )
}

// Estilos compartidos
const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  transition: 'border 0.2s'
}

const buttonStyle = {
  padding: '8px 16px',
  background: 'var(--kivi-green)',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: '#000',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap'
}
