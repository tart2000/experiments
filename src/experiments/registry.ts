import type { Experiment } from './types'
import { browser } from './browser'
import { carousel } from './carousel'
import { ransom } from './ransom'

export const experiments: Experiment[] = [ransom, browser, carousel]
export const byId = (id: string) => experiments.find((e) => e.id === id) ?? experiments[0]
