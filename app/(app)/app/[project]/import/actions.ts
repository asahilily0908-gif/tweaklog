'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizePlatform } from '@/lib/import/column-mappings'

interface OutcomeRow {
  date: string
  platform: string
  campaign: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
  custom_columns: Record<string, number>
}

function normalizeDateStr(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  // YYYY/M/D or YYYY/MM/DD
  const slashYmd = trimmed.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/)
  if (slashYmd) return `${slashYmd[1]}-${slashYmd[2].padStart(2, '0')}-${slashYmd[3].padStart(2, '0')}`
  // M/D/YYYY or MM/DD/YYYY
  const slashMdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMdy) return `${slashMdy[3]}-${slashMdy[1].padStart(2, '0')}-${slashMdy[2].padStart(2, '0')}`
  // Japanese: 2025年1月30日
  const jpDate = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (jpDate) return `${jpDate[1]}-${jpDate[2].padStart(2, '0')}-${jpDate[3].padStart(2, '0')}`
  // Fallback
  const parsed = Date.parse(trimmed)
  if (!isNaN(parsed)) {
    const d = new Date(parsed)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return null
}

export async function importOutcomes(projectId: string, rows: OutcomeRow[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (rows.length === 0) {
    return { error: 'No rows to import' }
  }

  // Check plan limits
  const originalTotal = rows.length
  let planInfo: { plan: string; maxRows: number; remaining: number } | null = null

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (orgMember) {
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', orgMember.org_id)
      .single()

    const { count: currentRows } = await supabase
      .from('outcomes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const maxRows = org?.plan === 'pro' ? 50000 : 1000
    const remaining = maxRows - (currentRows || 0)
    planInfo = { plan: org?.plan || 'free', maxRows, remaining }

    if (remaining <= 0) {
      return {
        error: null,
        warning: 'limit_reached' as const,
        imported: 0,
        total: originalTotal,
        plan: planInfo.plan,
        maxRows,
      }
    }

    // Truncate rows to remaining capacity
    if (rows.length > remaining) {
      rows = rows.slice(0, remaining)
    }
  }

  // Normalize dates and filter out invalid rows
  const validRows = rows.filter((row) => row.date && normalizeDateStr(row.date) !== null)

  if (validRows.length === 0) {
    return { error: 'No valid rows to import (check that date values are valid)' }
  }

  // Look up existing outcomes to detect platform mismatches (prevent duplicates)
  const { data: existingOutcomes } = await supabase
    .from('outcomes')
    .select('date, platform, campaign')
    .eq('project_id', projectId)
    .limit(5000)

  // Build a lookup: "date|campaign" → existing platform
  const existingPlatformMap = new Map<string, string>()
  if (existingOutcomes) {
    for (const o of existingOutcomes) {
      const key = `${o.date}|${o.campaign ?? ''}`
      existingPlatformMap.set(key, o.platform)
    }
  }

  // Build insert rows with normalized dates, platform normalization, and integer types for bigint columns
  const insertRows = validRows.map((row) => {
    const normalizedDate = normalizeDateStr(row.date)!
    const normalizedPlatform = normalizePlatform(row.platform || '')
    const campaign = row.campaign || null

    // If an outcome already exists for this date+campaign with a different platform,
    // use the existing platform to avoid creating duplicates
    const lookupKey = `${normalizedDate}|${campaign ?? ''}`
    const existingPlatform = existingPlatformMap.get(lookupKey)
    const platform = existingPlatform ?? (normalizedPlatform || 'google_ads')

    return {
      project_id: projectId,
      date: normalizedDate,
      platform,
      campaign,
      impressions: Math.round(row.impressions || 0),
      clicks: Math.round(row.clicks || 0),
      cost: row.cost || 0,
      conversions: row.conversions || 0,
      revenue: row.revenue || 0,
      custom_columns: row.custom_columns || {},
    }
  })

  // Upsert in batches of 500
  const BATCH_SIZE = 500
  let totalInserted = 0

  for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
    const batch = insertRows.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('outcomes')
      .upsert(batch, {
        onConflict: 'project_id,date,platform,campaign',
        ignoreDuplicates: false,
      })

    if (error) {
      return { error: `Import failed at row ${i + 1}: ${error.message}`, imported: totalInserted }
    }

    totalInserted += batch.length
  }

  revalidatePath(`/app/${projectId}/dashboard`)
  revalidatePath(`/app/${projectId}/import`)

  // Return partial import warning if rows were truncated
  if (planInfo && originalTotal > totalInserted) {
    return {
      error: null,
      warning: 'partial_import' as const,
      imported: totalInserted,
      total: originalTotal,
      plan: planInfo.plan,
      maxRows: planInfo.maxRows,
    }
  }

  return { imported: totalInserted }
}

// --- Spreadsheet config actions ---

interface SpreadsheetConfigInput {
  projectId: string
  spreadsheetUrl: string
  sheetGid: string
  headerRow: number
  startColumn: string
  endColumn: string | null
  columnMappings: Record<string, string>
}

export async function saveSpreadsheetConfig(input: SpreadsheetConfigInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Upsert: one config per project
  const { data: existing } = await supabase
    .from('spreadsheet_configs')
    .select('id')
    .eq('project_id', input.projectId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('spreadsheet_configs')
      .update({
        spreadsheet_url: input.spreadsheetUrl,
        sheet_gid: input.sheetGid,
        header_row: input.headerRow,
        start_column: input.startColumn,
        end_column: input.endColumn,
        column_mappings: input.columnMappings,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error) return { error: error.message }
    return { data }
  }

  const { data, error } = await supabase
    .from('spreadsheet_configs')
    .insert({
      project_id: input.projectId,
      spreadsheet_url: input.spreadsheetUrl,
      sheet_gid: input.sheetGid,
      header_row: input.headerRow,
      start_column: input.startColumn,
      end_column: input.endColumn,
      column_mappings: input.columnMappings,
      last_synced_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function getSpreadsheetConfig(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('spreadsheet_configs')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error && error.code !== 'PGRST116') return { error: error.message }
  return { data: data ?? null }
}

export async function updateLastSynced(configId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('spreadsheet_configs')
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)

  if (error) return { error: error.message }
  return { success: true }
}
