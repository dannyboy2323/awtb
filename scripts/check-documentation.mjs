#!/usr/bin/env node

/**
 * Enforces inline API documentation coverage for every exported declaration.
 *
 * The checker uses the TypeScript parser instead of regular expressions so
 * multiline declarations and exported variable statements are counted
 * consistently. Generated code, tests, and vendored UI primitives are excluded.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const roots = ['app', 'components', 'db', 'emails', 'lib', 'sanity/lib']
const ignored = new Set(['components/ui'])

function collect(directory) {
  if (ignored.has(directory)) return []

  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) return collect(path)
    return /\.[cm]?[jt]sx?$/.test(name) && !name.endsWith('.d.ts') ? [path] : []
  })
}

function isExported(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
}

function hasDocComment(node, sourceFile) {
  const leading = sourceFile.text.slice(node.getFullStart(), node.getStart(sourceFile))
  return /\/\*\*[\s\S]*?\*\/\s*$/.test(leading)
}

const declarations = []

for (const path of roots.flatMap(collect)) {
  const source = readFileSync(path, 'utf8')
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const moduleDocumented = /^(?:\s*['"]use client['"];?\s*)?\/\*\*[\s\S]*?\*\//.test(source)
  const exportedStatements = sourceFile.statements.filter(
    (statement) => isExported(statement) && !ts.isExportDeclaration(statement)
  )

  for (const statement of exportedStatements) {
    const names = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((declaration) => declaration.name.getText())
      : [statement.name?.getText() ?? 'default']

    for (const name of names) {
      declarations.push({
        documented:
          hasDocComment(statement, sourceFile) ||
          (moduleDocumented &&
            (exportedStatements.length === 1 ||
              statement.modifiers?.some(
                (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
              ))),
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart()).line + 1,
        name,
        path: relative('.', path),
      })
    }
  }
}

const undocumented = declarations.filter(({ documented }) => !documented)
if (undocumented.length > 0) {
  for (const item of undocumented) {
    console.error(`${item.path}:${item.line} exported ${item.name} needs a /** ... */ comment`)
  }
  throw new Error(
    `Inline documentation coverage: ${declarations.length - undocumented.length}/${declarations.length}`
  )
}

console.log(`Inline documentation coverage: 100% (${declarations.length}/${declarations.length})`)
