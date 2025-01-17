import { useRef } from 'react'

import * as ReactPage from '../../state/react-page'
import { Props } from '../../prop-controllers'
import {
  Descriptor,
  MarginDescriptor,
  MarginPropControllerFormat,
  MarginValue,
  PaddingDescriptor,
  PaddingPropControllerFormat,
  PaddingValue,
  WidthPropControllerFormat,
  WidthDescriptor,
  WidthValue,
} from '../../prop-controllers/descriptors'
import {
  useBoxShadow,
  useBorder as useBorderData,
  useLinkPropControllerData,
  useCheckboxPropControllerData,
} from '../../components/hooks'
import type { ColorValue } from '../../components/utils/types'
import {
  useResponsiveBorder,
  useResponsiveBorderRadius,
  useResponsiveMargin,
  useResponsivePadding,
  useResponsiveShadow,
  useResponsiveWidth,
} from '../../components/utils/responsive-style'
import {
  CheckboxControlType,
  ColorControlType,
  ComboboxControlType,
  ImageControlType,
  LinkControlType,
  ListControlType,
  NumberControlType,
  SelectControlType,
  ShapeControlType,
  SlotControl,
  SlotControlType,
  StyleControlType,
  TextAreaControlType,
  TextInputControlType,
  RichTextControl,
  RichTextControlType,
  StyleControl,
  RichTextV2Control,
  RichTextV2ControlType,
  StyleV2ControlType,
  TypographyControlType,
} from '../../controls'
import { useFormattedStyle } from './controls/style'
import { ControlValue } from './controls/control'
import { RenderHook } from './components'
import { useSlot } from './controls/slot'
import { useStyle } from './use-style'
import { useRichText } from './controls/rich-text/rich-text'
import { useRichTextV2 } from './controls/rich-text-v2'
import { IconRadioGroupControlType } from '../../controls/icon-radio-group'
import { useStore } from './hooks/use-store'
import { useDocumentKey } from './hooks/use-document-key'
import { useSelector } from './hooks/use-selector'
import {
  Types as PropControllerTypes,
  getShadowsPropControllerDataResponsiveShadowsData,
  ShadowsPropControllerData,
  Shadows,
  ResponsiveValue,
  ResolveOptions,
  BorderPropControllerFormat,
  ResponsiveBorderData,
  BorderPropControllerData,
  getBorderPropControllerDataResponsiveBorderData,
  getBorderRadiusPropControllerDataResponsiveBorderRadiusData,
  BorderRadiusPropControllerData,
  BorderRadiusPropControllerFormat,
} from '@makeswift/prop-controllers'
import { useResponsiveLengthPropControllerData } from '../../components/hooks/useResponsiveLengthPropControllerData'
import { useNumberPropControllerData } from '../../components/hooks/useNumberPropControllerData'
import { useResponsiveColorPropControllerData } from '../../components/hooks/useResponsiveColorPropControllerData'

export type ResponsiveColor = ResponsiveValue<ColorValue>

function useWidthStyle(value: WidthValue | undefined, descriptor: WidthDescriptor): string {
  return useStyle(useResponsiveWidth(value, descriptor.options.defaultValue))
}

export type ResolveWidthControlValue<T extends Descriptor> = T extends WidthDescriptor
  ? undefined extends ResolveOptions<T['options']>['format']
    ? WidthValue | undefined
    : ResolveOptions<T['options']>['format'] extends typeof WidthPropControllerFormat.ClassName
    ? string
    : ResolveOptions<
        T['options']
      >['format'] extends typeof WidthPropControllerFormat.ResponsiveValue
    ? WidthValue | undefined
    : never
  : never

function usePaddingStyle(value: PaddingValue | undefined): string {
  return useStyle(useResponsivePadding(value))
}

export type ResolvePaddingControlValue<T extends Descriptor> = T extends PaddingDescriptor
  ? undefined extends ResolveOptions<T['options']>['format']
    ? PaddingValue | undefined
    : ResolveOptions<T['options']>['format'] extends typeof PaddingPropControllerFormat.ClassName
    ? string
    : ResolveOptions<
        T['options']
      >['format'] extends typeof PaddingPropControllerFormat.ResponsiveValue
    ? PaddingValue | undefined
    : never
  : never

function useMarginStyle(value: MarginValue | undefined): string {
  return useStyle(useResponsiveMargin(value))
}

export type ResolveMarginControlValue<T extends Descriptor> = T extends MarginDescriptor
  ? undefined extends ResolveOptions<T['options']>['format']
    ? MarginValue | undefined
    : ResolveOptions<T['options']>['format'] extends typeof MarginPropControllerFormat.ClassName
    ? string
    : ResolveOptions<
        T['options']
      >['format'] extends typeof MarginPropControllerFormat.ResponsiveValue
    ? MarginValue | undefined
    : never
  : never

export function useBorderRadiusStyle(data: BorderRadiusPropControllerData | undefined): string {
  const value = getBorderRadiusPropControllerDataResponsiveBorderRadiusData(data)

  return useStyle(useResponsiveBorderRadius(value))
}

export function useShadowsStyle(data: ShadowsPropControllerData | undefined): string {
  return useStyle(useResponsiveShadow(useBoxShadow(data) ?? undefined))
}

export function useBorderStyle(
  data: BorderPropControllerData | undefined,
): string | ResponsiveBorderData | undefined {
  const value = getBorderPropControllerDataResponsiveBorderData(data)
  const borderData = useBorderData(value)

  return useStyle(useResponsiveBorder(borderData ?? undefined))
}

type PropsValueProps = {
  element: ReactPage.ElementData
  children(props: Record<string, unknown>): JSX.Element
}

export function PropsValue({ element, children }: PropsValueProps): JSX.Element {
  const store = useStore()
  const propControllerDescriptorsRef = useRef(
    ReactPage.getComponentPropControllerDescriptors(store.getState(), element.type) ?? {},
  )
  const props = element.props as Record<string, any>
  const documentKey = useDocumentKey()

  const propControllers = useSelector(state => {
    if (documentKey == null) return null

    return ReactPage.getPropControllers(state, documentKey, element.key)
  })

  return Object.entries(propControllerDescriptorsRef.current).reduceRight(
    (renderFn, [propName, descriptor]) =>
      propsValue => {
        switch (descriptor.type) {
          case CheckboxControlType:
          case NumberControlType:
          case TextInputControlType:
          case TextAreaControlType:
          case SelectControlType:
          case ColorControlType:
          case IconRadioGroupControlType:
          case ImageControlType:
          case ComboboxControlType:
          case ShapeControlType:
          case ListControlType:
          case LinkControlType:
          case StyleV2ControlType:
          case TypographyControlType:
            return (
              <ControlValue
                definition={descriptor}
                data={props[propName]}
                control={propControllers?.[propName]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </ControlValue>
            )

          case StyleControlType: {
            const control = (propControllers?.[propName] ?? null) as StyleControl | null

            return (
              <RenderHook
                key={descriptor.type}
                hook={useFormattedStyle}
                parameters={[props[propName], descriptor, control]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )
          }

          case RichTextControlType: {
            const control = (propControllers?.[propName] ?? null) as RichTextControl | null

            return (
              <RenderHook
                key={descriptor.type}
                hook={useRichText}
                parameters={[props[propName], control]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )
          }

          case RichTextV2ControlType: {
            const control = (propControllers?.[propName] ?? null) as RichTextV2Control | null

            return (
              <RenderHook
                key={descriptor.type}
                hook={useRichTextV2}
                parameters={[props[propName], descriptor, control]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )
          }

          case SlotControlType: {
            const control = (propControllers?.[propName] ?? null) as SlotControl | null

            return (
              <RenderHook
                key={descriptor.type}
                hook={useSlot}
                parameters={[props[propName], control]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )
          }

          case Props.Types.Width:
            switch (descriptor.options.format) {
              case WidthPropControllerFormat.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={useWidthStyle}
                    parameters={[props[propName], descriptor]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              default:
                return renderFn({ ...propsValue, [propName]: props[propName] })
            }

          case Props.Types.Padding:
            switch (descriptor.options.format) {
              case PaddingPropControllerFormat.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={usePaddingStyle}
                    parameters={[props[propName]]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              default:
                return renderFn({ ...propsValue, [propName]: props[propName] })
            }

          case Props.Types.Margin:
            switch (descriptor.options.format) {
              case MarginPropControllerFormat.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={useMarginStyle}
                    parameters={[props[propName]]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              default:
                return renderFn({ ...propsValue, [propName]: props[propName] })
            }

          case PropControllerTypes.BorderRadius:
            switch (descriptor.options.format) {
              case BorderRadiusPropControllerFormat.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={useBorderRadiusStyle}
                    parameters={[props[propName]]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              default:
                return renderFn({ ...propsValue, [propName]: props[propName] })
            }

          case PropControllerTypes.Number:
            return (
              <RenderHook
                key={descriptor.type}
                hook={useNumberPropControllerData}
                parameters={[props[propName]]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )

          case PropControllerTypes.ResponsiveLength:
            return (
              <RenderHook
                key={descriptor.type}
                hook={useResponsiveLengthPropControllerData}
                parameters={[props[propName]]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )

          case PropControllerTypes.Shadows:
            switch (descriptor.options.format) {
              case Shadows.Format.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={useShadowsStyle}
                    parameters={[props[propName]]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              case Shadows.Format.ResponsiveValue:
              default:
                return renderFn({
                  ...propsValue,
                  [propName]: getShadowsPropControllerDataResponsiveShadowsData(props[propName]),
                })
            }

          case PropControllerTypes.Border:
            switch (descriptor.options.format) {
              case BorderPropControllerFormat.ClassName:
                return (
                  <RenderHook
                    key={descriptor.type}
                    hook={useBorderStyle}
                    parameters={[props[propName]]}
                  >
                    {value => renderFn({ ...propsValue, [propName]: value })}
                  </RenderHook>
                )

              default:
                return renderFn({ ...propsValue, [propName]: props[propName] })
            }

          case PropControllerTypes.ResponsiveColor:
            return (
              <RenderHook
                key={descriptor.type}
                hook={useResponsiveColorPropControllerData}
                parameters={[props[propName]]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )

          case PropControllerTypes.Link:
            return (
              <RenderHook
                key={descriptor.type}
                hook={useLinkPropControllerData}
                parameters={[props[propName]]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )

          case PropControllerTypes.Checkbox:
            return (
              <RenderHook
                key={descriptor.type}
                hook={useCheckboxPropControllerData}
                parameters={[props[propName]]}
              >
                {value => renderFn({ ...propsValue, [propName]: value })}
              </RenderHook>
            )

          default:
            return renderFn({ ...propsValue, [propName]: props[propName] })
        }
      },
    children,
  )({})
}
