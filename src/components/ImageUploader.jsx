import { useState } from 'react'

export default function ImageUploader({ value, onChange }) {
  const [preview, setPreview] = useState(value || '')
  const [error, setError] = useState('')

  function handleUrlChange(e) {
    const url = e.target.value
    setPreview(url)
    onChange(url)
    
    // Limpiar error si había
    if (error) setError('')
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (max 2MB para base64 - se comprimirá)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2MB. Se recomienda comprimirla.')
      return
    }

    setError('')
    
    // Convertir a base64 (data URL) - esto se guarda directamente en la BD
    const reader = new FileReader()
    reader.onload = (event) => {
      // event.target.result ya es un data URL (base64)
      // Formato: "data:image/png;base64,iVBORw0KGgo..."
      const dataUrl = event.target.result
      setPreview(dataUrl)
      onChange(dataUrl) // Esto se guardará directamente en quality_photo_url
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {/* Preview de la imagen */}
      {preview && (
        <div style={{ marginBottom: 16 }}>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ 
              width: '100%', 
              maxWidth: 300,
              height: 'auto',
              borderRadius: 12,
              border: '2px solid var(--kivi-green-soft)',
              objectFit: 'cover'
            }}
            onError={() => {
              setError('No se pudo cargar la imagen. Verifica la URL.')
            }}
          />
        </div>
      )}

      {/* Input URL */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          🔗 Pegar URL de imagen
        </label>
        <input
          type="url"
          className="input"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={value || ''}
          onChange={handleUrlChange}
          style={{ width: '100%' }}
        />
      </div>

      {/* O separador */}
      <div style={{ textAlign: 'center', margin: '12px 0', opacity: 0.6, fontSize: 13 }}>
        — o —
      </div>

      {/* Subir desde dispositivo - se guarda como base64 en la BD */}
      <div style={{ marginBottom: 12 }}>
        <label 
          htmlFor="file-upload"
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            background: 'white',
            borderRadius: 12,
            border: '2px dashed var(--kivi-green)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 600
          }}
          onMouseOver={e => e.target.style.background = 'var(--kivi-cream)'}
          onMouseOut={e => e.target.style.background = 'white'}
        >
          📤 Subir imagen desde tu dispositivo
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: 11, color: '#999', marginTop: 6, textAlign: 'center' }}>
          ✓ La imagen se guardará directamente en la base de datos (recomendado: imágenes sin fondo, máximo 2MB)
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{ 
          marginTop: 12, 
          padding: 12, 
          background: '#ffebee', 
          borderRadius: 8, 
          color: '#c62828',
          fontSize: 13
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Ayuda */}
      <div style={{ 
        marginTop: 12, 
        padding: 12, 
        background: 'rgba(255,255,255,0.7)', 
        borderRadius: 8, 
        fontSize: 12,
        opacity: 0.8
      }}>
        💡 <strong>Opciones para agregar imagen:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, lineHeight: 1.6 }}>
          <li>
            <strong>📤 Subir archivo:</strong> Se guarda directamente en la base de datos (recomendado para imágenes sin fondo)
          </li>
          <li>
            <strong>🔗 Pegar URL:</strong> Si prefieres usar un servicio externo como Imgur, ImgBB o Google Drive
          </li>
        </ul>
        <p style={{ margin: '8px 0 0 0', fontSize: 11, fontStyle: 'italic' }}>
          Tip: Las imágenes sin fondo (PNG transparente) funcionan mejor para el catálogo
        </p>
      </div>
    </div>
  )
}
