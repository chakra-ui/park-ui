import { parse } from 'node:path'
import fg from 'fast-glob'
import { readFile, writeFile } from 'fs-extra'
import type { Registry, RegistryItemPartial } from './schema'

type Framework = 'react' | 'solid'

const toKebabCase = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const replaceFrameworkInDependencies = (deps: string[], framework: Framework): string[] => {
  return deps.map((dep) => dep.replace('@ark-ui/react', `@ark-ui/${framework}`))
}

const extractDependencies = (sourceCode: string) => {
  const importRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g
  const dependencies = new Set<string>()

  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
  for (let match: RegExpExecArray | null; (match = importRegex.exec(sourceCode)) !== null; ) {
    const importPath = match[1]
    if (importPath && !importPath.startsWith('.') && !importPath.startsWith('styled-system')) {
      dependencies.add(importPath.split('/').slice(0, 2).join('/'))
    }
  }

  return Array.from(dependencies)
}

const extractRecipeDependencies = (sourceCode: string) => {
  const recipeImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]styled-system\/recipes['"]/g
  const recipes = new Set<string>()

  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
  for (let match: RegExpExecArray | null; (match = recipeImportRegex.exec(sourceCode)) !== null; ) {
    const imports = match[1]?.split(',').map((item) => item.trim()) || []

    for (const importItem of imports) {
      if (importItem.startsWith('type ')) continue

      const importName = importItem.trim().replace(/Recipe$/, '')
      if (importName) {
        recipes.add(`${toKebabCase(importName)}-recipe`)
      }
    }
  }

  return Array.from(recipes)
}

const extractRegistryDependencies = (sourceCode: string, componentName: string) => {
  const relativeImportRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]\.\/([\w-]+)['"]/g
  const dependencies = new Set<string>()

  for (
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
    (match = relativeImportRegex.exec(sourceCode)) !== null;
  ) {
    const importedComponent = match[1]
    if (importedComponent && importedComponent !== componentName) {
      dependencies.add(importedComponent)
    }
  }

  for (const recipe of extractRecipeDependencies(sourceCode)) {
    dependencies.add(recipe)
  }

  return Array.from(dependencies).sort()
}

const extractRecipeImport = async (recipeName: string): Promise<string | undefined> => {
  const indexPath = '../../packages/preset/src/recipes/index.ts'

  try {
    const indexContent = (await readFile(indexPath, 'utf-8')) as string
    const lines = indexContent.split('\n')

    // Look for import statement matching this recipe
    for (const line of lines) {
      if (line.includes(`from './${recipeName}'`)) {
        return line.trim()
      }
    }
  } catch {
    // Index file not found or couldn't be read
  }

  return undefined
}

const generateRecipeItems = async (
  recipeNames: Set<string>,
  framework: Framework,
): Promise<RegistryItemPartial[]> => {
  console.log('\n🔍 Scanning recipe files...')
  const recipeItems: RegistryItemPartial[] = []

  for (const recipeName of recipeNames) {
    const kebabName = toKebabCase(recipeName.replace(/-recipe$/, ''))
    const recipePath = `../../packages/preset/src/recipes/${kebabName}.ts`
    const registryRecipeName = `${kebabName}-recipe`

    try {
      const content = (await readFile(recipePath, 'utf-8')) as string
      const deps = extractDependencies(content)
      const dependencies = replaceFrameworkInDependencies(
        ['@pandacss/dev', ...deps.filter((d) => d !== '@pandacss/dev')],
        framework,
      )

      const recipeDepRegex = /import\s+\{[^}]*\}\s+from\s+['"]\.\/([\w-]+)['"]/g
      const recipeDeps: string[] = []

      // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
      for (let match: RegExpExecArray | null; (match = recipeDepRegex.exec(content)) !== null; ) {
        recipeDeps.push(`${match[1]}-recipe`)
      }

      const recipeImport = await extractRecipeImport(kebabName)

      const recipeItem: RegistryItemPartial = {
        name: registryRecipeName,
        type: 'registry:recipe',
        dependencies,
        files: [
          {
            path: recipePath,
            type: 'registry:recipe',
            ...(recipeImport && { imports: recipeImport }),
          },
        ],
        ...(recipeDeps.length > 0 && { registryDependencies: recipeDeps.sort() }),
      }

      recipeItems.push(recipeItem)
      console.log(`✅ Processed recipe: ${registryRecipeName}`)
    } catch {
      console.log(`⚠️  Could not find recipe file: ${recipePath}`)
    }
  }

  return recipeItems
}

const getRegistryType = (filePath: string) => {
  if (filePath.includes('src/theme/colors')) return 'registry:color'
  if (filePath.includes('src/components/ui')) return 'registry:ui'
  if (filePath.includes('src/theme')) return 'registry:theme'
  return 'registry:ui' // default fallback
}

const extractExportStatement = async (componentName: string, pattern: string) => {
  // Find the index.ts file in the same directory
  const directory = pattern.substring(0, pattern.lastIndexOf('/'))
  const indexPath = `${directory}/index.ts`

  try {
    const indexContent = (await readFile(indexPath, 'utf-8')) as string
    const lines = indexContent.split('\n')

    // Look for export statement matching this component
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line?.includes(`from './${componentName}'`)) {
        // Check if this is a multi-line export (starts with a closing brace)
        if (line.trim().startsWith('}')) {
          // Walk backwards to find the opening export statement
          let startIndex = i
          while (
            startIndex > 0 &&
            lines[startIndex] &&
            !lines[startIndex]?.trim().startsWith('export')
          ) {
            startIndex--
          }
          // Combine all lines from start to current line
          return lines.slice(startIndex, i + 1).join('\n')
        }
        // Single line export
        return line.trim()
      }
    }
  } catch {
    // Index file not found or couldn't be read
  }

  return undefined
}

export const generateRegistry = async (options: { name: string; pattern?: string }) => {
  const pattern = options.pattern || 'src/components/ui/*.tsx'
  console.log(`🔍 Scanning files matching: ${pattern}`)

  // Extract framework from registry name (e.g., '@park-ui/solid' -> 'solid')
  const framework: Framework = options.name.includes('solid') ? 'solid' : 'react'

  const files = await fg(pattern, {
    // index.tsx is a barrel file, and an item named "index" would publish over index.json
    ignore: ['**/*.test.tsx', '**/*.spec.tsx', '**/index.ts', '**/index.tsx'],
  })

  const items: RegistryItemPartial[] = []
  const allRecipes = new Set<string>()

  for (const filePath of files) {
    const componentName = parse(filePath).name
    const content = (await readFile(filePath, 'utf-8')) as string
    const dependencies = extractDependencies(content)
    const registryDependencies = extractRegistryDependencies(content, componentName)
    const registryType = getRegistryType(filePath)
    const exportStatement = await extractExportStatement(componentName, pattern)

    for (const recipe of extractRecipeDependencies(content)) {
      allRecipes.add(recipe)
    }

    const item: RegistryItemPartial = {
      name: componentName,
      type: registryType,
      dependencies: dependencies.length > 0 ? dependencies : [`@ark-ui/${framework}`],
      files: [
        {
          path: filePath,
          type: registryType,
          ...(exportStatement && { exports: exportStatement }),
        },
      ],
      ...(registryDependencies.length > 0 && { registryDependencies }),
      ...(registryType === 'registry:color' && {
        panda: {
          imports: [
            { type: 'registry:color', name: componentName, from: `colors/${componentName}` },
          ],
          extension: {
            theme: {
              extend: {
                semanticTokens: {
                  colors: {
                    [['neutral', 'mauve', 'slate', 'sage', 'olive', 'sand'].includes(componentName)
                      ? 'gray'
                      : componentName]: `$ref:${componentName}`,
                  },
                },
              },
            },
          },
        },
      }),
    }

    items.push(item)
    console.log(`✅ Processed: ${componentName}`)
  }

  const recipeItems = await generateRecipeItems(allRecipes, framework)
  const allItems = [...items, ...recipeItems].sort((a, b) => a.name.localeCompare(b.name))

  const registry: Registry = {
    $schema: 'https://park-ui.com/schema/registry.json',
    name: options.name,
    homepage: 'https://park-ui.com',
    items: allItems,
  }

  const outputPath = './registry.json'
  await writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf-8')

  console.log(
    `\n✨ Generated registry.json with ${items.length} components and ${recipeItems.length} recipes`,
  )
  console.log(`📝 Output: ${outputPath}`)
}
