import { apiFetch } from './client'

export function listPrices(productId) {
  return apiFetch(`/prices?product_id=${productId}`)
}

export function createPrice(payload) {
  return apiFetch('/prices', { method: 'POST', body: payload })
}

export function listCatalog(productId){
  return apiFetch(`/prices/catalog?product_id=${productId}`)
}

export function createCatalog(payload){
  return apiFetch('/prices/catalog', { method:'POST', body: payload })
}

export function listCompetitors(productId){
  return apiFetch(`/prices/competitors?product_id=${productId}`)
}

export function createCompetitor(payload){
  return apiFetch('/prices/competitors', { method:'POST', body: payload })
}

export function scrapeCompetitors(query){
  return apiFetch(`/scrape?q=${encodeURIComponent(query)}`)
}

export function costTrend(productId, period){
  const p = period || '7d'
  return apiFetch(`/prices/cost-trend?product_id=${productId}&period=${p}`)
}

export function saleVsCompetitor(productIdOrAll, period){
  const pid = productIdOrAll ?? 'all'
  const p = period || 'actual'
  return apiFetch(`/prices/sale-vs-competitor?product_id=${pid}&period=${p}`)
}

export function profitSummary(productIdOrAll, period){
  const pid = productIdOrAll ?? 'all'
  const p = period || 'actual'
  return apiFetch(`/prices/profit?product_id=${pid}&period=${p}`)
}
