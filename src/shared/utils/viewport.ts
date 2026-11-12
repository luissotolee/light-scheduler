export const PHONE_MAX_WIDTH = 640
export const PHONE_LANDSCAPE_MAX_HEIGHT = 480
export const PHONE_LANDSCAPE_MAX_WIDTH = 1024

export const PHONE_MEDIA_QUERY =
  `(max-width: ${PHONE_MAX_WIDTH}px), ` +
  `(max-height: ${PHONE_LANDSCAPE_MAX_HEIGHT}px) and (max-width: ${PHONE_LANDSCAPE_MAX_WIDTH}px)`

export function computeKeyboardInset(
  layoutHeight: number,
  visualHeight: number,
  offsetTop: number,
): number {
  return Math.max(0, Math.round(layoutHeight - visualHeight - offsetTop))
}
