import { ToggleComponent } from 'obsidian'
import { useEffect, useRef, useState } from 'react'

import { useObsidianSetting } from './ObsidianSetting'

export type ObsidianToggleProps = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function ObsidianToggle({
  value,
  onChange,
  disabled = false,
}: ObsidianToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setting } = useObsidianSetting()
  const [toggleComponent, setToggleComponent] =
    useState<ToggleComponent | null>(null)

  useEffect(() => {
    if (setting) {
      let newToggleComponent: ToggleComponent | null = null
      setting.addToggle((component) => {
        newToggleComponent = component

        if (disabled) {
          newToggleComponent.toggleEl.toggleAttribute('disabled', true)
        }
      })
      setToggleComponent(newToggleComponent)

      return () => {
        newToggleComponent?.toggleEl.remove()
      }
    } else if (containerRef.current) {
      const newToggleComponent = new ToggleComponent(containerRef.current)

      if (disabled) {
        newToggleComponent.toggleEl.toggleAttribute('disabled', true)
      }

      setToggleComponent(newToggleComponent)

      return () => {
        newToggleComponent?.toggleEl.remove()
      }
    }
  }, [setting, disabled])

  useEffect(() => {
    if (!toggleComponent) return

    toggleComponent.setValue(value)
    toggleComponent.onChange(onChange)

    // Handle disabled state
    toggleComponent.toggleEl.toggleAttribute('disabled', disabled)
  }, [toggleComponent, value, onChange, disabled])

  return <div ref={containerRef} />
}
