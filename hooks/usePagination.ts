'use client'

/**
 * usePagination
 *
 * Automatically splits a flat array of Portable Text blocks into pages
 * using real DOM measurement. Each page contains exactly the blocks that
 * fit within `pageContentHeight` pixels without clipping.
 *
 * How it works:
 *  1. All blocks are rendered as individual children inside a hidden
 *     measurement container (`measureRef`). The container has the same
 *     width and font/spacing CSS as a real landscape page.
 *  2. After the first paint, each child's `offsetHeight` is read.
 *  3. Blocks are packed into pages: when the accumulated height would
 *     exceed `pageContentHeight`, a new page is started.
 *  4. The result is re-computed on window resize (debounced 300ms).
 *
 * Safety guarantees:
 *  - Content is NEVER clipped: we only commit a block to a page if it fits.
 *  - A block taller than a full page gets its own page (single-block page).
 *  - Image blocks use Sanity asset metadata for pre-sizing so async image
 *    loading does not affect measurement accuracy.
 *
 * @param blocks           Flat array of Portable Text blocks from Sanity
 * @param pageContentHeight Target page content height in pixels
 * @param enabled           Pass false to skip pagination (portrait mode)
 *
 * @returns pages        Array of pages; each page is an array of blocks
 * @returns measureRef   Attach to the hidden measurement container <div>
 * @returns isReady      True once first pagination run is complete
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react'

/** Vertical gap between blocks in px — matches CSS margin-bottom on prose elements */
const BLOCK_MARGIN_PX = 12

/** Debounce window resize events to avoid excessive re-pagination */
const RESIZE_DEBOUNCE_MS = 300

/** Delay after mount before reading measurements (allows fonts/layout to settle) */
const MEASURE_DELAY_MS = 80

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PortableTextBlock = Record<string, any>

export interface UsePaginationResult {
  pages: PortableTextBlock[][]
  measureRef: RefObject<HTMLDivElement | null>
  isReady: boolean
}

export function usePagination(
  blocks: PortableTextBlock[] | null | undefined,
  pageContentHeight: number,
  enabled: boolean
): UsePaginationResult {
  const measureRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<PortableTextBlock[][]>([])
  const [isReady, setIsReady] = useState(false)

  const runPagination = useCallback(() => {
    if (!enabled || !blocks?.length || !measureRef.current) return

    const container = measureRef.current
    const children = Array.from(container.children) as HTMLElement[]

    // Guard: wait until all block elements are in the DOM
    if (children.length !== blocks.length) return

    const result: PortableTextBlock[][] = []
    let currentPage: PortableTextBlock[] = []
    let accumulated = 0

    blocks.forEach((block, i) => {
      const child = children[i]
      if (!child) return

      const blockH = child.offsetHeight + BLOCK_MARGIN_PX

      if (accumulated + blockH > pageContentHeight && currentPage.length > 0) {
        // This block would overflow — push current page, start a new one
        result.push(currentPage)
        currentPage = [block]
        accumulated = blockH
      } else {
        // Block fits — add to current page
        currentPage.push(block)
        accumulated += blockH
      }
    })

    // Push the final page
    if (currentPage.length > 0) {
      result.push(currentPage)
    }

    setPages(result)
    setIsReady(true)
  }, [blocks, pageContentHeight, enabled])

  // Run after first render (delayed to let layout settle)
  useEffect(() => {
    if (!enabled) {
      const id = requestAnimationFrame(() => {
        setPages([])
        setIsReady(false)
      })
      return () => cancelAnimationFrame(id)
    }

    const id = setTimeout(runPagination, MEASURE_DELAY_MS)
    return () => clearTimeout(id)
  }, [runPagination, enabled])

  // Re-paginate on window resize (debounced)
  useEffect(() => {
    if (!enabled) return

    let id: ReturnType<typeof setTimeout>

    const onResize = () => {
      setIsReady(false)
      clearTimeout(id)
      id = setTimeout(runPagination, RESIZE_DEBOUNCE_MS)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(id)
    }
  }, [runPagination, enabled])

  return { pages, measureRef, isReady }
}
