import packageRoot from 'app-root-path'
import fs from 'fs'
import https from 'https'
import net from 'net'
import { join } from 'path'
import serveStatic from 'serve-static'

import config from './appconfig'

const serve = serveStatic('../server/upload/')

let server: https.Server = null!
const options = {
  key: fs.readFileSync(join(packageRoot.path, 'certs/key.pem')),
  cert: fs.readFileSync(join(packageRoot.path, 'certs/cert.pem'))
}

const createTestFileServer = (port: number, isServerRunning: boolean) => {
  if (isServerRunning) return

  server = https.createServer(options, (req, res) => {
    serve(req, res, null!)
  })
  server.listen(port)
}

export const StartTestFileServer = () => {
  const port = config.server.localStorageProviderPort
  isPortTaken(port, createTestFileServer)
}

const isPortTaken = (port, fn) => {
  const tester = net
    .createServer()
    .once('error', (err) => {
      if (err.name === 'EADDRINUSE') return fn(port, true)
    })
    .once('listening', () => {
      tester
        .once('close', () => {
          fn(port, false)
        })
        .close()
    })
    .listen(port)
}
