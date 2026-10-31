import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDebounceScheduler } from '../../src/application/persistence/debounce-scheduler'

afterEach(() => {
  vi.useRealTimers()
})

describe('createDebounceScheduler', () => {
  it('runs only the latest task once the delay elapses', async () => {
    vi.useFakeTimers()
    const runs: string[] = []
    const scheduler = createDebounceScheduler(500)

    scheduler.schedule(() => {
      runs.push('first')
    })
    scheduler.schedule(() => {
      runs.push('second')
    })

    vi.advanceTimersByTime(499)
    expect(runs).toEqual([])

    vi.advanceTimersByTime(1)
    await Promise.resolve()
    expect(runs).toEqual(['second'])
  })

  it('flushes a pending task immediately and waits for it', async () => {
    vi.useFakeTimers()
    let finished = false
    const scheduler = createDebounceScheduler(500)

    scheduler.schedule(async () => {
      await Promise.resolve()
      finished = true
    })

    const flushing = scheduler.flush()
    expect(finished).toBe(false)
    await flushing
    expect(finished).toBe(true)

    vi.advanceTimersByTime(500)
    expect(finished).toBe(true)
  })

  it('drops a pending task when cancelled', () => {
    vi.useFakeTimers()
    const runs: string[] = []
    const scheduler = createDebounceScheduler(500)

    scheduler.schedule(() => {
      runs.push('cancelled')
    })
    scheduler.cancel()
    vi.advanceTimersByTime(1000)

    expect(runs).toEqual([])
  })
})
