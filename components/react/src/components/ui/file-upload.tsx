'use client'
import { FileUpload, useFileUploadContext } from '@ark-ui/react/file-upload'
import { FileIcon, XIcon } from 'lucide-react'
import { type ComponentProps, forwardRef, useMemo } from 'react'
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
  defaultProps: { children: <XIcon /> },
})
export const ItemGroup = withContext(FileUpload.ItemGroup, 'itemGroup')
export const ItemName = withContext(FileUpload.ItemName, 'itemName')
export const ItemPreview = withContext(FileUpload.ItemPreview, 'itemPreview', {
  defaultProps: {
    children: <FileIcon />,
  },
})
export const ItemPreviewImage = withContext(FileUpload.ItemPreviewImage, 'itemPreviewImage')
export const ItemSizeText = withContext(FileUpload.ItemSizeText, 'itemSizeText')
export const Label = withContext(FileUpload.Label, 'label')
export const Trigger = withContext(FileUpload.Trigger, 'trigger')

export { FileUploadContext as Context } from '@ark-ui/react/file-upload'

interface ItemsBaseProps {
  showSize?: boolean | undefined
  clearable?: boolean | undefined
  files?: File[] | undefined
}

interface ItemsProps extends Omit<ItemProps, 'file'>, ItemsBaseProps {}

export const Items = (props: ItemsProps) => {
  const { showSize, clearable, files, ...rest } = props
  const fileUpload = useFileUploadContext()
  const acceptedFiles = files ?? fileUpload.acceptedFiles

  return acceptedFiles.map((file) => (
    <Item file={file} key={file.name} {...rest}>
      <ItemPreview />
      <Stack gap="0.5" flex="1">
        <ItemName />
        {showSize && <ItemSizeText />}
      </Stack>

      {clearable && <ItemDeleteTrigger />}
    </Item>
  ))
}

interface FileUploadListProps extends ItemsBaseProps {}

export const List = forwardRef<HTMLUListElement, FileUploadListProps>(
  function FileUploadList(props, ref) {
    const { showSize, clearable, files, ...rest } = props

    return (
      <ItemGroup ref={ref} {...rest}>
        <Items showSize={showSize} clearable={clearable} files={files} />
      </ItemGroup>
    )
  },
)

export interface FileTextProps extends HTMLStyledProps<'span'> {
  fallback?: string | undefined
}

export const FileText = forwardRef<HTMLSpanElement, FileTextProps>(
  function FileUploadFileText(props, ref) {
    const { fallback = 'Select file(s)', ...rest } = props

    const fileUpload = useFileUploadContext()

    const acceptedFiles = fileUpload.acceptedFiles

    const fileText = useMemo(() => {
      if (acceptedFiles.length === 1) {
        return acceptedFiles[0].name
      }
      if (acceptedFiles.length > 1) {
        return `${acceptedFiles.length} files`
      }
      return fallback
    }, [acceptedFiles, fallback])

    return (
      <Span
        ref={ref}
        data-placeholder={fileText === fallback ? '' : undefined}
        data-scope="file-upload"
        data-part="file-text"
        {...rest}
      >
        {fileText}
      </Span>
    )
  },
)
