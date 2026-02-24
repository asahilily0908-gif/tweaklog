import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChatInterface from '@/components/ai/ChatInterface'
import { getUserPlan, canUseFeature } from '@/lib/stripe/check-plan'
import ChatUpgradeGate from './ChatUpgradeGate'

export const metadata = {
  title: 'AI Chat | Tweaklog',
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  // Verify project exists
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check plan access
  const plan = user ? await getUserPlan(user.id) : 'free'
  if (!canUseFeature(plan, 'ai-chat')) {
    return (
      <div className="animate-fade-in-up">
        <ChatUpgradeGate projectId={projectId} />
      </div>
    )
  }

  let initialMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  let chatId: string | null = null

  if (user) {
    const { data: existingChat } = await supabase
      .from('ai_chats')
      .select('id, messages')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (existingChat) {
      chatId = existingChat.id
      initialMessages = existingChat.messages as typeof initialMessages
    }
  }

  return (
    <div className="animate-fade-in-up">
      <ChatInterface
        projectId={projectId}
        initialMessages={initialMessages}
        chatId={chatId}
      />
    </div>
  )
}
