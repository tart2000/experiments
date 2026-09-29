import type { Experiment } from './types'
import { browser } from './browser'
import { ransom } from './ransom'

export const experiments: Experiment[] = [ransom, browser]
export const byId = (id: string) => experiments.find((e) => e.id === id) ?? experiments[0]
