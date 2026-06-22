import { join } from 'node:path'
import { Effect, Match, pipe } from 'effect'
// @ts-expect-error
import { outputFile } from 'fs-extra/esm'
import type { RegistryItem } from '../schema'
import { Config } from './config'
import { FileError } from './errors'
import { updateIndexFile } from './index-file'
import { updatePandaConfig } from './panda-config'
import { updateRecipeIndex } from './recipes'

export const install = ({ panda, files = [] }: RegistryItem) =>
  Config.pipe(
    Effect.flatMap(({ resolvedPaths }) =>
      Effect.all([
        Effect.forEach(files, (file) =>
          pipe(
            Effect.tryPromise({
              try: () =>
                outputFile(
                  Match.value(file).pipe(
                    Match.when({ type: 'registry:block' }, ({ path }) =>
                      join(resolvedPaths.components, path),
                    ),
                    Match.when({ type: 'registry:color' }, ({ path }) =>
                      join(resolvedPaths.theme, path),
                    ),
                    Match.when({ type: 'registry:component' }, ({ path }) =>
                      join(resolvedPaths.components, path),
                    ),
                    Match.when({ type: 'registry:recipe' }, ({ path }) =>
                      join(resolvedPaths.recipes, path),
                    ),
                    Match.when({ type: 'registry:theme' }, ({ path }) =>
                      join(resolvedPaths.theme, path),
                    ),
                    Match.when({ type: 'registry:ui' }, ({ path }) => join(resolvedPaths.ui, path)),
                    Match.exhaustive,
                  ),
                  file.content,
                ),
              catch: () => FileError(file.path),
            }),
            Effect.tap(() => {
              if (file.type === 'registry:ui') {
                return updateIndexFile({
                  path: join(resolvedPaths.ui, 'index.ts'),
                  exportStatement: file.exports,
                })
              }
              if (file.type === 'registry:recipe' && file.imports) {
                return updateRecipeIndex(join(resolvedPaths.recipes, 'index.ts'), {
                  type: file.content.includes('defineSlotRecipe') ? 'slotRecipe' : 'recipe',
                  imports: file.imports,
                })
              }
            }),
          ),
        ),
        updatePandaConfig(panda),
      ]),
    ),
  )
