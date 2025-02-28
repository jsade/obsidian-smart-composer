import { SliderComponent } from 'obsidian'
import { useEffect, useRef, useState } from 'react'

import { useObsidianSetting } from './ObsidianSetting'

export type ObsidianSliderProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function ObsidianSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
}: ObsidianSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setting } = useObsidianSetting()
  const [sliderComponent, setSliderComponent] =
    useState<SliderComponent | null>(null)

  useEffect(() => {
    if (setting) {
      let newSliderComponent: SliderComponent | null = null
      setting.addSlider((component) => {
        newSliderComponent = component
          .setLimits(min, max, step)
          .setValue(value)
        
        if (disabled) {
          newSliderComponent.sliderEl.toggleAttribute('disabled', true)
        }
      })
      setSliderComponent(newSliderComponent)

      return () => {
        newSliderComponent?.sliderEl.remove()
      }
    } else if (containerRef.current) {
      const newSliderComponent = new SliderComponent(containerRef.current)
        .setLimits(min, max, step)
        .setValue(value)
      
      if (disabled) {
        newSliderComponent.sliderEl.toggleAttribute('disabled', true)
      }
      
      setSliderComponent(newSliderComponent)

      return () => {
        newSliderComponent?.sliderEl.remove()
      }
    }
  }, [setting, min, max, step, disabled])

  useEffect(() => {
    if (!sliderComponent) return

    sliderComponent.setValue(value)
    sliderComponent.onChange(onChange)
    
    // Handle disabled state
    sliderComponent.sliderEl.toggleAttribute('disabled', disabled)
  }, [sliderComponent, value, onChange, disabled])

  return <div ref={containerRef} />
} 