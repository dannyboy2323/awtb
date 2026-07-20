import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AboutPage, { metadata } from '@/app/about/page'

describe('AboutPage', () => {
  it('publishes concise page metadata', () => {
    expect(metadata).toMatchObject({
      title: 'About',
      description: 'A love letter from a father to his son.',
    })
  })

  it('renders Danny’s complete story with semantic headings and theme tokens', () => {
    const { container } = render(<AboutPage />)

    expect(
      screen.getByRole('heading', { name: 'Adventures with the Bull', level: 1 })
    ).toBeVisible()
    expect(screen.getByText('A love letter from a father to his son.')).toHaveClass(
      'text-muted-foreground'
    )
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(['The Bull', 'When I Went Away', 'How This Began', 'What This Is'])
    expect(screen.getByText(/I spent five years in federal prison/)).toBeVisible()
    expect(screen.getByText(/roughly a thousand of them/)).toBeVisible()
    expect(screen.getByText(/contraband, rooted Android phone/)).toBeVisible()
    expect(screen.getByText('Welcome to the adventures. The Bull goes first.')).toBeVisible()
    expect(container.firstChild).toHaveClass('dark', 'bg-background', 'text-foreground')
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(4)
  })
})
