import crc32 from 'crc-32'
import getValue from 'get-value'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTrack(arg: any): arg is Track {
  return arg && arg.label && typeof arg.label === 'string'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSource(arg: any): arg is Source {
  return arg && arg.url && typeof arg.url === 'string'
}

/**
 * updates a with values from b, recursively
 */
export function deepUpdate(
  a: Record<string, any>,
  b: Record<string, any>,
): Record<string, any> {
  for (const prop of Object.keys(b)) {
    if (
      prop in a &&
      typeof b[prop] === 'object' &&
      typeof a[prop] === 'object'
    ) {
      deepUpdate(a[prop], b[prop])
    } else if (
      typeof a[prop] === 'undefined' ||
      typeof b[prop] !== 'undefined'
    ) {
      a[prop] = b[prop]
    }
  }
  return a
}

/**
 * Does a (deep) crc32 of any object.
 * @returns {Number}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function objectFingerprint(obj: Record<string, any> | string): number {
  let crc = 0
  if (typeof obj === 'object') {
    for (const prop of Object.keys(obj)) {
      crc = crc32.str(`${objectFingerprint(prop)}`, crc)
      crc = crc32.str(`${objectFingerprint(obj[prop])}`, crc)
    }
  } else {
    crc = crc32.str(`${obj}`, crc)
  }
  return crc
}

/**
 * replace variables in a template string with values
 * @param template String with variable names in curly brackets
 * e.g., "http://foo/{bar}?arg={baz.foo}
 * @param fillWith object with attribute-value mappings
 * e.g., { 'bar': 'someurl', 'baz': { 'foo': 42 } }
 * @returns the template string with variables in fillWith replaced
 * e.g., 'htp://foo/someurl?arg=valueforbaz'
 */
export function fillTemplate(
  template: string,
  fillWith: Record<string, any>,
): string {
  return template.replace(
    /\{([\w\s.]+)\}/g,
    (match, varName: string): string => {
      varName = varName.replace(/\s+/g, '') // remove all whitespace
      const fill = getValue(fillWith, varName)
      if (fill !== undefined) {
        if (typeof fill === 'function') return fill(varName)
        return fill
      }
      if (fillWith.callback) {
        const v = fillWith.callback.call(this, varName)
        if (v !== undefined) return v
      }
      return match
    },
  )
}

/**
 * Clones objects (including DOM nodes) and all children.
 * Warning: do not clone cyclic structures
 * (Lifted from dojo https://github.com/dojo/dojo/blob/master/_base/lang.js)
 * @param src The object to clone
 */
export function clone(src: any): any {
  if (
    !src ||
    typeof src !== 'object' ||
    Object.prototype.toString.call(src) === '[object Function]'
  ) {
    // null, undefined, any non-object, or function
    return src // anything
  }
  if (src.nodeType && 'cloneNode' in src) {
    // DOM Node
    return src.cloneNode(true) // Node
  }
  if (src instanceof Date) {
    // Date
    return new Date(src.getTime()) // Date
  }
  if (src instanceof RegExp) {
    // RegExp
    return new RegExp(src) // RegExp
  }
  let r
  let i
  let l
  if (Array.isArray(src)) {
    // array
    r = []
    // eslint-disable-next-line no-plusplus
    for (i = 0, l = src.length; i < l; ++i) {
      if (i in src) {
        r[i] = clone(src[i])
      }
    }
    // we don't clone functions for performance reasons
    //    }else if(d.isFunction(src)){
    //      // function
    //      r = function(){ return src.apply(this, arguments); };
  } else {
    // generic objects
    r = src.constructor ? new src.constructor() : {}
  }
  return mixin(r, src, clone)
}

/**
 * Copies/adds all properties of source to dest; returns dest.
 * (Lifted from dojo https://github.com/dojo/dojo/blob/master/_base/lang.js)
 *
 * All properties, including functions (sometimes termed "methods"), excluding
 * any non-standard extensions found in Object.prototype, are copied/added to
 * dest. Copying/adding each particular property is delegated to copyFunc
 * (if any); copyFunc defaults to the Javascript assignment operator if not
 * provided. Notice that by default, mixin executes a so-called "shallow copy"
 * and aggregate types are copied/added by reference.
 * @param dest The object to which to copy/add all properties contained in
 * source.
 * @param source The object from which to draw all properties to copy into dest.
 * @param copyFunc The process used to copy/add a property in source; defaults
 * to the Javascript assignment operator.
 * @returns dest, as modified
 */
function mixin(
  dest: Record<string, any>,
  source: Record<string, any>,
  copyFunc: Function,
): Record<string, any> {
  let name
  let s
  const empty = {}
  // eslint-disable-next-line guard-for-in
  for (name in source) {
    // the (!(name in empty) || empty[name] !== s) condition avoids copying
    // properties in "source" inherited from Object.prototype.	 For example,
    // if dest has a custom toString() method, don't overwrite it with the
    // toString() method that source inherited from Object.prototype
    s = source[name]
    if (
      !(name in dest) ||
      (dest[name] !== s && (!(name in empty) || empty[name] !== s))
    ) {
      dest[name] = copyFunc ? copyFunc(s) : s
    }
  }

  return dest // Object
}

export function evalHooks(conf: Config): Config {
  for (const x of Object.keys(conf)) {
    if (typeof conf[x] === 'object')
      // recur
      conf[x] = evalHooks(conf[x])
    else if (typeof conf[x] === 'string') {
      // compile
      const spec = conf[x]
      if (/^\s*function\s*\(/.test(spec)) {
        conf[x] = evalHook(spec)
      }
    }
  }
  return conf
}

function evalHook(...args: any[]): Function {
  // can't bind arguments because the closure compiler
  // renames variables, and we need to assign in the eval
  if (typeof args[0] !== 'string') return args[0]
  try {
    eval(`arguments[0]=${args[0]};`)
  } catch (e) {
    console.error(`${e} parsing config callback '${args[0]}'`)
  }
  return args[0]
}
