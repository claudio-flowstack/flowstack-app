// ── Puter.js AI Wrapper ──
// Provides free AI access via Puter.js (GPT-4o, Claude, Gemini, DeepSeek)
// No API keys needed — runs directly in the browser

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string; stream?: boolean }) => Promise<{ message: { content: string } }>
        txt2img: (prompt: string, options?: { model?: string }) => Promise<{ src: string }>
      }
    }
  }
}

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet'
  | 'claude-3-haiku'
  | 'gemini-2.0-flash'
  | 'deepseek-chat'
  | 'deepseek-reasoner'

export const AI_MODELS: { value: AIModel; label: string; provider: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', provider: 'DeepSeek' },
]

function getPuter() {
  if (!window.puter?.ai) {
    throw new Error('Puter.js nicht geladen. Bitte Seite neu laden.')
  }
  return window.puter
}

export async function aiChat(prompt: string, model: AIModel = 'gpt-4o'): Promise<string> {
  const puter = getPuter()
  const response = await puter.ai.chat(prompt, { model })
  return response.message.content
}

export async function aiGenerateImage(prompt: string): Promise<string> {
  const puter = getPuter()
  const response = await puter.ai.txt2img(prompt)
  return response.src
}

export function isPuterAvailable(): boolean {
  return !!window.puter?.ai
}
