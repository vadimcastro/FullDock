'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AIModel, Prompt, PromptStatus } from '@/lib/types'

const STORAGE_KEY = 'on-deck-prompts'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function loadPrompts(): Prompt[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function savePrompts(prompts: Prompt[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setPrompts(loadPrompts())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      savePrompts(prompts)
    }
  }, [prompts, isLoaded])

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
    (modelId: AIModel, content: string, notes: string = ''): Prompt => {
      const modelPrompts = prompts.filter((p) => p.modelId === modelId)
      const maxOrder = Math.max(0, ...modelPrompts.map((p) => p.order))
      const hasOnDeck = modelPrompts.some((p) => p.status === 'on-deck')

      const newPrompt: Prompt = {
        id: generateId(),
        modelId,
        content,
        notes,
        status: hasOnDeck ? 'queued' : 'on-deck',
        order: maxOrder + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setPrompts((prev) => [...prev, newPrompt])
      return newPrompt
    },
    [prompts]
  )

  const updatePrompt = useCallback(
    (id: string, updates: Partial<Pick<Prompt, 'content' | 'notes' | 'linkedPromptId'>>): void => {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        )
      )
    },
    []
  )

  const updateStatus = useCallback(
    (id: string, status: PromptStatus): void => {
      setPrompts((prev) => {
        const prompt = prev.find((p) => p.id === id)
        if (!prompt) return prev

        let updated = prev.map((p) =>
          p.id === id ? { ...p, status, updatedAt: Date.now() } : p
        )

        // If marking complete, promote next queued to on-deck
        if (status === 'complete') {
          const modelPrompts = updated
            .filter((p) => p.modelId === prompt.modelId && p.status === 'queued')
            .sort((a, b) => a.order - b.order)

          if (modelPrompts.length > 0) {
            const nextId = modelPrompts[0].id
            updated = updated.map((p) =>
              p.id === nextId ? { ...p, status: 'on-deck', updatedAt: Date.now() } : p
            )
          }
        }

        return updated
      })
    },
    []
  )

  const deletePrompt = useCallback((id: string): void => {
    setPrompts((prev) => {
      const prompt = prev.find((p) => p.id === id)
      if (!prompt) return prev

      const filtered = prev.filter((p) => p.id !== id)

      // If deleting on-deck, promote next queued
      if (prompt.status === 'on-deck') {
        const modelPrompts = filtered
          .filter((p) => p.modelId === prompt.modelId && p.status === 'queued')
          .sort((a, b) => a.order - b.order)

        if (modelPrompts.length > 0) {
          const nextId = modelPrompts[0].id
          return filtered.map((p) =>
            p.id === nextId ? { ...p, status: 'on-deck', updatedAt: Date.now() } : p
          )
        }
      }

      return filtered
    })
  }, [])

  const reorderPrompt = useCallback((id: string, newOrder: number): void => {
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
  }, [])

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
