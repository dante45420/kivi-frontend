import { useState } from 'react'

export default function MinimalProductCard({ product, detail, openModalFor, getProductStatus, stateBadge, qtySegments }) {
  const [showButtons, setShowButtons] = useState(false)
  const status = getProductStatus(product)
  const purchased = detail?.purchased_by_product?.[product.product_id] || {}
  
  return (
    <div 
      style={{ 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #e0e0e0',
        padding: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        position: 'relative'
      }}
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
      {/* Info del producto */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          {product.product_name}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, opacity: 0.7 }}>
          {qtySegments(product).map((t, i) => (
            <span key={i} style={{ fontWeight: 600 }}>{t}</span>
          ))}
          {stateBadge(product)}
        </div>
      </div>

      {/* Botones colapsables */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 6, 
          alignItems: 'center',
          opacity: showButtons ? 1 : 0.3,
          transition: 'opacity 0.2s'
        }}
      >
        <button 
          onClick={() => openModalFor(product)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: '#88C4A8',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
          title="Anotar compra"
        >
          📝
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Implementar edición
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: '#ffb347',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Implementar info
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: '#667eea',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
          title="Info"
        >
          💡
        </button>
      </div>
    </div>
  )
}
