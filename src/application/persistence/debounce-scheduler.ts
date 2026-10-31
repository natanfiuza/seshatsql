export interface DebounceScheduler {
  /** Replaces the pending task; only the latest state is written. */
  schedule: (task: () => void | Promise<void>) => void
  /** Runs the pending task immediately and waits for it. */
  flush: () => Promise<void>
  cancel: () => void
}

/**
 * Small debounce used by the renderer for tab state. It is in the application
 * layer so the 500 ms contract is testable without a component.
 */
export function createDebounceScheduler(delayMs: number): DebounceScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: (() => void | Promise<void>) | null = null

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function takePending(): (() => void | Promise<void>) | null {
    const task = pending
    pending = null
    return task
  }

  async function run(task: (() => void | Promise<void>) | null): Promise<void> {
    if (task !== null) {
      await task()
    }
  }

  function schedule(task: () => void | Promise<void>): void {
    pending = task
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      void run(takePending())
    }, delayMs)
  }

  async function flush(): Promise<void> {
    clearTimer()
    await run(takePending())
  }

  function cancel(): void {
    clearTimer()
    pending = null
  }

  return { schedule, flush, cancel }
}
