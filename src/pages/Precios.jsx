import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProducts } from '../api/products'
import { listCatalog, listCompetitors, costTrend, saleVsCompetitor, profitSummary, listPrices } from '../api/prices'
import { listVariants, createVariant, listVariantTiers, createVariantTier } from '../api/variants'
import '../styles/globals.css'

export default function Precios(){
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [competitors, setCompetitors] = useState([])
  // edición de venta se gestiona en catálogo
  const [period, setPeriod] = useState('7 dias')
  const [scope, setScope] = useState('producto') // producto | promedio
  const [costSeries, setCostSeries] = useState([])
  const [saleVsComp, setSaleVsComp] = useState(null)
  const [profit, setProfit] = useState(null)
  const navigate = useNavigate()
  const [showSaleSeries, setShowSaleSeries] = useState(false)
  const [saleSeries, setSaleSeries] = useState([])
  const [variants, setVariants] = useState([])
  const [tiers, setTiers] = useState([])
  const [newVarLabel, setNewVarLabel] = useState('')
  const [newTier, setNewTier] = useState({ variant_id:'', min_qty:'', unit:'kg', sale_price:'' })

  const latestCompetitors = useMemo(()=>{
    const map = {}
    ;(competitors||[]).forEach(c=>{ if(!map[c.competitor]) map[c.competitor]=c })
    return Object.values(map)
  },[competitors])

  // último precio de venta de catálogo y costo reciente
  const latestCatalog = useMemo(()=> catalog.reduce((acc,c)=> acc?.date>c.date?acc:c, null),[catalog])

  const lastCost = useMemo(()=>{
    const arr = (costSeries||[]).filter(x=>x.cost!=null)
    return arr.length? arr[arr.length-1].cost : null
  },[costSeries])

  const marginPct = useMemo(()=>{
    if (scope==='producto'){
      const saleVal = latestCatalog?.sale_price ?? null
      if (saleVal!=null && saleVal>0 && lastCost!=null){
        return ((saleVal - lastCost) / saleVal) * 100
      }
      return null
    }
    // promedio (all)
    const saleAvg = saleVsComp?.sale_avg ?? null
    const profitAvg = profit?.profit_avg ?? null
    if (saleAvg!=null && saleAvg>0 && profitAvg!=null){
      return (profitAvg / saleAvg) * 100
    }
    return null
  },[scope, latestCatalog, lastCost, saleVsComp, profit])

  useEffect(()=>{ listProducts().then(setProducts).catch(()=>{}) },[])
  useEffect(()=>{ if(!selected) return; loadData(selected, period, scope) },[selected, period, scope])

  async function loadData(pid, per, sc){
    setCatalog(await listCatalog(pid))
    setCompetitors(await listCompetitors(pid))
    setCostSeries(await costTrend(pid, mapPeriod(per)))
    const ph = await listPrices(pid)
    setSaleSeries((ph||[]).filter(x=>x.sale!=null))
    setVariants(await listVariants(pid))
    setTiers(await listVariantTiers(pid))
    const target = sc==='promedio' ? 'all' : pid
    setSaleVsComp(await saleVsCompetitor(target, mapPeriod(per)))
    setProfit(await profitSummary(target, mapPeriod(per)))
  }

  const filtered = useMemo(()=>{ const q=(query||'').toLowerCase(); return products.filter(p=>p.name.toLowerCase().includes(q)) },[products,query])

  function mapPeriod(p){ if(p==='7 dias') return '7d'; if(p==='1 mes') return '1m'; if(p==='1 año') return '1y'; if(p==='Histórica') return 'historica'; return 'actual' }

  // sin edición aquí

  function Chart({ points, salePoints, showSale }){
    const width = 640, height = 180, pad = 24
    const xs = points && points.length ? points.map(p=> new Date(p.date).getTime()) : [Date.now()-86400000, Date.now()]
    const ys = points && points.length ? points.map(p=> p.cost) : [0, 1]
    const xs2 = (salePoints&&salePoints.length) ? salePoints.map(p=> new Date(p.date).getTime()) : []
    const ys2 = (salePoints&&salePoints.length) ? salePoints.map(p=> p.sale) : []
    const minX = Math.min(...xs, ...(xs2.length?xs2:[Date.now()]))
    const maxX = Math.max(...xs, ...(xs2.length?xs2:[Date.now()]))
    const minY = Math.min(...ys, ...(ys2.length?ys2:[0]))
    const maxY = Math.max(...ys, ...(ys2.length?ys2:[1]))
    const x = (t)=> pad + (width-2*pad) * ((t - minX) / Math.max(1,(maxX-minX)))
    const y = (v)=> (height-pad) - (height-2*pad) * ((v - minY) / Math.max(1,(maxY-minY)))
    const line = points && points.length ? points.map(p=> `${x(new Date(p.date).getTime())},${y(p.cost)}`).join(' ') : ''
    const lineSale = salePoints && salePoints.length ? salePoints.map(p=> `${x(new Date(p.date).getTime())},${y(p.sale)}`).join(' ') : ''
    return (
      <svg width={width} height={height} style={{ width:'100%', maxWidth:680 }}>
        <rect x="0" y="0" width={width} height={height} fill="#fff" stroke="#eee" />
        {/* eje y */}
        <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#ccc" />
        {/* eje x */}
        <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#ccc" />
        {/* linea */}
        {points && points.length ? <polyline fill="none" stroke="#3A6435" strokeWidth="2" points={line} /> : null}
        {/* puntos */}
        {points && points.length ? points.map((p,i)=> (
          <circle key={i} cx={x(new Date(p.date).getTime())} cy={y(p.cost)} r="3.5" fill="#F5822E" />
        )) : (
          <text x={width/2} y={height/2} textAnchor="middle" fill="#999" fontSize="12">Sin datos aún</text>
        )}
        {/* serie de venta opcional */}
        {showSale && salePoints && salePoints.length ? (
          <>
            <polyline fill="none" stroke="#9FB7D1" strokeWidth="2" points={lineSale} />
            {salePoints.map((p,i)=> (<rect key={`s${i}`} x={x(new Date(p.date).getTime())-3} y={y(p.sale)-3} width="6" height="6" fill="#A3C9A8" />))}
          </>
        ) : null}
      </svg>
    )
  }

  // (se movió más arriba para evitar referencia antes de inicialización)

  return (
    <div className="center">
      <h2>Precios</h2>

      <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:8, flexWrap:'wrap' }}>
        <input className="input" placeholder="Buscar producto" value={query} onChange={e=>setQuery(e.target.value)} style={{ width:240, textAlign:'center' }} />
        <select className="input" value={selected||''} onChange={e=>setSelected(Number(e.target.value))} style={{ width:240, textAlign:'center', textAlignLast:'center' }}>
          <option value="">Seleccionar producto…</option>
          {filtered.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" value={period} onChange={e=>setPeriod(e.target.value)} style={{ width:240, textAlign:'center', textAlignLast:'center' }}>
          <option>Actual</option>
          <option>7 dias</option>
          <option>1 mes</option>
          <option>1 año</option>
          <option>Histórica</option>
        </select>
        <select className="input" value={scope} onChange={e=>setScope(e.target.value)} style={{ width:240, textAlign:'center', textAlignLast:'center' }}>
          <option value="producto">Producto</option>
          <option value="promedio">Promedio de todos</option>
        </select>
      </div>

      {/* Sección: Catálogo */}
      <div className="card" style={{ padding:8, marginTop:16 }}>
        <h3 style={{ margin:'8px 0' }}>Catálogo</h3>
        {!selected ? (<div style={{ opacity:0.7 }}>Selecciona un producto</div>) : (
          <div style={{ display:'grid', gap:8, justifyItems:'center' }}>
            <div>Precio vigente: <b>{latestCatalog ? `$${latestCatalog.sale_price.toLocaleString('es-CL')}` : '-'}</b></div>
            <div>
              <button className="button ghost" onClick={()=>navigate('/catalogo/fuentes')}>Gestionar catálogo</button>
            </div>
          </div>
        )}
      </div>
      {/* Separador con título */}
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px auto', maxWidth:720 }}>
        <div style={{ height:1, background:'#eee', flex:1 }} />
        <div style={{ fontWeight:800, opacity:0.8 }}>Costos y Precio Venta</div>
        <div style={{ height:1, background:'#eee', flex:1 }} />
      </div>

      {/* Sección: Evolución de costo */}
      <div className="card" style={{ padding:8, marginTop:16 }}>
        <h3 style={{ margin:'8px 0' }}>Evolución de costo</h3>
        <div style={{ padding:'4px 0' }}>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
              <input type="checkbox" checked={showSaleSeries} onChange={e=>setShowSaleSeries(e.target.checked)} />
              <span style={{ fontSize:12, opacity:0.8 }}>Mostrar precio de venta</span>
            </label>
          </div>
          <Chart points={(costSeries||[]).filter(p=>p.cost!=null).map(p=> ({ date: p.date, cost: p.cost }))}
                 salePoints={(saleSeries||[]).map(p=> ({ date: p.date, sale: p.sale }))}
                 showSale={showSaleSeries} />
        </div>
      </div>
      {/* tarjetas de costos y ventas */}
      {/* Sección: Registros recientes (venta) */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Registros recientes (venta)</h3>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {catalog.slice(0,3).map((c,i)=> (
            <div key={i} style={{ minWidth:160, display:'grid', gap:4, padding:10, border:'1px solid #eee', borderRadius:12, background:'#fff' }}>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.date}</div>
              <div style={{ fontWeight:800 }}>${c.sale_price.toLocaleString('es-CL')}</div>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.unit||'kg'}</div>
            </div>
          ))}
          {catalog.slice(3).map((c,i)=> (
            <div key={`more-${i}`} style={{ minWidth:160, display:'grid', gap:4, padding:10, border:'1px solid #eee', borderRadius:12, background:'#fff' }}>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.date}</div>
              <div style={{ fontWeight:800 }}>${c.sale_price.toLocaleString('es-CL')}</div>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.unit||'kg'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Costos recientes */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Costos recientes</h3>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {(costSeries||[]).filter(x=>x.cost!=null).slice(-3).reverse().map((c,i)=> (
            <div key={`cost-${i}`} style={{ minWidth:160, display:'grid', gap:4, padding:10, border:'1px solid #eee', borderRadius:12, background:'#fff' }}>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.date}</div>
              <div style={{ fontWeight:800 }}>${c.cost.toLocaleString('es-CL')}</div>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.unit||''}</div>
            </div>
          ))}
          {(costSeries||[]).filter(x=>x.cost!=null).slice(0, Math.max(0, (costSeries||[]).length - 3)).map((c,i)=> (
            <div key={`cost-more-${i}`} style={{ minWidth:160, display:'grid', gap:4, padding:10, border:'1px solid #eee', borderRadius:12, background:'#fff' }}>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.date}</div>
              <div style={{ fontWeight:800 }}>${c.cost.toLocaleString('es-CL')}</div>
              <div style={{ fontSize:12, opacity:0.7 }}>{c.unit||''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor de variantes y tiers */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Variantes y escalas</h3>
        {!selected ? (<div style={{ opacity:0.7 }}>Selecciona un producto</div>) : (
          <div style={{ display:'grid', gap:8 }}>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <input className="input" placeholder="Nueva variante (ej: Hass XL)" value={newVarLabel} onChange={e=>setNewVarLabel(e.target.value)} style={{ width:260 }} />
              <button className="button" onClick={async()=>{ if(!newVarLabel.trim()) return; await createVariant({ product_id:selected, label:newVarLabel.trim() }); setNewVarLabel(''); setVariants(await listVariants(selected)) }}>Agregar variante</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <h4 style={{ margin:'8px 0' }}>Variantes</h4>
                <div style={{ maxHeight:180, overflow:'auto' }}>
                  {variants.map(v=> (<div key={v.id} style={{ padding:'6px 8px', borderBottom:'1px solid #eee' }}>{v.label}</div>))}
                </div>
              </div>
              <div>
                <h4 style={{ margin:'8px 0' }}>Nueva escala</h4>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <label>Variante<select className="input" value={newTier.variant_id} onChange={e=>setNewTier(v=>({ ...v, variant_id:e.target.value }))}><option value="">(todas)</option>{variants.map(v=> <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
                  <label>Unidad<select className="input" value={newTier.unit} onChange={e=>setNewTier(v=>({ ...v, unit:e.target.value }))}><option value="kg">kg</option><option value="unit">unidad</option></select></label>
                  <label>Cant mínima<input className="input" value={newTier.min_qty} onChange={e=>setNewTier(v=>({ ...v, min_qty:e.target.value }))} /></label>
                  <label>Precio venta<input className="input" value={newTier.sale_price} onChange={e=>setNewTier(v=>({ ...v, sale_price:e.target.value }))} /></label>
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:8 }}>
                  <button className="button" onClick={async()=>{ if(!selected||!newTier.sale_price) return; await createVariantTier({ product_id:selected, variant_id: newTier.variant_id? Number(newTier.variant_id): null, min_qty: Number(newTier.min_qty||1), unit:newTier.unit, sale_price:Number(newTier.sale_price) }); setNewTier({ variant_id:'', min_qty:'', unit:'kg', sale_price:'' }); setTiers(await listVariantTiers(selected)) }}>Agregar escala</button>
                </div>
                <div style={{ marginTop:8 }}>
                  <h4 style={{ margin:'8px 0' }}>Escalas</h4>
                  <div style={{ maxHeight:180, overflow:'auto' }}>
                    {tiers.map(t=> (
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'6px 0' }}>
                        <div>{(variants.find(v=>v.id===t.variant_id)?.label)||'(todas)'} — ≥ {t.min_qty} {t.unit}</div>
                        <div>${t.sale_price.toLocaleString('es-CL')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Separador con título */}
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px auto', maxWidth:720 }}>
        <div style={{ height:1, background:'#eee', flex:1 }} />
        <div style={{ fontWeight:800, opacity:0.8 }}>Utilidad</div>
        <div style={{ height:1, background:'#eee', flex:1 }} />
      </div>

      {/* Sección: Precio venta vs competidores */}
      {/* Separador con título */}
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px auto', maxWidth:720 }}>
        <div style={{ height:1, background:'#eee', flex:1 }} />
        <div style={{ fontWeight:800, opacity:0.8 }}>Competidores</div>
        <div style={{ height:1, background:'#eee', flex:1 }} />
      </div>
      <div className="card" style={{ padding:8, marginTop:8 }}>
        <h3 style={{ margin:'8px 0' }}>Comparación</h3>
        {!selected && scope==='producto' ? (<div style={{ opacity:0.7 }}>Selecciona un producto</div>) : (
          <div style={{ display:'grid', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>Venta propia</div>
              <div>{saleVsComp?.sale!=null?`$${saleVsComp.sale.toLocaleString('es-CL')}`:(saleVsComp?.sale_avg!=null?`$${saleVsComp.sale_avg.toLocaleString('es-CL')}`:'-')}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>Promedio competidores</div>
              <div>{saleVsComp?.competitor_avg!=null?`$${saleVsComp.competitor_avg.toLocaleString('es-CL')}`:'-'}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <button className="button ghost" onClick={()=>navigate('/precios/competidores')}>Gestionar competidores</button>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de competidores */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Detalle</h3>
        <div style={{ maxHeight:220, overflow:'auto' }}>
          {latestCompetitors.length===0 ? (
            <div style={{ opacity:0.7 }}>Sin registros</div>
          ) : latestCompetitors.map((r,i)=> (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'6px 0' }}>
              <div>{r.competitor}</div>
              <div>${(r.price||0).toLocaleString('es-CL')} {r.unit||''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Análisis de utilidad */}
      <div className="card" style={{ padding:8, marginTop:8 }}>
        <h4 style={{ margin:'8px 0' }}>Análisis de utilidad</h4>
        {!selected && scope==='producto' ? (<div style={{ opacity:0.7 }}>Selecciona un producto</div>) : (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>Utilidad estimada</div>
            <div style={{ display:'flex', gap:12, alignItems:'baseline' }}>
              <span>{profit?.profit!=null?`$${profit.profit.toLocaleString('es-CL')}`:(profit?.profit_avg!=null?`$${profit.profit_avg.toLocaleString('es-CL')}`:'-')}</span>
              <span style={{ fontSize:12, opacity:0.8 }}>{marginPct!=null?`(${marginPct.toFixed(1)}%)`:''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
