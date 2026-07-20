#!/usr/bin/env node

/**
 * Fail-closed environment-file validation for local commits and CI.
 *
 * Local mode validates that every key documented in `.env.example` exists with
 * a non-empty value in `.env.local`. CI mode validates the example file itself
 * without requiring repository secrets to be exposed to pull requests.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ciMode = process.argv.includes('--example')
const templatePath = resolve('.env.example')
const targetPath = ciMode ? templatePath : resolve(process.env.ENV_FILE ?? '.env.local')
const envSource = readFileSync(resolve('lib/env.ts'), 'utf8')

function parseEnv(path) {
  const entries = new Map()
  const duplicates = new Set()

  for (const [index, rawLine] of readFileSync(path, 'utf8').split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separator = line.indexOf('=')
    if (separator < 1) {
      throw new Error(`${path}:${index + 1} is not a valid KEY=value entry`)
    }

    const key = line.slice(0, separator).trim()
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
    if (entries.has(key)) duplicates.add(key)
    entries.set(key, value)
  }

  if (duplicates.size > 0) {
    throw new Error(`${path} contains duplicate keys: ${[...duplicates].sort().join(', ')}`)
  }

  return entries
}

const template = parseEnv(templatePath)
const target = parseEnv(targetPath)
const requiredKeys = new Set(
  [...envSource.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)]
    .map((match) => match[1])
    .filter((key) => !['CI', 'NODE_ENV', 'SKIP_ENV_VALIDATION'].includes(key))
)
const undocumented = [...requiredKeys].filter((key) => !template.has(key))
const missing = [...requiredKeys].filter((key) => !target.has(key))
const empty = ciMode ? [] : [...requiredKeys].filter((key) => target.get(key)?.length === 0)

if (undocumented.length > 0 || missing.length > 0 || empty.length > 0) {
  const problems = [
    undocumented.length > 0 ? `undocumented: ${undocumented.sort().join(', ')}` : '',
    missing.length > 0 ? `missing: ${missing.sort().join(', ')}` : '',
    empty.length > 0 ? `empty: ${empty.sort().join(', ')}` : '',
  ].filter(Boolean)
  throw new Error(`Environment validation failed for ${targetPath} (${problems.join('; ')})`)
}

console.log(
  `Environment coverage: 100% (${requiredKeys.size}/${requiredKeys.size} required runtime keys documented and ${ciMode ? 'declared' : 'non-empty'})`
)
