/**
 * Small helper to ping an HTTPS (or HTTP) URL periodically to keep the service "awake".
 * Usage:
 *   const stop = startHttpsPing('https://my-app.example.com/', 10 * 60 * 1000)
 *   // later to stop: stop()
 */
import https from 'https'
import http from 'http'
import { URL } from 'url'

export function startHttpsPing(target: string, intervalMs = 10 * 60 * 1000) {
  if (!target) throw new Error('target URL required')

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch (err) {
    throw new Error('Invalid URL: ' + target)
  }

  const client = parsed.protocol === 'https:' ? https : http

  const doPing = () => {
    const opts: any = {
      method: 'GET',
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      headers: { 'User-Agent': 'keep-alive-pinger' },
      timeout: 10000
    }

    const req = client.request(opts, (res: any) => {
      // Consume data to free the socket
      res.on('data', () => {})
      res.on('end', () => {
        console.log(`KEEP-ALIVE: ping ${target} -> ${res.statusCode}`)
      })
    })

    req.on('error', (err: any) => {
      console.warn('KEEP-ALIVE: ping error', err && err.message ? err.message : err)
    })

    req.on('timeout', () => {
      req.abort()
      console.warn('KEEP-ALIVE: ping timeout', target)
    })

    req.end()
  }

  // First immediate ping
  doPing()
  const id = setInterval(doPing, intervalMs)

  // Return a stopper
  return () => clearInterval(id)
}
