'use client'
import { ark } from '@ark-ui/react/factory'
import { Switch, useSwitchContext } from '@ark-ui/react/switch'
import { type ComponentProps, forwardRef, type ReactNode } from 'react'
import { createStyleContext, styled } from 'styled-system/jsx'
import { switchRecipe } from 'styled-system/recipes'

const { withProvider, withContext } = createStyleContext(switchRecipe)

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider(Switch.Root, 'root')
export const RootProvider = withProvider(Switch.RootProvider, 'root')
export const Label = withContext(Switch.Label, 'label')
export const Thumb = withContext(Switch.Thumb, 'thumb')
export const HiddenInput = Switch.HiddenInput

export const Control = withContext(Switch.Control, 'control', {
  defaultProps: { children: <Thumb /> },
})

export { SwitchContext as Context } from '@ark-ui/react/switch'

interface IndicatorProps extends ComponentProps<typeof StyledIndicator> {
  fallback?: ReactNode | undefined
}

const StyledIndicator = withContext(ark.span, 'indicator')
export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(
  function Indicator(props, ref) {
    const { fallback, children, ...rest } = props
    const api = useSwitchContext()
    return (
      <StyledIndicator ref={ref} data-checked={api.checked ? '' : undefined} {...rest}>
        {api.checked ? children : fallback}
      </StyledIndicator>
    )
  },
)

interface ThumbIndicatorProps extends ComponentProps<typeof StyledThumbIndicator> {
  fallback?: React.ReactNode | undefined
}

const StyledThumbIndicator = styled(ark.span)
export const ThumbIndicator = forwardRef<HTMLSpanElement, ThumbIndicatorProps>(
  function SwitchThumbIndicator(props, ref) {
    const { fallback, children, ...rest } = props
    const api = useSwitchContext()
    return (
      <StyledThumbIndicator ref={ref} data-checked={api.checked ? '' : undefined} {...rest}>
        {api.checked ? children : fallback}
      </StyledThumbIndicator>
    )
  },
)
