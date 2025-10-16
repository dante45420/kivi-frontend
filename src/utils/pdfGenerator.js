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

  // Función para agregar encabezado
  const addHeader = () => {
    // Título
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Kivi', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('FRUTAS Y VERDURAS FRESCAS', pageWidth / 2, 35, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text('*Todo pedido es personalizable a tu manera*', pageWidth / 2, 43, { align: 'center' })

    return 50 // Retorna la posición Y donde termina el encabezado
  }

  // Función para agregar pie de página
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 20

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text(
      '*Si no encuentras algo, lo buscamos y cobramos 10% menos que el Jumbo*',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('📞 +56 9 6917 2764', margin, footerY + 7)
    doc.text('📷 @kivi.chile', pageWidth - margin, footerY + 7, { align: 'right' })

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
    // Verificar si necesitamos una nueva página para el título
    if (currentY + 20 > pageHeight - 30) {
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

      // Fondo del producto - más minimalista
      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(230, 230, 230)
      doc.roundedRect(xPos, currentY, columnWidth, 22, 1.5, 1.5, 'FD')

      // Nombre del producto
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      doc.text(product.name, xPos + 3, currentY + 5)

      // Precio
      if (price) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(COLORS.textDark)
        const priceText = `$${price.sale_price?.toLocaleString('es-CL')} / ${price.unit}`
        doc.text(priceText, xPos + columnWidth - 3, currentY + 5, { align: 'right' })
      }

      // Variantes (si existen)
      if (product.variants && product.variants.filter(v => v.active).length > 0) {
        const activeVariants = product.variants.filter(v => v.active)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(COLORS.text)
        
        let varY = currentY + 11
        activeVariants.slice(0, 2).forEach(variant => {
          const variantLabel = variant.label.length > 15 ? variant.label.substring(0, 15) + '...' : variant.label
          const variantPrice = variant.price_tiers && variant.price_tiers[0] 
            ? `$${variant.price_tiers[0].sale_price?.toLocaleString('es-CL')}/${variant.price_tiers[0].unit}` 
            : ''
          doc.text(`• ${variantLabel}: ${variantPrice}`, xPos + 3, varY)
          varY += 4
        })
      }

      // Cambiar de columna
      column++
      if (column >= 2) {
        column = 0
        currentY += 26 // Altura del producto + espacio
      }
    })

    // Si quedamos en la primera columna, avanzar
    if (column === 1) {
      currentY += 26
    }

    currentY += 5 // Espacio después de la categoría
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

