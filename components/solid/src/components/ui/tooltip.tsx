import type { PolymorphicProps } from '@ark-ui/solid'
import { Tooltip as ArkTooltip } from '@ark-ui/solid/tooltip'
import { type ComponentProps, type JSX, Show, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'
import { createStyleContext } from 'styled-system/jsx'
import { tooltip } from 'styled-system/recipes'

const { withRootProvider, withContext } = createStyleContext(tooltip)

type RootProps = ComponentProps<typeof Root>
type ContentProps = ComponentProps<typeof Content>
const Root = withRootProvider(ArkTooltip.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
})
const Arrow = withContext(ArkTooltip.Arrow, 'arrow')
const ArrowTip = withContext(ArkTooltip.ArrowTip, 'arrowTip')
const Content = withContext(ArkTooltip.Content, 'content')
const Positioner = withContext(ArkTooltip.Positioner, 'positioner')
const Trigger = withContext(ArkTooltip.Trigger, 'trigger')

export { TooltipContext as Context } from '@ark-ui/solid/tooltip'

type TriggerRenderProp = PolymorphicProps<'button'>['asChild']

export interface TooltipProps extends Omit<RootProps, 'content' | 'children'> {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: HTMLElement | undefined
  children: TriggerRenderProp | JSX.Element | undefined
  content: JSX.Element | string
  contentProps?: ContentProps
  disabled?: boolean
}

export const Tooltip = (props: TooltipProps) => {
  const [local, rootProps] = splitProps(props, [
    'showArrow',
    'children',
    'disabled',
    'portalled',
    'content',
    'contentProps',
    'portalRef',
  ])

  const portalled = () => local.portalled ?? true

  const asRenderProp = () => (typeof local.children === 'function' ? local.children : false)

  return (
    <Show when={!local.disabled} fallback={local.children as JSX.Element}>
      <Root {...rootProps}>
        <Show when={asRenderProp()} fallback={<Trigger>{local.children as JSX.Element}</Trigger>}>
          {(renderFn) => <Trigger asChild={renderFn()} />}
        </Show>

        <Show
          when={portalled()}
          fallback={
            <Positioner>
              <Content {...local.contentProps}>
                <Show when={local.showArrow}>
                  <Arrow>
                    <ArrowTip />
                  </Arrow>
                </Show>
                {local.content}
              </Content>
            </Positioner>
          }
        >
          <Portal mount={local.portalRef}>
            <Positioner>
              <Content {...local.contentProps}>
                <Show when={local.showArrow}>
                  <Arrow>
                    <ArrowTip />
                  </Arrow>
                </Show>
                {local.content}
              </Content>
            </Positioner>
          </Portal>
        </Show>
      </Root>
    </Show>
  )
}
