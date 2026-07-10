// One-off generator for the PWA icon set. Re-run after changing the design:
//   node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'

// Lucide "swords" icon paths (24x24 viewBox) — same mark the NavBar brand uses.
const SWORDS = `
  <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
  <line x1="13" y1="19" x2="19" y2="13"/>
  <line x1="16" y1="16" x2="20" y2="20"/>
  <line x1="19" y1="21" x2="21" y2="19"/>
  <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 10"/>
  <line x1="5" y1="14" x2="9" y2="18"/>
  <line x1="7" y1="17" x2="4" y2="20"/>
  <line x1="3" y1="19" x2="5" y2="21"/>
`

// scale = fraction of the canvas the 24px mark occupies. Maskable icons need
// the mark inside the inner ~80% "safe zone" since platforms crop the edges.
function iconSvg(size, scale) {
  const mark = size * scale
  const offset = (size - mark) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#2a2a4a"/>
      <stop offset="55%" stop-color="#15152a"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <g transform="translate(${offset} ${offset}) scale(${mark / 24})"
     fill="none" stroke="#a5b0ff" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">${SWORDS}</g>
</svg>`
}

// ICO container with PNG-encoded entries (supported by all modern browsers).
async function buildIco(sizes, scale) {
  const pngs = await Promise.all(
    sizes.map(async (size) => ({
      size,
      buf: await sharp(Buffer.from(iconSvg(size, scale))).png().toBuffer(),
    }))
  )
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)
  const entries = []
  let offset = 6 + 16 * pngs.length
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 = 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1) // height
    e.writeUInt16LE(1, 4) // color planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    offset += buf.length
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)])
}

const targets = [
  { file: 'public/icon-192.png', size: 192, scale: 0.62 },
  { file: 'public/icon-512.png', size: 512, scale: 0.62 },
  { file: 'public/icon-maskable-192.png', size: 192, scale: 0.48 },
  { file: 'public/icon-maskable-512.png', size: 512, scale: 0.48 },
  { file: 'app/apple-icon.png', size: 180, scale: 0.62 },
]

await mkdir('public', { recursive: true })
for (const { file, size, scale } of targets) {
  await sharp(Buffer.from(iconSvg(size, scale))).png().toFile(file)
  console.log(`wrote ${file} (${size}x${size})`)
}

// Favicon: slightly larger mark so it stays legible at 16px.
await writeFile('app/favicon.ico', await buildIco([16, 32, 48], 0.78))
console.log('wrote app/favicon.ico (16/32/48)')
