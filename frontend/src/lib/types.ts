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
}

export const AI_MODELS: ModelConfig[] = [
  { id: 'claude', name: 'Claude', color: 'bg-claude', icon: 'C', logoSrc: '/icons/models/claude.svg' },
  { id: 'gemini', name: 'Gemini', color: 'bg-gemini', icon: 'Ge', logoSrc: '/icons/models/gemini.svg' },
  { id: 'gpt', name: 'GPT', color: 'bg-gpt', icon: 'G', logoSrc: '/icons/models/gpt.svg' },
  { id: 'grok', name: 'Grok', color: 'bg-grok', icon: 'X', logoSrc: '/icons/models/grok.svg' },
]

export interface AppState {
  prompts: Prompt[]
  currentModelIndex: number
}
