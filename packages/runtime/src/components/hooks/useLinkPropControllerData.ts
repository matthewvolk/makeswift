import {
  LinkPropControllerData,
  LinkPropControllerValue,
  getLinkPropControllerValue,
} from '@makeswift/prop-controllers'

export function useLinkPropControllerData(
  data: LinkPropControllerData | undefined | null,
): LinkPropControllerValue | undefined | null {
  if (data == null) return data

  return getLinkPropControllerValue(data)
}
