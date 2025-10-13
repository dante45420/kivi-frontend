export default function QualityModal({ open, onClose, product }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div style={{ background: '#fff', margin: '10% auto', padding: 16, width: 420 }} onClick={e => e.stopPropagation()}>
        <h3>Estado de Calidad</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{product?.quality_notes || 'Sin notas'}</p>
        {product?.quality_photo_url ? (
          <img src={product.quality_photo_url} alt="foto calidad" style={{ maxWidth: '100%' }} />
        ) : null}
        <button onClick={onClose} style={{ marginTop: 12 }}>Cerrar</button>
      </div>
    </div>
  )
}
