#!/usr/bin/env node

/**
 * Starts the production server and proves it can answer an HTTP request.
 *
 * This runs after `next build`; it exits non-zero on startup failure, timeout,
 * or a 5xx response and always terminates the child process.
 */

import { spawn } from 'node:child_process'

const port = process.env.START_VERIFY_PORT ?? '43123'
const origin = `http://127.0.0.1:${port}`
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port], {
  env: { ...process.env, PORT: port },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
child.stdout.on('data', (chunk) => {
  output += chunk
})
child.stderr.on('data', (chunk) => {
  output += chunk
})

const timeoutAt = Date.now() + 60_000

try {
  while (Date.now() < timeoutAt) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited with ${child.exitCode}\n${output}`)
    }

    try {
      const response = await fetch(origin, { redirect: 'manual' })
      if (response.status >= 500) {
        throw new Error(`Production server returned HTTP ${response.status}\n${output}`)
      }
      console.log(`Runtime verification passed: GET / returned HTTP ${response.status}`)
      process.exitCode = 0
      break
    } catch (error) {
      if (error instanceof Error && error.message.includes('returned HTTP')) throw error
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  if (Date.now() >= timeoutAt) {
    throw new Error(`Timed out waiting for ${origin}\n${output}`)
  }
} finally {
  child.kill('SIGTERM')
}
