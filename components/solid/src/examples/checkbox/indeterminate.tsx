import { createSignal, For } from 'solid-js'

import { Stack } from 'styled-system/jsx'
import { Checkbox } from '@/components/ui'

export const App = () => {
  const initialValues = [
    { label: 'Monday', checked: false, value: 'monday' },
    { label: 'Tuesday', checked: false, value: 'tuesday' },
    { label: 'Wednesday', checked: false, value: 'wednesday' },
    { label: 'Thursday', checked: false, value: 'thursday' },
  ]
  const [values, setValues] = createSignal(initialValues)

  const allChecked = values().every((value) => value.checked)
  const indeterminate = values().some((value) => value.checked) && !allChecked

  return (
    <Stack gap="4" alignItems="start">
      <Checkbox.Root
        checked={indeterminate ? 'indeterminate' : allChecked}
        onCheckedChange={(e) => {
          setValues((current) => current.map((value) => ({ ...value, checked: !!e.checked })))
        }}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>Weekdays</Checkbox.Label>
      </Checkbox.Root>
      <For each={values()}>
        {(item, index) => (
          <Checkbox.Root
            ms="6"
            checked={item.checked}
            onCheckedChange={(e) =>
              setValues((current) => {
                const newValues = [...current]
                const target = newValues[index()]
                if (!target) return newValues
                newValues[index()] = { ...target, checked: !!e.checked }
                return newValues
              })
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label> {item.label}</Checkbox.Label>
          </Checkbox.Root>
        )}
      </For>
    </Stack>
  )
}
