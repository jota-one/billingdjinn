/**
 * Downloads Inter Regular + Bold TTF and builds a pdfmake-compatible VFS module.
 * Uses pdfmake's own build-vfs.js under the hood.
 *
 * Run once: node scripts/generate-pdf-fonts.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const fontsDir = join(root, 'node_modules/pdfmake/examples/fonts')
const vfsOut = join(root, 'node_modules/pdfmake/build/vfs_fonts.js')
const destTs = join(root, 'src/admin/composables/pdfFonts.ts')

const TTF_URLS = {
  'Inter-Regular.ttf':
    'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Regular.ttf',
  'Inter-Bold.ttf': 'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.ttf',
}

// 1. Download fonts into pdfmake's examples/fonts dir
mkdirSync(fontsDir, { recursive: true })

for (const [name, url] of Object.entries(TTF_URLS)) {
  const dest = join(fontsDir, name)
  console.log(`Downloading ${name}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed: ${url} → ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(dest, buf)
  console.log(`  → ${buf.length} bytes`)
}

// 2. Run pdfmake's build-vfs.js
console.log('\nBuilding VFS...')
execSync(`node ${join(root, 'node_modules/pdfmake/build-vfs.js')} "${fontsDir}"`, {
  cwd: join(root, 'node_modules/pdfmake'),
  stdio: 'inherit',
})

// 3. Parse generated vfs_fonts.js and re-export as ESM TypeScript
const raw = readFileSync(vfsOut, 'utf-8')
// The file contains: this.pdfMake = this.pdfMake || {}; this.pdfMake.vfs = {...}
const match = raw.match(/this\.pdfMake\.vfs\s*=\s*(\{[\s\S]+\})/)
if (!match) throw new Error('Could not parse vfs_fonts.js output')

const output = `// AUTO-GENERATED — run: node scripts/generate-pdf-fonts.mjs
// Inter font (SIL Open Font License) — https://rsms.me/inter/

export const vfs: Record<string, string> = ${match[1]}

export const fonts = {
  Inter: {
    normal: 'Inter-Regular.ttf',
    bold: 'Inter-Bold.ttf',
    italics: 'Inter-Regular.ttf',
    bolditalics: 'Inter-Bold.ttf',
  },
}
`

writeFileSync(destTs, output, 'utf-8')
console.log(`\n✓ Written to src/admin/composables/pdfFonts.ts`)
