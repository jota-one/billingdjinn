export const templates = {
  default: () => import('./default'),
  graphic: () => import('./graphic'),
  'qr-default': () => import('./qr-default'),
  'qr-graphic': () => import('./qr-graphic'),
} as const

export type TemplateName = keyof typeof templates
