import { Component, Suspense, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { lazyWithPreload } from './lazyWithPreload'

function Page() {
  return <h1>Pricing</h1>
}

describe('lazyWithPreload', () => {
  it('renders a preloaded component on the first pass, without the fallback', async () => {
    const Lazy = lazyWithPreload(() => Promise.resolve({ default: Page }))
    await Lazy.preload()

    render(
      <Suspense fallback={<p>Loading</p>}>
        <Lazy />
      </Suspense>,
    )

    // Synchronous query: a suspended first pass would show the fallback here instead.
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })

  it('retries the import on render after a failed preload', async () => {
    let calls = 0
    const Lazy = lazyWithPreload(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new Error('network')) : Promise.resolve({ default: Page })
    })
    await expect(Lazy.preload()).rejects.toThrow('network')

    render(
      <Suspense fallback={<p>Loading</p>}>
        <Lazy />
      </Suspense>,
    )

    // The failed preload is not cached: rendering asks for the module again and gets it.
    expect(await screen.findByRole('heading', { name: 'Pricing' })).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('lets an error boundary catch a module that never loads', async () => {
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false }
      static getDerivedStateFromError() {
        return { failed: true }
      }
      render() {
        return this.state.failed ? <p>Could not load</p> : this.props.children
      }
    }
    const Lazy = lazyWithPreload(() => Promise.reject(new Error('gone')))
    await expect(Lazy.preload()).rejects.toThrow('gone')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <Boundary>
        <Suspense fallback={<p>Loading</p>}>
          <Lazy />
        </Suspense>
      </Boundary>,
    )

    expect(await screen.findByText('Could not load')).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('still loads on demand when nothing preloaded it', async () => {
    const Lazy = lazyWithPreload(() => Promise.resolve({ default: Page }))

    render(
      <Suspense fallback={<p>Loading</p>}>
        <Lazy />
      </Suspense>,
    )

    expect(await screen.findByRole('heading', { name: 'Pricing' })).toBeInTheDocument()
  })
})
