#!/usr/bin/env node

/**
 * Verifies that every production interaction has semantic analytics metadata.
 *
 * PostHog autocapture remains enabled as a safety net; this gate ensures each
 * explicit link, anchor, form, and button also emits a stable product event.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const roots = ['app', 'components/public']
const ignoredPrefixes = ['app/dev/', 'components/ui/']
const interactiveTags = new Set(['button', 'a', 'form', 'Link'])
const manualActions = [
  {
    marker: 'analyticsEvents.draftModeDisabled',
    path: 'app/components/DraftModeToast.tsx',
  },
  {
    marker: 'analyticsEvents.sanityCorsManagementOpened',
    path: 'app/client-utils.ts',
  },
]

function collect(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) return collect(path)
    return path.endsWith('.tsx') ? [path] : []
  })
}

const interactions = []
for (const path of roots.flatMap(collect)) {
  const normalized = relative('.', path)
  if (ignoredPrefixes.some((prefix) => normalized.startsWith(prefix))) continue

  const source = readFileSync(path, 'utf8')
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile)
      if (interactiveTags.has(tag)) {
        interactions.push({
          covered: node.attributes.properties.some(
            (attribute) =>
              ts.isJsxAttribute(attribute) &&
              attribute.name.getText(sourceFile) === 'data-analytics-event'
          ),
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          path: normalized,
          tag,
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

for (const action of manualActions) {
  interactions.push({
    covered: readFileSync(action.path, 'utf8').includes(action.marker),
    line: 1,
    path: action.path,
    tag: 'configured action',
  })
}
const allUncovered = interactions.filter(({ covered }) => !covered)
if (allUncovered.length > 0) {
  for (const item of allUncovered) {
    console.error(`${item.path}:${item.line} <${item.tag}> needs data-analytics-event`)
  }
  throw new Error(
    `Semantic action coverage: ${interactions.length - allUncovered.length}/${interactions.length}`
  )
}

console.log(`Semantic action coverage: 100% (${interactions.length}/${interactions.length})`)
