import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match?.[1] ?? null
}

function extractGid(url: string): string {
  const match = url.match(/[?&]gid=(\d+)/)
  return match?.[1] ?? '0'
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  // Strip BOM (UTF-8 BOM can break first header cell matching)
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = cleaned.split(/\r?\n/)

  for (const line of lines) {
    if (line.trim() === '') continue
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    rows.push(cells)
  }

  return rows
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { url } = body as { url: string }

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const sheetId = extractSheetId(url)
  if (!sheetId) {
    return NextResponse.json(
      { error: 'Invalid Google Spreadsheet URL. Expected format: https://docs.google.com/spreadsheets/d/{ID}/...' },
      { status: 400 }
    )
  }

  const gid = extractGid(url)
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`

  try {
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Spreadsheet not found. Make sure the URL is correct.' },
          { status: 404 }
        )
      }
      if (response.status === 403 || response.status === 401) {
        return NextResponse.json(
          { error: 'Cannot access this spreadsheet. Make sure it is shared as "Anyone with the link can view".' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch spreadsheet (HTTP ${response.status})` },
        { status: 502 }
      )
    }

    const csvText = await response.text()

    // Check if we got an HTML error page instead of CSV
    if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
      return NextResponse.json(
        { error: 'Cannot access this spreadsheet. Make sure it is shared as "Anyone with the link can view".' },
        { status: 403 }
      )
    }

    const rows = parseCsv(csvText)

    return NextResponse.json({
      rows,
      sheetId,
      gid,
      totalRows: rows.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheet. Please check the URL and try again.' },
      { status: 502 }
    )
  }
}
