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

  // Cargar ofertas semanales - usar baseUrl correcto
  let weeklyOffers = { fruta: null, verdura: null, especial: null }
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${baseUrl}/weekly-offers`)
    if (response.ok) {
      weeklyOffers = await response.json()
    } else {
      console.log('Error al cargar ofertas:', response.status)
    }
      } catch (e) {
    console.log('No se pudieron cargar las ofertas semanales:', e)
  }

  // Función para agregar pie de página
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 15 // Mismo margen que el título (15mm desde abajo)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(COLORS.text)
    doc.text(
      '*Si no encuentras algo, lo buscamos y cobramos 10% menos que el Jumbo*',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )

    // Iconos, texto y número de página - todos centrados verticalmente en la misma línea
    const centerY = pageHeight - 5 // Posición Y del centro (5mm desde abajo)
    const iconSize = 7
    const fontSize = 10
    const pageFontSize = 8
    
    // Ajustes manuales para alineación perfecta:
    // - Subir los logos: disminuir iconY (mover hacia arriba = Y más pequeño)
    // - Bajar el texto: aumentar textY (mover hacia abajo = Y más grande)
    const iconY = centerY - iconSize / 2 - 0.8 // Subir logos 0.8mm
    
    // Texto: posición ajustada manualmente (bajar un poco)
    const textCenterOffset = (fontSize * 0.3528) * 0.40
    const textY = centerY - textCenterOffset + 0.6 // Bajar texto 0.6mm
    
    // Número de página: mismo ajuste
    const pageTextCenterOffset = (pageFontSize * 0.3528) * 0.40
    const pageTextY = centerY - pageTextCenterOffset + 0.6 // Bajar texto 0.6mm
    
    // Calcular ancho total para centrar
    const gap = 15 // Espacio entre los dos elementos
    const whatsappTextWidth = 32 // Aproximado
    const instagramTextWidth = 22 // Aproximado
    const totalWidth = iconSize + 2 + whatsappTextWidth + gap + iconSize + 2 + instagramTextWidth
    const startX = (pageWidth - totalWidth) / 2
    
    // WhatsApp - icono y texto alineados en centerY
    if (whatsappImg) {
      try {
        doc.addImage(whatsappImg, 'PNG', startX, iconY, iconSize, iconSize)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('+56 9 6917 2764', startX + iconSize + 2, textY)
      } catch (e) {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('WhatsApp: +56 9 6917 2764', startX, textY)
      }
    } else {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.text('WhatsApp: +56 9 6917 2764', startX, textY)
    }
    
    // Instagram - icono y texto alineados en centerY
    const instaX = startX + iconSize + 2 + whatsappTextWidth + gap
    if (instagramImg) {
      try {
        doc.addImage(instagramImg, 'PNG', instaX, iconY, iconSize, iconSize)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('@kivi.chile', instaX + iconSize + 2, textY)
      } catch (e) {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold')
        doc.text('Instagram: @kivi.chile', instaX, textY)
      }
    } else {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'bold')
      doc.text('Instagram: @kivi.chile', instaX, textY)
    }

    // Número de página - alineado en centerY
    doc.setFontSize(pageFontSize)
    doc.text(`Página ${pageNum}`, pageWidth / 2, pageTextY, { align: 'center' })
  }

  // Función para agregar página de ofertas semanales
  const addWeeklyOffersPage = async () => {
    let currentY = 18
    
    // Logo centrado arriba - estilizado como en las imágenes
    if (logoImg) {
      try {
        const logoWidth = 50
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width
        doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight)
        currentY += logoHeight + 6
      } catch (e) {
        console.log('Error agregando logo en ofertas')
      }
    }
    
    // Slogan debajo del logo
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 100, 80)
    doc.text('FRUTAS Y VERDURAS FRESCAS', pageWidth / 2, currentY, { align: 'center' })
    currentY += 20
    
    // Título "Ofertas de la Semana" - mismo estilo que categorías
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.textDark)
    doc.text('Ofertas de la Semana', margin, currentY)
    currentY += 3
    
    // Línea divisoria - mismo estilo que categorías
    doc.setDrawColor(168, 213, 186) // Color verde pastel
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 15 // Más espacio entre título y ofertas
    
    // Función helper para renderizar una oferta (agrandada y centrada)
    const renderOffer = async (offer, label, color, xPos, maxWidth, startY) => {
      if (!offer) return startY
      
      let y = startY
      
      // Título de la oferta - más grande
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text(label, xPos + maxWidth / 2, y, { align: 'center' })
      
      // Línea subrayada
      doc.setDrawColor(...color)
      doc.setLineWidth(0.5)
      const titleWidth = doc.getTextWidth(label)
      doc.line(xPos + (maxWidth - titleWidth) / 2, y + 2, xPos + (maxWidth + titleWidth) / 2, y + 2)
      y += 10
      
      // Nombre del producto y precio - más grande
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      const productName = offer.product?.name || 'Producto'
      const priceText = `${productName}: ${offer.price || ''}`
      // Ajustar texto si es muy largo
      const maxTextWidth = maxWidth - 10
      const priceTextWidth = doc.getTextWidth(priceText)
      if (priceTextWidth > maxTextWidth) {
        doc.setFontSize(12)
      }
      doc.text(priceText, xPos + maxWidth / 2, y, { align: 'center', maxWidth: maxTextWidth })
      y += 8
      
      // Precio de referencia - más grande
      if (offer.reference_price) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 100, 100)
        const refText = `(${offer.reference_price})`
        const refWidth = doc.getTextWidth(refText)
        if (refWidth > maxTextWidth) {
          doc.setFontSize(8)
        }
        doc.text(refText, xPos + maxWidth / 2, y, { align: 'center', maxWidth: maxTextWidth })
        y += 9
      } else {
        y += 6
      }
      
      // Imagen del producto - más grande
      const productImageUrl = offer.product?.quality_photo_url || null
      let maxImgY = y
      if (productImageUrl) {
        try {
          const offerImg = await loadImage(productImageUrl)
          // Imágenes más grandes: 70mm para columnas, 80mm para especial completo
          const imgWidth = Math.min(70, maxWidth - 15)
          const imgHeight = Math.min((offerImg.height * imgWidth) / offerImg.width, 60)
          
          if (y + imgHeight < pageHeight - 25) {
            doc.addImage(offerImg, 'PNG', xPos + (maxWidth - imgWidth) / 2, y, imgWidth, imgHeight)
            maxImgY = y + imgHeight + 8
          }
        } catch (e) {
          console.log('No se pudo cargar imagen de oferta:', productImageUrl)
        }
      }
      
      return Math.max(y, maxImgY)
    }
    
    // FRUTA Y VERDURA EN MISMA FILA (centradas y más grandes)
    const columnWidth = (pageWidth - margin * 2 - 15) / 2 // 15mm de espacio entre columnas
    const columnStartY = currentY
    
    let frutaY = columnStartY
    let verduraY = columnStartY
    
    // Renderizar fruta (columna izquierda) - centrado
    if (weeklyOffers.fruta) {
      frutaY = await renderOffer(
        weeklyOffers.fruta,
        '¡Fruta de la semana!',
        [255, 152, 0],
        margin,
        columnWidth,
        columnStartY
      )
    }
    
    // Renderizar verdura (columna derecha) - centrado
    if (weeklyOffers.verdura) {
      verduraY = await renderOffer(
        weeklyOffers.verdura,
        '¡Verdura de la semana!',
        [76, 175, 80],
        margin + columnWidth + 15,
        columnWidth,
        columnStartY
      )
    }
    
    // Avanzar Y al máximo de ambas columnas
    currentY = Math.max(frutaY, verduraY) + 15
    
    // ESPECIAL ABAJO (centrado, ancho completo pero contenido centrado)
    if (weeklyOffers.especial) {
      const especialLabel = '¡Especial de la semana!'
      // Centrar el especial: usar menos ancho pero centrado
      const especialWidth = Math.min(140, pageWidth - margin * 2) // Ancho máximo centrado
      const especialX = (pageWidth - especialWidth) / 2 // Centrar en la página
      
      currentY = await renderOffer(
        weeklyOffers.especial,
        especialLabel,
        [255, 152, 0],
        especialX,
        especialWidth,
        currentY
      )
      currentY += 10
    }
    
    // Pie de página - ajustar para evitar sobreposición
    // Usar addFooter normal que maneja mejor el espaciado
    addFooter(1)
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

  // Agregar página de ofertas semanales primero (si hay ofertas)
  let pageNum = 1
  const hasAnyOffer = weeklyOffers.fruta || weeklyOffers.verdura || weeklyOffers.especial
  if (hasAnyOffer) {
    await addWeeklyOffersPage()
    doc.addPage()
    pageNum = 2
  } else {
    // Si no hay ofertas, empezar con página normal
    pageNum = 1
  }

  let currentY = addHeader()

  // Separar productos por categoría
  const frutas = products.filter(p => p.category === 'fruta').sort((a, b) => a.name.localeCompare(b.name))
  const verduras = products.filter(p => p.category === 'verdura').sort((a, b) => a.name.localeCompare(b.name))
  const otros = products.filter(p => !p.category || (p.category !== 'fruta' && p.category !== 'verdura')).sort((a, b) => a.name.localeCompare(b.name))

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

  // Calcular semana del mes: semana 1 siempre empieza el día 1, resto empiezan en lunes
  function getWeekOfMonth() {
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Primer día del mes
    const firstDay = new Date(currentYear, currentMonth, 1)
    const firstDayOfWeek = firstDay.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    // Último día del mes
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    // Semana 1: siempre empieza el día 1 y termina el domingo siguiente
    // Calcular el domingo de la semana 1
    let endOfWeek1
    if (firstDayOfWeek === 0) {
      // Empezó en domingo, semana 1 es solo el día 1
      endOfWeek1 = 1
    } else {
      // Días desde el 1 hasta el domingo (0 = domingo)
      // Si empezó en lunes (1), el domingo es el día 7: 1 + (0 - 1 + 7) % 7 = 1 + 6 = 7
      // Si empezó en martes (2), el domingo es el día 6: 1 + (0 - 2 + 7) % 7 = 1 + 5 = 6
      endOfWeek1 = 1 + (7 - firstDayOfWeek) % 7
    }
    
    // Calcular qué semana del mes es
    let weekNumber
    if (currentDay <= endOfWeek1) {
      // Estamos en la semana 1 (día 1 hasta el domingo)
      weekNumber = 1
    } else {
      // Semanas 2+ empiezan en lunes y terminan en domingo
      // El primer lunes después de la semana 1
      const firstMondayAfterWeek1 = endOfWeek1 + 1
      
      // Si el día siguiente a la semana 1 no es lunes, encontrar el lunes
      const dayAfterWeek1 = new Date(currentYear, currentMonth, endOfWeek1 + 1)
      const dayAfterWeek1DayOfWeek = dayAfterWeek1.getDay()
      
      let firstMondayOfWeek2
      if (dayAfterWeek1DayOfWeek === 1) {
        // Ya es lunes
        firstMondayOfWeek2 = endOfWeek1 + 1
      } else {
        // Calcular días hasta el lunes
        const daysToMonday = (8 - dayAfterWeek1DayOfWeek) % 7
        firstMondayOfWeek2 = endOfWeek1 + 1 + daysToMonday
      }
      
      if (currentDay < firstMondayOfWeek2) {
        // Estamos entre semana 1 y semana 2 (días del domingo al lunes de la semana 2)
        // Esto no debería pasar normalmente, pero por si acaso, semana 1
        weekNumber = 1
      } else {
        // Calcular semanas desde el primer lunes de semana 2
        const daysSinceFirstMonday = currentDay - firstMondayOfWeek2
        weekNumber = 2 + Math.floor(daysSinceFirstMonday / 7)
      }
    }
    
    // Limitar a 5 semanas máximo
    weekNumber = Math.max(1, Math.min(5, weekNumber))
    
    const semanas = ['1ra', '2da', '3ra', '4ta', '5ta']
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    
    const semanaStr = semanas[weekNumber - 1] || '5ta'
    const mesStr = meses[currentMonth]
    
    return `${semanaStr} Semana ${mesStr}`
  }

  // Descargar el PDF con nombre que incluye semana del mes
  const weekInfo = getWeekOfMonth()
  doc.save(`Catalogo_Kivi (${weekInfo}).pdf`)
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
        const logoWidth = 50
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width
        doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 12, logoWidth, logoHeight)
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 50, 50)
        doc.text('CATÁLOGO VENDEDORES - USO INTERNO', pageWidth / 2, 12 + logoHeight + 7, { align: 'center' })
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('3 opciones de precio según margen de utilidad', pageWidth / 2, 12 + logoHeight + 12, { align: 'center' })
        
        return 12 + logoHeight + 18
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
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150, 150, 150)
    doc.text('3 opciones de precio según margen de utilidad', pageWidth / 2, 34, { align: 'center' })
    
    return 40
  }

  // Función para agregar pie de página
  const addFooter = (pageNum) => {
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  // Separar productos por categoría (solo frutas y verduras)
  const frutas = products.filter(p => p.category === 'fruta').sort((a, b) => a.name.localeCompare(b.name))
  const verduras = products.filter(p => p.category === 'verdura').sort((a, b) => a.name.localeCompare(b.name))

  let currentY = addHeader()
  let pageNum = 1

  // Función para agregar una categoría con 2 columnas
  const addCategory = (title, items, isFirst = false) => {
    if (!isFirst) {
      addFooter(pageNum)
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

    // Agregar productos en formato de 2 columnas
    const columnWidth = (contentWidth - 8) / 2
    let column = 0
    
    items.forEach((product) => {
      const price = product.catalog && product.catalog[0]
      const cost = product.latest_cost
      const xPos = margin + (column * (columnWidth + 8))
      
      // Verificar si necesitamos una nueva página
      const estimatedHeight = 30
      if (currentY + estimatedHeight > pageHeight - 30) {
        addFooter(pageNum)
        doc.addPage()
        pageNum++
        currentY = addHeader()
        column = 0
      }

      const startY = currentY

      // Nombre del producto
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COLORS.textDark)
      
      const maxNameLength = 22
      const displayName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      doc.text(displayName, xPos, currentY + 5)

      let varY = currentY + 10

      // Solo mostrar precio por default (sin variantes)
      if (price) {
        const salePrice = price.sale_price || 0
        const unit = price.unit === 'unit' ? 'U.' : price.unit
        
        // Determinar si hay costo registrado o usar estimado
        const hasCost = cost && product.latest_cost_unit === price.unit
        const actualCost = hasCost ? cost : (salePrice * 0.8) // 20% de margen = costo es 80% del precio
        const isEstimated = !hasCost
        
        // Mostrar costo
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        if (isEstimated) {
          doc.text(`Costo: $${Math.round(actualCost).toLocaleString('es-CL')} (estimado*)`, xPos, varY)
        } else {
          doc.text(`Costo: $${actualCost.toLocaleString('es-CL')}`, xPos, varY)
        }
        varY += 5
        
        // Título: 3 opciones de ganancia
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(COLORS.textDark)
        doc.text(`3 OPCIONES DE PRECIO:`, xPos, varY)
        varY += 5
        
        // Calcular las 3 opciones: 50%, 70%, 80% de utilidad
        const margins = [
          { label: '50%', percent: 0.50, color: [76, 175, 80] },   // Verde
          { label: '70%', percent: 0.70, color: [0, 123, 255] },   // Azul
          { label: '80%', percent: 0.80, color: [156, 39, 176] }   // Morado
        ]
        
        margins.forEach((margin, idx) => {
          // Precio de venta = costo / (1 - margen)
          const suggestedPrice = Math.round(actualCost / (1 - margin.percent))
          const profit = suggestedPrice - actualCost
          const profitPct = ((profit / suggestedPrice) * 100).toFixed(0)
          
          // Nombre de la opción
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...margin.color)
          doc.text(`${margin.label} utilidad:`, xPos, varY)
          
          // Precio sugerido
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`$${suggestedPrice.toLocaleString('es-CL')}/${unit}`, xPos + 28, varY)
          
          // Ganancia
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.text(`(Ganas $${Math.round(profit).toLocaleString('es-CL')})`, xPos + 52, varY)
          
          varY += 4
        })
        
        varY += 1
        
        // Si es estimado, agregar nota
        if (isEstimated) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(180, 100, 0)
          doc.text(`*Costo estimado (sin registro de compra)`, xPos, varY)
          varY += 2
        }
      }

      // Línea divisoria
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(xPos, varY + 1, xPos + columnWidth, varY + 1)

      const productHeight = varY - startY + 6

      // Cambiar de columna
      if (column === 0) {
        if (!items.maxHeightThisRow) items.maxHeightThisRow = productHeight
        else items.maxHeightThisRow = Math.max(items.maxHeightThisRow, productHeight)
        column = 1
      } else {
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

    currentY += 3
  }

  // Agregar cada categoría
  let isFirst = true
  
  if (frutas.length > 0) {
    addCategory('🍎 Frutas', frutas, isFirst)
    isFirst = false
  }

  if (verduras.length > 0) {
    addCategory('🥬 Verduras', verduras, isFirst)
  }

  // Agregar pie de página final
  addFooter(pageNum)

  // Descargar el PDF
  doc.save('Catalogo_Vendedores_Kivi.pdf')
}

/**
 * Genera un PDF de nota de cobro para un pedido
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
  doc.text('NOTA DE COBRO', margin, currentY)

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

  // Filtrar items con cantidad o precio 0
  const filteredItems = items.filter(item => {
    const qty = item.qty || 0
    const unitPrice = item.sale_unit_price || 0
    return qty > 0 && unitPrice > 0
  })

  filteredItems.forEach(item => {
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
  const filename = `NotaDeCobro_${order.title || order.name || order.id}_${customerName}.pdf`.replace(/ /g, '_')
  doc.save(filename)
}

