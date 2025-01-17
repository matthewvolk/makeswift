import { CheckboxControlData, CheckboxControlDefinition } from './checkbox'
import { ColorControlData, ColorControlDefinition, ColorControlType, copyColorData } from './color'
import { ComboboxControlData, ComboboxControlDefinition } from './combobox'
import { ImageControlData, ImageControlDefinition, copyImageData, ImageControlType } from './image'
import { LinkControlData, LinkControlDefinition, copyLinkData, LinkControlType } from './link'
import {
  ListControlData,
  ListControlDefinition,
  copyListData,
  ListControlType,
  getListTranslatableData,
  mergeListTranslatedData,
  ListControlTranslationDto,
} from './list'
import { NumberControlData, NumberControlDefinition } from './number'
import { SelectControlData, SelectControlDefinition } from './select'
import {
  ShapeControlData,
  ShapeControlDefinition,
  copyShapeData,
  ShapeControlType,
  getShapeTranslatableData,
  mergeShapeTranslatedData,
  ShapeControlTranslationDto,
} from './shape'
import { TextAreaControlData, TextAreaControlDefinition, TextAreaControlType } from './text-area'
import {
  TextInputControlData,
  TextInputControlDefinition,
  TextInputControlType,
} from './text-input'
import { copyStyleData, StyleControlData, StyleControlDefinition, StyleControlType } from './style'
import {
  copySlotData,
  mergeSlotControlTranslatedData,
  mergeSlotData,
  SlotControlData,
  SlotControlDefinition,
  SlotControlType,
} from './slot'

import {
  Descriptor,
  GridValue,
  IndexSignatureHack,
  Types,
  mergeGridPropControllerTranslatedData,
} from '../prop-controllers/descriptors'
import { Types as PropControllerTypes } from '@makeswift/prop-controllers'
import { copy as propControllerCopy } from '../prop-controllers/copy'
import { CopyContext, Data, MergeContext, MergeTranslatableDataContext } from '../state/react-page'
import {
  RichTextControlData,
  RichTextControlDefinition,
  RichTextControlType,
  copyRichTextData,
  richTextDTOtoDAO,
} from './rich-text'
import { PropControllerDescriptor } from '../prop-controllers'

import { richTextV2DescendentsToData } from './rich-text-v2/dto'
import { copyRichTextV2Data } from './rich-text-v2/copy'
import {
  RichTextV2ControlData,
  RichTextV2ControlDefinition,
  RichTextV2ControlType,
  isRichTextV1Data,
} from './rich-text-v2/rich-text-v2'

import { StyleV2ControlData, StyleV2ControlDefinition } from './style-v2'
import { IconRadioGroupControlData, IconRadioGroupControlDefinition } from './icon-radio-group'
import { TypographyControlData, TypographyControlDefinition } from './typography'
import {
  RichTextV2ControlTranslationDto,
  getRichTextV2TranslatableData,
  mergeRichTextV2TranslatedData,
} from './rich-text-v2/translation'

export type ControlDefinition =
  | CheckboxControlDefinition
  | NumberControlDefinition
  | TextInputControlDefinition
  | TextAreaControlDefinition
  | SelectControlDefinition
  | ColorControlDefinition
  | IconRadioGroupControlDefinition
  | ImageControlDefinition
  | ComboboxControlDefinition
  | ShapeControlDefinition
  | ListControlDefinition<any>
  | LinkControlDefinition
  | SlotControlDefinition
  | ShapeControlDefinition
  | RichTextControlDefinition
  | RichTextV2ControlDefinition
  | StyleControlDefinition
  | StyleV2ControlDefinition
  | TypographyControlDefinition

export type ControlDefinitionData<T extends ControlDefinition> = T extends CheckboxControlDefinition
  ? CheckboxControlData
  : T extends NumberControlDefinition
  ? NumberControlData
  : T extends TextInputControlDefinition
  ? TextInputControlData
  : T extends TextAreaControlDefinition
  ? TextAreaControlData
  : T extends SelectControlDefinition
  ? SelectControlData<T>
  : T extends ColorControlDefinition
  ? ColorControlData
  : T extends IconRadioGroupControlDefinition
  ? IconRadioGroupControlData<T>
  : T extends ImageControlDefinition
  ? ImageControlData
  : T extends ComboboxControlDefinition
  ? ComboboxControlData<T>
  : T extends ShapeControlDefinition
  ? ShapeControlData<T>
  : T extends ListControlDefinition
  ? ListControlData<T>
  : T extends LinkControlDefinition
  ? LinkControlData
  : T extends RichTextControlDefinition
  ? IndexSignatureHack<RichTextControlData>
  : T extends RichTextV2ControlDefinition
  ? RichTextV2ControlData
  : T extends StyleControlDefinition
  ? StyleControlData
  : T extends StyleV2ControlDefinition
  ? StyleV2ControlData
  : T extends TypographyControlDefinition
  ? TypographyControlData
  : never

export function copy(definition: Descriptor | ControlDefinition, value: any, context: CopyContext) {
  switch (definition.type) {
    case Types.Backgrounds:
    case Types.Grid:
    case Types.NavigationLinks:
    case PropControllerTypes.Link:
    case PropControllerTypes.Shadows:
    case Types.Image:
    case Types.Images:
    case PropControllerTypes.ResponsiveColor:
    case Types.TableFormFields:
    case Types.Table:
    case PropControllerTypes.Border:
    case Types.RichText:
    case Types.ElementID:
      return propControllerCopy(definition, value, context)
    case RichTextControlType:
      return copyRichTextData(value, context)
    case RichTextV2ControlType:
      return copyRichTextV2Data(
        isRichTextV1Data(value) ? richTextV2DescendentsToData(richTextDTOtoDAO(value)) : value,
        context,
      )
    case ColorControlType:
      return copyColorData(value, context)
    case ImageControlType:
      return copyImageData(value, context)
    case LinkControlType:
      return copyLinkData(value, context)
    case ShapeControlType:
      return copyShapeData(definition, value, context)
    case ListControlType:
      return copyListData(definition, value, context)
    case StyleControlType:
      return copyStyleData(value, context)
    case SlotControlType:
      return copySlotData(value, context)
    default:
      return value
  }
}

export function merge(
  definition: PropControllerDescriptor,
  a: Data,
  b: Data = a,
  context: MergeContext,
): Data {
  switch (definition.type) {
    case SlotControlType:
      return mergeSlotData(a as SlotControlData, b as SlotControlData, context)

    default:
      return b
  }
}

export function getTranslatableData(definition: Descriptor | ControlDefinition, data: Data): Data {
  switch (definition.type) {
    case Types.TextInput:
    case Types.TextArea:
    case TextInputControlType:
    case TextAreaControlType:
      return data

    case RichTextV2ControlType:
      const richTextData = data as RichTextV2ControlData | RichTextControlData

      if (isRichTextV1Data(richTextData)) return null

      return getRichTextV2TranslatableData(definition, richTextData as RichTextV2ControlData)

    case ListControlType:
      if (data == null) return null

      return getListTranslatableData(definition, data as ListControlData)

    case ShapeControlType:
      if (data == null) return null

      return getShapeTranslatableData(definition, data as ShapeControlData)

    default:
      return null
  }
}

export function mergeTranslatedData(
  definition: PropControllerDescriptor,
  data: Data,
  translatedData: Data,
  context: MergeTranslatableDataContext,
): Data {
  if (data == null) return data

  switch (definition.type) {
    case Types.TextInput:
    case Types.TextArea:
    case TextInputControlType:
    case TextAreaControlType:
      if (translatedData == null) return data

      return translatedData

    case Types.Grid:
      return mergeGridPropControllerTranslatedData(data as GridValue, context)

    case SlotControlType:
      return mergeSlotControlTranslatedData(data as SlotControlData, context)

    case RichTextV2ControlType:
      if (translatedData == null) return data

      return mergeRichTextV2TranslatedData(
        definition,
        data as RichTextV2ControlData,
        translatedData as RichTextV2ControlTranslationDto,
      )

    case ListControlType:
      if (translatedData == null) return data

      return mergeListTranslatedData(
        definition,
        data as ListControlData,
        translatedData as ListControlTranslationDto,
        context,
      )

    case ShapeControlType:
      if (translatedData == null) return data

      return mergeShapeTranslatedData(
        definition,
        data as ShapeControlData,
        translatedData as ShapeControlTranslationDto,
        context,
      )

    default:
      return data
  }
}
