'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Filter out rows with invalid dates (e.g. header row leaked into data)
  const validRows = rows.filter((row) => row.date && !isNaN(Date.parse(row.date)))

  if (validRows.length === 0) {
    return { error: 'No valid rows to import (check that date values are valid)' }
  }

  // Build insert rows
  const insertRows = validRows.map((row) => ({
    project_id: projectId,
    date: row.date,
    platform: row.platform || 'google_ads',
    campaign: row.campaign || null,
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    cost: row.cost || 0,
    conversions: row.conversions || 0,
    revenue: row.revenue || 0,
    custom_columns: row.custom_columns || {},
  }))

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
