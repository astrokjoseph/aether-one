'use client'

import { useSyncExternalStore } from 'react'

type State = {
  finish: number
  introDone: boolean
  reserveOpen: boolean
  activeSection: string
}

const initial: State = {
  finish: 0,
  introDone: false,
  reserveOpen: false,
  activeSection: 'overview',
}

let state: State = initial
const listeners = new Set<() => void>()

export const getState = () => state

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  )
}
