import { useState, useEffect } from 'react'
import {
  generateStoriesBatch,
  listStories,
  approveStory,
  rejectStory,
  updateStory,
  getStoryStats
} from '../api/stories'

export default function StoriesTab() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending_review')
  const [filterWeek, setFilterWeek] = useState('')
  const [editingStory, setEditingStory] = useState(null)
  const [stats, setStats] = useState(null)
  const [generationSettings, setGenerationSettings] = useState({
    count: 8,
    targetWeek: '',
    themes: [],
    contentTypes: ['image', 'video']
  })

  useEffect(() => {
    loadStories()
    loadStats()
  }, [filterStatus, filterWeek])

  async function loadStories() {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterWeek) params.target_week = filterWeek
      
      const data = await listStories(params)
      setStories(data.stories || [])
    } catch(err) {
      console.error('Error cargando historias:', err)
      alert('Error: ' + (err.message || 'No se pudieron cargar las historias'))
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const data = await getStoryStats(filterWeek ? { target_week: filterWeek } : {})
      setStats(data)
    } catch(err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  async function handleGenerateBatch() {
    if (!confirm(`¿Generar ${generationSettings.count} historias para la semana ${generationSettings.targetWeek || 'siguiente'}?`)) return
    
    try {
      setLoading(true)
      const result = await generateStoriesBatch(generationSettings)
      alert(`✅ ${result.message}\nGeneradas: ${result.generated_count} historias`)
      await loadStories()
      await loadStats()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudieron generar las historias'))
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(storyId) {
    try {
      await approveStory(storyId)
      alert('✅ Historia aprobada')
      await loadStories()
      await loadStats()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo aprobar la historia'))
    }
  }

  async function handleReject(storyId) {
    const reason = prompt('¿Motivo del rechazo? (opcional)')
    
    try {
      await rejectStory(storyId, reason)
      alert('❌ Historia rechazada')
      await loadStories()
      await loadStats()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo rechazar la historia'))
    }
  }

  async function handleSaveEdit(storyId, newContent) {
    try {
      await updateStory(storyId, { content_data: newContent })
      alert('✅ Historia actualizada')
      setEditingStory(null)
      await loadStories()
    } catch(err) {
      alert('Error: ' + (err.message || 'No se pudo actualizar la historia'))
    }
  }

  function getThemeLabel(theme) {
    const labels = {
      'tip_semana': '💡 Tip de la Semana',
      'doggo_prueba': '🐕 Doggo Prueba',
      'mito_realidad': '❌✅ Mito vs Realidad',
      'beneficio_dia': '📈 Beneficio del Día',
      'sabias_que': '🤯 Sabías Que...',
      'detras_camaras': '📸 Detrás de Cámaras',
      'cliente_semana': '🏆 Cliente de la Semana',
      'desafio_receta': '🍽️ Desafío/Receta'
    }
    return labels[theme] || theme
  }

  function getStatusLabel(status) {
    const labels = {
      'pending_review': '⏳ Pendiente',
      'approved': '✅ Aprobada',
      'rejected': '❌ Rechazada',
      'scheduled': '📅 Programada',
      'published': '🌟 Publicada'
    }
    return labels[status] || status
  }

  function getNextMonday() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek)
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📱 Historias de Instagram</h1>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.by_status?.pending_review || 0}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.by_status?.approved || 0}</div>
            <div className="text-sm text-gray-600">Aprobadas</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.by_status?.scheduled || 0}</div>
            <div className="text-sm text-gray-600">Programadas</div>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{stats.by_status?.published || 0}</div>
            <div className="text-sm text-gray-600">Publicadas</div>
          </div>
        </div>
      )}

      {/* Panel de generación */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">🎨 Generar Nuevas Historias</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <input
              type="number"
              min="3"
              max="20"
              value={generationSettings.count}
              onChange={(e) => setGenerationSettings({...generationSettings, count: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semana Objetivo</label>
            <input
              type="date"
              value={generationSettings.targetWeek}
              onChange={(e) => setGenerationSettings({...generationSettings, targetWeek: e.target.value})}
              placeholder={getNextMonday()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de Contenido</label>
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generationSettings.contentTypes.includes('image')}
                  onChange={(e) => {
                    const types = e.target.checked 
                      ? [...generationSettings.contentTypes, 'image']
                      : generationSettings.contentTypes.filter(t => t !== 'image')
                    setGenerationSettings({...generationSettings, contentTypes: types})
                  }}
                  className="mr-2"
                />
                Imágenes
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generationSettings.contentTypes.includes('video')}
                  onChange={(e) => {
                    const types = e.target.checked 
                      ? [...generationSettings.contentTypes, 'video']
                      : generationSettings.contentTypes.filter(t => t !== 'video')
                    setGenerationSettings({...generationSettings, contentTypes: types})
                  }}
                  className="mr-2"
                />
                Videos
              </label>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateBatch}
              disabled={loading || generationSettings.contentTypes.length === 0}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Generando...' : '🎨 Generar'}
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          💡 Se generarán {generationSettings.count} historias variadas para que elijas las mejores.
          El sistema mezcla diferentes temas y estilos automáticamente.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos</option>
            <option value="pending_review">⏳ Pendientes</option>
            <option value="approved">✅ Aprobadas</option>
            <option value="rejected">❌ Rechazadas</option>
            <option value="scheduled">📅 Programadas</option>
            <option value="published">🌟 Publicadas</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semana</label>
          <input
            type="date"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Galería de historias */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Cargando historias...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No hay historias para mostrar</p>
          <p className="text-gray-500 mt-2">Genera un nuevo batch para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Thumbnail/Media */}
              <div className="relative bg-gray-100 aspect-[9/16]">
                {story.content_type === 'video' ? (
                  <div className="absolute inset-0">
                    <img 
                      src={story.thumbnail_url || story.media_url} 
                      alt={story.theme}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={story.media_url} 
                    alt={story.theme}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Badge de tipo */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {story.content_type === 'video' ? '🎬 Video' : '🖼️ Imagen'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">{getThemeLabel(story.theme)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    story.status === 'approved' || story.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                    story.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusLabel(story.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  Semana: {story.target_week}
                </p>

                {/* Acciones */}
                {story.status === 'pending_review' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(story.id)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(story.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                )}

                {/* Botón de preview/edit */}
                <button
                  onClick={() => setEditingStory(story)}
                  className="w-full mt-2 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50"
                >
                  👁️ Ver/Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">{getThemeLabel(editingStory.theme)}</h3>
                <button
                  onClick={() => setEditingStory(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Preview</h4>
                  <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[9/16]">
                    {editingStory.content_type === 'video' ? (
                      <video controls className="w-full h-full object-cover">
                        <source src={editingStory.media_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img 
                        src={editingStory.media_url} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Contenido editable */}
                <div>
                  <h4 className="font-semibold mb-2">Contenido</h4>
                  <div className="space-y-3">
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
                      {JSON.stringify(editingStory.content?.content_data, null, 2)}
                    </pre>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>Estado:</strong> {getStatusLabel(editingStory.status)}</p>
                      <p><strong>Tipo:</strong> {editingStory.content_type}</p>
                      <p><strong>Creado:</strong> {new Date(editingStory.created_at).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {editingStory.status === 'pending_review' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(editingStory.id)
                        setEditingStory(null)
                      }}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✓ Aprobar Historia
                    </button>
                    <button
                      onClick={() => {
                        handleReject(editingStory.id)
                        setEditingStory(null)
                      }}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
                    >
                      ✗ Rechazar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setEditingStory(null)}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

