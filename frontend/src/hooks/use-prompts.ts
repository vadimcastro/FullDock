'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AIModel, Prompt, PromptStatus } from '@/lib/types'
import { useProtectedApi } from '@/lib/api/protected'

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const api = useProtectedApi()

  const fetchPrompts = useCallback(async () => {
    try {
      const data = await api.get<Prompt[]>('/api/v1/prompts/')
      setPrompts(data)
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
      setIsLoaded(true) // Set to true to avoid infinite loading state
    }
  }, [api])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

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
    async (modelId: AIModel, content: string, notes: string = ''): Promise<Prompt | undefined> => {
      const modelPrompts = prompts.filter((p) => p.modelId === modelId)
      const maxOrder = Math.max(0, ...modelPrompts.map((p) => p.order))
      const hasOnDeck = modelPrompts.some((p) => p.status === 'on-deck')

      const promptData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        content,
        notes,
        status: hasOnDeck ? 'queued' : 'on-deck',
        order: maxOrder + 1,
      }

      // Optimistic update
      const newPrompt: Prompt = {
        ...promptData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setPrompts((prev) => [...prev, newPrompt])

      try {
        const saved = await api.post<Prompt>('/api/v1/prompts/', promptData)
        return saved
      } catch (error) {
        console.error('Failed to add prompt:', error)
        // Rollback or handle error
        setPrompts((prev) => prev.filter(p => p.id !== newPrompt.id))
        return undefined
      }
    },
    [prompts, api]
  )

  const updatePrompt = useCallback(
    async (id: string, updates: Partial<Pick<Prompt, 'content' | 'notes' | 'linkedPromptId'>>): Promise<void> => {
      // Optimistic update
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        )
      )

      try {
        await api.fetchProtected(`/api/v1/prompts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
      } catch (error) {
        console.error('Failed to update prompt:', error)
        // Refresh from server to sync
        fetchPrompts()
      }
    },
    [api, fetchPrompts]
  )

  const updateStatus = useCallback(
    async (id: string, status: PromptStatus): Promise<void> => {
      const prompt = prompts.find((p) => p.id === id)
      if (!prompt) return

      // Optimistic update
      let updated = prompts.map((p) =>
        p.id === id ? { ...p, status, updatedAt: Date.now() } : p
      )

      // If marking complete, promote next queued to on-deck
      if (status === 'complete') {
        const nextQueued = updated
          .filter((p) => p.modelId === prompt.modelId && p.status === 'queued')
          .sort((a, b) => a.order - b.order)[0]

        if (nextQueued) {
          updated = updated.map((p) =>
            p.id === nextQueued.id ? { ...p, status: 'on-deck', updatedAt: Date.now() } : p
          )
          // Also sync the nextQueued promotion to backend
          api.fetchProtected(`/api/v1/prompts/${nextQueued.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'on-deck' }),
          })
        }
      }
      setPrompts(updated)

      try {
        await api.fetchProtected(`/api/v1/prompts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
      } catch (error) {
        console.error('Failed to update status:', error)
        fetchPrompts()
      }
    },
    [prompts, api, fetchPrompts]
  )

  const deletePrompt = useCallback(
    async (id: string): Promise<void> => {
      const prompt = prompts.find((p) => p.id === id)
      if (!prompt) return

      // Optimistic update
      const filtered = prompts.filter((p) => p.id !== id)
      setPrompts(filtered)

      try {
        await api.delete(`/api/v1/prompts/${id}`)
      } catch (error) {
        console.error('Failed to delete prompt:', error)
        fetchPrompts()
      }
    },
    [prompts, api, fetchPrompts]
  )

  const reorderPrompt = useCallback(
    async (id: string, newOrder: number): Promise<void> => {
      // For reorder, we might want a specialized endpoint, but for now we skip backend call
      // or implement it as a bulk update. Standard practice is to let local reorder happen
      // and maybe sync later if it's complex.
      // Keeping it local only for now to preserve complexity in frontend hook.
      setPrompts((prev) => {
        const prompt = prev.find((p) => p.id === id)
        if (!prompt) return prev

        const modelPrompts = prev
          .filter((p) => p.modelId === prompt.modelId)
          .sort((a, b) => a.order - b.order)

        const oldIndex = modelPrompts.findIndex((p) => p.id === id)
        const newIndex = Math.max(0, Math.min(newOrder, modelPrompts.length - 1))

        if (oldIndex === newIndex) return prev

        const reordered = [...modelPrompts]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)

        const orderMap = new Map(reordered.map((p, i) => [p.id, i]))

        return prev.map((p) =>
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
