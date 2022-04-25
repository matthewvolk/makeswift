import { useMemo, useRef } from 'react'

import { useStore } from '.'
import * as ReactPage from '../../state/react-page'
import { Props } from '../../prop-controllers'
import {
  Descriptor,
  Device,
  ResolveOptions,
  ResponsiveColorValue,
  ResponsiveValue,
  WidthControlValueFormats,
  WidthDescriptor,
  WidthValue,
} from '../../prop-controllers/descriptors'
import { css } from '@emotion/css'
import { useColor } from '../../components'
import type { ColorValue } from '../../components/utils/types'
import { responsiveWidth } from '../../components/utils/responsive-style'
import { StyleControlType } from '../../controls'
import { useFormattedStyle } from './controls/style'

export type ResponsiveColor = ResponsiveValue<ColorValue>

function useDeviceMode(): Device {
  return 'desktop'
}

function useWidth(
  value: WidthValue | undefined,
  descriptor: WidthDescriptor,
  props: Record<string, unknown>,
): string | WidthValue | undefined {
  const deviceMode = useDeviceMode()
  const options = useMemo(
    () =>
      typeof descriptor.options === 'function'
        ? descriptor.options(props, deviceMode)
        : descriptor.options,
    [props, deviceMode],
  )

  return useMemo(
    () =>
      options.format === WidthControlValueFormats.ClassName
        ? css(responsiveWidth(value, options.defaultValue))
        : value,
    [value, options.defaultValue, options.format],
  )
}

function useResponsiveColor(value: ResponsiveColorValue): ResponsiveColor | null | undefined {
  return useColor(value)
}

export function useProps(element: ReactPage.ElementData): Record<string, unknown> {
  const store = useStore()
  const propControllerDescriptorsRef = useRef(
    ReactPage.getComponentPropControllerDescriptors(store.getState(), element.type) ?? {},
  )
  const props = element.props as Record<string, any>

  return Object.fromEntries(
    Object.entries(propControllerDescriptorsRef.current).map(([propName, descriptor]) => {
      switch (descriptor.type) {
        case Props.Types.ResponsiveColor: {
          const color = useResponsiveColor(props[propName])

          return [propName, color]
        }

        case Props.Types.Width:
          return [propName, useWidth(props[propName], descriptor, props)]

        case StyleControlType:
          return [propName, useFormattedStyle(props[propName], descriptor)]

        default:
          return [propName, props[propName]]
      }
    }),
  )
}

export type ResolveWidthControlValue<T extends Descriptor> = T extends WidthDescriptor
  ? undefined extends ResolveOptions<T['options']>['format']
    ? WidthValue | undefined
    : ResolveOptions<T['options']>['format'] extends typeof WidthControlValueFormats.ClassName
    ? string
    : ResolveOptions<T['options']>['format'] extends typeof WidthControlValueFormats.ResponsiveValue
    ? WidthValue | undefined
    : never
  : never