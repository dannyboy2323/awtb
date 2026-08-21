import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import rootPackage from '../../package.json'
import studioPackage from '../../sanity/package.json'
import installedSanityPackage from 'sanity/package.json'

const studioCliSource = readFileSync('sanity/sanity.cli.ts', 'utf8')

/**
 * Guards the embedded Studio against the Portable Text upload regression fixed
 * in Sanity 6.9.2. Older Studio builds close an open block-object dialog when
 * an upload begins, aborting the request and leaving an empty panelImage block.
 */
describe('Sanity Studio dependency contract', () => {
  it('uses the fixed Sanity release in both workspace manifests and installation', () => {
    expect(rootPackage.dependencies.sanity).toBe('6.10.1')
    expect(studioPackage.dependencies.sanity).toBe('6.10.1')
    expect(installedSanityPackage.version).toBe('6.10.1')
  })

  it('keeps the embedded Studio integration and Vision plugin compatible', () => {
    expect(rootPackage.dependencies['next-sanity']).toBe('13.3.3')
    expect(rootPackage.dependencies['@sanity/client']).toBe('7.26.2')
    expect(studioPackage.dependencies['@sanity/vision']).toBe('6.10.1')
    expect(rootPackage.dependencies.react).toBe('19.2.8')
    expect(rootPackage.dependencies['react-dom']).toBe('19.2.8')
    expect(studioPackage.dependencies.react).toBe('19.2.8')
    expect(studioPackage.dependencies['react-dom']).toBe('19.2.8')
  })

  it('allows Sanity 6 schema extraction to refresh the generated schema', () => {
    expect(rootPackage.scripts.typegen).toContain('schema extract --force')
    expect(studioPackage.scripts['sanity:typegen']).toContain('schema extract --force')
  })

  it('deploys the embedded Studio from its verified dependency version', () => {
    expect(studioCliSource).toContain('deployment: { autoUpdates: false }')
  })
})
