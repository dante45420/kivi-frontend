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

    // Iconos y texto
    const iconSize = 5
    const iconY = footerY + 6
    
    if (whatsappImg) {
      try {
        doc.addImage(whatsappImg, 'PNG', margin, iconY, iconSize, iconSize)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('+56 9 6917 2764', margin + iconSize + 2, iconY + 3.5)
      } catch (e) {
        doc.text('WhatsApp: +56 9 6917 2764', margin, iconY + 3.5)
      }
    } else {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('WhatsApp: +56 9 6917 2764', margin, iconY + 3.5)
    }
    
    if (instagramImg) {
      try {
        const instaX = pageWidth / 2 - iconSize / 2 - 15
        doc.addImage(instagramImg, 'PNG', instaX, iconY, iconSize, iconSize)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('@kivi.chile', instaX + iconSize + 2, iconY + 3.5)
      } catch (e) {
        doc.text('Instagram: @kivi.chile', pageWidth / 2, iconY + 3.5, { align: 'center' })
      }
    } else {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Instagram: @kivi.chile', pageWidth / 2, iconY + 3.5, { align: 'center' })
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
  const addCategory = (title, items) => {
    // SIEMPRE empezar categoría en nueva página (excepto la primera)
    if (pageNum > 1) {
      addFooter(pageNum)
      doc.addPage()
      pageNum++
      currentY = addHeader()
    }

    // Título de categoría - minimalista
    doc.setFontSize(16)
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

      // Nombre del producto - minimalista sin bordes
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      
      // Truncar nombre si es muy largo
      const maxNameLength = 28
      const displayName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      doc.text(displayName, xPos, currentY + 5)

      let varY = currentY + 11

      // Variantes (si existen) - mostrar SOLO las variantes (sin precio base)
      const hasVariants = product.variants && product.variants.filter(v => v.active).length > 0
      
      if (hasVariants) {
        const activeVariants = product.variants.filter(v => v.active)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        
        activeVariants.forEach(variant => {
          if (variant.price_tiers && variant.price_tiers.length > 0) {
            variant.price_tiers.forEach(tier => {
              const tierText = tier.min_qty > 1 
                ? `${variant.label} (${tier.min_qty}+): $${tier.sale_price?.toLocaleString('es-CL')}/${tier.unit}`
                : `${variant.label}: $${tier.sale_price?.toLocaleString('es-CL')}/${tier.unit}`
              doc.text(tierText, xPos + 2, varY)
              varY += 4.5
            })
          }
        })
      } else {
        // Solo mostrar precio base si NO tiene variantes
        if (price) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 100, 100)
          const priceText = `$${price.sale_price?.toLocaleString('es-CL')}/${price.unit}`
          doc.text(priceText, xPos + 2, varY)
          varY += 5
        }
      }

      // Línea divisoria sutil entre productos
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(xPos, currentY + (varY - currentY) + 2, xPos + columnWidth, currentY + (varY - currentY) + 2)

      // Cambiar de columna
      column++
      if (column >= 2) {
        column = 0
        currentY = Math.max(currentY + 18, varY + 4)
      }
    })

    // Si quedamos en la primera columna, avanzar
    if (column === 1) {
      currentY += 18
    }

    currentY += 3 // Espacio después de la categoría
  }

  // Agregar cada categoría
  if (frutas.length > 0) {
    addCategory('Frutas', frutas)
  }

  if (verduras.length > 0) {
    addCategory('Verduras', verduras)
  }

  if (otros.length > 0) {
    addCategory('Otros', otros)
  }

  // Agregar pie de página final
  addFooter(pageNum)

  // Descargar el PDF
  doc.save('Catalogo_Kivi.pdf')
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
  const margin = 20

  // Encabezado
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.textDark)
  doc.text('Kivi - Frutas y Verduras Frescas', pageWidth / 2, 25, { align: 'center' })

  // Información del pedido
  let currentY = 40
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE PEDIDO', margin, currentY)

  currentY += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pedido: ${order.title || `#${order.id}`}`, margin, currentY)
  currentY += 7
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-CL')}`, margin, currentY)

  if (customer) {
    currentY += 7
    doc.text(`Cliente: ${customer}`, margin, currentY)
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

  // Pie de página
  const footerY = doc.internal.pageSize.getHeight() - 20
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.text)
  doc.text('¡Gracias por tu pedido!', pageWidth / 2, footerY, { align: 'center' })
  doc.text('📞 +56 9 6917 2764  |  📷 @kivi.chile', pageWidth / 2, footerY + 7, { align: 'center' })

  // Descargar
  const filename = `Factura_${order.title || order.id}_${customer || 'Cliente'}.pdf`.replace(/ /g, '_')
  doc.save(filename)
}

