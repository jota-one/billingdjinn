export const templates = {
  default: () => import('./default'),
  graphic: () => import('./graphic'),
} as const

export type TemplateName = keyof typeof templates
