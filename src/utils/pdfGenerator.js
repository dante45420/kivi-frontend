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
    // Logo/Emoji
    doc.setFontSize(40)
    doc.text('🥝', pageWidth / 2, 25, { align: 'center' })

    // Título
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Kivi', pageWidth / 2, 40, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('FRUTAS Y VERDURAS FRESCAS', pageWidth / 2, 50, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text('*Todo pedido es personalizable a tu manera*', pageWidth / 2, 58, { align: 'center' })

    return 65 // Retorna la posición Y donde termina el encabezado
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
  const addCategory = (title, emoji, items) => {
    // Verificar si necesitamos una nueva página para el título
    if (currentY + 20 > pageHeight - 30) {
      addFooter(pageNum)
      doc.addPage()
      pageNum++
      currentY = addHeader()
    }

    // Título de categoría
    doc.setFillColor(COLORS.primary)
    doc.rect(margin, currentY, contentWidth, 10, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${emoji} ${title}`, margin + 3, currentY + 7)
    currentY += 15

    // Agregar productos
    items.forEach(product => {
      const price = product.catalog && product.catalog[0]
      
      // Verificar si necesitamos una nueva página
      if (currentY + 15 > pageHeight - 30) {
        addFooter(pageNum)
        doc.addPage()
        pageNum++
        currentY = addHeader()
      }

      // Fondo del producto
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD')

      // Nombre del producto
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      doc.text(product.name, margin + 3, currentY + 5)

      // Precio
      if (price) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(COLORS.textDark)
        const priceText = `$${price.sale_price?.toLocaleString('es-CL')} / ${price.unit}`
        doc.text(priceText, pageWidth - margin - 3, currentY + 5, { align: 'right' })
      }

      // Variantes (si existen)
      if (product.variants && product.variants.filter(v => v.active).length > 0) {
        currentY += 8
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(COLORS.text)
        const variantsText = `Opciones: ${product.variants.filter(v => v.active).map(v => v.label).join(', ')}`
        doc.text(variantsText, margin + 3, currentY + 5)
        currentY += 7
      } else {
        currentY += 14
      }
    })

    currentY += 5 // Espacio después de la categoría
  }

  // Agregar cada categoría
  if (frutas.length > 0) {
    addCategory('Frutas', '🍎', frutas)
  }

  if (verduras.length > 0) {
    addCategory('Verduras', '🥬', verduras)
  }

  if (otros.length > 0) {
    addCategory('Otros', '🛒', otros)
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
  const margin = 15

  // Encabezado
  doc.setFontSize(32)
  doc.text('🥝', pageWidth / 2, 25, { align: 'center' })

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.textDark)
  doc.text('Kivi - Frutas y Verduras Frescas', pageWidth / 2, 40, { align: 'center' })

  // Información del pedido
  let currentY = 55
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
  doc.setDrawColor(COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)

  // Tabla de productos
  currentY += 10
  doc.setFillColor(COLORS.primary)
  doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Producto', margin + 3, currentY + 7)
  doc.text('Cantidad', pageWidth - 80, currentY + 7)
  doc.text('Precio Unit.', pageWidth - 50, currentY + 7)
  doc.text('Total', pageWidth - margin - 3, currentY + 7, { align: 'right' })

  currentY += 12
  let total = 0

  items.forEach(item => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.textDark)
    
    doc.text(item.product_name || 'Producto', margin + 3, currentY)
    doc.text(`${item.qty || 0} ${item.unit || 'kg'}`, pageWidth - 80, currentY)
    doc.text(`$${(item.sale_unit_price || 0).toLocaleString('es-CL')}`, pageWidth - 50, currentY)
    
    const itemTotal = (item.qty || 0) * (item.sale_unit_price || 0)
    total += itemTotal
    doc.text(`$${itemTotal.toLocaleString('es-CL')}`, pageWidth - margin - 3, currentY, { align: 'right' })
    
    currentY += 7
    
    if (item.notes) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(COLORS.text)
      doc.text(`  📝 ${item.notes}`, margin + 3, currentY)
      currentY += 6
    }
  })

  // Total
  currentY += 5
  doc.setDrawColor(COLORS.textDark)
  doc.setLineWidth(0.3)
  doc.line(pageWidth - 60, currentY, pageWidth - margin, currentY)
  currentY += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.textDark)
  doc.text('TOTAL:', pageWidth - 60, currentY)
  doc.text(`$${total.toLocaleString('es-CL')}`, pageWidth - margin - 3, currentY, { align: 'right' })

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

