import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY environment variable is not set')
    _openai = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
  }
  return _openai
}

// Anthropic-compatible wrapper — all 10 agent files remain unchanged
export function getClient() {
  const openai = getOpenAI()
  return {
    messages: {
      create: async (params: {
        model: string
        max_tokens: number
        system: string
        messages: { role: string; content: string }[]
      }) => {
        const completion = await openai.chat.completions.create({
          model: params.model,
          max_tokens: params.max_tokens,
          messages: [
            { role: 'system' as const, content: params.system },
            ...params.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        })
        if (!completion.choices.length) {
          throw new Error('DeepSeek returned empty choices — content may have been filtered or quota exceeded')
        }
        return {
          content: [{ type: 'text', text: completion.choices[0].message.content ?? '' }],
        }
      },
    },
  }
}

export const AGENT_MODEL = 'deepseek-chat'
