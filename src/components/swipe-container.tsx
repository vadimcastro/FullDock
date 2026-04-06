'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SwipeContainerProps {
  children: React.ReactNode[]
  currentIndex: number
  onSwipe: (direction: 'left' | 'right') => void
  className?: string
}

export function SwipeContainer({
  children,
  currentIndex,
  onSwipe,
  className,
}: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<boolean | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
    setTouchStartY(e.targetTouches[0].clientY)
    setIsHorizontalSwipe(null)
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null || touchStartY === null) return
      
      const currentX = e.targetTouches[0].clientX
      const currentY = e.targetTouches[0].clientY
      const diffX = Math.abs(currentX - touchStartX)
      const diffY = Math.abs(currentY - touchStartY)
      
      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe === null && (diffX > 10 || diffY > 10)) {
        setIsHorizontalSwipe(diffX > diffY)
      }
      
      // Only track horizontal swipes
      if (isHorizontalSwipe === true) {
        setTouchEndX(currentX)
        const diff = currentX - touchStartX
        // Limit drag to half screen width
        const maxDrag = (containerRef.current?.offsetWidth || 300) / 2
        setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, diff)))
        setIsDragging(true)
      }
    },
    [touchStartX, touchStartY, isHorizontalSwipe]
  )

  const onTouchEnd = useCallback(() => {
    if (!touchStartX || !touchEndX || !isHorizontalSwipe) {
      setIsDragging(false)
      setDragOffset(0)
      setIsHorizontalSwipe(null)
      return
    }

    const distance = touchStartX - touchEndX
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < children.length - 1) {
      onSwipe('left')
    } else if (isRightSwipe && currentIndex > 0) {
      onSwipe('right')
    }

    setIsDragging(false)
    setDragOffset(0)
    setTouchStartX(null)
    setTouchStartY(null)
    setTouchEndX(null)
    setIsHorizontalSwipe(null)
  }, [touchStartX, touchEndX, isHorizontalSwipe, currentIndex, children.length, onSwipe])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-pan-y h-full', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={cn(
          'flex transition-transform h-full',
          !isDragging && 'duration-300 ease-out'
        )}
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${isDragging ? dragOffset : 0}px))`,
        }}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0 h-full overflow-hidden">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
