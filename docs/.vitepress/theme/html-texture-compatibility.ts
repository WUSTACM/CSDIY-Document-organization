export type HtmlCanvas = HTMLCanvasElement & {
  requestPaint?: () => void
}

type HtmlCanvasWindow = Window & {
  __HTML_IN_CANVAS_POLYFILL__?: boolean
}

type ElementTexturePrototype = {
  texElementImage2D?: (
    target: number,
    level: number,
    internalFormat: number,
    format: number,
    type: number,
    source: HTMLElement
  ) => void
}

/**
 * three-html-render 0.1.x exposes the short texElementImage2D overload while
 * current Three.js calls the WebGL-compatible long overload. Bridge the two
 * only when the polyfill is active; native implementations are left intact.
 */
export function installHtmlTextureCompatibility() {
  if (!(window as HtmlCanvasWindow).__HTML_IN_CANVAS_POLYFILL__) return

  const contextConstructors = [
    globalThis.WebGLRenderingContext,
    globalThis.WebGL2RenderingContext
  ]

  for (const contextConstructor of contextConstructors) {
    if (!contextConstructor) continue
    const prototype = contextConstructor.prototype as ElementTexturePrototype
    const uploadElement = prototype.texElementImage2D
    if (!uploadElement || uploadElement.length !== 3) continue

    Object.defineProperty(prototype, 'texElementImage2D', {
      configurable: true,
      writable: true,
      value: function texElementImage2D(
        this: WebGLRenderingContext | WebGL2RenderingContext,
        target: number,
        level: number,
        internalFormat: number,
        format: number,
        type: number,
        source: HTMLElement
      ) {
        uploadElement.call(
          this,
          target,
          level,
          internalFormat,
          format,
          type,
          source
        )
      }
    })
  }
}
