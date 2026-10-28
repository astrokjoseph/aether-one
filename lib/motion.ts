'use client'

import { useMemo } from 'react'
import { transform, useTransform, type MotionValue } from 'framer-motion'

/**
 * Maps a scroll progress value through keyframes on the JS side. Unlike
 * array-form `useTransform`, this is never offloaded to a native scroll
 * timeline, so values clamp and hold reliably outside the input range.
 */
export function useRange<T extends string | number>(mv: MotionValue<number>, input: number[], output: T[]): MotionValue<T> {
  const key = JSON.stringify([input, output])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const map = useMemo(() => transform(input, output) as (v: number) => T, [key])
  return useTransform(mv, (v) => map(v))
}
