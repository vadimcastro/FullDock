export type AIModel = 'claude' | 'gpt' | 'grok' | 'gemini'

export type PromptStatus = 'queued' | 'on-deck' | 'needs-edit' | 'complete'

export interface Prompt {
  id: string
  modelId: AIModel
  content: string
  notes: string
  status: PromptStatus
  order: number
  createdAt: number
  updatedAt: number
  linkedPromptId?: string // Reference to prompt in another model thread
}

export interface ModelConfig {
  id: AIModel
  name: string
  color: string
  icon: string
}

export const AI_MODELS: ModelConfig[] = [
  { id: 'claude', name: 'Claude', color: 'bg-claude', icon: 'C' },
  { id: 'gemini', name: 'Gemini', color: 'bg-gemini', icon: 'Ge' },
  { id: 'gpt', name: 'GPT', color: 'bg-gpt', icon: 'G' },
  { id: 'grok', name: 'Grok', color: 'bg-grok', icon: 'X' },
]

export interface AppState {
  prompts: Prompt[]
  currentModelIndex: number
}
