import { FileUpload, useFileUploadContext } from '@ark-ui/solid/file-upload'
import { FileIcon, XIcon } from 'lucide-solid'
import { type ComponentProps, createMemo, For, Show, splitProps } from 'solid-js'
import { createStyleContext, type HTMLStyledProps, Stack } from 'styled-system/jsx'
import { fileUpload } from 'styled-system/recipes'
import { Span } from './span'

const { withProvider, withContext } = createStyleContext(fileUpload)

export type RootProps = ComponentProps<typeof Root>
export type ItemProps = ComponentProps<typeof Item>

export const Root = withProvider(FileUpload.Root, 'root')
export const RootProvider = withProvider(FileUpload.RootProvider, 'root')
export const ClearTrigger = withContext(FileUpload.ClearTrigger, 'clearTrigger')
export const Dropzone = withContext(FileUpload.Dropzone, 'dropzone')
export const HiddenInput = FileUpload.HiddenInput
export const Item = withContext(FileUpload.Item, 'item')
export const ItemDeleteTrigger = withContext(FileUpload.ItemDeleteTrigger, 'itemDeleteTrigger', {
  defaultProps: () => ({ children: <XIcon /> }),
})
export const ItemGroup = withContext(FileUpload.ItemGroup, 'itemGroup')
export const ItemName = withContext(FileUpload.ItemName, 'itemName')
export const ItemPreview = withContext(FileUpload.ItemPreview, 'itemPreview', {
  defaultProps: () => ({ children: <FileIcon /> }),
})
export const ItemPreviewImage = withContext(FileUpload.ItemPreviewImage, 'itemPreviewImage')
export const ItemSizeText = withContext(FileUpload.ItemSizeText, 'itemSizeText')
export const Label = withContext(FileUpload.Label, 'label')
export const Trigger = withContext(FileUpload.Trigger, 'trigger')

export { FileUploadContext as Context } from '@ark-ui/solid/file-upload'

interface ItemsBaseProps {
  showSize?: boolean | undefined
  clearable?: boolean | undefined
  files?: File[] | undefined
}

interface ItemsProps extends Omit<ItemProps, 'file'>, ItemsBaseProps {}

export const Items = (props: ItemsProps) => {
  const [local, rest] = splitProps(props, ['showSize', 'clearable', 'files'])
  const fileUpload = useFileUploadContext()
  const acceptedFiles = () => local.files ?? fileUpload().acceptedFiles

  return (
    <For each={acceptedFiles()}>
      {(file) => (
        <Item file={file} {...rest}>
          <ItemPreview />
          <Stack gap="0.5" flex="1">
            <ItemName />
            <Show when={local.showSize}>
              <ItemSizeText />
            </Show>
          </Stack>

          <Show when={local.clearable}>
            <ItemDeleteTrigger />
          </Show>
        </Item>
      )}
    </For>
  )
}

interface FileUploadListProps extends ItemsBaseProps {}

export const List = (props: FileUploadListProps) => {
  const [local, rest] = splitProps(props, ['showSize', 'clearable', 'files'])

  return (
    <ItemGroup {...rest}>
      <Items showSize={local.showSize} clearable={local.clearable} files={local.files} />
    </ItemGroup>
  )
}

export interface FileTextProps extends HTMLStyledProps<'span'> {
  fallback?: string | undefined
}

export const FileText = (props: FileTextProps) => {
  const [local, rest] = splitProps(props, ['fallback'])
  const fallback = () => local.fallback ?? 'Select file(s)'

  const fileUpload = useFileUploadContext()
  const acceptedFiles = () => fileUpload().acceptedFiles

  const fileText = createMemo(() => {
    const files = acceptedFiles()
    if (files.length === 1) {
      return files[0].name
    }
    if (files.length > 1) {
      return `${files.length} files`
    }
    return fallback()
  })

  return (
    <Span
      data-placeholder={fileText() === fallback() ? '' : undefined}
      data-scope="file-upload"
      data-part="file-text"
      {...rest}
    >
      {fileText()}
    </Span>
  )
}
