import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readFile, readJson, writeFile } from 'fs-extra'
import {
  type Registry,
  type RegistryIndexItem,
  type RegistryItem,
  registryIndexList,
} from './schema'

type Framework = 'react' | 'solid'

const replaceFrameworkImports = (content: string, framework: Framework): string => {
  return content.replace(/@ark-ui\/react\/anatomy/g, `@ark-ui/${framework}/anatomy`)
}

const resolveFilePath = (filePath: string): string => {
  return join(process.cwd(), filePath)
}

const readFileContent = async (filePath: string): Promise<string> => {
  try {
    return await readFile(resolveFilePath(filePath), 'utf-8')
  } catch (error) {
    console.error(`⚠️  Error reading file ${filePath}:`, error)
    return ''
  }
}

// Several registries publish into the same directory (components/<framework> and
// packages/preset), so index.json has to be the union of all of them. Reading it
// upfront - before the loop below starts writing into distDir - and upserting by
// name keeps every run idempotent regardless of the order the registries are built in.
const readIndex = async (indexPath: string): Promise<RegistryIndexItem[]> => {
  try {
    return registryIndexList.parse(await readJson(indexPath))
  } catch {
    return []
  }
}

const upsertIndexItem = (index: RegistryIndexItem[], item: RegistryIndexItem) => {
  const existing = index.findIndex((entry) => entry.name === item.name)
  if (existing === -1) index.push(item)
  else index[existing] = item
}

// Entries contributed by another registry have to survive, but entries whose file is
// gone must not. "index" is reserved for the manifest itself, so no item can own it.
const isPublished = (distDir: string, item: RegistryIndexItem) =>
  item.name !== 'index' && existsSync(join(distDir, `${item.name}.json`))

const transformPath = (filePath: string, type: string): string => {
  if (type === 'registry:ui') {
    return filePath.replace(/^src\/components\/ui\//, '')
  }

  if (type === 'registry:recipe') {
    return filePath.replace(/^.*\/recipes\//, '')
  }

  if (type === 'registry:color' || type === 'registry:theme') {
    return filePath.replace(/^src\/theme\//, '')
  }

  return filePath
}

export const generateRegistryFiles = async (options?: { outputDir?: string }) => {
  const registry: Registry = await readJson('./registry.json')
  const baseDir = join(process.cwd(), '../../website/public/registry')
  const distDir = options?.outputDir ? join(baseDir, options.outputDir) : baseDir
  await mkdir(distDir, { recursive: true })

  // Determine framework from outputDir (e.g., 'react' or 'solid')
  const framework: Framework = (options?.outputDir as Framework) || 'react'

  let successCount = 0
  let errorCount = 0
  const indexPath = join(distDir, 'index.json')
  const indexItems = await readIndex(indexPath)

  for (const item of registry.items) {
    try {
      const filesWithContent = await Promise.all(
        (item.files ?? []).map(async (file) => {
          let content = await readFileContent(file.path)
          // Replace @ark-ui/react/anatomy with framework-specific import for recipe files
          if (file.type === 'registry:recipe') {
            content = replaceFrameworkImports(content, framework)
          }
          return {
            content,
            type: file.type,
            path: transformPath(file.path, file.type),
            exports: file.exports,
            imports: file.imports,
          }
        }),
      )

      const output: RegistryItem = {
        $schema: 'https://park-ui.com/schema/registry-item.json',
        name: item.name,
        type: item.type,
        dependencies: item.dependencies,
        files: filesWithContent,
        ...(item.panda && { panda: item.panda }),
        ...(item.registryDependencies?.length && {
          registryDependencies: item.registryDependencies,
        }),
      }

      const outputPath = join(distDir, `${item.name}.json`)
      await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8')

      upsertIndexItem(indexItems, { name: item.name, type: item.type })

      successCount++
    } catch (error) {
      console.error(`❌ ${item.name}:`, error)
      errorCount++
    }
  }

  const index = indexItems.filter((item) => isPublished(distDir, item))
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf-8')

  console.log(`✨ Generated ${successCount} registry files`)
  console.log(`✨ Merged ${successCount} entries into index.json (${index.length} total)`)
  if (errorCount > 0) console.log(`❌ Failed: ${errorCount}`)
}

// Run the script only if this file is executed directly
if (import.meta.main) {
  await generateRegistryFiles()
}
