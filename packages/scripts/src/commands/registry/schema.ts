import { z } from 'zod'

const registryItemType = z.enum([
  'registry:block',
  'registry:color',
  'registry:component',
  'registry:recipe',
  'registry:theme',
  'registry:ui',
])

export type RegistryItemType = z.infer<typeof registryItemType>

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
)

const registryFileBase = z.object({
  type: registryItemType,
  path: z.string(),
  content: z.string().optional(),
  exports: z.string().optional(),
  imports: z.string().optional(),
})

export const registryFilePartial = registryFileBase
export const registryFile = registryFileBase.required({ content: true })

export type RegistryFilePartial = z.infer<typeof registryFilePartial>
export type RegistryFile = z.infer<typeof registryFile>

const registryItemImport = z.object({
  type: registryItemType,
  name: z.string(),
  from: z.string(),
})

export type RegistryItemImport = z.infer<typeof registryItemImport>

const registryItemBase = z.object({
  $schema: z.url().optional(),
  name: z.string(),
  type: registryItemType,
  categories: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  description: z.string().optional(),
  devDependencies: z.array(z.string()).optional(),
  panda: z
    .object({
      extension: jsonValue.optional(),
      imports: z.array(registryItemImport).optional(),
    })
    .optional(),
  registryDependencies: z.array(z.string()).optional(),
})

export const registryItemPartial = registryItemBase.extend({
  files: z.array(registryFilePartial).optional(),
})

export const registryItem = registryItemBase.extend({
  files: z.array(registryFile).optional(),
})

export type RegistryItemPartial = z.infer<typeof registryItemPartial>
export type RegistryItem = z.infer<typeof registryItem>

const registryIndexItem = z.object({
  name: z.string(),
  type: registryItemType,
})
export type RegistryIndexItem = z.infer<typeof registryIndexItem>

export const registryIndexList = z.array(registryIndexItem)

const registry = z.object({
  $schema: z.url(),
  name: z.string(),
  homepage: z.url(),
  items: z.array(z.lazy(() => registryItemPartial)),
})
export type Registry = z.infer<typeof registry>
