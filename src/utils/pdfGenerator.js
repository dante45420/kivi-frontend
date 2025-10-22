import jsPDF from 'jspdf'

const COLORS = {
  primary: '#A8D5BA',
  secondary: '#FFD4A3',
  cream: '#FFF9F0',
  text: '#5D6D7E',
  textDark: '#34495E'
}

/**
 * Genera un PDF del catálogo de productos
 */
export async function generateCatalogPDF(products) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // Cargar imágenes
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  let logoImg, whatsappImg, instagramImg
  try {
    logoImg = await loadImage('/kivi-logo.png')
  } catch (e) {
    console.log('No se pudo cargar el logo')
  }
  try {
    whatsappImg = await loadImage('/whatsapp-icon.png')
  } catch (e) {
    console.log('No se pudo cargar icono WhatsApp')
  }
  try {
    instagramImg = await loadImage('/instagram-icon.png')
  } catch (e) {
    console.log('No se pudo cargar icono Instagram')
  }

  // Función para agregar encabezado
  const addHeader = () => {
    // Logo
    if (logoImg) {
      try {
        const logoWidth = 50
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width
        doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 15, logoWidth, logoHeight)
        
        // Slogan debajo del logo
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(COLORS.text)
        doc.text('*Todo pedido es personalizable a tu manera*', pageWidth / 2, 15 + logoHeight + 6, { align: 'center' })
        
        return 15 + logoHeight + 12
      } catch (e) {
        console.log('Error agregando logo:', e)
      }
    }
    
    // Fallback si no hay logo
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Kivi', pageWidth / 2, 25, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text('*Todo pedido es personalizable a tu manera*', pageWidth / 2, 33, { align: 'center' })
    
    return 40
  }

  // Función para agregar pie de página
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 22

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text(
      '*Si no encuentras algo, lo buscamos y cobramos 10% menos que el Jumbo*',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )

    // Iconos y texto - centrados y más grandes
    const iconSize = 7
    const iconY = footerY + 6
    const fontSize = 10
    
    // Calcular ancho total para centrar
    const gap = 15 // Espacio entre los dos elementos
    const whatsappTextWidth = 32 // Aproximado
    const instagramTextWidth = 22 // Aproximado
    const totalWidth = iconSize + 2 + whatsappTextWidth + gap + iconSize + 2 + instagramTextWidth
    const startX = (pageWidth - totalWidth) / 2
    
    // WhatsApp
    if (whatsappImg) {
      try {
        doc.addImage(whatsappImg, 'PNG', startX, iconY, iconSize, iconSize)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('+56 9 6917 2764', startX + iconSize + 2, iconY + 5)
      } catch (e) {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('WhatsApp: +56 9 6917 2764', startX, iconY + 5)
      }
    } else {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.text('WhatsApp: +56 9 6917 2764', startX, iconY + 5)
    }
    
    // Instagram
    const instaX = startX + iconSize + 2 + whatsappTextWidth + gap
    if (instagramImg) {
      try {
        doc.addImage(instagramImg, 'PNG', instaX, iconY, iconSize, iconSize)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('@kivi.chile', instaX + iconSize + 2, iconY + 5)
      } catch (e) {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('Instagram: @kivi.chile', instaX, iconY + 5)
      }
    } else {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.text('Instagram: @kivi.chile', instaX, iconY + 5)
    }

    // Número de página
    doc.setFontSize(8)
    doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  // Separar productos por categoría
  const frutas = products.filter(p => p.category === 'fruta').sort((a, b) => a.name.localeCompare(b.name))
  const verduras = products.filter(p => p.category === 'verdura').sort((a, b) => a.name.localeCompare(b.name))
  const otros = products.filter(p => !p.category || (p.category !== 'fruta' && p.category !== 'verdura')).sort((a, b) => a.name.localeCompare(b.name))

  let currentY = addHeader()
  let pageNum = 1

  // Función para agregar una categoría
  const addCategory = (title, items, isFirst = false) => {
    // SIEMPRE empezar categoría en nueva página (excepto la primera)
    if (!isFirst) {
      addFooter(pageNum)
      doc.addPage()
      pageNum++
      currentY = addHeader()
    }

    // Título de categoría - minimalista
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text(title, margin, currentY)
    currentY += 3
    
    // Línea divisoria
    doc.setDrawColor(168, 213, 186) // Color verde pastel
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 8

    // Agregar productos en formato de 2 columnas
    const columnWidth = (contentWidth - 8) / 2 // 8mm de espacio entre columnas
    let column = 0
    
    items.forEach((product, index) => {
      const price = product.catalog && product.catalog[0]
      const xPos = margin + (column * (columnWidth + 8))
      
      // Verificar si necesitamos una nueva página
      const estimatedHeight = 25 // Altura estimada por producto
      if (currentY + estimatedHeight > pageHeight - 30) {
        addFooter(pageNum)
        doc.addPage()
        pageNum++
        currentY = addHeader()
        column = 0
      }

      // Nombre del producto - más grande
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      
      // Truncar nombre si es muy largo
      const maxNameLength = 20
      const displayName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      doc.text(displayName, xPos, currentY + 5)

      let varY = currentY + 11

      // Variantes o precio - debajo del nombre con mismo formato
      const startY = currentY // Guardar Y inicial de esta fila
      const hasVariants = product.variants && product.variants.filter(v => v.active).length > 0
      
      if (hasVariants) {
        // Ordenar variantes por precio (de menor a mayor)
        const activeVariants = product.variants
          .filter(v => v.active)
          .sort((a, b) => {
            const priceA = a.price_tiers?.[0]?.sale_price || 0
            const priceB = b.price_tiers?.[0]?.sale_price || 0
            return priceA - priceB
          })
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        
        activeVariants.forEach((variant, idx) => {
          if (variant.price_tiers && variant.price_tiers.length > 0) {
            variant.price_tiers.forEach(tier => {
              const unit = tier.unit === 'unit' ? 'unidad' : tier.unit
              // Truncar nombre de variante si es muy largo
              const maxVarLength = 15
              const displayVariant = variant.label.length > maxVarLength
                ? variant.label.substring(0, maxVarLength) + '...'
                : variant.label
              // NO agregar (min_qty+) - asumir que está en el nombre
              const tierText = `${displayVariant}: $${tier.sale_price?.toLocaleString('es-CL')}/${unit}`
              doc.text(tierText, xPos, varY)
              varY += 6
            })
          }
        })
      } else {
        // Precio base debajo del nombre con MISMO formato que variantes
        if (price) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          const unit = price.unit === 'unit' ? 'unidad' : price.unit
          const priceText = `$${price.sale_price?.toLocaleString('es-CL')}/${unit}`
          doc.text(priceText, xPos, varY)
          varY += 6
        }
      }

      // Línea divisoria sutil entre productos
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(xPos, varY + 1, xPos + columnWidth, varY + 1)

      // Calcular altura real de este producto
      const productHeight = varY - startY + 7

      // Cambiar de columna
      if (column === 0) {
        // Primera columna: guardar máxima altura
        if (!items.maxHeightThisRow) items.maxHeightThisRow = productHeight
        else items.maxHeightThisRow = Math.max(items.maxHeightThisRow, productHeight)
        column = 1
      } else {
        // Segunda columna: actualizar maxHeight y avanzar currentY
        items.maxHeightThisRow = Math.max(items.maxHeightThisRow || 0, productHeight)
        currentY += items.maxHeightThisRow
        items.maxHeightThisRow = 0
        column = 0
      }
    })

    // Si quedamos en la primera columna, avanzar con la altura correcta
    if (column === 1) {
      currentY += (items.maxHeightThisRow || 22)
      items.maxHeightThisRow = 0
    }

    currentY += 3 // Espacio después de la categoría
  }

  // Agregar cada categoría
  let isFirst = true
  
  if (frutas.length > 0) {
    addCategory('Frutas', frutas, isFirst)
    isFirst = false
  }

  if (verduras.length > 0) {
    addCategory('Verduras', verduras, isFirst)
    isFirst = false
  }

  if (otros.length > 0) {
    addCategory('Otros', otros, isFirst)
    isFirst = false
  }

  // Agregar pie de página final
  addFooter(pageNum)

  // Descargar el PDF
  doc.save('Catalogo_Kivi.pdf')
}

/**
 * Genera un PDF del catálogo con utilidades (para vendedores)
 */
export async function generateCatalogWithProfitPDF(products) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // Cargar logo
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  let logoImg
  try {
    logoImg = await loadImage('/kivi-logo.png')
  } catch (e) {
    console.log('No se pudo cargar el logo')
  }

  // Función para agregar encabezado
  const addHeader = () => {
    if (logoImg) {
      try {
        const logoWidth = 40
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width
        doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight)
        
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 50, 50) // Rojo para indicar documento interno
        doc.text('CATÁLOGO VENDEDORES - USO INTERNO', pageWidth / 2, 10 + logoHeight + 8, { align: 'center' })
        
        return 10 + logoHeight + 14
      } catch (e) {
        console.log('Error agregando logo:', e)
      }
    }
    
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Kivi - Catálogo Vendedores', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(200, 50, 50)
    doc.text('USO INTERNO', pageWidth / 2, 28, { align: 'center' })
    
    return 35
  }

  // Separar productos por categoría
  const frutas = products.filter(p => p.category === 'fruta').sort((a, b) => a.name.localeCompare(b.name))
  const verduras = products.filter(p => p.category === 'verdura').sort((a, b) => a.name.localeCompare(b.name))
  const otros = products.filter(p => !p.category || (p.category !== 'fruta' && p.category !== 'verdura')).sort((a, b) => a.name.localeCompare(b.name))

  let currentY = addHeader()
  let pageNum = 1

  // Función para agregar una categoría
  const addCategory = (title, items, isFirst = false) => {
    if (!isFirst) {
      doc.addPage()
      pageNum++
      currentY = addHeader()
    }

    // Título de categoría
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text(title, margin, currentY)
    currentY += 3
    
    doc.setDrawColor(168, 213, 186)
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 8

    items.forEach((product) => {
      const price = product.catalog && product.catalog[0]
      const cost = product.latest_cost
      
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 40) {
        doc.addPage()
        pageNum++
        currentY = addHeader()
      }

      // Nombre del producto
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      doc.text(product.name, margin, currentY)
      currentY += 7

      // Información de precios y utilidad
      const hasVariants = product.variants && product.variants.filter(v => v.active).length > 0
      
      if (hasVariants) {
        const activeVariants = product.variants
          .filter(v => v.active)
          .sort((a, b) => {
            const priceA = a.price_tiers?.[0]?.sale_price || 0
            const priceB = b.price_tiers?.[0]?.sale_price || 0
            return priceA - priceB
          })
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        activeVariants.forEach((variant) => {
          if (variant.price_tiers && variant.price_tiers.length > 0) {
            variant.price_tiers.forEach(tier => {
              const salePrice = tier.sale_price || 0
              const unit = tier.unit === 'unit' ? 'unidad' : tier.unit
              let profitInfo = ''
              
              if (cost && product.latest_cost_unit === tier.unit) {
                const profit = salePrice - cost
                const profitPct = cost > 0 ? ((profit / salePrice) * 100).toFixed(1) : 0
                profitInfo = ` | Costo: $${cost.toLocaleString('es-CL')} | Utilidad: $${profit.toLocaleString('es-CL')} (${profitPct}%)`
              }
              
              doc.setTextColor(80, 80, 80)
              doc.text(`${variant.label}: $${salePrice.toLocaleString('es-CL')}/${unit}${profitInfo}`, margin + 3, currentY)
              currentY += 5
            })
          }
        })
      } else {
        if (price) {
          const salePrice = price.sale_price || 0
          const unit = price.unit === 'unit' ? 'unidad' : price.unit
          let profitInfo = ''
          
          if (cost && product.latest_cost_unit === price.unit) {
            const profit = salePrice - cost
            const profitPct = cost > 0 ? ((profit / salePrice) * 100).toFixed(1) : 0
            profitInfo = ` | Costo: $${cost.toLocaleString('es-CL')} | Utilidad: $${profit.toLocaleString('es-CL')} (${profitPct}%)`
          }
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(`$${salePrice.toLocaleString('es-CL')}/${unit}${profitInfo}`, margin + 3, currentY)
          currentY += 5
        }
      }

      // Línea divisoria
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1)
      currentY += 6
    })

    currentY += 3
  }

  // Agregar cada categoría
  let isFirst = true
  
  if (frutas.length > 0) {
    addCategory('Frutas', frutas, isFirst)
    isFirst = false
  }

  if (verduras.length > 0) {
    addCategory('Verduras', verduras, isFirst)
    isFirst = false
  }

  if (otros.length > 0) {
    addCategory('Otros', otros, isFirst)
  }

  // Número de página en todas las páginas
  for (let i = 1; i <= pageNum; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Página ${i} de ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  // Descargar el PDF
  doc.save('Catalogo_Vendedores_Kivi.pdf')
}

/**
 * Genera un PDF de factura para un pedido
 */
export async function generateInvoicePDF(order, items, customer) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar imágenes (igual que catálogo)
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  let logoImg, whatsappImg, instagramImg
  try {
    logoImg = await loadImage('/kivi-logo.png')
  } catch (e) {
    console.log('No se pudo cargar el logo')
  }
  try {
    whatsappImg = await loadImage('/whatsapp-icon.png')
  } catch (e) {
    console.log('No se pudo cargar icono WhatsApp')
  }
  try {
    instagramImg = await loadImage('/instagram-icon.png')
  } catch (e) {
    console.log('No se pudo cargar icono Instagram')
  }

  // Encabezado - Logo
  let currentY = 20
  if (logoImg) {
    try {
      const logoWidth = 45
      const logoHeight = (logoImg.height * logoWidth) / logoImg.width
      doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight)
      currentY += logoHeight + 10
    } catch (e) {
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      doc.text('Kivi', pageWidth / 2, currentY, { align: 'center' })
      currentY += 15
    }
  } else {
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Kivi', pageWidth / 2, currentY, { align: 'center' })
    currentY += 15
  }

  // Información del pedido
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE PEDIDO', margin, currentY)

  currentY += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pedido: ${order.title || order.name || `#${order.id}`}`, margin, currentY)
  currentY += 7
  const orderDate = order.created_at || order.date
  doc.text(`Fecha: ${new Date(orderDate).toLocaleDateString('es-CL')}`, margin, currentY)

  if (customer) {
    currentY += 7
    const customerName = typeof customer === 'object' ? (customer.name || customer.full_name || 'Cliente') : customer
    doc.text(`Cliente: ${customerName}`, margin, currentY)
  }

  // Línea divisoria
  currentY += 10
  doc.setDrawColor(168, 213, 186)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)

  // Tabla de productos - con mejor espaciado
  currentY += 10
  doc.setFillColor(168, 213, 186) // Verde pastel
  doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Producto', margin + 5, currentY + 7)
  doc.text('Cantidad', pageWidth - 85, currentY + 7)
  doc.text('P. Unit.', pageWidth - 55, currentY + 7)
  doc.text('Total', pageWidth - margin - 5, currentY + 7, { align: 'right' })

  currentY += 14
  let total = 0

  items.forEach(item => {
    // Verificar si necesitamos una nueva página
    if (currentY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      currentY = 30
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.textDark)
    
    doc.text(item.product_name || 'Producto', margin + 5, currentY)
    doc.text(`${item.qty || 0} ${item.unit || 'kg'}`, pageWidth - 85, currentY)
    doc.text(`$${(item.sale_unit_price || 0).toLocaleString('es-CL')}`, pageWidth - 55, currentY)
    
    const itemTotal = (item.qty || 0) * (item.sale_unit_price || 0)
    total += itemTotal
    doc.text(`$${itemTotal.toLocaleString('es-CL')}`, pageWidth - margin - 5, currentY, { align: 'right' })
    
    currentY += 7
    
    if (item.notes) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(COLORS.text)
      doc.text(`  📝 ${item.notes}`, margin + 5, currentY)
      currentY += 6
    }
  })

  // Total
  currentY += 8
  doc.setDrawColor(COLORS.textDark)
  doc.setLineWidth(0.3)
  doc.line(pageWidth - 65, currentY, pageWidth - margin, currentY)
  currentY += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.textDark)
  doc.text('TOTAL:', pageWidth - 65, currentY)
  doc.text(`$${total.toLocaleString('es-CL')}`, pageWidth - margin - 5, currentY, { align: 'right' })

  // Pie de página - igual que catálogo
  const footerY = pageHeight - 30
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.primary)
  doc.text('¡Gracias por tu pedido!', pageWidth / 2, footerY, { align: 'center' })
  
  // Iconos y texto - mismo diseño que catálogo (centrados y grandes)
  const iconSize = 7
  const iconY = footerY + 8
  const fontSize = 10
  
  // Calcular ancho total para centrar
  const gap = 15
  const whatsappTextWidth = 32
  const instagramTextWidth = 22
  const totalWidth = iconSize + 2 + whatsappTextWidth + gap + iconSize + 2 + instagramTextWidth
  const startX = (pageWidth - totalWidth) / 2
  
  // WhatsApp
  if (whatsappImg) {
    try {
      doc.addImage(whatsappImg, 'PNG', startX, iconY, iconSize, iconSize)
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.text)
      doc.text('+56 9 6917 2764', startX + iconSize + 2, iconY + 5)
    } catch (e) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.text)
      doc.text('WhatsApp: +56 9 6917 2764', startX, iconY + 5)
    }
  } else {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.text)
    doc.text('WhatsApp: +56 9 6917 2764', startX, iconY + 5)
  }
  
  // Instagram
  const instaX = startX + iconSize + 2 + whatsappTextWidth + gap
  if (instagramImg) {
    try {
      doc.addImage(instagramImg, 'PNG', instaX, iconY, iconSize, iconSize)
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.text)
      doc.text('@kivi.chile', instaX + iconSize + 2, iconY + 5)
    } catch (e) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.text)
      doc.text('Instagram: @kivi.chile', instaX, iconY + 5)
    }
  } else {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.text)
    doc.text('Instagram: @kivi.chile', instaX, iconY + 5)
  }

  // Descargar
  const customerName = typeof customer === 'object' ? (customer.name || customer.full_name || 'Cliente') : (customer || 'Cliente')
  const filename = `Factura_${order.title || order.name || order.id}_${customerName}.pdf`.replace(/ /g, '_')
  doc.save(filename)
}

