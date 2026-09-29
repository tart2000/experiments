import type { Experiment } from './types'
import { ransom } from './ransom'

export const experiments: Experiment[] = [ransom]
export const byId = (id: string) => experiments.find((e) => e.id === id) ?? experiments[0]
