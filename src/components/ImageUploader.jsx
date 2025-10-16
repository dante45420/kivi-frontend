import { useState } from 'react'

export default function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Subir a ImgBB (servicio gratuito)
      const formData = new FormData()
      formData.append('image', file)
      
      // API key pública de ImgBB (deberías crear tu propia cuenta gratuita)
      const apiKey = '8fb7f6c65558b3fd7a1e4de8f3e3b0c1' // Cambiar por tu propia API key
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        onChange(data.data.url)
        setError('')
      } else {
        setError('Error al subir imagen. Intenta con URL directa.')
      }
    } catch (err) {
      console.error('Error uploading:', err)
      setError('Error al subir. Intenta con URL directa.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Subir archivo */}
      <div style={{ marginBottom:12 }}>
        <label 
          htmlFor="file-upload"
          style={{
            display:'block',
            width:'100%',
            padding:'16px',
            background:'white',
            borderRadius:12,
            border:'2px dashed var(--kivi-green)',
            textAlign:'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition:'all 0.2s',
            fontWeight:600
          }}
          onMouseOver={e => !uploading && (e.target.style.background = 'var(--kivi-cream)')}
          onMouseOut={e => !uploading && (e.target.style.background = 'white')}
        >
          {uploading ? '⏳ Subiendo...' : '📤 Subir imagen desde tu dispositivo'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display:'none' }}
        />
      </div>

      {/* O URL directa */}
      <div style={{ textAlign:'center', margin:'12px 0', opacity:0.6, fontSize:13 }}>
        — o —
      </div>

      <div>
        <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600 }}>
          Pegar URL de imagen
        </label>
        <input
          type="url"
          className="input"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ width:'100%' }}
        />
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{ 
          marginTop:12, 
          padding:12, 
          background:'#ffebee', 
          borderRadius:8, 
          color:'#c62828',
          fontSize:13
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Ayuda */}
      <div style={{ 
        marginTop:12, 
        padding:12, 
        background:'rgba(255,255,255,0.7)', 
        borderRadius:8, 
        fontSize:12,
        opacity:0.8
      }}>
        💡 <strong>Consejo:</strong> Puedes subir una imagen directamente o pegar un enlace de servicios como{' '}
        <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--kivi-green-dark)', fontWeight:600 }}>
          ImgBB
        </a>,{' '}
        <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--kivi-green-dark)', fontWeight:600 }}>
          Imgur
        </a> o Google Drive (enlace público).
      </div>
    </div>
  )
}

