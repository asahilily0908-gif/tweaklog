import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/ai/claude-client'
import { buildSystemPrompt } from '@/lib/ai/context-builder'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-config'

interface ChatRequest {
  projectId: string
  chatId?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function POST(request: NextRequest) {
  const body: ChatRequest = await request.json()
  const { projectId, chatId, messages } = body

  if (!projectId || !messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing projectId or messages' }), { status: 400 })
  }

  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Check AI message limit for the current plan
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('organizations(plan)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const plan = ((orgMember?.organizations as { plan?: string } | null)?.plan || 'free') as PlanType
  const limit = PLAN_LIMITS[plan]?.maxAiMessagesPerMonth ?? PLAN_LIMITS.free.maxAiMessagesPerMonth

  if (limit !== Infinity) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('ai_chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart)

    if ((count ?? 0) >= limit) {
      return new Response(
        JSON.stringify({ error: `AI Chatの月間上限（${limit}回）に達しました。プランをアップグレードしてください。` }),
        { status: 429 }
      )
    }
  }

  // Fetch project context in parallel
  const [projectResult, experimentsResult, outcomesResult, metricsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('name, north_star_kpi, sub_kpis, platform')
      .eq('id', projectId)
      .single(),
    supabase
      .from('experiments')
      .select('id, category, platform, campaign, before_value, after_value, reason, title, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('outcomes')
      .select('date, impressions, clicks, cost, conversions, revenue')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('metric_configs')
      .select('name, display_name, formula, improvement_direction')
      .eq('project_id', projectId),
  ])

  if (!projectResult.data) {
    return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(
    {
      projectName: projectResult.data.name,
      northStarKpi: projectResult.data.north_star_kpi,
      subKpis: projectResult.data.sub_kpis ?? [],
      platforms: projectResult.data.platform ?? [],
    },
    experimentsResult.data ?? [],
    (outcomesResult.data ?? []).reverse(), // chronological order for the prompt
    metricsResult.data ?? []
  )

  // Stream response from Claude
  const client = getAnthropicClient()
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const encoder = new TextEncoder()
  let fullResponse = ''

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullResponse += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()

        // Save conversation after stream completes
        const allMessages = [...messages, { role: 'assistant' as const, content: fullResponse }]

        if (chatId) {
          await supabase
            .from('ai_chats')
            .update({
              messages: allMessages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', chatId)
        } else {
          await supabase.from('ai_chats').insert({
            project_id: projectId,
            user_id: user.id,
            messages: allMessages,
          })
        }
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
