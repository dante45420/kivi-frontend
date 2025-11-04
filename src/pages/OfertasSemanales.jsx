import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { listProducts } from '../api/products'
import ImageUploader from '../components/ImageUploader'
import '../styles/globals.css'

export default function OfertasSemanales() {
  const [currentOffers, setCurrentOffers] = useState({ fruta: null, verdura: null, especial: null })
  const [nextOffers, setNextOffers] = useState({ fruta: null, verdura: null, especial: null })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeWeek, setActiveWeek] = useState('current') // 'current' o 'next'
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({ product_id: null, price: '', reference_price: '', quality_photo_url: '' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOffers()
    loadProducts()
  }, [])

  async function loadOffers() {
    try {
      const currentData = await apiFetch('/weekly-offers')
      setCurrentOffers(currentData)
      
      // Cargar ofertas de próxima semana (requiere autenticación)
      try {
        const nextData = await apiFetch('/weekly-offers/next-week')
        setNextOffers({
          fruta: nextData.fruta,
          verdura: nextData.verdura,
          especial: nextData.especial
        })
      } catch(err) {
        console.warn('No se pudieron cargar ofertas de próxima semana:', err)
      }
    } catch(err) {
      console.error('Error cargando ofertas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const data = await listProducts()
      setProducts(data)
    } catch(err) {
      console.error('Error cargando productos:', err)
    }
  }

  function startEdit(type) {
    const offers = activeWeek === 'current' ? currentOffers : nextOffers
    const offer = offers[type]
    setEditingType(type)
    setFormData({
      product_id: offer?.product_id || null,
      price: offer?.price || '',
      reference_price: offer?.reference_price || '',
      quality_photo_url: offer?.product?.quality_photo_url || ''
    })
    setSearchTerm('')
  }

  async function handleSave() {
    if (!editingType || !formData.product_id) {
      alert('⚠️ Debes seleccionar un producto')
      return
    }

    try {
      await apiFetch('/weekly-offers', {
        method: 'POST',
        body: {
          type: editingType,
          product_id: formData.product_id,
          price: formData.price,
          reference_price: formData.reference_price,
          quality_photo_url: formData.quality_photo_url,
          week_target: activeWeek // 'current' o 'next'
        }
      })
      alert(`✓ Oferta ${activeWeek === 'current' ? 'de esta semana' : 'de próxima semana'} guardada correctamente`)
      setEditingType(null)
      await loadOffers()
      await loadProducts() // Recargar productos para actualizar foto
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo guardar la oferta'))
    }
  }

  // Filtrar productos para el selector
  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true
    return p.name.toLowerCase().includes(searchTerm.toLowerCase())
  }).slice(0, 10) // Limitar a 10 resultados para el dropdown

  const offerConfig = {
    fruta: { 
      title: '🍎 Fruta de la Semana', 
      label: '¡Fruta de la semana!',
      bgColor: '#fef3e0',
      borderColor: '#ff9800'
    },
    verdura: { 
      title: '🥬 Verdura de la Semana', 
      label: '¡Verdura de la semana!',
      bgColor: '#e8f5e9',
      borderColor: '#4caf50'
    },
    especial: { 
      title: '⭐ Especial de la Semana', 
      label: '¡Fruta Especial de la semana!',
      bgColor: '#fff3e0',
      borderColor: '#ff9800'
    }
  }

  const offers = activeWeek === 'current' ? currentOffers : nextOffers

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'24px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:32, fontWeight:800 }}>⭐ Ofertas Semanales</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Edita las ofertas que aparecen en la primera página del catálogo</p>
      </div>

      {/* Selector de semana */}
      <div style={{ 
        display:'flex', 
        gap:12, 
        justifyContent:'center', 
        marginBottom:24,
        background:'white',
        padding:8,
        borderRadius:12,
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <button
          onClick={() => {
            setActiveWeek('current')
            setEditingType(null)
          }}
          style={{
            padding:'10px 24px',
            borderRadius:8,
            border:'2px solid',
            background: activeWeek === 'current' ? '#88C4A8' : 'white',
            color: activeWeek === 'current' ? 'white' : '#88C4A8',
            borderColor: '#88C4A8',
            cursor:'pointer',
            fontSize:14,
            fontWeight:600,
            transition:'all 0.2s'
          }}
        >
          📅 Esta Semana
        </button>
        <button
          onClick={() => {
            setActiveWeek('next')
            setEditingType(null)
          }}
          style={{
            padding:'10px 24px',
            borderRadius:8,
            border:'2px solid',
            background: activeWeek === 'next' ? '#88C4A8' : 'white',
            color: activeWeek === 'next' ? 'white' : '#88C4A8',
            borderColor: '#88C4A8',
            cursor:'pointer',
            fontSize:14,
            fontWeight:600,
            transition:'all 0.2s'
          }}
        >
          📅 Próxima Semana
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>Cargando...</div>
      ) : (
        <div style={{ display:'grid', gap:24 }}>
          {Object.entries(offerConfig).map(([type, config]) => {
            const offer = offers[type]
            const isEditing = editingType === type

            return (
              <div
                key={type}
                style={{
                  background:'white',
                  borderRadius:20,
                  padding:24,
                  border:`2px solid ${config.borderColor}`,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{config.title}</h3>
                  <button
                    onClick={() => isEditing ? setEditingType(null) : startEdit(type)}
                    style={{
                      padding:'10px 20px',
                      borderRadius:12,
                      background:isEditing ? '#ccc' : '#88C4A8',
                      color:'white',
                      border:'none',
                      cursor:'pointer',
                      fontSize:14,
                      fontWeight:600
                    }}
                  >
                    {isEditing ? 'Cancelar' : offer ? '✏️ Editar' : '➕ Crear'}
                  </button>
                </div>

                {isEditing ? (
                  <div style={{ display:'grid', gap:16 }}>
                    {/* Selector de Producto */}
                    <div>
                      <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                        Seleccionar Producto *
                      </label>
                      
                      {/* Búsqueda de producto */}
                      <input
                        type="text"
                        className="input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar producto..."
                        style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15, marginBottom:8 }}
                      />

                      {/* Lista de productos filtrados */}
                      {searchTerm && filteredProducts.length > 0 && (
                        <div style={{
                          maxHeight:200,
                          overflowY:'auto',
                          border:'2px solid #e0e0e0',
                          borderRadius:12,
                          background:'white'
                        }}>
                          {filteredProducts.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  product_id: p.id,
                                  quality_photo_url: p.quality_photo_url || ''
                                })
                                setSearchTerm('')
                              }}
                              style={{
                                padding:'12px 16px',
                                cursor:'pointer',
                                borderBottom:'1px solid #f0f0f0',
                                display:'flex',
                                justifyContent:'space-between',
                                alignItems:'center',
                                background: formData.product_id === p.id ? '#e8f5e9' : 'white'
                              }}
                              onMouseOver={e => {
                                if (formData.product_id !== p.id) {
                                  e.currentTarget.style.background = '#f5f5f5'
                                }
                              }}
                              onMouseOut={e => {
                                if (formData.product_id !== p.id) {
                                  e.currentTarget.style.background = 'white'
                                }
                              }}
                            >
                              <span style={{ fontWeight:600 }}>{p.name}</span>
                              {p.category && (
                                <span style={{ fontSize:12, opacity:0.6 }}>
                                  {p.category === 'fruta' ? '🍎' : p.category === 'verdura' ? '🥬' : '📦'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Producto seleccionado */}
                      {formData.product_id && (
                        <div style={{
                          marginTop:12,
                          padding:12,
                          background:'#e8f5e9',
                          borderRadius:12,
                          border:'2px solid #4caf50'
                        }}>
                          <div style={{ fontWeight:700, marginBottom:4 }}>
                            Producto seleccionado: {products.find(p => p.id === formData.product_id)?.name || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Precio y Precio Referencia */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                          Precio
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                          placeholder="Ej: $550 c/u o $1.500 kg"
                          style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                        />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:14, fontWeight:600, marginBottom:8 }}>
                          Precio referencia
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={formData.reference_price}
                          onChange={e => setFormData({...formData, reference_price: e.target.value})}
                          placeholder="Ej: Lider $790 c/u"
                          style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:15 }}
                        />
                      </div>
                    </div>

                    {/* Foto del Producto */}
                    {formData.product_id && (
                      <div style={{
                        background:'linear-gradient(135deg, var(--kivi-cream) 0%, var(--kivi-green-soft) 100%)',
                        padding:20,
                        borderRadius:16,
                        border:'2px solid var(--kivi-green)'
                      }}>
                        <h4 style={{ margin:'0 0 16px 0', fontSize:16, fontWeight:700 }}>
                          📸 Foto del Producto (sin fondo recomendado)
                        </h4>
                        
                        {/* Preview de foto actual */}
                        {formData.quality_photo_url && (
                          <div style={{
                            marginBottom:16,
                            width:'100%',
                            height:200,
                            borderRadius:12,
                            background:`url(${formData.quality_photo_url}) center/cover`,
                            border:'3px solid white',
                            boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
                          }} />
                        )}

                        <ImageUploader
                          value={formData.quality_photo_url}
                          onChange={(url) => setFormData({...formData, quality_photo_url: url})}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleSave}
                      disabled={!formData.product_id}
                      style={{
                        width:'100%',
                        padding:14,
                        borderRadius:12,
                        background:(!formData.product_id) ? '#ccc' : '#88C4A8',
                        color:'white',
                        border:'none',
                        cursor:(!formData.product_id) ? 'not-allowed' : 'pointer',
                        fontSize:16,
                        fontWeight:700
                      }}
                    >
                      ✓ Guardar Oferta y Foto
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    background:config.bgColor,
                    borderRadius:16,
                    padding:20,
                    border:`1px solid ${config.borderColor}`
                  }}>
                    {offer && offer.product ? (
                      <>
                        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>
                          {offer.product.name}
                        </div>
                        {offer.price && (
                          <div style={{ fontSize:16, fontWeight:600, marginBottom:4, color:config.borderColor }}>
                            {offer.price}
                          </div>
                        )}
                        {offer.reference_price && (
                          <div style={{ fontSize:13, opacity:0.7, marginBottom:12 }}>
                            (Precio referencia: {offer.reference_price})
                          </div>
                        )}
                        {offer.product.quality_photo_url && (
                          <img
                            src={offer.product.quality_photo_url}
                            alt={offer.product.name}
                            onError={e => e.target.style.display = 'none'}
                            style={{
                              maxWidth:'100%',
                              maxHeight:200,
                              borderRadius:12,
                              marginTop:12,
                              border:'2px solid #fff',
                              objectFit:'cover'
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign:'center', opacity:0.6, padding:20 }}>
                        No hay oferta configurada
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

