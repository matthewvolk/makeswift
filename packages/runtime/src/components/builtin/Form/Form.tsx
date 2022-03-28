import {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  ComponentPropsWithoutRef,
  Ref,
  useImperativeHandle,
} from 'react'
import styled, { css } from 'styled-components'
import { Formik, getIn } from 'formik'

import { ReactComponent as Check12 } from '../../icons/check-12.svg'

import { getSizeHeight as getInputSizeHeight } from './components/Field/components/Input'

import {
  Size,
  Sizes,
  Provider as FormContextProvider,
  Shape,
  Contrast,
  Shapes,
  Contrasts,
} from './context/FormContext'
import Placeholder from './components/Placeholder'
import Field from './components/Field'
import Spinner from './components/Spinner'
import Button from '../Button'
import { TableColumn, useColor, useTable } from '../../hooks'
import { cssGridItem, cssMargin, cssMediaRules, cssWidth } from '../../utils/cssMediaRules'
import {
  ElementIDValue,
  GapYValue,
  LinkValue,
  MarginValue,
  ResponsiveColorValue,
  ResponsiveIconRadioGroupValue,
  ResponsiveLengthValue,
  ResponsiveSelectValue,
  TableFormFieldsDescriptor,
  TableFormFieldsValue,
  TableValue,
  TextInputValue,
  TextStyleValue,
  WidthValue,
} from '../../../prop-controllers/descriptors'
import { Link } from '../../shared/Link'
import { BoxModelHandle, getBox } from '../../../box-model'
import { PropControllersHandle } from '../../../state/modules/prop-controller-handles'
import { DescriptorsPropControllers } from '../../../prop-controllers/instances'
import { useTableFormFieldRefs } from '../../hooks/useTableFormFieldRefs'
import { ReactRuntime } from '../../../react'
import { Props } from '../../../prop-controllers'
import { useMutation, gql } from '../../../api/react'

const LOCAL_STORAGE_NAMESPACE = '@@makeswift/components/form'

function getSizeFontSize(size: Size): number {
  switch (size) {
    case Sizes.SMALL:
      return 12

    case Sizes.MEDIUM:
      return 14

    case Sizes.LARGE:
      return 18

    default:
      throw new Error(`Invalid form size "${size}"`)
  }
}

export const Alignments = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
} as const

export type Alignment = typeof Alignments[keyof typeof Alignments]

type Props = {
  id?: ElementIDValue
  tableId?: TableValue
  fields?: TableFormFieldsValue
  submitLink?: LinkValue
  gap?: GapYValue
  shape?: ResponsiveIconRadioGroupValue<Shape>
  size?: ResponsiveIconRadioGroupValue<Size>
  contrast?: ResponsiveIconRadioGroupValue<Contrast>
  labelTextStyle?: TextStyleValue
  labelTextColor?: ResponsiveColorValue
  submitTextStyle?: TextStyleValue
  brandColor?: ResponsiveColorValue
  submitTextColor?: ResponsiveColorValue
  submitLabel?: TextInputValue
  submitVariant?: ResponsiveSelectValue<
    'flat' | 'outline' | 'shadow' | 'clear' | 'blocky' | 'bubbly' | 'skewed'
  >
  submitWidth?: ResponsiveLengthValue
  submitAlignment?: ResponsiveIconRadioGroupValue<Alignment>
  width?: WidthValue
  margin?: MarginValue
}

const GridForm = styled.form<{
  size: Props['size']
  width: Props['width']
  margin: Props['margin']
}>`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  ${props =>
    cssMediaRules(
      [props.size],
      ([size = Sizes.MEDIUM]) => css`
        font-size: ${getSizeFontSize(size)}px;
      `,
    )}
  ${cssWidth()}
  ${cssMargin()}
`

const GridItem = styled.div`
  align-self: flex-end;
  flex-direction: column;
  ${cssGridItem()}
`

function getAlignmentMargin(alignment: Alignment): string {
  switch (alignment) {
    case Alignments.LEFT:
      return '0 auto 0 0'
    case Alignments.RIGHT:
      return '0 0 0 auto'
    default:
      return '0 auto'
  }
}

const StyledButton = styled((props: ComponentPropsWithoutRef<typeof Button>) => (
  <Button {...props} as="button" />
))<{
  size: Props['size']
  alignment: Props['submitAlignment']
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props =>
    cssMediaRules(
      [props.size, props.alignment] as const,
      ([size = Sizes.MEDIUM, alignment = Alignments.CENTER]) => css`
        min-height: ${getInputSizeHeight(size)}px;
        max-height: ${getInputSizeHeight(size)}px;
        margin: ${getAlignmentMargin(alignment)};
        padding-top: 0;
        padding-bottom: 0;
      `,
    )}
`

const ErrorContainer = styled.div`
  padding: 8px 16px;
  background-color: #f19eb9;
  border-radius: 4px;
  margin-top: 16px;
`

const IconContainer = styled.div`
  fill: currentColor;
`

const ErrorMessage = styled.p`
  font-size: 12px;
  margin: 8px 0;
  color: rgba(127, 0, 0, 0.95);
`

function getTableColumnDefaultValue(tableColumn: TableColumn) {
  switch (tableColumn.__typename) {
    case 'CheckboxTableColumn':
      return false

    case 'MultipleSelectTableColumn':
      return []

    case 'SingleLineTextTableColumn':
    case 'LongTextTableColumn':
    case 'SingleSelectTableColumn':
    case 'PhoneNumberTableColumn':
    case 'EmailTableColumn':
    case 'URLTableColumn':
    case 'NumberTableColumn':
    default:
      return ''
  }
}

const CREATE_TABLE_RECORD = gql`
  mutation CreateTableRecord($input: CreateTableRecordInput!) {
    createTableRecord(input: $input) {
      tableRecord {
        id
      }
    }
  }
`

type Column = { columnId: string; data: Record<string, any> }
type Fields = Record<string, string | string[] | boolean>

type Descriptors = { fields?: TableFormFieldsDescriptor }

const Form = forwardRef(function Form(
  {
    id,
    tableId,
    fields: fieldsProp,
    submitLabel = 'Submit',
    submitLink,
    shape,
    size,
    contrast,
    brandColor,
    gap,
    width,
    margin,
    submitTextStyle,
    submitVariant,
    submitTextColor,
    submitWidth,
    submitAlignment,
    labelTextStyle,
    labelTextColor,
  }: Props,
  ref: Ref<BoxModelHandle & PropControllersHandle<Descriptors>>,
) {
  const fields = useMemo(() => fieldsProp?.fields ?? [], [fieldsProp])
  const grid = useMemo(() => fieldsProp?.grid ?? [], [fieldsProp])
  const { data: { table } = {} } = useTable(tableId)
  const [createTableRecord] = useMutation(CREATE_TABLE_RECORD)
  const [refEl, setRefEl] = useState<HTMLElement | null>(null)
  const [propControllers, setPropControllers] =
    useState<DescriptorsPropControllers<Descriptors> | null>(null)
  const [initialValues, setInitialValues] = useState<Fields>(() =>
    fields.reduce((acc, formField) => {
      const tableColumn = table && table.columns.find(field => field.id === formField.tableColumnId)
      const defaultValue = formField ? formField.defaultValue : null

      if (tableColumn) {
        acc[tableColumn.name] =
          defaultValue == null ? getTableColumnDefaultValue(tableColumn) : defaultValue
      }

      return acc
    }, {} as Fields),
  )
  const controller = propControllers?.fields
  const { container, items } = useTableFormFieldRefs(controller, { fieldsCount: fields.length })
  const [isDone, setIsDone] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      getBoxModel() {
        return refEl instanceof Element ? getBox(refEl) : null
      },
      setPropControllers,
    }),
    [refEl, setPropControllers],
  )

  useEffect(() => {
    container(refEl)
  }, [container, refEl])

  useEffect(() => {
    if (!isDone) return

    let timeoutId = setTimeout(() => setIsDone(false), 2500)

    return () => clearTimeout(timeoutId)
  }, [isDone])

  function getTableColumn({ tableColumnId }: any) {
    return table && table.columns.find(field => tableColumnId === field.id)
  }

  async function handleSubmit(values: any, { setSubmitting, resetForm, setStatus }: any) {
    if (table) {
      const columns: Column[] = []

      fields.forEach(field => {
        const tableColumn = getTableColumn(field)

        if (tableColumn) {
          const data = values[tableColumn.name]

          if (data) {
            columns.push({ columnId: field.tableColumnId, data })

            if (field.autofill) {
              localStorage.setItem(
                `${LOCAL_STORAGE_NAMESPACE}/${tableColumn.name}`,
                JSON.stringify(data),
              )
            }
          }
        }
      })

      try {
        await createTableRecord({
          variables: { input: { data: { tableId: table.id, columns } } },
        })
        setIsDone(true)
        setInitialValues(prev =>
          fields.reduce(
            (acc, field) => {
              const tableColumn = getTableColumn(field)

              if (tableColumn) {
                const data = values[tableColumn.name]

                if (data && field.autofill) return { ...acc, [tableColumn.name]: data }
              }

              return acc
            },
            { ...prev },
          ),
        )
        resetForm()

        if (linkRef.current != null) linkRef.current.click()
      } catch (error) {
        setStatus({ error: 'An unexpected error has occurred, please try again later' })
      } finally {
        setSubmitting(false)
      }
    }
  }

  useEffect(() => {
    setInitialValues(prev =>
      fields.reduce(
        (acc, formField) => {
          const tableColumn =
            table && table.columns.find(field => field.id === formField.tableColumnId)

          if (tableColumn && formField.autofill) {
            const storedValue = localStorage.getItem(
              `${LOCAL_STORAGE_NAMESPACE}/${tableColumn.name}`,
            )

            if (storedValue) {
              try {
                acc[tableColumn.name] = JSON.parse(storedValue)
              } catch (e) {
                // Ignore
              }
            }
          }

          return acc
        },
        { ...prev },
      ),
    )
  }, [fields, table])

  const brandColorData = useColor(brandColor)

  return (
    <FormContextProvider
      value={{ shape, size, contrast, brandColor: brandColorData, labelTextStyle, labelTextColor }}
    >
      {tableId == null ? (
        <Placeholder ref={setRefEl} width={width} margin={margin} />
      ) : (
        <>
          <Formik
            onSubmit={handleSubmit}
            initialValues={initialValues}
            initialStatus={{ error: null }}
            enableReinitialize
          >
            {formik => {
              const error = formik.status && formik.status.error
              const errors = fields
                .map(field => {
                  const tableColumn = getTableColumn(field)

                  return (
                    tableColumn &&
                    getIn(formik.touched, tableColumn.name) &&
                    getIn(formik.errors, tableColumn.name)
                  )
                })
                .filter(message => typeof message === 'string')

              return (
                <>
                  <GridForm
                    ref={setRefEl}
                    id={id}
                    width={width}
                    margin={margin}
                    size={size}
                    onSubmit={formik.handleSubmit}
                    onReset={formik.handleReset}
                    noValidate
                  >
                    {fields.map((field, index) => {
                      const tableColumn = getTableColumn(field)

                      return (
                        <GridItem
                          key={field.id}
                          ref={items[index]}
                          grid={grid}
                          index={index}
                          rowGap={gap}
                          columnGap={gap}
                        >
                          <Field tableColumn={tableColumn} tableFormField={field} />
                        </GridItem>
                      )
                    })}
                    <GridItem
                      ref={items[fields.length]}
                      grid={grid}
                      index={fields.length}
                      rowGap={gap}
                      columnGap={gap}
                    >
                      <StyledButton
                        type="submit"
                        disabled={formik.isSubmitting || isDone}
                        shape={shape}
                        size={size}
                        color={brandColor}
                        variant={submitVariant}
                        textColor={submitTextColor}
                        width={submitWidth}
                        alignment={submitAlignment}
                        textStyle={submitTextStyle}
                      >
                        {formik.isSubmitting ? (
                          <Spinner />
                        ) : isDone ? (
                          <IconContainer>
                            <Check12 />
                          </IconContainer>
                        ) : (
                          submitLabel
                        )}
                      </StyledButton>
                      {(errors.length > 0 || error) && (
                        <ErrorContainer>
                          {errors.map(message => (
                            <ErrorMessage key={message}>{message}</ErrorMessage>
                          ))}
                          {error != null && <ErrorMessage>{error}</ErrorMessage>}
                        </ErrorContainer>
                      )}
                    </GridItem>
                  </GridForm>
                  {submitLink != null && <Link ref={linkRef} hidden link={submitLink} />}
                </>
              )
            }}
          </Formik>
        </>
      )}
    </FormContextProvider>
  )
})

export default Form

export function registerComponent(runtime: ReactRuntime) {
  return runtime.registerComponent(Form, {
    type: './components/Form/index.js',
    label: 'Form',
    icon: 'Form40',
    props: {
      id: Props.ElementID(),
      tableId: Props.Table(),
      fields: Props.TableFormFields(),
      submitLink: Props.Link({
        label: 'Redirect to',
        options: [
          { value: 'OPEN_PAGE', label: 'Open page' },
          { value: 'OPEN_URL', label: 'Open URL' },
        ],
        // hidden: props.tableId == null,
      }),
      gap: Props.GapY({
        preset: [{ deviceId: 'desktop', value: { value: 10, unit: 'px' } }],
        label: 'Gap',
        defaultValue: { value: 0, unit: 'px' },
        // hidden: props.tableId == null,
      }),
      shape: Props.ResponsiveIconRadioGroup({
        label: 'Shape',
        options: [
          { label: 'Pill', value: Shapes.PILL, icon: 'ButtonPill16' },
          { label: 'Rounded', value: Shapes.ROUNDED, icon: 'ButtonRounded16' },
          { label: 'Square', value: Shapes.SQUARE, icon: 'ButtonSquare16' },
        ],
        defaultValue: Shapes.ROUNDED,
        // hidden: props.tableId == null,
      }),
      size: Props.ResponsiveIconRadioGroup({
        label: 'Size',
        options: [
          { label: 'Small', value: Sizes.SMALL, icon: 'SizeSmall16' },
          { label: 'Medium', value: Sizes.MEDIUM, icon: 'SizeMedium16' },
          { label: 'Large', value: Sizes.LARGE, icon: 'SizeLarge16' },
        ],
        defaultValue: Sizes.MEDIUM,
        // hidden: props?.tableId == null,
      }),
      contrast: Props.ResponsiveIconRadioGroup({
        label: 'Color',
        options: [
          { label: 'Light mode', value: Contrasts.LIGHT, icon: 'Sun16' },
          { label: 'Dark mode', value: Contrasts.DARK, icon: 'Moon16' },
        ],
        defaultValue: Contrasts.LIGHT,
        // hidden: props.tableId == null,
      }),
      labelTextStyle: Props.TextStyle({ label: 'Label text style' }),
      labelTextColor: Props.ResponsiveColor({
        label: 'Label text color',
      }),
      // labelTextColor: Props.ResponsiveColor((props, device) => {
      //   const hidden = props.tableId == null
      //   const responsiveContrast = props.contrast as ResponsiveValue<Contrast>
      //   const contrast = findDeviceOverride<Contrast>(responsiveContrast, device)

      //   return {
      //     hidden,
      //     label: 'Label text color',
      //     placeholder:
      //       contrast?.value === Contrasts.DARK ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)',
      //   }
      // }),
      submitTextStyle: Props.TextStyle({ label: 'Button text style' }),
      brandColor: Props.ResponsiveColor({
        label: 'Button color',
        placeholder: 'black',
        // hidden: props.tableId == null,
        // TODO: Add hideAlphaSlider
      }),
      submitTextColor: Props.ResponsiveColor({
        label: 'Button text color',
        placeholder: 'white',
        // hidden: props.tableId == null,
      }),
      submitLabel: Props.TextInput({
        label: 'Button label',
        placeholder: 'Submit',
        // hidden: props.tableId == null,
      }),
      submitVariant: Props.ResponsiveSelect({
        label: 'Button style',
        options: [
          { value: 'flat', label: 'Flat' },
          { value: 'outline', label: 'Outline' },
          { value: 'shadow', label: 'Floating' },
          { value: 'clear', label: 'Clear' },
          { value: 'blocky', label: 'Blocky' },
          { value: 'bubbly', label: 'Bubbly' },
          { value: 'skewed', label: 'Skewed' },
        ],
        defaultValue: 'flat',
        // hidden: props.tableId == null,
      }),
      submitWidth: Props.ResponsiveLength({
        label: 'Button width',
        // hidden: props.tableId == null,
        // TODO: Add placeholder: { value: 'auto' }
      }),
      submitAlignment: Props.ResponsiveIconRadioGroup({
        label: 'Button alignment',
        options: [
          { label: 'Left', value: Alignments.LEFT, icon: 'AlignLeft16' },
          { label: 'Center', value: Alignments.CENTER, icon: 'AlignCenter16' },
          { label: 'Right', value: Alignments.RIGHT, icon: 'AlignRight16' },
        ],
        defaultValue: Alignments.CENTER,
        // hidden: props.tableId == null,
      }),
      width: Props.Width({
        preset: [{ deviceId: 'desktop', value: { value: 550, unit: 'px' } }],
        defaultValue: { value: 100, unit: '%' },
      }),
      margin: Props.Margin(),
    },
  })
}