import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const handler = createMcpHandler(
  (server) => {
    // Tool 1: ダッシュボードサマリー取得
    server.tool(
      'tweaklog_dashboard_summary',
      'Get dashboard KPI summary for a Tweaklog project. Returns impressions, clicks, conversions, cost, and revenue for the specified period.',
      {
        projectId: z.string().uuid().describe('Tweaklog project ID'),
        days: z.number().min(1).max(365).default(30).describe('Number of days to look back (default: 30)'),
        platform: z.string().optional().describe('Filter by platform (e.g., "Google Ads", "Meta Ads")'),
      },
      async ({ projectId, days, platform }) => {
        const supabase = createAdminClient()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        let query = supabase
          .from('outcomes')
          .select('*')
          .eq('project_id', projectId)
          .gte('date', startDate.toISOString().split('T')[0])

        if (platform) query = query.eq('platform', platform)

        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

        const summary = {
          period: `Last ${days} days`,
          totalRows: data?.length || 0,
          impressions: data?.reduce((s, r) => s + (Number(r.impressions) || 0), 0),
          clicks: data?.reduce((s, r) => s + (Number(r.clicks) || 0), 0),
          conversions: data?.reduce((s, r) => s + (Number(r.conversions) || 0), 0),
          cost: data?.reduce((s, r) => s + (Number(r.cost) || 0), 0),
          revenue: data?.reduce((s, r) => s + (Number(r.revenue) || 0), 0),
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] }
      }
    )

    // Tool 2: 変更ログ記録
    server.tool(
      'tweaklog_log_change',
      'Log an ad campaign change/experiment in Tweaklog. Records what was changed, before/after values, platform, and campaign.',
      {
        projectId: z.string().uuid().describe('Tweaklog project ID'),
        userId: z.string().uuid().describe('User ID who made the change'),
        title: z.string().optional().describe('Short title for the change'),
        category: z.enum(['bid', 'creative', 'targeting', 'budget', 'structure']).describe('Category of the change'),
        platform: z.string().describe('Ad platform (e.g., "Google Ads")'),
        campaign: z.string().optional().describe('Campaign name'),
        beforeValue: z.string().describe('Value before the change'),
        afterValue: z.string().describe('Value after the change'),
        reason: z.string().optional().describe('Reason for the change'),
        tags: z.array(z.string()).optional().describe('Tags for the change'),
      },
      async ({ projectId, userId, title, category, platform, campaign, beforeValue, afterValue, reason, tags }) => {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('experiments')
          .insert({
            project_id: projectId,
            user_id: userId,
            title: title || null,
            category,
            platform,
            campaign: campaign || null,
            before_value: beforeValue,
            after_value: afterValue,
            reason: reason || null,
            tags: tags || [],
          })
          .select()
          .single()

        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `Change logged successfully. ID: ${data.id}` }] }
      }
    )

    // Tool 3: 変更ログ検索
    server.tool(
      'tweaklog_search_experiments',
      'Search change logs/experiments in Tweaklog. Filter by category, platform, campaign, date range, and tags.',
      {
        projectId: z.string().uuid().describe('Tweaklog project ID'),
        category: z.string().optional().describe('Filter by category (bid, creative, targeting, budget, structure)'),
        platform: z.string().optional().describe('Filter by platform'),
        campaign: z.string().optional().describe('Filter by campaign name (partial match)'),
        days: z.number().min(1).max(365).default(30).describe('Look back period in days'),
        limit: z.number().min(1).max(100).default(20).describe('Max results to return'),
      },
      async ({ projectId, category, platform, campaign, days, limit }) => {
        const supabase = createAdminClient()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        let query = supabase
          .from('experiments')
          .select('id, title, category, platform, campaign, before_value, after_value, reason, tags, created_at')
          .eq('project_id', projectId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(limit)

        if (category) query = query.eq('category', category)
        if (platform) query = query.eq('platform', platform)
        if (campaign) query = query.ilike('campaign', `%${campaign}%`)

        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    // Tool 4: Impact Card 取得
    server.tool(
      'tweaklog_get_impact',
      'Get Impact Cards for experiments. Shows before/after KPI comparison with a -4 to +4 score.',
      {
        projectId: z.string().uuid().describe('Tweaklog project ID'),
        experimentId: z.string().uuid().optional().describe('Specific experiment ID'),
        limit: z.number().min(1).max(50).default(10).describe('Max impact cards to return'),
      },
      async ({ projectId, experimentId, limit }) => {
        const supabase = createAdminClient()
        let query = supabase
          .from('impact_cards')
          .select('*, experiments(title, category, platform, campaign, before_value, after_value)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (experimentId) query = query.eq('experiment_id', experimentId)

        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    // Tool 5: AI ハイライト取得
    server.tool(
      'tweaklog_get_highlights',
      'Get AI-generated highlights and anomaly detections for a Tweaklog project.',
      {
        projectId: z.string().uuid().describe('Tweaklog project ID'),
        days: z.number().min(1).max(90).default(7).describe('Look back period in days'),
      },
      async ({ projectId, days }) => {
        const supabase = createAdminClient()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data, error } = await supabase
          .from('ai_highlights')
          .select('*')
          .eq('project_id', projectId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false })

        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    // Tool 6: プロジェクト一覧
    server.tool(
      'tweaklog_list_projects',
      'List all Tweaklog projects in an organization.',
      {
        orgId: z.string().uuid().describe('Organization ID'),
      },
      async ({ orgId }) => {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, platform, north_star_kpi, created_at')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })

        if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )
  },
  {
    capabilities: {},
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: '/mcp',
    maxDuration: 60,
  }
)

export { handler as GET, handler as POST, handler as DELETE }
