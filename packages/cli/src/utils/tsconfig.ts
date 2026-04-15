import path from 'node:path'
import * as p from '@clack/prompts'
import { Context, Effect, Layer, Schema } from 'effect'
import { parse } from 'tsconfck'
import { TSConfigInvalid, TSConfigNotFound } from './errors'
import { PandaConfig } from './panda-config'

const TSConfigSchema = Schema.Struct({
  compilerOptions: Schema.Struct({
    baseUrl: Schema.optional(Schema.String),
    paths: Schema.Record({
      key: Schema.String,
      value: Schema.mutable(Schema.Array(Schema.String)),
    }),
  }),
})

type TSConfigSchema = Schema.Schema.Type<typeof TSConfigSchema>

export interface TSConfig {
  aliasPrefix: string
  baseUrl: string
  paths: Record<string, string[]>
}

const getConfig = PandaConfig.pipe(
  Effect.flatMap((pandaConfig) =>
    Effect.tryPromise({
      try: () => parse(pandaConfig.path),
      catch: () => TSConfigNotFound(process.cwd()),
    }),
  ),
  Effect.flatMap((parsed) =>
    Schema.decodeUnknown(TSConfigSchema)(parsed.tsconfig).pipe(
      Effect.map((config) => ({ config, tsconfigFile: parsed.tsconfigFile })),
    ),
  ),
  Effect.flatMap(({ config, tsconfigFile }) => {
    const aliasPrefix = getTsConfigAliasPrefix(config)
    if (!aliasPrefix) return Effect.fail(TSConfigInvalid())

    return Effect.succeed({
      aliasPrefix,
      baseUrl: config.compilerOptions?.baseUrl ?? path.dirname(tsconfigFile),
      paths: config.compilerOptions?.paths || {},
    })
  }),
)

export const TSConfig = Context.GenericTag<TSConfig>('TSConfig')
const ConfigLayer = Layer.effect(TSConfig, getConfig)

export const withTSConfig = <A, R>(effect: Effect.Effect<A, never, R>) =>
  Effect.provide(effect, ConfigLayer).pipe(
    Effect.catchAll(({ message }) =>
      Effect.sync(() => {
        p.log.error(message)
        p.outro('Visit https://park-ui.com/docs/installation to learn how to get started.')
      }),
    ),
  )

const getTsConfigAliasPrefix = (tsConfig: TSConfigSchema): string | null => {
  const paths = tsConfig.compilerOptions.paths
  const commonPaths = ['./*', './src/*', './app/*', './resources/js/*']

  // Exclude the "*": ["./*"] catch-all used as a baseUrl replacement for bare imports (e.g. "styled-system"); it is not a user alias.
  const aliasEntries = Object.entries(paths).filter(
    ([alias]) => alias !== '*' && alias.endsWith('/*'),
  )

  for (const [alias, pathList] of aliasEntries) {
    if (pathList.some((p) => commonPaths.includes(p))) {
      return alias.replace(/\/\*$/, '')
    }
  }

  return aliasEntries[0]?.[0].replace(/\/\*$/, '') ?? null
}
