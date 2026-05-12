import type { PluginObj, PluginPass } from '@babel/core'
import * as t from '@babel/types'

/**
 * Stamps every host-element JSX tag with `data-loc="file:line"` in dev.
 * HoverInspector reads this attribute from the DOM (no React internals needed).
 *
 * - Skips PascalCase tags (component props don't become DOM attributes)
 * - Skips fragments and member-expression tags (e.g. <Foo.Bar />)
 */
let firstStampLogged = false

export function babelDataLocPlugin(): PluginObj<PluginPass> {
  return {
    name: 'flowstack-data-loc',
    visitor: {
      JSXOpeningElement(path, state) {
        const nameNode = path.node.name
        if (!t.isJSXIdentifier(nameNode)) return
        const tagName = nameNode.name
        if (/^[A-Z]/.test(tagName)) return

        const alreadyStamped = path.node.attributes.some(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'data-loc',
        )
        if (alreadyStamped) return

        const loc = path.node.loc?.start
        if (!loc) return

        const filename = state.filename ?? ''
        const cwd = state.cwd ?? ''
        const rel = filename.startsWith(cwd) ? filename.slice(cwd.length + 1) : filename

        if (!firstStampLogged) {
          // eslint-disable-next-line no-console
          console.log(`[flowstack-data-loc] ✓ plugin active — first stamp: ${rel}:${loc.line}`)
          firstStampLogged = true
        }

        path.node.attributes.push(
          t.jsxAttribute(t.jsxIdentifier('data-loc'), t.stringLiteral(`${rel}:${loc.line}`)),
        )
      },
    },
  }
}
