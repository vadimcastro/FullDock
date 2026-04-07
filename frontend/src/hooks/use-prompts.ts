'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import type { AIModel, Prompt, PromptStatus } from '@/lib/types'
import { useProtectedApi } from '@/lib/api/protected'
import { useAuth } from '@/lib/auth/AuthContext'

// Mapping Utilities
const mapToBackend = (p: any) => ({
  id: p.id,
  model_id: p.modelId,
  title: p.title || "",
  content: p.content,
  notes: p.notes || "",
  status: p.status,
  order: p.order,
  linked_prompt_id: p.linkedPromptId || null,
})

const mapFromBackend = (p: any): Prompt => ({
  id: p.id,
  modelId: p.model_id,
  title: p.title || "",
  content: p.content,
  notes: p.notes || "",
  status: p.status as PromptStatus,
  order: p.order,
  createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
  updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
  linkedPromptId: p.linked_prompt_id || null,
})

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { isAuthenticated } = useAuth()
  const api = useProtectedApi()
  const syncInProgress = useRef(false)

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const local = localStorage.getItem('ondeck-prompts')
    if (local) {
      try {
        setPrompts(JSON.parse(local))
      } catch (e) {
        console.error('Failed to parse local prompts:', e)
      }
    }
  }, [])

  const fetchPrompts = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoaded(true)
      return
    }
    try {
      const data = await api.get<any[]>('/api/v1/prompts/')
      setPrompts(data.map(mapFromBackend))
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
      setIsLoaded(true)
    }
  }, [api, isAuthenticated])

  // 2. Sync Local to Cloud on Login
  useEffect(() => {
    const syncLocalToCloud = async () => {
      if (isAuthenticated && !syncInProgress.current) {
        const local = localStorage.getItem('ondeck-prompts')
        if (local) {
          try {
            const localPrompts = JSON.parse(local) as Prompt[]
            if (localPrompts.length > 0) {
              syncInProgress.current = true
              const remainingPrompts = [...localPrompts]
              
              for (const p of localPrompts) {
                try {
                  await api.post('/api/v1/prompts/', mapToBackend(p))
                  // Remove from remaining on success
                  const idx = remainingPrompts.findIndex(rp => rp.id === p.id)
                  if (idx > -1) {
                    remainingPrompts.splice(idx, 1)
                    // Update localStorage immediately after each success
                    if (remainingPrompts.length > 0) {
                      localStorage.setItem('ondeck-prompts', JSON.stringify(remainingPrompts))
                    } else {
                      localStorage.removeItem('ondeck-prompts')
                    }
                  }
                } catch (err) {
                  console.error(`Failed to sync prompt ${p.id}:`, err)
                }
              }
              console.log('Local prompts sync process finished.')
            }
          } catch (e) {
            console.error('Failed to parse/sync local prompts:', e)
          } finally {
            syncInProgress.current = false
            fetchPrompts() 
          }
        } else {
          fetchPrompts()
        }
      }
    };
    
    syncLocalToCloud();
    if (!isAuthenticated) {
      fetchPrompts();
    }
  }, [isAuthenticated, api, fetchPrompts])

  // 3. Persist to LocalStorage whenever prompts change (if not syncing)
  useEffect(() => {
    if (!syncInProgress.current && prompts.length > 0) {
      localStorage.setItem('ondeck-prompts', JSON.stringify(prompts))
    } else if (!syncInProgress.current && prompts.length === 0) {
      localStorage.removeItem('ondeck-prompts')
    }
  }, [prompts])

  const getPromptsForModel = useCallback(
    (modelId: AIModel): Prompt[] => {
      return prompts
        .filter((p) => p.modelId === modelId)
        .sort((a, b) => a.order - b.order)
    },
    [prompts]
  )

  const getOnDeckPrompt = useCallback(
    (modelId: AIModel): Prompt | undefined => {
      const modelPrompts = getPromptsForModel(modelId)
      return modelPrompts.find((p) => p.status === 'on-deck')
    },
    [getPromptsForModel]
  )

  const addPrompt = useCallback(
    async (
      modelId: AIModel,
      content: string,
      notes: string = '',
      title: string = '',
      initialStatus?: PromptStatus
    ): Promise<Prompt | undefined> => {
      const modelPrompts = prompts.filter((p) => p.modelId === modelId)
      const maxOrder = Math.max(0, ...modelPrompts.map((p) => p.order))
      const hasOnDeck = modelPrompts.some((p) => p.status === 'on-deck')

      const newPrompt: Prompt = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        title,
        content,
        notes,
        status: initialStatus ?? ((hasOnDeck ? 'queued' : 'on-deck') as PromptStatus),
        order: maxOrder + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Optimistic update
      setPrompts((prev: Prompt[]) => [...prev, newPrompt])

      if (isAuthenticated) {
        try {
          const saved = await api.post<any>('/api/v1/prompts/', mapToBackend(newPrompt))
          return mapFromBackend(saved)
        } catch (error) {
          console.error('Failed to add prompt to cloud:', error)
          return undefined
        }
      }
      return newPrompt
    },
    [prompts, api, isAuthenticated]
  )

  const updatePrompt = useCallback(
    async (id: string, updates: Partial<Pick<Prompt, 'title' | 'content' | 'notes' | 'linkedPromptId'>>): Promise<void> => {
      // Optimistic update
      setPrompts((prev: Prompt[]) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        )
      )

      if (isAuthenticated) {
        try {
          // Map updates to snake_case
          const backendUpdates: any = {}
          if (updates.title !== undefined) backendUpdates.title = updates.title
          if (updates.content !== undefined) backendUpdates.content = updates.content
          if (updates.notes !== undefined) backendUpdates.notes = updates.notes
          if (updates.linkedPromptId !== undefined) backendUpdates.linked_prompt_id = updates.linkedPromptId
          
          await api.patch(`/api/v1/prompts/${id}`, backendUpdates)
        } catch (error) {
          console.error('Failed to update prompt in cloud:', error)
          fetchPrompts()
        }
      }
    },
    [api, isAuthenticated, fetchPrompts]
  )

  const updateStatus = useCallback(
    async (id: string, status: PromptStatus): Promise<void> => {
      const prompt = prompts.find((p) => p.id === id)
      if (!prompt) return

      // Optimistic update
      let updated = prompts.map((p: Prompt) =>
        p.id === id ? { ...p, status, updatedAt: Date.now() } : p
      )

      // If marking complete, promote next queued to on-deck
      if (status === 'complete') {
        const nextQueued = updated
          .filter((p: Prompt) => p.modelId === prompt.modelId && (p.status === 'queued' || p.status === 'forked'))
          .sort((a: Prompt, b: Prompt) => a.order - b.order)[0]

        if (nextQueued) {
          updated = updated.map((p: Prompt) =>
            p.id === nextQueued.id ? { ...p, status: 'on-deck' as PromptStatus, updatedAt: Date.now() } : p
          )
          if (isAuthenticated) {
            api.patch(`/api/v1/prompts/${nextQueued.id}`, { status: 'on-deck' })
          }
        }
      }
      setPrompts(updated)

      if (isAuthenticated) {
        try {
          await api.patch(`/api/v1/prompts/${id}`, { status })
        } catch (error) {
          console.error('Failed to update status in cloud:', error)
          fetchPrompts()
        }
      }
    },
    [prompts, api, isAuthenticated, fetchPrompts]
  )

  const deletePrompt = useCallback(
    async (id: string): Promise<void> => {
      setPrompts((prev: Prompt[]) => prev.filter((p: Prompt) => p.id !== id))

      if (isAuthenticated) {
        try {
          await api.delete(`/api/v1/prompts/${id}`)
        } catch (error) {
          console.error('Failed to delete prompt from cloud:', error)
          fetchPrompts()
        }
      }
    },
    [api, isAuthenticated, fetchPrompts]
  )

  const reorderPrompt = useCallback(
    async (id: string, newOrder: number): Promise<void> => {
      setPrompts((prev: Prompt[]) => {
        const prompt = prev.find((p: Prompt) => p.id === id)
        if (!prompt) return prev

        const modelPrompts = prev
          .filter((p: Prompt) => p.modelId === prompt.modelId)
          .sort((a: Prompt, b: Prompt) => a.order - b.order)

        const oldIndex = modelPrompts.findIndex((p: Prompt) => p.id === id)
        const newIndex = Math.max(0, Math.min(newOrder, modelPrompts.length - 1))

        if (oldIndex === newIndex) return prev

        const reordered = [...modelPrompts]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)

        const orderMap = new Map(reordered.map((p: Prompt, i: number) => [p.id, i]))

        return prev.map((p: Prompt) =>
          p.modelId === prompt.modelId
            ? { ...p, order: orderMap.get(p.id) ?? p.order, updatedAt: Date.now() }
            : p
        )
      })
    },
    []
  )

  const getPromptById = useCallback(
    (id: string): Prompt | undefined => {
      return prompts.find((p) => p.id === id)
    },
    [prompts]
  )

  return {
    prompts,
    isLoaded,
    getPromptsForModel,
    getOnDeckPrompt,
    addPrompt,
    updatePrompt,
    updateStatus,
    deletePrompt,
    reorderPrompt,
    getPromptById,
  }
}
