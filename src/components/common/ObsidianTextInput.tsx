import { TextComponent } from 'obsidian'
import { useEffect, useRef, useState } from 'react'

import { useObsidianSetting } from './ObsidianSetting'

type ObsidianTextInputProps = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ObsidianTextInput({
  value,
  placeholder,
  onChange,
  disabled,
}: ObsidianTextInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setting } = useObsidianSetting()
  const [textComponent, setTextComponent] = useState<TextComponent | null>(null)

  useEffect(() => {
    if (setting) {
      let newTextComponent: TextComponent | null = null
      setting.addText((component) => {
        newTextComponent = component
      })
      setTextComponent(newTextComponent)

      return () => {
        newTextComponent?.inputEl.remove()
      }
    } else if (containerRef.current) {
      const newTextComponent = new TextComponent(containerRef.current)
      setTextComponent(newTextComponent)

      return () => {
        newTextComponent?.inputEl.remove()
      }
    }
  }, [setting])

  useEffect(() => {
    if (!textComponent) return

    textComponent.setValue(value)
    if (placeholder) textComponent.setPlaceholder(placeholder)
    textComponent.onChange(onChange)
    textComponent.inputEl.disabled = disabled ?? false
  }, [textComponent, value, onChange, placeholder, disabled])

  return <div ref={containerRef} />
}
