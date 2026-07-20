#!/usr/bin/env node

/**
 * Enforces complete coverage of the declared browser-journey inventory.
 *
 * The manifest is the reviewed product-behavior denominator. A journey cannot
 * be marked covered unless its exact Playwright test title exists in its spec.
 */

import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('tests/e2e/coverage.json', 'utf8'))
const missing = manifest.journeys.filter(({ spec, test }) => {
  const source = readFileSync(spec, 'utf8')
  return !source.includes(`test('${test}'`) && !source.includes(`test("${test}"`)
})

if (missing.length > 0) {
  for (const journey of missing) {
    console.error(`${journey.id}: missing "${journey.test}" in ${journey.spec}`)
  }
  throw new Error(
    `E2E journey coverage: ${manifest.journeys.length - missing.length}/${manifest.journeys.length}`
  )
}

console.log(`E2E journey coverage: 100% (${manifest.journeys.length}/${manifest.journeys.length})`)
