import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import { listCustomers, createCustomer } from '../api/customers'
import { listProducts } from '../api/products'
import { listVariants, listVariantTiers } from '../api/variants'
import ProductResolvePanel from '../components/ProductResolvePanel'
import '../styles/globals.css'

export default function Pedidos() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [allName, setAllName] = useState('')
  const [draftDetail, setDraftDetail] = useState(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteIdx, setNoteIdx] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [resolveOpen, setResolveOpen] = useState(false)
  const [newCustOpen, setNewCustOpen] = useState(false)
  const [newCustForIdx, setNewCustForIdx] = useState(null)
  const [newCustForAll, setNewCustForAll] = useState(false)
  const [newCust, setNewCust] = useState({ name:'', phone:'', rut:'', nickname:'', preferences:'', personality:'', address:'', email:'' })
  const [newCustError, setNewCustError] = useState('')
  const [variantsByProduct, setVariantsByProduct] = useState({})
  const [tiersByProduct, setTiersByProduct] = useState({})
  const [productsById, setProductsById] = useState({})

  useEffect(() => { listCustomers().then(setCustomers).catch(() => {}); refreshDraft(); listProducts().then(ps=>{ const m={}; (ps||[]).forEach(p=>{ m[p.id]=p }); setProductsById(m) }).catch(()=>{}) }, [])

  async function refreshDraft(){
    try{ const d = await apiFetch('/orders/draft/detail', { method: 'GET' }); setDraftDetail(d) }catch{ /* ignore */ }
  }

  async function parse() {
    setLoading(true)
    try {
      const res = await apiFetch('/orders/parse', { method: 'POST', body: { text } })
      setRows(res.items || [])
      setClientsAssigned(false) // Reset cuando se parsean nuevos items
      setAllName('') // Limpiar selección de cliente
    } finally { setLoading(false) }
  }

  async function ensureVariantData(productId){
    if(!productId) return
    if(!variantsByProduct[productId]){
      try{ const vs = await listVariants(productId); setVariantsByProduct(v=>({ ...v, [productId]: vs||[] })) }catch{}
    }
    if(!tiersByProduct[productId]){
      try{ const ts = await listVariantTiers(productId); setTiersByProduct(v=>({ ...v, [productId]: ts||[] })) }catch{}
    }
  }

  function tierPriceFor(pid, variantId, unit, qty){
    try{
      // Determinar unidad base de cobro: preferir 'kg' si hay escalas en kg, si no 'unit', si no fallback 'kg'
      const allTiers = (tiersByProduct[pid]||[]).filter(t=> String(t.variant_id||'')===String(variantId||''))
      const hasKg = allTiers.some(t=> (t.unit||'kg')==='kg')
      const hasUnit = allTiers.some(t=> (t.unit||'kg')==='unit')
      const baseUnit = hasKg? 'kg' : (hasUnit? 'unit' : 'kg')

      // Convertir la cantidad ingresada a la unidad base usando ratio observado del borrador
      let qtyBase = Number(qty||0)
      try{
        const gp = (draftDetail?.group_by_product||[]).find(g=> String(g.product_id)===String(pid))
        const tot = gp?.totals||{}
        const totalUnits = Number(tot.unit||0)
        const totalKg = Number(tot.kg||0)
        const unitsPerKg = (totalKg>0 && totalUnits>0)? (totalUnits/totalKg) : null
        // Normalizar origen a base
        if ((unit||'kg') === baseUnit){
          qtyBase = Number(qty||0)
        }else if ((unit||'kg')==='unit' && baseUnit==='kg'){
          qtyBase = unitsPerKg? (Number(qty||0)/unitsPerKg) : Number(qty||0) // fallback 1:1
        }else if ((unit||'kg')==='kg' && baseUnit==='unit'){
          qtyBase = unitsPerKg? (Number(qty||0)*unitsPerKg) : Number(qty||0)
        }else if ((unit||'kg')==='g' && baseUnit==='kg'){
          qtyBase = Number(qty||0)/1000
        }
      }catch{}

      const tiers = (tiersByProduct[pid]||[]).filter(t=> (t.unit||'kg')===baseUnit && String(t.variant_id||'')===String(variantId||''))
      const sorted = tiers.sort((a,b)=> Number(b.min_qty||0) - Number(a.min_qty||0))
      const match = sorted.find(t=> Number(qtyBase||0) >= Number(t.min_qty||0))
      return match? Number(match.sale_price||0) : null
    }catch{ return null }
  }

  // Precio por unidad en charged_unit (unidad de cobro del producto)
  function tierPriceInChargedUnit(pid, variantId, unit, qty){
    try{
      // Determinar charged_unit desde el producto
      const product = productsById[pid]
      const chargedUnit = product?.default_unit || unit || 'kg'
      
      // Buscar precio en la unidad de cobro
      const tiers = (tiersByProduct[pid]||[]).filter(t=> (t.unit||'kg')=== chargedUnit && String(t.variant_id||'')===String(variantId||''))
      const sorted = tiers.sort((a,b)=> Number(b.min_qty||0) - Number(a.min_qty||0))
      const match = sorted.find(t=> Number(qty||0) >= Number(t.min_qty||0))
      return match? Number(match.sale_price||0) : null
    }catch{ return null }
  }

  // Calcular y sincronizar el precio de venta por unidad en charged_unit (unidad de cobro)
  // SOLO cuando cambian las variantes/tiers, NO cuando cambian los rows (evita loop)
  useEffect(()=>{
    let changed = false
    const next = rows.map(x=>{
      if (!x?.product_id) return x
      // No sobrescribir si ya tiene un precio manual
      if (x.sale_unit_price && x.sale_unit_price > 0 && x.manual_price) return x
      
      const u = x.unit || 'kg'
      const q = x.qty || 0
      // El precio DEBE estar en charged_unit (unidad de cobro), no en la unidad pedida
      const p = tierPriceInChargedUnit(x.product_id, x.variant_id||'', u, q)
      if (p!=null && Number(x.sale_unit_price||0) !== Number(p)){
        changed = true
        return { ...x, sale_unit_price: Number(p) }
      }
      return x
    })
    if (changed) setRows(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tiersByProduct, variantsByProduct, productsById])

  // Prefetch de variantes/tiers para productos presentes en filas parseadas
  useEffect(()=>{
    const ids = Array.from(new Set(rows.map(r=> r.product_id).filter(Boolean)))
    ids.forEach(pid=>{
      if(!variantsByProduct[pid]){ listVariants(pid).then(v=> setVariantsByProduct(prev=>({ ...prev, [pid]: v||[] }))).catch(()=>{}) }
      if(!tiersByProduct[pid]){ listVariantTiers(pid).then(t=> setTiersByProduct(prev=>({ ...prev, [pid]: t||[] }))).catch(()=>{}) }
    })
  },[rows])

  // Prefijar variante 'kivi' en filas cuando existan variantes y aún no se selecciona una
  useEffect(()=>{
    setRows(rs=> rs.map(x=>{
      if (!x?.product_id) return x
      if (x?.variant_id) return x
      const vs = variantsByProduct[x.product_id]||[]
      const kivi = vs.find(v=> String(v.label||'').toLowerCase()==='kivi')
      if (kivi){ return { ...x, variant_id: String(kivi.id) } }
      return x
    }))
  },[variantsByProduct])

  function applyAll() { 
    if(!allName.trim()) return
    setRows(rows.map(r => ({ ...r, customer: allName.trim() })))
    setClientsAssigned(true)
  }

  async function saveToDraft() {
    if (unresolved.length > 0) { alert('Resuelve los productos pendientes antes de guardar'); return }
    const items = rows.map(r => ({
      customer: r.customer,
      product: r.product,
      qty: r.qty,
      unit: r.unit,
      notes: r.notes,
      variant_id: r.variant_id || null,
      sale_unit_price: r.sale_unit_price || null,
      product_id: r.product_id || null,
      create_if_missing: !!r.create_if_missing,
      sale_price: r.sale_price || null,
      line_index: r.line_index,
      default_unit: r.default_unit || null, // Pasar el default_unit para productos nuevos
      charged_unit: (r.product_id && productsById[r.product_id]?.default_unit) || r.default_unit || r.charged_unit || r.unit || 'kg',
    }))
    await apiFetch('/orders/draft/items', { method: 'POST', body: { items } })
    setRows([])
    setText('')
    setClientsAssigned(false)
    setAllName('')
    await refreshDraft()
    alert('Guardado en borrador')
  }

  function openNote(i){ setNoteIdx(i); setNoteText(rows[i].notes || ''); setNoteOpen(true) }
  function saveNote(){ if (noteIdx==null) return; setRows(rows.map((r, i) => i === noteIdx ? { ...r, notes: noteText } : r)); setNoteOpen(false); setNoteIdx(null); setNoteText('') }

  async function emitDraft(){
    // si hay filas sin guardar, agrégalas primero
    if (rows.length > 0) {
      const items = rows.map(r => ({
        customer: r.customer,
        product: r.product,
        qty: r.qty,
        unit: r.unit,
        notes: r.notes,
        variant_id: r.variant_id || null,
        sale_unit_price: r.sale_unit_price || null,
        product_id: r.product_id || null,
        create_if_missing: !!r.create_if_missing,
        sale_price: r.sale_price || null,
        line_index: r.line_index,
        charged_unit: (r.product_id && productsById[r.product_id]?.default_unit) || r.charged_unit || r.unit || 'kg',
      }))
      await apiFetch('/orders/draft/items', { method: 'POST', body: { items } })
      setRows([])
    }
    await apiFetch('/orders/draft/confirm', { method: 'POST' })
    await refreshDraft()
    alert('Pedido emitido')
  }

  const unresolved = useMemo(() => rows.filter(r => r.match_status !== 'exact'), [rows])
  const [clientsAssigned, setClientsAssigned] = useState(false)
  const allRowsHaveCustomer = useMemo(() => rows.length > 0 && rows.every(r => r.customer?.trim()), [rows])

  function statusBadge(r){
    const st = r.match_status
    const label = st === 'exact' ? '✓' : (st === 'similar' ? '~' : '!')
    const cls = st === 'exact' ? 'ok' : (st === 'similar' ? 'warn' : 'danger')
    return (
      <span className={`badge ${cls}`} style={{ fontSize:14, padding:'4px 8px' }}>
        {label}
      </span>
    )
  }

  function handleResolve(item, action){
    // action: { product_id } o { create_if_missing:true, sale_price, default_unit }
    setRows(rs => rs.map(x => {
      if ((x.line_index ?? x.index) !== (item.line_index ?? item.index)) return x
      if (action.product_id){
        return { ...x, product_id: action.product_id, product: action.product_name || x.product, match_status: 'exact' }
      }
      if (action.create_if_missing){
        return { 
          ...x, 
          product: action.product || x.product, 
          create_if_missing: true, 
          sale_price: action.sale_price,
          sale_unit_price: action.sale_price, // Guardar también como sale_unit_price
          default_unit: action.default_unit || 'kg',
          match_status: 'exact' 
        }
      }
      return x
    }))
  }

  return (
    <div className="center" style={{ padding:'12px', maxWidth:'100%' }}>
      <h2 style={{ margin:'0 0 16px 0', textAlign:'center' }}>Pedidos</h2>
      
      {/* SECCIÓN 1: Pegar pedidos */}
      <div className="card" style={{ padding:16, marginBottom:12 }}>
        <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>📝 Pegar Pedidos</h3>
        <textarea 
          rows={5} 
          className="input" 
          placeholder="Pega aquí los mensajes de pedidos" 
          value={text} 
          onChange={e => setText(e.target.value)}
          style={{ width:'100%', resize:'vertical' }}
        />
        <button 
          className="button" 
          onClick={parse} 
          disabled={loading || !text.trim()}
          style={{ marginTop:8, width:'100%' }}
        >
          {loading ? 'Parseando...' : 'Parsear'}
        </button>
      </div>

      {/* SECCIÓN 2: Items parseados (solo si hay) */}
      {rows.length > 0 && (
        <>
          {/* Asignar cliente */}
          <div className="card" style={{ padding:16, marginBottom:12 }}>
            <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>👤 Asignar Cliente</h3>
            <select 
              className="input" 
              value={allName} 
              onChange={e=>setAllName(e.target.value)} 
              style={{ width:'100%', marginBottom:8 }}
            >
            <option value="">Seleccionar cliente…</option>
            {customers.map(c=> (<option key={c.id} value={c.name}>{c.name}</option>))}
          </select>
            <div style={{ display:'flex', gap:8 }}>
              <button 
                className="button" 
                onClick={applyAll} 
                disabled={!rows.length || !allName.trim()}
                style={{ flex:1 }}
              >
                Asignar
              </button>
              <button 
                className="button ghost" 
                onClick={()=>{ setNewCustOpen(true); setNewCustForAll(true); setNewCustForIdx(null); setNewCust({ name:'', phone:'', rut:'', nickname:'', preferences:'', personality:'', address:'', email:'' }); setNewCustError('') }}
                style={{ flex:1 }}
              >
                + Nuevo
              </button>
            </div>
            {clientsAssigned && allRowsHaveCustomer && (
              <div style={{ marginTop:8, padding:8, background:'#d4edda', borderRadius:8, textAlign:'center', fontSize:14 }}>
                ✓ Cliente asignado a todos los items
              </div>
            )}
          </div>

          {/* Lista de items */}
          <div className="card" style={{ padding:16, marginBottom:12 }}>
            <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>🛒 Items ({rows.length})</h3>
            <div style={{ display:'grid', gap:12 }}>
              {rows.map((r, i) => (
                <div key={i} style={{ padding:12, background:'#f8f9fa', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <input 
                      className="input" 
                      value={r.product || ''} 
                      onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, product: e.target.value } : x))} 
                      placeholder="Producto"
                      style={{ flex:1, marginRight:8, padding:'8px 12px' }}
                    />
                    {statusBadge(r)}
                  </div>
                  
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:8, marginBottom:8 }}>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Cantidad" 
                      value={r.qty} 
                      onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, qty: parseFloat(e.target.value || '0') } : x))} 
                      style={{ padding:'8px 12px' }}
                    />
                    <select 
                      className="input" 
                      value={r.unit} 
                      onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} 
                      style={{ padding:'8px 12px' }}
                    >
                      <option value="kg">kg</option>
                      <option value="unit">unid</option>
                      <option value="g">g</option>
                    </select>
                    <button 
                      className="button ghost" 
                      onClick={() => setRows(rows.filter((_, idx) => idx !== i))} 
                      style={{ padding:'8px' }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Variante y precio */}
                  {r.product_id && (variantsByProduct[r.product_id]||[]).length>0 && (
                    <div style={{ display:'grid', gap:8 }}>
                      <select 
                        className="input" 
                        value={r.variant_id||''} 
                        onChange={e=> setRows(rs=> rs.map((x,idx)=> idx===i? { ...x, variant_id: e.target.value }: x))} 
                        style={{ padding:'8px 12px' }}
                      >
                        <option value="">Variante (todas)</option>
                        {(variantsByProduct[r.product_id]||[]).map(v=> (<option key={v.id} value={v.id}>{v.label}</option>))}
                      </select>
                      
                      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                        <span style={{ opacity:0.7 }}>
                          Precio ({productsById[r.product_id]?.default_unit || 'kg'}):
                        </span>
                        <span style={{ fontWeight:600 }}>
                          {r.sale_unit_price ? `$${Number(r.sale_unit_price).toLocaleString('es-CL')}` : '-'}
                        </span>
                      </div>

                      <input 
                        type="number" 
                        className="input" 
                        placeholder="Sobreescribir precio" 
                        value={r.sale_unit_price||''} 
                        onChange={e=> setRows(rs=> rs.map((x,idx)=> idx===i? { 
                          ...x, 
                          sale_unit_price: (e.target.value===''? null : Number(e.target.value)),
                          manual_price: e.target.value !== '' // Marcar como manual
                        }: x))} 
                        style={{ padding:'8px 12px' }}
                      />
                    </div>
                  )}

                  <button 
                    className="button ghost" 
                    onClick={() => openNote(i)} 
                    style={{ marginTop:8, width:'100%', fontSize:13 }}
                  >
                    📝 {r.notes ? 'Editar nota' : 'Agregar nota'}
                  </button>
        </div>
              ))}
        </div>
      </div>

          {/* Acciones */}
          <div className="card" style={{ padding:16, marginBottom:12 }}>
            <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>⚡ Acciones</h3>
            <div style={{ display:'grid', gap:8 }}>
              {unresolved.length>0 && (
                <button 
                  className="button" 
                  onClick={()=>setResolveOpen(true)}
                  style={{ background:'#ffc107', color:'#000' }}
                >
                  Resolver productos ({unresolved.length})
                </button>
              )}
              <button 
                className="button" 
                onClick={saveToDraft} 
                disabled={unresolved.length>0 || !allRowsHaveCustomer}
                style={{ opacity:(unresolved.length>0 || !allRowsHaveCustomer)?0.5:1 }}
              >
                Guardar en borrador
              </button>
            </div>
            {!allRowsHaveCustomer && (
              <div style={{ marginTop:8, padding:8, background:'#fff3cd', borderRadius:8, textAlign:'center', fontSize:13 }}>
                ⚠️ Asigna un cliente para guardar
              </div>
            )}
          </div>
        </>
      )}

      {/* Resumen permanente del borrador */}
      <div className="card" style={{ padding:16, marginTop:12 }}>
        <h3 style={{ margin:'0 0 12px 0', fontSize:16 }}>📋 Borrador ({(draftDetail?.items || []).length})</h3>
        <div style={{ maxHeight: 280, overflow: 'auto' }}>
          {(draftDetail?.items || []).length === 0 ? (
            <div style={{ textAlign:'center', padding:24, opacity:0.6 }}>
              Sin ítems en el borrador
            </div>
          ) : (
            <div style={{ display:'grid', gap:8 }}>
              {(draftDetail.items || []).map((it) => (
                <div key={it.id} style={{ padding:12, background:'#f8f9fa', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{it.customer_name || 'Cliente'}</div>
                  <div style={{ fontSize:14, opacity:0.85 }}>
                    {it.product_name || `Producto #${it.product_id}`}
                  </div>
                  <div style={{ fontSize:14, marginTop:4 }}>
                    {it.qty} {it.unit}
                  </div>
                  {it.notes && (
                    <div style={{ fontSize:12, opacity:0.7, marginTop:6, fontStyle:'italic' }}>
                      💬 {it.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {noteOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: 360 }}>
            <h3 style={{ marginTop: 0 }}>Nota del cliente</h3>
            <textarea rows={4} className="input" value={noteText} onChange={e=>setNoteText(e.target.value)} />
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8 }}>
              <button className="button ghost" onClick={()=>{setNoteOpen(false); setNoteIdx(null)}}>Cancelar</button>
              <button className="button" onClick={saveNote}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {resolveOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 680 }}>
            <h2 style={{ marginTop: 4, textAlign:'center' }}>Resolver productos pendientes</h2>
            <div style={{ margin:'8px 0 12px', fontSize:13, opacity:0.8, textAlign:'center' }}>Revisa sugerencias, edita el nombre o crea un producto nuevo con su precio de venta.</div>
            <ProductResolvePanel items={unresolved} onResolve={handleResolve} onCancel={()=>setResolveOpen(false)} />
          </div>
        </div>
      )}

      {newCustOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Nuevo cliente</h3>
            <div style={{ display:'grid', gap:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label>Nombre completo<input className="input" value={newCust.name} onChange={e=>setNewCust(v=>({ ...v, name:e.target.value }))} /></label>
                <label>Teléfono<input className="input" value={newCust.phone} onChange={e=>setNewCust(v=>({ ...v, phone:e.target.value }))} /></label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label>RUT<input className="input" value={newCust.rut} onChange={e=>setNewCust(v=>({ ...v, rut:e.target.value }))} /></label>
                <label>Sobrenombre<input className="input" value={newCust.nickname} onChange={e=>setNewCust(v=>({ ...v, nickname:e.target.value }))} /></label>
              </div>
              <label>Gustos<textarea rows={2} className="input" value={newCust.preferences} onChange={e=>setNewCust(v=>({ ...v, preferences:e.target.value }))} /></label>
              <label>Personalidad<textarea rows={2} className="input" value={newCust.personality} onChange={e=>setNewCust(v=>({ ...v, personality:e.target.value }))} /></label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label>Dirección<input className="input" value={newCust.address} onChange={e=>setNewCust(v=>({ ...v, address:e.target.value }))} /></label>
                <label>Email<input className="input" value={newCust.email} onChange={e=>setNewCust(v=>({ ...v, email:e.target.value }))} /></label>
              </div>
              {newCustError ? <div style={{ color:'#b02a37', fontSize:12, textAlign:'center' }}>{newCustError}</div> : null}
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button className="button ghost" onClick={()=>setNewCustOpen(false)}>Cancelar</button>
                <button className="button" onClick={async()=>{
                  if(!(newCust.name||'').trim() || !(newCust.phone||'').trim()){ setNewCustError('Nombre y teléfono son obligatorios'); return }
                  try{
                    await createCustomer(newCust)
                    const list = await listCustomers(); setCustomers(list)
                    if (newCustForAll){ setRows(rs=> rs.map(x=> ({ ...x, customer: newCust.name }))); setAllName(newCust.name) }
                    else if (newCustForIdx!=null){ setRows(rs=> rs.map((x,idx)=> idx===newCustForIdx? { ...x, customer: newCust.name }: x)) }
                    setNewCustOpen(false); setNewCustForIdx(null); setNewCustForAll(false)
                  }catch{ setNewCustError('No se pudo crear el cliente') }
                }}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(draftDetail?.items || []).length > 0 && (
        <button 
          onClick={emitDraft} 
          disabled={rows.length > 0 || unresolved.length > 0} 
          className="button" 
          style={{ 
            position:'fixed', 
            left:'50%', 
            transform:'translateX(-50%)', 
            bottom:16, 
            borderRadius:999, 
            padding:'12px 24px', 
            zIndex:1000, 
            opacity: (rows.length > 0 || unresolved.length > 0) ? 0.5 : 1,
            fontSize:16,
            fontWeight:600
          }}
        >
          🚀 Emitir pedido
        </button>
      )}
      {rows.length > 0 && (
        <div style={{ 
          position:'fixed', 
          left:'50%', 
          transform:'translateX(-50%)', 
          bottom:16, 
          background:'#fff3cd', 
          padding:'8px 16px', 
          borderRadius:999, 
          fontSize:13,
          boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
        }}>
          ⚠️ Guarda los items antes de emitir
        </div>
      )}
    </div>
  )
}
