'use client'
import type { Assign } from '@ark-ui/react'
import { ark } from '@ark-ui/react/factory'
import { Select, type SelectRootProps, useSelectItemContext } from '@ark-ui/react/select'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { forwardRef, type RefAttributes } from 'react'
import { createStyleContext } from 'styled-system/jsx'
import { type SelectVariantProps, select } from 'styled-system/recipes'
import type { HTMLStyledProps } from 'styled-system/types'

const { withProvider, withContext } = createStyleContext(select)

type StyleProps = SelectVariantProps & HTMLStyledProps<'div'>

export type RootProps<T> = Assign<SelectRootProps<T>, StyleProps> & RefAttributes<HTMLDivElement>

export const Root = withProvider(Select.Root, 'root') as Select.RootComponent<StyleProps>

export const ClearTrigger = withContext(Select.ClearTrigger, 'clearTrigger')
export const Content = withContext(Select.Content, 'content')
export const Control = withContext(Select.Control, 'control')
export const IndicatorGroup = withContext(ark.div, 'indicatorGroup')
export const Item = withContext(Select.Item, 'item')
export const ItemGroup = withContext(Select.ItemGroup, 'itemGroup')
export const ItemGroupLabel = withContext(Select.ItemGroupLabel, 'itemGroupLabel')
export const ItemText = withContext(Select.ItemText, 'itemText')
export const Label = withContext(Select.Label, 'label')
export const List = withContext(Select.List, 'list')
export const Positioner = withContext(Select.Positioner, 'positioner')
export const Trigger = withContext(Select.Trigger, 'trigger')
export const ValueText = withContext(Select.ValueText, 'valueText')
export const Indicator = withContext(Select.Indicator, 'indicator', {
  defaultProps: { children: <ChevronsUpDownIcon /> },
})
export const HiddenSelect = Select.HiddenSelect

export {
  SelectContext as Context,
  SelectItemContext as ItemContext,
  type SelectValueChangeDetails as ValueChangeDetails,
} from '@ark-ui/react/select'

const StyledItemIndicator = withContext(Select.ItemIndicator, 'itemIndicator')

export const ItemIndicator = forwardRef<HTMLDivElement, HTMLStyledProps<'div'>>(
  function ItemIndicator(props, ref) {
    const item = useSelectItemContext()

    return item.selected ? (
      <StyledItemIndicator ref={ref} {...props}>
        <CheckIcon />
      </StyledItemIndicator>
    ) : (
      <svg aria-hidden="true" focusable="false" />
    )
  },
)
