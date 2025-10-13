import { useEffect, useState } from 'react'
import { listProducts } from '../api/products'
import { listCompetitors, createCompetitor } from '../api/prices'
import '../styles/globals.css'

export default function PreciosCompetidores(){
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ competitor:'', price:'', unit:'kg' })

  useEffect(()=>{ listProducts().then(setProducts).catch(()=>{}) },[])
  useEffect(()=>{ if(!selected){ setRows([]); return } listCompetitors(Number(selected)).then(setRows).catch(()=>{}) },[selected])

  async function save(){ if(!selected||!form.price||!form.competitor) return; await createCompetitor({ product_id:Number(selected), competitor:form.competitor, price:Number(form.price), unit:form.unit }); setForm({ competitor:'', price:'', unit:'kg' }); setRows(await listCompetitors(Number(selected))) }

  return (
    <div className="center">
      <h2>Competidores</h2>
      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        <select className="input" value={selected} onChange={e=>setSelected(e.target.value)} style={{ maxWidth:260 }}>
          <option value="">Selecciona producto…</option>
          {products.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Agregar precio de competidor</h3>
        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Nombre" value={form.competitor} onChange={e=>setForm(v=>({ ...v, competitor:e.target.value }))} style={{ maxWidth:200 }} />
          <input className="input" placeholder="Precio" value={form.price} onChange={e=>setForm(v=>({ ...v, price:e.target.value }))} style={{ maxWidth:140 }} />
          <select className="input" value={form.unit} onChange={e=>setForm(v=>({ ...v, unit:e.target.value }))} style={{ maxWidth:120 }}>
            <option value="kg">kg</option>
            <option value="unit">unidad</option>
          </select>
          <button className="button" onClick={save} disabled={!selected}>Guardar</button>
        </div>
      </div>

      <div className="card" style={{ padding:8, marginTop:12 }}>
        <h3 style={{ margin:'8px 0' }}>Registros</h3>
        <div style={{ maxHeight:240, overflow:'auto' }}>
          {rows.map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'6px 0' }}>
              <div>{r.date}</div>
              <div>{r.competitor}</div>
              <div>${(r.price||0).toLocaleString('es-CL')} {r.unit||''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



