import { useEffect, useState } from 'react'
import { listProducts } from '../api/products'
import { createCatalog, createCompetitor, scrapeCompetitors } from '../api/prices'
import { listVendors, createVendor, listVendorPrices, createVendorPrice } from '../api/vendors'
import '../styles/globals.css'

export default function PreciosFuentes(){
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState('')
  const [vendors, setVendors] = useState([])
  const [vendorId, setVendorId] = useState('')
  const [catalogForm, setCatalogForm] = useState({ sale_price: '', unit: 'kg' })
  const [competitorForm, setCompetitorForm] = useState({ competitor: '', price: '', unit: 'kg' })
  const [vendorPriceForm, setVendorPriceForm] = useState({ cost: '', unit: 'kg' })
  const [csvCatalog, setCsvCatalog] = useState(null)
  const [csvCompetitor, setCsvCompetitor] = useState(null)
  const [scrapeQuery, setScrapeQuery] = useState('')
  const [scrape, setScrape] = useState([])
  const [vendorPrices, setVendorPrices] = useState([])

  useEffect(()=>{ listProducts().then(setProducts).catch(()=>{}); listVendors().then(setVendors).catch(()=>{}) },[])
  useEffect(()=>{ if(!selected||!vendorId) { setVendorPrices([]); return } listVendorPrices(Number(selected), Number(vendorId)).then(setVendorPrices).catch(()=>{}) },[selected, vendorId])

  async function saveCatalog(){ if(!selected||!catalogForm.sale_price) return; await createCatalog({ product_id:Number(selected), sale_price:Number(catalogForm.sale_price), unit:catalogForm.unit }); setCatalogForm({ sale_price:'', unit:'kg' }) }
  async function saveCompetitor(){ if(!selected||!competitorForm.price||!competitorForm.competitor) return; await createCompetitor({ product_id:Number(selected), competitor:competitorForm.competitor, price:Number(competitorForm.price), unit:competitorForm.unit }); setCompetitorForm({ competitor:'', price:'', unit:'kg' }) }
  async function saveVendorPrice(){ if(!selected||!vendorId||!vendorPriceForm.cost) return; await createVendorPrice({ product_id:Number(selected), vendor_id:Number(vendorId), cost:Number(vendorPriceForm.cost), unit:vendorPriceForm.unit }); setVendorPriceForm({ cost:'', unit:'kg' }); const rows = await listVendorPrices(Number(selected), Number(vendorId)); setVendorPrices(rows) }
  async function addVendor(){ const name=prompt('Nombre del proveedor'); if(!name) return; await createVendor({ name }); setVendors(await listVendors()) }

  async function importCsv(file, endpoint){ if(!file) return; const text = await file.text(); const rows=text.split(/\r?\n/).slice(1).filter(Boolean); for(const line of rows){ const cols=line.split(','); if(endpoint==='catalog'){ const [product_id,date,sale_price,unit] = cols; if(product_id&&sale_price) await createCatalog({ product_id:Number(product_id), date, sale_price:Number(sale_price), unit:unit||null }) } else { const [product_id,competitor,date,price,unit] = cols; if(product_id&&price) await createCompetitor({ product_id:Number(product_id), competitor:competitor||'csv', date, price:Number(price), unit:unit||null }) } } alert('Importado') }

  async function doScrape(){ if(!scrapeQuery.trim()) return; setScrape(await scrapeCompetitors(scrapeQuery.trim())) }

  return (
    <div className="center">
      <h2>Fuentes de precios</h2>
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:8 }}>
        <select className="input" value={selected} onChange={e=>setSelected(e.target.value)} style={{ maxWidth:260 }}>
          <option value="">Seleccionar producto…</option>
          {products.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" value={vendorId} onChange={e=>setVendorId(e.target.value)} style={{ maxWidth:260 }}>
          <option value="">Proveedor…</option>
          {vendors.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button className="button ghost" onClick={addVendor}>+ Proveedor</button>
      </div>

      {/* 1) Manual primero */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Agregar manual</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>Catálogo (venta)</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input className="input" placeholder="Precio" value={catalogForm.sale_price} onChange={e=>setCatalogForm(v=>({...v, sale_price:e.target.value}))} style={{ maxWidth:140 }} />
              <select className="input" value={catalogForm.unit} onChange={e=>setCatalogForm(v=>({...v, unit:e.target.value}))} style={{ maxWidth:120 }}>
                <option value="kg">kg</option>
                <option value="unit">unidad</option>
              </select>
              <button className="button" onClick={saveCatalog} disabled={!selected}>Guardar</button>
            </div>
          </div>
          <div style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>Competidor</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <input className="input" placeholder="Nombre competidor" value={competitorForm.competitor} onChange={e=>setCompetitorForm(v=>({...v, competitor:e.target.value}))} style={{ maxWidth:180 }} />
              <input className="input" placeholder="Precio" value={competitorForm.price} onChange={e=>setCompetitorForm(v=>({...v, price:e.target.value}))} style={{ maxWidth:140 }} />
              <select className="input" value={competitorForm.unit} onChange={e=>setCompetitorForm(v=>({...v, unit:e.target.value}))} style={{ maxWidth:120 }}>
                <option value="kg">kg</option>
                <option value="unit">unidad</option>
              </select>
              <button className="button" onClick={saveCompetitor} disabled={!selected}>Guardar</button>
            </div>
          </div>
          <div style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>Proveedor</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ minWidth:180 }}>{vendors.find(v=>String(v.id)===String(vendorId))?.name || 'Proveedor'}</div>
              <input className="input" placeholder="Costo" value={vendorPriceForm.cost} onChange={e=>setVendorPriceForm(v=>({...v, cost:e.target.value}))} style={{ maxWidth:140 }} />
              <select className="input" value={vendorPriceForm.unit} onChange={e=>setVendorPriceForm(v=>({...v, unit:e.target.value}))} style={{ maxWidth:120 }}>
                <option value="kg">kg</option>
                <option value="unit">unidad</option>
              </select>
              <button className="button" onClick={saveVendorPrice} disabled={!selected||!vendorId}>Guardar</button>
            </div>
            <div style={{ marginTop:8, maxHeight:140, overflow:'auto' }}>
              {vendorPrices.map((r,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'4px 0' }}>
                  <div>{r.date}</div>
                  <div>${(r.cost||0).toLocaleString('es-CL')} {r.unit||''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2) CSV luego */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Importar CSV</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>Catálogo</div>
            <label className="button ghost" style={{ display:'inline-block', cursor:'pointer' }}>
              Seleccionar CSV
              <input type="file" accept=".csv" style={{ display:'none' }} onChange={e=>setCsvCatalog(e.target.files?.[0]||null)} />
            </label>
            <button className="button" onClick={()=>importCsv(csvCatalog,'catalog')} disabled={!csvCatalog}>Importar</button>
          </div>
          <div style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>Competidores</div>
            <label className="button ghost" style={{ display:'inline-block', cursor:'pointer' }}>
              Seleccionar CSV
              <input type="file" accept=".csv" style={{ display:'none' }} onChange={e=>setCsvCompetitor(e.target.files?.[0]||null)} />
            </label>
            <button className="button" onClick={()=>importCsv(csvCompetitor,'competitor')} disabled={!csvCompetitor}>Importar</button>
          </div>
        </div>
      </div>

      {/* 3) Scraping al final */}
      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Scraping (referencia rápida)</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
          <input className="input" placeholder="Buscar en sitios (ej: palta)" value={scrapeQuery} onChange={e=>setScrapeQuery(e.target.value)} style={{ maxWidth:260 }} />
          <button className="button" onClick={doScrape}>Scrapear</button>
        </div>
        <div style={{ maxHeight:240, overflow:'auto', marginTop:8 }}>
          {scrape.map((r,idx)=>(<div key={idx} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'4px 0' }}><div>{r.competitor}</div><div>${(r.price||0).toLocaleString('es-CL')}</div></div>))}
        </div>
      </div>
    </div>
  )
}
