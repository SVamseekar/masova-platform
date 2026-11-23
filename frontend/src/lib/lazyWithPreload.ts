/* eslint-disable @typescript-eslint/no-explicit-any -- same constraint React.lazy itself uses */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type Module<T> = { default: T }

export type PreloadableComponent<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  /** Loads the module ahead of the first render. */
  preload: () => Promise<Module<T>>
}

/**
 * React.lazy with a preload step. Once preloaded, the component renders on its first pass
 * instead of suspending, so a page that arrived prerendered is replaced by the same page,
 * never by the Suspense fallback.
 *
 * React.lazy reads a module synchronously when the thenable it gets calls back at once,
 * which is what the preloaded branch hands it.
 */
export function lazyWithPreload<T extends ComponentType<any>>(factory: () => Promise<Module<T>>): PreloadableComponent<T> {
  let loaded: Module<T> | undefined
  const preload = () => factory().then((module) => (loaded = module))
  const component = lazy<T>(() => {
    if (!loaded) return preload()
    const module = loaded
    const ready = {
      then: (onFulfilled?: (value: Module<T>) => unknown) => {
        onFulfilled?.(module)
        return ready
      },
    }
    return ready as unknown as Promise<Module<T>>
  })
  return Object.assign(component, { preload })
}
