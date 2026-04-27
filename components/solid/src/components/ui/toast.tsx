import { Toaster as ArkToaster, createToaster, Toast, useToastContext } from '@ark-ui/solid/toast'
import { CheckCircleIcon, CircleAlertIcon, CircleXIcon } from 'lucide-solid'
import { Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { createStyleContext, Stack, styled } from 'styled-system/jsx'
import { toast } from 'styled-system/recipes'
import { CloseButton } from './close-button'
import { Icon, type IconProps } from './icon'
import { Spinner } from './spinner'

const { withProvider, withContext } = createStyleContext(toast)

const Root = withProvider(Toast.Root, 'root')
const Title = withContext(Toast.Title, 'title')
const Description = withContext(Toast.Description, 'description')
const ActionTrigger = withContext(Toast.ActionTrigger, 'actionTrigger')
const CloseTrigger = withContext(Toast.CloseTrigger, 'closeTrigger')
const StyledToaster = styled(ArkToaster)

const iconMap: Record<string, any> = {
  warning: CircleAlertIcon,
  success: CheckCircleIcon,
  error: CircleXIcon,
}

const Indicator = (props: IconProps) => {
  const toast = useToastContext()

  const StatusIcon = () => iconMap[toast().type]

  return (
    <Show when={StatusIcon()}>
      {(Icon_) => (
        <Icon data-type={toast().type} asChild={Icon_()} {...props} />
      )}
    </Show>
  )
}

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
  overlap: true,
  max: 5,
})

export const Toaster = () => {
  return (
    <Portal>
      <StyledToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Root>
            <Show when={toast().type === 'loading'} fallback={<Indicator />}>
              <Spinner color="colorPalette.plain.fg" />
            </Show>

            <Stack gap="3" alignItems="start">
              <Stack gap="1">
                <Show when={toast().title}>
                  <Title>{toast().title}</Title>
                </Show>
                <Show when={toast().description}>
                  <Description>{toast().description}</Description>
                </Show>
              </Stack>
              <Show when={toast().action}>
                {(action) => <ActionTrigger>{action().label}</ActionTrigger>}
              </Show>
            </Stack>
            <Show when={toast().closable}>
              <CloseTrigger>
                <CloseButton size="sm" />
              </CloseTrigger>
            </Show>
          </Root>
        )}
      </StyledToaster>
    </Portal>
  )
}
