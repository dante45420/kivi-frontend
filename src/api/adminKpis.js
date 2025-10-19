import { apiFetch } from './client'

export function getKpisOverview(params = {}) {
  const usp = new URLSearchParams()
  if (params.date_from) usp.set('date_from', params.date_from)
  if (params.date_to) usp.set('date_to', params.date_to)
  if (params.recompra_days) usp.set('recompra_days', params.recompra_days)
  if (params.activo_days) usp.set('activo_days', params.activo_days)
  
  return apiFetch(`/admin/kpis/overview?${usp.toString()}`)
}

export function getTopProducts(params = {}) {
  const usp = new URLSearchParams()
  if (params.limit) usp.set('limit', params.limit)
  if (params.date_from) usp.set('date_from', params.date_from)
  if (params.date_to) usp.set('date_to', params.date_to)
  if (params.sort_by) usp.set('sort_by', params.sort_by)
  
  return apiFetch(`/admin/kpis/productos-top?${usp.toString()}`)
}

