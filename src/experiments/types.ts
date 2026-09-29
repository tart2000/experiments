import type { ComponentType, MutableRefObject } from 'react'

export interface ExportResult {
  blob: Blob
  filename: string
}
export type ExportFn = () => Promise<ExportResult>

export interface Experiment<P = any> {
  id: string
  title: string
  /** Image carrée affichée sur la page d'accueil. */
  thumbnail: string
  defaultParams: P
  /** Appelé à chaque chargement de page, sur les params restaurés depuis le JSON. */
  onLoad?: (saved: P) => P
  Controls: ComponentType<{ params: P; set: (patch: Partial<P>) => void }>
  /** Le Preview doit enregistrer sa fonction d'export dans exportRef. */
  Preview: ComponentType<{ params: P; set: (patch: Partial<P>) => void; exportRef: MutableRefObject<ExportFn | null> }>
}
