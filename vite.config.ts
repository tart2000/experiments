import path from 'node:path'
import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Persistance JSON temporaire : GET/PUT /api/state/:id  <->  data/:id.json
function jsonState(): Plugin {
  const dir = path.resolve(__dirname, 'data')
  return {
    name: 'json-state',
    configureServer(server) {
      server.middlewares.use('/api/state', (req, res) => {
        const id = (req.url ?? '').replace(/^\//, '').split('?')[0]
        if (!/^[\w-]+$/.test(id)) {
          res.statusCode = 400
          return res.end('bad id')
        }
        const file = path.join(dir, `${id}.json`)
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          return res.end(fs.existsSync(file) ? fs.readFileSync(file) : '{}')
        }
        if (req.method === 'PUT') {
          const chunks: Buffer[] = []
          req.on('data', (c) => chunks.push(c))
          req.on('end', () => {
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(file, Buffer.concat(chunks))
            res.statusCode = 204
            res.end()
          })
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react(), tailwindcss(), jsonState()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
