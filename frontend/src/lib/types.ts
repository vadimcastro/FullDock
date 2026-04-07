export type DefaultAIModel = 'claude' | 'gpt' | 'grok' | 'gemini'
export type AIModel = string

export type PromptStatus = 'queued' | 'on-deck' | 'needs-edit' | 'forked' | 'complete'

export interface Prompt {
  id: string
  modelId: AIModel
  title?: string
  content: string
  notes: string
  status: PromptStatus
  order: number
  createdAt: number
  updatedAt: number
  linkedPromptId?: string // Reference to prompt in another model thread
}

export interface ModelConfig {
  id: string
  name: string
  color: string
  icon: string
  logoSrc?: string
  family?: 'claude' | 'gemini' | 'gpt' | 'grok'
  iconHue?: number
}

export const AI_MODELS: ModelConfig[] = [
  { id: 'claude', name: 'Claude', color: 'bg-claude', icon: 'C', logoSrc: '/icons/models/claude.svg', family: 'claude' },
  { id: 'gemini', name: 'Gemini', color: 'bg-gemini', icon: 'Ge', logoSrc: '/icons/models/gemini.svg', family: 'gemini' },
  { id: 'gpt', name: 'GPT', color: 'bg-gpt', icon: 'G', logoSrc: '/icons/models/gpt.svg', family: 'gpt' },
  { id: 'grok', name: 'Grok', color: 'bg-grok', icon: 'X', logoSrc: '/icons/models/grok.svg', family: 'grok' },
]

export interface AppState {
  prompts: Prompt[]
  currentModelIndex: number
}
