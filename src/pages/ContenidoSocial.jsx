import { useState, useEffect } from 'react'
import { 
  listInstagramContent, 
  generateInstagramContent, 
  approveInstagramContent, 
  rejectInstagramContent,
  updateInstagramContent,
  listWhatsAppMessages,
  generateCatalogBatch,
  approveWhatsAppMessage,
  rejectWhatsAppMessage,
  updateWhatsAppMessage,
  previewWhatsAppMessage
} from '../api/social'
import '../styles/globals.css'

export default function ContenidoSocial() {
  const [activeTab, setActiveTab] = useState('instagram') // 'instagram' o 'whatsapp'
  const [instagramContent, setInstagramContent] = useState([])
  const [whatsappMessages, setWhatsappMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending_approval')
  const [editingContent, setEditingContent] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)

  useEffect(() => {
    loadContent()
  }, [activeTab, filterStatus])

  async function loadContent() {
    setLoading(true)
    try {
      if (activeTab === 'instagram') {
        const data = await listInstagramContent(filterStatus)
        setInstagramContent(data)
      } else {
        const data = await listWhatsAppMessages(filterStatus)
        setWhatsappMessages(data)
      }
    } catch(err) {
      console.error('Error cargando contenido:', err)
      alert('Error: ' + (err.message || 'No se pudo cargar el contenido'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateInstagram() {
    if (!confirm('¿Generar carrusel de ofertas semanales?')) return
    
    try {
      setLoading(true)
      await generateInstagramContent('ofertas_semana')
      alert('✓ Carrusel generado correctamente')
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo generar el contenido'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateWhatsApp() {
    if (!confirm('¿Generar mensajes de WhatsApp para todos los clientes?')) return
    
    try {
      setLoading(true)
      const result = await generateCatalogBatch()
      alert(`✓ ${result.message}`)
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo generar los mensajes'))
    } finally {
      setLoading(false)
    }
  }

  async function handleApproveInstagram(contentId) {
    try {
      await approveInstagramContent(contentId)
      alert('✓ Contenido aprobado')
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo aprobar'))
    }
  }

  async function handleRejectInstagram(contentId) {
    const reason = prompt('¿Por qué rechazas este contenido?')
    if (!reason) return
    
    try {
      await rejectInstagramContent(contentId, reason)
      alert('✓ Contenido rechazado')
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo rechazar'))
    }
  }

  async function handleApproveWhatsApp(messageId) {
    try {
      await approveWhatsAppMessage(messageId)
      alert('✓ Mensaje aprobado')
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo aprobar'))
    }
  }

  async function handleRejectWhatsApp(messageId) {
    try {
      await rejectWhatsAppMessage(messageId)
      alert('✓ Mensaje rechazado')
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo rechazar'))
    }
  }

  async function handleSaveInstagramContent(contentId, contentData, mediaUrls) {
    try {
      await updateInstagramContent(contentId, {
        content_data: contentData,
        media_urls: mediaUrls
      })
      alert('✓ Contenido actualizado')
      setEditingContent(null)
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo actualizar'))
    }
  }

  async function handleSaveWhatsAppMessage(messageId, messageText) {
    try {
      await updateWhatsAppMessage(messageId, {
        message_text: messageText
      })
      alert('✓ Mensaje actualizado')
      setEditingMessage(null)
      await loadContent()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo actualizar'))
    }
  }

  return (
    <div className="center" style={{ padding:'0 16px', maxWidth:1400, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ textAlign:'center', margin:'24px 0' }}>
        <h2 style={{ margin:'0 0 8px 0', fontSize:32, fontWeight:800 }}>📱 Contenido Social</h2>
        <p style={{ margin:0, opacity:0.7, fontSize:16 }}>Gestiona contenido de Instagram y WhatsApp</p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display:'flex', 
        gap:8, 
        marginBottom:24, 
        borderBottom:'2px solid #e0e0e0',
        paddingBottom:8
      }}>
        <button
          onClick={() => setActiveTab('instagram')}
          style={{
            padding:'12px 24px',
            border:'none',
            background: activeTab === 'instagram' ? '#A8D5BA' : 'transparent',
            color: activeTab === 'instagram' ? '#000' : '#666',
            cursor:'pointer',
            borderRadius:'8px 8px 0 0',
            fontWeight: activeTab === 'instagram' ? 600 : 400
          }}
        >
          📷 Instagram
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          style={{
            padding:'12px 24px',
            border:'none',
            background: activeTab === 'whatsapp' ? '#A8D5BA' : 'transparent',
            color: activeTab === 'whatsapp' ? '#000' : '#666',
            cursor:'pointer',
            borderRadius:'8px 8px 0 0',
            fontWeight: activeTab === 'whatsapp' ? 600 : 400
          }}
        >
          💬 WhatsApp
        </button>
      </div>

      {/* Filtros y acciones */}
      <div style={{ 
        display:'flex', 
        justifyContent:'space-between', 
        alignItems:'center',
        marginBottom:24,
        flexWrap:'wrap',
        gap:16
      }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:'1px solid #ddd',
            fontSize:14
          }}
        >
          <option value="">Todos</option>
          <option value="pending_approval">Pendientes de aprobación</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
          <option value="scheduled">Programados</option>
          <option value="published">Publicados</option>
        </select>

        <button
          onClick={activeTab === 'instagram' ? handleGenerateInstagram : handleGenerateWhatsApp}
          disabled={loading}
          style={{
            padding:'10px 20px',
            background:'#A8D5BA',
            color:'#000',
            border:'none',
            borderRadius:8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight:600,
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Generando...' : activeTab === 'instagram' ? '✨ Generar Carrusel' : '📋 Generar Mensajes'}
        </button>
      </div>

      {/* Contenido */}
      {loading && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div>⏳ Cargando...</div>
        </div>
      )}

      {!loading && activeTab === 'instagram' && (
        <div>
          {instagramContent.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, opacity:0.6 }}>
              No hay contenido de Instagram
            </div>
          ) : (
            <div style={{ display:'grid', gap:16 }}>
              {instagramContent.map((content) => (
                <div
                  key={content.id}
                  style={{
                    border:'1px solid #ddd',
                    borderRadius:12,
                    padding:20,
                    background:'#fff'
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:18, marginBottom:4 }}>
                        {content.type === 'carousel' ? '🖼️ Carrusel' : content.type}
                      </div>
                      <div style={{ fontSize:14, opacity:0.7 }}>
                        Template: {content.template_type || 'N/A'}
                      </div>
                      <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>
                        Estado: <span style={{ 
                          color: content.status === 'approved' ? 'green' : 
                                 content.status === 'rejected' ? 'red' : 
                                 content.status === 'pending_approval' ? 'orange' : 'blue'
                        }}>
                          {content.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {content.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApproveInstagram(content.id)}
                            style={{
                              padding:'8px 16px',
                              background:'#4CAF50',
                              color:'white',
                              border:'none',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:14
                            }}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectInstagram(content.id)}
                            style={{
                              padding:'8px 16px',
                              background:'#f44336',
                              color:'white',
                              border:'none',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:14
                            }}
                          >
                            ✗ Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingContent?.id === content.id ? (
                    <div style={{ marginBottom:16 }}>
                      {/* Editar descripción principal */}
                      <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', marginBottom:8, fontWeight:600, fontSize:14 }}>
                          Descripción Principal:
                        </label>
                        <textarea
                          value={editingContent.content_data.description || ''}
                          onChange={(e) => {
                            setEditingContent({
                              ...editingContent,
                              content_data: {
                                ...editingContent.content_data,
                                description: e.target.value
                              }
                            })
                          }}
                          rows={4}
                          style={{
                            width:'100%',
                            padding:12,
                            borderRadius:8,
                            border:'1px solid #ddd',
                            fontSize:14,
                            fontFamily:'inherit'
                          }}
                        />
                      </div>

                      {/* Mostrar cada slide del carrusel con edición */}
                      {editingContent.media_urls && editingContent.media_urls.length > 0 && (
                        <div style={{ marginBottom:16 }}>
                          <label style={{ display:'block', marginBottom:12, fontWeight:600, fontSize:14 }}>
                            Slides del Carrusel ({editingContent.media_urls.length}):
                          </label>
                          <div style={{ display:'grid', gap:16 }}>
                            {editingContent.media_urls.map((media, idx) => (
                              <div
                                key={idx}
                                style={{
                                  border:'2px solid #A8D5BA',
                                  borderRadius:12,
                                  padding:16,
                                  background:'#fff'
                                }}
                              >
                                <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                                  <div style={{ flexShrink:0 }}>
                                    {media.url && (
                                      <img
                                        src={media.url}
                                        alt={`Slide ${idx + 1}`}
                                        style={{
                                          width:200,
                                          height:200,
                                          objectFit:'cover',
                                          borderRadius:8,
                                          border:'1px solid #ddd'
                                        }}
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    )}
                                    <div style={{ 
                                      marginTop:8, 
                                      fontSize:12, 
                                      opacity:0.7,
                                      textAlign:'center'
                                    }}>
                                      Slide {idx + 1} - {media.offer_type || 'Oferta'}
                                    </div>
                                  </div>
                                  <div style={{ flex:1 }}>
                                    <label style={{ display:'block', marginBottom:8, fontWeight:600, fontSize:14 }}>
                                      Descripción del Slide:
                                    </label>
                                    <textarea
                                      value={media.caption || ''}
                                      onChange={(e) => {
                                        const newMediaUrls = [...editingContent.media_urls]
                                        newMediaUrls[idx] = { ...media, caption: e.target.value }
                                        setEditingContent({
                                          ...editingContent,
                                          media_urls: newMediaUrls
                                        })
                                      }}
                                      rows={6}
                                      style={{
                                        width:'100%',
                                        padding:12,
                                        borderRadius:8,
                                        border:'1px solid #ddd',
                                        fontSize:14,
                                        fontFamily:'inherit'
                                      }}
                                    />
                                    <div style={{ 
                                      marginTop:8, 
                                      fontSize:12, 
                                      opacity:0.6,
                                      fontStyle:'italic'
                                    }}>
                                      Producto: {media.product_name || 'N/A'} | Precio: {media.price || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display:'flex', gap:8 }}>
                        <button
                          onClick={() => handleSaveInstagramContent(
                            content.id,
                            editingContent.content_data,
                            editingContent.media_urls
                          )}
                          style={{
                            padding:'10px 20px',
                            background:'#4CAF50',
                            color:'white',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14,
                            fontWeight:600
                          }}
                        >
                          💾 Guardar Cambios
                        </button>
                        <button
                          onClick={() => setEditingContent(null)}
                          style={{
                            padding:'10px 20px',
                            background:'#ccc',
                            color:'#000',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {content.content_data && (
                        <div style={{ 
                          background:'#f5f5f5', 
                          padding:12, 
                          borderRadius:8,
                          marginBottom:12,
                          whiteSpace:'pre-wrap',
                          fontSize:14
                        }}>
                          {content.content_data.description || content.content_data.full_text || 'Sin descripción'}
                        </div>
                      )}

                      {/* Mostrar carrusel slide por slide */}
                      {content.media_urls && content.media_urls.length > 0 && (
                        <div style={{ marginBottom:12 }}>
                          <div style={{ 
                            fontSize:14, 
                            fontWeight:600, 
                            marginBottom:12,
                            color:'#666'
                          }}>
                            Carrusel ({content.media_urls.length} slides):
                          </div>
                          <div style={{ display:'grid', gap:12 }}>
                            {content.media_urls.map((media, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display:'flex',
                                  gap:16,
                                  border:'1px solid #ddd',
                                  borderRadius:8,
                                  padding:12,
                                  background:'#fafafa'
                                }}
                              >
                                <div style={{ flexShrink:0 }}>
                                  {media.url && (
                                    <img
                                      src={media.url}
                                      alt={`Slide ${idx + 1}`}
                                      style={{
                                        width:150,
                                        height:150,
                                        objectFit:'cover',
                                        borderRadius:8,
                                        border:'1px solid #ddd'
                                      }}
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  )}
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ 
                                    fontSize:12, 
                                    opacity:0.7, 
                                    marginBottom:4,
                                    fontWeight:600
                                  }}>
                                    Slide {idx + 1} - {media.offer_type || 'Oferta'}
                                  </div>
                                  <div style={{ 
                                    whiteSpace:'pre-wrap',
                                    fontSize:14,
                                    lineHeight:1.5
                                  }}>
                                    {media.caption || 'Sin descripción'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {content.status === 'pending_approval' && (
                        <button
                          onClick={() => setEditingContent({
                            id: content.id,
                            content_data: { ...content.content_data },
                            media_urls: [...(content.media_urls || [])]
                          })}
                          style={{
                            padding:'8px 16px',
                            background:'#2196F3',
                            color:'white',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14,
                            marginBottom:12
                          }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                    </>
                  )}

                  {content.scheduled_date && (
                    <div style={{ fontSize:12, opacity:0.6, marginTop:12 }}>
                      📅 Programado para: {new Date(content.scheduled_date).toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'whatsapp' && (
        <div>
          {whatsappMessages.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, opacity:0.6 }}>
              No hay mensajes de WhatsApp
            </div>
          ) : (
            <div style={{ display:'grid', gap:16 }}>
              {whatsappMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    border:'1px solid #ddd',
                    borderRadius:12,
                    padding:20,
                    background:'#fff'
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:18, marginBottom:4 }}>
                        {message.customer?.name || 'Cliente sin nombre'}
                      </div>
                      <div style={{ fontSize:14, opacity:0.7 }}>
                        {message.customer?.phone || 'Sin teléfono'}
                      </div>
                      <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>
                        Estado: <span style={{ 
                          color: message.status === 'approved' ? 'green' : 
                                 message.status === 'rejected' ? 'red' : 
                                 message.status === 'pending_approval' ? 'orange' : 'blue'
                        }}>
                          {message.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {message.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApproveWhatsApp(message.id)}
                            style={{
                              padding:'8px 16px',
                              background:'#4CAF50',
                              color:'white',
                              border:'none',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:14
                            }}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectWhatsApp(message.id)}
                            style={{
                              padding:'8px 16px',
                              background:'#f44336',
                              color:'white',
                              border:'none',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:14
                            }}
                          >
                            ✗ Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingMessage?.id === message.id ? (
                    <div style={{ marginBottom:16 }}>
                      <label style={{ display:'block', marginBottom:8, fontWeight:600, fontSize:14 }}>
                        Mensaje:
                      </label>
                      <textarea
                        value={editingMessage.message_text || ''}
                        onChange={(e) => {
                          setEditingMessage({
                            ...editingMessage,
                            message_text: e.target.value
                          })
                        }}
                        rows={8}
                        style={{
                          width:'100%',
                          padding:12,
                          borderRadius:8,
                          border:'1px solid #ddd',
                          fontSize:14,
                          fontFamily:'inherit'
                        }}
                      />
                      <div style={{ display:'flex', gap:8, marginTop:12 }}>
                        <button
                          onClick={() => handleSaveWhatsAppMessage(message.id, editingMessage.message_text)}
                          style={{
                            padding:'10px 20px',
                            background:'#4CAF50',
                            color:'white',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14,
                            fontWeight:600
                          }}
                        >
                          💾 Guardar Cambios
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          style={{
                            padding:'10px 20px',
                            background:'#ccc',
                            color:'#000',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.message_text && (
                        <div style={{ 
                          background:'#E8F5E9', 
                          padding:12, 
                          borderRadius:8,
                          marginBottom:12,
                          whiteSpace:'pre-wrap',
                          fontSize:14,
                          borderLeft:'4px solid #4CAF50'
                        }}>
                          {message.message_text}
                        </div>
                      )}
                      {message.status === 'pending_approval' && (
                        <button
                          onClick={() => setEditingMessage({
                            id: message.id,
                            message_text: message.message_text
                          })}
                          style={{
                            padding:'8px 16px',
                            background:'#2196F3',
                            color:'white',
                            border:'none',
                            borderRadius:6,
                            cursor:'pointer',
                            fontSize:14,
                            marginBottom:12
                          }}
                        >
                          ✏️ Editar Mensaje
                        </button>
                      )}
                    </>
                  )}

                  {message.scheduled_date && (
                    <div style={{ fontSize:12, opacity:0.6 }}>
                      📅 Programado para: {new Date(message.scheduled_date).toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

