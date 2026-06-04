/**
 * Genera vercel.json con proxy /api → backend (mismo origen en el navegador).
 * En Vercel (frontend): VITE_API_BACKEND_URL=https://tu-backend.vercel.app
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function normalizeBackendBase(raw) {
  const fallback = 'https://agro-app-git-main-martin-arbelaez-s-projects.vercel.app'
  let base = (raw || fallback).trim()
  if (!base) base = fallback
  base = base.replace(/\/$/, '')
  if (base.endsWith('/api')) base = base.slice(0, -4)
  return base
}

const backendBase = normalizeBackendBase(process.env.VITE_API_BACKEND_URL)

const vercelConfig = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${backendBase}/api/:path*`,
    },
    {
      source: '/((?!api/).*)',
      destination: '/index.html',
    },
  ],
}

fs.writeFileSync(
  path.join(root, 'vercel.json'),
  `${JSON.stringify(vercelConfig, null, 2)}\n`,
)

console.log(`vercel.json → proxy /api → ${backendBase}/api/*`)
