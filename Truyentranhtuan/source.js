(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":11}],3:[function(require,module,exports){
var encode = require("./lib/encode.js"),
    decode = require("./lib/decode.js");

exports.decode = function(data, level) {
    return (!level || level <= 0 ? decode.XML : decode.HTML)(data);
};

exports.decodeStrict = function(data, level) {
    return (!level || level <= 0 ? decode.XML : decode.HTMLStrict)(data);
};

exports.encode = function(data, level) {
    return (!level || level <= 0 ? encode.XML : encode.HTML)(data);
};

exports.encodeXML = encode.XML;

exports.encodeHTML4 = exports.encodeHTML5 = exports.encodeHTML = encode.HTML;

exports.decodeXML = exports.decodeXMLStrict = decode.XML;

exports.decodeHTML4 = exports.decodeHTML5 = exports.decodeHTML = decode.HTML;

exports.decodeHTML4Strict = exports.decodeHTML5Strict = exports.decodeHTMLStrict = decode.HTMLStrict;

exports.escape = encode.escape;

},{"./lib/decode.js":4,"./lib/encode.js":6}],4:[function(require,module,exports){
var entityMap = require("../maps/entities.json"),
    legacyMap = require("../maps/legacy.json"),
    xmlMap = require("../maps/xml.json"),
    decodeCodePoint = require("./decode_codepoint.js");

var decodeXMLStrict = getStrictDecoder(xmlMap),
    decodeHTMLStrict = getStrictDecoder(entityMap);

function getStrictDecoder(map) {
    var keys = Object.keys(map).join("|"),
        replace = getReplacer(map);

    keys += "|#[xX][\\da-fA-F]+|#\\d+";

    var re = new RegExp("&(?:" + keys + ");", "g");

    return function(str) {
        return String(str).replace(re, replace);
    };
}

var decodeHTML = (function() {
    var legacy = Object.keys(legacyMap).sort(sorter);

    var keys = Object.keys(entityMap).sort(sorter);

    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        } else {
            keys[i] += ";";
        }
    }

    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"),
        replace = getReplacer(entityMap);

    function replacer(str) {
        if (str.substr(-1) !== ";") str += ";";
        return replace(str);
    }

    //TODO consider creating a merged map
    return function(str) {
        return String(str).replace(re, replacer);
    };
})();

function sorter(a, b) {
    return a < b ? 1 : -1;
}

function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            if (str.charAt(2) === "X" || str.charAt(2) === "x") {
                return decodeCodePoint(parseInt(str.substr(3), 16));
            }
            return decodeCodePoint(parseInt(str.substr(2), 10));
        }
        return map[str.slice(1, -1)];
    };
}

module.exports = {
    XML: decodeXMLStrict,
    HTML: decodeHTML,
    HTMLStrict: decodeHTMLStrict
};

},{"../maps/entities.json":8,"../maps/legacy.json":9,"../maps/xml.json":10,"./decode_codepoint.js":5}],5:[function(require,module,exports){
var decodeMap = require("../maps/decode.json");

module.exports = decodeCodePoint;

// modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }

    if (codePoint in decodeMap) {
        codePoint = decodeMap[codePoint];
    }

    var output = "";

    if (codePoint > 0xffff) {
        codePoint -= 0x10000;
        output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
        codePoint = 0xdc00 | (codePoint & 0x3ff);
    }

    output += String.fromCharCode(codePoint);
    return output;
}

},{"../maps/decode.json":7}],6:[function(require,module,exports){
var inverseXML = getInverseObj(require("../maps/xml.json")),
    xmlReplacer = getInverseReplacer(inverseXML);

exports.XML = getInverse(inverseXML, xmlReplacer);

var inverseHTML = getInverseObj(require("../maps/entities.json")),
    htmlReplacer = getInverseReplacer(inverseHTML);

exports.HTML = getInverse(inverseHTML, htmlReplacer);

function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function(inverse, name) {
            inverse[obj[name]] = "&" + name + ";";
            return inverse;
        }, {});
}

function getInverseReplacer(inverse) {
    var single = [],
        multiple = [];

    Object.keys(inverse).forEach(function(k) {
        if (k.length === 1) {
            single.push("\\" + k);
        } else {
            multiple.push(k);
        }
    });

    //TODO add ranges
    multiple.unshift("[" + single.join("") + "]");

    return new RegExp(multiple.join("|"), "g");
}

var re_nonASCII = /[^\0-\x7F]/g,
    re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

function singleCharReplacer(c) {
    return (
        "&#x" +
        c
            .charCodeAt(0)
            .toString(16)
            .toUpperCase() +
        ";"
    );
}

function astralReplacer(c) {
    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
    var high = c.charCodeAt(0);
    var low = c.charCodeAt(1);
    var codePoint = (high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000;
    return "&#x" + codePoint.toString(16).toUpperCase() + ";";
}

function getInverse(inverse, re) {
    function func(name) {
        return inverse[name];
    }

    return function(data) {
        return data
            .replace(re, func)
            .replace(re_astralSymbols, astralReplacer)
            .replace(re_nonASCII, singleCharReplacer);
    };
}

var re_xmlChars = getInverseReplacer(inverseXML);

function escapeXML(data) {
    return data
        .replace(re_xmlChars, singleCharReplacer)
        .replace(re_astralSymbols, astralReplacer)
        .replace(re_nonASCII, singleCharReplacer);
}

exports.escape = escapeXML;

},{"../maps/entities.json":8,"../maps/xml.json":10}],7:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}
},{}],8:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Abreve":"\u0102","abreve":"\u0103","ac":"\u223E","acd":"\u223F","acE":"\u223E\u0333","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","Acy":"\u0410","acy":"\u0430","AElig":"\u00C6","aelig":"\u00E6","af":"\u2061","Afr":"\uD835\uDD04","afr":"\uD835\uDD1E","Agrave":"\u00C0","agrave":"\u00E0","alefsym":"\u2135","aleph":"\u2135","Alpha":"\u0391","alpha":"\u03B1","Amacr":"\u0100","amacr":"\u0101","amalg":"\u2A3F","amp":"&","AMP":"&","andand":"\u2A55","And":"\u2A53","and":"\u2227","andd":"\u2A5C","andslope":"\u2A58","andv":"\u2A5A","ang":"\u2220","ange":"\u29A4","angle":"\u2220","angmsdaa":"\u29A8","angmsdab":"\u29A9","angmsdac":"\u29AA","angmsdad":"\u29AB","angmsdae":"\u29AC","angmsdaf":"\u29AD","angmsdag":"\u29AE","angmsdah":"\u29AF","angmsd":"\u2221","angrt":"\u221F","angrtvb":"\u22BE","angrtvbd":"\u299D","angsph":"\u2222","angst":"\u00C5","angzarr":"\u237C","Aogon":"\u0104","aogon":"\u0105","Aopf":"\uD835\uDD38","aopf":"\uD835\uDD52","apacir":"\u2A6F","ap":"\u2248","apE":"\u2A70","ape":"\u224A","apid":"\u224B","apos":"'","ApplyFunction":"\u2061","approx":"\u2248","approxeq":"\u224A","Aring":"\u00C5","aring":"\u00E5","Ascr":"\uD835\uDC9C","ascr":"\uD835\uDCB6","Assign":"\u2254","ast":"*","asymp":"\u2248","asympeq":"\u224D","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","awconint":"\u2233","awint":"\u2A11","backcong":"\u224C","backepsilon":"\u03F6","backprime":"\u2035","backsim":"\u223D","backsimeq":"\u22CD","Backslash":"\u2216","Barv":"\u2AE7","barvee":"\u22BD","barwed":"\u2305","Barwed":"\u2306","barwedge":"\u2305","bbrk":"\u23B5","bbrktbrk":"\u23B6","bcong":"\u224C","Bcy":"\u0411","bcy":"\u0431","bdquo":"\u201E","becaus":"\u2235","because":"\u2235","Because":"\u2235","bemptyv":"\u29B0","bepsi":"\u03F6","bernou":"\u212C","Bernoullis":"\u212C","Beta":"\u0392","beta":"\u03B2","beth":"\u2136","between":"\u226C","Bfr":"\uD835\uDD05","bfr":"\uD835\uDD1F","bigcap":"\u22C2","bigcirc":"\u25EF","bigcup":"\u22C3","bigodot":"\u2A00","bigoplus":"\u2A01","bigotimes":"\u2A02","bigsqcup":"\u2A06","bigstar":"\u2605","bigtriangledown":"\u25BD","bigtriangleup":"\u25B3","biguplus":"\u2A04","bigvee":"\u22C1","bigwedge":"\u22C0","bkarow":"\u290D","blacklozenge":"\u29EB","blacksquare":"\u25AA","blacktriangle":"\u25B4","blacktriangledown":"\u25BE","blacktriangleleft":"\u25C2","blacktriangleright":"\u25B8","blank":"\u2423","blk12":"\u2592","blk14":"\u2591","blk34":"\u2593","block":"\u2588","bne":"=\u20E5","bnequiv":"\u2261\u20E5","bNot":"\u2AED","bnot":"\u2310","Bopf":"\uD835\uDD39","bopf":"\uD835\uDD53","bot":"\u22A5","bottom":"\u22A5","bowtie":"\u22C8","boxbox":"\u29C9","boxdl":"\u2510","boxdL":"\u2555","boxDl":"\u2556","boxDL":"\u2557","boxdr":"\u250C","boxdR":"\u2552","boxDr":"\u2553","boxDR":"\u2554","boxh":"\u2500","boxH":"\u2550","boxhd":"\u252C","boxHd":"\u2564","boxhD":"\u2565","boxHD":"\u2566","boxhu":"\u2534","boxHu":"\u2567","boxhU":"\u2568","boxHU":"\u2569","boxminus":"\u229F","boxplus":"\u229E","boxtimes":"\u22A0","boxul":"\u2518","boxuL":"\u255B","boxUl":"\u255C","boxUL":"\u255D","boxur":"\u2514","boxuR":"\u2558","boxUr":"\u2559","boxUR":"\u255A","boxv":"\u2502","boxV":"\u2551","boxvh":"\u253C","boxvH":"\u256A","boxVh":"\u256B","boxVH":"\u256C","boxvl":"\u2524","boxvL":"\u2561","boxVl":"\u2562","boxVL":"\u2563","boxvr":"\u251C","boxvR":"\u255E","boxVr":"\u255F","boxVR":"\u2560","bprime":"\u2035","breve":"\u02D8","Breve":"\u02D8","brvbar":"\u00A6","bscr":"\uD835\uDCB7","Bscr":"\u212C","bsemi":"\u204F","bsim":"\u223D","bsime":"\u22CD","bsolb":"\u29C5","bsol":"\\","bsolhsub":"\u27C8","bull":"\u2022","bullet":"\u2022","bump":"\u224E","bumpE":"\u2AAE","bumpe":"\u224F","Bumpeq":"\u224E","bumpeq":"\u224F","Cacute":"\u0106","cacute":"\u0107","capand":"\u2A44","capbrcup":"\u2A49","capcap":"\u2A4B","cap":"\u2229","Cap":"\u22D2","capcup":"\u2A47","capdot":"\u2A40","CapitalDifferentialD":"\u2145","caps":"\u2229\uFE00","caret":"\u2041","caron":"\u02C7","Cayleys":"\u212D","ccaps":"\u2A4D","Ccaron":"\u010C","ccaron":"\u010D","Ccedil":"\u00C7","ccedil":"\u00E7","Ccirc":"\u0108","ccirc":"\u0109","Cconint":"\u2230","ccups":"\u2A4C","ccupssm":"\u2A50","Cdot":"\u010A","cdot":"\u010B","cedil":"\u00B8","Cedilla":"\u00B8","cemptyv":"\u29B2","cent":"\u00A2","centerdot":"\u00B7","CenterDot":"\u00B7","cfr":"\uD835\uDD20","Cfr":"\u212D","CHcy":"\u0427","chcy":"\u0447","check":"\u2713","checkmark":"\u2713","Chi":"\u03A7","chi":"\u03C7","circ":"\u02C6","circeq":"\u2257","circlearrowleft":"\u21BA","circlearrowright":"\u21BB","circledast":"\u229B","circledcirc":"\u229A","circleddash":"\u229D","CircleDot":"\u2299","circledR":"\u00AE","circledS":"\u24C8","CircleMinus":"\u2296","CirclePlus":"\u2295","CircleTimes":"\u2297","cir":"\u25CB","cirE":"\u29C3","cire":"\u2257","cirfnint":"\u2A10","cirmid":"\u2AEF","cirscir":"\u29C2","ClockwiseContourIntegral":"\u2232","CloseCurlyDoubleQuote":"\u201D","CloseCurlyQuote":"\u2019","clubs":"\u2663","clubsuit":"\u2663","colon":":","Colon":"\u2237","Colone":"\u2A74","colone":"\u2254","coloneq":"\u2254","comma":",","commat":"@","comp":"\u2201","compfn":"\u2218","complement":"\u2201","complexes":"\u2102","cong":"\u2245","congdot":"\u2A6D","Congruent":"\u2261","conint":"\u222E","Conint":"\u222F","ContourIntegral":"\u222E","copf":"\uD835\uDD54","Copf":"\u2102","coprod":"\u2210","Coproduct":"\u2210","copy":"\u00A9","COPY":"\u00A9","copysr":"\u2117","CounterClockwiseContourIntegral":"\u2233","crarr":"\u21B5","cross":"\u2717","Cross":"\u2A2F","Cscr":"\uD835\uDC9E","cscr":"\uD835\uDCB8","csub":"\u2ACF","csube":"\u2AD1","csup":"\u2AD0","csupe":"\u2AD2","ctdot":"\u22EF","cudarrl":"\u2938","cudarrr":"\u2935","cuepr":"\u22DE","cuesc":"\u22DF","cularr":"\u21B6","cularrp":"\u293D","cupbrcap":"\u2A48","cupcap":"\u2A46","CupCap":"\u224D","cup":"\u222A","Cup":"\u22D3","cupcup":"\u2A4A","cupdot":"\u228D","cupor":"\u2A45","cups":"\u222A\uFE00","curarr":"\u21B7","curarrm":"\u293C","curlyeqprec":"\u22DE","curlyeqsucc":"\u22DF","curlyvee":"\u22CE","curlywedge":"\u22CF","curren":"\u00A4","curvearrowleft":"\u21B6","curvearrowright":"\u21B7","cuvee":"\u22CE","cuwed":"\u22CF","cwconint":"\u2232","cwint":"\u2231","cylcty":"\u232D","dagger":"\u2020","Dagger":"\u2021","daleth":"\u2138","darr":"\u2193","Darr":"\u21A1","dArr":"\u21D3","dash":"\u2010","Dashv":"\u2AE4","dashv":"\u22A3","dbkarow":"\u290F","dblac":"\u02DD","Dcaron":"\u010E","dcaron":"\u010F","Dcy":"\u0414","dcy":"\u0434","ddagger":"\u2021","ddarr":"\u21CA","DD":"\u2145","dd":"\u2146","DDotrahd":"\u2911","ddotseq":"\u2A77","deg":"\u00B0","Del":"\u2207","Delta":"\u0394","delta":"\u03B4","demptyv":"\u29B1","dfisht":"\u297F","Dfr":"\uD835\uDD07","dfr":"\uD835\uDD21","dHar":"\u2965","dharl":"\u21C3","dharr":"\u21C2","DiacriticalAcute":"\u00B4","DiacriticalDot":"\u02D9","DiacriticalDoubleAcute":"\u02DD","DiacriticalGrave":"`","DiacriticalTilde":"\u02DC","diam":"\u22C4","diamond":"\u22C4","Diamond":"\u22C4","diamondsuit":"\u2666","diams":"\u2666","die":"\u00A8","DifferentialD":"\u2146","digamma":"\u03DD","disin":"\u22F2","div":"\u00F7","divide":"\u00F7","divideontimes":"\u22C7","divonx":"\u22C7","DJcy":"\u0402","djcy":"\u0452","dlcorn":"\u231E","dlcrop":"\u230D","dollar":"$","Dopf":"\uD835\uDD3B","dopf":"\uD835\uDD55","Dot":"\u00A8","dot":"\u02D9","DotDot":"\u20DC","doteq":"\u2250","doteqdot":"\u2251","DotEqual":"\u2250","dotminus":"\u2238","dotplus":"\u2214","dotsquare":"\u22A1","doublebarwedge":"\u2306","DoubleContourIntegral":"\u222F","DoubleDot":"\u00A8","DoubleDownArrow":"\u21D3","DoubleLeftArrow":"\u21D0","DoubleLeftRightArrow":"\u21D4","DoubleLeftTee":"\u2AE4","DoubleLongLeftArrow":"\u27F8","DoubleLongLeftRightArrow":"\u27FA","DoubleLongRightArrow":"\u27F9","DoubleRightArrow":"\u21D2","DoubleRightTee":"\u22A8","DoubleUpArrow":"\u21D1","DoubleUpDownArrow":"\u21D5","DoubleVerticalBar":"\u2225","DownArrowBar":"\u2913","downarrow":"\u2193","DownArrow":"\u2193","Downarrow":"\u21D3","DownArrowUpArrow":"\u21F5","DownBreve":"\u0311","downdownarrows":"\u21CA","downharpoonleft":"\u21C3","downharpoonright":"\u21C2","DownLeftRightVector":"\u2950","DownLeftTeeVector":"\u295E","DownLeftVectorBar":"\u2956","DownLeftVector":"\u21BD","DownRightTeeVector":"\u295F","DownRightVectorBar":"\u2957","DownRightVector":"\u21C1","DownTeeArrow":"\u21A7","DownTee":"\u22A4","drbkarow":"\u2910","drcorn":"\u231F","drcrop":"\u230C","Dscr":"\uD835\uDC9F","dscr":"\uD835\uDCB9","DScy":"\u0405","dscy":"\u0455","dsol":"\u29F6","Dstrok":"\u0110","dstrok":"\u0111","dtdot":"\u22F1","dtri":"\u25BF","dtrif":"\u25BE","duarr":"\u21F5","duhar":"\u296F","dwangle":"\u29A6","DZcy":"\u040F","dzcy":"\u045F","dzigrarr":"\u27FF","Eacute":"\u00C9","eacute":"\u00E9","easter":"\u2A6E","Ecaron":"\u011A","ecaron":"\u011B","Ecirc":"\u00CA","ecirc":"\u00EA","ecir":"\u2256","ecolon":"\u2255","Ecy":"\u042D","ecy":"\u044D","eDDot":"\u2A77","Edot":"\u0116","edot":"\u0117","eDot":"\u2251","ee":"\u2147","efDot":"\u2252","Efr":"\uD835\uDD08","efr":"\uD835\uDD22","eg":"\u2A9A","Egrave":"\u00C8","egrave":"\u00E8","egs":"\u2A96","egsdot":"\u2A98","el":"\u2A99","Element":"\u2208","elinters":"\u23E7","ell":"\u2113","els":"\u2A95","elsdot":"\u2A97","Emacr":"\u0112","emacr":"\u0113","empty":"\u2205","emptyset":"\u2205","EmptySmallSquare":"\u25FB","emptyv":"\u2205","EmptyVerySmallSquare":"\u25AB","emsp13":"\u2004","emsp14":"\u2005","emsp":"\u2003","ENG":"\u014A","eng":"\u014B","ensp":"\u2002","Eogon":"\u0118","eogon":"\u0119","Eopf":"\uD835\uDD3C","eopf":"\uD835\uDD56","epar":"\u22D5","eparsl":"\u29E3","eplus":"\u2A71","epsi":"\u03B5","Epsilon":"\u0395","epsilon":"\u03B5","epsiv":"\u03F5","eqcirc":"\u2256","eqcolon":"\u2255","eqsim":"\u2242","eqslantgtr":"\u2A96","eqslantless":"\u2A95","Equal":"\u2A75","equals":"=","EqualTilde":"\u2242","equest":"\u225F","Equilibrium":"\u21CC","equiv":"\u2261","equivDD":"\u2A78","eqvparsl":"\u29E5","erarr":"\u2971","erDot":"\u2253","escr":"\u212F","Escr":"\u2130","esdot":"\u2250","Esim":"\u2A73","esim":"\u2242","Eta":"\u0397","eta":"\u03B7","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","euro":"\u20AC","excl":"!","exist":"\u2203","Exists":"\u2203","expectation":"\u2130","exponentiale":"\u2147","ExponentialE":"\u2147","fallingdotseq":"\u2252","Fcy":"\u0424","fcy":"\u0444","female":"\u2640","ffilig":"\uFB03","fflig":"\uFB00","ffllig":"\uFB04","Ffr":"\uD835\uDD09","ffr":"\uD835\uDD23","filig":"\uFB01","FilledSmallSquare":"\u25FC","FilledVerySmallSquare":"\u25AA","fjlig":"fj","flat":"\u266D","fllig":"\uFB02","fltns":"\u25B1","fnof":"\u0192","Fopf":"\uD835\uDD3D","fopf":"\uD835\uDD57","forall":"\u2200","ForAll":"\u2200","fork":"\u22D4","forkv":"\u2AD9","Fouriertrf":"\u2131","fpartint":"\u2A0D","frac12":"\u00BD","frac13":"\u2153","frac14":"\u00BC","frac15":"\u2155","frac16":"\u2159","frac18":"\u215B","frac23":"\u2154","frac25":"\u2156","frac34":"\u00BE","frac35":"\u2157","frac38":"\u215C","frac45":"\u2158","frac56":"\u215A","frac58":"\u215D","frac78":"\u215E","frasl":"\u2044","frown":"\u2322","fscr":"\uD835\uDCBB","Fscr":"\u2131","gacute":"\u01F5","Gamma":"\u0393","gamma":"\u03B3","Gammad":"\u03DC","gammad":"\u03DD","gap":"\u2A86","Gbreve":"\u011E","gbreve":"\u011F","Gcedil":"\u0122","Gcirc":"\u011C","gcirc":"\u011D","Gcy":"\u0413","gcy":"\u0433","Gdot":"\u0120","gdot":"\u0121","ge":"\u2265","gE":"\u2267","gEl":"\u2A8C","gel":"\u22DB","geq":"\u2265","geqq":"\u2267","geqslant":"\u2A7E","gescc":"\u2AA9","ges":"\u2A7E","gesdot":"\u2A80","gesdoto":"\u2A82","gesdotol":"\u2A84","gesl":"\u22DB\uFE00","gesles":"\u2A94","Gfr":"\uD835\uDD0A","gfr":"\uD835\uDD24","gg":"\u226B","Gg":"\u22D9","ggg":"\u22D9","gimel":"\u2137","GJcy":"\u0403","gjcy":"\u0453","gla":"\u2AA5","gl":"\u2277","glE":"\u2A92","glj":"\u2AA4","gnap":"\u2A8A","gnapprox":"\u2A8A","gne":"\u2A88","gnE":"\u2269","gneq":"\u2A88","gneqq":"\u2269","gnsim":"\u22E7","Gopf":"\uD835\uDD3E","gopf":"\uD835\uDD58","grave":"`","GreaterEqual":"\u2265","GreaterEqualLess":"\u22DB","GreaterFullEqual":"\u2267","GreaterGreater":"\u2AA2","GreaterLess":"\u2277","GreaterSlantEqual":"\u2A7E","GreaterTilde":"\u2273","Gscr":"\uD835\uDCA2","gscr":"\u210A","gsim":"\u2273","gsime":"\u2A8E","gsiml":"\u2A90","gtcc":"\u2AA7","gtcir":"\u2A7A","gt":">","GT":">","Gt":"\u226B","gtdot":"\u22D7","gtlPar":"\u2995","gtquest":"\u2A7C","gtrapprox":"\u2A86","gtrarr":"\u2978","gtrdot":"\u22D7","gtreqless":"\u22DB","gtreqqless":"\u2A8C","gtrless":"\u2277","gtrsim":"\u2273","gvertneqq":"\u2269\uFE00","gvnE":"\u2269\uFE00","Hacek":"\u02C7","hairsp":"\u200A","half":"\u00BD","hamilt":"\u210B","HARDcy":"\u042A","hardcy":"\u044A","harrcir":"\u2948","harr":"\u2194","hArr":"\u21D4","harrw":"\u21AD","Hat":"^","hbar":"\u210F","Hcirc":"\u0124","hcirc":"\u0125","hearts":"\u2665","heartsuit":"\u2665","hellip":"\u2026","hercon":"\u22B9","hfr":"\uD835\uDD25","Hfr":"\u210C","HilbertSpace":"\u210B","hksearow":"\u2925","hkswarow":"\u2926","hoarr":"\u21FF","homtht":"\u223B","hookleftarrow":"\u21A9","hookrightarrow":"\u21AA","hopf":"\uD835\uDD59","Hopf":"\u210D","horbar":"\u2015","HorizontalLine":"\u2500","hscr":"\uD835\uDCBD","Hscr":"\u210B","hslash":"\u210F","Hstrok":"\u0126","hstrok":"\u0127","HumpDownHump":"\u224E","HumpEqual":"\u224F","hybull":"\u2043","hyphen":"\u2010","Iacute":"\u00CD","iacute":"\u00ED","ic":"\u2063","Icirc":"\u00CE","icirc":"\u00EE","Icy":"\u0418","icy":"\u0438","Idot":"\u0130","IEcy":"\u0415","iecy":"\u0435","iexcl":"\u00A1","iff":"\u21D4","ifr":"\uD835\uDD26","Ifr":"\u2111","Igrave":"\u00CC","igrave":"\u00EC","ii":"\u2148","iiiint":"\u2A0C","iiint":"\u222D","iinfin":"\u29DC","iiota":"\u2129","IJlig":"\u0132","ijlig":"\u0133","Imacr":"\u012A","imacr":"\u012B","image":"\u2111","ImaginaryI":"\u2148","imagline":"\u2110","imagpart":"\u2111","imath":"\u0131","Im":"\u2111","imof":"\u22B7","imped":"\u01B5","Implies":"\u21D2","incare":"\u2105","in":"\u2208","infin":"\u221E","infintie":"\u29DD","inodot":"\u0131","intcal":"\u22BA","int":"\u222B","Int":"\u222C","integers":"\u2124","Integral":"\u222B","intercal":"\u22BA","Intersection":"\u22C2","intlarhk":"\u2A17","intprod":"\u2A3C","InvisibleComma":"\u2063","InvisibleTimes":"\u2062","IOcy":"\u0401","iocy":"\u0451","Iogon":"\u012E","iogon":"\u012F","Iopf":"\uD835\uDD40","iopf":"\uD835\uDD5A","Iota":"\u0399","iota":"\u03B9","iprod":"\u2A3C","iquest":"\u00BF","iscr":"\uD835\uDCBE","Iscr":"\u2110","isin":"\u2208","isindot":"\u22F5","isinE":"\u22F9","isins":"\u22F4","isinsv":"\u22F3","isinv":"\u2208","it":"\u2062","Itilde":"\u0128","itilde":"\u0129","Iukcy":"\u0406","iukcy":"\u0456","Iuml":"\u00CF","iuml":"\u00EF","Jcirc":"\u0134","jcirc":"\u0135","Jcy":"\u0419","jcy":"\u0439","Jfr":"\uD835\uDD0D","jfr":"\uD835\uDD27","jmath":"\u0237","Jopf":"\uD835\uDD41","jopf":"\uD835\uDD5B","Jscr":"\uD835\uDCA5","jscr":"\uD835\uDCBF","Jsercy":"\u0408","jsercy":"\u0458","Jukcy":"\u0404","jukcy":"\u0454","Kappa":"\u039A","kappa":"\u03BA","kappav":"\u03F0","Kcedil":"\u0136","kcedil":"\u0137","Kcy":"\u041A","kcy":"\u043A","Kfr":"\uD835\uDD0E","kfr":"\uD835\uDD28","kgreen":"\u0138","KHcy":"\u0425","khcy":"\u0445","KJcy":"\u040C","kjcy":"\u045C","Kopf":"\uD835\uDD42","kopf":"\uD835\uDD5C","Kscr":"\uD835\uDCA6","kscr":"\uD835\uDCC0","lAarr":"\u21DA","Lacute":"\u0139","lacute":"\u013A","laemptyv":"\u29B4","lagran":"\u2112","Lambda":"\u039B","lambda":"\u03BB","lang":"\u27E8","Lang":"\u27EA","langd":"\u2991","langle":"\u27E8","lap":"\u2A85","Laplacetrf":"\u2112","laquo":"\u00AB","larrb":"\u21E4","larrbfs":"\u291F","larr":"\u2190","Larr":"\u219E","lArr":"\u21D0","larrfs":"\u291D","larrhk":"\u21A9","larrlp":"\u21AB","larrpl":"\u2939","larrsim":"\u2973","larrtl":"\u21A2","latail":"\u2919","lAtail":"\u291B","lat":"\u2AAB","late":"\u2AAD","lates":"\u2AAD\uFE00","lbarr":"\u290C","lBarr":"\u290E","lbbrk":"\u2772","lbrace":"{","lbrack":"[","lbrke":"\u298B","lbrksld":"\u298F","lbrkslu":"\u298D","Lcaron":"\u013D","lcaron":"\u013E","Lcedil":"\u013B","lcedil":"\u013C","lceil":"\u2308","lcub":"{","Lcy":"\u041B","lcy":"\u043B","ldca":"\u2936","ldquo":"\u201C","ldquor":"\u201E","ldrdhar":"\u2967","ldrushar":"\u294B","ldsh":"\u21B2","le":"\u2264","lE":"\u2266","LeftAngleBracket":"\u27E8","LeftArrowBar":"\u21E4","leftarrow":"\u2190","LeftArrow":"\u2190","Leftarrow":"\u21D0","LeftArrowRightArrow":"\u21C6","leftarrowtail":"\u21A2","LeftCeiling":"\u2308","LeftDoubleBracket":"\u27E6","LeftDownTeeVector":"\u2961","LeftDownVectorBar":"\u2959","LeftDownVector":"\u21C3","LeftFloor":"\u230A","leftharpoondown":"\u21BD","leftharpoonup":"\u21BC","leftleftarrows":"\u21C7","leftrightarrow":"\u2194","LeftRightArrow":"\u2194","Leftrightarrow":"\u21D4","leftrightarrows":"\u21C6","leftrightharpoons":"\u21CB","leftrightsquigarrow":"\u21AD","LeftRightVector":"\u294E","LeftTeeArrow":"\u21A4","LeftTee":"\u22A3","LeftTeeVector":"\u295A","leftthreetimes":"\u22CB","LeftTriangleBar":"\u29CF","LeftTriangle":"\u22B2","LeftTriangleEqual":"\u22B4","LeftUpDownVector":"\u2951","LeftUpTeeVector":"\u2960","LeftUpVectorBar":"\u2958","LeftUpVector":"\u21BF","LeftVectorBar":"\u2952","LeftVector":"\u21BC","lEg":"\u2A8B","leg":"\u22DA","leq":"\u2264","leqq":"\u2266","leqslant":"\u2A7D","lescc":"\u2AA8","les":"\u2A7D","lesdot":"\u2A7F","lesdoto":"\u2A81","lesdotor":"\u2A83","lesg":"\u22DA\uFE00","lesges":"\u2A93","lessapprox":"\u2A85","lessdot":"\u22D6","lesseqgtr":"\u22DA","lesseqqgtr":"\u2A8B","LessEqualGreater":"\u22DA","LessFullEqual":"\u2266","LessGreater":"\u2276","lessgtr":"\u2276","LessLess":"\u2AA1","lesssim":"\u2272","LessSlantEqual":"\u2A7D","LessTilde":"\u2272","lfisht":"\u297C","lfloor":"\u230A","Lfr":"\uD835\uDD0F","lfr":"\uD835\uDD29","lg":"\u2276","lgE":"\u2A91","lHar":"\u2962","lhard":"\u21BD","lharu":"\u21BC","lharul":"\u296A","lhblk":"\u2584","LJcy":"\u0409","ljcy":"\u0459","llarr":"\u21C7","ll":"\u226A","Ll":"\u22D8","llcorner":"\u231E","Lleftarrow":"\u21DA","llhard":"\u296B","lltri":"\u25FA","Lmidot":"\u013F","lmidot":"\u0140","lmoustache":"\u23B0","lmoust":"\u23B0","lnap":"\u2A89","lnapprox":"\u2A89","lne":"\u2A87","lnE":"\u2268","lneq":"\u2A87","lneqq":"\u2268","lnsim":"\u22E6","loang":"\u27EC","loarr":"\u21FD","lobrk":"\u27E6","longleftarrow":"\u27F5","LongLeftArrow":"\u27F5","Longleftarrow":"\u27F8","longleftrightarrow":"\u27F7","LongLeftRightArrow":"\u27F7","Longleftrightarrow":"\u27FA","longmapsto":"\u27FC","longrightarrow":"\u27F6","LongRightArrow":"\u27F6","Longrightarrow":"\u27F9","looparrowleft":"\u21AB","looparrowright":"\u21AC","lopar":"\u2985","Lopf":"\uD835\uDD43","lopf":"\uD835\uDD5D","loplus":"\u2A2D","lotimes":"\u2A34","lowast":"\u2217","lowbar":"_","LowerLeftArrow":"\u2199","LowerRightArrow":"\u2198","loz":"\u25CA","lozenge":"\u25CA","lozf":"\u29EB","lpar":"(","lparlt":"\u2993","lrarr":"\u21C6","lrcorner":"\u231F","lrhar":"\u21CB","lrhard":"\u296D","lrm":"\u200E","lrtri":"\u22BF","lsaquo":"\u2039","lscr":"\uD835\uDCC1","Lscr":"\u2112","lsh":"\u21B0","Lsh":"\u21B0","lsim":"\u2272","lsime":"\u2A8D","lsimg":"\u2A8F","lsqb":"[","lsquo":"\u2018","lsquor":"\u201A","Lstrok":"\u0141","lstrok":"\u0142","ltcc":"\u2AA6","ltcir":"\u2A79","lt":"<","LT":"<","Lt":"\u226A","ltdot":"\u22D6","lthree":"\u22CB","ltimes":"\u22C9","ltlarr":"\u2976","ltquest":"\u2A7B","ltri":"\u25C3","ltrie":"\u22B4","ltrif":"\u25C2","ltrPar":"\u2996","lurdshar":"\u294A","luruhar":"\u2966","lvertneqq":"\u2268\uFE00","lvnE":"\u2268\uFE00","macr":"\u00AF","male":"\u2642","malt":"\u2720","maltese":"\u2720","Map":"\u2905","map":"\u21A6","mapsto":"\u21A6","mapstodown":"\u21A7","mapstoleft":"\u21A4","mapstoup":"\u21A5","marker":"\u25AE","mcomma":"\u2A29","Mcy":"\u041C","mcy":"\u043C","mdash":"\u2014","mDDot":"\u223A","measuredangle":"\u2221","MediumSpace":"\u205F","Mellintrf":"\u2133","Mfr":"\uD835\uDD10","mfr":"\uD835\uDD2A","mho":"\u2127","micro":"\u00B5","midast":"*","midcir":"\u2AF0","mid":"\u2223","middot":"\u00B7","minusb":"\u229F","minus":"\u2212","minusd":"\u2238","minusdu":"\u2A2A","MinusPlus":"\u2213","mlcp":"\u2ADB","mldr":"\u2026","mnplus":"\u2213","models":"\u22A7","Mopf":"\uD835\uDD44","mopf":"\uD835\uDD5E","mp":"\u2213","mscr":"\uD835\uDCC2","Mscr":"\u2133","mstpos":"\u223E","Mu":"\u039C","mu":"\u03BC","multimap":"\u22B8","mumap":"\u22B8","nabla":"\u2207","Nacute":"\u0143","nacute":"\u0144","nang":"\u2220\u20D2","nap":"\u2249","napE":"\u2A70\u0338","napid":"\u224B\u0338","napos":"\u0149","napprox":"\u2249","natural":"\u266E","naturals":"\u2115","natur":"\u266E","nbsp":"\u00A0","nbump":"\u224E\u0338","nbumpe":"\u224F\u0338","ncap":"\u2A43","Ncaron":"\u0147","ncaron":"\u0148","Ncedil":"\u0145","ncedil":"\u0146","ncong":"\u2247","ncongdot":"\u2A6D\u0338","ncup":"\u2A42","Ncy":"\u041D","ncy":"\u043D","ndash":"\u2013","nearhk":"\u2924","nearr":"\u2197","neArr":"\u21D7","nearrow":"\u2197","ne":"\u2260","nedot":"\u2250\u0338","NegativeMediumSpace":"\u200B","NegativeThickSpace":"\u200B","NegativeThinSpace":"\u200B","NegativeVeryThinSpace":"\u200B","nequiv":"\u2262","nesear":"\u2928","nesim":"\u2242\u0338","NestedGreaterGreater":"\u226B","NestedLessLess":"\u226A","NewLine":"\n","nexist":"\u2204","nexists":"\u2204","Nfr":"\uD835\uDD11","nfr":"\uD835\uDD2B","ngE":"\u2267\u0338","nge":"\u2271","ngeq":"\u2271","ngeqq":"\u2267\u0338","ngeqslant":"\u2A7E\u0338","nges":"\u2A7E\u0338","nGg":"\u22D9\u0338","ngsim":"\u2275","nGt":"\u226B\u20D2","ngt":"\u226F","ngtr":"\u226F","nGtv":"\u226B\u0338","nharr":"\u21AE","nhArr":"\u21CE","nhpar":"\u2AF2","ni":"\u220B","nis":"\u22FC","nisd":"\u22FA","niv":"\u220B","NJcy":"\u040A","njcy":"\u045A","nlarr":"\u219A","nlArr":"\u21CD","nldr":"\u2025","nlE":"\u2266\u0338","nle":"\u2270","nleftarrow":"\u219A","nLeftarrow":"\u21CD","nleftrightarrow":"\u21AE","nLeftrightarrow":"\u21CE","nleq":"\u2270","nleqq":"\u2266\u0338","nleqslant":"\u2A7D\u0338","nles":"\u2A7D\u0338","nless":"\u226E","nLl":"\u22D8\u0338","nlsim":"\u2274","nLt":"\u226A\u20D2","nlt":"\u226E","nltri":"\u22EA","nltrie":"\u22EC","nLtv":"\u226A\u0338","nmid":"\u2224","NoBreak":"\u2060","NonBreakingSpace":"\u00A0","nopf":"\uD835\uDD5F","Nopf":"\u2115","Not":"\u2AEC","not":"\u00AC","NotCongruent":"\u2262","NotCupCap":"\u226D","NotDoubleVerticalBar":"\u2226","NotElement":"\u2209","NotEqual":"\u2260","NotEqualTilde":"\u2242\u0338","NotExists":"\u2204","NotGreater":"\u226F","NotGreaterEqual":"\u2271","NotGreaterFullEqual":"\u2267\u0338","NotGreaterGreater":"\u226B\u0338","NotGreaterLess":"\u2279","NotGreaterSlantEqual":"\u2A7E\u0338","NotGreaterTilde":"\u2275","NotHumpDownHump":"\u224E\u0338","NotHumpEqual":"\u224F\u0338","notin":"\u2209","notindot":"\u22F5\u0338","notinE":"\u22F9\u0338","notinva":"\u2209","notinvb":"\u22F7","notinvc":"\u22F6","NotLeftTriangleBar":"\u29CF\u0338","NotLeftTriangle":"\u22EA","NotLeftTriangleEqual":"\u22EC","NotLess":"\u226E","NotLessEqual":"\u2270","NotLessGreater":"\u2278","NotLessLess":"\u226A\u0338","NotLessSlantEqual":"\u2A7D\u0338","NotLessTilde":"\u2274","NotNestedGreaterGreater":"\u2AA2\u0338","NotNestedLessLess":"\u2AA1\u0338","notni":"\u220C","notniva":"\u220C","notnivb":"\u22FE","notnivc":"\u22FD","NotPrecedes":"\u2280","NotPrecedesEqual":"\u2AAF\u0338","NotPrecedesSlantEqual":"\u22E0","NotReverseElement":"\u220C","NotRightTriangleBar":"\u29D0\u0338","NotRightTriangle":"\u22EB","NotRightTriangleEqual":"\u22ED","NotSquareSubset":"\u228F\u0338","NotSquareSubsetEqual":"\u22E2","NotSquareSuperset":"\u2290\u0338","NotSquareSupersetEqual":"\u22E3","NotSubset":"\u2282\u20D2","NotSubsetEqual":"\u2288","NotSucceeds":"\u2281","NotSucceedsEqual":"\u2AB0\u0338","NotSucceedsSlantEqual":"\u22E1","NotSucceedsTilde":"\u227F\u0338","NotSuperset":"\u2283\u20D2","NotSupersetEqual":"\u2289","NotTilde":"\u2241","NotTildeEqual":"\u2244","NotTildeFullEqual":"\u2247","NotTildeTilde":"\u2249","NotVerticalBar":"\u2224","nparallel":"\u2226","npar":"\u2226","nparsl":"\u2AFD\u20E5","npart":"\u2202\u0338","npolint":"\u2A14","npr":"\u2280","nprcue":"\u22E0","nprec":"\u2280","npreceq":"\u2AAF\u0338","npre":"\u2AAF\u0338","nrarrc":"\u2933\u0338","nrarr":"\u219B","nrArr":"\u21CF","nrarrw":"\u219D\u0338","nrightarrow":"\u219B","nRightarrow":"\u21CF","nrtri":"\u22EB","nrtrie":"\u22ED","nsc":"\u2281","nsccue":"\u22E1","nsce":"\u2AB0\u0338","Nscr":"\uD835\uDCA9","nscr":"\uD835\uDCC3","nshortmid":"\u2224","nshortparallel":"\u2226","nsim":"\u2241","nsime":"\u2244","nsimeq":"\u2244","nsmid":"\u2224","nspar":"\u2226","nsqsube":"\u22E2","nsqsupe":"\u22E3","nsub":"\u2284","nsubE":"\u2AC5\u0338","nsube":"\u2288","nsubset":"\u2282\u20D2","nsubseteq":"\u2288","nsubseteqq":"\u2AC5\u0338","nsucc":"\u2281","nsucceq":"\u2AB0\u0338","nsup":"\u2285","nsupE":"\u2AC6\u0338","nsupe":"\u2289","nsupset":"\u2283\u20D2","nsupseteq":"\u2289","nsupseteqq":"\u2AC6\u0338","ntgl":"\u2279","Ntilde":"\u00D1","ntilde":"\u00F1","ntlg":"\u2278","ntriangleleft":"\u22EA","ntrianglelefteq":"\u22EC","ntriangleright":"\u22EB","ntrianglerighteq":"\u22ED","Nu":"\u039D","nu":"\u03BD","num":"#","numero":"\u2116","numsp":"\u2007","nvap":"\u224D\u20D2","nvdash":"\u22AC","nvDash":"\u22AD","nVdash":"\u22AE","nVDash":"\u22AF","nvge":"\u2265\u20D2","nvgt":">\u20D2","nvHarr":"\u2904","nvinfin":"\u29DE","nvlArr":"\u2902","nvle":"\u2264\u20D2","nvlt":"<\u20D2","nvltrie":"\u22B4\u20D2","nvrArr":"\u2903","nvrtrie":"\u22B5\u20D2","nvsim":"\u223C\u20D2","nwarhk":"\u2923","nwarr":"\u2196","nwArr":"\u21D6","nwarrow":"\u2196","nwnear":"\u2927","Oacute":"\u00D3","oacute":"\u00F3","oast":"\u229B","Ocirc":"\u00D4","ocirc":"\u00F4","ocir":"\u229A","Ocy":"\u041E","ocy":"\u043E","odash":"\u229D","Odblac":"\u0150","odblac":"\u0151","odiv":"\u2A38","odot":"\u2299","odsold":"\u29BC","OElig":"\u0152","oelig":"\u0153","ofcir":"\u29BF","Ofr":"\uD835\uDD12","ofr":"\uD835\uDD2C","ogon":"\u02DB","Ograve":"\u00D2","ograve":"\u00F2","ogt":"\u29C1","ohbar":"\u29B5","ohm":"\u03A9","oint":"\u222E","olarr":"\u21BA","olcir":"\u29BE","olcross":"\u29BB","oline":"\u203E","olt":"\u29C0","Omacr":"\u014C","omacr":"\u014D","Omega":"\u03A9","omega":"\u03C9","Omicron":"\u039F","omicron":"\u03BF","omid":"\u29B6","ominus":"\u2296","Oopf":"\uD835\uDD46","oopf":"\uD835\uDD60","opar":"\u29B7","OpenCurlyDoubleQuote":"\u201C","OpenCurlyQuote":"\u2018","operp":"\u29B9","oplus":"\u2295","orarr":"\u21BB","Or":"\u2A54","or":"\u2228","ord":"\u2A5D","order":"\u2134","orderof":"\u2134","ordf":"\u00AA","ordm":"\u00BA","origof":"\u22B6","oror":"\u2A56","orslope":"\u2A57","orv":"\u2A5B","oS":"\u24C8","Oscr":"\uD835\uDCAA","oscr":"\u2134","Oslash":"\u00D8","oslash":"\u00F8","osol":"\u2298","Otilde":"\u00D5","otilde":"\u00F5","otimesas":"\u2A36","Otimes":"\u2A37","otimes":"\u2297","Ouml":"\u00D6","ouml":"\u00F6","ovbar":"\u233D","OverBar":"\u203E","OverBrace":"\u23DE","OverBracket":"\u23B4","OverParenthesis":"\u23DC","para":"\u00B6","parallel":"\u2225","par":"\u2225","parsim":"\u2AF3","parsl":"\u2AFD","part":"\u2202","PartialD":"\u2202","Pcy":"\u041F","pcy":"\u043F","percnt":"%","period":".","permil":"\u2030","perp":"\u22A5","pertenk":"\u2031","Pfr":"\uD835\uDD13","pfr":"\uD835\uDD2D","Phi":"\u03A6","phi":"\u03C6","phiv":"\u03D5","phmmat":"\u2133","phone":"\u260E","Pi":"\u03A0","pi":"\u03C0","pitchfork":"\u22D4","piv":"\u03D6","planck":"\u210F","planckh":"\u210E","plankv":"\u210F","plusacir":"\u2A23","plusb":"\u229E","pluscir":"\u2A22","plus":"+","plusdo":"\u2214","plusdu":"\u2A25","pluse":"\u2A72","PlusMinus":"\u00B1","plusmn":"\u00B1","plussim":"\u2A26","plustwo":"\u2A27","pm":"\u00B1","Poincareplane":"\u210C","pointint":"\u2A15","popf":"\uD835\uDD61","Popf":"\u2119","pound":"\u00A3","prap":"\u2AB7","Pr":"\u2ABB","pr":"\u227A","prcue":"\u227C","precapprox":"\u2AB7","prec":"\u227A","preccurlyeq":"\u227C","Precedes":"\u227A","PrecedesEqual":"\u2AAF","PrecedesSlantEqual":"\u227C","PrecedesTilde":"\u227E","preceq":"\u2AAF","precnapprox":"\u2AB9","precneqq":"\u2AB5","precnsim":"\u22E8","pre":"\u2AAF","prE":"\u2AB3","precsim":"\u227E","prime":"\u2032","Prime":"\u2033","primes":"\u2119","prnap":"\u2AB9","prnE":"\u2AB5","prnsim":"\u22E8","prod":"\u220F","Product":"\u220F","profalar":"\u232E","profline":"\u2312","profsurf":"\u2313","prop":"\u221D","Proportional":"\u221D","Proportion":"\u2237","propto":"\u221D","prsim":"\u227E","prurel":"\u22B0","Pscr":"\uD835\uDCAB","pscr":"\uD835\uDCC5","Psi":"\u03A8","psi":"\u03C8","puncsp":"\u2008","Qfr":"\uD835\uDD14","qfr":"\uD835\uDD2E","qint":"\u2A0C","qopf":"\uD835\uDD62","Qopf":"\u211A","qprime":"\u2057","Qscr":"\uD835\uDCAC","qscr":"\uD835\uDCC6","quaternions":"\u210D","quatint":"\u2A16","quest":"?","questeq":"\u225F","quot":"\"","QUOT":"\"","rAarr":"\u21DB","race":"\u223D\u0331","Racute":"\u0154","racute":"\u0155","radic":"\u221A","raemptyv":"\u29B3","rang":"\u27E9","Rang":"\u27EB","rangd":"\u2992","range":"\u29A5","rangle":"\u27E9","raquo":"\u00BB","rarrap":"\u2975","rarrb":"\u21E5","rarrbfs":"\u2920","rarrc":"\u2933","rarr":"\u2192","Rarr":"\u21A0","rArr":"\u21D2","rarrfs":"\u291E","rarrhk":"\u21AA","rarrlp":"\u21AC","rarrpl":"\u2945","rarrsim":"\u2974","Rarrtl":"\u2916","rarrtl":"\u21A3","rarrw":"\u219D","ratail":"\u291A","rAtail":"\u291C","ratio":"\u2236","rationals":"\u211A","rbarr":"\u290D","rBarr":"\u290F","RBarr":"\u2910","rbbrk":"\u2773","rbrace":"}","rbrack":"]","rbrke":"\u298C","rbrksld":"\u298E","rbrkslu":"\u2990","Rcaron":"\u0158","rcaron":"\u0159","Rcedil":"\u0156","rcedil":"\u0157","rceil":"\u2309","rcub":"}","Rcy":"\u0420","rcy":"\u0440","rdca":"\u2937","rdldhar":"\u2969","rdquo":"\u201D","rdquor":"\u201D","rdsh":"\u21B3","real":"\u211C","realine":"\u211B","realpart":"\u211C","reals":"\u211D","Re":"\u211C","rect":"\u25AD","reg":"\u00AE","REG":"\u00AE","ReverseElement":"\u220B","ReverseEquilibrium":"\u21CB","ReverseUpEquilibrium":"\u296F","rfisht":"\u297D","rfloor":"\u230B","rfr":"\uD835\uDD2F","Rfr":"\u211C","rHar":"\u2964","rhard":"\u21C1","rharu":"\u21C0","rharul":"\u296C","Rho":"\u03A1","rho":"\u03C1","rhov":"\u03F1","RightAngleBracket":"\u27E9","RightArrowBar":"\u21E5","rightarrow":"\u2192","RightArrow":"\u2192","Rightarrow":"\u21D2","RightArrowLeftArrow":"\u21C4","rightarrowtail":"\u21A3","RightCeiling":"\u2309","RightDoubleBracket":"\u27E7","RightDownTeeVector":"\u295D","RightDownVectorBar":"\u2955","RightDownVector":"\u21C2","RightFloor":"\u230B","rightharpoondown":"\u21C1","rightharpoonup":"\u21C0","rightleftarrows":"\u21C4","rightleftharpoons":"\u21CC","rightrightarrows":"\u21C9","rightsquigarrow":"\u219D","RightTeeArrow":"\u21A6","RightTee":"\u22A2","RightTeeVector":"\u295B","rightthreetimes":"\u22CC","RightTriangleBar":"\u29D0","RightTriangle":"\u22B3","RightTriangleEqual":"\u22B5","RightUpDownVector":"\u294F","RightUpTeeVector":"\u295C","RightUpVectorBar":"\u2954","RightUpVector":"\u21BE","RightVectorBar":"\u2953","RightVector":"\u21C0","ring":"\u02DA","risingdotseq":"\u2253","rlarr":"\u21C4","rlhar":"\u21CC","rlm":"\u200F","rmoustache":"\u23B1","rmoust":"\u23B1","rnmid":"\u2AEE","roang":"\u27ED","roarr":"\u21FE","robrk":"\u27E7","ropar":"\u2986","ropf":"\uD835\uDD63","Ropf":"\u211D","roplus":"\u2A2E","rotimes":"\u2A35","RoundImplies":"\u2970","rpar":")","rpargt":"\u2994","rppolint":"\u2A12","rrarr":"\u21C9","Rrightarrow":"\u21DB","rsaquo":"\u203A","rscr":"\uD835\uDCC7","Rscr":"\u211B","rsh":"\u21B1","Rsh":"\u21B1","rsqb":"]","rsquo":"\u2019","rsquor":"\u2019","rthree":"\u22CC","rtimes":"\u22CA","rtri":"\u25B9","rtrie":"\u22B5","rtrif":"\u25B8","rtriltri":"\u29CE","RuleDelayed":"\u29F4","ruluhar":"\u2968","rx":"\u211E","Sacute":"\u015A","sacute":"\u015B","sbquo":"\u201A","scap":"\u2AB8","Scaron":"\u0160","scaron":"\u0161","Sc":"\u2ABC","sc":"\u227B","sccue":"\u227D","sce":"\u2AB0","scE":"\u2AB4","Scedil":"\u015E","scedil":"\u015F","Scirc":"\u015C","scirc":"\u015D","scnap":"\u2ABA","scnE":"\u2AB6","scnsim":"\u22E9","scpolint":"\u2A13","scsim":"\u227F","Scy":"\u0421","scy":"\u0441","sdotb":"\u22A1","sdot":"\u22C5","sdote":"\u2A66","searhk":"\u2925","searr":"\u2198","seArr":"\u21D8","searrow":"\u2198","sect":"\u00A7","semi":";","seswar":"\u2929","setminus":"\u2216","setmn":"\u2216","sext":"\u2736","Sfr":"\uD835\uDD16","sfr":"\uD835\uDD30","sfrown":"\u2322","sharp":"\u266F","SHCHcy":"\u0429","shchcy":"\u0449","SHcy":"\u0428","shcy":"\u0448","ShortDownArrow":"\u2193","ShortLeftArrow":"\u2190","shortmid":"\u2223","shortparallel":"\u2225","ShortRightArrow":"\u2192","ShortUpArrow":"\u2191","shy":"\u00AD","Sigma":"\u03A3","sigma":"\u03C3","sigmaf":"\u03C2","sigmav":"\u03C2","sim":"\u223C","simdot":"\u2A6A","sime":"\u2243","simeq":"\u2243","simg":"\u2A9E","simgE":"\u2AA0","siml":"\u2A9D","simlE":"\u2A9F","simne":"\u2246","simplus":"\u2A24","simrarr":"\u2972","slarr":"\u2190","SmallCircle":"\u2218","smallsetminus":"\u2216","smashp":"\u2A33","smeparsl":"\u29E4","smid":"\u2223","smile":"\u2323","smt":"\u2AAA","smte":"\u2AAC","smtes":"\u2AAC\uFE00","SOFTcy":"\u042C","softcy":"\u044C","solbar":"\u233F","solb":"\u29C4","sol":"/","Sopf":"\uD835\uDD4A","sopf":"\uD835\uDD64","spades":"\u2660","spadesuit":"\u2660","spar":"\u2225","sqcap":"\u2293","sqcaps":"\u2293\uFE00","sqcup":"\u2294","sqcups":"\u2294\uFE00","Sqrt":"\u221A","sqsub":"\u228F","sqsube":"\u2291","sqsubset":"\u228F","sqsubseteq":"\u2291","sqsup":"\u2290","sqsupe":"\u2292","sqsupset":"\u2290","sqsupseteq":"\u2292","square":"\u25A1","Square":"\u25A1","SquareIntersection":"\u2293","SquareSubset":"\u228F","SquareSubsetEqual":"\u2291","SquareSuperset":"\u2290","SquareSupersetEqual":"\u2292","SquareUnion":"\u2294","squarf":"\u25AA","squ":"\u25A1","squf":"\u25AA","srarr":"\u2192","Sscr":"\uD835\uDCAE","sscr":"\uD835\uDCC8","ssetmn":"\u2216","ssmile":"\u2323","sstarf":"\u22C6","Star":"\u22C6","star":"\u2606","starf":"\u2605","straightepsilon":"\u03F5","straightphi":"\u03D5","strns":"\u00AF","sub":"\u2282","Sub":"\u22D0","subdot":"\u2ABD","subE":"\u2AC5","sube":"\u2286","subedot":"\u2AC3","submult":"\u2AC1","subnE":"\u2ACB","subne":"\u228A","subplus":"\u2ABF","subrarr":"\u2979","subset":"\u2282","Subset":"\u22D0","subseteq":"\u2286","subseteqq":"\u2AC5","SubsetEqual":"\u2286","subsetneq":"\u228A","subsetneqq":"\u2ACB","subsim":"\u2AC7","subsub":"\u2AD5","subsup":"\u2AD3","succapprox":"\u2AB8","succ":"\u227B","succcurlyeq":"\u227D","Succeeds":"\u227B","SucceedsEqual":"\u2AB0","SucceedsSlantEqual":"\u227D","SucceedsTilde":"\u227F","succeq":"\u2AB0","succnapprox":"\u2ABA","succneqq":"\u2AB6","succnsim":"\u22E9","succsim":"\u227F","SuchThat":"\u220B","sum":"\u2211","Sum":"\u2211","sung":"\u266A","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","sup":"\u2283","Sup":"\u22D1","supdot":"\u2ABE","supdsub":"\u2AD8","supE":"\u2AC6","supe":"\u2287","supedot":"\u2AC4","Superset":"\u2283","SupersetEqual":"\u2287","suphsol":"\u27C9","suphsub":"\u2AD7","suplarr":"\u297B","supmult":"\u2AC2","supnE":"\u2ACC","supne":"\u228B","supplus":"\u2AC0","supset":"\u2283","Supset":"\u22D1","supseteq":"\u2287","supseteqq":"\u2AC6","supsetneq":"\u228B","supsetneqq":"\u2ACC","supsim":"\u2AC8","supsub":"\u2AD4","supsup":"\u2AD6","swarhk":"\u2926","swarr":"\u2199","swArr":"\u21D9","swarrow":"\u2199","swnwar":"\u292A","szlig":"\u00DF","Tab":"\t","target":"\u2316","Tau":"\u03A4","tau":"\u03C4","tbrk":"\u23B4","Tcaron":"\u0164","tcaron":"\u0165","Tcedil":"\u0162","tcedil":"\u0163","Tcy":"\u0422","tcy":"\u0442","tdot":"\u20DB","telrec":"\u2315","Tfr":"\uD835\uDD17","tfr":"\uD835\uDD31","there4":"\u2234","therefore":"\u2234","Therefore":"\u2234","Theta":"\u0398","theta":"\u03B8","thetasym":"\u03D1","thetav":"\u03D1","thickapprox":"\u2248","thicksim":"\u223C","ThickSpace":"\u205F\u200A","ThinSpace":"\u2009","thinsp":"\u2009","thkap":"\u2248","thksim":"\u223C","THORN":"\u00DE","thorn":"\u00FE","tilde":"\u02DC","Tilde":"\u223C","TildeEqual":"\u2243","TildeFullEqual":"\u2245","TildeTilde":"\u2248","timesbar":"\u2A31","timesb":"\u22A0","times":"\u00D7","timesd":"\u2A30","tint":"\u222D","toea":"\u2928","topbot":"\u2336","topcir":"\u2AF1","top":"\u22A4","Topf":"\uD835\uDD4B","topf":"\uD835\uDD65","topfork":"\u2ADA","tosa":"\u2929","tprime":"\u2034","trade":"\u2122","TRADE":"\u2122","triangle":"\u25B5","triangledown":"\u25BF","triangleleft":"\u25C3","trianglelefteq":"\u22B4","triangleq":"\u225C","triangleright":"\u25B9","trianglerighteq":"\u22B5","tridot":"\u25EC","trie":"\u225C","triminus":"\u2A3A","TripleDot":"\u20DB","triplus":"\u2A39","trisb":"\u29CD","tritime":"\u2A3B","trpezium":"\u23E2","Tscr":"\uD835\uDCAF","tscr":"\uD835\uDCC9","TScy":"\u0426","tscy":"\u0446","TSHcy":"\u040B","tshcy":"\u045B","Tstrok":"\u0166","tstrok":"\u0167","twixt":"\u226C","twoheadleftarrow":"\u219E","twoheadrightarrow":"\u21A0","Uacute":"\u00DA","uacute":"\u00FA","uarr":"\u2191","Uarr":"\u219F","uArr":"\u21D1","Uarrocir":"\u2949","Ubrcy":"\u040E","ubrcy":"\u045E","Ubreve":"\u016C","ubreve":"\u016D","Ucirc":"\u00DB","ucirc":"\u00FB","Ucy":"\u0423","ucy":"\u0443","udarr":"\u21C5","Udblac":"\u0170","udblac":"\u0171","udhar":"\u296E","ufisht":"\u297E","Ufr":"\uD835\uDD18","ufr":"\uD835\uDD32","Ugrave":"\u00D9","ugrave":"\u00F9","uHar":"\u2963","uharl":"\u21BF","uharr":"\u21BE","uhblk":"\u2580","ulcorn":"\u231C","ulcorner":"\u231C","ulcrop":"\u230F","ultri":"\u25F8","Umacr":"\u016A","umacr":"\u016B","uml":"\u00A8","UnderBar":"_","UnderBrace":"\u23DF","UnderBracket":"\u23B5","UnderParenthesis":"\u23DD","Union":"\u22C3","UnionPlus":"\u228E","Uogon":"\u0172","uogon":"\u0173","Uopf":"\uD835\uDD4C","uopf":"\uD835\uDD66","UpArrowBar":"\u2912","uparrow":"\u2191","UpArrow":"\u2191","Uparrow":"\u21D1","UpArrowDownArrow":"\u21C5","updownarrow":"\u2195","UpDownArrow":"\u2195","Updownarrow":"\u21D5","UpEquilibrium":"\u296E","upharpoonleft":"\u21BF","upharpoonright":"\u21BE","uplus":"\u228E","UpperLeftArrow":"\u2196","UpperRightArrow":"\u2197","upsi":"\u03C5","Upsi":"\u03D2","upsih":"\u03D2","Upsilon":"\u03A5","upsilon":"\u03C5","UpTeeArrow":"\u21A5","UpTee":"\u22A5","upuparrows":"\u21C8","urcorn":"\u231D","urcorner":"\u231D","urcrop":"\u230E","Uring":"\u016E","uring":"\u016F","urtri":"\u25F9","Uscr":"\uD835\uDCB0","uscr":"\uD835\uDCCA","utdot":"\u22F0","Utilde":"\u0168","utilde":"\u0169","utri":"\u25B5","utrif":"\u25B4","uuarr":"\u21C8","Uuml":"\u00DC","uuml":"\u00FC","uwangle":"\u29A7","vangrt":"\u299C","varepsilon":"\u03F5","varkappa":"\u03F0","varnothing":"\u2205","varphi":"\u03D5","varpi":"\u03D6","varpropto":"\u221D","varr":"\u2195","vArr":"\u21D5","varrho":"\u03F1","varsigma":"\u03C2","varsubsetneq":"\u228A\uFE00","varsubsetneqq":"\u2ACB\uFE00","varsupsetneq":"\u228B\uFE00","varsupsetneqq":"\u2ACC\uFE00","vartheta":"\u03D1","vartriangleleft":"\u22B2","vartriangleright":"\u22B3","vBar":"\u2AE8","Vbar":"\u2AEB","vBarv":"\u2AE9","Vcy":"\u0412","vcy":"\u0432","vdash":"\u22A2","vDash":"\u22A8","Vdash":"\u22A9","VDash":"\u22AB","Vdashl":"\u2AE6","veebar":"\u22BB","vee":"\u2228","Vee":"\u22C1","veeeq":"\u225A","vellip":"\u22EE","verbar":"|","Verbar":"\u2016","vert":"|","Vert":"\u2016","VerticalBar":"\u2223","VerticalLine":"|","VerticalSeparator":"\u2758","VerticalTilde":"\u2240","VeryThinSpace":"\u200A","Vfr":"\uD835\uDD19","vfr":"\uD835\uDD33","vltri":"\u22B2","vnsub":"\u2282\u20D2","vnsup":"\u2283\u20D2","Vopf":"\uD835\uDD4D","vopf":"\uD835\uDD67","vprop":"\u221D","vrtri":"\u22B3","Vscr":"\uD835\uDCB1","vscr":"\uD835\uDCCB","vsubnE":"\u2ACB\uFE00","vsubne":"\u228A\uFE00","vsupnE":"\u2ACC\uFE00","vsupne":"\u228B\uFE00","Vvdash":"\u22AA","vzigzag":"\u299A","Wcirc":"\u0174","wcirc":"\u0175","wedbar":"\u2A5F","wedge":"\u2227","Wedge":"\u22C0","wedgeq":"\u2259","weierp":"\u2118","Wfr":"\uD835\uDD1A","wfr":"\uD835\uDD34","Wopf":"\uD835\uDD4E","wopf":"\uD835\uDD68","wp":"\u2118","wr":"\u2240","wreath":"\u2240","Wscr":"\uD835\uDCB2","wscr":"\uD835\uDCCC","xcap":"\u22C2","xcirc":"\u25EF","xcup":"\u22C3","xdtri":"\u25BD","Xfr":"\uD835\uDD1B","xfr":"\uD835\uDD35","xharr":"\u27F7","xhArr":"\u27FA","Xi":"\u039E","xi":"\u03BE","xlarr":"\u27F5","xlArr":"\u27F8","xmap":"\u27FC","xnis":"\u22FB","xodot":"\u2A00","Xopf":"\uD835\uDD4F","xopf":"\uD835\uDD69","xoplus":"\u2A01","xotime":"\u2A02","xrarr":"\u27F6","xrArr":"\u27F9","Xscr":"\uD835\uDCB3","xscr":"\uD835\uDCCD","xsqcup":"\u2A06","xuplus":"\u2A04","xutri":"\u25B3","xvee":"\u22C1","xwedge":"\u22C0","Yacute":"\u00DD","yacute":"\u00FD","YAcy":"\u042F","yacy":"\u044F","Ycirc":"\u0176","ycirc":"\u0177","Ycy":"\u042B","ycy":"\u044B","yen":"\u00A5","Yfr":"\uD835\uDD1C","yfr":"\uD835\uDD36","YIcy":"\u0407","yicy":"\u0457","Yopf":"\uD835\uDD50","yopf":"\uD835\uDD6A","Yscr":"\uD835\uDCB4","yscr":"\uD835\uDCCE","YUcy":"\u042E","yucy":"\u044E","yuml":"\u00FF","Yuml":"\u0178","Zacute":"\u0179","zacute":"\u017A","Zcaron":"\u017D","zcaron":"\u017E","Zcy":"\u0417","zcy":"\u0437","Zdot":"\u017B","zdot":"\u017C","zeetrf":"\u2128","ZeroWidthSpace":"\u200B","Zeta":"\u0396","zeta":"\u03B6","zfr":"\uD835\uDD37","Zfr":"\u2128","ZHcy":"\u0416","zhcy":"\u0436","zigrarr":"\u21DD","zopf":"\uD835\uDD6B","Zopf":"\u2124","Zscr":"\uD835\uDCB5","zscr":"\uD835\uDCCF","zwj":"\u200D","zwnj":"\u200C"}
},{}],9:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","AElig":"\u00C6","aelig":"\u00E6","Agrave":"\u00C0","agrave":"\u00E0","amp":"&","AMP":"&","Aring":"\u00C5","aring":"\u00E5","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","brvbar":"\u00A6","Ccedil":"\u00C7","ccedil":"\u00E7","cedil":"\u00B8","cent":"\u00A2","copy":"\u00A9","COPY":"\u00A9","curren":"\u00A4","deg":"\u00B0","divide":"\u00F7","Eacute":"\u00C9","eacute":"\u00E9","Ecirc":"\u00CA","ecirc":"\u00EA","Egrave":"\u00C8","egrave":"\u00E8","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","frac12":"\u00BD","frac14":"\u00BC","frac34":"\u00BE","gt":">","GT":">","Iacute":"\u00CD","iacute":"\u00ED","Icirc":"\u00CE","icirc":"\u00EE","iexcl":"\u00A1","Igrave":"\u00CC","igrave":"\u00EC","iquest":"\u00BF","Iuml":"\u00CF","iuml":"\u00EF","laquo":"\u00AB","lt":"<","LT":"<","macr":"\u00AF","micro":"\u00B5","middot":"\u00B7","nbsp":"\u00A0","not":"\u00AC","Ntilde":"\u00D1","ntilde":"\u00F1","Oacute":"\u00D3","oacute":"\u00F3","Ocirc":"\u00D4","ocirc":"\u00F4","Ograve":"\u00D2","ograve":"\u00F2","ordf":"\u00AA","ordm":"\u00BA","Oslash":"\u00D8","oslash":"\u00F8","Otilde":"\u00D5","otilde":"\u00F5","Ouml":"\u00D6","ouml":"\u00F6","para":"\u00B6","plusmn":"\u00B1","pound":"\u00A3","quot":"\"","QUOT":"\"","raquo":"\u00BB","reg":"\u00AE","REG":"\u00AE","sect":"\u00A7","shy":"\u00AD","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","szlig":"\u00DF","THORN":"\u00DE","thorn":"\u00FE","times":"\u00D7","Uacute":"\u00DA","uacute":"\u00FA","Ucirc":"\u00DB","ucirc":"\u00FB","Ugrave":"\u00D9","ugrave":"\u00F9","uml":"\u00A8","Uuml":"\u00DC","uuml":"\u00FC","Yacute":"\u00DD","yacute":"\u00FD","yen":"\u00A5","yuml":"\u00FF"}
},{}],10:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],11:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],14:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":12,"./Tracker":13}],15:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);

},{"./base":14,"./models":58}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],17:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],18:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],19:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],20:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],21:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],22:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],23:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],24:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],25:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],26:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],27:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],28:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],29:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],30:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],31:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],32:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],33:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],34:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":19,"./Form":20,"./FormRow":21,"./Header":22,"./InputField":23,"./Label":24,"./Link":25,"./MultilineLabel":26,"./NavigationButton":27,"./OAuthButton":28,"./Section":29,"./Select":30,"./Stepper":31,"./Switch":32,"./WebViewButton":33}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],38:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],39:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],40:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],41:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],42:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],43:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],44:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],45:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],46:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],47:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],48:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],51:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],52:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],54:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],55:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],56:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],57:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],58:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);
__exportStar(require("./SearchFilter"), exports);

},{"./Chapter":16,"./ChapterDetails":17,"./Constants":18,"./DynamicUI":34,"./HomeSection":35,"./Languages":36,"./Manga":37,"./MangaTile":38,"./MangaUpdate":39,"./PagedResults":40,"./RawData":41,"./RequestHeaders":42,"./RequestInterceptor":43,"./RequestManager":44,"./RequestObject":45,"./ResponseObject":46,"./SearchField":47,"./SearchFilter":48,"./SearchRequest":49,"./SourceInfo":50,"./SourceManga":51,"./SourceStateManager":52,"./SourceTag":53,"./TagSection":54,"./TrackedManga":55,"./TrackedMangaChapterReadAction":56,"./TrackerActionQueue":57}],59:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Truyentranhtuan = exports.TruyentranhtuanInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyentranhtuanParser_1 = require("./TruyentranhtuanParser");
const DOMAIN = 'http://truyentuan.com/';
const method = 'GET';
exports.TruyentranhtuanInfo = {
    version: '1.0.1',
    name: 'Truyentranhtuan',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from Truyentranhtuan',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyentranhtuan extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000,
            interceptor: {
                interceptRequest: (request) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    request.headers = Object.assign(Object.assign({}, ((_a = request.headers) !== null && _a !== void 0 ? _a : {})), {
                        'referer': DOMAIN
                    });
                    return request;
                }),
                interceptResponse: (response) => __awaiter(this, void 0, void 0, function* () {
                    return response;
                })
            }
        });
    }
    getMangaShareUrl(mangaId) { return mangaId; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = mangaId;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let statusFinal = 1;
            creator = $('#infor-box span[itemprop="author"] > span[itemprop="name"]').text().trim();
            for (const t of $('p:nth-of-type(3) > a', $('#infor-box h1[itemprop="name"]').next()).toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            let status = $('p:nth-of-type(4) > a', $('#infor-box h1[itemprop="name"]').next()).text().trim(); //completed, 1 = Ongoing
            statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $("#manga-summary").text();
            const image = (_b = $('.manga-cover img').attr("src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: TruyentranhtuanParser_1.decodeHTMLEntity(desc),
                titles: [TruyentranhtuanParser_1.decodeHTMLEntity($('#infor-box h1[itemprop="name"]').text().trim())],
                image: encodeURI(image),
                status: statusFinal,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            const timeList = $('#manga-chapter .date-name').toArray().reverse();
            const titleList = $('#manga-chapter .chapter-name').toArray();
            for (const i in titleList.reverse()) {
                let id = $('a', titleList[i]).attr('href');
                let chapNum = parseFloat((_a = $('a', titleList[i]).text()) === null || _a === void 0 ? void 0 : _a.split(' ').pop());
                let name = $('a', titleList[i]).text().trim();
                let time = $(timeList[i]).text().trim().split('.');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? Number(i) + 1 : chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(time[1] + '/' + time[0] + '/' + time[2])
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${chapterId}`,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let arrayImages = $.html().match(/slides_page_path = (.*);/);
            let listImages = JSON.parse((_a = arrayImages === null || arrayImages === void 0 ? void 0 : arrayImages[1]) !== null && _a !== void 0 ? _a : "");
            let slides_page = [];
            if (listImages.length === 0) {
                arrayImages = $.html().match(/slides_page_url_path = (.*);/);
                listImages = JSON.parse((_b = arrayImages === null || arrayImages === void 0 ? void 0 : arrayImages[1]) !== null && _b !== void 0 ? _b : "");
                slides_page = listImages;
            }
            else {
                slides_page = listImages;
                // sort
                let length_chapter = slides_page.length - 1;
                for (let i = 0; i < length_chapter; i++)
                    for (let j = i + 1; j < slides_page.length; j++)
                        if (slides_page[j] < slides_page[i]) {
                            let temp = slides_page[j];
                            slides_page[j] = slides_page[i];
                            slides_page[i] = temp;
                        }
                // !sort
            }
            const pages = [];
            for (let obj of slides_page) {
                let link = encodeURI(obj);
                pages.push(link);
            }
            const chapterDetails = createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
            return chapterDetails;
        });
    }
    getHomePageSections(sectionCallback) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hot",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới",
                view_more: true,
            });
            //Load empty sections
            // sectionCallback(featured);
            // sectionCallback(hot);
            sectionCallback(newUpdated);
            ///Get the section data
            //featured
            // let request = createRequestObject({
            //     url: DOMAIN,
            //     method: "GET",
            // });
            // let featuredItems: MangaTile[] = [];
            // let data = await this.requestManager.schedule(request, 1);
            // let $ = this.cheerio.load(data.data);
            // for (const element of $('.owl-carousel .slide-item').toArray()) {
            //     let title = $('.slide-info > h3 > a', element).text().trim();
            //     let img = $('a > img', element).attr("data-src") ?? $('a > img', element).attr("src");
            //     let id = $('.slide-info > h3 > a', element).attr('href') ?? title;
            //     let subtitle = $(".detail-slide > a", element).text().trim();
            //     featuredItems.push(createMangaTile(<MangaTile>{
            //         id: id ?? "",
            //         image: img ?? "",
            //         title: createIconText({ text: title }),
            //         subtitleText: createIconText({ text: subtitle }),
            //     }));
            // }
            // featured.items = featuredItems;
            // sectionCallback(featured);
            // Hot
            // request = createRequestObject({
            //     url: DOMAIN,
            //     method: "GET",
            // });
            // let popular: MangaTile[] = [];
            // data = await this.requestManager.schedule(request, 1);
            // $ = this.cheerio.load(data.data);
            // for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            //     let title = $('.caption > h3 > a', element).text().trim();
            //     let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            //     let id = $('.caption > h3 > a', element).attr('href') ?? title;
            //     let subtitle = $("ul > li:first-child > a", element).text().trim();
            //     popular.push(createMangaTile(<MangaTile>{
            //         id: id ?? "",
            //         image: img ?? "",
            //         title: createIconText({ text: title }),
            //         subtitleText: createIconText({ text: subtitle }),
            //     }));
            // }
            // hot.items = popular;
            // sectionCallback(hot);
            //update
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let newUpdatedItems = [];
            for (const element of $('#new-chapter .manga-update').toArray()) {
                let title = $('a', element).first().text().trim();
                let img = $('img', element).attr('src').replace('-80x90', '');
                let id = (_a = $('a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
                let subtitle = $('a', element).last().text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: (_b = encodeURI(img)) !== null && _b !== void 0 ? _b : "",
                    title: createIconText({ text: TruyentranhtuanParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = `http://truyentuan.com/page/${page}/`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let manga = TruyentranhtuanParser_1.parseViewMore($);
            metadata = !TruyentranhtuanParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let { availableTags } = require('./search');
            var key = query.title;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            let tiles = [];
            if (query.title) {
                var json = availableTags.filter(function (el) {
                    return el.label.toLowerCase().includes(key === null || key === void 0 ? void 0 : key.toLowerCase());
                });
                let manga = [];
                for (const i of json) {
                    manga.push(createMangaTile({
                        id: i.url,
                        image: '',
                        title: createIconText({ text: TruyentranhtuanParser_1.decodeHTMLEntity(i.label) }),
                    }));
                }
                tiles = manga;
            }
            else {
                const request = createRequestObject({
                    url: tags[0],
                    method: "GET",
                });
                let data = yield this.requestManager.schedule(request, 1);
                let $ = this.cheerio.load(data.data);
                tiles = TruyentranhtuanParser_1.parseSearch($);
            }
            metadata = undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [
                {
                    "id": "http://truyentuan.com//danh-sach-truyen",
                    "label": "Tất cả"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/top/top-50",
                    "label": "Top 50"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/trang-thai/dang-tien-hanh",
                    "label": "Đang tiến hành"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/trang-thai/tam-dung",
                    "label": "Tạm ngừng"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/trang-thai/hoan-thanh/",
                    "label": "Hoàn thành"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/4-koma",
                    "label": "4-koma"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/action",
                    "label": "Action"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/adventure",
                    "label": "Adventure"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/anime",
                    "label": "Anime"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/comedy",
                    "label": "Comedy"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/comic",
                    "label": "Comic"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/drama",
                    "label": "Drama"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/ecchi-2",
                    "label": "ecchi"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/fantasy",
                    "label": "Fantasy"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/gender-bender",
                    "label": "Gender Bender"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/historical",
                    "label": "Historical"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/horror",
                    "label": "Horror"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/josei",
                    "label": "Josei"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/live-action",
                    "label": "Live Action"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/manhua",
                    "label": "Manhua"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/manhwa",
                    "label": "Manhwa"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/martial-arts",
                    "label": "Martial Arts"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/mature-2",
                    "label": "Mature"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/mecha",
                    "label": "Mecha"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/mystery",
                    "label": "Mystery"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/one-shot",
                    "label": "One Shot"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/psychological",
                    "label": "Psychological"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/romance",
                    "label": "Romance"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/school-life",
                    "label": "School Life"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/sci-fi",
                    "label": "Sci-fi"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/seinei",
                    "label": "Seinen"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/shoujo",
                    "label": "Shoujo"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/shoujo-ai-2",
                    "label": "Shoujo Ai"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/shounen",
                    "label": "Shounen"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/slice-of-life",
                    "label": "Slice of Life"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/smut",
                    "label": "Smut"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/sports",
                    "label": "Sports"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/supernatural",
                    "label": "Supernatural"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/tragedy",
                    "label": "Tragedy"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/truyen-scan",
                    "label": "Truyện scan"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/truyen-tranh-viet-nam",
                    "label": "Truyện tranh Việt Nam"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/webtoon",
                    "label": "Webtoon"
                },
                {
                    "id": "http://truyentuan.com//danh-sach-truyen/the-loai/yuri",
                    "label": "Yuri"
                }
            ];
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
}
exports.Truyentranhtuan = Truyentranhtuan;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./TruyentranhtuanParser":60,"./search":61,"buffer":2,"paperback-extensions-common":15}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    const manga = [];
    for (const element of $('#new-chapter .manga-focus').toArray()) {
        let title = $('.manga > a', element).text().trim();
        let id = (_a = $('.manga > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = $('.chapter > a', element).text().trim();
        let img = '';
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(img !== null && img !== void 0 ? img : ""),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    for (const element of $('#new-chapter .manga-update').toArray()) {
        let title = $('a', element).first().text().trim();
        let img = (_a = $('img', element).attr('src')) === null || _a === void 0 ? void 0 : _a.replace('-80x90', '');
        let id = (_b = $('a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
        let subtitle = $('a', element).last().text().trim();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(img !== null && img !== void 0 ? img : ""),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("li", "#page-nav").toArray()) {
        const p = Number($('span', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("#page-nav li.current-page").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};

},{"entities":3}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableTags = void 0;
var availableTags = [{ label: "07 Ghost", value: "07 Ghost", url: "http://truyentuan.com/07-ghost/" }, { label: "1/2 Prince", value: "1/2 Prince", url: "http://truyentuan.com/1-2-prince/" }, { label: "Naruto", value: "Naruto", url: "http://truyentuan.com/naruto/" }, { label: "1001 Nights", value: "1001 Nights", url: "http://truyentuan.com/1001-nights/" }, { label: "One Piece", value: "One Piece", url: "http://truyentuan.com/one-piece/" }, { label: "Zombie Loan", value: "Zombie Loan", url: "http://truyentuan.com/zombie-loan/" }, { label: "Zombie Hunter", value: "Zombie Hunter", url: "http://truyentuan.com/zombie-hunter/" }, { label: "Zippy Ziggy", value: "Zippy Ziggy", url: "http://truyentuan.com/zippy-ziggy/" }, { label: "A Love That Feels The Cold", value: "A Love That Feels The Cold", url: "http://truyentuan.com/a-love-that-feels-the-cold/" }, { label: "A Town Where You Live", value: "A Town Where You Live", url: "http://truyentuan.com/a-town-where-you-live/" }, { label: "14 Juicy", value: "14 Juicy", url: "http://truyentuan.com/14-juicy/" }, { label: "16 Life", value: "16 Life", url: "http://truyentuan.com/16-life/" }, { label: "17 Sai Natsu - Seifuku no Jouji", value: "17 Sai Natsu - Seifuku no Jouji", url: "http://truyentuan.com/17-sai-natsu-seifuku-no-jouji/" }, { label: "20th Century Boys", value: "20th Century Boys", url: "http://truyentuan.com/20th-century-boys/" }, { label: "21st Century Boys", value: "21st Century Boys", url: "http://truyentuan.com/21st-century-boys/" }, { label: "666 Satan", value: "666 Satan", url: "http://truyentuan.com/666-satan/" }, { label: "7 Seeds", value: "7 Seeds", url: "http://truyentuan.com/7-seeds/" }, { label: "9 Faces of Love", value: "9 Faces of Love", url: "http://truyentuan.com/9-faces-of-love/" }, { label: "Accel World", value: "Accel World", url: "http://truyentuan.com/accel-world/" }, { label: "Addicted to Curry", value: "Addicted to Curry", url: "http://truyentuan.com/addicted-to-curry/" }, { label: "Adolf", value: "Adolf", url: "http://truyentuan.com/adolf/" }, { label: "Daichohen Doraemon", value: "Daichohen Doraemon", url: "http://truyentuan.com/daichohen-doraemon/" }, { label: "Đại Đường Song Long Truyện", value: "Đại Đường Song Long Truyện", url: "http://truyentuan.com/dai-duong-song-long-truyen/" }, { label: "Đại Đường Uy Long", value: "Đại Đường Uy Long", url: "http://truyentuan.com/dai-duong-uy-long/" }, { label: "Dark Air", value: "Dark Air", url: "http://truyentuan.com/dark-air/" }, { label: "Zetman", value: "Zetman", url: "http://truyentuan.com/zetman/" }, { label: "Zero no Tsukaima", value: "Zero no Tsukaima", url: "http://truyentuan.com/zero-no-tsukaima/" }, { label: "Darker than Black: Shikkoku no Hana", value: "Darker than Black: Shikkoku no Hana", url: "http://truyentuan.com/darker-than-black-shikkoku-no-hana/" }, { label: "Gakuen Alice", value: "Gakuen Alice", url: "http://truyentuan.com/gakuen-alice/" }, { label: "Đại Thánh Vương", value: "Đại Thánh Vương", url: "http://truyentuan.com/dai-thanh-vuong/" }, { label: "Zennou No Noa", value: "Zennou No Noa", url: "http://truyentuan.com/zennou-no-noa/" }, { label: "Zen Martial", value: "Zen Martial", url: "http://truyentuan.com/zen-martial/" }, { label: "Darren Shan", value: "Darren Shan", url: "http://truyentuan.com/darren-shan/" }, { label: "Deadman Wonderland", value: "Deadman Wonderland", url: "http://truyentuan.com/deadman-wonderland/" }, { label: "Death Note", value: "Death Note", url: "http://truyentuan.com/death-note/" }, { label: "Deep Love - Ayu no Monogatari", value: "Deep Love - Ayu no Monogatari", url: "http://truyentuan.com/deep-love-ayu-no-monogatari/" }, { label: "Deep Love - Host", value: "Deep Love - Host", url: "http://truyentuan.com/deep-love-host/" }, { label: "Deep Love - Reina no Unmei", value: "Deep Love - Reina no Unmei", url: "http://truyentuan.com/deep-love-reina-no-unmei/" }, { label: "Deep Love - Pao no Monogatari", value: "Deep Love - Pao no Monogatari", url: "http://truyentuan.com/deep-love-pao-no-monogatari/" }, { label: "Gakuen Babysitters", value: "Gakuen Babysitters", url: "http://truyentuan.com/gakuen-babysitters/" }, { label: "Gamaran", value: "Gamaran", url: "http://truyentuan.com/gamaran/" }, { label: "Gamble Fish", value: "Gamble Fish", url: "http://truyentuan.com/gamble-fish/" }, { label: "Ganba! Fly High", value: "Ganba! Fly High", url: "http://truyentuan.com/ganba-fly-high/" }, { label: "Gantz", value: "Gantz", url: "http://truyentuan.com/gantz/" }, { label: "Aflame Inferno", value: "Aflame Inferno", url: "http://truyentuan.com/aflame-inferno/" }, { label: "Aflame Inferno (DP)", value: "Aflame Inferno (DP)", url: "http://truyentuan.com/aflame-inferno-dp/" }, { label: "Ah! My Goddess", value: "Ah! My Goddess", url: "http://truyentuan.com/ah-my-goddess/" }, { label: "AIKI", value: "AIKI", url: "http://truyentuan.com/aiki/" }, { label: "Air Gear", value: "Air Gear", url: "http://truyentuan.com/air-gear/" }, { label: "Defense Devil", value: "Defense Devil", url: "http://truyentuan.com/defense-devil/" }, { label: "Zekkyou Gakkyuu (Screaming Lessons)", value: "Zekkyou Gakkyuu (Screaming Lessons)", url: "http://truyentuan.com/zekkyou-gakkyuu/" }, { label: "Zashiki Onna", value: "Zashiki Onna", url: "http://truyentuan.com/zashiki-onna/" }, { label: "Yuu & Mi - Con Ma Dễ Thương", value: "Yuu & Mi - Con Ma Dễ Thương", url: "http://truyentuan.com/yuu-mi-con-ma-de-thuong/" }, { label: "Yureka - Lost Saga", value: "Yureka - Lost Saga", url: "http://truyentuan.com/yureka-lost-saga/" }, { label: "Detective Conan", value: "Detective Conan", url: "http://truyentuan.com/detective-conan/" }, { label: "Yumekui Merry", value: "Yumekui Merry", url: "http://truyentuan.com/yumekui-merry/" }, { label: "Yume de Aetara", value: "Yume de Aetara", url: "http://truyentuan.com/yume-de-aetara/" }, { label: "Yubisaki Milk Tea", value: "Yubisaki Milk Tea", url: "http://truyentuan.com/yubisaki-milk-tea/" }, { label: "Gash Bell", value: "Gash Bell", url: "http://truyentuan.com/gash-bell/" }, { label: "Gepetto", value: "Gepetto", url: "http://truyentuan.com/gepetto/" }, { label: "Get Backers", value: "Get Backers", url: "http://truyentuan.com/get-backers/" }, { label: "Giọt Rượu Thần Thánh", value: "Giọt Rượu Thần Thánh", url: "http://truyentuan.com/giot-ruou-than-thanh/" }, { label: "Gintama", value: "Gintama", url: "http://truyentuan.com/gintama/" }, { label: "Aishiteruze Baby", value: "Aishiteruze Baby", url: "http://truyentuan.com/aishiteruze-baby/" }, { label: "Akaboshi", value: "Akaboshi", url: "http://truyentuan.com/akaboshi/" }, { label: "Fairy Tail", value: "Fairy Tail", url: "http://truyentuan.com/fairy-tail/" }, { label: "Akame Ga Kiru", value: "Akame Ga Kiru", url: "http://truyentuan.com/akame-ga-kiru/" }, { label: "Akumetsu", value: "Akumetsu", url: "http://truyentuan.com/akumetsu/" }, { label: "Alive - The Final Evolution", value: "Alive - The Final Evolution", url: "http://truyentuan.com/alive-the-final-evolution/" }, { label: "Alive!", value: "Alive!", url: "http://truyentuan.com/alive/" }, { label: "Ám Hành Ngự Sử", value: "Ám Hành Ngự Sử", url: "http://truyentuan.com/am-hanh-ngu-su/" }, { label: "Amagami Precious Diary", value: "Amagami Precious Diary", url: "http://truyentuan.com/amagami-precious-diary/" }, { label: "H2", value: "H2", url: "http://truyentuan.com/h2/" }, { label: "Hồng Vũ Đại Đế", value: "Hồng Vũ Đại Đế", url: "http://truyentuan.com/hong-vu-dai-de/" }, { label: "Hỏa Phụng Liêu Nguyên", value: "Hỏa Phụng Liêu Nguyên", url: "http://truyentuan.com/hoa-phung-lieu-nguyen/" }, { label: "Hỏa Vân Tà Thần", value: "Hỏa Vân Tà Thần", url: "http://truyentuan.com/hoa-van-ta-than/" }, { label: "Hỏa Vân Tà Thần II", value: "Hỏa Vân Tà Thần II", url: "http://truyentuan.com/hoa-van-ta-than-ii/" }, { label: "Hội Mắt Nai", value: "Hội Mắt Nai", url: "http://truyentuan.com/hoi-mat-nai/" }, { label: "L-DK", value: "L-DK", url: "http://truyentuan.com/l-dk/" }, { label: "Hajimete no Aku", value: "Hajimete no Aku", url: "http://truyentuan.com/hajimete-no-aku/" }, { label: "Half &Half", value: "Half &Half", url: "http://truyentuan.com/half-half/" }, { label: "Hammer Session!", value: "Hammer Session!", url: "http://truyentuan.com/hammer-session/" }, { label: "Hanza Sky", value: "Hanza Sky", url: "http://truyentuan.com/hanza-sky/" }, { label: "Hanzou no Mon", value: "Hanzou no Mon", url: "http://truyentuan.com/hanzou-no-mon/" }, { label: "Amagami Precious Diary - Kaoru", value: "Amagami Precious Diary - Kaoru", url: "http://truyentuan.com/amagami-precious-diary-kaoru/" }, { label: "Amagami Sincrely Yours", value: "Amagami Sincrely Yours", url: "http://truyentuan.com/amagami-sincrely-yours/" }, { label: "Amanchu!", value: "Amanchu!", url: "http://truyentuan.com/amanchu/" }, { label: "Anagle Mole", value: "Anagle Mole", url: "http://truyentuan.com/anagle-mole/" }, { label: "Ane Doki", value: "Ane Doki", url: "http://truyentuan.com/ane-doki/" }, { label: "Angel Beats! Heaven's Door", value: "Angel Beats! Heaven's Door", url: "http://truyentuan.com/angel-beats-heavens-door/" }, { label: "Angel Densetsu", value: "Angel Densetsu", url: "http://truyentuan.com/angel-densetsu/" }, { label: "Angel Sanctuary", value: "Angel Sanctuary", url: "http://truyentuan.com/angel-sanctuary/" }, { label: "Anh Hùng Xạ Điêu", value: "Anh Hùng Xạ Điêu", url: "http://truyentuan.com/anh-hung-xa-dieu/" }, { label: "Ansatsu Kyoushitsu", value: "Ansatsu Kyoushitsu", url: "http://truyentuan.com/ansatsu-kyoushitsu/" }, { label: "Ao no Exorcist", value: "Ao no Exorcist", url: "http://truyentuan.com/ao-no-exorcist/" }, { label: "Aphorism", value: "Aphorism", url: "http://truyentuan.com/aphorism/" }, { label: "Apocalypse no Toride", value: "Apocalypse no Toride", url: "http://truyentuan.com/apocalypse-no-toride/" }, { label: "Arachnid", value: "Arachnid", url: "http://truyentuan.com/arachnid/" }, { label: "Arago", value: "Arago", url: "http://truyentuan.com/arago/" }, { label: "Are you Alice?", value: "Are you Alice?", url: "http://truyentuan.com/are-you-alice/" }, { label: "Area no Kishi", value: "Area no Kishi", url: "http://truyentuan.com/area-no-kishi/" }, { label: "Ares", value: "Ares", url: "http://truyentuan.com/ares/" }, { label: "Asa made Jugyou Chu!", value: "Asa made Jugyou Chu!", url: "http://truyentuan.com/asa-made-jugyou-chu/" }, { label: "Ayu Mayu", value: "Ayu Mayu", url: "http://truyentuan.com/ayu-mayu/" }, { label: "Azumanga Daioh", value: "Azumanga Daioh", url: "http://truyentuan.com/azumanga-daioh/" }, { label: "B.Reaction", value: "B.Reaction", url: "http://truyentuan.com/b-reaction/" }, { label: "Bàn Long", value: "Bàn Long", url: "http://truyentuan.com/ban-long/" }, { label: "Bách Quỷ Dạ Hành", value: "Bách Quỷ Dạ Hành", url: "http://truyentuan.com/bach-quy-da-hanh/" }, { label: "Baby, Please Kill Me", value: "Baby, Please Kill Me", url: "http://truyentuan.com/baby-please-kill-me/" }, { label: "Bad Company", value: "Bad Company", url: "http://truyentuan.com/bad-company/" }, { label: "Baka And Boing", value: "Baka And Boing", url: "http://truyentuan.com/baka-and-boing/" }, { label: "Bakuman", value: "Bakuman", url: "http://truyentuan.com/bakuman/" }, { label: "Banya", value: "Banya", url: "http://truyentuan.com/banya/" }, { label: "Bắc Đẩu Thần Quyền", value: "Bắc Đẩu Thần Quyền", url: "http://truyentuan.com/bac-dau-than-quyen/" }, { label: "Bạo Tộc X", value: "Bạo Tộc X", url: "http://truyentuan.com/bao-toc-x/" }, { label: "Bảng Phong Thần", value: "Bảng Phong Thần", url: "http://truyentuan.com/bang-phong-than/" }, { label: "Bartender", value: "Bartender", url: "http://truyentuan.com/bartender/" }, { label: "Basara", value: "Basara", url: "http://truyentuan.com/basara/" }, { label: "Battle Angel Alita", value: "Battle Angel Alita", url: "http://truyentuan.com/battle-angel-alita/" }, { label: "Battle Angel Alita - Last Order", value: "Battle Angel Alita - Last Order", url: "http://truyentuan.com/battle-angel-alita-last-order/" }, { label: "Battle Royale", value: "Battle Royale", url: "http://truyentuan.com/battle-royale/" }, { label: "BB Project", value: "BB Project", url: "http://truyentuan.com/bb-project/" }, { label: "Beach Stars", value: "Beach Stars", url: "http://truyentuan.com/beach-stars/" }, { label: "Beauty Pop", value: "Beauty Pop", url: "http://truyentuan.com/beauty-pop/" }, { label: "Because I'm the Goddess", value: "Because I'm the Goddess", url: "http://truyentuan.com/because-im-the-goddess/" }, { label: "Beelzebub", value: "Beelzebub", url: "http://truyentuan.com/beelzebub/" }, { label: "Beelzebub (MG)", value: "Beelzebub (MG)", url: "http://truyentuan.com/beelzebub-mg/" }, { label: "Berserk", value: "Berserk", url: "http://truyentuan.com/berserk/" }, { label: "Biên Hoang Truyền Thuyết", value: "Biên Hoang Truyền Thuyết", url: "http://truyentuan.com/bien-hoang-truyen-thuyet/" }, { label: "Bibi", value: "Bibi", url: "http://truyentuan.com/bibi/" }, { label: "Billy Bat", value: "Billy Bat", url: "http://truyentuan.com/billy-bat/" }, { label: "Bio Meat: Nectar", value: "Bio Meat: Nectar", url: "http://truyentuan.com/bio-meat-nectar/" }, { label: "Birdcage Manor", value: "Birdcage Manor", url: "http://truyentuan.com/birdcage-manor/" }, { label: "Bitter Virgin", value: "Bitter Virgin", url: "http://truyentuan.com/bitter-virgin/" }, { label: "Black Cat", value: "Black Cat", url: "http://truyentuan.com/black-cat/" }, { label: "Hắc Quản Gia", value: "Hắc Quản Gia", url: "http://truyentuan.com/hac-quan-gia/" }, { label: "La Mosca", value: "La Mosca", url: "http://truyentuan.com/la-mosca/" }, { label: "Lady Georgie", value: "Lady Georgie", url: "http://truyentuan.com/lady-georgie/" }, { label: "Law of Ueki", value: "Law of Ueki", url: "http://truyentuan.com/law-of-ueki/" }, { label: "Law of Ueki Plus", value: "Law of Ueki Plus", url: "http://truyentuan.com/law-of-ueki-plus/" }, { label: "Layers", value: "Layers", url: "http://truyentuan.com/layers/" }, { label: "Legend of Tyr", value: "Legend of Tyr", url: "http://truyentuan.com/legend-of-tyr/" }, { label: "Hạt Giống Của Sự Bất An", value: "Hạt Giống Của Sự Bất An", url: "http://truyentuan.com/hat-giong-cua-su-bat-an/" }, { label: "Hapi Mari", value: "Hapi Mari", url: "http://truyentuan.com/hapi-mari/" }, { label: "Hareluya", value: "Hareluya", url: "http://truyentuan.com/hareluya/" }, { label: "Hareluya II Boy", value: "Hareluya II Boy", url: "http://truyentuan.com/hareluya-ii-boy/" }, { label: "Legend of Zelda: Oracle of Ages", value: "Legend of Zelda: Oracle of Ages", url: "http://truyentuan.com/legend-of-zelda-oracle-of-ages/" }, { label: "Legend of Zelda: Oracle of Seasons", value: "Legend of Zelda: Oracle of Seasons", url: "http://truyentuan.com/legend-of-zelda-oracle-of-seasons/" }, { label: "Liar Game", value: "Liar Game", url: "http://truyentuan.com/liar-game/" }, { label: "Little Witch's Diary", value: "Little Witch's Diary", url: "http://truyentuan.com/little-witchs-diary/" }, { label: "Harisugawa Ở Thế Giới Trong Gương", value: "Harisugawa Ở Thế Giới Trong Gương", url: "http://truyentuan.com/harisugawa-o-the-gioi-trong-guong/" }, { label: "Hatsujouteki Yajyuu", value: "Hatsujouteki Yajyuu", url: "http://truyentuan.com/hatsujouteki-yajyuu/" }, { label: "Hatsukoi Limited", value: "Hatsukoi Limited", url: "http://truyentuan.com/hatsukoi-limited/" }, { label: "Hayate no Gotoku!", value: "Hayate no Gotoku!", url: "http://truyentuan.com/hayate-no-gotoku/" }, { label: "Long Phi Bất Bại", value: "Long Phi Bất Bại", url: "http://truyentuan.com/long-phi-bat-bai/" }, { label: "Love Monster", value: "Love Monster", url: "http://truyentuan.com/love-monster/" }, { label: "Lucifer and the Biscuit Hammer", value: "Lucifer and the Biscuit Hammer", url: "http://truyentuan.com/lucifer-and-the-biscuit-hammer/" }, { label: "Hekikai no AiON", value: "Hekikai no AiON", url: "http://truyentuan.com/hekikai-no-aion/" }, { label: "Hiệp Khách Giang Hồ", value: "Hiệp Khách Giang Hồ", url: "http://truyentuan.com/hiep-khach-giang-ho/" }, { label: "Lucky Luke", value: "Lucky Luke", url: "http://truyentuan.com/lucky-luke/" }, { label: "Lucky Star", value: "Lucky Star", url: "http://truyentuan.com/lucky-star/" }, { label: "Ludwig Kakumei", value: "Ludwig Kakumei", url: "http://truyentuan.com/ludwig-kakumei/" }, { label: "Thần Binh Huyền Kỳ I", value: "Thần Binh Huyền Kỳ I", url: "http://truyentuan.com/than-binh-huyen-ky-i/" }, { label: "Thiết Tướng Tung Hoành", value: "Thiết Tướng Tung Hoành", url: "http://truyentuan.com/thiet-tuong-tung-hoanh/" }, { label: "Magi", value: "Magi", url: "http://truyentuan.com/magi/" }, { label: "Magic Ban Removal! Hyde and Closer", value: "Magic Ban Removal! Hyde and Closer", url: "http://truyentuan.com/magic-ban-removal-hyde-and-closer/" }, { label: "Magician", value: "Magician", url: "http://truyentuan.com/magician/" }, { label: "Magico", value: "Magico", url: "http://truyentuan.com/magico/" }, { label: "Hiệp Sĩ Giấy", value: "Hiệp Sĩ Giấy", url: "http://truyentuan.com/hiep-si-giay/" }, { label: "Hiatari Ryoukou!", value: "Hiatari Ryoukou!", url: "http://truyentuan.com/hiatari-ryoukou/" }, { label: "Hibi Chouchou", value: "Hibi Chouchou", url: "http://truyentuan.com/hibi-chouchou/" }, { label: "Hidan no Aria", value: "Hidan no Aria", url: "http://truyentuan.com/hidan-no-aria/" }, { label: "Higanjima", value: "Higanjima", url: "http://truyentuan.com/higanjima/" }, { label: "High School", value: "High School", url: "http://truyentuan.com/high-school/" }, { label: "Black God", value: "Black God", url: "http://truyentuan.com/black-god/" }, { label: "Blast", value: "Blast", url: "http://truyentuan.com/blast/" }, { label: "Blazer Drive", value: "Blazer Drive", url: "http://truyentuan.com/blazer-drive/" }, { label: "Bleach", value: "Bleach", url: "http://truyentuan.com/bleach/" }, { label: "Blood Lad", value: "Blood Lad", url: "http://truyentuan.com/blood-lad/" }, { label: "Blood Parade", value: "Blood Parade", url: "http://truyentuan.com/blood-parade/" }, { label: "Bloody Kiss", value: "Bloody Kiss", url: "http://truyentuan.com/bloody-kiss/" }, { label: "Bloody Monday", value: "Bloody Monday", url: "http://truyentuan.com/bloody-monday/" }, { label: "Bloody Monday 2", value: "Bloody Monday 2", url: "http://truyentuan.com/bloody-monday-2/" }, { label: "Blue Dragon: Ral Ω Grado", value: "Blue Dragon: Ral Ω Grado", url: "http://truyentuan.com/blue-dragon-ral-%cf%89-grado/" }, { label: "Blue Seal", value: "Blue Seal", url: "http://truyentuan.com/blue-seal/" }, { label: "Boku Kimi", value: "Boku Kimi", url: "http://truyentuan.com/boku-kimi/" }, { label: "Bokura ga Ita", value: "Bokura ga Ita", url: "http://truyentuan.com/bokura-ga-ita/" }, { label: "Bonnouji", value: "Bonnouji", url: "http://truyentuan.com/bonnouji/" }, { label: "Booking Life", value: "Booking Life", url: "http://truyentuan.com/booking-life/" }, { label: "Bowling King", value: "Bowling King", url: "http://truyentuan.com/bowling-king/" }, { label: "Boyfriend", value: "Boyfriend", url: "http://truyentuan.com/boyfriend/" }, { label: "Boys Over Flowers", value: "Boys Over Flowers", url: "http://truyentuan.com/boys-over-flowers/" }, { label: "Break Blade", value: "Break Blade", url: "http://truyentuan.com/break-blade/" }, { label: "Break Shot", value: "Break Shot", url: "http://truyentuan.com/break-shot/" }, { label: "Btooom!", value: "Btooom!", url: "http://truyentuan.com/btooom/" }, { label: "Buddha", value: "Buddha", url: "http://truyentuan.com/buddha/" }, { label: "Burning Hell", value: "Burning Hell", url: "http://truyentuan.com/burning-hell/" }, { label: "Busou Renkin", value: "Busou Renkin", url: "http://truyentuan.com/busou-renkin/" }, { label: "Buster Keel", value: "Buster Keel", url: "http://truyentuan.com/buster-keel/" }, { label: "Butterfly", value: "Butterfly", url: "http://truyentuan.com/butterfly/" }, { label: "Buyuden", value: "Buyuden", url: "http://truyentuan.com/buyuden/" }, { label: "Highschool of the Dead", value: "Highschool of the Dead", url: "http://truyentuan.com/highschool-of-the-dead/" }, { label: "Hikaru No Go", value: "Hikaru No Go", url: "http://truyentuan.com/hikaru-no-go/" }, { label: "History's Strongest Disciple Kenichi", value: "History's Strongest Disciple Kenichi", url: "http://truyentuan.com/historys-strongest-disciple-kenichi/" }, { label: "Magikano", value: "Magikano", url: "http://truyentuan.com/magikano/" }, { label: "Mahoromatic", value: "Mahoromatic", url: "http://truyentuan.com/mahoromatic/" }, { label: "Mahou Sensei Negima", value: "Mahou Sensei Negima", url: "http://truyentuan.com/mahou-sensei-negima/" }, { label: "Hitogatana", value: "Hitogatana", url: "http://truyentuan.com/hitogatana/" }, { label: "Cửu Long Thành Trại", value: "Cửu Long Thành Trại", url: "http://truyentuan.com/cuu-long-thanh-trai/" }, { label: "Cửu Long Thành Trại II", value: "Cửu Long Thành Trại II", url: "http://truyentuan.com/cuu-long-thanh-trai-ii/" }, { label: "Cổ Long Quần Hiệp Truyện", value: "Cổ Long Quần Hiệp Truyện", url: "http://truyentuan.com/co-long-quan-hiep-truyen/" }, { label: "Cage of Eden", value: "Cage of Eden", url: "http://truyentuan.com/cage-of-eden/" }, { label: "Hoàng Tử Biến Thái Và Mèo Cái Không Cười", value: "Hoàng Tử Biến Thái Và Mèo Cái Không Cười", url: "http://truyentuan.com/hoang-tu-bien-thai-va-meo-cai-khong-cuoi/" }, { label: "Holyland", value: "Holyland", url: "http://truyentuan.com/holyland/" }, { label: "Homunculus", value: "Homunculus", url: "http://truyentuan.com/homunculus/" }, { label: "Honorable Baek Dong Soo", value: "Honorable Baek Dong Soo", url: "http://truyentuan.com/honorable-baek-dong-soo/" }, { label: "Hot Gimmick", value: "Hot Gimmick", url: "http://truyentuan.com/hot-gimmick/" }, { label: "Hunter X Hunter", value: "Hunter X Hunter", url: "http://truyentuan.com/hunter-x-hunter/" }, { label: "Huyễn Thành", value: "Huyễn Thành", url: "http://truyentuan.com/huyen-thanh/" }, { label: "Can't See Can't Hear But Love", value: "Can't See Can't Hear But Love", url: "http://truyentuan.com/cant-see-cant-hear-but-love/" }, { label: "Cậu Bé 3 Mắt", value: "Cậu Bé 3 Mắt", url: "http://truyentuan.com/cau-be-3-mat/" }, { label: "Cặp Bài Trùng", value: "Cặp Bài Trùng", url: "http://truyentuan.com/cap-bai-trung/" }, { label: "Cavalier of the Abyss", value: "Cavalier of the Abyss", url: "http://truyentuan.com/cavalier-of-the-abyss/" }, { label: "Cơn lốc - Fight No Akatsuki", value: "Cơn lốc - Fight No Akatsuki", url: "http://truyentuan.com/con-loc-fight-no-akatsuki/" }, { label: "Cerberus", value: "Cerberus", url: "http://truyentuan.com/cerberus/" }, { label: "Change 123", value: "Change 123", url: "http://truyentuan.com/change-123/" }, { label: "Change Guy", value: "Change Guy", url: "http://truyentuan.com/change-guy/" }, { label: "Chú Bé Rồng", value: "Chú Bé Rồng", url: "http://truyentuan.com/chu-be-rong/" }, { label: "Chaosic Rune", value: "Chaosic Rune", url: "http://truyentuan.com/chaosic-rune/" }, { label: "Chii's Sweet Home", value: "Chii's Sweet Home", url: "http://truyentuan.com/chiis-sweet-home/" }, { label: "Chobits", value: "Chobits", url: "http://truyentuan.com/chobits/" }, { label: "Chocolat", value: "Chocolat", url: "http://truyentuan.com/chocolat/" }, { label: "Chocolate Cosmos", value: "Chocolate Cosmos", url: "http://truyentuan.com/chocolate-cosmos/" }, { label: "Chrono Crusade", value: "Chrono Crusade", url: "http://truyentuan.com/chrono-crusade/" }, { label: "Ciel", value: "Ciel", url: "http://truyentuan.com/ciel/" }, { label: "City Hunter", value: "City Hunter", url: "http://truyentuan.com/city-hunter/" }, { label: "Clover", value: "Clover", url: "http://truyentuan.com/clover/" }, { label: "Clover (Tetsuhiro Hirakawa)", value: "Clover (Tetsuhiro Hirakawa)", url: "http://truyentuan.com/clover-tetsuhiro-hirakawa/" }, { label: "Code Geass: Lelouch of the Rebellion", value: "Code Geass: Lelouch of the Rebellion", url: "http://truyentuan.com/code-geass-lelouch-of-the-rebellion/" }, { label: "Code:Breaker", value: "Code:Breaker", url: "http://truyentuan.com/codebreaker/" }, { label: "Conde Koma", value: "Conde Koma", url: "http://truyentuan.com/conde-koma/" }, { label: "Cosmic Break Manga", value: "Cosmic Break Manga", url: "http://truyentuan.com/cosmic-break-manga/" }, { label: "Countrouble", value: "Countrouble", url: "http://truyentuan.com/countrouble/" }, { label: "Cradle of Monsters", value: "Cradle of Monsters", url: "http://truyentuan.com/cradle-of-monsters/" }, { label: "Crazy for You", value: "Crazy for You", url: "http://truyentuan.com/crazy-for-you/" }, { label: "Crazy Girl Shin Bia", value: "Crazy Girl Shin Bia", url: "http://truyentuan.com/crazy-girl-shin-bia/" }, { label: "Crepuscule", value: "Crepuscule", url: "http://truyentuan.com/crepuscule/" }, { label: "Cross Game", value: "Cross Game", url: "http://truyentuan.com/cross-game/" }, { label: "Crows", value: "Crows", url: "http://truyentuan.com/crows/" }, { label: "D-Frag!", value: "D-Frag!", url: "http://truyentuan.com/d-frag/" }, { label: "D.Gray-man", value: "D.Gray-man", url: "http://truyentuan.com/d-gray-man/" }, { label: "Di[e]ce - Trò Chơi Sinh Tử", value: "Di[e]ce - Trò Chơi Sinh Tử", url: "http://truyentuan.com/diece-tro-choi-sinh-tu/" }, { label: "Detective Conan (CFC Team)", value: "Detective Conan (CFC Team)", url: "http://truyentuan.com/detective-conan-cfc-team/" }, { label: "Diamond Cut Diamond", value: "Diamond Cut Diamond", url: "http://truyentuan.com/diamond-cut-diamond/" }, { label: "Diamond no Ace", value: "Diamond no Ace", url: "http://truyentuan.com/diamond-no-ace/" }, { label: "Digimon Next", value: "Digimon Next", url: "http://truyentuan.com/digimon-next/" }, { label: "Digimon V-Tamer", value: "Digimon V-Tamer", url: "http://truyentuan.com/digimon-v-tamer/" }, { label: "Dr. Slump", value: "Dr. Slump", url: "http://truyentuan.com/dr-slump/" }, { label: "Dragon Ball", value: "Dragon Ball", url: "http://truyentuan.com/dragon-ball/" }, { label: "Dragon Drive", value: "Dragon Drive", url: "http://truyentuan.com/dragon-drive/" }, { label: "Dragon Quest: Dai no Daiboken", value: "Dragon Quest: Dai no Daiboken", url: "http://truyentuan.com/dragon-quest-dai-no-daiboken/" }, { label: "Dragon Who", value: "Dragon Who", url: "http://truyentuan.com/dragon-who/" }, { label: "Elfen Lied", value: "Elfen Lied", url: "http://truyentuan.com/elfen-lied/" }, { label: "Eternal Sabbath", value: "Eternal Sabbath", url: "http://truyentuan.com/eternal-sabbath/" }, { label: "Dolls", value: "Dolls", url: "http://truyentuan.com/dolls/" }, { label: "Doraemon", value: "Doraemon", url: "http://truyentuan.com/doraemon/" }, { label: "Doraemon Plus", value: "Doraemon Plus", url: "http://truyentuan.com/doraemon-plus/" }, { label: "Dororo", value: "Dororo", url: "http://truyentuan.com/dororo/" }, { label: "Doubt", value: "Doubt", url: "http://truyentuan.com/doubt/" }, { label: "Dr. Rurru", value: "Dr. Rurru", url: "http://truyentuan.com/dr-rurru/" }, { label: "Dragon Ball SD", value: "Dragon Ball SD", url: "http://truyentuan.com/dragon-ball-sd/" }, { label: "Dragon Ball x One Piece Cross Epoch", value: "Dragon Ball x One Piece Cross Epoch", url: "http://truyentuan.com/dragon-ball-x-one-piece-cross-epoch/" }, { label: "Enigma", value: "Enigma", url: "http://truyentuan.com/enigma/" }, { label: "Erementar Gerad", value: "Erementar Gerad", url: "http://truyentuan.com/erementar-gerad/" }, { label: "Eyeshield 21", value: "Eyeshield 21", url: "http://truyentuan.com/eyeshield-21/" }, { label: "Fairy Tail x Rave Crossover", value: "Fairy Tail x Rave Crossover", url: "http://truyentuan.com/fairy-tail-x-rave-crossover/" }, { label: "Fate/Kaleid Liner Prisma Illya", value: "Fate/Kaleid Liner Prisma Illya", url: "http://truyentuan.com/fatekaleid-liner-prisma-illya/" }, { label: "Fate/Stay Night", value: "Fate/Stay Night", url: "http://truyentuan.com/fatestay-night/" }, { label: "Fire Emblem - Hasha no Tsurugi", value: "Fire Emblem - Hasha no Tsurugi", url: "http://truyentuan.com/fire-emblem-hasha-no-tsurugi/" }, { label: "Flame of Recca", value: "Flame of Recca", url: "http://truyentuan.com/flame-of-recca/" }, { label: "Fly High!", value: "Fly High!", url: "http://truyentuan.com/fly-high/" }, { label: "Forest of Lore", value: "Forest of Lore", url: "http://truyentuan.com/forest-of-lore/" }, { label: "Franken Fran", value: "Franken Fran", url: "http://truyentuan.com/franken-fran/" }, { label: "Freezing", value: "Freezing", url: "http://truyentuan.com/freezing/" }, { label: "Frogman", value: "Frogman", url: "http://truyentuan.com/frogman/" }, { label: "Fujimura-kun Meitsu", value: "Fujimura-kun Meitsu", url: "http://truyentuan.com/fujimura-kun-meitsu/" }, { label: "Fullmetal Alchemist", value: "Fullmetal Alchemist", url: "http://truyentuan.com/fullmetal-alchemist/" }, { label: "Giri Koi", value: "Giri Koi", url: "http://truyentuan.com/giri-koi/" }, { label: "Girl The Wild's", value: "Girl The Wild's", url: "http://truyentuan.com/girl-the-wilds/" }, { label: "Glass Mask", value: "Glass Mask", url: "http://truyentuan.com/glass-mask/" }, { label: "God Eater - The Summer Wars", value: "God Eater - The Summer Wars", url: "http://truyentuan.com/god-eater-the-summer-wars/" }, { label: "God's Left Hand, Devil's Right Hand", value: "God's Left Hand, Devil's Right Hand", url: "http://truyentuan.com/gods-left-hand-devils-right-hand/" }, { label: "Golden Days", value: "Golden Days", url: "http://truyentuan.com/golden-days/" }, { label: "Good Ending", value: "Good Ending", url: "http://truyentuan.com/good-ending/" }, { label: "Good Ending One Shot", value: "Good Ending One Shot", url: "http://truyentuan.com/good-ending-one-shot/" }, { label: "Goumaden Shutendoji", value: "Goumaden Shutendoji", url: "http://truyentuan.com/goumaden-shutendoji/" }, { label: "Great Teacher Onizuka", value: "Great Teacher Onizuka", url: "http://truyentuan.com/great-teacher-onizuka/" }, { label: "GT-R - Great Transporter Ryuji", value: "GT-R - Great Transporter Ryuji", url: "http://truyentuan.com/gt-r-great-transporter-ryuji/" }, { label: "GTO: Shonan 14 Days", value: "GTO: Shonan 14 Days", url: "http://truyentuan.com/gto-shonan-14-days/" }, { label: "Guardian Dog", value: "Guardian Dog", url: "http://truyentuan.com/guardian-dog/" }, { label: "Gwisin Byeolgok", value: "Gwisin Byeolgok", url: "http://truyentuan.com/gwisin-byeolgok/" }, { label: "Y Đội Rồng", value: "Y Đội Rồng", url: "http://truyentuan.com/y-doi-rong/" }, { label: "Yakitate!! Japan", value: "Yakitate!! Japan", url: "http://truyentuan.com/yakitate-japan/" }, { label: "Yamada-kun to 7-nin no Majo", value: "Yamada-kun to 7-nin no Majo", url: "http://truyentuan.com/yamada-kun-to-7-nin-no-majo/" }, { label: "Yomeiro Choice", value: "Yomeiro Choice", url: "http://truyentuan.com/yomeiro-choice/" }, { label: "Yoningurashi", value: "Yoningurashi", url: "http://truyentuan.com/yoningurashi/" }, { label: "Yosuga no Sora", value: "Yosuga no Sora", url: "http://truyentuan.com/yosuga-no-sora/" }, { label: "Yotsuba&!", value: "Yotsuba&!", url: "http://truyentuan.com/yotsuba/" }, { label: "Youkai Doctor", value: "Youkai Doctor", url: "http://truyentuan.com/youkai-doctor/" }, { label: "Yu Yu Hakusho", value: "Yu Yu Hakusho", url: "http://truyentuan.com/yu-yu-hakusho/" }, { label: "Yu-Gi-Oh!", value: "Yu-Gi-Oh!", url: "http://truyentuan.com/yu-gi-oh/" }, { label: "Yu-Gi-Oh! GX", value: "Yu-Gi-Oh! GX", url: "http://truyentuan.com/yu-gi-oh-gx/" }, { label: "XO Sisters", value: "XO Sisters", url: "http://truyentuan.com/xo-sisters/" }, { label: "Xuân Thu Chiến Hùng", value: "Xuân Thu Chiến Hùng", url: "http://truyentuan.com/xuan-thu-chien-hung/" }, { label: "xxxHolic", value: "xxxHolic", url: "http://truyentuan.com/xxxholic/" }, { label: "Wake Up Deadman", value: "Wake Up Deadman", url: "http://truyentuan.com/wake-up-deadman/" }, { label: "Watashi ni XX Shinasai!", value: "Watashi ni XX Shinasai!", url: "http://truyentuan.com/watashi-ni-xx-shinasai/" }, { label: "Western Shotgun", value: "Western Shotgun", url: "http://truyentuan.com/western-shotgun/" }, { label: "Whistle - Cơn Lốc Sân Cỏ", value: "Whistle - Cơn Lốc Sân Cỏ", url: "http://truyentuan.com/whistle-con-loc-san-co/" }, { label: "Witch Hunter", value: "Witch Hunter", url: "http://truyentuan.com/witch-hunter/" }, { label: "Wonderful Wonder World", value: "Wonderful Wonder World", url: "http://truyentuan.com/wonderful-wonder-world/" }, { label: "World Embryo", value: "World Embryo", url: "http://truyentuan.com/world-embryo/" }, { label: "Worst", value: "Worst", url: "http://truyentuan.com/worst/" }, { label: "Vũ Điệu Trên Sân Cỏ - Fantasista", value: "Vũ Điệu Trên Sân Cỏ - Fantasista", url: "http://truyentuan.com/vu-dieu-tren-san-co-fantasista/" }, { label: "Vagabond (Lãng Khách)", value: "Vagabond (Lãng Khách)", url: "http://truyentuan.com/vagabond-lang-khach/" }, { label: "Võ Thần 300", value: "Võ Thần 300", url: "http://truyentuan.com/vo-than-300/" }, { label: "Vampire Knight", value: "Vampire Knight", url: "http://truyentuan.com/vampire-knight/" }, { label: "Võ Thần Phượng Hoàng", value: "Võ Thần Phượng Hoàng", url: "http://truyentuan.com/vo-than-phuong-hoang/" }, { label: "Võ Thần Chung Cực", value: "Võ Thần Chung Cực", url: "http://truyentuan.com/vo-than-chung-cuc/" }, { label: "Võ Thần Hải Hổ - Địa Ngục", value: "Võ Thần Hải Hổ - Địa Ngục", url: "http://truyentuan.com/vo-than-hai-ho-dia-nguc/" }, { label: "Vương Phong Lôi I", value: "Vương Phong Lôi I", url: "http://truyentuan.com/vuong-phong-loi-i/" }, { label: "Vương Phong Lôi II", value: "Vương Phong Lôi II", url: "http://truyentuan.com/vuong-phong-loi-ii/" }, { label: "Veritas", value: "Veritas", url: "http://truyentuan.com/veritas/" }, { label: "Vinland Saga", value: "Vinland Saga", url: "http://truyentuan.com/vinland-saga/" }, { label: "I-Revo", value: "I-Revo", url: "http://truyentuan.com/i-revo/" }, { label: 'I"S', value: 'I"S', url: "http://truyentuan.com/is/" }, { label: "Ubel Blatt", value: "Ubel Blatt", url: "http://truyentuan.com/ubel-blatt/" }, { label: "Ultimate!! Hentai Kamen", value: "Ultimate!! Hentai Kamen", url: "http://truyentuan.com/ultimate-hentai-kamen/" }, { label: "Ultra Maniac", value: "Ultra Maniac", url: "http://truyentuan.com/ultra-maniac/" }, { label: "Umi no Misaki", value: "Umi no Misaki", url: "http://truyentuan.com/umi-no-misaki/" }, { label: "Umi no Yami, Tsuki no Kage", value: "Umi no Yami, Tsuki no Kage", url: "http://truyentuan.com/umi-no-yami-tsuki-no-kage/" }, { label: "Unbalance X Unbalance", value: "Unbalance X Unbalance", url: "http://truyentuan.com/unbalance-x-unbalance/" }, { label: "Until Death Do Us Part", value: "Until Death Do Us Part", url: "http://truyentuan.com/until-death-do-us-part/" }, { label: "Urusei Yatsura", value: "Urusei Yatsura", url: "http://truyentuan.com/urusei-yatsura/" }, { label: "Ushio & Tora", value: "Ushio & Tora", url: "http://truyentuan.com/ushio-tora/" }, { label: "Uzumaki", value: "Uzumaki", url: "http://truyentuan.com/uzumaki/" }, { label: "Tà Thần", value: "Tà Thần", url: "http://truyentuan.com/ta-than/" }, { label: "Tứ Đại Danh Bổ", value: "Tứ Đại Danh Bổ", url: "http://truyentuan.com/tu-dai-danh-bo/" }, { label: "Tân Tác Long Hổ Môn", value: "Tân Tác Long Hổ Môn", url: "http://truyentuan.com/tan-tac-long-ho-mon/" }, { label: "Tam Quốc Kiêu Hoàng", value: "Tam Quốc Kiêu Hoàng", url: "http://truyentuan.com/tam-quoc-kieu-hoang/" }, { label: "Tầm Tần Ký", value: "Tầm Tần Ký", url: "http://truyentuan.com/tam-tan-ky/" }, { label: "Tasogare Otome x Amnesia", value: "Tasogare Otome x Amnesia", url: "http://truyentuan.com/tasogare-otome-x-amnesia/" }, { label: "Tende Freeze", value: "Tende Freeze", url: "http://truyentuan.com/tende-freeze/" }, { label: "Tenkuu no Hasha Z", value: "Tenkuu no Hasha Z", url: "http://truyentuan.com/tenkuu-no-hasha-z/" }, { label: "Thích Hoàng", value: "Thích Hoàng", url: "http://truyentuan.com/thich-hoang/" }, { label: "Thạch Hắc Long Truyện", value: "Thạch Hắc Long Truyện", url: "http://truyentuan.com/thach-hac-long-truyen/" }, { label: "Thần Binh 4", value: "Thần Binh 4", url: "http://truyentuan.com/than-binh-4/" }, { label: "Thần Binh Huyền Kỳ II", value: "Thần Binh Huyền Kỳ II", url: "http://truyentuan.com/than-binh-huyen-ky-ii/" }, { label: "Thần chết và 4 cô bạn gái", value: "Thần chết và 4 cô bạn gái", url: "http://truyentuan.com/than-chet-va-4-co-ban-gai/" }, { label: "Thần Chưởng Long Cửu Châu", value: "Thần Chưởng Long Cửu Châu", url: "http://truyentuan.com/than-chuong-long-cuu-chau/" }, { label: "Thất Chủng Binh Khí", value: "Thất Chủng Binh Khí", url: "http://truyentuan.com/that-chung-binh-khi/" }, { label: "Thương Thiên Bá Hoàng", value: "Thương Thiên Bá Hoàng", url: "http://truyentuan.com/thuong-thien-ba-hoang/" }, { label: "The Breaker", value: "The Breaker", url: "http://truyentuan.com/the-breaker/" }, { label: "The Breaker: New Waves", value: "The Breaker: New Waves", url: "http://truyentuan.com/the-breaker-new-waves/" }, { label: "Ichigo 100%", value: "Ichigo 100%", url: "http://truyentuan.com/ichigo-100/" }, { label: "Id - The Greatest Fusion Fantasy", value: "Id - The Greatest Fusion Fantasy", url: "http://truyentuan.com/id-the-greatest-fusion-fantasy/" }, { label: "Ikkitousen", value: "Ikkitousen", url: "http://truyentuan.com/ikkitousen/" }, { label: "Immortal Regis", value: "Immortal Regis", url: "http://truyentuan.com/immortal-regis/" }, { label: "The Bug Boy", value: "The Bug Boy", url: "http://truyentuan.com/the-bug-boy/" }, { label: "The Gentlemen's Alliance Cross", value: "The Gentlemen's Alliance Cross", url: "http://truyentuan.com/the-gentlemens-alliance-cross/" }, { label: "The God Of High School", value: "The God Of High School", url: "http://truyentuan.com/the-god-of-high-school/" }, { label: "The Horror Mansion", value: "The Horror Mansion", url: "http://truyentuan.com/the-horror-mansion/" }, { label: "The Legend of Maian", value: "The Legend of Maian", url: "http://truyentuan.com/the-legend-of-maian/" }, { label: "The Prince's Cactus", value: "The Prince's Cactus", url: "http://truyentuan.com/the-princes-cactus/" }, { label: "The Ring", value: "The Ring", url: "http://truyentuan.com/the-ring/" }, { label: "The Walking Dead", value: "The Walking Dead", url: "http://truyentuan.com/the-walking-dead/" }, { label: "The World God Only Knows (Kami nomi zo Shiru Sekai)", value: "The World God Only Knows (Kami nomi zo Shiru Sekai)", url: "http://truyentuan.com/the-world-god-only-knows-kami-nomi-zo-shiru-sekai/" }, { label: "Thi Quỷ", value: "Thi Quỷ", url: "http://truyentuan.com/thi-quy/" }, { label: "Thiên Long Bát Bộ", value: "Thiên Long Bát Bộ", url: "http://truyentuan.com/thien-long-bat-bo/" }, { label: "Thiên Tằm Biến", value: "Thiên Tằm Biến", url: "http://truyentuan.com/thien-tam-bien/" }, { label: "Thiết Huyết Nam Nhi", value: "Thiết Huyết Nam Nhi", url: "http://truyentuan.com/thiet-huyet-nam-nhi/" }, { label: "Thiếu Lâm Đệ 8 Đồng Nhân", value: "Thiếu Lâm Đệ 8 Đồng Nhân", url: "http://truyentuan.com/thieu-lam-de-8-dong-nhan/" }, { label: "Thiếu Lâm Đệ 8 Đồng Nhân Ngoại Truyện", value: "Thiếu Lâm Đệ 8 Đồng Nhân Ngoại Truyện", url: "http://truyentuan.com/thieu-lam-de-8-dong-nhan-ngoai-truyen/" }, { label: "Threads of Time", value: "Threads of Time", url: "http://truyentuan.com/threads-of-time/" }, { label: "Tiểu Đội UFO EXTRA", value: "Tiểu Đội UFO EXTRA", url: "http://truyentuan.com/tieu-doi-ufo-extra/" }, { label: "Tiểu Hoà Thượng", value: "Tiểu Hoà Thượng", url: "http://truyentuan.com/tieu-hoa-thuong/" }, { label: "To Aru Kagaku no Railgun", value: "To Aru Kagaku no Railgun", url: "http://truyentuan.com/to-aru-kagaku-no-railgun/" }, { label: "To Love-Ru", value: "To Love-Ru", url: "http://truyentuan.com/to-love-ru/" }, { label: "To Love-Ru Darkness", value: "To Love-Ru Darkness", url: "http://truyentuan.com/to-love-ru-darkness/" }, { label: "Tonari no Kaibutsu-kun", value: "Tonari no Kaibutsu-kun", url: "http://truyentuan.com/tonari-no-kaibutsu-kun/" }, { label: "Tonari no Kashiwagi-san", value: "Tonari no Kashiwagi-san", url: "http://truyentuan.com/tonari-no-kashiwagi-san/" }, { label: "Tonari no Seki-kun", value: "Tonari no Seki-kun", url: "http://truyentuan.com/tonari-no-seki-kun/" }, { label: "Toradora!", value: "Toradora!", url: "http://truyentuan.com/toradora/" }, { label: "Toriko", value: "Toriko", url: "http://truyentuan.com/toriko/" }, { label: "Touch", value: "Touch", url: "http://truyentuan.com/touch/" }, { label: "Tower Of God", value: "Tower Of God", url: "http://truyentuan.com/tower-of-god/" }, { label: "Trace", value: "Trace", url: "http://truyentuan.com/trace/" }, { label: "Trace (blogtruyen)", value: "Trace (blogtruyen)", url: "http://truyentuan.com/trace-blogtruyen/" }, { label: "Transfer Student Storm Bringer", value: "Transfer Student Storm Bringer", url: "http://truyentuan.com/transfer-student-storm-bringer/" }, { label: "Trinity Seven: 7-Nin no Mahoutsukai ", value: "Trinity Seven: 7-Nin no Mahoutsukai ", url: "http://truyentuan.com/trinity-seven-7-nin-no-mahoutsukai/" }, { label: "Tru Tiên", value: "Tru Tiên", url: "http://truyentuan.com/tru-tien/" }, { label: "Tsubasa Reservoir Chronicle", value: "Tsubasa Reservoir Chronicle", url: "http://truyentuan.com/tsubasa-reservoir-chronicle/" }, { label: "Tsuki Tsuki!", value: "Tsuki Tsuki!", url: "http://truyentuan.com/tsuki-tsuki/" }, { label: "Sáng Thế Thần Binh", value: "Sáng Thế Thần Binh", url: "http://truyentuan.com/sang-the-than-binh/" }, { label: "Sát Đạo Hành Giả", value: "Sát Đạo Hành Giả", url: "http://truyentuan.com/sat-dao-hanh-gia/" }, { label: "Sói Mang Con", value: "Sói Mang Con", url: "http://truyentuan.com/soi-mang-con/" }, { label: "Sakamichi no Apollon", value: "Sakamichi no Apollon", url: "http://truyentuan.com/sakamichi-no-apollon/" }, { label: "Mai-HiME", value: "Mai-HiME", url: "http://truyentuan.com/mai-hime/" }, { label: "Mail", value: "Mail", url: "http://truyentuan.com/mail/" }, { label: "Tuyệt Thế Vô Song", value: "Tuyệt Thế Vô Song", url: "http://truyentuan.com/tuyet-the-vo-song/" }, { label: "Sakon", value: "Sakon", url: "http://truyentuan.com/sakon/" }, { label: "Samurai Deeper Kyo", value: "Samurai Deeper Kyo", url: "http://truyentuan.com/samurai-deeper-kyo/" }, { label: "Samurai High School", value: "Samurai High School", url: "http://truyentuan.com/samurai-high-school/" }, { label: "Samurai Usagi", value: "Samurai Usagi", url: "http://truyentuan.com/samurai-usagi/" }, { label: "Sanctuary", value: "Sanctuary", url: "http://truyentuan.com/sanctuary/" }, { label: "Sankarea", value: "Sankarea", url: "http://truyentuan.com/sankarea/" }, { label: "Sanzokuou", value: "Sanzokuou", url: "http://truyentuan.com/sanzokuou/" }, { label: "Savage Garden - Vườn Hoang", value: "Savage Garden - Vườn Hoang", url: "http://truyentuan.com/savage-garden-vuon-hoang/" }, { label: "School Rumble", value: "School Rumble", url: "http://truyentuan.com/school-rumble/" }, { label: "Shounan Junaigumi!", value: "Shounan Junaigumi!", url: "http://truyentuan.com/shounan-junaigumi/" }, { label: "Slam Dunk", value: "Slam Dunk", url: "http://truyentuan.com/slam-dunk/" }, { label: "Song Hùng Kỳ Hiệp", value: "Song Hùng Kỳ Hiệp", url: "http://truyentuan.com/song-hung-ky-hiep/" }, { label: "Siêu Quậy Teppi", value: "Siêu Quậy Teppi", url: "http://truyentuan.com/sieu-quay-teppi/" }, { label: "School Shock", value: "School Shock", url: "http://truyentuan.com/school-shock/" }, { label: "Searching for Love, Miss Fool?", value: "Searching for Love, Miss Fool?", url: "http://truyentuan.com/searching-for-love-miss-fool/" }, { label: "Seishun For-get!", value: "Seishun For-get!", url: "http://truyentuan.com/seishun-for-get/" }, { label: "Sekirei", value: "Sekirei", url: "http://truyentuan.com/sekirei/" }, { label: "Shakugan no Shana", value: "Shakugan no Shana", url: "http://truyentuan.com/shakugan-no-shana/" }, { label: "Shaman King", value: "Shaman King", url: "http://truyentuan.com/shaman-king/" }, { label: "Shamo", value: "Shamo", url: "http://truyentuan.com/shamo/" }, { label: "Shana oh Yoshitsune (Thiếu Niên Vương)", value: "Shana oh Yoshitsune (Thiếu Niên Vương)", url: "http://truyentuan.com/shana-oh-yoshitsune-thieu-nien-vuong/" }, { label: "Shana oh Yoshitsune II (Thiếu Niên Vương 2)", value: "Shana oh Yoshitsune II (Thiếu Niên Vương 2)", url: "http://truyentuan.com/shana-oh-yoshitsune-ii-thieu-nien-vuong-2/" }, { label: "Shigurui - Cuồng Tử", value: "Shigurui - Cuồng Tử", url: "http://truyentuan.com/shigurui-cuong-tu/" }, { label: "Shingeki no Kyojin", value: "Shingeki no Kyojin", url: "http://truyentuan.com/shingeki-no-kyojin/" }, { label: "Shingeki no Kyojin - Before the fall", value: "Shingeki no Kyojin - Before the fall", url: "http://truyentuan.com/shingeki-no-kyojin-before-the-fall/" }, { label: "Shokugeki no Soma", value: "Shokugeki no Soma", url: "http://truyentuan.com/shokugeki-no-soma/" }, { label: "Shounen Dolls", value: "Shounen Dolls", url: "http://truyentuan.com/shounen-dolls/" }, { label: "Show Me the Money", value: "Show Me the Money", url: "http://truyentuan.com/show-me-the-money/" }, { label: "Shugo Chara", value: "Shugo Chara", url: "http://truyentuan.com/shugo-chara/" }, { label: "Shuukatsu!! - Kimi ni Naitei ", value: "Shuukatsu!! - Kimi ni Naitei ", url: "http://truyentuan.com/shuukatsu-kimi-ni-naitei/" }, { label: "Silver Spoon", value: "Silver Spoon", url: "http://truyentuan.com/silver-spoon/" }, { label: "Silvery Crow", value: "Silvery Crow", url: "http://truyentuan.com/silvery-crow/" }, { label: "Sket Dance", value: "Sket Dance", url: "http://truyentuan.com/sket-dance/" }, { label: "Skip Beat", value: "Skip Beat", url: "http://truyentuan.com/skip-beat/" }, { label: "Skyhigh", value: "Skyhigh", url: "http://truyentuan.com/skyhigh/" }, { label: "Skyhigh Karma", value: "Skyhigh Karma", url: "http://truyentuan.com/skyhigh-karma/" }, { label: "Slow Step", value: "Slow Step", url: "http://truyentuan.com/slow-step/" }, { label: "So Long, Mr. Despair", value: "So Long, Mr. Despair", url: "http://truyentuan.com/so-long-mr-despair/" }, { label: "Sora no Otoshimono", value: "Sora no Otoshimono", url: "http://truyentuan.com/sora-no-otoshimono/" }, { label: "Sora no Otoshimono (MTO)", value: "Sora no Otoshimono (MTO)", url: "http://truyentuan.com/sora-no-otoshimono-mto/" }, { label: "Sora Sora", value: "Sora Sora", url: "http://truyentuan.com/sora-sora/" }, { label: "Soul Cartel", value: "Soul Cartel", url: "http://truyentuan.com/soul-cartel/" }, { label: "Spas-pa", value: "Spas-pa", url: "http://truyentuan.com/spas-pa/" }, { label: "Sprite", value: "Sprite", url: "http://truyentuan.com/sprite/" }, { label: "St&rs", value: "St&rs", url: "http://truyentuan.com/strs/" }, { label: "Strain", value: "Strain", url: "http://truyentuan.com/strain/" }, { label: "Street Fighter", value: "Street Fighter", url: "http://truyentuan.com/street-fighter/" }, { label: "Strobe Edge", value: "Strobe Edge", url: "http://truyentuan.com/strobe-edge/" }, { label: "Sugar Dark", value: "Sugar Dark", url: "http://truyentuan.com/sugar-dark/" }, { label: "Sun-ken Rock", value: "Sun-ken Rock", url: "http://truyentuan.com/sun-ken-rock/" }, { label: "Sun-ken Rock (Amethyst)", value: "Sun-ken Rock (Amethyst)", url: "http://truyentuan.com/sun-ken-rock-amethyst/" }, { label: "Super Oresama Love Story", value: "Super Oresama Love Story", url: "http://truyentuan.com/super-oresama-love-story/" }, { label: "Suzuka", value: "Suzuka", url: "http://truyentuan.com/suzuka/" }, { label: "Switch girl!", value: "Switch girl!", url: "http://truyentuan.com/switch-girl/" }, { label: "SWOT", value: "SWOT", url: "http://truyentuan.com/swot/" }, { label: "Ragnarok - Into the Abyss", value: "Ragnarok - Into the Abyss", url: "http://truyentuan.com/ragnarok-into-the-abyss/" }, { label: "Rainbow", value: "Rainbow", url: "http://truyentuan.com/rainbow/" }, { label: "Ranma 1/2", value: "Ranma 1/2", url: "http://truyentuan.com/ranma-1-2/" }, { label: "Rappi Rangai", value: "Rappi Rangai", url: "http://truyentuan.com/rappi-rangai/" }, { label: "Ratman", value: "Ratman", url: "http://truyentuan.com/ratman/" }, { label: "Rave Master", value: "Rave Master", url: "http://truyentuan.com/rave-master/" }, { label: "RE:BIRTH - The Lunatic Taker", value: "RE:BIRTH - The Lunatic Taker", url: "http://truyentuan.com/rebirth-the-lunatic-taker/" }, { label: "Rorona no Atelier: Watashi no Takaramono", value: "Rorona no Atelier: Watashi no Takaramono", url: "http://truyentuan.com/rorona-no-atelier-watashi-no-takaramono/" }, { label: "Rosario+Vampire", value: "Rosario+Vampire", url: "http://truyentuan.com/rosariovampire/" }, { label: "Rosario+Vampire II", value: "Rosario+Vampire II", url: "http://truyentuan.com/rosariovampire-ii/" }, { label: "Rose Hip Rose", value: "Rose Hip Rose", url: "http://truyentuan.com/rose-hip-rose/" }, { label: "Rose Hip Zero", value: "Rose Hip Zero", url: "http://truyentuan.com/rose-hip-zero/" }, { label: "Paladin", value: "Paladin", url: "http://truyentuan.com/paladin/" }, { label: "Pandora Hearts", value: "Pandora Hearts", url: "http://truyentuan.com/pandora-hearts/" }, { label: "Parallel", value: "Parallel", url: "http://truyentuan.com/parallel/" }, { label: "Pastel", value: "Pastel", url: "http://truyentuan.com/pastel/" }, { label: "Penguin Brothers", value: "Penguin Brothers", url: "http://truyentuan.com/penguin-brothers/" }, { label: "Persona 3", value: "Persona 3", url: "http://truyentuan.com/persona-3/" }, { label: "Phong Lôi", value: "Phong Lôi", url: "http://truyentuan.com/phong-loi/" }, { label: "Phong Thần Ký", value: "Phong Thần Ký", url: "http://truyentuan.com/phong-than-ky/" }, { label: "Phong Vân", value: "Phong Vân", url: "http://truyentuan.com/phong-van/" }, { label: "Phong Vân Tân Tác Thần Võ Ký", value: "Phong Vân Tân Tác Thần Võ Ký", url: "http://truyentuan.com/phong-van-tan-tac-than-vo-ky/" }, { label: "Ping", value: "Ping", url: "http://truyentuan.com/ping/" }, { label: "Pink Lady", value: "Pink Lady", url: "http://truyentuan.com/pink-lady/" }, { label: "Pluto", value: "Pluto", url: "http://truyentuan.com/pluto/" }, { label: "Pokémon Pocket Monsters", value: "Pokémon Pocket Monsters", url: "http://truyentuan.com/pokemon-pocket-monsters/" }, { label: "Power!!", value: "Power!!", url: "http://truyentuan.com/power/" }, { label: "Present", value: "Present", url: "http://truyentuan.com/present/" }, { label: "Prince of Tennis", value: "Prince of Tennis", url: "http://truyentuan.com/prince-of-tennis/" }, { label: "Prison School", value: "Prison School", url: "http://truyentuan.com/prison-school/" }, { label: "Prunus Girl", value: "Prunus Girl", url: "http://truyentuan.com/prunus-girl/" }, { label: "Psycho Pass", value: "Psycho Pass", url: "http://truyentuan.com/psycho-pass/" }, { label: "Psychometrer Eiji", value: "Psychometrer Eiji", url: "http://truyentuan.com/psychometrer-eiji/" }, { label: "Psyren", value: "Psyren", url: "http://truyentuan.com/psyren/" }, { label: "Q&A", value: "Q&A", url: "http://truyentuan.com/qa/" }, { label: "Old Boy", value: "Old Boy", url: "http://truyentuan.com/old-boy/" }, { label: "Omamori Himari", value: "Omamori Himari", url: "http://truyentuan.com/omamori-himari/" }, { label: "One Piece x Toriko", value: "One Piece x Toriko", url: "http://truyentuan.com/one-piece-x-toriko/" }, { label: "Onepunch-Man", value: "Onepunch-Man", url: "http://truyentuan.com/onepunch-man/" }, { label: "Ong Đưa Thư", value: "Ong Đưa Thư", url: "http://truyentuan.com/ong-dua-thu/" }, { label: "Onii-chan Em Ghét Anh!", value: "Onii-chan Em Ghét Anh!", url: "http://truyentuan.com/onii-chan-em-ghet-anh/" }, { label: "Oresama Teacher", value: "Oresama Teacher", url: "http://truyentuan.com/oresama-teacher/" }, { label: "Orochi", value: "Orochi", url: "http://truyentuan.com/orochi/" }, { label: "Otogi Matsuri", value: "Otogi Matsuri", url: "http://truyentuan.com/otogi-matsuri/" }, { label: "Otoyomegatari", value: "Otoyomegatari", url: "http://truyentuan.com/otoyomegatari/" }, { label: "Ouke no Monshou - Nữ Hoàng Ai Cập", value: "Ouke no Monshou - Nữ Hoàng Ai Cập", url: "http://truyentuan.com/ouke-no-monshou-nu-hoang-ai-cap/" }, { label: "Our Happy Hours", value: "Our Happy Hours", url: "http://truyentuan.com/our-happy-hours/" }, { label: "Nabari no Ou", value: "Nabari no Ou", url: "http://truyentuan.com/nabari-no-ou/" }, { label: "Nagasarete Airantou", value: "Nagasarete Airantou", url: "http://truyentuan.com/nagasarete-airantou/" }, { label: "Nana", value: "Nana", url: "http://truyentuan.com/nana/" }, { label: "Natsume Yuujinchou", value: "Natsume Yuujinchou", url: "http://truyentuan.com/natsume-yuujinchou/" }, { label: "Nephilim", value: "Nephilim", url: "http://truyentuan.com/nephilim/" }, { label: "New Prince of Tennis", value: "New Prince of Tennis", url: "http://truyentuan.com/new-prince-of-tennis/" }, { label: "Như Lai Thần Chưởng", value: "Như Lai Thần Chưởng", url: "http://truyentuan.com/nhu-lai-than-chuong/" }, { label: "Nine", value: "Nine", url: "http://truyentuan.com/nine/" }, { label: "Nineteen, Twenty-one", value: "Nineteen, Twenty-one", url: "http://truyentuan.com/nineteen-twenty-one/" }, { label: "Nise Koi", value: "Nise Koi", url: "http://truyentuan.com/nise-koi/" }, { label: "Nise Koi (One Shot)", value: "Nise Koi (One Shot)", url: "http://truyentuan.com/nise-koi-one-shot/" }, { label: "Noblesse", value: "Noblesse", url: "http://truyentuan.com/noblesse/" }, { label: "Nodame Cantabile", value: "Nodame Cantabile", url: "http://truyentuan.com/nodame-cantabile/" }, { label: "Number", value: "Number", url: "http://truyentuan.com/number/" }, { label: "Nyankoi!", value: "Nyankoi!", url: "http://truyentuan.com/nyankoi/" }, { label: "Jackals", value: "Jackals", url: "http://truyentuan.com/jackals/" }, { label: "Jisatsu Circle (Vòng Quay Tự Sát)", value: "Jisatsu Circle (Vòng Quay Tự Sát)", url: "http://truyentuan.com/jisatsu-circle-vong-quay-tu-sat/" }, { label: "JoJo's Bizarre Adventure", value: "JoJo's Bizarre Adventure", url: "http://truyentuan.com/jojos-bizarre-adventure/" }, { label: "Joshikousei", value: "Joshikousei", url: "http://truyentuan.com/joshikousei/" }, { label: "K-On!", value: "K-On!", url: "http://truyentuan.com/k-on/" }, { label: "Kamen Teacher", value: "Kamen Teacher", url: "http://truyentuan.com/kamen-teacher/" }, { label: "Kamen Teacher Black", value: "Kamen Teacher Black", url: "http://truyentuan.com/kamen-teacher-black/" }, { label: "Kamisama Hajimemashita", value: "Kamisama Hajimemashita", url: "http://truyentuan.com/kamisama-hajimemashita/" }, { label: "Kandachime", value: "Kandachime", url: "http://truyentuan.com/kandachime/" }, { label: "Karate Shoukoushi Kohinata Minoru", value: "Karate Shoukoushi Kohinata Minoru", url: "http://truyentuan.com/karate-shoukoushi-kohinata-minoru/" }, { label: "Karin", value: "Karin", url: "http://truyentuan.com/karin/" }, { label: "Kateikyoushi Hitman Reborn", value: "Kateikyoushi Hitman Reborn", url: "http://truyentuan.com/kateikyoushi-hitman-reborn/" }, { label: "Kateikyoushi Hitman Reborn Special Racer", value: "Kateikyoushi Hitman Reborn Special Racer", url: "http://truyentuan.com/kateikyoushi-hitman-reborn-special-racer/" }, { label: "Kaze Hikaru", value: "Kaze Hikaru", url: "http://truyentuan.com/kaze-hikaru/" }, { label: "Kekkaishi", value: "Kekkaishi", url: "http://truyentuan.com/kekkaishi/" }, { label: "Kenji", value: "Kenji", url: "http://truyentuan.com/kenji/" }, { label: "Kenji Ngoại Truyện", value: "Kenji Ngoại Truyện", url: "http://truyentuan.com/kenji-ngoai-truyen/" }, { label: "Kid Gang", value: "Kid Gang", url: "http://truyentuan.com/kid-gang/" }, { label: "Kimi ni Todoke", value: "Kimi ni Todoke", url: "http://truyentuan.com/kimi-ni-todoke/" }, { label: "Kimi to Koi no Tochuu", value: "Kimi to Koi no Tochuu", url: "http://truyentuan.com/kimi-to-koi-no-tochuu/" }, { label: "King of Fighters Kyo", value: "King of Fighters Kyo", url: "http://truyentuan.com/king-of-fighters-kyo/" }, { label: "Kingdom Hearts", value: "Kingdom Hearts", url: "http://truyentuan.com/kingdom-hearts/" }, { label: "Kinnikuman", value: "Kinnikuman", url: "http://truyentuan.com/kinnikuman/" }, { label: "Kiseijuu", value: "Kiseijuu", url: "http://truyentuan.com/kiseijuu/" }, { label: "Kitchen Princess", value: "Kitchen Princess", url: "http://truyentuan.com/kitchen-princess/" }, { label: "Koe de Oshigoto!", value: "Koe de Oshigoto!", url: "http://truyentuan.com/koe-de-oshigoto/" }, { label: "Koi Neko", value: "Koi Neko", url: "http://truyentuan.com/koi-neko/" }, { label: "Koko Tekken-den TOUGH", value: "Koko Tekken-den TOUGH", url: "http://truyentuan.com/koko-tekken-den-tough/" }, { label: "Kongou Banchou", value: "Kongou Banchou", url: "http://truyentuan.com/kongou-banchou/" }, { label: "Kotaro Makaritoru", value: "Kotaro Makaritoru", url: "http://truyentuan.com/kotaro-makaritoru/" }, { label: "Kungfu", value: "Kungfu", url: "http://truyentuan.com/kungfu/" }, { label: "Kurogane", value: "Kurogane", url: "http://truyentuan.com/kurogane/" }, { label: "Kurohime", value: "Kurohime", url: "http://truyentuan.com/kurohime/" }, { label: "Kuroko no Basket", value: "Kuroko no Basket", url: "http://truyentuan.com/kuroko-no-basket/" }, { label: "Kurosagi: The Black Swindler", value: "Kurosagi: The Black Swindler", url: "http://truyentuan.com/kurosagi-the-black-swindler/" }, { label: "Kyou, Koi wo Hajimemasu", value: "Kyou, Koi wo Hajimemasu", url: "http://truyentuan.com/kyou-koi-wo-hajimemasu/" }, { label: "Kyoukai no Rinne", value: "Kyoukai no Rinne", url: "http://truyentuan.com/kyoukai-no-rinne/" }, { label: "Mangaka-san to Assistant-san to", value: "Mangaka-san to Assistant-san to", url: "http://truyentuan.com/mangaka-san-to-assistant-san-to/" }, { label: "Manhole", value: "Manhole", url: "http://truyentuan.com/manhole/" }, { label: "Maoh: Juvenile Remix", value: "Maoh: Juvenile Remix", url: "http://truyentuan.com/maoh-juvenile-remix/" }, { label: 'Maoyuu Maoh Yuusha - "Kono Watashi no Mono Tonare, Yuusha yo" "Kotowaru!"', value: 'Maoyuu Maoh Yuusha - "Kono Watashi no Mono Tonare, Yuusha yo" "Kotowaru!"', url: "http://truyentuan.com/maoyuu-maoh-yuusha-kono-watashi-no-mono-tonare-yuusha-yo-kotowaru/" }, { label: "MAR", value: "MAR", url: "http://truyentuan.com/mar/" }, { label: "Marmalade Boy", value: "Marmalade Boy", url: "http://truyentuan.com/marmalade-boy/" }, { label: "Max Lovely", value: "Max Lovely", url: "http://truyentuan.com/max-lovely/" }, { label: "Me wo Mite Hanase (Hãy Nhìn Vào Mắt Em Khi Anh Nói)", value: "Me wo Mite Hanase (Hãy Nhìn Vào Mắt Em Khi Anh Nói)", url: "http://truyentuan.com/me-wo-mite-hanase-hay-nhin-vao-mat-em-khi-anh-noi/" }, { label: "Medaka Box", value: "Medaka Box", url: "http://truyentuan.com/medaka-box/" }, { label: "Melty Blood", value: "Melty Blood", url: "http://truyentuan.com/melty-blood/" }, { label: "Mermaid Saga", value: "Mermaid Saga", url: "http://truyentuan.com/mermaid-saga/" }, { label: "Merupuri", value: "Merupuri", url: "http://truyentuan.com/merupuri/" }, { label: "Midori no Hibi", value: "Midori no Hibi", url: "http://truyentuan.com/midori-no-hibi/" }, { label: "Minami-ke", value: "Minami-ke", url: "http://truyentuan.com/minami-ke/" }, { label: "Minamoto-kun Monogatari", value: "Minamoto-kun Monogatari", url: "http://truyentuan.com/minamoto-kun-monogatari/" }, { label: "Mister Ajikko", value: "Mister Ajikko", url: "http://truyentuan.com/mister-ajikko/" }, { label: "MIXiM★11", value: "MIXiM★11", url: "http://truyentuan.com/mixim%e2%98%8511/" }, { label: "Miyuki", value: "Miyuki", url: "http://truyentuan.com/miyuki/" }, { label: "Moe Kare!!", value: "Moe Kare!!", url: "http://truyentuan.com/moe-kare/" }, { label: "Momo", value: "Momo", url: "http://truyentuan.com/momo/" }, { label: "Monk", value: "Monk", url: "http://truyentuan.com/monk/" }, { label: "Monster Soul", value: "Monster Soul", url: "http://truyentuan.com/monster-soul/" }, { label: "Mr. Fullswing", value: "Mr. Fullswing", url: "http://truyentuan.com/mr-fullswing/" }, { label: "Musashi Number Nine", value: "Musashi Number Nine", url: "http://truyentuan.com/musashi-number-nine/" }, { label: "Muv-Luv Alternative", value: "Muv-Luv Alternative", url: "http://truyentuan.com/muv-luv-alternative/" }, { label: "Mx0", value: "Mx0", url: "http://truyentuan.com/mx0/" }, { label: "My Little Sister Can't Be This Cute", value: "My Little Sister Can't Be This Cute", url: "http://truyentuan.com/my-little-sister-cant-be-this-cute/" }, { label: "Mysterious Girlfriend X", value: "Mysterious Girlfriend X", url: "http://truyentuan.com/mysterious-girlfriend-x/" }, { label: "Infinite Stratos", value: "Infinite Stratos", url: "http://truyentuan.com/infinite-stratos/" }, { label: "Into the Forest of Fireflies' Light", value: "Into the Forest of Fireflies' Light", url: "http://truyentuan.com/into-the-forest-of-fireflies-light/" }, { label: "Inu Yasha", value: "Inu Yasha", url: "http://truyentuan.com/inu-yasha/" }, { label: "Iris Zero", value: "Iris Zero", url: "http://truyentuan.com/iris-zero/" }, { label: "Isuca", value: "Isuca", url: "http://truyentuan.com/isuca/" }, { label: "It Started With a Kiss", value: "It Started With a Kiss", url: "http://truyentuan.com/it-started-with-a-kiss/" }, { label: "It's Not My Fault That I'm Not Popular!", value: "It's Not My Fault That I'm Not Popular!", url: "http://truyentuan.com/its-not-my-fault-that-im-not-popular/" }, { label: "Ỷ Thiên Đồ Long Ký", value: "Ỷ Thiên Đồ Long Ký", url: "http://truyentuan.com/y-thien-do-long-ky/" }, { label: "Đất Rồng", value: "Đất Rồng", url: "http://truyentuan.com/dat-rong/" }, { label: "Đấu La Đại Lục", value: "Đấu La Đại Lục", url: "http://truyentuan.com/dau-la-dai-luc/" }, { label: "Đấu Phá Thương Khung", value: "Đấu Phá Thương Khung", url: "http://truyentuan.com/dau-pha-thuong-khung/" }, { label: "Ganbare Genki - Khát Vọng Vô Địch", value: "Ganbare Genki - Khát Vọng Vô Địch", url: "http://truyentuan.com/ganbare-genki-khat-vong-vo-dich/" }, { label: "Claymore", value: "Claymore", url: "http://truyentuan.com/claymore/" }, { label: "Ô Long Viện 2", value: "Ô Long Viện 2", url: "http://truyentuan.com/o-long-vien-2/" }, { label: "Bitagi - Anh Chàng Ngổ Ngáo", value: "Bitagi - Anh Chàng Ngổ Ngáo", url: "http://truyentuan.com/bitagi-anh-chang-ngo-ngao/" }, { label: "The Devil King Is Bored", value: "The Devil King Is Bored", url: "http://truyentuan.com/the-devil-king-is-bored/" }, { label: "Dengeki Daisy", value: "Dengeki Daisy", url: "http://truyentuan.com/dengeki-daisy/" }, { label: "Hàng Xóm Của Tôi Là Rồng", value: "Hàng Xóm Của Tôi Là Rồng", url: "http://truyentuan.com/hang-xom-cua-toi-la-rong/" }, { label: "Denpa Kyoushi", value: "Denpa Kyoushi", url: "http://truyentuan.com/denpa-kyoushi/" }, { label: "Terra Formars", value: "Terra Formars", url: "http://truyentuan.com/terra-formars/" }, { label: "Nanatsu no Taizai", value: "Nanatsu no Taizai", url: "http://truyentuan.com/nanatsu-no-taizai/" }, { label: "Rakshasa Street", value: "Rakshasa Street", url: "http://truyentuan.com/rakshasa-street/" }, { label: "Examurai", value: "Examurai", url: "http://truyentuan.com/examurai/" }, { label: "Nobunaga no Chef", value: "Nobunaga no Chef", url: "http://truyentuan.com/nobunaga-chef/" }, { label: "Area D", value: "Area D", url: "http://truyentuan.com/area-d/" }, { label: "UQ Holder!", value: "UQ Holder!", url: "http://truyentuan.com/uq-holder/" }, { label: "Donyatsu", value: "Donyatsu", url: "http://truyentuan.com/donyatsu/" }, { label: "Lục Đạo Thiên Thư", value: "Lục Đạo Thiên Thư", url: "http://truyentuan.com/luc-dao-thien-thu/" }, { label: "The Gamer", value: "The Gamer", url: "http://truyentuan.com/the-gamer/" }, { label: "Mangaka-san to Assistant-san to 2", value: "Mangaka-san to Assistant-san to 2", url: "http://truyentuan.com/mangaka-san-to-assistant-san-to-2/" }, { label: "Flags", value: "Flags", url: "http://truyentuan.com/flags/" }, { label: "Inaba Rabbits", value: "Inaba Rabbits", url: "http://truyentuan.com/inaba-rabbits/" }, { label: "Iron Knight", value: "Iron Knight", url: "http://truyentuan.com/iron-knight/" }, { label: "Dragon Recipe", value: "Dragon Recipe", url: "http://truyentuan.com/dragon-recipe/" }, { label: "Fantasma", value: "Fantasma", url: "http://truyentuan.com/fantasma/" }, { label: "World Trigger", value: "World Trigger", url: "http://truyentuan.com/world-trigger/" }, { label: "DICE", value: "DICE", url: "http://truyentuan.com/dice/" }, { label: "All You Need Is Kill", value: "All You Need Is Kill", url: "http://truyentuan.com/all-you-need-is-kill/" }, { label: "Aiki-S", value: "Aiki-S", url: "http://truyentuan.com/aiki-s/" }, { label: "Shaman King: Flowers", value: "Shaman King: Flowers", url: "http://truyentuan.com/shaman-king-flowers/" }, { label: "Adventure of Sinbad", value: "Adventure of Sinbad", url: "http://truyentuan.com/adventure-of-sinbad/" }, { label: "Area D (DP)", value: "Area D (DP)", url: "http://truyentuan.com/area-d-dp/" }, { label: "Túy Quyền", value: "Túy Quyền", url: "http://truyentuan.com/tuy-quyen/" }, { label: "Aho Girl", value: "Aho Girl", url: "http://truyentuan.com/aho-girl/" }, { label: "Dragons Rioting", value: "Dragons Rioting", url: "http://truyentuan.com/dragons-rioting/" }, { label: "Demon King Daimao", value: "Demon King Daimao", url: "http://truyentuan.com/demon-king-daimao/" }, { label: "Thôn Phệ Tinh Không", value: "Thôn Phệ Tinh Không", url: "http://truyentuan.com/thon-phe-tinh-khong/" }, { label: "Shin Kurosagi: Con Diệc Đen 2", value: "Shin Kurosagi: Con Diệc Đen 2", url: "http://truyentuan.com/shin-kurosagi-con-diec-den-2/" }, { label: "Black Haze", value: "Black Haze", url: "http://truyentuan.com/black-haze/" }, { label: "Forever Evil", value: "Forever Evil", url: "http://truyentuan.com/forever-evil/" }, { label: "Haikyuu!!", value: "Haikyuu!!", url: "http://truyentuan.com/haikyuu/" }, { label: "Giant Killing", value: "Giant Killing", url: "http://truyentuan.com/giant-killing/" }, { label: "Doubt! (AMANO Sakuya)", value: "Doubt! (AMANO Sakuya)", url: "http://truyentuan.com/doubt-amano-sakuya/" }, { label: "Coppelion", value: "Coppelion", url: "http://truyentuan.com/coppelion/" }, { label: "Cửu Đỉnh Ký", value: "Cửu Đỉnh Ký", url: "http://truyentuan.com/cuu-dinh-ky/" }, { label: "Kotaro Makaritoru! L", value: "Kotaro Makaritoru! L", url: "http://truyentuan.com/kotaro-makaritoru-l/" }, { label: "Rockman 1", value: "Rockman 1", url: "http://truyentuan.com/rockman-1/" }, { label: "Sakamoto Desu ga?", value: "Sakamoto Desu ga?", url: "http://truyentuan.com/sakamoto-desu-ga/" }, { label: "Rockman 2", value: "Rockman 2", url: "http://truyentuan.com/rockman-2/" }, { label: "Dragon's Son Changsik", value: "Dragon's Son Changsik", url: "http://truyentuan.com/dragons-son-changsik/" }, { label: "Megaman X1", value: "Megaman X1", url: "http://truyentuan.com/megaman-x1/" }, { label: "Megaman X2", value: "Megaman X2", url: "http://truyentuan.com/megaman-x2/" }, { label: "Himouto! Umaru-chan", value: "Himouto! Umaru-chan", url: "http://truyentuan.com/himouto-umaru-chan/" }, { label: "Megaman X3", value: "Megaman X3", url: "http://truyentuan.com/megaman-x3/" }, { label: "Liên Minh Huyền Thoại", value: "Liên Minh Huyền Thoại", url: "http://truyentuan.com/lien-minh-huyen-thoai/" }, { label: "Megaman X Irregular Hunter", value: "Megaman X Irregular Hunter", url: "http://truyentuan.com/megaman-x-irregular-hunter/" }, { label: "Illegal Rare", value: "Illegal Rare", url: "http://truyentuan.com/illegal-rare/" }, { label: "Sưu Thần Ký", value: "Sưu Thần Ký", url: "http://truyentuan.com/suu-than-ky/" }, { label: "Boku Girl", value: "Boku Girl", url: "http://truyentuan.com/boku-girl/" }, { label: "Noragami", value: "Noragami", url: "http://truyentuan.com/noragami/" }, { label: "Ability", value: "Ability", url: "http://truyentuan.com/ability/" }, { label: "Jojo's Bizarre Adventure [Jojo]", value: "Jojo's Bizarre Adventure [Jojo]", url: "http://truyentuan.com/jojo-bizarre-adventure-jojo/" }, { label: "Majin Tantei Nougami Neuro", value: "Majin Tantei Nougami Neuro", url: "http://truyentuan.com/majin-tantei-nougami-neuro/" }, { label: "Arslan Chiến Ký", value: "Arslan Chiến Ký", url: "http://truyentuan.com/arslan-chien-ky/" }, { label: "Gamble Fish (thegioithugian)", value: "Gamble Fish (thegioithugian)", url: "http://truyentuan.com/gamble-fish-thegioithugian/" }, { label: "Dong Binh Thiên Hạ", value: "Dong Binh Thiên Hạ", url: "http://truyentuan.com/dong-binh-thien-ha/" }, { label: "Stealth Symphony", value: "Stealth Symphony", url: "http://truyentuan.com/stealth-symphony/" }, { label: "Shingeki no Kyojin - Birth of Levi", value: "Shingeki no Kyojin - Birth of Levi", url: "http://truyentuan.com/shingeki-no-kyojin-birth-of-levi/" }, { label: "Tsugumomo", value: "Tsugumomo", url: "http://truyentuan.com/tsugumomo/" }, { label: "Attaque", value: "Attaque", url: "http://truyentuan.com/attaque/" }, { label: "Gun x Clover", value: "Gun x Clover", url: "http://truyentuan.com/gun-x-clover/" }, { label: "Black Bullet", value: "Black Bullet", url: "http://truyentuan.com/black-bullet/" }, { label: "Tokyo ESP", value: "Tokyo ESP", url: "http://truyentuan.com/tokyo-esp/" }, { label: "Flow", value: "Flow", url: "http://truyentuan.com/flow/" }, { label: "Ultraman", value: "Ultraman", url: "http://truyentuan.com/ultraman/" }, { label: "Cô Gái Người Máy Odette", value: "Cô Gái Người Máy Odette", url: "http://truyentuan.com/co-gai-nguoi-may-odette/" }, { label: "Bushidou Sixteen", value: "Bushidou Sixteen", url: "http://truyentuan.com/bushidou-sixteen/" }, { label: "Nozo x Kimi", value: "Nozo x Kimi", url: "http://truyentuan.com/nozo-x-kimi/" }, { label: "Pokemon Pippi DP", value: "Pokemon Pippi DP", url: "http://truyentuan.com/pokemon-pippi-dp/" }, { label: "Bullet Armors", value: "Bullet Armors", url: "http://truyentuan.com/bullet-armors/" }, { label: "Hive", value: "Hive", url: "http://truyentuan.com/hive/" }, { label: "Real Account", value: "Real Account", url: "http://truyentuan.com/real-account/" }, { label: "Long Thần Tướng ", value: "Long Thần Tướng ", url: "http://truyentuan.com/long-than-tuong/" }, { label: "Maken-Ki!", value: "Maken-Ki!", url: "http://truyentuan.com/maken-ki/" }, { label: "Green Blood", value: "Green Blood", url: "http://truyentuan.com/green-blood/" }, { label: "Pokemon Special", value: "Pokemon Special", url: "http://truyentuan.com/pokemon-special/" }, { label: "GTO: Paradise Lost", value: "GTO: Paradise Lost", url: "http://truyentuan.com/gto-paradise-lost/" }, { label: "Ultimate Legend: Kang Hae Hyo", value: "Ultimate Legend: Kang Hae Hyo", url: "http://truyentuan.com/ultimate-legend-kang-hae-hyo/" }, { label: "Rubic số 8", value: "Rubic số 8", url: "http://truyentuan.com/rubic-so-8/" }, { label: "Shinobi no Kuni", value: "Shinobi no Kuni", url: "http://truyentuan.com/shinobi-no-kuni/" }, { label: "Life", value: "Life", url: "http://truyentuan.com/life/" }, { label: "Tokyo Innocent", value: "Tokyo Innocent", url: "http://truyentuan.com/tokyo-innocent/" }, { label: "Modify", value: "Modify", url: "http://truyentuan.com/modify/" }, { label: "Inu Yashiki - Lão Già Khốn Khổ", value: "Inu Yashiki - Lão Già Khốn Khổ", url: "http://truyentuan.com/inu-yashiki-lao-gia-khon-kho/" }, { label: "Green Worldz", value: "Green Worldz", url: "http://truyentuan.com/green-worldz/" }, { label: "1001 Knights", value: "1001 Knights", url: "http://truyentuan.com/1001-knights/" }, { label: "Stepping on roses", value: "Stepping on roses", url: "http://truyentuan.com/stepping-on-roses/" }, { label: "TAL", value: "TAL", url: "http://truyentuan.com/tal/" }, { label: "Silver Diamond", value: "Silver Diamond", url: "http://truyentuan.com/silver-diamond/" }, { label: "A-bout!", value: "A-bout!", url: "http://truyentuan.com/a-bout/" }, { label: "Hakaijuu", value: "Hakaijuu", url: "http://truyentuan.com/hakaijuu/" }, { label: "Fuuka", value: "Fuuka", url: "http://truyentuan.com/fuuka/" }, { label: "One Piece Mini Story", value: "One Piece Mini Story", url: "http://truyentuan.com/one-piece-mini-story/" }, { label: "Yuureitou", value: "Yuureitou", url: "http://truyentuan.com/yuureitou/" }, { label: "Sentou Hakai Gakuen Dangerous", value: "Sentou Hakai Gakuen Dangerous", url: "http://truyentuan.com/sentou-hakai-gakuen-dangerous/" }, { label: "Blackest Night", value: "Blackest Night", url: "http://truyentuan.com/blackest-night/" }, { label: "Vua Bếp Soma", value: "Vua Bếp Soma", url: "http://truyentuan.com/vua-bep-soma/" }, { label: "Ana Satsujin", value: "Ana Satsujin", url: "http://truyentuan.com/ana-satsujin/" }, { label: "Cross Over", value: "Cross Over", url: "http://truyentuan.com/cross-over/" }, { label: "Youkai Shoujo - Monsuga", value: "Youkai Shoujo - Monsuga", url: "http://truyentuan.com/youkai-shoujo-monsuga/" }, { label: "Kami-sama Drop", value: "Kami-sama Drop", url: "http://truyentuan.com/kami-sama-drop/" }, { label: "Shinigami no Ballad", value: "Shinigami no Ballad", url: "http://truyentuan.com/shinigami-no-ballad/" }, { label: "Saiki Kusuo no Sainan", value: "Saiki Kusuo no Sainan", url: "http://truyentuan.com/saiki-kusuo-no-sainan/" }, { label: "Toukyou Kushu", value: "Toukyou Kushu", url: "http://truyentuan.com/toukyou-kushu/" }, { label: "Huyền Thoại Karate", value: "Huyền Thoại Karate", url: "http://truyentuan.com/huyen-thoai-karate/" }, { label: "Painting Warriors", value: "Painting Warriors", url: "http://truyentuan.com/painting-warriors/" }, { label: "Mairunovich", value: "Mairunovich", url: "http://truyentuan.com/mairunovich/" }, { label: "Wonted", value: "Wonted", url: "http://truyentuan.com/wonted/" }, { label: "Evergreen Tea", value: "Evergreen Tea", url: "http://truyentuan.com/evergreen-tea/" }, { label: "Binbougami Ga!", value: "Binbougami Ga!", url: "http://truyentuan.com/binbougami-ga/" }, { label: "Boku to Issho", value: "Boku to Issho", url: "http://truyentuan.com/boku-to-issho/" }, { label: "Wagatsuma-san wa Ore no Yome", value: "Wagatsuma-san wa Ore no Yome", url: "http://truyentuan.com/wagatsuma-san-wa-ore-no-yome/" }, { label: "Let's Lagoon", value: "Let's Lagoon", url: "http://truyentuan.com/lets-lagoon/" }, { label: "Nội Tôi Toàn Kể Truyện Bựa", value: "Nội Tôi Toàn Kể Truyện Bựa", url: "http://truyentuan.com/noi-toi-toan-ke-truyen-bua/" }, { label: "Love Riron", value: "Love Riron", url: "http://truyentuan.com/love-riron/" }, { label: "Kingdom - Vương Giả Thiên Hạ", value: "Kingdom - Vương Giả Thiên Hạ", url: "http://truyentuan.com/kingdom-vuong-gia-thien-ha/" }, { label: "Ashita Dorobou", value: "Ashita Dorobou", url: "http://truyentuan.com/ashita-dorobou/" }, { label: "Zai x 10", value: "Zai x 10", url: "http://truyentuan.com/zai-x-10/" }, { label: "Kodomo no Jikan", value: "Kodomo no Jikan", url: "http://truyentuan.com/kodomo-no-jikan/" }, { label: "Thiên Mệnh", value: "Thiên Mệnh", url: "http://truyentuan.com/thien-menh/" }, { label: "Chim cánh cụt Ginji", value: "Chim cánh cụt Ginji", url: "http://truyentuan.com/chim-canh-cut-ginji/" }, { label: "Ocha Nigosu", value: "Ocha Nigosu", url: "http://truyentuan.com/ocha-nigosu/" }, { label: "Versailles no Bara", value: "Versailles no Bara", url: "http://truyentuan.com/versailles-no-bara/" }, { label: "Giang Hồ Bá Đạo Ký", value: "Giang Hồ Bá Đạo Ký", url: "http://truyentuan.com/giang-ho-ba-dao-ky/" }, { label: "Tần Thời Minh Nguyệt - Bách Bộ Phi Kiếm", value: "Tần Thời Minh Nguyệt - Bách Bộ Phi Kiếm", url: "http://truyentuan.com/tan-thoi-minh-nguyet-bach-bo-phi-kiem/" }, { label: "Fairy Tail Ice Trail", value: "Fairy Tail Ice Trail", url: "http://truyentuan.com/fairy-tail-ice-trail/" }, { label: "Fairy Tail Zero", value: "Fairy Tail Zero", url: "http://truyentuan.com/fairy-tail-zero/" }, { label: "Killing Bites", value: "Killing Bites", url: "http://truyentuan.com/killing-bites/" }, { label: "Orange Marmalade", value: "Orange Marmalade", url: "http://truyentuan.com/orange-marmalade/" }, { label: "Black Lagoon", value: "Black Lagoon", url: "http://truyentuan.com/black-lagoon/" }, { label: "Ashita no Joe", value: "Ashita no Joe", url: "http://truyentuan.com/ashita-no-joe/" }, { label: "Rising x Rydeen", value: "Rising x Rydeen", url: "http://truyentuan.com/rising-x-rydeen/" }, { label: "Shindere Shoujo to Kodoku na Shinigami", value: "Shindere Shoujo to Kodoku na Shinigami", url: "http://truyentuan.com/shindere-shoujo-to-kodoku-na-shinigami/" }, { label: "Seikoku No Dragonar", value: "Seikoku No Dragonar", url: "http://truyentuan.com/seikoku-no-dragonar/" }, { label: "Danshi Koukousei no Nichijou", value: "Danshi Koukousei no Nichijou", url: "http://truyentuan.com/danshi-koukousei-no-nichijou/" }, { label: "B Gata H Kei", value: "B Gata H Kei", url: "http://truyentuan.com/b-gata-h-kei/" }, { label: "Horimiya", value: "Horimiya", url: "http://truyentuan.com/horimiya/" }, { label: "+Anima", value: "+Anima", url: "http://truyentuan.com/anima/" }, { label: "Owari no Seraph", value: "Owari no Seraph", url: "http://truyentuan.com/owari-no-seraph/" }, { label: "Boku wa Mari no Naka", value: "Boku wa Mari no Naka", url: "http://truyentuan.com/boku-wa-mari-no-naka/" }, { label: "Em Bé Ufo", value: "Em Bé Ufo", url: "http://truyentuan.com/em-be-ufo/" }, { label: "Witch Craft Works", value: "Witch Craft Works", url: "http://truyentuan.com/witch-craft-works/" }, { label: "Kung Fu Komang", value: "Kung Fu Komang", url: "http://truyentuan.com/kung-fu-komang/" }, { label: "Umisho", value: "Umisho", url: "http://truyentuan.com/umisho/" }, { label: "Meteor Methuselah", value: "Meteor Methuselah", url: "http://truyentuan.com/meteor-methuselah/" }, { label: "Alice In Hell", value: "Alice In Hell", url: "http://truyentuan.com/alice-in-hell/" }, { label: "Centaur no Nayami", value: "Centaur no Nayami", url: "http://truyentuan.com/centaur-no-nayami/" }, { label: "Rain", value: "Rain", url: "http://truyentuan.com/rain/" }, { label: "Ore ga Heroine o Tasukesugite Sekai ga Little Mokushiroku!?", value: "Ore ga Heroine o Tasukesugite Sekai ga Little Mokushiroku!?", url: "http://truyentuan.com/ore-ga-heroine-o-tasukesugite-sekai-ga-little-mokushiroku/" }, { label: "Nukoduke!", value: "Nukoduke!", url: "http://truyentuan.com/nukoduke/" }, { label: "Kono Bijutsubu ni wa Mondai ga Aru!", value: "Kono Bijutsubu ni wa Mondai ga Aru!", url: "http://truyentuan.com/kono-bijutsubu-ni-wa-mondai-ga-aru/" }, { label: "Nature-0", value: "Nature-0", url: "http://truyentuan.com/nature-0/" }, { label: "Shura no Mon I", value: "Shura no Mon I", url: "http://truyentuan.com/shura-no-mon-i/" }, { label: "Tora Kiss - A School Odyssey", value: "Tora Kiss - A School Odyssey", url: "http://truyentuan.com/tora-kiss-a-school-odyssey/" }, { label: "Inubaka", value: "Inubaka", url: "http://truyentuan.com/inubaka/" }, { label: "Saito-kun wa Chounouryokusha Rashii", value: "Saito-kun wa Chounouryokusha Rashii", url: "http://truyentuan.com/saito-kun-wa-chounouryokusha-rashii/" }, { label: "Dragon Voice", value: "Dragon Voice", url: "http://truyentuan.com/dragon-voice/" }, { label: "Uwagaki", value: "Uwagaki", url: "http://truyentuan.com/uwagaki/" }, { label: "Senyuu", value: "Senyuu", url: "http://truyentuan.com/senyuu/" }, { label: "Saki", value: "Saki", url: "http://truyentuan.com/saki/" }, { label: "Hatarakanai Futari", value: "Hatarakanai Futari", url: "http://truyentuan.com/hatarakanai-futari/" }, { label: "Chiến Quốc Yêu Hồ", value: "Chiến Quốc Yêu Hồ", url: "http://truyentuan.com/chien-quoc-yeu-ho/" }, { label: "Gokicha!!", value: "Gokicha!!", url: "http://truyentuan.com/gokicha/" }, { label: "Tale of Eun Aran", value: "Tale of Eun Aran", url: "http://truyentuan.com/tale-of-eun-aran/" }, { label: "Kanojo ga Flag o Oraretara", value: "Kanojo ga Flag o Oraretara", url: "http://truyentuan.com/kanojo-ga-flag-o-oraretara/" }, { label: "Ryuushika Ryuushika", value: "Ryuushika Ryuushika", url: "http://truyentuan.com/ryuushika-ryuushika/" }, { label: "Green Worldz (DP)", value: "Green Worldz (DP)", url: "http://truyentuan.com/green-worldz-dp/" }, { label: "DearS", value: "DearS", url: "http://truyentuan.com/dears/" }, { label: "Tokyo Crazy Paradise", value: "Tokyo Crazy Paradise", url: "http://truyentuan.com/tokyo-crazy-paradise/" }, { label: "Shuukyuu Shoujo", value: "Shuukyuu Shoujo", url: "http://truyentuan.com/shuukyuu-shoujo/" }, { label: "Lovely Complex", value: "Lovely Complex", url: "http://truyentuan.com/lovely-complex/" }, { label: "Teppu", value: "Teppu", url: "http://truyentuan.com/teppu/" }, { label: "Mother Keeper", value: "Mother Keeper", url: "http://truyentuan.com/mother-keeper/" }, { label: "Madan no Ou to Senki", value: "Madan no Ou to Senki", url: "http://truyentuan.com/madan-no-ou-to-senki/" }, { label: "Hirunaka no Ryuusei", value: "Hirunaka no Ryuusei", url: "http://truyentuan.com/hirunaka-no-ryuusei/" }, { label: "Ore ga Doutei wo Sutetara Shinu Ken ni Tsuite", value: "Ore ga Doutei wo Sutetara Shinu Ken ni Tsuite", url: "http://truyentuan.com/ore-ga-doutei-wo-sutetara-shinu-ken-ni-tsuite/" }, { label: "Hantsu x Torasshu", value: "Hantsu x Torasshu", url: "http://truyentuan.com/hantsu-x-torasshu/" }, { label: "Magnolia", value: "Magnolia", url: "http://truyentuan.com/magnolia/" }, { label: "Starbiter Satsuki", value: "Starbiter Satsuki", url: "http://truyentuan.com/starbiter-satsuki/" }, { label: "Seikon no Qwaser", value: "Seikon no Qwaser", url: "http://truyentuan.com/seikon-no-qwaser/" }, { label: "W-Juliet", value: "W-Juliet", url: "http://truyentuan.com/w-juliet/" }, { label: "Akachan to Boku - Em bé và tôi", value: "Akachan to Boku - Em bé và tôi", url: "http://truyentuan.com/akachan-to-boku-em-be-va-toi/" }, { label: "Yume Miru Taiyou", value: "Yume Miru Taiyou", url: "http://truyentuan.com/yume-miru-taiyou/" }, { label: "Bokura wa Minna Kawaisou", value: "Bokura wa Minna Kawaisou", url: "http://truyentuan.com/bokura-wa-minna-kawaisou/" }, { label: "Katsu!", value: "Katsu!", url: "http://truyentuan.com/katsu/" }, { label: "Cố Lên Nào, Đại Ma Vương!", value: "Cố Lên Nào, Đại Ma Vương!", url: "http://truyentuan.com/co-len-nao-dai-ma-vuong/" }, { label: "Võ Đạo Cuồng Chi Thi", value: "Võ Đạo Cuồng Chi Thi", url: "http://truyentuan.com/vo-dao-cuong-chi-thi/" }, { label: "3 Gatsu no lion", value: "3 Gatsu no lion", url: "http://truyentuan.com/3-gatsu-no-lion/" }, { label: "Hitsugime no Chaika", value: "Hitsugime no Chaika", url: "http://truyentuan.com/hitsugime-no-chaika/" }, { label: "Sidonia No Kishi", value: "Sidonia No Kishi", url: "http://truyentuan.com/sidonia-no-kishi/" }, { label: "Crimson Hero", value: "Crimson Hero", url: "http://truyentuan.com/crimson-hero/" }, { label: "Honey x Honey Drops", value: "Honey x Honey Drops", url: "http://truyentuan.com/honey-x-honey-drops/" }, { label: "Habaek-eui Shinbu", value: "Habaek-eui Shinbu", url: "http://truyentuan.com/habaek-eui-shinbu/" }, { label: "Dear, Only You Don't Know!", value: "Dear, Only You Don't Know!", url: "http://truyentuan.com/dear-only-you-dont-know/" }, { label: "Buttobi Itto", value: "Buttobi Itto", url: "http://truyentuan.com/buttobi-itto/" }, { label: "Hinomaru Zumou", value: "Hinomaru Zumou", url: "http://truyentuan.com/hinomaru-zumou/" }, { label: "Rurouni Kenshin", value: "Rurouni Kenshin", url: "http://truyentuan.com/rurouni-kenshin/" }, { label: "Heart no Kuni no Alice", value: "Heart no Kuni no Alice", url: "http://truyentuan.com/heart-no-kuni-no-alice/" }, { label: "Kattobi Itto ", value: "Kattobi Itto ", url: "http://truyentuan.com/kattobi-itto/" }, { label: "Upotte!!", value: "Upotte!!", url: "http://truyentuan.com/upotte/" }, { label: "Dorohedoro", value: "Dorohedoro", url: "http://truyentuan.com/dorohedoro/" }, { label: "Gấu ngốc và những người bạn", value: "Gấu ngốc và những người bạn", url: "http://truyentuan.com/gau-ngoc-va-nhung-nguoi-ban/" }, { label: "Natsuyuki Rendez-vous", value: "Natsuyuki Rendez-vous", url: "http://truyentuan.com/natsuyuki-rendez-vous/" }, { label: "Kono Kanojo wa Fiction desu", value: "Kono Kanojo wa Fiction desu", url: "http://truyentuan.com/kono-kanojo-wa-fiction-desu/" }, { label: "Cố Lên Nào, Đại Ma Vương 2", value: "Cố Lên Nào, Đại Ma Vương 2", url: "http://truyentuan.com/co-len-nao-dai-ma-vuong-2/" }, { label: "Shinmai Maou no Keiyakusha", value: "Shinmai Maou no Keiyakusha", url: "http://truyentuan.com/shinmai-maou-no-keiyakusha/" }, { label: "Doubutsu no Kuni - Vương quốc động vật", value: "Doubutsu no Kuni - Vương quốc động vật", url: "http://truyentuan.com/doubutsu-no-kuni-vuong-quoc-dong-vat/" }, { label: "History's Strongest Disciple Kenichi (OtakuPlus)", value: "History's Strongest Disciple Kenichi (OtakuPlus)", url: "http://truyentuan.com/history-s-strongest-disciple-kenichi-otakuplus/" }, { label: "Love So Life", value: "Love So Life", url: "http://truyentuan.com/love-so-life/" }, { label: "Teen Titans Short Comics", value: "Teen Titans Short Comics", url: "http://truyentuan.com/teen-titans-short-comics/" }, { label: "Makai Ouji: Devils and Realist", value: "Makai Ouji: Devils and Realist", url: "http://truyentuan.com/makai-ouji-devils-and-realist/" }, { label: "Sugar Soldier", value: "Sugar Soldier", url: "http://truyentuan.com/sugar-soldier/" }, { label: "Soul Cartel (DP)", value: "Soul Cartel (DP)", url: "http://truyentuan.com/soul-cartel-dp/" }, { label: "Ô Long Viện Linh Vật Sống", value: "Ô Long Viện Linh Vật Sống", url: "http://truyentuan.com/o-long-vien-linh-vat-song/" }, { label: "Yoakemono", value: "Yoakemono", url: "http://truyentuan.com/yoakemono/" }, { label: "World Of Super Sand Box", value: "World Of Super Sand Box", url: "http://truyentuan.com/world-of-super-sand-box/" }, { label: "Thần thoại minh vương", value: "Thần thoại minh vương", url: "http://truyentuan.com/than-thoai-minh-vuong/" }, { label: "Long Phi Bất Bại 2", value: "Long Phi Bất Bại 2", url: "http://truyentuan.com/long-phi-bat-bai-2/" }, { label: "Dragonball EX", value: "Dragonball EX", url: "http://truyentuan.com/dragonball-ex/" }, { label: "Masks", value: "Masks", url: "http://truyentuan.com/masks/" }, { label: "Ai Hơn Ai", value: "Ai Hơn Ai", url: "http://truyentuan.com/ai-hon-ai/" }, { label: "Tháp Kỳ", value: "Tháp Kỳ", url: "http://truyentuan.com/thap-ky/" }, { label: "Con Ma Vui Vẻ", value: "Con Ma Vui Vẻ", url: "http://truyentuan.com/con-ma-vui-ve/" }, { label: "Yureka Lost Saga", value: "Yureka Lost Saga", url: "http://truyentuan.com/yureka-lost-saga-2/" }, { label: "Binlang", value: "Binlang", url: "http://truyentuan.com/binlang/" }, { label: "Mayonaka no X Giten", value: "Mayonaka no X Giten", url: "http://truyentuan.com/mayonaka-no-x-giten/" }, { label: "Musashi", value: "Musashi", url: "http://truyentuan.com/musashi/" }, { label: "Đại Chiến Bóng Tối", value: "Đại Chiến Bóng Tối", url: "http://truyentuan.com/dai-chien-bong-toi/" }, { label: "Baki - Son of Ogre", value: "Baki - Son of Ogre", url: "http://truyentuan.com/baki-son-of-ogre/" }, { label: "Seitokai Tantei Kirika", value: "Seitokai Tantei Kirika", url: "http://truyentuan.com/seitokai-tantei-kirika/" }, { label: "Dolls Fall ", value: "Dolls Fall ", url: "http://truyentuan.com/dolls-fall/" }, { label: "108 Tân Thủy Hử", value: "108 Tân Thủy Hử", url: "http://truyentuan.com/108-tan-thuy-hu/" }, { label: "Ma Võ Độ", value: "Ma Võ Độ", url: "http://truyentuan.com/ma-vo-do/" }, { label: "Băng Hoả Ma Trù", value: "Băng Hoả Ma Trù", url: "http://truyentuan.com/bang-hoa-ma-tru/" }, { label: "Thần Thoại Hy Lạp", value: "Thần Thoại Hy Lạp", url: "http://truyentuan.com/than-thoai-hy-lap/" }, { label: "Cảnh Sát Siêu Quậy", value: "Cảnh Sát Siêu Quậy", url: "http://truyentuan.com/canh-sat-sieu-quay/" }, { label: "Toukyou Kushu:re", value: "Toukyou Kushu:re", url: "http://truyentuan.com/toukyou-kushu-re/" }, { label: "Thú cưng của tôi là Quỷ vương", value: "Thú cưng của tôi là Quỷ vương", url: "http://truyentuan.com/thu-cung-cua-toi-la-quy-vuong/" }, { label: "Bác Sĩ Thú Y", value: "Bác Sĩ Thú Y", url: "http://truyentuan.com/bac-si-thu-y/" }, { label: "Ore ga Ojou-sama Gakkou ni Shomin Sample Toshite Rachirareta Ken", value: "Ore ga Ojou-sama Gakkou ni Shomin Sample Toshite Rachirareta Ken", url: "http://truyentuan.com/ore-ga-ojou-sama-gakkou-ni-shomin-sample-toshite-rachirareta-ken/" }, { label: "Nise Koi (Otaku Plus)", value: "Nise Koi (Otaku Plus)", url: "http://truyentuan.com/nise-koi-otaku-plus/" }, { label: "Kimi no Sei", value: "Kimi no Sei", url: "http://truyentuan.com/kimi-no-sei/" }, { label: "Koi to Uso", value: "Koi to Uso", url: "http://truyentuan.com/koi-to-uso/" }, { label: "Xung Xuất Lê Minh", value: "Xung Xuất Lê Minh", url: "http://truyentuan.com/xung-xuat-le-minh/" }, { label: "Thánh Đường", value: "Thánh Đường", url: "http://truyentuan.com/thanh-duong/" }, { label: "Dendrobates", value: "Dendrobates", url: "http://truyentuan.com/dendrobates/" }, { label: "Rock Lee's Springtime of Youth", value: "Rock Lee's Springtime of Youth", url: "http://truyentuan.com/rock-lees-springtime-of-youth/" }, { label: "Đông Phương Chân Long", value: "Đông Phương Chân Long", url: "http://truyentuan.com/dong-phuong-chan-long/" }, { label: "Cấp Độ Phân Liệt", value: "Cấp Độ Phân Liệt", url: "http://truyentuan.com/cap-do-phan-liet/" }, { label: "Hajime No Ippo", value: "Hajime No Ippo", url: "http://truyentuan.com/hajime-no-ippo/" }, { label: "Ten Count", value: "Ten Count", url: "http://truyentuan.com/ten-count/" }, { label: "Khai Phong Kỳ Đàm", value: "Khai Phong Kỳ Đàm", url: "http://truyentuan.com/khai-phong-ky-dam/" }, { label: "Baketeria", value: "Baketeria", url: "http://truyentuan.com/baketeria/" }, { label: "Ám Chi Lạc Ấn", value: "Ám Chi Lạc Ấn", url: "http://truyentuan.com/am-chi-lac-an/" }, { label: "Hậu dấu ấn rồng thiêng", value: "Hậu dấu ấn rồng thiêng", url: "http://truyentuan.com/hau-dau-an-rong-thieng/" }, { label: "Ao Haru Ride", value: "Ao Haru Ride", url: "http://truyentuan.com/ao-haru-ride/" }, { label: "Jingle Jungle", value: "Jingle Jungle", url: "http://truyentuan.com/jingle-jungle/" }, { label: "Kikou Shoujo wa Kizutsukanai", value: "Kikou Shoujo wa Kizutsukanai", url: "http://truyentuan.com/kikou-shoujo-wa-kizutsukanai/" }, { label: "Hầm trú ẩn", value: "Hầm trú ẩn", url: "http://truyentuan.com/ham-tru-an/" }, { label: "Last Game", value: "Last Game", url: "http://truyentuan.com/last-game/" }, { label: "True Love", value: "True Love", url: "http://truyentuan.com/true-love/" }, { label: "Amagoi", value: "Amagoi", url: "http://truyentuan.com/amagoi/" }, { label: "Tate no Yuusha no Nariagari", value: "Tate no Yuusha no Nariagari", url: "http://truyentuan.com/tate-no-yuusha-no-nariagari/" }, { label: "Kono Oneesan wa fliction desu!?", value: "Kono Oneesan wa fliction desu!?", url: "http://truyentuan.com/kono-oneesan-wa-fliction-desu/" }, { label: "Now", value: "Now", url: "http://truyentuan.com/now/" }, { label: "Tough - Miyazawa Kiichi", value: "Tough - Miyazawa Kiichi", url: "http://truyentuan.com/tough-miyazawa-kiichi/" }, { label: "Ultimate Venus", value: "Ultimate Venus", url: "http://truyentuan.com/ultimate-venus/" }, { label: "Love Berrish", value: "Love Berrish", url: "http://truyentuan.com/love-berrish/" }, { label: "Kamisama No Iutoori II", value: "Kamisama No Iutoori II", url: "http://truyentuan.com/kamisama-no-iutoori-ii/" }, { label: "Cerberus(DP)", value: "Cerberus(DP)", url: "http://truyentuan.com/cerberusdp/" }, { label: "Orenchi no Furo Jijou", value: "Orenchi no Furo Jijou", url: "http://truyentuan.com/orenchi-no-furo-jijou/" }, { label: "Getsurin Ni Kiri Saku", value: "Getsurin Ni Kiri Saku", url: "http://truyentuan.com/getsurin-ni-kiri-saku/" }, { label: "Jelsa Comic Series", value: "Jelsa Comic Series", url: "http://truyentuan.com/jelsa-comic-series/" }, { label: "Ookami shoujo to kuro ouji", value: "Ookami shoujo to kuro ouji", url: "http://truyentuan.com/ookami-shoujo-to-kuro-ouji/" }, { label: "Plunderer", value: "Plunderer", url: "http://truyentuan.com/plunderer/" }, { label: "Người Trong Giang Hồ", value: "Người Trong Giang Hồ", url: "http://truyentuan.com/nguoi-trong-giang-ho/" }, { label: "Bá Đao", value: "Bá Đao", url: "http://truyentuan.com/ba-dao/" }, { label: "Ya! Oee", value: "Ya! Oee", url: "http://truyentuan.com/ya-oee/" }, { label: "Bất Bại Chiến Thần", value: "Bất Bại Chiến Thần", url: "http://truyentuan.com/bat-bai-chien-than/" }, { label: "Manh Phong Thần", value: "Manh Phong Thần", url: "http://truyentuan.com/manh-phong-than/" }, { label: "Crash!", value: "Crash!", url: "http://truyentuan.com/crash/" }, { label: "Nozo x Kimi (Devil Slayer Team)", value: "Nozo x Kimi (Devil Slayer Team)", url: "http://truyentuan.com/nozo-x-kimi-devil-slayer-team/" }, { label: "Đại chúa tể", value: "Đại chúa tể", url: "http://truyentuan.com/dai-chua-te/" }, { label: "Ajin", value: "Ajin", url: "http://truyentuan.com/ajin/" }, { label: "Dolly Kill Kill", value: "Dolly Kill Kill", url: "http://truyentuan.com/dolly-kill-kill/" }, { label: "Tenkuu Shinpan", value: "Tenkuu Shinpan", url: "http://truyentuan.com/tenkuu-shinpan/" }, { label: "Trảm Long", value: "Trảm Long", url: "http://truyentuan.com/tram-long/" }, { label: "Boku to Kanojo no Renai Mokuroku", value: "Boku to Kanojo no Renai Mokuroku", url: "http://truyentuan.com/boku-to-kanojo-no-renai-mokuroku/" }, { label: "Tuyết Ảnh Đặc Phái Tổ", value: "Tuyết Ảnh Đặc Phái Tổ", url: "http://truyentuan.com/tuyet-anh-dac-phai-to/" }, { label: "Thâu Tinh Cửu Nguyệt Thiên", value: "Thâu Tinh Cửu Nguyệt Thiên", url: "http://truyentuan.com/thau-tinh-cuu-nguyet-thien/" }, { label: "Ngự Long", value: "Ngự Long", url: "http://truyentuan.com/ngu-long/" }, { label: "Thần Ấn Vương Tọa", value: "Thần Ấn Vương Tọa", url: "http://truyentuan.com/than-an-vuong-toa/" }, { label: "Rodiura Kurashi", value: "Rodiura Kurashi", url: "http://truyentuan.com/rodiura-kurashi/" }, { label: "Mạt Nhật Chiến Lang", value: "Mạt Nhật Chiến Lang", url: "http://truyentuan.com/mat-nhat-chien-lang/" }, { label: "Hatsukoi Shinjuu", value: "Hatsukoi Shinjuu", url: "http://truyentuan.com/hatsukoi-shinjuu/" }, { label: "Cây Bút Thần Kỳ", value: "Cây Bút Thần Kỳ", url: "http://truyentuan.com/cay-but-than-ky/" }, { label: "Ookiku Furikabutte", value: "Ookiku Furikabutte", url: "http://truyentuan.com/ookiku-furikabutte/" }, { label: "Joshi Kausei", value: "Joshi Kausei", url: "http://truyentuan.com/joshi-kausei/" }, { label: "Zettai Joousei", value: "Zettai Joousei", url: "http://truyentuan.com/zettai-joousei/" }, { label: "Alyosha", value: "Alyosha", url: "http://truyentuan.com/alyosha/" }, { label: "Lớp Trưởng Đại Nhân", value: "Lớp Trưởng Đại Nhân", url: "http://truyentuan.com/lop-truong-dai-nhan/" }, { label: "Zansho", value: "Zansho", url: "http://truyentuan.com/zansho/" }, { label: "Zanbara", value: "Zanbara", url: "http://truyentuan.com/zanbara/" }, { label: "Yuuhi Romance", value: "Yuuhi Romance", url: "http://truyentuan.com/yuuhi-romance/" }, { label: "Yaotsukumo", value: "Yaotsukumo", url: "http://truyentuan.com/yaotsukumo/" }, { label: "Yaiba Remake", value: "Yaiba Remake", url: "http://truyentuan.com/yaiba-remake/" }, { label: "W's", value: "W's", url: "http://truyentuan.com/ws/" }, { label: "Zetsuen No Tempest", value: "Zetsuen No Tempest", url: "http://truyentuan.com/zetsuen-no-tempest/" }, { label: "Lam Sí", value: "Lam Sí", url: "http://truyentuan.com/lam-si/" }, { label: "Watashitachi no Tamura-kun", value: "Watashitachi no Tamura-kun", url: "http://truyentuan.com/watashitachi-no-tamura-kun/" }, { label: "Vương Tiểu Long", value: "Vương Tiểu Long", url: "http://truyentuan.com/vuong-tieu-long/" }, { label: "Vương Quốc Mộng Mơ", value: "Vương Quốc Mộng Mơ", url: "http://truyentuan.com/vuong-quoc-mong-mo/" }, { label: "Vua Côn Trùng", value: "Vua Côn Trùng", url: "http://truyentuan.com/vua-con-trung/" }, { label: "Võ Thần Phi Thiên", value: "Võ Thần Phi Thiên", url: "http://truyentuan.com/vo-than-phi-thien/" }, { label: "Uttare Daikichi", value: "Uttare Daikichi", url: "http://truyentuan.com/uttare-daikichi/" }, { label: "Godly Bells", value: "Godly Bells", url: "http://truyentuan.com/godly-bells/" }, { label: "Rere Hello", value: "Rere Hello", url: "http://truyentuan.com/rere-hello/" }, { label: "Ultimate Power", value: "Ultimate Power", url: "http://truyentuan.com/ultimate-power/" }, { label: "Ultimate Origin", value: "Ultimate Origin", url: "http://truyentuan.com/ultimate-origin/" }, { label: "Ultimate Comics X", value: "Ultimate Comics X", url: "http://truyentuan.com/ultimate-comics-x/" }, { label: "Tsumitsuki", value: "Tsumitsuki", url: "http://truyentuan.com/tsumitsuki/" }, { label: "Nghệ Thuật Gian Lận", value: "Nghệ Thuật Gian Lận", url: "http://truyentuan.com/nghe-thuat-gian-lan/" }, { label: "Nijiiro Togarashi", value: "Nijiiro Togarashi", url: "http://truyentuan.com/nijiiro-togarashi/" }, { label: "Akarui Sekai Keikaku", value: "Akarui Sekai Keikaku", url: "http://truyentuan.com/akarui-sekai-keikaku/" }, { label: "Dousei Recipe", value: "Dousei Recipe", url: "http://truyentuan.com/dousei-recipe/" }, { label: "Tribal 12", value: "Tribal 12", url: "http://truyentuan.com/tribal-12/" }, { label: "Toto ! The wonderful adventure", value: "Toto ! The wonderful adventure", url: "http://truyentuan.com/toto-the-wonderful-adventure/" }, { label: "TOKKO", value: "TOKKO", url: "http://truyentuan.com/tokko/" }, { label: "Rozen Maiden", value: "Rozen Maiden", url: "http://truyentuan.com/rozen-maiden/" }, { label: "Tôn Ngộ Không", value: "Tôn Ngộ Không", url: "http://truyentuan.com/ton-ngo-khong/" }, { label: "Kazu Doctor K", value: "Kazu Doctor K", url: "http://truyentuan.com/kazu-doctor-k/" }, { label: "Yubikiri", value: "Yubikiri", url: "http://truyentuan.com/yubikiri/" }, { label: "X-Men Necrosha", value: "X-Men Necrosha", url: "http://truyentuan.com/x-men-necrosha/" }, { label: "Wish - Ước Nguyện", value: "Wish - Ước Nguyện", url: "http://truyentuan.com/wish-uoc-nguyen/" }, { label: "Shin cậu bé bút chì", value: "Shin cậu bé bút chì", url: "http://truyentuan.com/shin-cau-be-but-chi/" }, { label: "Vương Bài Ngự Sử", value: "Vương Bài Ngự Sử", url: "http://truyentuan.com/vuong-bai-ngu-su/" }, { label: "Kekkon Yubiwa Monogatari", value: "Kekkon Yubiwa Monogatari", url: "http://truyentuan.com/kekkon-yubiwa-monogatari/" }, { label: "TianDi Naner", value: "TianDi Naner", url: "http://truyentuan.com/tiandi-naner/" }, { label: "Thiên thần bảo hộ", value: "Thiên thần bảo hộ", url: "http://truyentuan.com/thien-than-bao-ho/" }, { label: "Thiên Hạ Vô Địch Tiểu Kiếm Tiên", value: "Thiên Hạ Vô Địch Tiểu Kiếm Tiên", url: "http://truyentuan.com/thien-ha-vo-dich-tieu-kiem-tien/" }, { label: "The Strongest Virus", value: "The Strongest Virus", url: "http://truyentuan.com/the-strongest-virus/" }, { label: "My Hero Academia", value: "My Hero Academia", url: "http://truyentuan.com/my-hero-academia/" }, { label: "Thiên Tử Truyền Kỳ 1 - Cơ Phát Khai Chu Bản", value: "Thiên Tử Truyền Kỳ 1 - Cơ Phát Khai Chu Bản", url: "http://truyentuan.com/thien-tu-truyen-ky-1-co-phat-khai-chu-ban/" }, { label: "The Guy Who Will Give a Kiss for 5000 Won", value: "The Guy Who Will Give a Kiss for 5000 Won", url: "http://truyentuan.com/the-guy-who-will-give-a-kiss-for-5000-won/" }, { label: "Thần Khí Vương", value: "Thần Khí Vương", url: "http://truyentuan.com/than-khi-vuong/" }, { label: "Thần Chi Lĩnh Vực", value: "Thần Chi Lĩnh Vực", url: "http://truyentuan.com/than-chi-linh-vuc/" }, { label: "The Cliff", value: "The Cliff", url: "http://truyentuan.com/the-cliff/" }, { label: "Hitomi-sensei no Hokenshitsu", value: "Hitomi-sensei no Hokenshitsu", url: "http://truyentuan.com/hitomi-sensei-no-hokenshitsu/" }, { label: "37 Kiss", value: "37 Kiss", url: "http://truyentuan.com/37/" }, { label: "Tân Từ Điển Kỳ Bí", value: "Tân Từ Điển Kỳ Bí", url: "http://truyentuan.com/tan-tu-dien-ky-bi/" }, { label: "Hanebado!", value: "Hanebado!", url: "http://truyentuan.com/hanebado/" }, { label: "Sugars (Yamamori Mika)", value: "Sugars (Yamamori Mika)", url: "http://truyentuan.com/sugars-yamamori-mika/" }, { label: "Full Metal Wing", value: "Full Metal Wing", url: "http://truyentuan.com/full-metal-wing/" }, { label: "The Red Soul", value: "The Red Soul", url: "http://truyentuan.com/the-red-soul/" }, { label: "The One I Love", value: "The One I Love", url: "http://truyentuan.com/the-one-i-love/" }, { label: "Takamagahara", value: "Takamagahara", url: "http://truyentuan.com/takamagahara/" }, { label: "Super Darling", value: "Super Darling", url: "http://truyentuan.com/super-darling/" }, { label: "Takeru - Opera Susanoh Sword of the Devil", value: "Takeru - Opera Susanoh Sword of the Devil", url: "http://truyentuan.com/takeru-opera-susanoh-sword-of-the-devil/" }, { label: "Tales for a sleepless night", value: "Tales for a sleepless night", url: "http://truyentuan.com/tales-for-a-sleepless-night/" }, { label: "Soukyuu no Lapis Lazuli", value: "Soukyuu no Lapis Lazuli", url: "http://truyentuan.com/soukyuu-no-lapis-lazuli/" }, { label: "Gate - Jietai Kare no Chi nite, Kaku Tatakeri", value: "Gate - Jietai Kare no Chi nite, Kaku Tatakeri", url: "http://truyentuan.com/gate-jietai-kare-no-chi-nite-kaku-tatakeri/" }, { label: "DEAD DAYS", value: "DEAD DAYS", url: "http://truyentuan.com/dead-days/" }, { label: "Starry☆Sky four seasons (full)", value: "Starry☆Sky four seasons (full)", url: "http://truyentuan.com/starry%e2%98%86sky-four-seasons-full/" }, { label: "Suki Natsuki Koi", value: "Suki Natsuki Koi", url: "http://truyentuan.com/suki-natsuki-koi/" }, { label: "Sorayume no Uta", value: "Sorayume no Uta", url: "http://truyentuan.com/sorayume-no-uta/" }, { label: "Shuumatsu no Laughter", value: "Shuumatsu no Laughter", url: "http://truyentuan.com/shuumatsu-no-laughter/" }, { label: "Sora wa Akai Kawa no Hotori", value: "Sora wa Akai Kawa no Hotori", url: "http://truyentuan.com/sora-wa-akai-kawa-no-hotori/" }, { label: "Beyond Evil", value: "Beyond Evil", url: "http://truyentuan.com/beyond-evil/" }, { label: "Drifters", value: "Drifters", url: "http://truyentuan.com/drifters/" }, { label: "Seraph of the End", value: "Seraph of the End", url: "http://truyentuan.com/seraph-of-the-end/" }, { label: "ReLIFE", value: "ReLIFE", url: "http://truyentuan.com/relife/" }, { label: "Ren-ai Shijou Shugi", value: "Ren-ai Shijou Shugi", url: "http://truyentuan.com/ren-ai-shijou-shugi/" }, { label: "Yae no Sakura", value: "Yae no Sakura", url: "http://truyentuan.com/yae-no-sakura/" }, { label: "Medicine One shot", value: "Medicine One shot", url: "http://truyentuan.com/medicine-one-shot/" }, { label: "Tam Nhãn Hao Thiên Lục", value: "Tam Nhãn Hao Thiên Lục", url: "http://truyentuan.com/tam-nhan-hao-thien-luc/" }, { label: "Lessa", value: "Lessa", url: "http://truyentuan.com/lessa/" }, { label: "Namaikizakari", value: "Namaikizakari", url: "http://truyentuan.com/namaikizakari/" }, { label: "Tsuki no Shippo", value: "Tsuki no Shippo", url: "http://truyentuan.com/tsuki-no-shippo/" }, { label: "Inu x Boku SS", value: "Inu x Boku SS", url: "http://truyentuan.com/inu-x-boku-ss/" }, { label: "Hero Waltz", value: "Hero Waltz", url: "http://truyentuan.com/hero-waltz/" }, { label: "Alto", value: "Alto", url: "http://truyentuan.com/alto/" }, { label: "The Friendly Winter", value: "The Friendly Winter", url: "http://truyentuan.com/the-friendly-winter/" }, { label: "Video Girl AI", value: "Video Girl AI", url: "http://truyentuan.com/video-girl-ai/" }, { label: "Ore ga Akuma de, Aitsu ga Yome de.", value: "Ore ga Akuma de, Aitsu ga Yome de.", url: "http://truyentuan.com/ore-ga-akuma-de-aitsu-ga-yome-de/" }, { label: "Otome wa Boku ni Koishiteru", value: "Otome wa Boku ni Koishiteru", url: "http://truyentuan.com/otome-wa-boku-ni-koishiteru/" }, { label: "Shinonome Yuuko wa Tanpen Shousetsu o Aishite Iru", value: "Shinonome Yuuko wa Tanpen Shousetsu o Aishite Iru", url: "http://truyentuan.com/shinonome-yuuko-wa-tanpen-shousetsu-o-aishite-iru/" }, { label: "Legendary Moonlight Sculptor – Con Đường Đế Vương", value: "Legendary Moonlight Sculptor – Con Đường Đế Vương", url: "http://truyentuan.com/legendary-moonlight-sculptor-con-duong-de-vuong/" }, { label: "Seirei Tsukai no Blade Dance", value: "Seirei Tsukai no Blade Dance", url: "http://truyentuan.com/seirei-tsukai-no-blade-dance/" }, { label: "Oukoku Game", value: "Oukoku Game", url: "http://truyentuan.com/oukoku-game/" }, { label: "Mercenary Maruhan", value: "Mercenary Maruhan", url: "http://truyentuan.com/mercenary-maruhan/" }, { label: "Advent of Snow White to Hell - Địa ngục tuyết trắng", value: "Advent of Snow White to Hell - Địa ngục tuyết trắng", url: "http://truyentuan.com/advent-of-snow-white-to-hell-dia-nguc-tuyet-trang/" }, { label: "Horizon", value: "Horizon", url: "http://truyentuan.com/horizon/" }, { label: "The Sword of Emperor", value: "The Sword of Emperor", url: "http://truyentuan.com/the-sword-of-emperor/" }, { label: "Đoàn Xiếc Thú Ánh Trăng", value: "Đoàn Xiếc Thú Ánh Trăng", url: "http://truyentuan.com/doan-xiec-thu-anh-trang/" }, { label: "Shin Kotaro Makaritoru! Juudouhen", value: "Shin Kotaro Makaritoru! Juudouhen", url: "http://truyentuan.com/shin-kotaro-makaritoru-juudouhen/" }, { label: "Đại Quân Phiệt", value: "Đại Quân Phiệt", url: "http://truyentuan.com/dai-quan-phiet/" }, { label: "Okitenemuru", value: "Okitenemuru", url: "http://truyentuan.com/okitenemuru/" }, { label: "Nữ Nhân Dũng Cảm", value: "Nữ Nhân Dũng Cảm", url: "http://truyentuan.com/nu-nhan-dung-cam/" }, { label: "Dragon Ball Z – Frieza Hồi Sinh", value: "Dragon Ball Z – Frieza Hồi Sinh", url: "http://truyentuan.com/dragon-ball-z-frieza-hoi-sinh/" }, { label: "Thanh Gươm Ma Thuật", value: "Thanh Gươm Ma Thuật", url: "http://truyentuan.com/thanh-guom-ma-thuat/" }, { label: "Black Bird", value: "Black Bird", url: "http://truyentuan.com/black-bird/" }, { label: "Shinigamisama ni Saigo no Onegai", value: "Shinigamisama ni Saigo no Onegai", url: "http://truyentuan.com/shinigamisama-ni-saigo-no-onegai/" }, { label: "Shini Itaru Yamai", value: "Shini Itaru Yamai", url: "http://truyentuan.com/shini-itaru-yamai/" }, { label: "GDGD-DOGS", value: "GDGD-DOGS", url: "http://truyentuan.com/gdgd-dogs/" }, { label: "Hoa Phi Hoa", value: "Hoa Phi Hoa", url: "http://truyentuan.com/hoa-phi-hoa/" }, { label: "Naruto Ngoại Truyện", value: "Naruto Ngoại Truyện", url: "http://truyentuan.com/naruto-ngoai-truyen/" }, { label: "Sailor Moon", value: "Sailor Moon", url: "http://truyentuan.com/sailor-moon/" }, { label: "Shinsengumi imon peace maker", value: "Shinsengumi imon peace maker", url: "http://truyentuan.com/shinsengumi-imon-peace-maker/" }, { label: "Akatsuki no Yona", value: "Akatsuki no Yona", url: "http://truyentuan.com/akatsuki-no-yona/" }, { label: "YUUSHA GA SHINDA!", value: "YUUSHA GA SHINDA!", url: "http://truyentuan.com/yuusha-ga-shinda/" }, { label: "Sangoku Rensenki - Otome no Heihou!", value: "Sangoku Rensenki - Otome no Heihou!", url: "http://truyentuan.com/sangoku-rensenki-otome-no-heihou/" }, { label: "Sandwich Girl", value: "Sandwich Girl", url: "http://truyentuan.com/sandwich-girl/" }, { label: "SandLand", value: "SandLand", url: "http://truyentuan.com/sandland/" }, { label: "Sailor Fuku ni Onegai!", value: "Sailor Fuku ni Onegai!", url: "http://truyentuan.com/sailor-fuku-ni-onegai/" }, { label: "Ore no Kanojo to Osananajimi ga Shuraba Sugiru", value: "Ore no Kanojo to Osananajimi ga Shuraba Sugiru", url: "http://truyentuan.com/ore-no-kanojo-to-osananajimi-ga-shuraba-sugiru/" }, { label: "Trường Sinh Giới", value: "Trường Sinh Giới", url: "http://truyentuan.com/truong-sinh-gioi/" }, { label: "Snow of Spring", value: "Snow of Spring", url: "http://truyentuan.com/snow-of-spring/" }, { label: "Sai:Taker - Futari no Artemis", value: "Sai:Taker - Futari no Artemis", url: "http://truyentuan.com/saitaker-futari-no-artemis/" }, { label: "Flying Witch", value: "Flying Witch", url: "http://truyentuan.com/flying-witch/" }, { label: "Rutta to Kodama", value: "Rutta to Kodama", url: "http://truyentuan.com/rutta-to-kodama/" }, { label: "Riki-Oh", value: "Riki-Oh", url: "http://truyentuan.com/riki-oh/" }, { label: "Rocking Heaven", value: "Rocking Heaven", url: "http://truyentuan.com/rocking-heaven/" }, { label: "Redrum 327", value: "Redrum 327", url: "http://truyentuan.com/redrum-327/" }, { label: "Quyền Đạo", value: "Quyền Đạo", url: "http://truyentuan.com/quyen-dao/" }, { label: "Barajou no Kiss", value: "Barajou no Kiss", url: "http://truyentuan.com/barajou-no-kiss/" }, { label: "Princess Princess", value: "Princess Princess", url: "http://truyentuan.com/princess-princess/" }, { label: "Pretty Face", value: "Pretty Face", url: "http://truyentuan.com/pretty-face/" }, { label: "Amaama to Inazuma", value: "Amaama to Inazuma", url: "http://truyentuan.com/amaama-to-inazuma/" }, { label: "Mạo Bài Đại Anh Hùng", value: "Mạo Bài Đại Anh Hùng", url: "http://truyentuan.com/mao-bai-dai-anh-hung/" }, { label: "Ouroboros", value: "Ouroboros", url: "http://truyentuan.com/ouroboros/" }, { label: "BioMega (Remake)", value: "BioMega (Remake)", url: "http://truyentuan.com/biomega-remake/" }, { label: "Phụng Lâm Thiên Hạ Vương Phi 13 Tuổi", value: "Phụng Lâm Thiên Hạ Vương Phi 13 Tuổi", url: "http://truyentuan.com/phung-lam-thien-ha-vuong-phi-13-tuoi/" }, { label: "Pháp Sư Trừ Tà", value: "Pháp Sư Trừ Tà", url: "http://truyentuan.com/phap-su-tru-ta/" }, { label: "Onegai Teacher", value: "Onegai Teacher", url: "http://truyentuan.com/onegai-teacher/" }, { label: "Bloodxblood", value: "Bloodxblood", url: "http://truyentuan.com/bloodxblood/" }, { label: "Ragnarok: Sword Of The Dark Ones", value: "Ragnarok: Sword Of The Dark Ones", url: "http://truyentuan.com/ragnarok-sword-of-the-dark-ones/" }, { label: "Paradise Kiss", value: "Paradise Kiss", url: "http://truyentuan.com/paradise-kiss/" }, { label: "Orange Yane no Chiisana Ie", value: "Orange Yane no Chiisana Ie", url: "http://truyentuan.com/orange-yane-no-chiisana-ie/" }, { label: "Nobody Knows", value: "Nobody Knows", url: "http://truyentuan.com/nobody-knows/" }, { label: "Neon Genesis Evangelion: Gakuen Datenroku", value: "Neon Genesis Evangelion: Gakuen Datenroku", url: "http://truyentuan.com/neon-genesis-evangelion-gakuen-datenroku/" }, { label: "Tiểu Ma Thần", value: "Tiểu Ma Thần", url: "http://truyentuan.com/tieu-ma-than/" }, { label: "Ngọc Trong Đá", value: "Ngọc Trong Đá", url: "http://truyentuan.com/ngoc-trong-da/" }, { label: "Ngoại Truyện Thần Binh", value: "Ngoại Truyện Thần Binh", url: "http://truyentuan.com/ngoai-truyen-than-binh/" }, { label: "Nana Mix!", value: "Nana Mix!", url: "http://truyentuan.com/nana-mix/" }, { label: "Nami Iro", value: "Nami Iro", url: "http://truyentuan.com/nami-iro/" }, { label: "My Boyfriend is a Vampire", value: "My Boyfriend is a Vampire", url: "http://truyentuan.com/my-boyfriend-is-a-vampire/" }, { label: "Ninja Loạn Thị (vuilen Scan)", value: "Ninja Loạn Thị (vuilen Scan)", url: "http://truyentuan.com/ninja-loan-thi-vuilen-scan/" }, { label: "Nhà Trọ Hoàn Hảo", value: "Nhà Trọ Hoàn Hảo", url: "http://truyentuan.com/nha-tro-hoan-hao/" }, { label: "Neko Majin Z", value: "Neko Majin Z", url: "http://truyentuan.com/neko-majin-z/" }, { label: "Mobile Suit Crossbone Gundam", value: "Mobile Suit Crossbone Gundam", url: "http://truyentuan.com/mobile-suit-crossbone-gundam/" }, { label: "Chrono Monochrome", value: "Chrono Monochrome", url: "http://truyentuan.com/chrono-monochrome/" }, { label: "Nguyệt Lạc Tử Hoa", value: "Nguyệt Lạc Tử Hoa", url: "http://truyentuan.com/nguyet-lac-tu-hoa/" }, { label: "Huyết Tộc Cấm Vực", value: "Huyết Tộc Cấm Vực", url: "http://truyentuan.com/huyet-toc-cam-vuc/" }, { label: "Nejimakiboshi to Aoi Sora", value: "Nejimakiboshi to Aoi Sora", url: "http://truyentuan.com/nejimakiboshi-to-aoi-sora/" }, { label: "Moryo Kiden", value: "Moryo Kiden", url: "http://truyentuan.com/moryo-kiden/" }, { label: "Mononoke", value: "Mononoke", url: "http://truyentuan.com/mononoke/" }, { label: "Miku Plus", value: "Miku Plus", url: "http://truyentuan.com/miku-plus/" }, { label: "Mizu no yakata", value: "Mizu no yakata", url: "http://truyentuan.com/mizu-no-yakata/" }, { label: "Re:Monster", value: "Re:Monster", url: "http://truyentuan.com/remonster/" }, { label: "Melancholic Princess", value: "Melancholic Princess", url: "http://truyentuan.com/melancholic-princess/" }, { label: "Matsuri Special", value: "Matsuri Special", url: "http://truyentuan.com/matsuri-special/" }, { label: "Marugoto Anjyu Gakuen", value: "Marugoto Anjyu Gakuen", url: "http://truyentuan.com/marugoto-anjyu-gakuen/" }, { label: "Mahou-no-Iroha!", value: "Mahou-no-Iroha!", url: "http://truyentuan.com/mahou-no-iroha/" }, { label: "Arcana Soul", value: "Arcana Soul", url: "http://truyentuan.com/arcana-soul/" }, { label: "Sự Mê Hoặc Của Sói", value: "Sự Mê Hoặc Của Sói", url: "http://truyentuan.com/su-me-hoac-cua-soi/" }, { label: "A Bittersweet Life", value: "A Bittersweet Life", url: "http://truyentuan.com/a-bittersweet-life/" }, { label: "A book of dreams", value: "A book of dreams", url: "http://truyentuan.com/a-book-of-dreams/" }, { label: "A Channel", value: "A Channel", url: "http://truyentuan.com/a-channel/" }, { label: "A Fairytale For The Demon Lord", value: "A Fairytale For The Demon Lord", url: "http://truyentuan.com/a-fairytale-for-the-demon-lord/" }, { label: "A Kiss For My Prince - Nụ hôn hoàng tử", value: "A Kiss For My Prince - Nụ hôn hoàng tử", url: "http://truyentuan.com/a-kiss-for-my-prince-nu-h/" }, { label: "Magic Kaito", value: "Magic Kaito", url: "http://truyentuan.com/magic-kaito/" }, { label: "Maburaho", value: "Maburaho", url: "http://truyentuan.com/maburaho/" }, { label: "Lovely Monster", value: "Lovely Monster", url: "http://truyentuan.com/lovely-monster/" }, { label: "Lục Tiểu Phụng - U Linh Sơn Trang", value: "Lục Tiểu Phụng - U Linh Sơn Trang", url: "http://truyentuan.com/luc-tieu-phung-u-linh-son-trang/" }, { label: "Cuốn từ điển kì bí", value: "Cuốn từ điển kì bí", url: "http://truyentuan.com/cuon-tu-dien-ki-bi/" }, { label: "Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka", value: "Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka", url: "http://truyentuan.com/dungeon-ni-deai-o-motomeru-no-wa-machigatte-iru-darou-ka/" }, { label: "Thần Châu Kỳ Hiệp", value: "Thần Châu Kỳ Hiệp", url: "http://truyentuan.com/than-chau-ky-hiep/" }, { label: "A Method to Make the Gentle World", value: "A Method to Make the Gentle World", url: "http://truyentuan.com/a-method-to-make-the-gentle-world/" }, { label: "A Simple Thinking About Bloodtype", value: "A Simple Thinking About Bloodtype", url: "http://truyentuan.com/a-simple-thinking-about-bloodtype/" }, { label: "A Thousand Years Ninetails", value: "A Thousand Years Ninetails", url: "http://truyentuan.com/a-thousand-years-ninetails/" }, { label: "AAA", value: "AAA", url: "http://truyentuan.com/aaa/" }, { label: "Gakkou Gurashi!", value: "Gakkou Gurashi!", url: "http://truyentuan.com/gakkou-gurashi/" }, { label: "HAMMER SESSION! IN HIGH SCHOOL", value: "HAMMER SESSION! IN HIGH SCHOOL", url: "http://truyentuan.com/hammer-session-in-high-school/" }, { label: "Otaku no Musume-san", value: "Otaku no Musume-san", url: "http://truyentuan.com/otaku-no-musume-san/" }, { label: "M.C.Law", value: "M.C.Law", url: "http://truyentuan.com/m-c-law/" }, { label: "Lớp Học Ưu Tú", value: "Lớp Học Ưu Tú", url: "http://truyentuan.com/lop-hoc-uu-tu/" }, { label: "Long Tộc", value: "Long Tộc", url: "http://truyentuan.com/long-toc/" }, { label: "Lolita Complex Phoenix", value: "Lolita Complex Phoenix", url: "http://truyentuan.com/lolita-complex-phoenix/" }, { label: "Akuma no Hanayome", value: "Akuma no Hanayome", url: "http://truyentuan.com/akuma-no-hanayome/" }, { label: "Abara", value: "Abara", url: "http://truyentuan.com/abara/" }, { label: "Absolute Boyfriend", value: "Absolute Boyfriend", url: "http://truyentuan.com/absolute-boyfriend/" }, { label: "Absolute Witch", value: "Absolute Witch", url: "http://truyentuan.com/absolute-witch/" }, { label: "Tsuyokute New Saga", value: "Tsuyokute New Saga", url: "http://truyentuan.com/tsuyokute-new-saga/" }, { label: "Detective Academy Q", value: "Detective Academy Q", url: "http://truyentuan.com/detective-academy-q/" }, { label: "Untouchable", value: "Untouchable", url: "http://truyentuan.com/untouchable/" }, { label: "Đấu La Đại Lục 2", value: "Đấu La Đại Lục 2", url: "http://truyentuan.com/dau-la-dai-luc-2/" }, { label: "Acchi Kocchi", value: "Acchi Kocchi", url: "http://truyentuan.com/acchi-kocchi/" }, { label: "Ace of Hearts", value: "Ace of Hearts", url: "http://truyentuan.com/ace-of-hearts/" }, { label: "Acony", value: "Acony", url: "http://truyentuan.com/acony/" }, { label: "Shishunki no Iron Maiden", value: "Shishunki no Iron Maiden", url: "http://truyentuan.com/shishunki-no-iron-maiden/" }, { label: "Nhà Trọ Nhất Khắc", value: "Nhà Trọ Nhất Khắc", url: "http://truyentuan.com/nha-tro-nhat-khac/" }, { label: "AKATSUKI NO ARIA", value: "AKATSUKI NO ARIA", url: "http://truyentuan.com/akatsuki-no-aria/" }, { label: "Koharu no Hibi", value: "Koharu no Hibi", url: "http://truyentuan.com/koharu-no-hibi/" }, { label: "Kobato", value: "Kobato", url: "http://truyentuan.com/kobato/" }, { label: "Action", value: "Action", url: "http://truyentuan.com/action/" }, { label: "Again!!", value: "Again!!", url: "http://truyentuan.com/again/" }, { label: "Age of Ultron", value: "Age of Ultron", url: "http://truyentuan.com/age-of-ultron/" }, { label: "Age of X", value: "Age of X", url: "http://truyentuan.com/age-of-x/" }, { label: "Ageha 100%", value: "Ageha 100%", url: "http://truyentuan.com/ageha-100/" }, { label: "Kuzu no Honkai", value: "Kuzu no Honkai", url: "http://truyentuan.com/kuzu-no-honkai/" }, { label: "Ai Hime - Ai to Himegoto", value: "Ai Hime - Ai to Himegoto", url: "http://truyentuan.com/ai-hime-ai-to-himegoto/" }, { label: "Ai Kara Hajimaru", value: "Ai Kara Hajimaru", url: "http://truyentuan.com/ai-kara-hajimaru/" }, { label: "Ai no Shitsutakabutta", value: "Ai no Shitsutakabutta", url: "http://truyentuan.com/ai-no-shitsutakabutta/" }, { label: "Ai Yori Aoshi", value: "Ai Yori Aoshi", url: "http://truyentuan.com/ai-yori-aoshi/" }, { label: "Aimer", value: "Aimer", url: "http://truyentuan.com/aimer/" }, { label: "Akagami no Shirayukihime", value: "Akagami no Shirayukihime", url: "http://truyentuan.com/akagami-no-shirayukihime/" }, { label: "Princess Resurrection", value: "Princess Resurrection", url: "http://truyentuan.com/princess-resurrection/" }, { label: "Mahou Tsukai no Yome", value: "Mahou Tsukai no Yome", url: "http://truyentuan.com/mahou-tsukai-no-yome/" }, { label: "Resentment", value: "Resentment", url: "http://truyentuan.com/resentment/" }, { label: "Idol Shopping", value: "Idol Shopping", url: "http://truyentuan.com/idol-shopping/" }, { label: "Rikudou", value: "Rikudou", url: "http://truyentuan.com/rikudou/" }, { label: "Chihayafuru", value: "Chihayafuru", url: "http://truyentuan.com/chihayafuru/" }, { label: "Shinya Shokudou", value: "Shinya Shokudou", url: "http://truyentuan.com/shinya-shokudou/" }, { label: "KUROZAKURO", value: "KUROZAKURO", url: "http://truyentuan.com/kurozakuro/" }, { label: "Zusun", value: "Zusun", url: "http://truyentuan.com/zusun/" }, { label: "Zettai Karen Children", value: "Zettai Karen Children", url: "http://truyentuan.com/zettai-karen-children/" }, { label: "Akaki Tsuki no Mawaru Koro", value: "Akaki Tsuki no Mawaru Koro", url: "http://truyentuan.com/akaki-tsuki-no-mawaru-koro/" }, { label: "Akaya Akashiya Ayakashino", value: "Akaya Akashiya Ayakashino", url: "http://truyentuan.com/akaya-akashiya-ayakashino/" }, { label: "Aku no Hana - Những bông hoa ác", value: "Aku no Hana - Những bông hoa ác", url: "http://truyentuan.com/aku-no-hana-nhung-bong-hoa-ac/" }, { label: "Aku no Higan", value: "Aku no Higan", url: "http://truyentuan.com/aku-no-higan/" }, { label: "Akuma de Sourou", value: "Akuma de Sourou", url: "http://truyentuan.com/akuma-de-sourou/" }, { label: "Aletheia", value: "Aletheia", url: "http://truyentuan.com/aletheia/" }, { label: "Vợ tôi là Hổ", value: "Vợ tôi là Hổ", url: "http://truyentuan.com/vo-toi-la-ho/" }, { label: "Diêm Đế", value: "Diêm Đế", url: "http://truyentuan.com/diem-de/" }, { label: "ALICE 38", value: "ALICE 38", url: "http://truyentuan.com/alice-38/" }, { label: "Amakusa 1637", value: "Amakusa 1637", url: "http://truyentuan.com/amakusa-1637/" }, { label: "Ane Log - Moyako Neesan no Tomaranai Monologue", value: "Ane Log - Moyako Neesan no Tomaranai Monologue", url: "http://truyentuan.com/ane-log-moyako-neesan-no-tomaranai-monologue/" }, { label: "Angel Voice", value: "Angel Voice", url: "http://truyentuan.com/angel-voice/" }, { label: "Angelic Layer", value: "Angelic Layer", url: "http://truyentuan.com/angelic-layer/" }, { label: "Fairy Tail Zero: Chú Mèo Lam Happy", value: "Fairy Tail Zero: Chú Mèo Lam Happy", url: "http://truyentuan.com/fairy-tail-zero-chu-meo-lam-happy/" }, { label: "Angel Diary", value: "Angel Diary", url: "http://truyentuan.com/angel/" }, { label: "Ani-Com", value: "Ani-Com", url: "http://truyentuan.com/ani-com/" }, { label: "ANNARASUMANARA", value: "ANNARASUMANARA", url: "http://truyentuan.com/annarasumanara/" }, { label: "Another", value: "Another", url: "http://truyentuan.com/another/" }, { label: "Ou-sama Game - Kigen", value: "Ou-sama Game - Kigen", url: "http://truyentuan.com/ou-sama-game-kigen/" }, { label: "EGO - Đôi Cánh Mơ Ước", value: "EGO - Đôi Cánh Mơ Ước", url: "http://truyentuan.com/ego-doi-canh-mo-uoc/" }, { label: "Special Martial Arts Extreme Hell Private High School", value: "Special Martial Arts Extreme Hell Private High School", url: "http://truyentuan.com/special-martial-arts-extreme-hell-private-high-school/" }, { label: "Bắc đẩu du hiệp", value: "Bắc đẩu du hiệp", url: "http://truyentuan.com/bac-dau-du-hiep/" }, { label: "Hare Kon", value: "Hare Kon", url: "http://truyentuan.com/hare-kon/" }, { label: "Qwan", value: "Qwan", url: "http://truyentuan.com/qwan/" }, { label: "Princess Lucia", value: "Princess Lucia", url: "http://truyentuan.com/princess-lucia/" }, { label: "Shin Kurosagi - Kanketsu Hen", value: "Shin Kurosagi - Kanketsu Hen", url: "http://truyentuan.com/shin-kurosagi-kanketsu-hen/" }, { label: "ANTIDOTE", value: "ANTIDOTE", url: "http://truyentuan.com/antidote/" }, { label: "Anti Anti Angel", value: "Anti Anti Angel", url: "http://truyentuan.com/anti-anti-angel/" }, { label: "ANTIMAGIA", value: "ANTIMAGIA", url: "http://truyentuan.com/antimagia/" }, { label: "Aoki Hagane no Arpeggio", value: "Aoki Hagane no Arpeggio", url: "http://truyentuan.com/aoki-hagane-no-arpeggio/" }, { label: "Apollo’s Song", value: "Apollo’s Song", url: "http://truyentuan.com/apollos-song/" }, { label: "Tuyệt Thế Vô Song 2", value: "Tuyệt Thế Vô Song 2", url: "http://truyentuan.com/tuyet-the-vo-song-2/" }, { label: "Love Of Firos You", value: "Love Of Firos You", url: "http://truyentuan.com/love-of-firos-you/" }, { label: "AKB0048 - Episode 0", value: "AKB0048 - Episode 0", url: "http://truyentuan.com/akb0048-episode-0/" }, { label: "Red Living On The Edge", value: "Red Living On The Edge", url: "http://truyentuan.com/red-living-on-the-edge/" }, { label: "Real", value: "Real", url: "http://truyentuan.com/real/" }, { label: "QP - Soul Of Violence", value: "QP - Soul Of Violence", url: "http://truyentuan.com/qp-soul-of-violence/" }, { label: "AQUA", value: "AQUA", url: "http://truyentuan.com/aqua/" }, { label: "Aquaman", value: "Aquaman", url: "http://truyentuan.com/aquaman/" }, { label: "Arata Kangatari", value: "Arata Kangatari", url: "http://truyentuan.com/arata-kangatari/" }, { label: "Aratama Tribe", value: "Aratama Tribe", url: "http://truyentuan.com/aratama-tribe/" }, { label: "ARIA", value: "ARIA", url: "http://truyentuan.com/aria/" }, { label: "Ero manga sensei", value: "Ero manga sensei", url: "http://truyentuan.com/ero-manga-sensei/" }, { label: "Mahou Gyoshonin Roma", value: "Mahou Gyoshonin Roma", url: "http://truyentuan.com/mahou-gyoshonin-roma/" }, { label: "Monku no Tsukeyou ga Nai Rabukome", value: "Monku no Tsukeyou ga Nai Rabukome", url: "http://truyentuan.com/monku-no-tsukeyou-ga-nai-rabukome/" }, { label: "Omae o Otaku ni Shiteyaru kara, Ore o Riajuu ni Shitekure!", value: "Omae o Otaku ni Shiteyaru kara, Ore o Riajuu ni Shitekure!", url: "http://truyentuan.com/omae-o-otaku-ni-shiteyaru-kara-ore-o-riajuu-ni-shitekure/" }, { label: "Zombie Brother - Thi Huynh", value: "Zombie Brother - Thi Huynh", url: "http://truyentuan.com/zombie-brother-thi-huynh/" }, { label: "Nakanmon!", value: "Nakanmon!", url: "http://truyentuan.com/nakanmon/" }, { label: "Zero In", value: "Zero In", url: "http://truyentuan.com/zero-in/" }, { label: "Aries", value: "Aries", url: "http://truyentuan.com/aries-th/" }, { label: "Aruosumente", value: "Aruosumente", url: "http://truyentuan.com/aruosumente/" }, { label: "Asari tinh nghịch", value: "Asari tinh nghịch", url: "http://truyentuan.com/asari-tinh-nghich/" }, { label: "Ashita no Kyouko-san", value: "Ashita no Kyouko-san", url: "http://truyentuan.com/ashita-no-kyouko-san/" }, { label: "Asklepios", value: "Asklepios", url: "http://truyentuan.com/asklepios/" }, { label: "Yowamushi Pedal - Chân đạp nhát gan", value: "Yowamushi Pedal - Chân đạp nhát gan", url: "http://truyentuan.com/yowamushi-pedal-chan-dap-nhat-gan/" }, { label: "Kanokon", value: "Kanokon", url: "http://truyentuan.com/kanokon/" }, { label: "Yugo - Kẻ thương thuyết", value: "Yugo - Kẻ thương thuyết", url: "http://truyentuan.com/yugo-ke-thuong-thuyet/" }, { label: "LiLim Kiss", value: "LiLim Kiss", url: "http://truyentuan.com/lilim-kiss/" }, { label: "Life Is Money", value: "Life Is Money", url: "http://truyentuan.com/life-is-money/" }, { label: "Kokoni iru yo", value: "Kokoni iru yo", url: "http://truyentuan.com/kokoni-iru-yo/" }, { label: "Attack!!", value: "Attack!!", url: "http://truyentuan.com/attack/" }, { label: "AUTOMATA", value: "AUTOMATA", url: "http://truyentuan.com/automata/" }, { label: "Ayakashi Hisen", value: "Ayakashi Hisen", url: "http://truyentuan.com/ayakashi-hisen/" }, { label: "Ayakashi Koi Emaki", value: "Ayakashi Koi Emaki", url: "http://truyentuan.com/ayakashi-koi-emaki/" }, { label: "Ayame to Amane", value: "Ayame to Amane", url: "http://truyentuan.com/ayame-to-amane/" }, { label: "Thiện Lương Tử Thần", value: "Thiện Lương Tử Thần", url: "http://truyentuan.com/thien-luong-tu-than/" }, { label: "Kobayashi ga Kawai Sugite Tsurai!!", value: "Kobayashi ga Kawai Sugite Tsurai!!", url: "http://truyentuan.com/kobayashi-ga-kawai-sugite-tsurai/" }, { label: "Kitsune no Akuma to Kuroi Madousho", value: "Kitsune no Akuma to Kuroi Madousho", url: "http://truyentuan.com/kitsune-no-akuma-to-kuroi-madousho/" }, { label: "King Of Thorns", value: "King Of Thorns", url: "http://truyentuan.com/king-of-thorns/" }, { label: "Bá Tước Lạnh Lùng", value: "Bá Tước Lạnh Lùng", url: "http://truyentuan.com/ba-tuoc-lanh-lung/" }, { label: "Baby Love", value: "Baby Love", url: "http://truyentuan.com/baby-love/" }, { label: "Baby Steps", value: "Baby Steps", url: "http://truyentuan.com/baby-steps/" }, { label: "Baki Dou", value: "Baki Dou", url: "http://truyentuan.com/baki-dou/" }, { label: "Bambino!", value: "Bambino!", url: "http://truyentuan.com/bambino/" }, { label: "KimiKiss - Various Heroines", value: "KimiKiss - Various Heroines", url: "http://truyentuan.com/kimikiss-various-heroines/" }, { label: "Kimi to Kami Hikoki to", value: "Kimi to Kami Hikoki to", url: "http://truyentuan.com/kimi-to-kami-hikoki-to/" }, { label: "Kimi ga Koi ni Oboreru", value: "Kimi ga Koi ni Oboreru", url: "http://truyentuan.com/kimi-ga-koi-ni-oboreru/" }, { label: "Kimi ni Koishite Ii desu ka.", value: "Kimi ni Koishite Ii desu ka.", url: "http://truyentuan.com/kimi-ni-koishite-ii-desu-ka/" }, { label: "Kimi ga Uso wo Tsuita", value: "Kimi ga Uso wo Tsuita", url: "http://truyentuan.com/kimi-ga-uso-wo-tsuita/" }, { label: "Kimi ni Happiness", value: "Kimi ni Happiness", url: "http://truyentuan.com/kimi-ni-happiness/" }, { label: "Kiben Gakuha, Yotsuya Senpai no Kaidan", value: "Kiben Gakuha, Yotsuya Senpai no Kaidan", url: "http://truyentuan.com/kiben-gakuha-yotsuya-senpai-no-kaidan/" }, { label: "Batman: Death Mask", value: "Batman: Death Mask", url: "http://truyentuan.com/batman-death-mask/" }, { label: "Battle B-Daman", value: "Battle B-Daman", url: "http://truyentuan.com/battle-b-daman/" }, { label: "Be Heun", value: "Be Heun", url: "http://truyentuan.com/be-heun/" }, { label: "Beley - Con quay truyền thuyết", value: "Beley - Con quay truyền thuyết", url: "http://truyentuan.com/beley-con-quay-truyen-thuyet/" }, { label: "Between You And I", value: "Between You And I", url: "http://truyentuan.com/between-you-and-i/" }, { label: "Bí Mật Tình Báo -ICA", value: "Bí Mật Tình Báo -ICA", url: "http://truyentuan.com/b/" }, { label: "Bi Minh Chi Kiêm", value: "Bi Minh Chi Kiêm", url: "http://truyentuan.com/bi-minh-chi-ki/" }, { label: "Big Sister VS Big Brother", value: "Big Sister VS Big Brother", url: "http://truyentuan.com/big-sister-vs-big-brother/" }, { label: "Billion Dogs", value: "Billion Dogs", url: "http://truyentuan.com/billion-dogs/" }, { label: "Black Rock Shooter - Innocent Soul", value: "Black Rock Shooter - Innocent Soul", url: "http://truyentuan.com/black-rock-shooter-innocent-soul/" }, { label: "Gakkyu Houtei - Trường Phán Quyết", value: "Gakkyu Houtei - Trường Phán Quyết", url: "http://truyentuan.com/gakkyu-houtei-truong-phan-quyet/" }, { label: "Lunar Legend Tsukihime", value: "Lunar Legend Tsukihime", url: "http://truyentuan.com/lunar-legend-tsukihime/" }, { label: "Tân Tứ Đại Danh Bổ", value: "Tân Tứ Đại Danh Bổ", url: "http://truyentuan.com/tan-tu-dai-danh-bo/" }, { label: "Blood", value: "Blood", url: "http://truyentuan.com/blood/" }, { label: "Bloody Mary", value: "Bloody Mary", url: "http://truyentuan.com/bloody-mary/" }, { label: "Boku kara Kimi ga Kienai", value: "Boku kara Kimi ga Kienai", url: "http://truyentuan.com/boku-kara-kimi-ga-kienai/" }, { label: "Boku ni Koi suru Mechanical", value: "Boku ni Koi suru Mechanical", url: "http://truyentuan.com/boku-ni-koi-suru-mechanical/" }, { label: "Boku ni Natta Watashi", value: "Boku ni Natta Watashi", url: "http://truyentuan.com/boku-ni-natta-watashi/" }, { label: "Darwins Game", value: "Darwins Game", url: "http://truyentuan.com/darwins-game/" }, { label: "Quỷ Vương", value: "Quỷ Vương", url: "http://truyentuan.com/quy-vuong/" }, { label: "Boku to Kanojo no XXX", value: "Boku to Kanojo no XXX", url: "http://truyentuan.com/boku-to-kanojo-no-xxx/" }, { label: "Boku no ushiro ni majo ga iru", value: "Boku no ushiro ni majo ga iru", url: "http://truyentuan.com/boku-no-ushiro-ni-majo-ga-iru/" }, { label: "Boku wa Ookami", value: "Boku wa Ookami", url: "http://truyentuan.com/boku-wa-ookami/" }, { label: "Bokura wa Itsumo", value: "Bokura wa Itsumo", url: "http://truyentuan.com/bokura-wa-itsumo/" }, { label: "Bokurano", value: "Bokurano", url: "http://truyentuan.com/bokurano/" }, { label: "Hội Pháp Sư", value: "Hội Pháp Sư", url: "http://truyentuan.com/hoi-phap-su/" }, { label: "Bóng rổ đường phố", value: "Bóng rổ đường phố", url: "http://truyentuan.com/bong-ro-duong-pho/" }, { label: "Boy Princess", value: "Boy Princess", url: "http://truyentuan.com/boy-princess/" }, { label: "Bremen", value: "Bremen", url: "http://truyentuan.com/bremen/" }, { label: "Book of Cain -", value: "Book of Cain -", url: "http://truyentuan.com/book-of-cain/" }, { label: "Bouken Shounen ( Adventure Boy )", value: "Bouken Shounen ( Adventure Boy )", url: "http://truyentuan.com/bouken-shounen-adventure-boy/" }, { label: "Kagamigami", value: "Kagamigami", url: "http://truyentuan.com/kagamigami/" }, { label: "Btx", value: "Btx", url: "http://truyentuan.com/b-2/" }, { label: "Brothers", value: "Brothers", url: "http://truyentuan.com/brothers/" }, { label: "BuzzeR BeateR", value: "BuzzeR BeateR", url: "http://truyentuan.com/buzzer-beater/" }, { label: "C.B.A (caber adventure)", value: "C.B.A (caber adventure)", url: "http://truyentuan.com/c-b-a-caber-adventure/" }, { label: "C.M.B.", value: "C.M.B.", url: "http://truyentuan.com/c-m-b/" }, { label: "Cain Saga", value: "Cain Saga", url: "http://truyentuan.com/cain-saga/" }, { label: "Candy Candy", value: "Candy Candy", url: "http://truyentuan.com/candy-candy/" }, { label: "Capoo cat", value: "Capoo cat", url: "http://truyentuan.com/capoo-cat/" }, { label: "Cat in the car", value: "Cat in the car", url: "http://truyentuan.com/cat-in-the-car/" }, { label: "Captain Tsubasa", value: "Captain Tsubasa", url: "http://truyentuan.com/captain-tsubasa/" }, { label: "Captain Tsubasa Road to 2002", value: "Captain Tsubasa Road to 2002", url: "http://truyentuan.com/captain-tsubasa-road-to-2002/" }, { label: "Captain Tsubasa World Youth", value: "Captain Tsubasa World Youth", url: "http://truyentuan.com/captain-tsubasa-world-youth/" }, { label: "Caramel Diary", value: "Caramel Diary", url: "http://truyentuan.com/caramel-diary/" }, { label: "C-BLOSSOM - CASE 729", value: "C-BLOSSOM - CASE 729", url: "http://truyentuan.com/c-blossom-case-729/" }, { label: "The Voynich Hotel", value: "The Voynich Hotel", url: "http://truyentuan.com/the-voynich-hotel/" }, { label: "In Full Bloom", value: "In Full Bloom", url: "http://truyentuan.com/in-full-bloom/" }, { label: "Chou yo hana yo", value: "Chou yo hana yo", url: "http://truyentuan.com/chou-yo-hana-yo/" }, { label: "Mahou Shoujo Site", value: "Mahou Shoujo Site", url: "http://truyentuan.com/mahou-shoujo-site/" }, { label: "Namida Usagi - Seifuku no Kataomoi", value: "Namida Usagi - Seifuku no Kataomoi", url: "http://truyentuan.com/namida-usagi-seifuku-no-kataomoi/" }, { label: "Youth Gone Wild", value: "Youth Gone Wild", url: "http://truyentuan.com/youth-gone-wild/" }, { label: "Yoru Cafe", value: "Yoru Cafe", url: "http://truyentuan.com/yoru-cafe/" }, { label: "Yamato Gensouki", value: "Yamato Gensouki", url: "http://truyentuan.com/yamato-gensouki/" }, { label: "Yamamoto Zenjirou To Moushimasu", value: "Yamamoto Zenjirou To Moushimasu", url: "http://truyentuan.com/yamamoto-zenjirou-to-moushimasu/" }, { label: "Card Captor Sakura", value: "Card Captor Sakura", url: "http://truyentuan.com/card-captor-sakura/" }, { label: "Cat Street", value: "Cat Street", url: "http://truyentuan.com/cat-street/" }, { label: "Cesare", value: "Cesare", url: "http://truyentuan.com/cesare/" }, { label: "charisma doll", value: "charisma doll", url: "http://truyentuan.com/charisma-doll/" }, { label: "Cherry love", value: "Cherry love", url: "http://truyentuan.com/cherry-love/" }, { label: "CHERRY BOY, THAT GIRL", value: "CHERRY BOY, THAT GIRL", url: "http://truyentuan.com/cherry-boy-that-girl/" }, { label: "Cherry Juice", value: "Cherry Juice", url: "http://truyentuan.com/cherry-juice/" }, { label: "Chess Isle", value: "Chess Isle", url: "http://truyentuan.com/chess-isle/" }, { label: "Chiến binh Totem", value: "Chiến binh Totem", url: "http://truyentuan.com/chien-binh-totem/" }, { label: "Chimpui- Chú Chuột Chinba", value: "Chimpui- Chú Chuột Chinba", url: "http://truyentuan.com/chimpui-ch/" }, { label: "Tiên Nghịch", value: "Tiên Nghịch", url: "http://truyentuan.com/tien-nghich/" }, { label: "XBLADE", value: "XBLADE", url: "http://truyentuan.com/xblade/" }, { label: "Working!!", value: "Working!!", url: "http://truyentuan.com/working/" }, { label: "Wolverine MAX (2013)", value: "Wolverine MAX (2013)", url: "http://truyentuan.com/wolverine-max-2013/" }, { label: "Chín chín tám mươi mốt", value: "Chín chín tám mươi mốt", url: "http://truyentuan.com/chin-chin-tam-muoi-mot/" }, { label: "Chitose etc.", value: "Chitose etc.", url: "http://truyentuan.com/chitose-etc/" }, { label: "Chronos DEEP", value: "Chronos DEEP", url: "http://truyentuan.com/chronos-deep/" }, { label: "Cinderella Boy", value: "Cinderella Boy", url: "http://truyentuan.com/cinderella-boy/" }, { label: "Chronicles of the Grim Peddler", value: "Chronicles of the Grim Peddler", url: "http://truyentuan.com/chronicles-of-the-grim-peddler/" }, { label: "Ngư Tổ Thần Châu", value: "Ngư Tổ Thần Châu", url: "http://truyentuan.com/ngu-to-than-chau/" }, { label: "Inari, Konkon, Koi Iroha", value: "Inari, Konkon, Koi Iroha", url: "http://truyentuan.com/inari-konkon-koi-iroha/" }, { label: "Kamichama Karin", value: "Kamichama Karin", url: "http://truyentuan.com/kamichama-karin/" }, { label: "Jigokuren - Love in the Hell", value: "Jigokuren - Love in the Hell", url: "http://truyentuan.com/jigokuren-love-in-the-hell/" }, { label: "Itsumo Misora", value: "Itsumo Misora", url: "http://truyentuan.com/itsumo-misora/" }, { label: "Clamp Gakuen Tanteidan", value: "Clamp Gakuen Tanteidan", url: "http://truyentuan.com/clamp-gakuen-tanteidan/" }, { label: "Clannad", value: "Clannad", url: "http://truyentuan.com/clannad/" }, { label: "Clockwork Planet", value: "Clockwork Planet", url: "http://truyentuan.com/clockwork-planet/" }, { label: "Coda", value: "Coda", url: "http://truyentuan.com/coda/" }, { label: "Coin laundry no onna", value: "Coin laundry no onna", url: "http://truyentuan.com/coin-laundry-no-onna/" }, { label: "Kannazuki no Miko", value: "Kannazuki no Miko", url: "http://truyentuan.com/kannazuki-no-miko/" }, { label: "Kamisama no Iutoori", value: "Kamisama no Iutoori", url: "http://truyentuan.com/kamisama-no-iutoori/" }, { label: "Itoshi No Karin", value: "Itoshi No Karin", url: "http://truyentuan.com/itoshi-no-karin/" }, { label: "Island", value: "Island", url: "http://truyentuan.com/island/" }, { label: "Inu Neko Jump", value: "Inu Neko Jump", url: "http://truyentuan.com/inu-neko-jump/" }, { label: "Inumimi", value: "Inumimi", url: "http://truyentuan.com/inumimi/" }, { label: "Imadoki", value: "Imadoki", url: "http://truyentuan.com/imadoki/" }, { label: "Ido Ido", value: "Ido Ido", url: "http://truyentuan.com/ido-ido/" }, { label: "i love u Suzuki", value: "i love u Suzuki", url: "http://truyentuan.com/i-love-u-suzuki/" }, { label: "Hungry Joker", value: "Hungry Joker", url: "http://truyentuan.com/hungry-joker/" }, { label: "Honey Coming - Sweet Love Lesson", value: "Honey Coming - Sweet Love Lesson", url: "http://truyentuan.com/honey-coming-sweet-love-lesson/" }, { label: "Chu Tước Ký", value: "Chu Tước Ký", url: "http://truyentuan.com/chu-tuoc-ki/" }, { label: "Covertness: Secretly, Greatly", value: "Covertness: Secretly, Greatly", url: "http://truyentuan.com/covertness-secretly-greatly/" }, { label: "Crab kiss", value: "Crab kiss", url: "http://truyentuan.com/crab-kiss/" }, { label: "Cutie Boy", value: "Cutie Boy", url: "http://truyentuan.com/cutie-boy/" }, { label: "High High", value: "High High", url: "http://truyentuan.com/high-high/" }, { label: "LOST IN LONDON", value: "LOST IN LONDON", url: "http://truyentuan.com/lost-in-london/" }, { label: "Tokku Hakkenshi [code:t-8]", value: "Tokku Hakkenshi [code:t-8]", url: "http://truyentuan.com/tokku-hakkenshi-codet-8/" }, { label: "Truyền thuyết về nakua", value: "Truyền thuyết về nakua", url: "http://truyentuan.com/truyen-thuyet-ve-nakua/" }, { label: "Nhân Cách Tối Cường", value: "Nhân Cách Tối Cường", url: "http://truyentuan.com/nhan-cach-toi-cuong/" }, { label: "Ultra Battle Satellite", value: "Ultra Battle Satellite", url: "http://truyentuan.com/ultra-battle-satellite/" }, { label: "cynical orange", value: "cynical orange", url: "http://truyentuan.com/cynical-orange/" }, { label: "Daa! Daa! Daa!", value: "Daa! Daa! Daa!", url: "http://truyentuan.com/daa-daa-daa/" }, { label: "Daburu Jurietto", value: "Daburu Jurietto", url: "http://truyentuan.com/daburu-jurietto/" }, { label: "Đặc Vụ Của Địa Ngục", value: "Đặc Vụ Của Địa Ngục", url: "http://truyentuan.com/dac-vu-cua-dia-nguc/" }, { label: "DAME NA WATASHI NI KOISHITE KUDASAI", value: "DAME NA WATASHI NI KOISHITE KUDASAI", url: "http://truyentuan.com/dame-na-watashi-ni-koishite-kudasai/" }, { label: "Yukikaze", value: "Yukikaze", url: "http://truyentuan.com/yukikaze/" }, { label: "Dan Doh! Xi", value: "Dan Doh! Xi", url: "http://truyentuan.com/dan-doh-xi/" }, { label: "Dansai Bunri no Crime Edge", value: "Dansai Bunri no Crime Edge", url: "http://truyentuan.com/dansai-bunri-no-crime-edge/" }, { label: "Dantalian no Shoka", value: "Dantalian no Shoka", url: "http://truyentuan.com/dantalian-no-shoka/" }, { label: "Đạo mộ bút ký", value: "Đạo mộ bút ký", url: "http://truyentuan.com/dao-mo-b/" }, { label: "Đảo tự sát", value: "Đảo tự sát", url: "http://truyentuan.com/dao-tu-sat/" }, { label: "Wild life Cuộc Sống Hoang Dã", value: "Wild life Cuộc Sống Hoang Dã", url: "http://truyentuan.com/wild-life-cuoc-song-hoang-da/" }, { label: "Tối Cường Tà Thiểu", value: "Tối Cường Tà Thiểu", url: "http://truyentuan.com/toi-cuong-ta-thieu/" }, { label: "Builder", value: "Builder", url: "http://truyentuan.com/builder/" }, { label: "Yondemasu yo, Azazel-san", value: "Yondemasu yo, Azazel-san", url: "http://truyentuan.com/yondemasu-yo-azazel-san/" }, { label: "Magical x Miracle", value: "Magical x Miracle", url: "http://truyentuan.com/magical-x-miracle/" }, { label: "Hanagimi to Koisuru Watashi", value: "Hanagimi to Koisuru Watashi", url: "http://truyentuan.com/hanagimi-to-koisuru-watashi/" }, { label: "Darker than Black", value: "Darker than Black", url: "http://truyentuan.com/darker-than-black/" }, { label: "Datte Suki Nandamon", value: "Datte Suki Nandamon", url: "http://truyentuan.com/datte-suki-nandamon/" }, { label: "Dear Mine", value: "Dear Mine", url: "http://truyentuan.com/dear-mine/" }, { label: "Dear Myself", value: "Dear Myself", url: "http://truyentuan.com/dear-myself/" }, { label: "Dekoboko Girlish", value: "Dekoboko Girlish", url: "http://truyentuan.com/dekoboko-girlish/" }, { label: "Dennou Alice to Inaba-kun", value: "Dennou Alice to Inaba-kun", url: "http://truyentuan.com/dennou-alice-to-inaba-kun/" }, { label: "Under Execution Under Jailbreak", value: "Under Execution Under Jailbreak", url: "http://truyentuan.com/under-execution-under-jailbreak/" }, { label: "Thần tại Nhân Gian", value: "Thần tại Nhân Gian", url: "http://truyentuan.com/than-tai-nhan-gian/" }, { label: "Nhất Võ Đạo", value: "Nhất Võ Đạo", url: "http://truyentuan.com/nhat-vo-dao/" }, { label: "Ibitsu", value: "Ibitsu", url: "http://truyentuan.com/ibitsu/" }, { label: "Hot Milk", value: "Hot Milk", url: "http://truyentuan.com/hot-milk/" }, { label: "Hozuki-san Chi no Aneki", value: "Hozuki-san Chi no Aneki", url: "http://truyentuan.com/hozuki-san-chi-no-aneki/" }, { label: "Densha Otoko", value: "Densha Otoko", url: "http://truyentuan.com/densha-otoko/" }, { label: "Dersert Coral", value: "Dersert Coral", url: "http://truyentuan.com/dersert-coral/" }, { label: "Devilman", value: "Devilman", url: "http://truyentuan.com/devilman/" }, { label: "Diamond Life", value: "Diamond Life", url: "http://truyentuan.com/diamond-life/" }, { label: "Địch Gia Lam", value: "Địch Gia Lam", url: "http://truyentuan.com/dich-gia-lam/" }, { label: "MIX", value: "MIX", url: "http://truyentuan.com/mix/" }, { label: "Trường Ca Hành", value: "Trường Ca Hành", url: "http://truyentuan.com/truong-ca-hanh/" }, { label: "Shiki", value: "Shiki", url: "http://truyentuan.com/shiki/" }, { label: "Freezing - Zero", value: "Freezing - Zero", url: "http://truyentuan.com/freezing-zero/" }, { label: "Soul eater", value: "Soul eater", url: "http://truyentuan.com/soul-eater/" }, { label: "DISTANT SKY", value: "DISTANT SKY", url: "http://truyentuan.com/distant-sky/" }, { label: "Divine Melody", value: "Divine Melody", url: "http://truyentuan.com/divine-melody-ti/" }, { label: "Do you want to try?", value: "Do you want to try?", url: "http://truyentuan.com/do-you-want-to-try/" }, { label: "Iten No Tsubasa", value: "Iten No Tsubasa", url: "http://truyentuan.com/d/" }, { label: "Donten ni Warau", value: "Donten ni Warau", url: "http://truyentuan.com/donten-ni-warau/" }, { label: "Montage (WATANABE Jun)", value: "Montage (WATANABE Jun)", url: "http://truyentuan.com/montage-watanabe-jun/" }, { label: "Hắc Báo Liệt Truyện", value: "Hắc Báo Liệt Truyện", url: "http://truyentuan.com/hac-bao-liet-truyen/" }, { label: "Ngôi Sao Kabi", value: "Ngôi Sao Kabi", url: "http://truyentuan.com/ngoi-sao-kabi/" }, { label: "Dorabase", value: "Dorabase", url: "http://truyentuan.com/dorabase-doraemon-b/" }, { label: "Dorothy of Oz", value: "Dorothy of Oz", url: "http://truyentuan.com/dorothy-of-oz/" }, { label: "Double Arts", value: "Double Arts", url: "http://truyentuan.com/double-arts/" }, { label: "Dragon Nest Random Scribbles", value: "Dragon Nest Random Scribbles", url: "http://truyentuan.com/dragon-nest-random-scribbles/" }, { label: "Dragon Nest: Shungeki no Sedo", value: "Dragon Nest: Shungeki no Sedo", url: "http://truyentuan.com/dragon-nest-shungeki-no-sedo/" }, { label: "Honey and Clover", value: "Honey and Clover", url: "http://truyentuan.com/honey-and-clover/" }, { label: "Home", value: "Home", url: "http://truyentuan.com/home/" }, { label: "Hohzuki Island - Đảo Kinh Hoàng", value: "Hohzuki Island - Đảo Kinh Hoàng", url: "http://truyentuan.com/hohzuki-island-dao-kinh-hoang/" }, { label: "Junji Itou Horror Comic Collection", value: "Junji Itou Horror Comic Collection", url: "http://truyentuan.com/junji-itou-horror-comic-collection/" }, { label: "Hirahira-kun Seishun Jingi", value: "Hirahira-kun Seishun Jingi", url: "http://truyentuan.com/hirahira-kun-seishun-jingi/" }, { label: "Dragon Quest II: Emblem of Roto", value: "Dragon Quest II: Emblem of Roto", url: "http://truyentuan.com/dragon-quest-ii-emblem-of-roto/" }, { label: "Drug-on", value: "Drug-on", url: "http://truyentuan.com/drug-on/" }, { label: "Duction Man", value: "Duction Man", url: "http://truyentuan.com/duction-man/" }, { label: "Durarara!! - Dollars/Mika Harima Arc", value: "Durarara!! - Dollars/Mika Harima Arc", url: "http://truyentuan.com/durarara-dollarsmika-harima-arc/" }, { label: "Dragon's Son Changsik (DeathPlace)", value: "Dragon's Son Changsik (DeathPlace)", url: "http://truyentuan.com/dragons-son-changsik-dp/" }, { label: "Yuusen Shoujo", value: "Yuusen Shoujo", url: "http://truyentuan.com/yuusen-shoujo/" }, { label: "Yuru Yuri", value: "Yuru Yuri", url: "http://truyentuan.com/yuru-yuri/" }, { label: "Yumeiro Patissiere", value: "Yumeiro Patissiere", url: "http://truyentuan.com/yumeiro-patissiere/" }, { label: "3D Kanojo - Bạn gái 3D", value: "3D Kanojo - Bạn gái 3D", url: "http://truyentuan.com/3d-kanojo-ban-gai-3d/" }, { label: "Eat-man", value: "Eat-man", url: "http://truyentuan.com/eat-man-2/" }, { label: "Elios electrical", value: "Elios electrical", url: "http://truyentuan.com/elios-electrical/" }, { label: "Elixir", value: "Elixir", url: "http://truyentuan.com/elixir/" }, { label: "Embalming - Ướp xác", value: "Embalming - Ướp xác", url: "http://truyentuan.com/embalming-uop-xac/" }, { label: "Emerging", value: "Emerging", url: "http://truyentuan.com/emerging/" }, { label: "Shokugeki no Soma - Etoile", value: "Shokugeki no Soma - Etoile", url: "http://truyentuan.com/shokugeki-no-soma-etoile/" }, { label: "X-Men: Hope Trilogy", value: "X-Men: Hope Trilogy", url: "http://truyentuan.com/x-men-hope-trilogy/" }, { label: "Welcome To The Convenience Store", value: "Welcome To The Convenience Store", url: "http://truyentuan.com/welcome-to-the-convenience-store/" }, { label: "Watchmen", value: "Watchmen", url: "http://truyentuan.com/watchmen/" }, { label: "Wake Up Deadman (Second Season)", value: "Wake Up Deadman (Second Season)", url: "http://truyentuan.com/wake-up-deadman-second-season/" }, { label: "With!!", value: "With!!", url: "http://truyentuan.com/with/" }, { label: "Wagaya no Oinarisama", value: "Wagaya no Oinarisama", url: "http://truyentuan.com/wagaya-no-oinarisama/" }, { label: "Emma", value: "Emma", url: "http://truyentuan.com/emma/" }, { label: "Emma đến từ địa phủ", value: "Emma đến từ địa phủ", url: "http://truyentuan.com/emma-den-tu-dia-phu/" }, { label: "En Passant", value: "En Passant", url: "http://truyentuan.com/en-passant/" }, { label: "End of Eternity: The Secret Hours", value: "End of Eternity: The Secret Hours", url: "http://truyentuan.com/end-of-eternity-the-secret-hours/" }, { label: "Endless Love", value: "Endless Love", url: "http://truyentuan.com/endless-love/" }, { label: "Naruto Gaiden: Hokage Đệ Thất", value: "Naruto Gaiden: Hokage Đệ Thất", url: "http://truyentuan.com/naruto-gaiden-hokage-de-that/" }, { label: "Evyione", value: "Evyione", url: "http://truyentuan.com/evyione-2/" }, { label: "Esprit", value: "Esprit", url: "http://truyentuan.com/esprit/" }, { label: "Fable", value: "Fable", url: "http://truyentuan.com/fable/" }, { label: "Fairy cube", value: "Fairy cube", url: "http://truyentuan.com/fairy-cube/" }, { label: "Fairy Heart", value: "Fairy Heart", url: "http://truyentuan.com/fairy-heart/" }, { label: "Fall In Love Like a Comic!", value: "Fall In Love Like a Comic!", url: "http://truyentuan.com/fall-in-love-like-a-comic/" }, { label: "Plastic Nee-san", value: "Plastic Nee-san", url: "http://truyentuan.com/plastic-nee-san/" }, { label: "Black Clover", value: "Black Clover", url: "http://truyentuan.com/black-clover/" }, { label: "Vương quốc của những dải băng bịt mắt (TT8)", value: "Vương quốc của những dải băng bịt mắt (TT8)", url: "http://truyentuan.com/vuong-quoc-cua-nhung-dai-bang-bit-mat-tt8/" }, { label: "Vùng Đất Xa Xăm", value: "Vùng Đất Xa Xăm", url: "http://truyentuan.com/vung-dat-xa-xam/" }, { label: "Hoán Đổi Nhiệm Màu", value: "Hoán Đổi Nhiệm Màu", url: "http://truyentuan.com/hoan-doi-nhiem-mau/" }, { label: "Đại Hiệp Truyền Kỳ", value: "Đại Hiệp Truyền Kỳ", url: "http://truyentuan.com/dai-hiep-truyen-ky/" }, { label: "Handa-kun", value: "Handa-kun", url: "http://truyentuan.com/handa-kun/" }, { label: "Stop!! Hibari-kun!", value: "Stop!! Hibari-kun!", url: "http://truyentuan.com/stop-hibari-kun/" }, { label: "Haru Matsu Bokura", value: "Haru Matsu Bokura", url: "http://truyentuan.com/haru-matsu-bokura/" }, { label: "Naruto Ngoại Truyện: Gương Mặt Thầy Kakashi", value: "Naruto Ngoại Truyện: Gương Mặt Thầy Kakashi", url: "http://truyentuan.com/naruto-ngoai-truyen-guong-mat-thay-kakashi/" }, { label: "Family compo", value: "Family compo", url: "http://truyentuan.com/family-compo/" }, { label: "Family Size", value: "Family Size", url: "http://truyentuan.com/family-size/" }, { label: "Fear Itself", value: "Fear Itself", url: "http://truyentuan.com/fear-itself/" }, { label: "Fetish Berry", value: "Fetish Berry", url: "http://truyentuan.com/fetish-berry/" }, { label: "Film girl", value: "Film girl", url: "http://truyentuan.com/film-girl/" }, { label: "Necrophile of Darkside Sister", value: "Necrophile of Darkside Sister", url: "http://truyentuan.com/necrophile-of-darkside-sister/" }, { label: "Urasai", value: "Urasai", url: "http://truyentuan.com/urasai/" }, { label: "Uwasa no Midori-Kun", value: "Uwasa no Midori-Kun", url: "http://truyentuan.com/uwasa-no-midori-kun/" }, { label: "Valkyria Nainen Kikan", value: "Valkyria Nainen Kikan", url: "http://truyentuan.com/valkyria-nainen-kikan/" }, { label: "Vampire Juujikai", value: "Vampire Juujikai", url: "http://truyentuan.com/vampire-juujikai/" }, { label: "Vampire Princess Miyu", value: "Vampire Princess Miyu", url: "http://truyentuan.com/vampire-princess-miyu/" }, { label: "Venus in love", value: "Venus in love", url: "http://truyentuan.com/venus-in-love/" }, { label: "Fire Stone", value: "Fire Stone", url: "http://truyentuan.com/fire-stone/" }, { label: "Fisheye Placebo", value: "Fisheye Placebo", url: "http://truyentuan.com/fisheye-placebo/" }, { label: "Fist of Legend", value: "Fist of Legend", url: "http://truyentuan.com/fist-of-legend/" }, { label: "FlashPoint", value: "FlashPoint", url: "http://truyentuan.com/flashpoint/" }, { label: "Flesh Colored Horror", value: "Flesh Colored Horror", url: "http://truyentuan.com/flesh-colored-horror/" }, { label: "Foreign Land of Ogres", value: "Foreign Land of Ogres", url: "http://truyentuan.com/foreign-land-of-ogres/" }, { label: "Fuan no Tane Plus", value: "Fuan no Tane Plus", url: "http://truyentuan.com/fuan-no-tane-plus/" }, { label: "Umineko no Naku Koro ni Episode 1: Legend of the Golden Witch", value: "Umineko no Naku Koro ni Episode 1: Legend of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-1-legend-of-the-golden-witch/" }, { label: "Umineko no Naku Koro ni Episode 2: Turn of the Golden Witch", value: "Umineko no Naku Koro ni Episode 2: Turn of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-2-turn-of-the-golden-witch/" }, { label: "Umineko no Naku Koro ni Episode 4: Alliance of the Golden Witch", value: "Umineko no Naku Koro ni Episode 4: Alliance of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-4-alliance-of-the-golden-witch/" }, { label: "Ultimate Fantastic Four", value: "Ultimate Fantastic Four", url: "http://truyentuan.com/ultimate-fantastic-four/" }, { label: "Tubame Syndrome", value: "Tubame Syndrome", url: "http://truyentuan.com/tubame-syndrome/" }, { label: "Fuguruma Memories", value: "Fuguruma Memories", url: "http://truyentuan.com/fuguruma-memories/" }, { label: "Fukashigi Philia", value: "Fukashigi Philia", url: "http://truyentuan.com/fukashigi-philia/" }, { label: "Fukigen Cinderella", value: "Fukigen Cinderella", url: "http://truyentuan.com/fukigen-cinderella/" }, { label: "Full Moon wo Sagashite", value: "Full Moon wo Sagashite", url: "http://truyentuan.com/full-moon-wo-sagashite/" }, { label: "Fun Fun Factory", value: "Fun Fun Factory", url: "http://truyentuan.com/fun-fun-factory/" }, { label: "Urami Koi, Koi, Urami Koi", value: "Urami Koi, Koi, Urami Koi", url: "http://truyentuan.com/urami-koi-koi-urami-koi/" }, { label: "Fushigi na shounen", value: "Fushigi na shounen", url: "http://truyentuan.com/fushigi-na-shounen/" }, { label: "Fushigi Yuugi Genbu Kaiden", value: "Fushigi Yuugi Genbu Kaiden", url: "http://truyentuan.com/fushigi-yuugi-genbu-kaiden/" }, { label: "Gakkou Kaidan", value: "Gakkou Kaidan", url: "http://truyentuan.com/gakkou-kaidan/" }, { label: "Gals", value: "Gals", url: "http://truyentuan.com/gals/" }, { label: "Gamushara", value: "Gamushara", url: "http://truyentuan.com/gamushara/" }, { label: "Ta Không Muốn Nói Ta Chỉ Là Một Con Gà", value: "Ta Không Muốn Nói Ta Chỉ Là Một Con Gà", url: "http://truyentuan.com/ta-khong-muon-noi-ta-chi-la-mot-con-ga/" }, { label: "Kasane", value: "Kasane", url: "http://truyentuan.com/kasane/" }, { label: "6000 the deep sea of madness", value: "6000 the deep sea of madness", url: "http://truyentuan.com/6000-the-deep-sea-of-madness/" }, { label: "Oh, My God!", value: "Oh, My God!", url: "http://truyentuan.com/oh-my-god/" }, { label: "Gan Kon", value: "Gan Kon", url: "http://truyentuan.com/gan-kon/" }, { label: "Gang King-Băng Đảng Học Đường", value: "Gang King-Băng Đảng Học Đường", url: "http://truyentuan.com/gang-king-bang-dang-hoc-duong/" }, { label: "GÁNH XIẾC QUÁI DỊ", value: "GÁNH XIẾC QUÁI DỊ", url: "http://truyentuan.com/ganh-xiec-quai-di/" }, { label: "Ganota No Onna", value: "Ganota No Onna", url: "http://truyentuan.com/ganota-no-onna/" }, { label: "Gate 7", value: "Gate 7", url: "http://truyentuan.com/gate-7/" }, { label: "Violinist of Hameln", value: "Violinist of Hameln", url: "http://truyentuan.com/violinist-of-hameln/" }, { label: "Vô Hạn Khủng Bố", value: "Vô Hạn Khủng Bố", url: "http://truyentuan.com/vo-han-khung-bo/" }, { label: "Twelve Nights", value: "Twelve Nights", url: "http://truyentuan.com/twelve-nights/" }, { label: "Tướng Dạ", value: "Tướng Dạ", url: "http://truyentuan.com/tuong-da/" }, { label: "Under One Roof", value: "Under One Roof", url: "http://truyentuan.com/under-one-roof/" }, { label: "Gekka no Kimi", value: "Gekka no Kimi", url: "http://truyentuan.com/gekka-no-kimi/" }, { label: "Gekkan Shojo Nozaki-kun", value: "Gekkan Shojo Nozaki-kun", url: "http://truyentuan.com/gekkan-shojo-nozaki-kun/" }, { label: "Gekkou Chou", value: "Gekkou Chou", url: "http://truyentuan.com/gekkou-chou/" }, { label: "Genjuu No Seiza", value: "Genjuu No Seiza", url: "http://truyentuan.com/genjuu-no-seiza/" }, { label: "Genkaku Picasso", value: "Genkaku Picasso", url: "http://truyentuan.com/genkaku-picasso/" }, { label: "Need a girl", value: "Need a girl", url: "http://truyentuan.com/need-a-girl/" }, { label: "Yamako", value: "Yamako", url: "http://truyentuan.com/yamako/" }, { label: "Nước Nhật Vui Vẻ", value: "Nước Nhật Vui Vẻ", url: "http://truyentuan.com/nuoc-nhat-vui-ve/" }, { label: "Hana to Akuma", value: "Hana to Akuma", url: "http://truyentuan.com/hana-to-akuma/" }, { label: "Sensei Kunshu", value: "Sensei Kunshu", url: "http://truyentuan.com/sensei-kunshu/" }, { label: "Genshiken", value: "Genshiken", url: "http://truyentuan.com/genshiken/" }, { label: "Gerbera", value: "Gerbera", url: "http://truyentuan.com/gerbera/" }, { label: "Getsu Mei Sei Ki", value: "Getsu Mei Sei Ki", url: "http://truyentuan.com/getsu-mei-sei-ki/" }, { label: "Sakurasaku Syndrome", value: "Sakurasaku Syndrome", url: "http://truyentuan.com/sakurasaku-syndrome/" }, { label: "Trường Học Bí Ẩn", value: "Trường Học Bí Ẩn", url: "http://truyentuan.com/truong-hoc-bi-an/" }, { label: "Tripeace", value: "Tripeace", url: "http://truyentuan.com/tripeace/" }, { label: "Triệu Hoá Vạn Tuế", value: "Triệu Hoá Vạn Tuế", url: "http://truyentuan.com/trieu-hoa-van-tue/" }, { label: "Trái Tim Của Một Người Bạn", value: "Trái Tim Của Một Người Bạn", url: "http://truyentuan.com/trai-tim-cua-mot-nguoi-ban/" }, { label: "Già Thiên", value: "Già Thiên", url: "http://truyentuan.com/gia-thien/" }, { label: "Gia Tộc Kumo", value: "Gia Tộc Kumo", url: "http://truyentuan.com/gia-toc-kumo/" }, { label: "Getter Robo Anthology", value: "Getter Robo Anthology", url: "http://truyentuan.com/getter-robo-anthology/" }, { label: "Giấc Mơ Ngọt Ngào", value: "Giấc Mơ Ngọt Ngào", url: "http://truyentuan.com/giac-mo-ngot-ngao/" }, { label: "Giang Hồ Hành", value: "Giang Hồ Hành", url: "http://truyentuan.com/giang-ho-hanh/" }, { label: "Giang Hồ Tương Vong", value: "Giang Hồ Tương Vong", url: "http://truyentuan.com/giang-ho-tuong-vong/" }, { label: "Giày Thuỷ Tinh", value: "Giày Thuỷ Tinh", url: "http://truyentuan.com/giay-thuy%cc%89-tinh/" }, { label: "Gigantomakhia", value: "Gigantomakhia", url: "http://truyentuan.com/gigantomakhia/" }, { label: "Imawa no Kuni no Alice", value: "Imawa no Kuni no Alice", url: "http://truyentuan.com/imawa-no-kuni-no-alice/" }, { label: "Toraneko Folklore", value: "Toraneko Folklore", url: "http://truyentuan.com/toraneko-folklore/" }, { label: "Tora to Ookami", value: "Tora to Ookami", url: "http://truyentuan.com/tora-to-ookami/" }, { label: "Tokyo Ravens", value: "Tokyo Ravens", url: "http://truyentuan.com/tokyo-ravens/" }, { label: "Tiji-kun!", value: "Tiji-kun!", url: "http://truyentuan.com/tiji-kun/" }, { label: "Ginga nagareboshi Gin", value: "Ginga nagareboshi Gin", url: "http://truyentuan.com/ginga-nagareboshi-gin/" }, { label: "Ginzatoushi to Kuro no Yousei - Sugar Apple Fairytale", value: "Ginzatoushi to Kuro no Yousei - Sugar Apple Fairytale", url: "http://truyentuan.com/ginzatoushi-to-kuro-no-yousei-sugar-apple-fairytale/" }, { label: "Gió Xuân", value: "Gió Xuân", url: "http://truyentuan.com/gio-xuan/" }, { label: "Girl Friends", value: "Girl Friends", url: "http://truyentuan.com/girl-friends/" }, { label: "God Child", value: "God Child", url: "http://truyentuan.com/god-child/" }, { label: "Going to you", value: "Going to you", url: "http://truyentuan.com/going-to-you/" }, { label: "Gohou Drug", value: "Gohou Drug", url: "http://truyentuan.com/gohou-drug/" }, { label: "Gojikanme no Sensou", value: "Gojikanme no Sensou", url: "http://truyentuan.com/gojikanme-no-sensou/" }, { label: "Đồng Hồ Cát", value: "Đồng Hồ Cát", url: "http://truyentuan.com/dong-ho-cat/" }, { label: "Hitoribocchi No Chikyuu Shinryaku", value: "Hitoribocchi No Chikyuu Shinryaku", url: "http://truyentuan.com/hitoribocchi-no-chikyuu-shinryaku/" }, { label: "Touhou - Life of Maid", value: "Touhou - Life of Maid", url: "http://truyentuan.com/touhou-life-of-maid/" }, { label: "Tokyo Girl Destruction", value: "Tokyo Girl Destruction", url: "http://truyentuan.com/tokyo-girl-destruction/" }, { label: "Tiệm Thời Trang", value: "Tiệm Thời Trang", url: "http://truyentuan.com/tiem-thoi-trang/" }, { label: "Thuyết Anh Hùng Thùy Thị Anh Hùng", value: "Thuyết Anh Hùng Thùy Thị Anh Hùng", url: "http://truyentuan.com/thuyet-anh-hung-thuy-thi-anh-hung/" }, { label: "Thề ước người và rồng", value: "Thề ước người và rồng", url: "http://truyentuan.com/the-uoc-nguoi-va-rong/" }, { label: "The Strings Dolls", value: "The Strings Dolls", url: "http://truyentuan.com/the-strings-dolls/" }, { label: "The kurosagi corpse delivery service", value: "The kurosagi corpse delivery service", url: "http://truyentuan.com/the-kurosagi-corpse-delivery-service/" }, { label: "The Hour Of The Mice", value: "The Hour Of The Mice", url: "http://truyentuan.com/the-hour-of-the-mice/" }, { label: "Gokusen", value: "Gokusen", url: "http://truyentuan.com/gokusen/" }, { label: "Ga-rei", value: "Ga-rei", url: "http://truyentuan.com/ga-rei/" }, { label: "Golden Time", value: "Golden Time", url: "http://truyentuan.com/golden-time/" }, { label: "Good Morning Call", value: "Good Morning Call", url: "http://truyentuan.com/good-morning-call/" }, { label: "Graineliers", value: "Graineliers", url: "http://truyentuan.com/graineliers/" }, { label: "Red String", value: "Red String", url: "http://truyentuan.com/red-string/" }, { label: "Võ Động Càn Khôn", value: "Võ Động Càn Khôn", url: "http://truyentuan.com/vo-dong-can-khon/" }, { label: "Thế Giới Tiên Hiệp", value: "Thế Giới Tiên Hiệp", url: "http://truyentuan.com/the-gioi-tien-hiep/" }, { label: "My Heart Is Beating", value: "My Heart Is Beating", url: "http://truyentuan.com/my-heart-is-beating/" }, { label: "Tri Bắc Du", value: "Tri Bắc Du", url: "http://truyentuan.com/tri-bac-du/" }, { label: "Grand Sun", value: "Grand Sun", url: "http://truyentuan.com/grand-sun/" }, { label: "Green Lantern", value: "Green Lantern", url: "http://truyentuan.com/green-lantern/" }, { label: "G-School", value: "G-School", url: "http://truyentuan.com/g-school/" }, { label: "Guardians of The Galaxy v3 2013", value: "Guardians of The Galaxy v3 2013", url: "http://truyentuan.com/guardians-of-the-galaxy-v3-2013-2/" }, { label: "Gundam Build Fighters: Amazing", value: "Gundam Build Fighters: Amazing", url: "http://truyentuan.com/gundam-build-fighters-amazing/" }, { label: "Thiên Tử Truyền Kỳ 3 - Lưu Manh Thiên Tử", value: "Thiên Tử Truyền Kỳ 3 - Lưu Manh Thiên Tử", url: "http://truyentuan.com/thien-tu-truyen-ki-luu-manh-thien-tu/" }, { label: "Thiên Thần Tập Sự", value: "Thiên Thần Tập Sự", url: "http://truyentuan.com/thien-than-tap-su/" }, { label: "Thiên Diệp Anh Hoa", value: "Thiên Diệp Anh Hoa", url: "http://truyentuan.com/thien-diep-anh-hoa/" }, { label: "Tenshi no Uta", value: "Tenshi no Uta", url: "http://truyentuan.com/tenshi-no-uta/" }, { label: "Tân Tác Trung Hoa Anh Hùng", value: "Tân Tác Trung Hoa Anh Hùng", url: "http://truyentuan.com/tan-tac-trung-hoa-anh-hung/" }, { label: "Gunjou Gakusha", value: "Gunjou Gakusha", url: "http://truyentuan.com/gunjou-gakusha/" }, { label: "Gunjou Senki", value: "Gunjou Senki", url: "http://truyentuan.com/gunjou-senki/" }, { label: "Gunka no Baltzar", value: "Gunka no Baltzar", url: "http://truyentuan.com/gunka-no-baltzar/" }, { label: "PoKeMon Pippi", value: "PoKeMon Pippi", url: "http://truyentuan.com/pokemon-pippi/" }, { label: "Aikora", value: "Aikora", url: "http://truyentuan.com/aikora/" }, { label: "Cửu Tinh Vô Song", value: "Cửu Tinh Vô Song", url: "http://truyentuan.com/cuu-tinh-vo-song/" }, { label: "Gyon-Woo và Jik-Nyu", value: "Gyon-Woo và Jik-Nyu", url: "http://truyentuan.com/gyon-woo-va-jik-nyu/" }, { label: "Gyutto Shite Chuu", value: "Gyutto Shite Chuu", url: "http://truyentuan.com/gyutto-shite-chuu/" }, { label: "H.H", value: "H.H", url: "http://truyentuan.com/h-h/" }, { label: "Hắc Khuyển", value: "Hắc Khuyển", url: "http://truyentuan.com/hac-khuyen/" }, { label: "Hachi", value: "Hachi", url: "http://truyentuan.com/hachi/" }, { label: "Seishun Pop", value: "Seishun Pop", url: "http://truyentuan.com/seishun-pop/" }, { label: "Hyakka no Shirushi", value: "Hyakka no Shirushi", url: "http://truyentuan.com/hyakka-no-shirushi/" }, { label: "Phong Khởi Thượng Lam", value: "Phong Khởi Thượng Lam", url: "http://truyentuan.com/phong-khoi-thuong-lam/" }, { label: "Thời Đại X Long", value: "Thời Đại X Long", url: "http://truyentuan.com/thoi-dai-x-long/" }, { label: "Thám Tử Kindaichi – Phần 2", value: "Thám Tử Kindaichi – Phần 2", url: "http://truyentuan.com/tham-tu-kindaichi-phan-2/" }, { label: "Tenkyuugi Sephirahtus", value: "Tenkyuugi Sephirahtus", url: "http://truyentuan.com/tenkyuugi-sephirahtus/" }, { label: "Teiden Shoujo to Hanemushi no Orchestra", value: "Teiden Shoujo to Hanemushi no Orchestra", url: "http://truyentuan.com/teiden-shoujo-to-hanemushi-no-orchestra/" }, { label: "Tế Công Truyền Kì", value: "Tế Công Truyền Kì", url: "http://truyentuan.com/te-cong-truyen-ki/" }, { label: "Tam Quốc Thần Binh", value: "Tam Quốc Thần Binh", url: "http://truyentuan.com/tam-quoc-than-binh/" }, { label: "Hachimitsu ni Hatsukoi", value: "Hachimitsu ni Hatsukoi", url: "http://truyentuan.com/hachimitsu-ni-hatsukoi/" }, { label: "HACK//LINK", value: "HACK//LINK", url: "http://truyentuan.com/hacklink/" }, { label: "Hai nửa tâm hồn", value: "Hai nửa tâm hồn", url: "http://truyentuan.com/hai-nua-tam-hon/" }, { label: "Hajimari no Niina", value: "Hajimari no Niina", url: "http://truyentuan.com/hajimari-no-niina/" }, { label: "HAKAIOU NORITAKA", value: "HAKAIOU NORITAKA", url: "http://truyentuan.com/hakaiou-noritaka/" }, { label: "Hakoiri Drops", value: "Hakoiri Drops", url: "http://truyentuan.com/hakoiri-drops/" }, { label: "Hakuji", value: "Hakuji", url: "http://truyentuan.com/hakuji/" }, { label: "Hakushaku to Yousei", value: "Hakushaku to Yousei", url: "http://truyentuan.com/hakushaku-to-yousei/" }, { label: "Hamatora", value: "Hamatora", url: "http://truyentuan.com/hamatora/" }, { label: "Hana ni Arashi", value: "Hana ni Arashi", url: "http://truyentuan.com/hana-ni-arashi/" }, { label: "Hana ni Kedamono", value: "Hana ni Kedamono", url: "http://truyentuan.com/hana-ni-kedamono/" }, { label: "Hana to Uso to Makoto", value: "Hana to Uso to Makoto", url: "http://truyentuan.com/hana-to-uso-to-makoto/" }, { label: "Hanamaru Youchien", value: "Hanamaru Youchien", url: "http://truyentuan.com/hanamaru-youchien/" }, { label: "Hanamai Koeda de Aimashou", value: "Hanamai Koeda de Aimashou", url: "http://truyentuan.com/hanamai-koeda-de-aimashou/" }, { label: "Hanatsukihime", value: "Hanatsukihime", url: "http://truyentuan.com/hanatsukihime/" }, { label: "Hanged Doll", value: "Hanged Doll", url: "http://truyentuan.com/hanged-doll/" }, { label: "Haou Densetsu Takeru", value: "Haou Densetsu Takeru", url: "http://truyentuan.com/haou-densetsu-takeru/" }, { label: "Hapi Buni", value: "Hapi Buni", url: "http://truyentuan.com/hapi-buni/" }, { label: "HAPPY and MURPHY", value: "HAPPY and MURPHY", url: "http://truyentuan.com/happy-and-murphy/" }, { label: "Hard Romantica", value: "Hard Romantica", url: "http://truyentuan.com/hard-romantica/" }, { label: "Shigatsu wa Kimi no Uso", value: "Shigatsu wa Kimi no Uso", url: "http://truyentuan.com/shigatsu-wa-kimi-no-uso/" }, { label: "Thiên Hạ Đệ Nhất Manh Phu", value: "Thiên Hạ Đệ Nhất Manh Phu", url: "http://truyentuan.com/thien-ha-de-nhat-manh-phu/" }, { label: "KING OF FIGHTERS ZILLION", value: "KING OF FIGHTERS ZILLION", url: "http://truyentuan.com/king-of-fighters-zillion/" }, { label: "Yakushoku Distpiari - Gesellshaft Blue", value: "Yakushoku Distpiari - Gesellshaft Blue", url: "http://truyentuan.com/yakushoku-distpiari/" }, { label: "Haru no Houtai Shoujo", value: "Haru no Houtai Shoujo", url: "http://truyentuan.com/haru-no-houtai-shoujo/" }, { label: "Hataraku Maousama", value: "Hataraku Maousama", url: "http://truyentuan.com/hataraku-maousama/" }, { label: "Hatenkou Yuugi", value: "Hatenkou Yuugi", url: "http://truyentuan.com/hatenkou-yuugi/" }, { label: "Hatsune Mix", value: "Hatsune Mix", url: "http://truyentuan.com/hatsune-mix/" }, { label: "Hayate x Blade", value: "Hayate x Blade", url: "http://truyentuan.com/hayate-x-blade/" }, { label: "Dagashi Kashi", value: "Dagashi Kashi", url: "http://truyentuan.com/dagashi-kashi/" }, { label: "Kengan Ashua", value: "Kengan Ashua", url: "http://truyentuan.com/kengan-ashua/" }, { label: "Michelin Star", value: "Michelin Star", url: "http://truyentuan.com/michelin-star/" }, { label: "Pine in the Flower Garden", value: "Pine in the Flower Garden", url: "http://truyentuan.com/pine-in-the-flower-garden/" }, { label: "He Is a High-school Girl", value: "He Is a High-school Girl", url: "http://truyentuan.com/he-is-a-high-school-girl/" }, { label: "Heart No Kakurega", value: "Heart No Kakurega", url: "http://truyentuan.com/heart-no-kakurega/" }, { label: "Hebi to Maria to Otsukisama", value: "Hebi to Maria to Otsukisama", url: "http://truyentuan.com/hebi-to-maria-to-otsukisama/" }, { label: "Hell’s Kitchen", value: "Hell’s Kitchen", url: "http://truyentuan.com/hells-kitchen/" }, { label: "Kaichou wa Maid-sama!", value: "Kaichou wa Maid-sama!", url: "http://truyentuan.com/kaichou-wa-maid-sama/" }, { label: "Watashi Ga Motete Dousunda", value: "Watashi Ga Motete Dousunda", url: "http://truyentuan.com/watashi-ga-motete-dousunda/" }, { label: "Shinrei Tantei Yakumo", value: "Shinrei Tantei Yakumo", url: "http://truyentuan.com/shinrei-tantei-yakumo/" }, { label: "Museum", value: "Museum", url: "http://truyentuan.com/museum/" }, { label: "Kare kano", value: "Kare kano", url: "http://truyentuan.com/kare-kano/" }, { label: "Sword Soul", value: "Sword Soul", url: "http://truyentuan.com/sword-soul/" }, { label: "Hero mask", value: "Hero mask", url: "http://truyentuan.com/hero-mask/" }, { label: "Marchan : The Embodiment of Tales", value: "Marchan : The Embodiment of Tales", url: "http://truyentuan.com/marchan-the-embodiment-of-tales/" }, { label: "The Children's Teacher, Mr. Kwon", value: "The Children's Teacher, Mr. Kwon", url: "http://truyentuan.com/the-children-teacher-mr-kwon/" }, { label: "Suki desu Suzuki-kun", value: "Suki desu Suzuki-kun", url: "http://truyentuan.com/suki-desu-suzuki-kun/" }, { label: "Sư tử Huyền Sơn", value: "Sư tử Huyền Sơn", url: "http://truyentuan.com/su-tu-huyen-son/" }, { label: "Stardust Wink", value: "Stardust Wink", url: "http://truyentuan.com/stardust-wink/" }, { label: "Heroine Shikkaku", value: "Heroine Shikkaku", url: "http://truyentuan.com/heroine-shikkaku/" }, { label: "Hetalia Blog Strips", value: "Hetalia Blog Strips", url: "http://truyentuan.com/hetalia-blog-strips/" }, { label: "Hi no Tori", value: "Hi no Tori", url: "http://truyentuan.com/hi-no-tori/" }, { label: "Hiệp Khách Hành", value: "Hiệp Khách Hành", url: "http://truyentuan.com/hiep-khach-hanh/" }, { label: "Hiệp sĩ nữ hoàng", value: "Hiệp sĩ nữ hoàng", url: "http://truyentuan.com/hiep-si-nu-hoang/" }, { label: "My boyfriend", value: "My boyfriend", url: "http://truyentuan.com/my-boyfriend/" }, { label: "By Chance, We... and...", value: "By Chance, We... and...", url: "http://truyentuan.com/by-chance-we-and/" }, { label: "Sekai Oni", value: "Sekai Oni", url: "http://truyentuan.com/sekai-oni/" }, { label: "Super Lovers", value: "Super Lovers", url: "http://truyentuan.com/super-lovers/" }, { label: "Superior Spider Man", value: "Superior Spider Man", url: "http://truyentuan.com/superior-spider-man/" }, { label: "Hiiro Ouji", value: "Hiiro Ouji", url: "http://truyentuan.com/hiiro-ouji/" }, { label: "Himawari-san", value: "Himawari-san", url: "http://truyentuan.com/himawari-san/" }, { label: "Hinamatsuri", value: "Hinamatsuri", url: "http://truyentuan.com/hinamatsuri/" }, { label: "Hiniiru", value: "Hiniiru", url: "http://truyentuan.com/hiniiru/" }, { label: "Hiyokoi", value: "Hiyokoi", url: "http://truyentuan.com/hiyokoi/" }, { label: "Hồ Ly Lãng Mạn", value: "Hồ Ly Lãng Mạn", url: "http://truyentuan.com/ho-ly-lang-man/" }, { label: "Hoa Hồng Tặng Anh", value: "Hoa Hồng Tặng Anh", url: "http://truyentuan.com/hoa-hong-tang-anh/" }, { label: "Hoa Thiên Cốt", value: "Hoa Thiên Cốt", url: "http://truyentuan.com/hoa-thien-cot/" }, { label: "Komatta Toki ni wa Hoshi ni Kike!", value: "Komatta Toki ni wa Hoshi ni Kike!", url: "http://truyentuan.com/komatta-toki-ni-wa-hoshi-ni-kike/" }, { label: "Nise Koi - Magical Patissier Kosaki-chan", value: "Nise Koi - Magical Patissier Kosaki-chan", url: "http://truyentuan.com/nise-koi-magical-patissier-kosaki-chan/" }, { label: "Tales Of Destiny", value: "Tales Of Destiny", url: "http://truyentuan.com/tales-of-destiny/" }, { label: "Tadashii Kodomo no Tsukurikata!", value: "Tadashii Kodomo no Tsukurikata!", url: "http://truyentuan.com/tadashii-kodomo-no-tsukurikata/" }, { label: "Sugarless", value: "Sugarless", url: "http://truyentuan.com/sugarless/" }, { label: "Steel Rose", value: "Steel Rose", url: "http://truyentuan.com/steel-rose/" }, { label: "Sougiya Ridoru - Undertaker Riddle", value: "Sougiya Ridoru - Undertaker Riddle", url: "http://truyentuan.com/sougiya-ridoru-undertaker-riddle/" }, { label: "Soukai Kessen", value: "Soukai Kessen", url: "http://truyentuan.com/soukai-kessen/" }, { label: "Toukyou Kushu (DP)", value: "Toukyou Kushu (DP)", url: "http://truyentuan.com/toukyou-kushu-dp/" }, { label: "Onihime VS", value: "Onihime VS", url: "http://truyentuan.com/onihime-vs/" }, { label: "Ookami-san to Shichinin no Nakamatachi", value: "Ookami-san to Shichinin no Nakamatachi", url: "http://truyentuan.com/ookami-san-to-shichinin-no-nakamatachi/" }, { label: "Open sesame", value: "Open sesame", url: "http://truyentuan.com/open-sesame/" }, { label: "Nowhere Boy", value: "Nowhere Boy", url: "http://truyentuan.com/nowhere-boy/" }, { label: "Monster X Monster", value: "Monster X Monster", url: "http://truyentuan.com/monster-x-monster/" }, { label: "Siêu nhân Locke", value: "Siêu nhân Locke", url: "http://truyentuan.com/sieu-nhan-locke/" }, { label: "Sidooh", value: "Sidooh", url: "http://truyentuan.com/sidooh/" }, { label: "Hoa và đoản kiếm", value: "Hoa và đoản kiếm", url: "http://truyentuan.com/hoa-va-doan-kiem/" }, { label: "Honey Crush", value: "Honey Crush", url: "http://truyentuan.com/honey-crush/" }, { label: "Honey na Koto", value: "Honey na Koto", url: "http://truyentuan.com/honey-na-koto/" }, { label: "Hoozuki no Reitetsu", value: "Hoozuki no Reitetsu", url: "http://truyentuan.com/hoozuki-no-reitetsu/" }, { label: "Hoshi no Koe", value: "Hoshi no Koe", url: "http://truyentuan.com/hoshi-no-koe/" }, { label: "Hyakki Yakoushou", value: "Hyakki Yakoushou", url: "http://truyentuan.com/hyakki-yakoushou/" }, { label: "Love Tyrant", value: "Love Tyrant", url: "http://truyentuan.com/love-tyrant/" }, { label: "Tân Teppi", value: "Tân Teppi", url: "http://truyentuan.com/tan-teppi/" }, { label: "Thiên Tử Truyền Kỳ 2 - Tần Vương Doanh Chính", value: "Thiên Tử Truyền Kỳ 2 - Tần Vương Doanh Chính", url: "http://truyentuan.com/thien-tu-truyen-ky-tan-vuong-doanh-chinh/" }, { label: "Shounen Oujo", value: "Shounen Oujo", url: "http://truyentuan.com/shounen-oujo/" }, { label: "Shounen Maid", value: "Shounen Maid", url: "http://truyentuan.com/shounen-maid/" }, { label: "Hoshi No Furu Machi", value: "Hoshi No Furu Machi", url: "http://truyentuan.com/hoshi-no-furu-machi/" }, { label: "Huyễn Thế Kỷ", value: "Huyễn Thế Kỷ", url: "http://truyentuan.com/huyen-the-ky/" }, { label: "Hyakko", value: "Hyakko", url: "http://truyentuan.com/hyakko/" }, { label: "Houkago no Ouji-sama", value: "Houkago no Ouji-sama", url: "http://truyentuan.com/houkago-no-ouji-sama/" }, { label: "Houkago X Ponytail", value: "Houkago X Ponytail", url: "http://truyentuan.com/houkago-x-ponytail/" }, { label: "Tung Tiền Hữu Tọa Linh Kiếm Sơn", value: "Tung Tiền Hữu Tọa Linh Kiếm Sơn", url: "http://truyentuan.com/tung-tien-huu-toa-linh-kiem-son/" }, { label: "Ma Vương Và Dũng Sĩ Và Thánh Kiếm Thần Điện", value: "Ma Vương Và Dũng Sĩ Và Thánh Kiếm Thần Điện", url: "http://truyentuan.com/ma-vuong-va-dung-si-va-thanh-kiem-than-dien/" }, { label: "Bạc Hà Chi Hạ", value: "Bạc Hà Chi Hạ", url: "http://truyentuan.com/bac-ha-chi-ha/" }, { label: "I Am a Hero", value: "I Am a Hero", url: "http://truyentuan.com/i-am-a-hero/" }, { label: "Ichiban Ushiro no Daimaou", value: "Ichiban Ushiro no Daimaou", url: "http://truyentuan.com/ichiban-ushiro-no-daimaou/" }, { label: "Ichigo Mashimaro", value: "Ichigo Mashimaro", url: "http://truyentuan.com/ichigo-mashimaro/" }, { label: "Ichigo To Anzu", value: "Ichigo To Anzu", url: "http://truyentuan.com/ichigo-to-anzu/" }, { label: "Shinshi Doumei Cross", value: "Shinshi Doumei Cross", url: "http://truyentuan.com/shinshi-doumei-cross/" }, { label: "Shin Saiseien - Minouchou Kyuutei Monogatari", value: "Shin Saiseien - Minouchou Kyuutei Monogatari", url: "http://truyentuan.com/shin-saiseien-minouchou-kyuutei-monogatari/" }, { label: "Seiken no Blacksmith", value: "Seiken no Blacksmith", url: "http://truyentuan.com/seiken-no-blacksmith/" }, { label: "Sayounara, Zetsubou-Sensei - Goodbye, Mr. Despair", value: "Sayounara, Zetsubou-Sensei - Goodbye, Mr. Despair", url: "http://truyentuan.com/sayounara-zetsubou-sensei-goodbye-mr-despair/" }, { label: "Scarlet Palace", value: "Scarlet Palace", url: "http://truyentuan.com/scarlet-palace/" }, { label: "IFRIT - Danzai no Enjin", value: "IFRIT - Danzai no Enjin", url: "http://truyentuan.com/ifrit-danzai-no-enjin/" }, { label: "Igyoujin Oniwakamaru", value: "Igyoujin Oniwakamaru", url: "http://truyentuan.com/igyoujin-oniwakamaru/" }, { label: "Iinchou No Himegoto", value: "Iinchou No Himegoto", url: "http://truyentuan.com/iinchou-no-himegoto/" }, { label: "Ikigami", value: "Ikigami", url: "http://truyentuan.com/ikigami/" }, { label: "Ikasama Memory", value: "Ikasama Memory", url: "http://truyentuan.com/ikasama-memory/" }, { label: "Seto No Hanayome", value: "Seto No Hanayome", url: "http://truyentuan.com/seto-no-hanayome/" }, { label: "Sengoku Armors", value: "Sengoku Armors", url: "http://truyentuan.com/sengoku-armors/" }, { label: "Sao Đổi Ngôi", value: "Sao Đổi Ngôi", url: "http://truyentuan.com/sao-doi-ngoi/" }, { label: "Sarasah", value: "Sarasah", url: "http://truyentuan.com/sarasah/" }, { label: "Sao Băng Trong Lòng", value: "Sao Băng Trong Lòng", url: "http://truyentuan.com/sao-bang-trong-long/" }, { label: "Ilegenes - Kokuyou no Kiseki", value: "Ilegenes - Kokuyou no Kiseki", url: "http://truyentuan.com/ilegenes-kokuyou-no-kiseki/" }, { label: "Immortal Hounds", value: "Immortal Hounds", url: "http://truyentuan.com/immortal-hounds/" }, { label: "Inochi", value: "Inochi", url: "http://truyentuan.com/inochi/" }, { label: "Sousei no Onmyouji", value: "Sousei no Onmyouji", url: "http://truyentuan.com/sousei-no-onmyouji/" }, { label: "Sorenari Ni Shinken Nandesu", value: "Sorenari Ni Shinken Nandesu", url: "http://truyentuan.com/sorenari-ni-shinken-nandesu/" }, { label: "Sora no Shita Yane no Naka", value: "Sora no Shita Yane no Naka", url: "http://truyentuan.com/sora-no-shita-yane-no-naka/" }, { label: "SaGa - Kiếm Thánh Sứ", value: "SaGa - Kiếm Thánh Sứ", url: "http://truyentuan.com/saga-kiem-thanh-su/" }, { label: "Ito Junji Cat", value: "Ito Junji Cat", url: "http://truyentuan.com/ito-junji-cat/" }, { label: "Itsuwaribito Utsuho", value: "Itsuwaribito Utsuho", url: "http://truyentuan.com/itsuwaribito-utsuho/" }, { label: "Jarinko Chie", value: "Jarinko Chie", url: "http://truyentuan.com/jarinko-chie/" }, { label: "Jigoku Sensei Nube", value: "Jigoku Sensei Nube", url: "http://truyentuan.com/jigoku-sensei-nube/" }, { label: "Jigoku Shoujo", value: "Jigoku Shoujo", url: "http://truyentuan.com/jigoku-shoujo/" }, { label: "Tây Du Ký Bựa", value: "Tây Du Ký Bựa", url: "http://truyentuan.com/tay-du-ki-bua/" }, { label: "Nichijou", value: "Nichijou", url: "http://truyentuan.com/nichijou/" }, { label: "Cuộc Phiêu Lưu Của Cậu Bé Croket", value: "Cuộc Phiêu Lưu Của Cậu Bé Croket", url: "http://truyentuan.com/cuoc-phieu-luu-cua-cau-be-croket/" }, { label: "Freak Island - Đảo Quái Dị", value: "Freak Island - Đảo Quái Dị", url: "http://truyentuan.com/freak-island-dao-quai-di/" }, { label: "Rokujouma no Shinryakusha!?", value: "Rokujouma no Shinryakusha!?", url: "http://truyentuan.com/rokujouma-no-shinryakusha/" }, { label: "Rokudenashi Blues", value: "Rokudenashi Blues", url: "http://truyentuan.com/rokudenashi-blues/" }, { label: "RE-TAKE", value: "RE-TAKE", url: "http://truyentuan.com/re-take/" }, { label: "RG Veda", value: "RG Veda", url: "http://truyentuan.com/rg-veda/" }, { label: "Puchimon", value: "Puchimon", url: "http://truyentuan.com/puchimon/" }, { label: "Judge", value: "Judge", url: "http://truyentuan.com/judge/" }, { label: "Junketsu Kareshi", value: "Junketsu Kareshi", url: "http://truyentuan.com/junketsu-kareshi/" }, { label: "Kagerou Day Anthology", value: "Kagerou Day Anthology", url: "http://truyentuan.com/kagerou-day-anthology/" }, { label: "Kagijin-Khóa Nhân", value: "Kagijin-Khóa Nhân", url: "http://truyentuan.com/kagijin-khoa-nhan/" }, { label: "Kaguya Hime", value: "Kaguya Hime", url: "http://truyentuan.com/kaguya-hime/" }, { label: "Nanoka no Kare", value: "Nanoka no Kare", url: "http://truyentuan.com/nanoka-no-kare/" }, { label: "Stand Up!", value: "Stand Up!", url: "http://truyentuan.com/stand-up/" }, { label: "Ojousama wa Oyomesama", value: "Ojousama wa Oyomesama", url: "http://truyentuan.com/ojousama-wa-oyomesama/" }, { label: "Shitsuji-sama no Okiniiri", value: "Shitsuji-sama no Okiniiri", url: "http://truyentuan.com/shitsuji-sama-no-okiniiri/" }, { label: "Reimei no Arcana", value: "Reimei no Arcana", url: "http://truyentuan.com/reimei-no-arcana/" }, { label: "Puripuri", value: "Puripuri", url: "http://truyentuan.com/puripuri/" }, { label: "Kaiouki - Hải Hoàng Ký", value: "Kaiouki - Hải Hoàng Ký", url: "http://truyentuan.com/kaiouki-hai-hoang-ky/" }, { label: "kaito kid", value: "kaito kid", url: "http://truyentuan.com/kaito-kid/" }, { label: "KAIN", value: "KAIN", url: "http://truyentuan.com/kain/" }, { label: "K - The First", value: "K - The First", url: "http://truyentuan.com/k-the-first/" }, { label: "Kono Sekai ga Game da to, Ore dake ga Shitteiru", value: "Kono Sekai ga Game da to, Ore dake ga Shitteiru", url: "http://truyentuan.com/kono-sekai-ga-game-da-to-ore-dake-ga-shitteiru/" }, { label: "Pokemon philatelic: Dou", value: "Pokemon philatelic: Dou", url: "http://truyentuan.com/pokemon-philatelic-dou/" }, { label: "Player Kill", value: "Player Kill", url: "http://truyentuan.com/player-kill/" }, { label: "Piano no Mori", value: "Piano no Mori", url: "http://truyentuan.com/piano-no-mori/" }, { label: "KAKEGURUI", value: "KAKEGURUI", url: "http://truyentuan.com/kakegurui/" }, { label: "Kami no Shizuku", value: "Kami no Shizuku", url: "http://truyentuan.com/kami-no-shizuku/" }, { label: "Kamikami Kaeshi", value: "Kamikami Kaeshi", url: "http://truyentuan.com/kamikami-kaeshi/" }, { label: "Kanata Kara", value: "Kanata Kara", url: "http://truyentuan.com/kanata-kara/" }, { label: "Level Up", value: "Level Up", url: "http://truyentuan.com/level-up/" }, { label: "Karakai Jouzu no Takagi-san", value: "Karakai Jouzu no Takagi-san", url: "http://truyentuan.com/karakai-jouzu-no-takagi-san/" }, { label: "Karakuridouji Ultimo", value: "Karakuridouji Ultimo", url: "http://truyentuan.com/karakuridouji-ultimo/" }, { label: "Kẻ Đồng Hành", value: "Kẻ Đồng Hành", url: "http://truyentuan.com/ke-dong-hanh/" }, { label: "Kế Hoạch Bướm", value: "Kế Hoạch Bướm", url: "http://truyentuan.com/ke-hoach-buom/" }, { label: "Kemono Kingdom Zoo", value: "Kemono Kingdom Zoo", url: "http://truyentuan.com/kemono-kingdom-zoo/" }, { label: "Ribbon no kishi", value: "Ribbon no kishi", url: "http://truyentuan.com/ribbon-no-kishi/" }, { label: "Pika Ichi", value: "Pika Ichi", url: "http://truyentuan.com/pika-ichi/" }, { label: "PLANETARY", value: "PLANETARY", url: "http://truyentuan.com/planetary/" }, { label: "Phi Đãi Nghiên Tuyết", value: "Phi Đãi Nghiên Tuyết", url: "http://truyentuan.com/phi-dai-nghien-tuyet/" }, { label: "Papillon hana to chou", value: "Papillon hana to chou", url: "http://truyentuan.com/papillon-hana-to-chou/" }, { label: "Khát Vọng Đường Đua", value: "Khát Vọng Đường Đua", url: "http://truyentuan.com/khat-vong-duong-dua/" }, { label: "Khỉ Biển", value: "Khỉ Biển", url: "http://truyentuan.com/khi-bien/" }, { label: "Kiba no Tabishounin - The Arms Peddler", value: "Kiba no Tabishounin - The Arms Peddler", url: "http://truyentuan.com/kiba-no-tabishounin-the-arms-peddler/" }, { label: "Kidou Senshi Crossbone Gundam", value: "Kidou Senshi Crossbone Gundam", url: "http://truyentuan.com/kidou-senshi-crossbone-gundam/" }, { label: "Kiếm Đạo Độc Tôn", value: "Kiếm Đạo Độc Tôn", url: "http://truyentuan.com/kiem-dao-doc-ton/" }, { label: "Nhiệm vụ đặc biệt", value: "Nhiệm vụ đặc biệt", url: "http://truyentuan.com/nhiem-vu-dac-biet/" }, { label: "Parfait Tic!", value: "Parfait Tic!", url: "http://truyentuan.com/parfait-tic/" }, { label: "Peace Maker Kurogane", value: "Peace Maker Kurogane", url: "http://truyentuan.com/peace-maker-kurogane/" }, { label: "Pen Saki ni Syrup", value: "Pen Saki ni Syrup", url: "http://truyentuan.com/pen-saki-ni-syrup/" }, { label: "Pajama na Kanojo", value: "Pajama na Kanojo", url: "http://truyentuan.com/pajama-na-kanojo/" }, { label: "Kiếm khách Baek Dong So", value: "Kiếm khách Baek Dong So", url: "http://truyentuan.com/kiem-khach-baek-dong-so/" }, { label: "Kiêu Lý Kiều Khí", value: "Kiêu Lý Kiều Khí", url: "http://truyentuan.com/kieu-ly-kieu-khi/" }, { label: "Killer Stall", value: "Killer Stall", url: "http://truyentuan.com/killer-stall/" }, { label: "Kimi ja Nakya Dame Nanda", value: "Kimi ja Nakya Dame Nanda", url: "http://truyentuan.com/kimi-ja-nakya-dame-nanda/" }, { label: "Kiku", value: "Kiku", url: "http://truyentuan.com/kiku/" }, { label: "Ouran High School Host Club[ remake]", value: "Ouran High School Host Club[ remake]", url: "http://truyentuan.com/ouran-high-school-host-club-remake/" }, { label: "OreImo DJ Collection", value: "OreImo DJ Collection", url: "http://truyentuan.com/oreimo-dj-collection/" }, { label: "Orange", value: "Orange", url: "http://truyentuan.com/orange/" }, { label: "Only The Flower Knows", value: "Only The Flower Knows", url: "http://truyentuan.com/only-the-flower-knows/" }, { label: "Oniisama e...", value: "Oniisama e...", url: "http://truyentuan.com/oniisama-e/" }, { label: "Onidere!", value: "Onidere!", url: "http://truyentuan.com/onidere/" }, { label: "One-Pound Gospel", value: "One-Pound Gospel", url: "http://truyentuan.com/one-pound-gospel/" }, { label: "Oda Nobuna no Yabou - Himesama to Issho", value: "Oda Nobuna no Yabou - Himesama to Issho", url: "http://truyentuan.com/oda-nobuna-no-yabou-himesama-to-issho/" }, { label: "Kimi no Knife", value: "Kimi no Knife", url: "http://truyentuan.com/kimi-no-knife/" }, { label: "Kimi no Neiro", value: "Kimi no Neiro", url: "http://truyentuan.com/kimi-no-neiro/" }, { label: "Kimi wa Pet", value: "Kimi wa Pet", url: "http://truyentuan.com/kimi-wa-pet/" }, { label: "King Golf", value: "King Golf", url: "http://truyentuan.com/king-golf/" }, { label: "Kingdom of Zombie", value: "Kingdom of Zombie", url: "http://truyentuan.com/kingdom-of-zombie/" }, { label: "Kyokou Suiri", value: "Kyokou Suiri", url: "http://truyentuan.com/kyokou-suiri/" }, { label: "Missile & Planckton", value: "Missile & Planckton", url: "http://truyentuan.com/missile-planckton/" }, { label: "Kiss Wood", value: "Kiss Wood", url: "http://truyentuan.com/kiss-wood/" }, { label: "Kobatotei Ibun", value: "Kobatotei Ibun", url: "http://truyentuan.com/kobatotei-ibun/" }, { label: "Kodomo no omocha", value: "Kodomo no omocha", url: "http://truyentuan.com/kodomo-no-omocha/" }, { label: "Koisome Momiji", value: "Koisome Momiji", url: "http://truyentuan.com/koisome-momiji/" }, { label: "Kokoro Ni Hana Wo", value: "Kokoro Ni Hana Wo", url: "http://truyentuan.com/kokoro-ni-hana-wo/" }, { label: "Zang Hun Men", value: "Zang Hun Men", url: "http://truyentuan.com/zang-hun-men/" }, { label: "Okitsune-sama de Chu", value: "Okitsune-sama de Chu", url: "http://truyentuan.com/okitsune-sama-de-chu/" }, { label: "Obaka-chan, Koigatariki", value: "Obaka-chan, Koigatariki", url: "http://truyentuan.com/obaka-chan-koigatariki/" }, { label: "O/A", value: "O/A", url: "http://truyentuan.com/oa/" }, { label: "Nụ Hôn Tinh Ngịch", value: "Nụ Hôn Tinh Ngịch", url: "http://truyentuan.com/nu-hon-tinh-nghich/" }, { label: "Nozomi Witches", value: "Nozomi Witches", url: "http://truyentuan.com/nozomi-witches/" }, { label: "Komorebi no Kuni", value: "Komorebi no Kuni", url: "http://truyentuan.com/komorebi-no-kuni/" }, { label: "Konjiki no Gash!!", value: "Konjiki no Gash!!", url: "http://truyentuan.com/konjiki-no-gash/" }, { label: "Konya Mo Nemurenai", value: "Konya Mo Nemurenai", url: "http://truyentuan.com/konya-mo-nemurenai/" }, { label: "Konohanatei Kitan", value: "Konohanatei Kitan", url: "http://truyentuan.com/konohanatei-kitan/" }, { label: "Ngân Chi Thủ Mộ Nhân", value: "Ngân Chi Thủ Mộ Nhân", url: "http://truyentuan.com/ngan-chi-thu-mo-nhan/" }, { label: "Ngưu Lang - Chức Nữ", value: "Ngưu Lang - Chức Nữ", url: "http://truyentuan.com/nguu-lang-chuc-nu/" }, { label: "Ng Life", value: "Ng Life", url: "http://truyentuan.com/ng-life/" }, { label: "New X-Men: Academy X", value: "New X-Men: Academy X", url: "http://truyentuan.com/new-x-men-academy-x/" }, { label: "Koucha Ouji", value: "Koucha Ouji", url: "http://truyentuan.com/koucha-ouji/" }, { label: "Những Cô Bé Bạc Hà", value: "Những Cô Bé Bạc Hà", url: "http://truyentuan.com/nhung-co-be-bac-ha/" }, { label: "Neung Neung", value: "Neung Neung", url: "http://truyentuan.com/neung-neung/" }, { label: "Nejimaki Kagyu", value: "Nejimaki Kagyu", url: "http://truyentuan.com/nejimaki-kagyu/" }, { label: "Necromancer", value: "Necromancer", url: "http://truyentuan.com/necromancer/" }, { label: "Nabi - Cánh Bướm", value: "Nabi - Cánh Bướm", url: "http://truyentuan.com/nabi-canh-buom/" }, { label: "Kouishou Radio", value: "Kouishou Radio", url: "http://truyentuan.com/kouishou-radio/" }, { label: "Kuragehime - Công chúa sứa", value: "Kuragehime - Công chúa sứa", url: "http://truyentuan.com/kuragehime-cong-chua-sua/" }, { label: "Kyokou No Ou", value: "Kyokou No Ou", url: "http://truyentuan.com/kyokou-no-ou/" }, { label: "Kyou no kira kun", value: "Kyou no kira kun", url: "http://truyentuan.com/kyou-no-kira-kun/" }, { label: "Kuroyome", value: "Kuroyome", url: "http://truyentuan.com/kuroyome/" }, { label: "Princess - công chúa xứ hoa p1 - p4", value: "Princess - công chúa xứ hoa p1 - p4", url: "http://truyentuan.com/princess-cong-chua-xu-hoa/" }, { label: "La Linh Ma Lực", value: "La Linh Ma Lực", url: "http://truyentuan.com/la-linh-ma-luc/" }, { label: "La Phù", value: "La Phù", url: "http://truyentuan.com/la-phu/" }, { label: "Làm Thuê", value: "Làm Thuê", url: "http://truyentuan.com/lam-thue/" }, { label: "Làm Vương Gia Không Dễ", value: "Làm Vương Gia Không Dễ", url: "http://truyentuan.com/lam-vuong-gia-khong-de/" }, { label: "Làng quái vật", value: "Làng quái vật", url: "http://truyentuan.com/lang-quai-vat/" }, { label: "Lập Hoa Chánh Nhân", value: "Lập Hoa Chánh Nhân", url: "http://truyentuan.com/lap-hoa-chanh-nhan/" }, { label: "Na Tra", value: "Na Tra", url: "http://truyentuan.com/na-tra/" }, { label: "My Junior Can't Be This Cute", value: "My Junior Can't Be This Cute", url: "http://truyentuan.com/my-junior-cant-be-this-cute/" }, { label: "MUV LUV Unlimited", value: "MUV LUV Unlimited", url: "http://truyentuan.com/muv-luv-unlimited/" }, { label: "Musunde Hiraite", value: "Musunde Hiraite", url: "http://truyentuan.com/musunde-hiraite/" }, { label: "Mushoku Tensei - Isekai Ittara Honki Dasu", value: "Mushoku Tensei - Isekai Ittara Honki Dasu", url: "http://truyentuan.com/mushoku-tensei-isekai-ittara-honki-dasu/" }, { label: "Musashi No9", value: "Musashi No9", url: "http://truyentuan.com/musashi-no9/" }, { label: "Last man", value: "Last man", url: "http://truyentuan.com/last-man/" }, { label: "Legend Hustle", value: "Legend Hustle", url: "http://truyentuan.com/legend-hustle/" }, { label: "Leo Murder Case", value: "Leo Murder Case", url: "http://truyentuan.com/leo-murder-case/" }, { label: "Lets Fight Ghost", value: "Lets Fight Ghost", url: "http://truyentuan.com/lets-fight-ghost/" }, { label: "Level 1 Zuikaku", value: "Level 1 Zuikaku", url: "http://truyentuan.com/level-1-zuikaku/" }, { label: "Chú Bé Quyền Năng", value: "Chú Bé Quyền Năng", url: "http://truyentuan.com/chu-be-quyen-nang/" }, { label: "Level E", value: "Level E", url: "http://truyentuan.com/level-e/" }, { label: "Lian Ai Makeup", value: "Lian Ai Makeup", url: "http://truyentuan.com/lian-ai-makeup/" }, { label: "Liberty Liberty", value: "Liberty Liberty", url: "http://truyentuan.com/liberty-liberty/" }, { label: "Liên Vận Trai", value: "Liên Vận Trai", url: "http://truyentuan.com/lien-van-trai/" }, { label: "Liệp Chiến", value: "Liệp Chiến", url: "http://truyentuan.com/liep-chien/" }, { label: "Liệp Sát Vương Tọa", value: "Liệp Sát Vương Tọa", url: "http://truyentuan.com/liep-sat-vuong-toa/" }, { label: "BugCat-Capoo", value: "BugCat-Capoo", url: "http://truyentuan.com/bugcat-capoo/" }, { label: "Ran to haiiro no sekai", value: "Ran to haiiro no sekai", url: "http://truyentuan.com/ran-to-haiiro-no-sekai/" }, { label: "Mushi to Medama to Teddy Bear", value: "Mushi to Medama to Teddy Bear", url: "http://truyentuan.com/mushi-to-medama-to-teddy-bear/" }, { label: "Ten Prism", value: "Ten Prism", url: "http://truyentuan.com/ten-prism/" }, { label: "Moriguchi orito no Teiougaku", value: "Moriguchi orito no Teiougaku", url: "http://truyentuan.com/moriguchi-orito-no-teiougaku/" }, { label: "Monster Collection", value: "Monster Collection", url: "http://truyentuan.com/monster-collection/" }, { label: "Momoyama Kyo–dai", value: "Momoyama Kyo–dai", url: "http://truyentuan.com/momoyama-kyo-dai/" }, { label: "Mondaiji-tachi ga Isekai kara Kuru sou desu yo? Z", value: "Mondaiji-tachi ga Isekai kara Kuru sou desu yo? Z", url: "http://truyentuan.com/mondaiji-tachi-ga-isekai-kara-kuru-sou-desu-yo-z/" }, { label: "Momoiro Heaven", value: "Momoiro Heaven", url: "http://truyentuan.com/momoiro-heaven/" }, { label: "Lights Out", value: "Lights Out", url: "http://truyentuan.com/lights-out/" }, { label: "Lingerie - Cửa hàng Trang phục lót", value: "Lingerie - Cửa hàng Trang phục lót", url: "http://truyentuan.com/lingerie-cua-hang-trang-phuc-lot/" }, { label: "Like Doodling", value: "Like Doodling", url: "http://truyentuan.com/like-doodling/" }, { label: "Liệp Vật Giả - Thợ Săn", value: "Liệp Vật Giả - Thợ Săn", url: "http://truyentuan.com/liep-vat-gia-tho-san/" }, { label: "Lime Odyssey: The Chronicles of ORTA", value: "Lime Odyssey: The Chronicles of ORTA", url: "http://truyentuan.com/lime-odyssey-the-chronicles-of-orta/" }, { label: "One Outs", value: "One Outs", url: "http://truyentuan.com/one-outs/" }, { label: "Chính Nghĩa Hào Hùng", value: "Chính Nghĩa Hào Hùng", url: "http://truyentuan.com/chinh-nghia-hao-hung/" }, { label: "Mankichi - Đại Tướng Nhóc Con", value: "Mankichi - Đại Tướng Nhóc Con", url: "http://truyentuan.com/mankichi-dai-tuong-nhoc-con/" }, { label: "Mami Cô Bé Siêu Phàm", value: "Mami Cô Bé Siêu Phàm", url: "http://truyentuan.com/mami-co-be-sieu-pham/" }, { label: "Majo no shinzou", value: "Majo no shinzou", url: "http://truyentuan.com/majo-no-shinzou/" }, { label: "Shiro no Koukoku Monogatari", value: "Shiro no Koukoku Monogatari", url: "http://truyentuan.com/shiro-no-koukoku-monogatari/" }, { label: "Phượng Nghịch Thiên Hạ", value: "Phượng Nghịch Thiên Hạ", url: "http://truyentuan.com/phuong-nghich-thi/" }, { label: "Miunohri to Swan -Cô Nàng Xinh Đẹp", value: "Miunohri to Swan -Cô Nàng Xinh Đẹp", url: "http://truyentuan.com/miunohri-to-swan-co-nang-xinh-dep/" }, { label: "Toaru Ossan no VRMMO Katsudouki", value: "Toaru Ossan no VRMMO Katsudouki", url: "http://truyentuan.com/toaru-ossan-no-vrmmo-katsudouki/" }, { label: "Linh Khế Sư", value: "Linh Khế Sư", url: "http://truyentuan.com/linh-khe-su/" }, { label: "Liselotte Và Khu Rừng Phù Thủy", value: "Liselotte Và Khu Rừng Phù Thủy", url: "http://truyentuan.com/liselotte-va-khu-rung-phu-thuy/" }, { label: "Little Jumper", value: "Little Jumper", url: "http://truyentuan.com/little-jumper/" }, { label: "Lives", value: "Lives", url: "http://truyentuan.com/lives/" }, { label: "Lọ lem tinh nghịch", value: "Lọ lem tinh nghịch", url: "http://truyentuan.com/lo-lem-tinh-nghich/" }, { label: "Minto Na Bokura", value: "Minto Na Bokura", url: "http://truyentuan.com/minto-na-bokura/" }, { label: "Mimi Kỳ Lạ", value: "Mimi Kỳ Lạ", url: "http://truyentuan.com/mimi-ky-la/" }, { label: "Miman Renai", value: "Miman Renai", url: "http://truyentuan.com/miman-renai/" }, { label: "Miiko Desu - Cô Bé Nhí Nhảnh", value: "Miiko Desu - Cô Bé Nhí Nhảnh", url: "http://truyentuan.com/miiko-desu-co-be-nhi-nhanh/" }, { label: "Mieru Hito", value: "Mieru Hito", url: "http://truyentuan.com/mieru-hito/" }, { label: "Truyện Boku wa Ookami", value: "Truyện Boku wa Ookami", url: "http://truyentuan.com/truyen-boku-wa-ookami/" }, { label: "Princess – công chúa xứ hoa p5", value: "Princess – công chúa xứ hoa p5", url: "http://truyentuan.com/princess-cong-chua-xu-hoa-p5/" }, { label: "Lonesome Eden", value: "Lonesome Eden", url: "http://truyentuan.com/lonesome-eden/" }, { label: "Long Hổ Phong Bạo", value: "Long Hổ Phong Bạo", url: "http://truyentuan.com/long-ho-phong-bao/" }, { label: "Long Phượng Trình Tường", value: "Long Phượng Trình Tường", url: "http://truyentuan.com/long-phuong-trinh-tuong/" }, { label: "Long Tử Giá Lâm", value: "Long Tử Giá Lâm", url: "http://truyentuan.com/long-tu-gia-lam/" }, { label: "Long Xà Diễn Nghĩa", value: "Long Xà Diễn Nghĩa", url: "http://truyentuan.com/long-xa-dien-nghia/" }, { label: "Mielino Kashiwagi", value: "Mielino Kashiwagi", url: "http://truyentuan.com/mielino-kashiwagi/" }, { label: "Michiru Heya", value: "Michiru Heya", url: "http://truyentuan.com/michiru-heya/" }, { label: "Melo Holic", value: "Melo Holic", url: "http://truyentuan.com/melo-holic/" }, { label: "Tonari no Koigataki", value: "Tonari no Koigataki", url: "http://truyentuan.com/tonari-no-koigataki/" }, { label: "Megaman NT warrior", value: "Megaman NT warrior", url: "http://truyentuan.com/megaman-nt-warrior/" }, { label: "Keyman: The Hand Of Judgement", value: "Keyman: The Hand Of Judgement", url: "http://truyentuan.com/keyman-the-hand-of-judgement/" }, { label: "LOOKING FOR CLOTHO", value: "LOOKING FOR CLOTHO", url: "http://truyentuan.com/looking-for-clotho/" }, { label: "Lost Seven", value: "Lost Seven", url: "http://truyentuan.com/lost-seven/" }, { label: "Love Like Crazy", value: "Love Like Crazy", url: "http://truyentuan.com/love-like-crazy/" }, { label: "Love Roma", value: "Love Roma", url: "http://truyentuan.com/love-roma/" }, { label: "Love Sick", value: "Love Sick", url: "http://truyentuan.com/love-sick/" }, { label: "Kuso Manga Bukuro", value: "Kuso Manga Bukuro", url: "http://truyentuan.com/kuso-manga-bukuro/" }, { label: "Vua Bóng Ném", value: "Vua Bóng Ném", url: "http://truyentuan.com/vua-bong-nem/" }, { label: "Mayo Chiki", value: "Mayo Chiki", url: "http://truyentuan.com/mayo-chiki/" }, { label: "Mayonaka no Ariadone", value: "Mayonaka no Ariadone", url: "http://truyentuan.com/mayonaka-no-ariadone/" }, { label: "Masamune-kun no Revenge", value: "Masamune-kun no Revenge", url: "http://truyentuan.com/masamune-kun-no-revenge/" }, { label: "Dragon Ball Super", value: "Dragon Ball Super", url: "http://truyentuan.com/dragon-ball-super/" }, { label: "Evergreen", value: "Evergreen", url: "http://truyentuan.com/evergreen/" }, { label: "Mahouka Koukou no Rettousei - Nyuugaku hen", value: "Mahouka Koukou no Rettousei - Nyuugaku hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-nyuugaku-hen/" }, { label: "Mahou Shoujo Lyrical Nanoha Vivid", value: "Mahou Shoujo Lyrical Nanoha Vivid", url: "http://truyentuan.com/mahou-shoujo-lyrical-nanoha-vivid/" }, { label: "Love Stage!!", value: "Love Stage!!", url: "http://truyentuan.com/love-stage/" }, { label: "Loveplus Rinko Days", value: "Loveplus Rinko Days", url: "http://truyentuan.com/loveplus-rinko-days/" }, { label: "Lover Doll", value: "Lover Doll", url: "http://truyentuan.com/lover-doll/" }, { label: "Lucid Dream", value: "Lucid Dream", url: "http://truyentuan.com/lucid-dream/" }, { label: "Lucky Dog 1 Blast", value: "Lucky Dog 1 Blast", url: "http://truyentuan.com/lucky-dog-1-blast/" }, { label: "Sengoku Youko", value: "Sengoku Youko", url: "http://truyentuan.com/sengoku-youko/" }, { label: "Lucu Lucu", value: "Lucu Lucu", url: "http://truyentuan.com/lucu-lucu/" }, { label: "Ma Tạp Tiên Tung", value: "Ma Tạp Tiên Tung", url: "http://truyentuan.com/ma-tap-tien-tung/" }, { label: "Ma Thổi Đèn", value: "Ma Thổi Đèn", url: "http://truyentuan.com/ma-thoi-den/" }, { label: "Ma Vương Quản Gia", value: "Ma Vương Quản Gia", url: "http://truyentuan.com/ma-vuong-quan-gia/" }, { label: "Magudala de Nemure", value: "Magudala de Nemure", url: "http://truyentuan.com/magudala-de-nemure/" }, { label: "Câu lạc bộ ngôi sao", value: "Câu lạc bộ ngôi sao", url: "http://truyentuan.com/cau-lac-bo-ngoi-sao/" }, { label: "Shina Dark", value: "Shina Dark", url: "http://truyentuan.com/shina-dark/" }, { label: "Henshin Ganbo", value: "Henshin Ganbo", url: "http://truyentuan.com/henshin-ganbo/" }, { label: "Maga-Tsuki", value: "Maga-Tsuki", url: "http://truyentuan.com/maga-tsuki/" }, { label: "Lock On!(Shutter Eye)", value: "Lock On!(Shutter Eye)", url: "http://truyentuan.com/lock-on-shutter-eye/" }, { label: "Gaussian Blur", value: "Gaussian Blur", url: "http://truyentuan.com/gaussian-blur/" }, { label: "Werewolf Breeding", value: "Werewolf Breeding", url: "http://truyentuan.com/werewolf-breeding/" }, { label: "Blind Faith Descent", value: "Blind Faith Descent", url: "http://truyentuan.com/blind-faith-descent/" }, { label: "Roppongi Black Cross", value: "Roppongi Black Cross", url: "http://truyentuan.com/roppongi-black-cross/" }, { label: "Mahoraba", value: "Mahoraba", url: "http://truyentuan.com/mahoraba/" }, { label: "Du Thế Vô Song", value: "Du Thế Vô Song", url: "http://truyentuan.com/du-the-vo-song/" }, { label: "Salty Studio", value: "Salty Studio", url: "http://truyentuan.com/salty-studio/" }, { label: "Puchi Collection!", value: "Puchi Collection!", url: "http://truyentuan.com/puchi-collection/" }, { label: "Zoushoku Shoujo Plana-chan!", value: "Zoushoku Shoujo Plana-chan!", url: "http://truyentuan.com/zoushoku-shoujo-plana-chan/" }, { label: "Looking For A Father", value: "Looking For A Father", url: "http://truyentuan.com/looking-for-a-father/" }, { label: "Yoroshiku Master", value: "Yoroshiku Master", url: "http://truyentuan.com/yoroshiku-master/" }, { label: "Lộc Đỉnh Kí", value: "Lộc Đỉnh Kí", url: "http://truyentuan.com/loc-dinh-ki/" }, { label: "Đại viên thần", value: "Đại viên thần", url: "http://truyentuan.com/dai-vien-than/" }, { label: "Taiyou no Ie", value: "Taiyou no Ie", url: "http://truyentuan.com/taiyou-no-ie/" }, { label: "Huyết Ma Nhân", value: "Huyết Ma Nhân", url: "http://truyentuan.com/huyet-ma-nhan/" }, { label: "Yandere Kanojo", value: "Yandere Kanojo", url: "http://truyentuan.com/yandere-kanojo/" }, { label: "Girls Saurus Deluxe", value: "Girls Saurus Deluxe", url: "http://truyentuan.com/girls-saurus-deluxe/" }, { label: "Amari Mawari", value: "Amari Mawari", url: "http://truyentuan.com/amari-mawari/" }, { label: "Dear", value: "Dear", url: "http://truyentuan.com/dear/" }, { label: "Fluttering Feelings", value: "Fluttering Feelings", url: "http://truyentuan.com/fluttering-feelings/" }, { label: "Kedamono Kareshi", value: "Kedamono Kareshi", url: "http://truyentuan.com/kedamono-kareshi/" }, { label: "Fate/Kaleid Liner Prisma Illya Drei! [Jikan FS]", value: "Fate/Kaleid Liner Prisma Illya Drei! [Jikan FS]", url: "http://truyentuan.com/fatekaleid-liner-prisma-illya-drei-jikan-fs/" }, { label: "Hideout", value: "Hideout", url: "http://truyentuan.com/hideout/" }, { label: "Amahara-kun", value: "Amahara-kun", url: "http://truyentuan.com/amahara-kun/" }, { label: "Togari Shiro", value: "Togari Shiro", url: "http://truyentuan.com/togari-shiro/" }, { label: "WORLD CUSTOMIZE CREATOR", value: "WORLD CUSTOMIZE CREATOR", url: "http://truyentuan.com/world-customize-creator/" }, { label: "To Aru Majutsu no Kinsho Mokuroku - Endymion no Kiseki", value: "To Aru Majutsu no Kinsho Mokuroku - Endymion no Kiseki", url: "http://truyentuan.com/to-aru-majutsu-no-kinsho-mokuroku-endymion-no-kiseki/" }, { label: "Nisekoi Doumei", value: "Nisekoi Doumei", url: "http://truyentuan.com/nisekoi-doumei/" }, { label: "Blue Friend season 1", value: "Blue Friend season 1", url: "http://truyentuan.com/blue-friend-season-1/" }, { label: "Tuần Tra Viên Ngân Hà JACO", value: "Tuần Tra Viên Ngân Hà JACO", url: "http://truyentuan.com/tuan-tra-vien-ngan-ha-jaco/" }, { label: "Overlord", value: "Overlord", url: "http://truyentuan.com/overlord/" }, { label: "American Ghost Jack", value: "American Ghost Jack", url: "http://truyentuan.com/american-ghost-jack/" }, { label: "Crimson Skies", value: "Crimson Skies", url: "http://truyentuan.com/crimson-skies/" }, { label: "Saiyaku wa Boku o Suki Sugiru", value: "Saiyaku wa Boku o Suki Sugiru", url: "http://truyentuan.com/saiyaku-wa-boku-o-suki-sugiru/" }, { label: "Hitoribocchi wa Samishikute", value: "Hitoribocchi wa Samishikute", url: "http://truyentuan.com/hitoribocchi-wa-samishikute/" }, { label: "Skill of Lure - nghệ Thuật Quyến Rũ", value: "Skill of Lure - nghệ Thuật Quyến Rũ", url: "http://truyentuan.com/skill-of-lure-nghe-thuat-quyen-ru/" }, { label: "Junkie Fiction", value: "Junkie Fiction", url: "http://truyentuan.com/junkie-fiction/" }, { label: "Bắt Cóc Hoàng Đế Về Hiện Đại", value: "Bắt Cóc Hoàng Đế Về Hiện Đại", url: "http://truyentuan.com/bat-coc-hoang-de-ve-hien-dai/" }, { label: "Kyoudai hodo Chikaku Tooimono wa Nai", value: "Kyoudai hodo Chikaku Tooimono wa Nai", url: "http://truyentuan.com/kyoudai-hodo-chikaku-tooimono-wa-nai/" }, { label: "Sơn Thần Và Tiểu Táo", value: "Sơn Thần Và Tiểu Táo", url: "http://truyentuan.com/son-than-va-tieu-tao/" }, { label: "Thuần Tình Nha Đầu Hoả Lạt Lạt", value: "Thuần Tình Nha Đầu Hoả Lạt Lạt", url: "http://truyentuan.com/thuan-tinh-nha-dau-hoa-lat-lat/" }, { label: "Saint Seiya - Áo Giáp Vàng", value: "Saint Seiya - Áo Giáp Vàng", url: "http://truyentuan.com/saint-seiya-ao-giap-vang/" }, { label: "17 YEARS OLD, THAT SUMMER DAY’S MIRACLE", value: "17 YEARS OLD, THAT SUMMER DAY’S MIRACLE", url: "http://truyentuan.com/17-years-old-that-summer-days-miracle/" }, { label: "Vua Sáng Chế (bản đẹp)", value: "Vua Sáng Chế (bản đẹp)", url: "http://truyentuan.com/vua-sang-che-ban-dep/" }, { label: "Khanh Hữu Độc Chung", value: "Khanh Hữu Độc Chung", url: "http://truyentuan.com/khanh-huu-doc-chung/" }, { label: "Kako To Nise Tantei", value: "Kako To Nise Tantei", url: "http://truyentuan.com/kako-to-nise-tantei/" }, { label: "Kuroko No Basket Extra Game", value: "Kuroko No Basket Extra Game", url: "http://truyentuan.com/kuroko-no-basket-extra-game/" }, { label: "Rai - Võ Tướng Thiên Hạ", value: "Rai - Võ Tướng Thiên Hạ", url: "http://truyentuan.com/rai-vo-tuong-thien-ha/" }, { label: "Pochi Kuro", value: "Pochi Kuro", url: "http://truyentuan.com/pochi-kuro/" }, { label: "Love Live! - School Idol Project", value: "Love Live! - School Idol Project", url: "http://truyentuan.com/love-live-school-idol-project/" }, { label: "Zettai Heiwa Daisakusen", value: "Zettai Heiwa Daisakusen", url: "http://truyentuan.com/zettai-heiwa-daisakusen/" }, { label: "ZodiacBoys", value: "ZodiacBoys", url: "http://truyentuan.com/zodiacboys/" }, { label: "Zombie Romanticism", value: "Zombie Romanticism", url: "http://truyentuan.com/zombie-romanticism/" }, { label: "Rừng Đông", value: "Rừng Đông", url: "http://truyentuan.com/rung-dong/" }, { label: "Online - The Comic", value: "Online - The Comic", url: "http://truyentuan.com/online-the-comic/" }, { label: "Oiran Girl", value: "Oiran Girl", url: "http://truyentuan.com/oiran-girl/" }, { label: "Citrus (Saburouta)", value: "Citrus (Saburouta)", url: "http://truyentuan.com/citrus-saburouta/" }, { label: "Black Jack", value: "Black Jack", url: "http://truyentuan.com/black-jack/" }, { label: "Tử Vong Hồi", value: "Tử Vong Hồi", url: "http://truyentuan.com/tu-vong-hoi/" }, { label: "Kokou no Hito", value: "Kokou no Hito", url: "http://truyentuan.com/kokou-no-hito/" }, { label: "Koe no Katachi (AG Team)", value: "Koe no Katachi (AG Team)", url: "http://truyentuan.com/koe-no-katachi-ag-team/" }, { label: "4 Cut Hero", value: "4 Cut Hero", url: "http://truyentuan.com/4-cut-hero/" }, { label: "Flight Highschool", value: "Flight Highschool", url: "http://truyentuan.com/flight-highschool/" }, { label: "Rough Bản đẹp", value: "Rough Bản đẹp", url: "http://truyentuan.com/rough-ban-dep/" }, { label: "Dũng Sĩ Hesman", value: "Dũng Sĩ Hesman", url: "http://truyentuan.com/dung-si-hesman/" }, { label: "Nemuri No Fuchi", value: "Nemuri No Fuchi", url: "http://truyentuan.com/nemuri-no-fuchi/" }, { label: "AKB49 - Renai Kinshi Jourei", value: "AKB49 - Renai Kinshi Jourei", url: "http://truyentuan.com/akb49-renai-kinshi-jourei/" }, { label: "Supernatural Investigation Department", value: "Supernatural Investigation Department", url: "http://truyentuan.com/supernatural-investigation-department/" }, { label: "009 Re:Cyborg", value: "009 Re:Cyborg", url: "http://truyentuan.com/009-recyborg/" }, { label: "Hôm Nay Bắt Đầu Làm Nữ Thần", value: "Hôm Nay Bắt Đầu Làm Nữ Thần", url: "http://truyentuan.com/hom-nay-bat-dau-lam-nu-than/" }, { label: "Zombie Knight", value: "Zombie Knight", url: "http://truyentuan.com/zombie-knight/" }, { label: "Tokiwa Kitareri", value: "Tokiwa Kitareri", url: "http://truyentuan.com/tokiwa-kitareri/" }, { label: "Thiên Chi Vương Nữ", value: "Thiên Chi Vương Nữ", url: "http://truyentuan.com/thien-chi-vuong-nu/" }, { label: "81 Diver", value: "81 Diver", url: "http://truyentuan.com/81-diver/" }, { label: "Tomo chan wa Onnanoko", value: "Tomo chan wa Onnanoko", url: "http://truyentuan.com/tomo-chan-wa-onnanoko/" }, { label: "One Week Friends", value: "One Week Friends", url: "http://truyentuan.com/one-week-friends/" }, { label: "Appleseed", value: "Appleseed", url: "http://truyentuan.com/appleseed/" }, { label: "Bastard - Đứa con của quỷ", value: "Bastard - Đứa con của quỷ", url: "http://truyentuan.com/bastard-dua-con-cua-quy/" }, { label: "Saijou no Meii", value: "Saijou no Meii", url: "http://truyentuan.com/saijou-no-meii/" }, { label: "Osananajimi wa Onnanoko ni Naare", value: "Osananajimi wa Onnanoko ni Naare", url: "http://truyentuan.com/osananajimi-wa-onnanoko-ni-naare/" }, { label: "Whamanga", value: "Whamanga", url: "http://truyentuan.com/whamanga/" }, { label: "Sora x Rira - Sorairo no Lila to Okubyou na Boku", value: "Sora x Rira - Sorairo no Lila to Okubyou na Boku", url: "http://truyentuan.com/sora-x-rira-sorairo-no-lila-to-okubyou-na-boku/" }, { label: "Red Storm", value: "Red Storm", url: "http://truyentuan.com/red-storm/" }, { label: "Wild life", value: "Wild life", url: "http://truyentuan.com/wild-life/" }, { label: "Súng Thần Ký", value: "Súng Thần Ký", url: "http://truyentuan.com/sung-than-ky/" }, { label: "KOIZUMI - Cô nàng nghiền Ramen", value: "KOIZUMI - Cô nàng nghiền Ramen", url: "http://truyentuan.com/koizumi-co-nang-nghien-ramen/" }, { label: "Kyoushashou", value: "Kyoushashou", url: "http://truyentuan.com/kyoushashou-3/" }, { label: "Cooking Papa", value: "Cooking Papa", url: "http://truyentuan.com/cooking-papa/" }, { label: "Fairy Tail Sabertooth", value: "Fairy Tail Sabertooth", url: "http://truyentuan.com/fairy-tail-sabertooth/" }, { label: "Tsujiura-san to Chupacabra", value: "Tsujiura-san to Chupacabra", url: "http://truyentuan.com/tsujiura-san-to-chupacabra/" }, { label: "Tenkamusou Edajima Heihachi Den", value: "Tenkamusou Edajima Heihachi Den", url: "http://truyentuan.com/tenkamusou-edajima-heihachi-den/" }, { label: "Usagi Drop", value: "Usagi Drop", url: "http://truyentuan.com/usagi-drop/" }, { label: "Tensei Shitara Slime Datta Ken", value: "Tensei Shitara Slime Datta Ken", url: "http://truyentuan.com/tensei-shitara-slime-datta-ken/" }, { label: "Mayoe! Nanatsu no Taizai Gakuen!", value: "Mayoe! Nanatsu no Taizai Gakuen!", url: "http://truyentuan.com/mayoe-nanatsu-no-taizai-gakuen/" }, { label: "Assassin's Creed 4 - Black Flag - Kakusei", value: "Assassin's Creed 4 - Black Flag - Kakusei", url: "http://truyentuan.com/assassins-creed-4-black-flag-kakusei/" }, { label: "Zero - Kage Miko", value: "Zero - Kage Miko", url: "http://truyentuan.com/zero-kage-miko/" }, { label: "Yêu Thần Ký", value: "Yêu Thần Ký", url: "http://truyentuan.com/yeu-than-ky/" }, { label: "Chuyện Của Họ", value: "Chuyện Của Họ", url: "http://truyentuan.com/chuyen-cua-ho/" }, { label: "SWAN - VŨ KHÚC THIÊN NGA", value: "SWAN - VŨ KHÚC THIÊN NGA", url: "http://truyentuan.com/swan-vu-khuc-thien-nga/" }, { label: "Shonan Seven", value: "Shonan Seven", url: "http://truyentuan.com/shonan-seven/" }, { label: "Jitsu wa Watashi wa", value: "Jitsu wa Watashi wa", url: "http://truyentuan.com/jitsu-wa-watashi-wa/" }, { label: "Chronos Ruler", value: "Chronos Ruler", url: "http://truyentuan.com/chronos-ruler/" }, { label: "Độ Linh", value: "Độ Linh", url: "http://truyentuan.com/do-linh/" }, { label: "Dare mo Shiranai Tou no Aru machi", value: "Dare mo Shiranai Tou no Aru machi", url: "http://truyentuan.com/dare-mo-shiranai-tou-no-aru-machi/" }, { label: "Saint Legend - Bát Tiên Đạo", value: "Saint Legend - Bát Tiên Đạo", url: "http://truyentuan.com/saint-legend-bat-tien-dao/" }, { label: "The New Gate", value: "The New Gate", url: "http://truyentuan.com/the-new-gate/" }, { label: "INO-HEAD GARGOYLE", value: "INO-HEAD GARGOYLE", url: "http://truyentuan.com/ino-head-gargoyle/" }, { label: "RPG", value: "RPG", url: "http://truyentuan.com/rpg/" }, { label: "Tail Star", value: "Tail Star", url: "http://truyentuan.com/tail-star/" }, { label: "Sousoukyoku Nightmare", value: "Sousoukyoku Nightmare", url: "http://truyentuan.com/sousoukyoku-nightmare/" }, { label: "THỤC SƠN KIẾM HIỆP TRUYỆN", value: "THỤC SƠN KIẾM HIỆP TRUYỆN", url: "http://truyentuan.com/thuc-son-kiem-hiep-truyen/" }, { label: "Hắn Đến Từ Sao Hỏa", value: "Hắn Đến Từ Sao Hỏa", url: "http://truyentuan.com/han-den-tu-sao-hoa/" }, { label: "Bựa du kí", value: "Bựa du kí", url: "http://truyentuan.com/bua-du-ki/" }, { label: "ONE PIECE (MTO)", value: "ONE PIECE (MTO)", url: "http://truyentuan.com/one-piece-mto/" }, { label: "THẦN CHƯỞNG", value: "THẦN CHƯỞNG", url: "http://truyentuan.com/than-chuong/" }, { label: "Futaba-kun Change", value: "Futaba-kun Change", url: "http://truyentuan.com/futaba-kun-change/" }, { label: "Watashi no Messiah-sama", value: "Watashi no Messiah-sama", url: "http://truyentuan.com/watashi-no-messiah-sama/" }, { label: "Kingdom", value: "Kingdom", url: "http://truyentuan.com/kingdom/" }, { label: "UNITY OF HEAVEN", value: "UNITY OF HEAVEN", url: "http://truyentuan.com/unity-of-heaven/" }, { label: "Charlotte", value: "Charlotte", url: "http://truyentuan.com/charlotte/" }, { label: "Holy Alice", value: "Holy Alice", url: "http://truyentuan.com/holy-alice/" }, { label: "Loạn Nhập", value: "Loạn Nhập", url: "http://truyentuan.com/loan-nhap/" }, { label: "AkAKATSUKI!! OTOKOJUKU - SEINEN YO, TAISHI WO IDAKE", value: "AkAKATSUKI!! OTOKOJUKU - SEINEN YO, TAISHI WO IDAKE", url: "http://truyentuan.com/akakatsuki-otokojuku-seinen-yo-taishi-wo-idake/" }, { label: "Bakudan", value: "Bakudan", url: "http://truyentuan.com/bakudan/" }, { label: "Kamisama, Kisama wo Koroshitai", value: "Kamisama, Kisama wo Koroshitai", url: "http://truyentuan.com/kamisama-kisama-wo-koroshitai/" }, { label: "NINKU SECOND STAGE - ETO NINHEN", value: "NINKU SECOND STAGE - ETO NINHEN", url: "http://truyentuan.com/ninku-second-stage-eto-ninhen/" }, { label: "Shimoneta toiu Gainen ga Sonzaishinai Taikutsu na Sekai", value: "Shimoneta toiu Gainen ga Sonzaishinai Taikutsu na Sekai", url: "http://truyentuan.com/shimoneta-toiu-gainen-ga-sonzaishinai-taikutsu-na-sekai/" }, { label: "Beyblade", value: "Beyblade", url: "http://truyentuan.com/beyblade/" }, { label: "Song Sinh Linh Thám", value: "Song Sinh Linh Thám", url: "http://truyentuan.com/song-sinh-linh-tham/" }, { label: "Green Boy", value: "Green Boy", url: "http://truyentuan.com/green-boy/" }, { label: "Usogui", value: "Usogui", url: "http://truyentuan.com/usogui/" }, { label: "Sakigake!! Otokojuku", value: "Sakigake!! Otokojuku", url: "http://truyentuan.com/sakigake-otokojuku/" }, { label: "Kantai Collection -The Things She Saw", value: "Kantai Collection -The Things She Saw", url: "http://truyentuan.com/kantai-collection-the-things-she-saw-2/" }, { label: "Yami no Aegis", value: "Yami no Aegis", url: "http://truyentuan.com/yami-no-aegis/" }, { label: "Full Metal Panic! Sigma", value: "Full Metal Panic! Sigma", url: "http://truyentuan.com/full-metal-panic-sigma/" }, { label: "BAKUMAN. - age 13", value: "BAKUMAN. - age 13", url: "http://truyentuan.com/bakuman-age-13/" }, { label: "Hồ Sơ Xã Hội Đen", value: "Hồ Sơ Xã Hội Đen", url: "http://truyentuan.com/ho-so-xa-hoi-den/" }, { label: "Daydream Nightmare", value: "Daydream Nightmare", url: "http://truyentuan.com/daydream-nightmare/" }, { label: "Totsugami", value: "Totsugami", url: "http://truyentuan.com/totsugami/" }, { label: "Frag Time", value: "Frag Time", url: "http://truyentuan.com/frag-time/" }, { label: "Platinum End", value: "Platinum End", url: "http://truyentuan.com/platinum-end/" }, { label: "Ác quỷ và bản tình ca", value: "Ác quỷ và bản tình ca", url: "http://truyentuan.com/ac-quy-va-ban-tinh-ca/" }, { label: "Boku to Senpai no Tekken Kousai", value: "Boku to Senpai no Tekken Kousai", url: "http://truyentuan.com/boku-to-senpai-no-tekken-kousai/" }, { label: "Kid Gang - Nhóc Siêu Quậy", value: "Kid Gang - Nhóc Siêu Quậy", url: "http://truyentuan.com/kid-gang-nhoc-sieu-quay/" }, { label: "Hellper - Đào Ngục Đồ", value: "Hellper - Đào Ngục Đồ", url: "http://truyentuan.com/hellper-dao-nguc-do/" }, { label: "Konjiki no Moji Tsukai", value: "Konjiki no Moji Tsukai", url: "http://truyentuan.com/konjiki-no-moji-tsukai/" }, { label: "Tây Du", value: "Tây Du", url: "http://truyentuan.com/tay-du/" }, { label: "Thần Bút Họa Sư", value: "Thần Bút Họa Sư", url: "http://truyentuan.com/than-b/" }, { label: "Komori-san wa Kotowarenai", value: "Komori-san wa Kotowarenai", url: "http://truyentuan.com/komori-san-wa-kotowarenai/" }, { label: "Nghịch Hành Thiên Hậu", value: "Nghịch Hành Thiên Hậu", url: "http://truyentuan.com/nghich-hanh-thien-hau/" }, { label: "Mouryou no Yurikago", value: "Mouryou no Yurikago", url: "http://truyentuan.com/mouryou-no-yurikago/" }, { label: "Torikago no Tsugai", value: "Torikago no Tsugai", url: "http://truyentuan.com/torikago-no-tsugai/" }, { label: "Kyou kara Hitman", value: "Kyou kara Hitman", url: "http://truyentuan.com/kyou-kara-hitman/" }, { label: "Dragon Ball After", value: "Dragon Ball After", url: "http://truyentuan.com/dragon-ball-after/" }, { label: "Aoki Umi no Torawarehime", value: "Aoki Umi no Torawarehime", url: "http://truyentuan.com/aoki-umi-no-torawarehime/" }, { label: "Domestic na Kanojo", value: "Domestic na Kanojo", url: "http://truyentuan.com/domestic-na-kanojo/" }, { label: "Fukushuu Kyoushitsu", value: "Fukushuu Kyoushitsu", url: "http://truyentuan.com/fukushuu-kyoushitsu/" }, { label: "B-SHOCK", value: "B-SHOCK", url: "http://truyentuan.com/b-shock/" }, { label: "Shishang Zui Qiang Jiazu", value: "Shishang Zui Qiang Jiazu", url: "http://truyentuan.com/shishang-zui-qiang-jiazu/" }, { label: "WOLFSMUND", value: "WOLFSMUND", url: "http://truyentuan.com/wolfsmund/" }, { label: "Fudatsuki no Kyoko-chan", value: "Fudatsuki no Kyoko-chan", url: "http://truyentuan.com/fudatsuki-no-kyoko-chan/" }, { label: "Death Note (Color)", value: "Death Note (Color)", url: "http://truyentuan.com/death-note-color/" }, { label: "Ashita no Yoichi", value: "Ashita no Yoichi", url: "http://truyentuan.com/ashita-no-yoichi/" }, { label: "The Devil's Bag", value: "The Devil's Bag", url: "http://truyentuan.com/the-devils-bag/" }, { label: "Happiness", value: "Happiness", url: "http://truyentuan.com/happiness/" }, { label: "Ueki", value: "Ueki", url: "http://truyentuan.com/ueki/" }, { label: "Thần Giới Truyền Thuyết", value: "Thần Giới Truyền Thuyết", url: "http://truyentuan.com/than-gioi-truyen-thuyet/" }, { label: "Amaenaideyo MS", value: "Amaenaideyo MS", url: "http://truyentuan.com/amaenaideyo-ms/" }, { label: "Unbalance Triangle", value: "Unbalance Triangle", url: "http://truyentuan.com/unbalance-triangle/" }, { label: "Arakawa Under The Bridge", value: "Arakawa Under The Bridge", url: "http://truyentuan.com/arakawa-under-the-bridge/" }, { label: "Biohazard - Heavenly Island", value: "Biohazard - Heavenly Island", url: "http://truyentuan.com/biohazard-heavenly-island/" }, { label: "ARK:Romancer", value: "ARK:Romancer", url: "http://truyentuan.com/arkromancer/" }, { label: "Vân Trung Ca", value: "Vân Trung Ca", url: "http://truyentuan.com/van-trung-ca/" }, { label: "umishou", value: "umishou", url: "http://truyentuan.com/umishou/" }, { label: "Lọ Lem Kén Rể", value: "Lọ Lem Kén Rể", url: "http://truyentuan.com/lo-lem-ken-re/" }, { label: "Dusk Howler", value: "Dusk Howler", url: "http://truyentuan.com/dusk-howler/" }, { label: "Tiên Liên Kiếp", value: "Tiên Liên Kiếp", url: "http://truyentuan.com/tien-lien-kiep/" }, { label: "Bách Luyện Thành Thần", value: "Bách Luyện Thành Thần", url: "http://truyentuan.com/bach-luyen-thanh-than/" }, { label: "Peach Pluck", value: "Peach Pluck", url: "http://truyentuan.com/peach-pluck/" }, { label: "Sekai Maou", value: "Sekai Maou", url: "http://truyentuan.com/sekai-maou/" }, { label: "Trả Thù Trường Trung Học", value: "Trả Thù Trường Trung Học", url: "http://truyentuan.com/tra-thu-truong-trung-hoc/" }, { label: "Sơn Hải Thú", value: "Sơn Hải Thú", url: "http://truyentuan.com/son-hai-thu/" }, { label: "Rotte no Omocha", value: "Rotte no Omocha", url: "http://truyentuan.com/rotte-no-omocha/" }, { label: "Yokohama Kaidashi Kikou", value: "Yokohama Kaidashi Kikou", url: "http://truyentuan.com/yokohama-kaidashi-kikou/" }, { label: "Deadpool", value: "Deadpool", url: "http://truyentuan.com/deadpool/" }, { label: "Spirit Migration", value: "Spirit Migration", url: "http://truyentuan.com/spirit-migration/" }, { label: "Elena", value: "Elena", url: "http://truyentuan.com/elena/" }, { label: "Oh! Lord Jesus", value: "Oh! Lord Jesus", url: "http://truyentuan.com/oh-lord-jesus/" }, { label: "Ứng Dụng Thẩm Mỹ", value: "Ứng Dụng Thẩm Mỹ", url: "http://truyentuan.com/ung-dung-tham-my/" }, { label: "Sủng Phi Của Pharaoh", value: "Sủng Phi Của Pharaoh", url: "http://truyentuan.com/sung-phi-cua-pharaoh/" }, { label: "Baramon no Kazoku", value: "Baramon no Kazoku", url: "http://truyentuan.com/baramon-no-kazoku/" }, { label: "Nhất Thế Chi Tôn", value: "Nhất Thế Chi Tôn", url: "http://truyentuan.com/nhat-the-chi-ton/" }, { label: "Megami no Libra", value: "Megami no Libra", url: "http://truyentuan.com/megami-no-libra/" }, { label: "Onepunch-man (ONE)", value: "Onepunch-man (ONE)", url: "http://truyentuan.com/onepunch-man-one/" }, { label: "Olimpos", value: "Olimpos", url: "http://truyentuan.com/olimpos/" }, { label: "Dungeon Meshi", value: "Dungeon Meshi", url: "http://truyentuan.com/dungeon-meshi/" }, { label: "Gleipnir", value: "Gleipnir", url: "http://truyentuan.com/gleipnir/" }, { label: "Kaitai Shinsho Zero", value: "Kaitai Shinsho Zero", url: "http://truyentuan.com/kaitai-shinsho-zero/" }, { label: "Gosu", value: "Gosu", url: "http://truyentuan.com/gosu/" }, { label: "Psycho Buster", value: "Psycho Buster", url: "http://truyentuan.com/psycho-buster/" }, { label: "I Shoujo", value: "I Shoujo", url: "http://truyentuan.com/i-shoujo/" }, { label: "NHK ni Youkoso!", value: "NHK ni Youkoso!", url: "http://truyentuan.com/nhk-ni-youkoso/" }, { label: "Toumei ningen kyoutei", value: "Toumei ningen kyoutei", url: "http://truyentuan.com/toumei-ningen-kyoutei/" }, { label: "Mirai Nikki", value: "Mirai Nikki", url: "http://truyentuan.com/mirai-nikki/" }, { label: "Instant Bullet", value: "Instant Bullet", url: "http://truyentuan.com/instant-bullet/" }, { label: "Mousou Meets Girl", value: "Mousou Meets Girl", url: "http://truyentuan.com/mousou-meets-girl/" }, { label: "Chronological Marvel Civil War", value: "Chronological Marvel Civil War", url: "http://truyentuan.com/chronological-marvel-civil-war/" }, { label: "Miêu Hựu", value: "Miêu Hựu", url: "http://truyentuan.com/mieu-huu/" }, { label: "Seitokai Yakuindomo", value: "Seitokai Yakuindomo", url: "http://truyentuan.com/seitokai-yakuindomo/" }, { label: "Chichi Kogusa", value: "Chichi Kogusa", url: "http://truyentuan.com/chichi-kogusa/" }, { label: "Thiên Tài Tiên Thuật sư", value: "Thiên Tài Tiên Thuật sư", url: "http://truyentuan.com/thien-tai-tien-thuat-su/" }, { label: "Shiryoku Kensa", value: "Shiryoku Kensa", url: "http://truyentuan.com/shiryoku-kensa/" }, { label: "Sengoku Strays", value: "Sengoku Strays", url: "http://truyentuan.com/sengoku-strays/" }, { label: "ASHIYA-SAN NO NEKO", value: "ASHIYA-SAN NO NEKO", url: "http://truyentuan.com/ashiya-san-no-neko/" }, { label: "Kiss x Death", value: "Kiss x Death", url: "http://truyentuan.com/kiss-x-death/" }, { label: "Hachi Ichi - Tám Nàng Một Chàng", value: "Hachi Ichi - Tám Nàng Một Chàng", url: "http://truyentuan.com/hachi-ichi-tam-nang-mot-chang/" }, { label: "Helck", value: "Helck", url: "http://truyentuan.com/helck/" }, { label: "Thất Nhật Chi Hậu", value: "Thất Nhật Chi Hậu", url: "http://truyentuan.com/that-nhat-chi-hau/" }, { label: "MONSTER NIGHT", value: "MONSTER NIGHT", url: "http://truyentuan.com/monster-night/" }, { label: "Cheese In The Trap", value: "Cheese In The Trap", url: "http://truyentuan.com/cheese-in-the-trap/" }, { label: "Usotsuki Ouji to Nisemono Kanojo", value: "Usotsuki Ouji to Nisemono Kanojo", url: "http://truyentuan.com/usotsuki-ouji-to-nisemono-kanojo/" }, { label: "Kataribe no List", value: "Kataribe no List", url: "http://truyentuan.com/kataribe-no-list/" }, { label: "Prison School (Skyrule)", value: "Prison School (Skyrule)", url: "http://truyentuan.com/prison-school-skyrule/" }, { label: "Mộc Lan Vô Trưởng Huynh", value: "Mộc Lan Vô Trưởng Huynh", url: "http://truyentuan.com/moc-lan-vo-truong-huynh/" }, { label: "Hatsukoi Zombie", value: "Hatsukoi Zombie", url: "http://truyentuan.com/hatsukoi-zombie/" }, { label: "Noblesse: Rai's Adventure", value: "Noblesse: Rai's Adventure", url: "http://truyentuan.com/noblesse-rai-s-adventure/" }, { label: "Pigeonhole Fantasia", value: "Pigeonhole Fantasia", url: "http://truyentuan.com/pigeonhole-fantasia/" }, { label: "13 Club", value: "13 Club", url: "http://truyentuan.com/13-club/" }, { label: "Real Account II", value: "Real Account II", url: "http://truyentuan.com/real-account-ii/" }, { label: "White Epic", value: "White Epic", url: "http://truyentuan.com/white-epic/" }, { label: "Kimi Shi ni Tamafu Koto Nakare", value: "Kimi Shi ni Tamafu Koto Nakare", url: "http://truyentuan.com/kimi-shi-ni-tamafu-koto-nakare/" }, { label: "Okusan", value: "Okusan", url: "http://truyentuan.com/okusan/" }, { label: "Ballroom e Youkoso", value: "Ballroom e Youkoso", url: "http://truyentuan.com/ballroom-e-youkoso/" }, { label: "The Chef - Đầu Bếp Trứ Danh", value: "The Chef - Đầu Bếp Trứ Danh", url: "http://truyentuan.com/the-chef-dau-bep-tru-danh/" }, { label: "Garfield", value: "Garfield", url: "http://truyentuan.com/garfield/" }, { label: "Ác Ma Pháp Tắc", value: "Ác Ma Pháp Tắc", url: "http://truyentuan.com/ac-ma-phap-tac/" }, { label: "Adekan", value: "Adekan", url: "http://truyentuan.com/adekan/" }, { label: "Double Casting", value: "Double Casting", url: "http://truyentuan.com/double-casting/" }, { label: "At Each Others Throats", value: "At Each Others Throats", url: "http://truyentuan.com/at-each-others-throats/" }, { label: "Shikabane Hime", value: "Shikabane Hime", url: "http://truyentuan.com/shikabane-hime/" }, { label: "Doraemon Bóng Chày", value: "Doraemon Bóng Chày", url: "http://truyentuan.com/doraemon-bong-chay/" }, { label: "Kigurumi Boueitai", value: "Kigurumi Boueitai", url: "http://truyentuan.com/kigurumi-boueitai/" }, { label: "Shinryaku! Ika Musume", value: "Shinryaku! Ika Musume", url: "http://truyentuan.com/shinryaku-ika-musume/" }, { label: "Tái Tạo Không Gian", value: "Tái Tạo Không Gian", url: "http://truyentuan.com/tai-tao-khong-gian/" }, { label: "Mob Psycho 100", value: "Mob Psycho 100", url: "http://truyentuan.com/mob-psycho-100/" }, { label: "Witch Workshop", value: "Witch Workshop", url: "http://truyentuan.com/witch-workshop/" }, { label: "Trầm Hương Phá", value: "Trầm Hương Phá", url: "http://truyentuan.com/tram-huong-pha/" }, { label: "Sen to Man", value: "Sen to Man", url: "http://truyentuan.com/sen-to-man/" }, { label: "X-O MANOWAR", value: "X-O MANOWAR", url: "http://truyentuan.com/x-o-manowar/" }, { label: "Doctor Duo", value: "Doctor Duo", url: "http://truyentuan.com/doctor-duo/" }, { label: "An Always-Available Man", value: "An Always-Available Man", url: "http://truyentuan.com/an-always-available-man/" }, { label: "Ichi the Killer", value: "Ichi the Killer", url: "http://truyentuan.com/ichi-the-killer/" }, { label: "Gochuumon wa Usagi Desu ka?", value: "Gochuumon wa Usagi Desu ka?", url: "http://truyentuan.com/gochuumon-wa-usagi-desu-ka/" }, { label: "Thiên Hành Thiết Sự", value: "Thiên Hành Thiết Sự", url: "http://truyentuan.com/thien-hanh-thiet-su/" }, { label: "Tinh Mộng Thần Tượng", value: "Tinh Mộng Thần Tượng", url: "http://truyentuan.com/tinh-mong-than-tuong/" }, { label: "ĐẠI ĐƯỜNG HUYỀN BÚT KÝ", value: "ĐẠI ĐƯỜNG HUYỀN BÚT KÝ", url: "http://truyentuan.com/dai-duong-huyen-but-ky/" }, { label: "Tsubaki-chou Lonely Planet", value: "Tsubaki-chou Lonely Planet", url: "http://truyentuan.com/tsubaki-chou-lonely-planet/" }, { label: "Nagareboshi Lens", value: "Nagareboshi Lens", url: "http://truyentuan.com/nagareboshi-lens/" }, { label: "DRAGON EFFECT", value: "DRAGON EFFECT", url: "http://truyentuan.com/dragon-effect/" }, { label: "Black out", value: "Black out", url: "http://truyentuan.com/black-out/" }, { label: "Busou Shoujo Machiavellianism", value: "Busou Shoujo Machiavellianism", url: "http://truyentuan.com/busou-shoujo-machiavellianism/" }, { label: "Dimension W", value: "Dimension W", url: "http://truyentuan.com/dimension-w/" }, { label: "Space China Dress", value: "Space China Dress", url: "http://truyentuan.com/space-china-dress/" }, { label: "The Devil Who Can't Fly", value: "The Devil Who Can't Fly", url: "http://truyentuan.com/the-devil-who-cant-fly/" }, { label: "Sumika Sumire", value: "Sumika Sumire", url: "http://truyentuan.com/sumika-sumire/" }, { label: "Cromartie High School", value: "Cromartie High School", url: "http://truyentuan.com/cromartie-high-school/" }, { label: "Thuấn Linh", value: "Thuấn Linh", url: "http://truyentuan.com/thuan-linh/" }, { label: "Cực Đạo Hoa Giá", value: "Cực Đạo Hoa Giá", url: "http://truyentuan.com/cuc-dao-hoa-gia/" }, { label: "Gangsta", value: "Gangsta", url: "http://truyentuan.com/gangsta/" }, { label: "Greatest Outcast", value: "Greatest Outcast", url: "http://truyentuan.com/greatest-outcast/" }, { label: "Ajin-Chan Wa Kataritai", value: "Ajin-Chan Wa Kataritai", url: "http://truyentuan.com/ajin-chan-wa-kataritai/" }, { label: "Magical Exam Student", value: "Magical Exam Student", url: "http://truyentuan.com/magical-exam-student/" }, { label: "Thoát Cốt Hương", value: "Thoát Cốt Hương", url: "http://truyentuan.com/thoat-cot-huong/" }, { label: "Sổ Tay Trồng Yêu Tinh", value: "Sổ Tay Trồng Yêu Tinh", url: "http://truyentuan.com/so-tay-trong-yeu-tinh/" }, { label: "Golden Kamui", value: "Golden Kamui", url: "http://truyentuan.com/golden-kamui/" }, { label: "World Destruction", value: "World Destruction", url: "http://truyentuan.com/world-destruction/" }, { label: "Gokuto Jihen", value: "Gokuto Jihen", url: "http://truyentuan.com/gokuto-jihen/" }, { label: "Ngu Nhân Chi Lữ", value: "Ngu Nhân Chi Lữ", url: "http://truyentuan.com/ngu-nhan-chi-lu/" }, { label: "Huyết Sắc Thương Khung", value: "Huyết Sắc Thương Khung", url: "http://truyentuan.com/huyet-sac-thuong-khung/" }, { label: "Oumagadoki Doubutsuen", value: "Oumagadoki Doubutsuen", url: "http://truyentuan.com/oumagadoki-doubutsuen/" }, { label: "Senpai, Sore Hitokuchi Kudasai!", value: "Senpai, Sore Hitokuchi Kudasai!", url: "http://truyentuan.com/senpai-sore-hitokuchi-kudasai/" }, { label: "Tegami bachi", value: "Tegami bachi", url: "http://truyentuan.com/tegami-bachi/" }, { label: "Kare First Love", value: "Kare First Love", url: "http://truyentuan.com/kare-first-love/" }, { label: "Mắt Đỏ", value: "Mắt Đỏ", url: "http://truyentuan.com/mat-do/" }, { label: "Mujang", value: "Mujang", url: "http://truyentuan.com/mujang/" }, { label: "Yuragi-sou no Yuuna-san", value: "Yuragi-sou no Yuuna-san", url: "http://truyentuan.com/yuragi-sou-no-yuuna-san/" }, { label: "Terror Man", value: "Terror Man", url: "http://truyentuan.com/terror-man/" }, { label: "Hard Core Leveling Warrior", value: "Hard Core Leveling Warrior", url: "http://truyentuan.com/hard-core-leveling-warrior/" }, { label: "Yugioh Zexal", value: "Yugioh Zexal", url: "http://truyentuan.com/yugioh-zexal/" }, { label: "Boruto", value: "Boruto", url: "http://truyentuan.com/boruto/" }, { label: "Sword Art Online: Progressive", value: "Sword Art Online: Progressive", url: "http://truyentuan.com/sword-art-online-progressive/" }, { label: "Jesus - Sajin Kouro", value: "Jesus - Sajin Kouro", url: "http://truyentuan.com/jesus-sajin-kouro/" }, { label: "SHADOW CHASERS", value: "SHADOW CHASERS", url: "http://truyentuan.com/shadow-chasers/" }, { label: "Tanaka-kun wa Itsumo Kedaruge", value: "Tanaka-kun wa Itsumo Kedaruge", url: "http://truyentuan.com/tanaka-kun-wa-itsumo-kedaruge/" }, { label: "Đường Dần tại Dị Giới", value: "Đường Dần tại Dị Giới", url: "http://truyentuan.com/duong-dan-tai-di-gioi/" }, { label: "Keijo", value: "Keijo", url: "http://truyentuan.com/keijo/" }, { label: "Shirayuki Panimix!", value: "Shirayuki Panimix!", url: "http://truyentuan.com/shirayuki-panimix/" }, { label: "Liar x Liar", value: "Liar x Liar", url: "http://truyentuan.com/liar-x-liar/" }, { label: "Hoa Quý", value: "Hoa Quý", url: "http://truyentuan.com/hoa-quy/" }, { label: "Yesterday Wo Utatte", value: "Yesterday Wo Utatte", url: "http://truyentuan.com/yesterday-wo-utatte/" }, { label: "Smokin'Parade", value: "Smokin'Parade", url: "http://truyentuan.com/smokin-parade/" }, { label: "Ake no Tobari", value: "Ake no Tobari", url: "http://truyentuan.com/ake-no-tobari/" }, { label: "Thông Linh Phi", value: "Thông Linh Phi", url: "http://truyentuan.com/thong-linh-phi/" }, { label: "Space Time Prison", value: "Space Time Prison", url: "http://truyentuan.com/space-time-prison/" }, { label: "Toàn Chức Cao Thủ", value: "Toàn Chức Cao Thủ", url: "http://truyentuan.com/toan-chuc-cao-thu/" }, { label: ":REverSAL", value: ":REverSAL", url: "http://truyentuan.com/reversal/" }, { label: "Cat is silver vine", value: "Cat is silver vine", url: "http://truyentuan.com/cat-is-silver-vine/" }, { label: "Book Club", value: "Book Club", url: "http://truyentuan.com/book-club/" }, { label: "If I have 1 day to live", value: "If I have 1 day to live", url: "http://truyentuan.com/if-i-have-1-day-to-live/" }, { label: "Harigane Service", value: "Harigane Service", url: "http://truyentuan.com/harigane-service/" }, { label: "Truyện Kinh Dị Ở Tòa Nhà Số 44", value: "Truyện Kinh Dị Ở Tòa Nhà Số 44", url: "http://truyentuan.com/truyen-kinh-di-o-toa-nha-so-44/" }, { label: "Võ lâm manh chủ", value: "Võ lâm manh chủ", url: "http://truyentuan.com/vo-lam-manh-chu/" }, { label: "Kamisama no Inai Nichiyoubi", value: "Kamisama no Inai Nichiyoubi", url: "http://truyentuan.com/kamisama-no-inai-nichiyoubi/" }, { label: "Boogiepop Wa Warawanai", value: "Boogiepop Wa Warawanai", url: "http://truyentuan.com/boogiepop-wa-warawanai/" }, { label: "Avengers VS X-men", value: "Avengers VS X-men", url: "http://truyentuan.com/avengers-vs-x-men/" }, { label: "Isekai Tensei Soudouki", value: "Isekai Tensei Soudouki", url: "http://truyentuan.com/isekai-tensei-soudouki/" }, { label: "Justice League", value: "Justice League", url: "http://truyentuan.com/justice-league/" }, { label: "Shuuen no Shiori", value: "Shuuen no Shiori", url: "http://truyentuan.com/shuuen-no-shiori/" }, { label: "Địa Ngục Thần Y", value: "Địa Ngục Thần Y", url: "http://truyentuan.com/dia-nguc-than-y/" }, { label: "Reincarnation no Kaben", value: "Reincarnation no Kaben", url: "http://truyentuan.com/reincarnation-no-kaben/" }, { label: "Gen Thợ Săn", value: "Gen Thợ Săn", url: "http://truyentuan.com/gen-tho-san/" }, { label: "Koi Inu", value: "Koi Inu", url: "http://truyentuan.com/koi-inu/" }, { label: "Karakuri Circus", value: "Karakuri Circus", url: "http://truyentuan.com/karakuri-circus/" }, { label: "Damned", value: "Damned", url: "http://truyentuan.com/damned/" }, { label: "Tiếu Ngạo Giang Hồ", value: "Tiếu Ngạo Giang Hồ", url: "http://truyentuan.com/tieu-ngao-giang-ho/" }, { label: "Thần Y Đích Nữ", value: "Thần Y Đích Nữ", url: "http://truyentuan.com/than-y-dich-nu/" }, { label: "Dịch Vụ Giao Hàng Âm Dương", value: "Dịch Vụ Giao Hàng Âm Dương", url: "http://truyentuan.com/dich-vu-giao-hang-am-duong/" }, { label: "Ore Monogatari!!", value: "Ore Monogatari!!", url: "http://truyentuan.com/ore-monogatari/" }, { label: "S.L.H (Stray Love Hearts)", value: "S.L.H (Stray Love Hearts)", url: "http://truyentuan.com/slh-stray-love-hearts/" }, { label: "Fourteen", value: "Fourteen", url: "http://truyentuan.com/fourteen/" }, { label: "Những Chuyện Quái Đản", value: "Những Chuyện Quái Đản", url: "http://truyentuan.com/nhung-chuyen-quai-dan/" }, { label: "Táng Hồn Môn", value: "Táng Hồn Môn", url: "http://truyentuan.com/tang-hon-mon/" }, { label: "Tô Sinh Chiến Súng", value: "Tô Sinh Chiến Súng", url: "http://truyentuan.com/to-sinh-chien-sung/" }, { label: "Thiên Sứ Của tôi", value: "Thiên Sứ Của tôi", url: "http://truyentuan.com/thien-su-cua-toi/" }, { label: "Kỵ Sĩ Hoang Tưởng Dạ", value: "Kỵ Sĩ Hoang Tưởng Dạ", url: "http://truyentuan.com/ky-si-hoang-tuong-da/" }, { label: "Tiara", value: "Tiara", url: "http://truyentuan.com/tiara/" }, { label: "Asatte Dance", value: "Asatte Dance", url: "http://truyentuan.com/asatte-dance/" }, { label: "Deathtopia", value: "Deathtopia", url: "http://truyentuan.com/deathtopia/" }, { label: "Woori", value: "Woori", url: "http://truyentuan.com/woori/" }, { label: "Hướng Tới Ánh Mặt Trời", value: "Hướng Tới Ánh Mặt Trời", url: "http://truyentuan.com/huong-toi-anh-mat-troi/" }, { label: "Vương Gia Bá Đạo", value: "Vương Gia Bá Đạo", url: "http://truyentuan.com/vuong-gia-ba-dao/" }, { label: "Thâu Hồn", value: "Thâu Hồn", url: "http://truyentuan.com/thau-hon/" }, { label: "Needless", value: "Needless", url: "http://truyentuan.com/needless/" }, { label: "Đạo Sư Độc Nhãn Long", value: "Đạo Sư Độc Nhãn Long", url: "http://truyentuan.com/dao-su-doc-nhan-long/" }, { label: "Song Tu Đạo Lữ Của Tôi", value: "Song Tu Đạo Lữ Của Tôi", url: "http://truyentuan.com/song-tu-dao-lu-cua-toi/" }, { label: "Lượm Được 1 Tiểu Hồ Ly", value: "Lượm Được 1 Tiểu Hồ Ly", url: "http://truyentuan.com/luom-duoc-1-tieu-ho-ly/" }, { label: "Fairy Tail Gaiden: Lord Knight", value: "Fairy Tail Gaiden: Lord Knight", url: "http://truyentuan.com/fairy-tail-gaiden-lord-knight/" }, { label: "Dạ Du Thần", value: "Dạ Du Thần", url: "http://truyentuan.com/da-du-than/" }, { label: "Tường Vi Quấn Loạn", value: "Tường Vi Quấn Loạn", url: "http://truyentuan.com/tuong-vi-quan-loan/" }, { label: "World Game", value: "World Game", url: "http://truyentuan.com/world-game/" }, { label: "Hồng Vân", value: "Hồng Vân", url: "http://truyentuan.com/hong-van/" }, { label: "Phá Hiểu Thế Kỷ", value: "Phá Hiểu Thế Kỷ", url: "http://truyentuan.com/pha-hieu-the-ky/" }, { label: "Huyễn Thú Vương", value: "Huyễn Thú Vương", url: "http://truyentuan.com/huyen-thu-vuong/" }, { label: "Nhất Nhân Chi Hạ", value: "Nhất Nhân Chi Hạ", url: "http://truyentuan.com/nhat-nhan-chi-ha/" }, { label: "Trump", value: "Trump", url: "http://truyentuan.com/trump/" }, { label: "Yến Sơn Phái Và Bách Hoa Môn", value: "Yến Sơn Phái Và Bách Hoa Môn", url: "http://truyentuan.com/yen-son-phai-va-bach-hoa-mon/" }, { label: "Re:Zero kara Hajimeru Isekai Seikatsu - Daisshou - Outo no Ichinichi Hen", value: "Re:Zero kara Hajimeru Isekai Seikatsu - Daisshou - Outo no Ichinichi Hen", url: "http://truyentuan.com/rezero-kara-hajimeru-isekai-seikatsu-daisshou-outo-no-ichinichi-hen/" }, { label: "xxxHOLiC Rei", value: "xxxHOLiC Rei", url: "http://truyentuan.com/xxxholic-rei/" }, { label: "Quyền Bá Thiên Hạ", value: "Quyền Bá Thiên Hạ", url: "http://truyentuan.com/quyen-ba-thien-ha/" }, { label: "Thời niên thiếu của Black Jack", value: "Thời niên thiếu của Black Jack", url: "http://truyentuan.com/thoi-nien-thieu-cua-black-jack/" }, { label: "Mushishi", value: "Mushishi", url: "http://truyentuan.com/mushishi/" }, { label: "Tô Tịch Kỳ Quái", value: "Tô Tịch Kỳ Quái", url: "http://truyentuan.com/to-tich-ky-quai/" }, { label: "Nguyên Mục", value: "Nguyên Mục", url: "http://truyentuan.com/nguyen-muc/" }, { label: "Giả Diện Thế Thân", value: "Giả Diện Thế Thân", url: "http://truyentuan.com/gia-dien-the-than/" }, { label: "Your Lie in April", value: "Your Lie in April", url: "http://truyentuan.com/your-lie-in-april/" }, { label: "Kenja No Mago", value: "Kenja No Mago", url: "http://truyentuan.com/kenja-no-mago/" }, { label: "Kid Gang II", value: "Kid Gang II", url: "http://truyentuan.com/kid-gang-ii/" }, { label: "Avengers (2013)", value: "Avengers (2013)", url: "http://truyentuan.com/avengers-2013/" }, { label: "I'm A Loser", value: "I'm A Loser", url: "http://truyentuan.com/im-a-loser/" }, { label: "Trung Quốc Kinh Ngạc Tiên Sinh", value: "Trung Quốc Kinh Ngạc Tiên Sinh", url: "http://truyentuan.com/trung-quoc-kinh-ngac-tien-sinh/" }, { label: "Đầu Óc Đại Sư Huynh Của Ta Rất Đen Tối", value: "Đầu Óc Đại Sư Huynh Của Ta Rất Đen Tối", url: "http://truyentuan.com/dau-oc-dai-su-huynh-cua-ta-rat-den-toi/" }, { label: "Nekota no Koto ga Ki ni Natte Shikatana", value: "Nekota no Koto ga Ki ni Natte Shikatana", url: "http://truyentuan.com/nekota-no-koto-ga-ki-ni-natte-shikatana/" }, { label: "Tsuki ga Michibiku Isekai Douchuu", value: "Tsuki ga Michibiku Isekai Douchuu", url: "http://truyentuan.com/tsuki-ga-michibiku-isekai-douchuu/" }, { label: "Thăng Long Đạo", value: "Thăng Long Đạo", url: "http://truyentuan.com/thang-long-dao/" }, { label: "Nhẫn Tây Du", value: "Nhẫn Tây Du", url: "http://truyentuan.com/nhan-tay-du/" }, { label: "Thành Phố Quỷ Dị – The Lost City", value: "Thành Phố Quỷ Dị – The Lost City", url: "http://truyentuan.com/thanh-pho-quy-di-the-lost-city/" }, { label: "Phụng Lâm Thiên Hạ III", value: "Phụng Lâm Thiên Hạ III", url: "http://truyentuan.com/phung-lam-thien-ha-iii/" }, { label: "I Am Killer Maid", value: "I Am Killer Maid", url: "http://truyentuan.com/i-am-killer-maid/" }, { label: "Life Howling", value: "Life Howling", url: "http://truyentuan.com/life-howling/" }, { label: "Quang Ảnh Đối Quyết", value: "Quang Ảnh Đối Quyết", url: "http://truyentuan.com/quang-anh-doi-quyet/" }, { label: "Tuổi 15", value: "Tuổi 15", url: "http://truyentuan.com/tuoi-15/" }, { label: "Wizardly Tower", value: "Wizardly Tower", url: "http://truyentuan.com/wizardly-tower/" }, { label: "Kamen Rider Spirits", value: "Kamen Rider Spirits", url: "http://truyentuan.com/kamen-rider-spirits/" }, { label: "Phoenix no Ongaeshi", value: "Phoenix no Ongaeshi", url: "http://truyentuan.com/phoenix-no-ongaeshi/" }, { label: "Đấu La Đại Lục 3 – Long Vương Truyền Thuyết", value: "Đấu La Đại Lục 3 – Long Vương Truyền Thuyết", url: "http://truyentuan.com/dau-la-dai-luc-3-long-vuong-truyen-thuyet/" }, { label: "Chimamire Sukeban Chainsaw", value: "Chimamire Sukeban Chainsaw", url: "http://truyentuan.com/chimamire-sukeban-chainsaw/" }, { label: "MIA: Lost in Operation", value: "MIA: Lost in Operation", url: "http://truyentuan.com/mia-lost-in-operation/" }, { label: "Ecstasy Hearts", value: "Ecstasy Hearts", url: "http://truyentuan.com/ecstasy-hearts/" }, { label: "Tale Of Felluah", value: "Tale Of Felluah", url: "http://truyentuan.com/tale-of-felluah/" }, { label: "A Thousand Years Ninetails - Ai Scans", value: "A Thousand Years Ninetails - Ai Scans", url: "http://truyentuan.com/atyn/" }, { label: "Aoharu x Kikanjuu", value: "Aoharu x Kikanjuu", url: "http://truyentuan.com/aoharu-x-kikanjuu/" }, { label: "Beautiful Stranger", value: "Beautiful Stranger", url: "http://truyentuan.com/beautiful-stranger/" }, { label: "F.o.x", value: "F.o.x", url: "http://truyentuan.com/f-o-x/" }, { label: "Hana ni Nare", value: "Hana ni Nare", url: "http://truyentuan.com/hana-ni-nare/" }, { label: "Choujin Sensen", value: "Choujin Sensen", url: "http://truyentuan.com/choujin-sensen/" }, { label: "High School DXD", value: "High School DXD", url: "http://truyentuan.com/high-school-dxd/" }, { label: "Transparent Cohabitation (Tt8)", value: "Transparent Cohabitation (Tt8)", url: "http://truyentuan.com/transparent-cohabitation-tt8/" }, { label: "Chú Thoong", value: "Chú Thoong", url: "http://truyentuan.com/chu-thoong/" }, { label: "Barakamon", value: "Barakamon", url: "http://truyentuan.com/barakamon/" }, { label: "Tinh Võ Thần Quyết", value: "Tinh Võ Thần Quyết", url: "http://truyentuan.com/tinh-vo-than-quyet/" }, { label: "Shion Of The Dead", value: "Shion Of The Dead", url: "http://truyentuan.com/shion-of-the-dead/" }, { label: "Kyou no Asuka Show", value: "Kyou no Asuka Show", url: "http://truyentuan.com/kyou-no-asuka-show/" }, { label: "Good Night World", value: "Good Night World", url: "http://truyentuan.com/good-night-world/" }, { label: "Kure-nai", value: "Kure-nai", url: "http://truyentuan.com/kure-nai/" }, { label: "The Legend of Wonder Woman", value: "The Legend of Wonder Woman", url: "http://truyentuan.com/the-legend-of-wonder-woman/" }, { label: "Kashimashi", value: "Kashimashi", url: "http://truyentuan.com/kashimashi/" }, { label: "Waga Na Wa Umishi", value: "Waga Na Wa Umishi", url: "http://truyentuan.com/waga-na-wa-umishi/" }, { label: "Fureru to Kikoeru", value: "Fureru to Kikoeru", url: "http://truyentuan.com/fureru-to-kikoeru/" }, { label: "Boku no Kanojo ga Majime Sugiru Shojo Bitch na Ken", value: "Boku no Kanojo ga Majime Sugiru Shojo Bitch na Ken", url: "http://truyentuan.com/boku-no-kanojo-ga-majime-sugiru-shojo-bitch-na-ken/" }, { label: "Gabriel Dropout", value: "Gabriel Dropout", url: "http://truyentuan.com/gabriel-dropout/" }, { label: "Ojojojo", value: "Ojojojo", url: "http://truyentuan.com/ojojojo/" }, { label: "Kagerou Deizu", value: "Kagerou Deizu", url: "http://truyentuan.com/kagerou-deizu/" }, { label: "DOKGO REWIND - Độc Cô Tiền Truyện", value: "DOKGO REWIND - Độc Cô Tiền Truyện", url: "http://truyentuan.com/dokgo-rewind-doc-co-tien-truyen/" }, { label: "MAZE AGE Z", value: "MAZE AGE Z", url: "http://truyentuan.com/maze-age-z/" }, { label: "Higashi No Kurume To Tonari No Meguru", value: "Higashi No Kurume To Tonari No Meguru", url: "http://truyentuan.com/higashi-no-kurume-to-tonari-no-meguru/" }, { label: "Denpatou", value: "Denpatou", url: "http://truyentuan.com/denpatou/" }, { label: "Bán Yêu Khuynh Thành", value: "Bán Yêu Khuynh Thành", url: "http://truyentuan.com/ban-yeu-khuynh-thanh/" }, { label: "Dansan Joshi", value: "Dansan Joshi", url: "http://truyentuan.com/dansan-joshi/" }, { label: "Xích Hoàng Truyền Kỳ", value: "Xích Hoàng Truyền Kỳ", url: "http://truyentuan.com/xich-hoang-truyen-ky/" }, { label: "Bác Sĩ Tình Yêu", value: "Bác Sĩ Tình Yêu", url: "http://truyentuan.com/bac-si-tinh-yeu/" }, { label: "Bokutachi wa Shitte Shimatta", value: "Bokutachi wa Shitte Shimatta", url: "http://truyentuan.com/bokutachi-wa-shitte-shimatta/" }, { label: "Tình yêu không nói dối", value: "Tình yêu không nói dối", url: "http://truyentuan.com/tinh-yeu-khong-noi-doi/" }, { label: "Vương Bài Giáo Thảo", value: "Vương Bài Giáo Thảo", url: "http://truyentuan.com/vuong-bai-giao-thao/" }, { label: "Lưỡng Bất Nghi", value: "Lưỡng Bất Nghi", url: "http://truyentuan.com/luong-bat-nghi/" }, { label: "Tam Thiên Nhứ", value: "Tam Thiên Nhứ", url: "http://truyentuan.com/tam-thien-nhu/" }, { label: "Ma Vương - Liễu Kỹ Vân", value: "Ma Vương - Liễu Kỹ Vân", url: "http://truyentuan.com/ma-vuong-lieu-ky-van/" }, { label: "Back Street Girls", value: "Back Street Girls", url: "http://truyentuan.com/back-street-girls/" }, { label: "Gunota ga Mahou Sekai ni Tensei Shitara", value: "Gunota ga Mahou Sekai ni Tensei Shitara", url: "http://truyentuan.com/gunota-ga-mahou-sekai-ni-tensei-shitara/" }, { label: "Bạn Trai Tôi Là Cẩm Y Vệ", value: "Bạn Trai Tôi Là Cẩm Y Vệ", url: "http://truyentuan.com/ban-trai-toi-la-cam-y-ve/" }, { label: "Tước Tích", value: "Tước Tích", url: "http://truyentuan.com/tuoc-tich/" }, { label: "Tầm Trảo Tiền Thế Chi Lữ", value: "Tầm Trảo Tiền Thế Chi Lữ", url: "http://truyentuan.com/tam-trao-tien-the-chi-lu/" }, { label: "Boku dake ga Inai Machi", value: "Boku dake ga Inai Machi", url: "http://truyentuan.com/boku-dake-ga-inai-machi/" }, { label: "Spice and Wolf", value: "Spice and Wolf", url: "http://truyentuan.com/spice-and-wolf/" }, { label: "Tấn Công Nào! Ma Vương!", value: "Tấn Công Nào! Ma Vương!", url: "http://truyentuan.com/tan-cong-nao-ma-vuong/" }, { label: "Thành Phố Sống", value: "Thành Phố Sống", url: "http://truyentuan.com/thanh-pho-song/" }, { label: "Sự Cám Dỗ Xấu Xa", value: "Sự Cám Dỗ Xấu Xa", url: "http://truyentuan.com/su-cam-do-xau-xa/" }, { label: "Lasboss x Hero", value: "Lasboss x Hero", url: "http://truyentuan.com/lasboss-x-hero/" }, { label: "Thế Giới Hoàn Mỹ", value: "Thế Giới Hoàn Mỹ", url: "http://truyentuan.com/the-gioi-hoan-my/" }, { label: "Wild Half", value: "Wild Half", url: "http://truyentuan.com/wild-half/" }, { label: "Ngạo Thế Cửu Trọng Thiên", value: "Ngạo Thế Cửu Trọng Thiên", url: "http://truyentuan.com/ngao-the-cuu-trong-thien/" }, { label: "Mỹ Nam Học Đường", value: "Mỹ Nam Học Đường", url: "http://truyentuan.com/my-nam-hoc-duong/" }, { label: "New Game!", value: "New Game!", url: "http://truyentuan.com/new-game/" }, { label: "Trạch Thiên Ký", value: "Trạch Thiên Ký", url: "http://truyentuan.com/trach-thien-ky/" }, { label: "Ookami to Koushinryou", value: "Ookami to Koushinryou", url: "http://truyentuan.com/ookami-to-koushinryou/" }, { label: "Orange Chocolate", value: "Orange Chocolate", url: "http://truyentuan.com/orange-chocolate/" }, { label: "Gift ±", value: "Gift ±", url: "http://truyentuan.com/gift/" }, { label: "Xuyên Việt Chi Thiên Tâm Linh", value: "Xuyên Việt Chi Thiên Tâm Linh", url: "http://truyentuan.com/xuyen-viet-chi-thien-tam-linh/" }, { label: "Perfect Half", value: "Perfect Half", url: "http://truyentuan.com/perfect-half/" }, { label: "Strike the Blood", value: "Strike the Blood", url: "http://truyentuan.com/strike-the-blood/" }, { label: "Chihou Kishi Hans no Junan", value: "Chihou Kishi Hans no Junan", url: "http://truyentuan.com/chihou-kishi-hans-no-junan/" }, { label: "Vương Gia ! Ngươi Thật Bỉ Ổi !", value: "Vương Gia ! Ngươi Thật Bỉ Ổi !", url: "http://truyentuan.com/vuong-gia-nguoi-that-bi-oi/" }, { label: "Kaguya-sama wa Kokurasetai - Tensai-tachi no Renai Zunousen", value: "Kaguya-sama wa Kokurasetai - Tensai-tachi no Renai Zunousen", url: "http://truyentuan.com/kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen/" }, { label: "Trinity Wonder", value: "Trinity Wonder", url: "http://truyentuan.com/trinity-wonder/" }, { label: "Thanh Ninh Chi Hạ", value: "Thanh Ninh Chi Hạ", url: "http://truyentuan.com/thanh-ninh-chi-ha/" }, { label: "Our Reason For Living", value: "Our Reason For Living", url: "http://truyentuan.com/our-reason-for-living/" }, { label: "Thánh Vương", value: "Thánh Vương", url: "http://truyentuan.com/thanh-vuong/" }, { label: "Moritat", value: "Moritat", url: "http://truyentuan.com/moritat/" }, { label: "Aka Akatoretachi no Monogatari", value: "Aka Akatoretachi no Monogatari", url: "http://truyentuan.com/aka-akatoretachi-no-monogatari/" }, { label: "Kono Subarashii Sekai ni Shukufuku o!", value: "Kono Subarashii Sekai ni Shukufuku o!", url: "http://truyentuan.com/kono-subarashii-sekai-ni-shukufuku-o/" }, { label: "Kyou No Yuiko-san", value: "Kyou No Yuiko-san", url: "http://truyentuan.com/kyou-no-yuiko-san/" }, { label: "Nam Thần Ở Phòng Bên Cạnh", value: "Nam Thần Ở Phòng Bên Cạnh", url: "http://truyentuan.com/nam-than-o-phong-ben-canh/" }, { label: "Honey", value: "Honey", url: "http://truyentuan.com/honey/" }, { label: "Sở Sở Động Lòng Nhân Ái", value: "Sở Sở Động Lòng Nhân Ái", url: "http://truyentuan.com/so-so-dong-long-nhan-ai/" }, { label: "Cross Manage", value: "Cross Manage", url: "http://truyentuan.com/cross-manage/" }, { label: "Lưu Luyến Tinh Diệu", value: "Lưu Luyến Tinh Diệu", url: "http://truyentuan.com/luu-luyen-tinh-dieu/" }, { label: "Thời Gian Chi Ngoại", value: "Thời Gian Chi Ngoại", url: "http://truyentuan.com/thoi-gian-chi-ngoai/" }, { label: "Ngự Linh Thế Giới", value: "Ngự Linh Thế Giới", url: "http://truyentuan.com/ngu-linh-the-gioi/" }, { label: "Hensokukei Quadrangle", value: "Hensokukei Quadrangle", url: "http://truyentuan.com/hensokukei-quadrangle/" }, { label: "Vong Linh Vương [Undead King]", value: "Vong Linh Vương [Undead King]", url: "http://truyentuan.com/vong-linh-vuong-undead-king/" }, { label: "Watashi no Ookami-kun", value: "Watashi no Ookami-kun", url: "http://truyentuan.com/watashi-no-ookami-kun/" }, { label: "UnOrdinary", value: "UnOrdinary", url: "http://truyentuan.com/unordinary/" }, { label: "Red Sprite", value: "Red Sprite", url: "http://truyentuan.com/red-sprite/" }, { label: "Kunisaki izumo no jijou", value: "Kunisaki izumo no jijou", url: "http://truyentuan.com/kunisaki-izumo-no-jijou/" }, { label: "Enen no Shouboutai", value: "Enen no Shouboutai", url: "http://truyentuan.com/enen-no-shouboutai/" }, { label: "Uyển Hương", value: "Uyển Hương", url: "http://truyentuan.com/uyen-huong/" }, { label: "Ngụy Thủy Nghi Vân", value: "Ngụy Thủy Nghi Vân", url: "http://truyentuan.com/nguy-thuy-nghi-van/" }, { label: "Việt Thế Thiên Niên", value: "Việt Thế Thiên Niên", url: "http://truyentuan.com/viet-the-thien-nien/" }, { label: "Love Rush !!", value: "Love Rush !!", url: "http://truyentuan.com/love-rush/" }, { label: "Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!", value: "Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!", url: "http://truyentuan.com/watashi-ga-motenai-no-wa-dou-kangaetemo-omaera-ga-warui/" }, { label: "Mãng Hoang Ký", value: "Mãng Hoang Ký", url: "http://truyentuan.com/mang-hoang-ky/" }, { label: "Kumo Desu ga, Nani ka?", value: "Kumo Desu ga, Nani ka?", url: "http://truyentuan.com/kumo-desu-ga-nani-ka/" }, { label: "Girl And Science", value: "Girl And Science", url: "http://truyentuan.com/girl-and-science/" }, { label: "Musuko ga Kawaikute Shikataganai Mazoku no Hahaoya", value: "Musuko ga Kawaikute Shikataganai Mazoku no Hahaoya", url: "http://truyentuan.com/musuko-ga-kawaikute-shikataganai-mazoku-no-hahaoya/" }, { label: "La Sát Đại Nhân Hãy Dừng Chân", value: "La Sát Đại Nhân Hãy Dừng Chân", url: "http://truyentuan.com/la-sat-dai-nhan-hay-dung-chan/" }, { label: "Hajimete No Gal", value: "Hajimete No Gal", url: "http://truyentuan.com/hajimete-no-gal/" }, { label: "Fleet Journal", value: "Fleet Journal", url: "http://truyentuan.com/fleet-journal/" }, { label: "Linh Khiết", value: "Linh Khiết", url: "http://truyentuan.com/linh-khiet/" }, { label: "VÔ DANH TIÊU CỤC", value: "VÔ DANH TIÊU CỤC", url: "http://truyentuan.com/vo-danh-tieu-cuc/" }, { label: "MONONOTE: EDO SHINOBI KAGYOU", value: "MONONOTE: EDO SHINOBI KAGYOU", url: "http://truyentuan.com/mononote-edo-shinobi-kagyou/" }, { label: "Zannen Jokanbu Black General-san", value: "Zannen Jokanbu Black General-san", url: "http://truyentuan.com/zannen-jokanbu-black-general-san/" }, { label: "Gokukoku no Brynhildr", value: "Gokukoku no Brynhildr", url: "http://truyentuan.com/gokukoku-no-brynhildr/" }, { label: "Yaoguai Mingdan", value: "Yaoguai Mingdan", url: "http://truyentuan.com/yaoguai-mingdan/" }, { label: "Yujo No Yume", value: "Yujo No Yume", url: "http://truyentuan.com/yujo-no-yume/" }, { label: "Iinazuke Kyoutei", value: "Iinazuke Kyoutei", url: "http://truyentuan.com/iinazuke-kyoutei/" }, { label: "Hương Vị Mùa Hạ", value: "Hương Vị Mùa Hạ", url: "http://truyentuan.com/huong-vi-mua-ha/" }, { label: "Keishichou Tokuhanka 007", value: "Keishichou Tokuhanka 007", url: "http://truyentuan.com/keishichou-tokuhanka-007/" }, { label: "Days", value: "Days", url: "http://truyentuan.com/days/" }, { label: "Trạch Yêu Ký", value: "Trạch Yêu Ký", url: "http://truyentuan.com/trach-yeu-ky/" }, { label: "Resident Evil Biohazard Heavenly Island", value: "Resident Evil Biohazard Heavenly Island", url: "http://truyentuan.com/resident-evil-biohazard-heavenly-island/" }, { label: "Criminale!", value: "Criminale!", url: "http://truyentuan.com/criminale/" }, { label: "Maou-jou de Oyasumi", value: "Maou-jou de Oyasumi", url: "http://truyentuan.com/maou-jou-de-oyasumi/" }, { label: "Võng Du Chi Cận Chiến Pháp Sư", value: "Võng Du Chi Cận Chiến Pháp Sư", url: "http://truyentuan.com/vong-du-chi-can-chien-phap-su/" }, { label: "Mikakunin de Shinkoukei", value: "Mikakunin de Shinkoukei", url: "http://truyentuan.com/mikakunin-de-shinkoukei/" }, { label: "Chước Chước Lưu Ly Hạ", value: "Chước Chước Lưu Ly Hạ", url: "http://truyentuan.com/chuoc-chuoc-luu-ly-ha/" }, { label: "Sekai no Owari no Encore", value: "Sekai no Owari no Encore", url: "http://truyentuan.com/sekai-no-owari-no-encore/" }, { label: "Cực Phẩm Gia Đinh", value: "Cực Phẩm Gia Đinh", url: "http://truyentuan.com/cuc-pham-gia-dinh/" }, { label: "Floor ni maou ga imasu", value: "Floor ni maou ga imasu", url: "http://truyentuan.com/floor-ni-maou-ga-imasu/" }, { label: "Cô rồng hầu gái của Kobayashi-san", value: "Cô rồng hầu gái của Kobayashi-san", url: "http://truyentuan.com/co-rong-hau-gai-cua-kobayashi-san/" }, { label: "Tôi Là Vợ Tôi", value: "Tôi Là Vợ Tôi", url: "http://truyentuan.com/toi-la-vo-toi/" }, { label: "Dragon Ball Gaiden - Tensei shitara Yamcha datta ken", value: "Dragon Ball Gaiden - Tensei shitara Yamcha datta ken", url: "http://truyentuan.com/dragon-ball-gaiden-tensei-shitara-yamcha-datta-ken/" }, { label: "Anh Hùng Vô Lệ", value: "Anh Hùng Vô Lệ", url: "http://truyentuan.com/anh-hung-vo-le/" }, { label: "C Sword and Cornett", value: "C Sword and Cornett", url: "http://truyentuan.com/c-sword-and-cornett/" }, { label: "Inugami-san to Sarutobi-kun wa Naka ga Warui", value: "Inugami-san to Sarutobi-kun wa Naka ga Warui", url: "http://truyentuan.com/inugami-san-to-sarutobi-kun-wa-naka-ga-warui/" }, { label: "To Aru Kagaku No Accelerator", value: "To Aru Kagaku No Accelerator", url: "http://truyentuan.com/to-aru-kagaku-no-accelerator/" }, { label: "Thấu Ngọc Từ", value: "Thấu Ngọc Từ", url: "http://truyentuan.com/thau-ngoc-tu/" }, { label: "Niflheim", value: "Niflheim", url: "http://truyentuan.com/niflheim/" }, { label: "The Promised Neverland", value: "The Promised Neverland", url: "http://truyentuan.com/the-promised-neverland/" }, { label: "Chí Tôn Chư Thiên", value: "Chí Tôn Chư Thiên", url: "http://truyentuan.com/chi-ton-chu-thien/" }, { label: "Himegoto Comic Rex", value: "Himegoto Comic Rex", url: "http://truyentuan.com/himegoto-comic-rex/" }, { label: "Tinh Thần Biến", value: "Tinh Thần Biến", url: "http://truyentuan.com/tinh-than-bien/" }, { label: "Granblue Fantasy", value: "Granblue Fantasy", url: "http://truyentuan.com/granblue-fantasy/" }, { label: "Bloody Girl", value: "Bloody Girl", url: "http://truyentuan.com/bloody-girl/" }, { label: "Thần thoại Bắc Âu", value: "Thần thoại Bắc Âu", url: "http://truyentuan.com/than-thoai-bac-au/" }, { label: "Aizawa-san Zoushoku", value: "Aizawa-san Zoushoku", url: "http://truyentuan.com/aizawa-san-zoushoku/" }, { label: "Hito Hitori Futari", value: "Hito Hitori Futari", url: "http://truyentuan.com/hito-hitori-futari/" }, { label: "Servamp", value: "Servamp", url: "http://truyentuan.com/servamp/" }, { label: "The Strange Tales Of Oscar Zahn", value: "The Strange Tales Of Oscar Zahn", url: "http://truyentuan.com/the-strange-tales-of-oscar-zahn/" }, { label: "Zelda no Densetsu - Twilight Princess", value: "Zelda no Densetsu - Twilight Princess", url: "http://truyentuan.com/zelda-no-densetsu-twilight-princess/" }, { label: "Mist Story", value: "Mist Story", url: "http://truyentuan.com/mist-story/" }, { label: "Uratarou", value: "Uratarou", url: "http://truyentuan.com/uratarou/" }, { label: "Kimetsu no Yaiba", value: "Kimetsu no Yaiba", url: "http://truyentuan.com/kimetsu-no-yaiba/" }, { label: "Grand Blue", value: "Grand Blue", url: "http://truyentuan.com/grand-blue/" }, { label: "Maousama Chotto Sore Totte!!", value: "Maousama Chotto Sore Totte!!", url: "http://truyentuan.com/maousama-chotto-sore-totte/" }, { label: "Tokage no Ou", value: "Tokage no Ou", url: "http://truyentuan.com/tokage-no-ou/" }, { label: "Saijaku Muhai no Shinsou Kiryuu", value: "Saijaku Muhai no Shinsou Kiryuu", url: "http://truyentuan.com/saijaku-muhai-no-shinsou-kiryuu/" }, { label: "Edogawa Ranpo Ijinkan", value: "Edogawa Ranpo Ijinkan", url: "http://truyentuan.com/edogawa-ranpo-ijinkan/" }, { label: "Knights & Magic", value: "Knights & Magic", url: "http://truyentuan.com/knights-magic/" }, { label: "Tiêu Nhân", value: "Tiêu Nhân", url: "http://truyentuan.com/tieu-nhan/" }, { label: "No Guns Life", value: "No Guns Life", url: "http://truyentuan.com/no-guns-life/" }, { label: "Epic of Gilgamesh", value: "Epic of Gilgamesh", url: "http://truyentuan.com/epic-of-gilgamesh/" }, { label: "Prison Lab", value: "Prison Lab", url: "http://truyentuan.com/prison-lab/" }, { label: "Wind Breaker", value: "Wind Breaker", url: "http://truyentuan.com/wind-breaker/" }, { label: "Savanna Game: The Comic", value: "Savanna Game: The Comic", url: "http://truyentuan.com/savanna-game-the-comic/" }, { label: "Dawn of the Frozen Wastelands", value: "Dawn of the Frozen Wastelands", url: "http://truyentuan.com/dawn-of-the-frozen-wastelands/" }, { label: "Love-X", value: "Love-X", url: "http://truyentuan.com/love-x/" }, { label: "Kono Shima ni wa Midara de Jaaku na Mono ga Sumu", value: "Kono Shima ni wa Midara de Jaaku na Mono ga Sumu", url: "http://truyentuan.com/kono-shima-ni-wa-midara-de-jaaku-na-mono-ga-sumu/" }, { label: "Bloody Maiden", value: "Bloody Maiden", url: "http://truyentuan.com/bloody-maiden/" }, { label: "Thành phố vô tội", value: "Thành phố vô tội", url: "http://truyentuan.com/thanh-pho-vo-toi/" }, { label: "Ibitsu no Amalgam", value: "Ibitsu no Amalgam", url: "http://truyentuan.com/ibitsu-no-amalgam/" }, { label: "Miền đất hứa", value: "Miền đất hứa", url: "http://truyentuan.com/mien-dat-hua/" }, { label: "Yozakura Quartet", value: "Yozakura Quartet", url: "http://truyentuan.com/yozakura-quartet/" }, { label: "-SINS-", value: "-SINS-", url: "http://truyentuan.com/sins/" }, { label: "(G) Edition", value: "(G) Edition", url: "http://truyentuan.com/g-edition/" }, { label: "Jojo’s Bizarre Adventure - Rohan Thus Spoken", value: "Jojo’s Bizarre Adventure - Rohan Thus Spoken", url: "http://truyentuan.com/jojos-bizarre-adventure-rohan-thus-spoken/" }, { label: "Omaera Zenin Mendokusai!", value: "Omaera Zenin Mendokusai!", url: "http://truyentuan.com/omaera-zenin-mendokusai/" }, { label: "Shinseiki Evangelion", value: "Shinseiki Evangelion", url: "http://truyentuan.com/shinseiki-evangelion/" }, { label: "Premarital Relationship", value: "Premarital Relationship", url: "http://truyentuan.com/premarital-relationship/" }, { label: "Demonizer Zilch", value: "Demonizer Zilch", url: "http://truyentuan.com/demonizer-zilch/" }, { label: "Thiên Giáng Hiền Thục Nam", value: "Thiên Giáng Hiền Thục Nam", url: "http://truyentuan.com/thien-giang-hien-thuc-nam/" }, { label: "Oyasumi Punpun", value: "Oyasumi Punpun", url: "http://truyentuan.com/oyasumi-punpun/" }, { label: "Anorexia - Shikabane Hanako wa Kyoshokushou", value: "Anorexia - Shikabane Hanako wa Kyoshokushou", url: "http://truyentuan.com/anorexia-shikabane-hanako-wa-kyoshokushou/" }, { label: "Mỹ Nhân Làm Tướng", value: "Mỹ Nhân Làm Tướng", url: "http://truyentuan.com/my-nhan-lam-tuong/" }, { label: "Arisa", value: "Arisa", url: "http://truyentuan.com/arisa/" }, { label: "Death March Kara Hajimaru Isekai Kyousou Kyoku", value: "Death March Kara Hajimaru Isekai Kyousou Kyoku", url: "http://truyentuan.com/death-march-kara-hajimaru-isekai-kyousou-kyoku/" }, { label: "Xuyên Duyệt Tây Nguyên 3000", value: "Xuyên Duyệt Tây Nguyên 3000", url: "http://truyentuan.com/xuyen-duyet-tay-nguyen-3000/" }, { label: "Black Torch", value: "Black Torch", url: "http://truyentuan.com/black-torch/" }, { label: "Kemono Jihen", value: "Kemono Jihen", url: "http://truyentuan.com/kemono-jihen/" }, { label: "Fate/Extra CCC Fox Tail", value: "Fate/Extra CCC Fox Tail", url: "http://truyentuan.com/fateextra-ccc-foxtail/" }, { label: "Nein ~9th Story~", value: "Nein ~9th Story~", url: "http://truyentuan.com/nein-9th-story/" }, { label: "D.Y.N. Freaks", value: "D.Y.N. Freaks", url: "http://truyentuan.com/d-y-n-freaks/" }, { label: "Ngọn lửa Recca", value: "Ngọn lửa Recca", url: "http://truyentuan.com/ngon-lua-recca/" }, { label: "Hungry Marie", value: "Hungry Marie", url: "http://truyentuan.com/hungry-marie/" }, { label: "Mairimashita! Iruma-kun", value: "Mairimashita! Iruma-kun", url: "http://truyentuan.com/mairimashita-iruma-kun/" }, { label: "Wortenia Senki", value: "Wortenia Senki", url: "http://truyentuan.com/wortenia-senki/" }, { label: "Sukedachi 09", value: "Sukedachi 09", url: "http://truyentuan.com/sukedachi-09/" }, { label: "Destroy and Revolution", value: "Destroy and Revolution", url: "http://truyentuan.com/destroy-and-revolution/" }, { label: "Yumekuri", value: "Yumekuri", url: "http://truyentuan.com/yumekuri/" }, { label: "Innocent", value: "Innocent", url: "http://truyentuan.com/innocent-2/" }, { label: "Stretch", value: "Stretch", url: "http://truyentuan.com/stretch/" }, { label: "Bungo Stray Dogs", value: "Bungo Stray Dogs", url: "http://truyentuan.com/bungo-stray-dogs/" }, { label: "Ansatsu Kyoushitsu Korosensei Quest", value: "Ansatsu Kyoushitsu Korosensei Quest", url: "http://truyentuan.com/ansatsu-kyoushitsu-korosensei-quest/" }, { label: "Cực Phẩm Manh Nương Thật Uy Vũ", value: "Cực Phẩm Manh Nương Thật Uy Vũ", url: "http://truyentuan.com/cuc-pham-manh-nuong-that-uy-vu/" }, { label: "Goblin Slayer", value: "Goblin Slayer", url: "http://truyentuan.com/goblin-slayer/" }, { label: "Mouhitsu Hallucination", value: "Mouhitsu Hallucination", url: "http://truyentuan.com/mouhitsu-hallucination/" }, { label: "Dr. Stone", value: "Dr. Stone", url: "http://truyentuan.com/dr-stone/" }, { label: "eldLIVE", value: "eldLIVE", url: "http://truyentuan.com/eldlive/" }, { label: "Fumetsu No Anata E", value: "Fumetsu No Anata E", url: "http://truyentuan.com/fumetsu-no-anata-e/" }, { label: "Karada Sagashi", value: "Karada Sagashi", url: "http://truyentuan.com/karada-sagashi/" }, { label: "Zero Game", value: "Zero Game", url: "http://truyentuan.com/zero-game/" }, { label: "Parallel Paradise", value: "Parallel Paradise", url: "http://truyentuan.com/parallel-paradise/" }, { label: "Kimi wa Midara na Boku no Joou", value: "Kimi wa Midara na Boku no Joou", url: "http://truyentuan.com/kimi-wa-midara-na-boku-no-joou/" }, { label: "Origin", value: "Origin", url: "http://truyentuan.com/origin/" }, { label: "Tây Du Ký màu", value: "Tây Du Ký màu", url: "http://truyentuan.com/tay-du-ky-mau/" }, { label: "Ai-sensei wa Wakaranai", value: "Ai-sensei wa Wakaranai", url: "http://truyentuan.com/ai-sensei-wa-wakaranai/" }, { label: "Robot x Laserbeam", value: "Robot x Laserbeam", url: "http://truyentuan.com/robot-x-laserbeam/" }, { label: "Kuutei Dragons", value: "Kuutei Dragons", url: "http://truyentuan.com/kuutei-dragons/" }, { label: "Only Sense Online", value: "Only Sense Online", url: "http://truyentuan.com/only-sense-online/" }, { label: "Tôi đang đứng trên 1 triệu sinh mệnh", value: "Tôi đang đứng trên 1 triệu sinh mệnh", url: "http://truyentuan.com/toi-dang-dung-tren-1-trieu-sinh-menh/" }, { label: "Black June", value: "Black June", url: "http://truyentuan.com/black-june/" }, { label: "Sát Thủ Đeo Mặt Nạ", value: "Sát Thủ Đeo Mặt Nạ", url: "http://truyentuan.com/sat-thu-deo-mat-na/" }, { label: "Jagaaaaaan", value: "Jagaaaaaan", url: "http://truyentuan.com/jagaaaaaan/" }, { label: "Umibe no Onnanoko", value: "Umibe no Onnanoko", url: "http://truyentuan.com/umibe-no-onnanoko/" }, { label: "Gal Gohan", value: "Gal Gohan", url: "http://truyentuan.com/gal-gohan/" }, { label: "Mahou Shoujo Tokushuusen Asuka", value: "Mahou Shoujo Tokushuusen Asuka", url: "http://truyentuan.com/mahou-shoujo-tokushuusen-asuka/" }, { label: "Golden Times", value: "Golden Times", url: "http://truyentuan.com/golden-times/" }, { label: "Rapaz Theme Park", value: "Rapaz Theme Park", url: "http://truyentuan.com/rapaz-theme-park/" }, { label: "REC - Silver Street Romantic", value: "REC - Silver Street Romantic", url: "http://truyentuan.com/rec/" }, { label: "Satanophany", value: "Satanophany", url: "http://truyentuan.com/satanophany/" }, { label: "Mujaki No Rakuen", value: "Mujaki No Rakuen", url: "http://truyentuan.com/mujaki-no-rakuen-2/" }, { label: "Tenshi na Konamaiki", value: "Tenshi na Konamaiki", url: "http://truyentuan.com/tenshi-na-konamaiki/" }, { label: "Mahou Shoujo of the End", value: "Mahou Shoujo of the End", url: "http://truyentuan.com/mahou-shoujo-of-the-end/" }, { label: "Liquor & Cigarette", value: "Liquor & Cigarette", url: "http://truyentuan.com/liquor-cigarette/" }, { label: "Osmotic Pressure", value: "Osmotic Pressure", url: "http://truyentuan.com/osmotic-pressure/" }, { label: "Forest of Drizzling Rain", value: "Forest of Drizzling Rain", url: "http://truyentuan.com/forest-of-drizzling-rain/" }, { label: "Zenryoku 'Otome'", value: "Zenryoku 'Otome'", url: "http://truyentuan.com/zenryoku-otome/" }, { label: "Luyện Ngục Trọng Sinh", value: "Luyện Ngục Trọng Sinh", url: "http://truyentuan.com/luyen-nguc-trong-sinh/" }, { label: "Chi no Wadachi", value: "Chi no Wadachi", url: "http://truyentuan.com/chi-no-wadachi/" }, { label: "Bamboo Blade", value: "Bamboo Blade", url: "http://truyentuan.com/bamboo-blade/" }, { label: "Kusumi-kun, Kuuki Yometemasu ka?", value: "Kusumi-kun, Kuuki Yometemasu ka?", url: "http://truyentuan.com/kusumi-kun-kuuki-yometemasu-ka/" }, { label: "Yuizaki-san ha Nageru!", value: "Yuizaki-san ha Nageru!", url: "http://truyentuan.com/yuizaki-san-ha-nageru/" }, { label: "Tuyệt Thế Võ Thần", value: "Tuyệt Thế Võ Thần", url: "http://truyentuan.com/tuyet-the-vo-than/" }, { label: "Futaba-san Chi no Kyoudai", value: "Futaba-san Chi no Kyoudai", url: "http://truyentuan.com/futaba-san-chi-no-kyoudai/" }, { label: "Hào Môn Đệ Nhất Thịnh Hôn", value: "Hào Môn Đệ Nhất Thịnh Hôn", url: "http://truyentuan.com/hao-mon-de-nhat-thinh-hon/" }, { label: "Kyou no Cerberus", value: "Kyou no Cerberus", url: "http://truyentuan.com/kyou-no-cerberus/" }, { label: "Elf-san wa Yaserarenai", value: "Elf-san wa Yaserarenai", url: "http://truyentuan.com/elf-san-wa-yaserarenai/" }, { label: "Fire Punch", value: "Fire Punch", url: "http://truyentuan.com/fire-punch/" }, { label: "Naa-tan to Goshujin-tama", value: "Naa-tan to Goshujin-tama", url: "http://truyentuan.com/naa-tan-to-goshujin-tama/" }, { label: "Yamikagishi", value: "Yamikagishi", url: "http://truyentuan.com/yamikagishi/" }, { label: "Otome Sensou", value: "Otome Sensou", url: "http://truyentuan.com/otome-sensou/" }, { label: "Long Phù Chi Vương Đạo Thiên Hạ", value: "Long Phù Chi Vương Đạo Thiên Hạ", url: "http://truyentuan.com/long-phu-chi-vuong-dao-thien-ha/" }, { label: "NGUYỆT THƯƠNG", value: "NGUYỆT THƯƠNG", url: "http://truyentuan.com/nguyet-thuong/" }, { label: "Ochitekita Ryuuou to Horobiyuku Majo no Kuni", value: "Ochitekita Ryuuou to Horobiyuku Majo no Kuni", url: "http://truyentuan.com/ochitekita-ryuuou-to-horobiyuku-majo-no-kuni/" }, { label: "Điều ước bên hồ tây", value: "Điều ước bên hồ tây", url: "http://truyentuan.com/dieu-uoc-ben-ho-tay/" }, { label: "Rebirth", value: "Rebirth", url: "http://truyentuan.com/rebirth/" }, { label: "Starting Gate - Horsegirl Pretty Derby", value: "Starting Gate - Horsegirl Pretty Derby", url: "http://truyentuan.com/starting-gate-horsegirl-pretty-derby/" }, { label: "Yuuutsu to Succubus-san", value: "Yuuutsu to Succubus-san", url: "http://truyentuan.com/yuuutsu-to-succubus-san/" }, { label: "Ứng dụng anh hùng", value: "Ứng dụng anh hùng", url: "http://truyentuan.com/ung-dung-anh-hung/" }, { label: "Super Secret", value: "Super Secret", url: "http://truyentuan.com/super-secret/" }, { label: "Satsuriku no Tenshi", value: "Satsuriku no Tenshi", url: "http://truyentuan.com/satsuriku-no-tenshi/" }, { label: "Itoshi No Muco", value: "Itoshi No Muco", url: "http://truyentuan.com/itoshi-no-muco/" }, { label: "Jyaryu Tensei", value: "Jyaryu Tensei", url: "http://truyentuan.com/jyaryu-tensei/" }, { label: "Saike Mata Shitemo", value: "Saike Mata Shitemo", url: "http://truyentuan.com/saike-mata-shitemo/" }, { label: "Mattaku Saikin no Tantei to Kitara", value: "Mattaku Saikin no Tantei to Kitara", url: "http://truyentuan.com/mattaku-saikin-no-tantei-to-kitara/" }, { label: "Sơn Hải Nghịch Chiến", value: "Sơn Hải Nghịch Chiến", url: "http://truyentuan.com/son-hai-nghich-chien/" }, { label: "Innocent Devil", value: "Innocent Devil", url: "http://truyentuan.com/innocent-devil/" }, { label: "Eto Royale", value: "Eto Royale", url: "http://truyentuan.com/eto-royale/" }, { label: "Ki ni Naru Mori-san", value: "Ki ni Naru Mori-san", url: "http://truyentuan.com/ki-ni-naru-mori-san/" }, { label: "Baby", value: "Baby", url: "http://truyentuan.com/baby/" }, { label: "Đại Khâu Giáp Sư", value: "Đại Khâu Giáp Sư", url: "http://truyentuan.com/dai-khau-giap-su/" }, { label: "Cao thủ cận vệ của hoa khôi", value: "Cao thủ cận vệ của hoa khôi", url: "http://truyentuan.com/cao-thu-can-ve-cua-hoa-khoi/" }, { label: "Thiên ngoại phi tiên", value: "Thiên ngoại phi tiên", url: "http://truyentuan.com/thien-ngoai-phi-tien/" }, { label: "Tây du tầm sư phục ma lục", value: "Tây du tầm sư phục ma lục", url: "http://truyentuan.com/tay-du-tam-su-phuc-ma-luc/" }, { label: "Tam quốc diễn nghĩa", value: "Tam quốc diễn nghĩa", url: "http://truyentuan.com/tam-quoc-dien-nghia/" }, { label: "Sozo no Eterunite", value: "Sozo no Eterunite", url: "http://truyentuan.com/sozo-no-eterunite/" }, { label: "Sozo no Eterunite", value: "Sozo no Eterunite", url: "http://truyentuan.com/sozo-no-eterunite-2/" }, { label: "Danh tướng nghịch thiên", value: "Danh tướng nghịch thiên", url: "http://truyentuan.com/danh-tuong-nghich-thien/" }, { label: "Plus Alpha no Tachiichi", value: "Plus Alpha no Tachiichi", url: "http://truyentuan.com/plus-alpha-no-tachiichi/" }, { label: "Futsumashi na Yome desu ga", value: "Futsumashi na Yome desu ga", url: "http://truyentuan.com/futsumashi-na-yome-desu-ga/" }, { label: "Hoàng Triều Quân Lâm", value: "Hoàng Triều Quân Lâm", url: "http://truyentuan.com/hoang-trieu-quan-lam/" }, { label: "Võ Thần Không Gian", value: "Võ Thần Không Gian", url: "http://truyentuan.com/vo-than-khong-gian/" }, { label: "Konya wa Tsuki ga Kirei Desu ga, Toriaezu Shi ne", value: "Konya wa Tsuki ga Kirei Desu ga, Toriaezu Shi ne", url: "http://truyentuan.com/konya-wa-tsuki-ga-kirei-desu-ga-toriaezu-shi-ne/" }, { label: "Nani mo Nai Kedo Sora wa Aoi", value: "Nani mo Nai Kedo Sora wa Aoi", url: "http://truyentuan.com/nani-mo-nai-kedo-sora-wa-aoi/" }, { label: "Áo Thuật Thần Tọa", value: "Áo Thuật Thần Tọa", url: "http://truyentuan.com/ao-thuat-than-toa/" }, { label: "Shiroi Majo", value: "Shiroi Majo", url: "http://truyentuan.com/shiroi-majo/" }, { label: "King of idols", value: "King of idols", url: "http://truyentuan.com/king-of-idols/" }, { label: "Narakunoadu", value: "Narakunoadu", url: "http://truyentuan.com/narakunoadu/" }, { label: "Bạn Trai Là Ngôi Sao", value: "Bạn Trai Là Ngôi Sao", url: "http://truyentuan.com/ban-trai-la-ngoi-sao/" }, { label: "Futaribocchi Sensou", value: "Futaribocchi Sensou", url: "http://truyentuan.com/futaribocchi-sensou/" }, { label: "Futaribocchi Sensou", value: "Futaribocchi Sensou", url: "http://truyentuan.com/futaribocchi-sensou-2/" }, { label: "Saikin Kono Sekai wa Watashi dake no Mono ni Narimashita......", value: "Saikin Kono Sekai wa Watashi dake no Mono ni Narimashita......", url: "http://truyentuan.com/saikin-kono-sekai-wa-watashi-dake-no-mono-ni-narimashita/" }, { label: "Samon-kun wa Summoner", value: "Samon-kun wa Summoner", url: "http://truyentuan.com/samon-kun-wa-summoner/" }, { label: "Diệu Thủ Tiên Đan", value: "Diệu Thủ Tiên Đan", url: "http://truyentuan.com/dieu-thu-tien-dan/" }, { label: "Maken No Daydreamer", value: "Maken No Daydreamer", url: "http://truyentuan.com/maken-no-daydreamer/" }, { label: "Dragon Ball Z & Onepunch-Man", value: "Dragon Ball Z & Onepunch-Man", url: "http://truyentuan.com/dragon-ball-z-onepunch-man/" }, { label: "Ragna Crimson", value: "Ragna Crimson", url: "http://truyentuan.com/ragna-crimson/" }, { label: "Henjo - Hen na Joshi Kousei Amaguri Chiko", value: "Henjo - Hen na Joshi Kousei Amaguri Chiko", url: "http://truyentuan.com/henjo-hen-na-joshi-kousei-amaguri-chiko/" }, { label: "Rokudou no Onna-tachi", value: "Rokudou no Onna-tachi", url: "http://truyentuan.com/rokudou-no-onna-tachi/" }, { label: "Imawa no Michi no Alice", value: "Imawa no Michi no Alice", url: "http://truyentuan.com/imawa-no-michi-no-alice/" }, { label: "Ore to Kawazu-san no Isekai Hourouki", value: "Ore to Kawazu-san no Isekai Hourouki", url: "http://truyentuan.com/ore-to-kawazu-san-no-isekai-hourouki/" }, { label: "Tales of Berseria", value: "Tales of Berseria", url: "http://truyentuan.com/tales-of-berseria/" }, { label: "Next Life", value: "Next Life", url: "http://truyentuan.com/next-life/" }, { label: "Kengan Ashua - Zero Atula", value: "Kengan Ashua - Zero Atula", url: "http://truyentuan.com/kengan-ashua-zero-atula/" }, { label: "6 Giờ Ký Ức", value: "6 Giờ Ký Ức", url: "http://truyentuan.com/6-gio-ky-uc/" }, { label: "Yêu Túc Sơn", value: "Yêu Túc Sơn", url: "http://truyentuan.com/yeu-tuc-son/" }, { label: "Bungou Stray Dogs Wan!", value: "Bungou Stray Dogs Wan!", url: "http://truyentuan.com/bungou-stray-dogs-wan/" }, { label: "Nhân Ngẫu Đế Quốc", value: "Nhân Ngẫu Đế Quốc", url: "http://truyentuan.com/nhan-ngau-de-quoc/" }, { label: "Thật khó để yêu một Otaku", value: "Thật khó để yêu một Otaku", url: "http://truyentuan.com/that-kho-de-yeu-mot-otaku/" }, { label: "Trọng Sinh Chi Hao Môn Cường Thế Quy Lai", value: "Trọng Sinh Chi Hao Môn Cường Thế Quy Lai", url: "http://truyentuan.com/trong-sinh-chi-hao-mon-cuong-the-quy-lai/" }, { label: "The Dragon Next Door - Hàng Xóm Của Tôi Là Rồng", value: "The Dragon Next Door - Hàng Xóm Của Tôi Là Rồng", url: "http://truyentuan.com/the-dragon-next-door-hang-xom-cua-toi-la-rong/" }, { label: "Shortcake Cake", value: "Shortcake Cake", url: "http://truyentuan.com/shortcake-cake/" }, { label: "Kine san no 1 ri de Cinema", value: "Kine san no 1 ri de Cinema", url: "http://truyentuan.com/kine-san-no-1-ri-de-cinema/" }, { label: "FPS - Trò chơi hỗn loạn", value: "FPS - Trò chơi hỗn loạn", url: "http://truyentuan.com/fps-tro-choi-hon-loan/" }, { label: "Sinh Tử Thư Kích", value: "Sinh Tử Thư Kích", url: "http://truyentuan.com/sinh-tu-thu-kich/" }, { label: "Terra Formars Gaiden - Asimov", value: "Terra Formars Gaiden - Asimov", url: "http://truyentuan.com/terra-formars-gaiden-asimov/" }, { label: "Ookami ni Kuchizuke", value: "Ookami ni Kuchizuke", url: "http://truyentuan.com/ookami-ni-kuchizuke/" }, { label: "Fukigen na Mononokean", value: "Fukigen na Mononokean", url: "http://truyentuan.com/fukigen-na-mononokean/" }, { label: "Đấu Chiến Ma", value: "Đấu Chiến Ma", url: "http://truyentuan.com/dau-chien-ma/" }, { label: "Shokuryou Jinrui", value: "Shokuryou Jinrui", url: "http://truyentuan.com/shokuryou-jinrui/" }, { label: "Assassin's Pride", value: "Assassin's Pride", url: "http://truyentuan.com/assassins-pride/" }, { label: "VERSUS THE EARTH", value: "VERSUS THE EARTH", url: "http://truyentuan.com/versus-the-earth/" }, { label: "Fate/Apocrypha", value: "Fate/Apocrypha", url: "http://truyentuan.com/fateapocrypha/" }, { label: "LV999 no Murabito", value: "LV999 no Murabito", url: "http://truyentuan.com/lv999-no-murabito/" }, { label: "Infinite Stratos: Black Bunny/White Bitter", value: "Infinite Stratos: Black Bunny/White Bitter", url: "http://truyentuan.com/infinite-stratos-black-bunnywhite-bitter/" }, { label: "Hakoniwa No Soleil", value: "Hakoniwa No Soleil", url: "http://truyentuan.com/hakoniwa-no-soleil/" }, { label: "Dạy Kèm Sau Giờ Học", value: "Dạy Kèm Sau Giờ Học", url: "http://truyentuan.com/day-kem-sau-gio-hoc/" }, { label: "Dokyuu Hentai HxEros", value: "Dokyuu Hentai HxEros", url: "http://truyentuan.com/dokyuu-hentai-hxeros/" }, { label: "Isekai Mahou wa Okureteru!", value: "Isekai Mahou wa Okureteru!", url: "http://truyentuan.com/isekai-mahou-wa-okureteru/" }, { label: "Sougou Tovarisch", value: "Sougou Tovarisch", url: "http://truyentuan.com/sougou-tovarisch/" }, { label: "Fight For Myself", value: "Fight For Myself", url: "http://truyentuan.com/fight-for-myself/" }, { label: "Suginami-ku Isekai Dungeon kouryaku-ka", value: "Suginami-ku Isekai Dungeon kouryaku-ka", url: "http://truyentuan.com/suginami-ku-isekai-dungeon-kouryaku-ka/" }, { label: "Hoshi to Kuzu", value: "Hoshi to Kuzu", url: "http://truyentuan.com/hoshi-to-kuzu/" }, { label: "Monkey Peak", value: "Monkey Peak", url: "http://truyentuan.com/monkey-peak/" }, { label: "Mahouka Koukou no Rettousei - Daburu Sebun Hen", value: "Mahouka Koukou no Rettousei - Daburu Sebun Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-daburu-sebun-hen/" }, { label: "Đại Ca Giang Hồ", value: "Đại Ca Giang Hồ", url: "http://truyentuan.com/dai-ca-giang-ho/" }, { label: "Xích Trụ Phạn Đường", value: "Xích Trụ Phạn Đường", url: "http://truyentuan.com/xich-tru-phan-duong/" }, { label: "Fulldrum", value: "Fulldrum", url: "http://truyentuan.com/fulldrum/" }, { label: "Kono Subarashii Sekai ni Bakuen wo!", value: "Kono Subarashii Sekai ni Bakuen wo!", url: "http://truyentuan.com/kono-subarashii-sekai-ni-bakuen-wo/" }, { label: "Thực Tập Sinh", value: "Thực Tập Sinh", url: "http://truyentuan.com/thuc-tap-sinh/" }, { label: "Ryle to Louis", value: "Ryle to Louis", url: "http://truyentuan.com/ryle-to-louis/" }, { label: "Kami to Yobareta Kyuuketsuki", value: "Kami to Yobareta Kyuuketsuki", url: "http://truyentuan.com/kami-to-yobareta-kyuuketsuki/" }, { label: "Sono Mono. Nochi ni", value: "Sono Mono. Nochi ni", url: "http://truyentuan.com/sono-mono-nochi-ni/" }, { label: "Tensei Shitara Suraimuda", value: "Tensei Shitara Suraimuda", url: "http://truyentuan.com/tensei-shitara-suraimuda/" }, { label: "Catulus Syndrome", value: "Catulus Syndrome", url: "http://truyentuan.com/catulus-syndrome/" }, { label: "S Watari-san to M Mura-kun", value: "S Watari-san to M Mura-kun", url: "http://truyentuan.com/s-watari-san-to-m-mura-kun/" }, { label: "Happy If You Died", value: "Happy If You Died", url: "http://truyentuan.com/happy-if-you-died/" }, { label: "Hinmin Choujin Kanenashi-kun", value: "Hinmin Choujin Kanenashi-kun", url: "http://truyentuan.com/hinmin-choujin-kanenashi-kun/" }, { label: "Ashita, Kimi ni Aetara", value: "Ashita, Kimi ni Aetara", url: "http://truyentuan.com/ashita-kimi-ni-aetara/" }, { label: "Girigiri Out", value: "Girigiri Out", url: "http://truyentuan.com/girigiri-out/" }, { label: "Osake wa Fuufu ni Natte Kara", value: "Osake wa Fuufu ni Natte Kara", url: "http://truyentuan.com/osake-wa-fuufu-ni-natte-kara/" }, { label: "Huyền Vũ Luyến Ca: Vạn Vật Sinh Linh", value: "Huyền Vũ Luyến Ca: Vạn Vật Sinh Linh", url: "http://truyentuan.com/huyen-vu-luyen-ca-van-vat-sinh-linh/" }, { label: "Ao no Flag", value: "Ao no Flag", url: "http://truyentuan.com/ao-no-flag/" }, { label: "Isekai wa Smartphone to Tomoni", value: "Isekai wa Smartphone to Tomoni", url: "http://truyentuan.com/isekai-wa-smartphone-to-tomoni/" }, { label: "S Rare Soubi no Niau Kanojo", value: "S Rare Soubi no Niau Kanojo", url: "http://truyentuan.com/s-rare-soubi-no-niau-kanojo/" }, { label: "Toàn Cơ Tử", value: "Toàn Cơ Tử", url: "http://truyentuan.com/toan-co-tu/" }, { label: "Mahouka Koukou no Rettousei - Kyuukousen Hen", value: "Mahouka Koukou no Rettousei - Kyuukousen Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-kyuukousen-hen/" }, { label: "Magan & Danai", value: "Magan & Danai", url: "http://truyentuan.com/magan-danai/" }, { label: "Kokukoku", value: "Kokukoku", url: "http://truyentuan.com/kokukoku/" }, { label: "Hoenkan Evans no Uso", value: "Hoenkan Evans no Uso", url: "http://truyentuan.com/hoenkan-evans-no-uso/" }, { label: "Devilchi", value: "Devilchi", url: "http://truyentuan.com/devilchi/" }, { label: "Tam Sinh Tam Thế - Thập Lý Đào Hoa", value: "Tam Sinh Tam Thế - Thập Lý Đào Hoa", url: "http://truyentuan.com/tam-sinh-tam-the-thap-ly-dao-hoa/" }, { label: "Tensei Shitara Kendeshita", value: "Tensei Shitara Kendeshita", url: "http://truyentuan.com/tensei-shitara-kendeshita/" }, { label: "Soul Catcher(S)", value: "Soul Catcher(S)", url: "http://truyentuan.com/soul-catchers/" }, { label: "Ayakashiko", value: "Ayakashiko", url: "http://truyentuan.com/ayakashiko-2/" }, { label: "Goblin Wa Mou Juubun Ni Tsuyoi", value: "Goblin Wa Mou Juubun Ni Tsuyoi", url: "http://truyentuan.com/goblin-wa-mou-juubun-ni-tsuyoi/" }, { label: "Mahouka Koukou No Rettousei - Tsuioku Hen", value: "Mahouka Koukou No Rettousei - Tsuioku Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-tsuioku-hen/" }, { label: "Murabito Desu Ga Nani Ka?", value: "Murabito Desu Ga Nani Ka?", url: "http://truyentuan.com/murabito-desu-ga-nani-ka/" }, { label: "Ookumo-chan Flashback", value: "Ookumo-chan Flashback", url: "http://truyentuan.com/ookumo-chan-flashback/" }, { label: "Made in Abyss", value: "Made in Abyss", url: "http://truyentuan.com/made-in-abyss/" }, { label: "Rental Onii-chan", value: "Rental Onii-chan", url: "http://truyentuan.com/rental-onii-chan/" }, { label: "Yuzumori-san", value: "Yuzumori-san", url: "http://truyentuan.com/yuzumori-san/" }, { label: "Gặp Em Trong Tương Lai", value: "Gặp Em Trong Tương Lai", url: "http://truyentuan.com/gap-em-trong-tuong-lai/" }, { label: "Komatsubara ga Koibito ni Naritasou ni Kochira o Miteiru!", value: "Komatsubara ga Koibito ni Naritasou ni Kochira o Miteiru!", url: "http://truyentuan.com/komatsubara-ga-koibito-ni-naritasou-ni-kochira-o-miteiru-2/" }, { label: "Atsumare! Fushigi Kenkyuubu", value: "Atsumare! Fushigi Kenkyuubu", url: "http://truyentuan.com/atsumare-fushigi-kenkyuubu/" }, { label: "Going in the Wrong Direction", value: "Going in the Wrong Direction", url: "http://truyentuan.com/going-in-the-wrong-direction/" }, { label: "Bocchiman", value: "Bocchiman", url: "http://truyentuan.com/bocchiman/" }, { label: "Kyo Kara Zombie", value: "Kyo Kara Zombie", url: "http://truyentuan.com/kyo-kara-zombie/" }, { label: "Shingeki No Kyojin - Lost Girls", value: "Shingeki No Kyojin - Lost Girls", url: "http://truyentuan.com/shingeki-no-kyojin-lost-girls/" }, { label: "Tsumi Koi", value: "Tsumi Koi", url: "http://truyentuan.com/tsumi-koi/" }, { label: "Genjitsushugisha no Oukokukaizouki", value: "Genjitsushugisha no Oukokukaizouki", url: "http://truyentuan.com/genjitsushugisha-no-oukokukaizouki/" }, { label: "Isekai Meikyuu de Harem o", value: "Isekai Meikyuu de Harem o", url: "http://truyentuan.com/isekai-meikyuu-de-harem-o/" }, { label: "Munou na Nana", value: "Munou na Nana", url: "http://truyentuan.com/munou-na-nana/" }, { label: "SOMALI TO MORI NO KAMI-SAMA", value: "SOMALI TO MORI NO KAMI-SAMA", url: "http://truyentuan.com/somali-to-mori-no-kami-sama/" }, { label: "Kimi no Suizou wo Tabetai", value: "Kimi no Suizou wo Tabetai", url: "http://truyentuan.com/kimi-no-suizou-wo-tabetai/" }, { label: "Seigi no Mikata", value: "Seigi no Mikata", url: "http://truyentuan.com/seigi-no-mikata/" }, { label: "Killer meet girl", value: "Killer meet girl", url: "http://truyentuan.com/killer-meet-girl/" }, { label: "Spirit Circle", value: "Spirit Circle", url: "http://truyentuan.com/spirit-circle/" }, { label: "Mei no Maiden", value: "Mei no Maiden", url: "http://truyentuan.com/mei-no-maiden/" }, { label: "Ryuuou no Oshigoto!", value: "Ryuuou no Oshigoto!", url: "http://truyentuan.com/ryuuou-no-oshigoto/" }, { label: "Isekai Yakkyoku", value: "Isekai Yakkyoku", url: "http://truyentuan.com/isekai-yakkyoku/" }, { label: "Seifuku no Vampireslod", value: "Seifuku no Vampireslod", url: "http://truyentuan.com/seifuku-no-vampireslod/" }, { label: "ALMADIANOS EIYUUDEN", value: "ALMADIANOS EIYUUDEN", url: "http://truyentuan.com/almadianos-eiyuuden/" }, { label: "Coulomb File", value: "Coulomb File", url: "http://truyentuan.com/coulomb-file/" }, { label: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e", value: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e", url: "http://truyentuan.com/youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e/" }, { label: "Sayonara Ryuusei, Konnichiwa Jinsei", value: "Sayonara Ryuusei, Konnichiwa Jinsei", url: "http://truyentuan.com/sayonara-ryuusei-konnichiwa-jinsei/" }, { label: "Futsuu no Koiko-chan", value: "Futsuu no Koiko-chan", url: "http://truyentuan.com/futsuu-no-koiko-chan/" }, { label: "Raisekamika", value: "Raisekamika", url: "http://truyentuan.com/raisekamika/" }, { label: "Tui là Busamen!", value: "Tui là Busamen!", url: "http://truyentuan.com/tui-la-busamen/" }, { label: "Ane no Onaka o Fukuramaseru wa Boku", value: "Ane no Onaka o Fukuramaseru wa Boku", url: "http://truyentuan.com/ane-no-onaka-o-fukuramaseru-wa-boku/" }, { label: "Cô bạn ác quỷ - Devilchi", value: "Cô bạn ác quỷ - Devilchi", url: "http://truyentuan.com/co-ban-ac-quy-devilchi/" }, { label: "Isekai wo Seigyo Mahou de Kirihirake", value: "Isekai wo Seigyo Mahou de Kirihirake", url: "http://truyentuan.com/isekai-wo-seigyo-mahou-de-kirihirake/" }, { label: "ACCA: Jusan-ku Kansatsu-ka", value: "ACCA: Jusan-ku Kansatsu-ka", url: "http://truyentuan.com/acca-jusan-ku-kansatsu-ka/" }, { label: "TONDEMO SKILL DE ISEKAI HOUROU MESHI", value: "TONDEMO SKILL DE ISEKAI HOUROU MESHI", url: "http://truyentuan.com/tondemo-skill-de-isekai-hourou-meshi/" }, { label: "Gaishuu Isshoku", value: "Gaishuu Isshoku", url: "http://truyentuan.com/gaishuu-isshoku/" }, { label: "Moee-chan wa Ki ni Shinai", value: "Moee-chan wa Ki ni Shinai", url: "http://truyentuan.com/moee-chan-wa-ki-ni-shinai/" }, { label: "Dennou Kakugi Mephisto Waltz", value: "Dennou Kakugi Mephisto Waltz", url: "http://truyentuan.com/dennou-kakugi-mephisto-waltz/" }, { label: "Tỏa Long", value: "Tỏa Long", url: "http://truyentuan.com/toa-long/" }, { label: "Shunkan Gradation", value: "Shunkan Gradation", url: "http://truyentuan.com/shunkan-gradation/" }, { label: "Ubau Mono Ubawareru Mono", value: "Ubau Mono Ubawareru Mono", url: "http://truyentuan.com/ubau-mono-ubawareru-mono/" }, { label: "Isekai Onsen ni Tensei shita Ore no Kounou ga Tondemosugiru", value: "Isekai Onsen ni Tensei shita Ore no Kounou ga Tondemosugiru", url: "http://truyentuan.com/isekai-onsen-ni-tensei-shita-ore-no-kounou-ga-tondemosugiru/" }, { label: "JOJO’S BIZARRE ADVENTURE PART 7: Steel Ball Run", value: "JOJO’S BIZARRE ADVENTURE PART 7: Steel Ball Run", url: "http://truyentuan.com/jojos-bizarre-adventure-part-7-steel-ball-run/" }, { label: "KOBAYASHI-SAN CHI NO MAID DRAGON: KANNA NO NICHIJOU", value: "KOBAYASHI-SAN CHI NO MAID DRAGON: KANNA NO NICHIJOU", url: "http://truyentuan.com/kobayashi-san-chi-no-maid-dragon-kanna-no-nichijou/" }, { label: "Hoshikuzu no Sorakil", value: "Hoshikuzu no Sorakil", url: "http://truyentuan.com/hoshikuzu-no-sorakil/" }, { label: "YANKEE WA ISEKAI DE SEIREI NI AISAREMASU", value: "YANKEE WA ISEKAI DE SEIREI NI AISAREMASU", url: "http://truyentuan.com/yankee-wa-isekai-de-seirei-ni-aisaremasu/" }, { label: "Baby, Kokoro no Mama ni!", value: "Baby, Kokoro no Mama ni!", url: "http://truyentuan.com/baby-kokoro-no-mama-ni/" }, { label: "Chuuko demo Koi ga Shitai!", value: "Chuuko demo Koi ga Shitai!", url: "http://truyentuan.com/chuuko-demo-koi-ga-shitai/" }, { label: "YUUSHA NO MAGO TO MAOU NO MUSUME", value: "YUUSHA NO MAGO TO MAOU NO MUSUME", url: "http://truyentuan.com/yuusha-no-mago-to-maou-no-musume/" }, { label: "Tenshou no Quadrable", value: "Tenshou no Quadrable", url: "http://truyentuan.com/tenshou-no-quadrable/" }, { label: "YASEI NO LAST BOSS GA ARAWARETA", value: "YASEI NO LAST BOSS GA ARAWARETA", url: "http://truyentuan.com/yasei-no-last-boss-ga-arawareta/" }, { label: "Devil's Line", value: "Devil's Line", url: "http://truyentuan.com/devils-line/" }, { label: "Aku no Meshitsukai", value: "Aku no Meshitsukai", url: "http://truyentuan.com/aku-no-meshitsukai/" }, { label: "THE WRONG WAY TO USE HEALING MAGIC", value: "THE WRONG WAY TO USE HEALING MAGIC", url: "http://truyentuan.com/the-wrong-way-to-use-healing-magic/" }, { label: "Aposimz", value: "Aposimz", url: "http://truyentuan.com/aposimz/" }, { label: "Miracle! Hero-nim", value: "Miracle! Hero-nim", url: "http://truyentuan.com/miracle-hero-nim/" }, { label: "Jigoku no Enra", value: "Jigoku no Enra", url: "http://truyentuan.com/jigoku-no-enra/" }, { label: "Youkai Apartment no Yuuga na Nichijou", value: "Youkai Apartment no Yuuga na Nichijou", url: "http://truyentuan.com/youkai-apartment-no-yuuga-na-nichijou/" }, { label: "Nijiiro Secret", value: "Nijiiro Secret", url: "http://truyentuan.com/nijiiro-secret/" }, { label: "Black Lily to White Yuri", value: "Black Lily to White Yuri", url: "http://truyentuan.com/black-lily-to-white-yuri/" }, { label: "P to JK", value: "P to JK", url: "http://truyentuan.com/p-to-jk/" }, { label: "Misumaruka Koukoku Monogatari", value: "Misumaruka Koukoku Monogatari", url: "http://truyentuan.com/misumaruka-koukoku-monogatari/" }, { label: "Koi to Untatane", value: "Koi to Untatane", url: "http://truyentuan.com/koi-to-untatane/" }, { label: "Saikyou Mahoushi no Inton Keikaku", value: "Saikyou Mahoushi no Inton Keikaku", url: "http://truyentuan.com/saikyou-mahoushi-no-inton-keikaku/" }, { label: "Tenseishichatta yo (Iya, Gomen)", value: "Tenseishichatta yo (Iya, Gomen)", url: "http://truyentuan.com/tenseishichatta-yo-iya-gomen/" }, { label: "Tenseishichatta yo", value: "Tenseishichatta yo", url: "http://truyentuan.com/tenseishichatta-yo/" }, { label: "Battle Mexia", value: "Battle Mexia", url: "http://truyentuan.com/battle-mexia/" }, { label: "Shitei Bouryoku Shoujo Shiomi-chan", value: "Shitei Bouryoku Shoujo Shiomi-chan", url: "http://truyentuan.com/shitei-bouryoku-shoujo-shiomi-chan/" }, { label: "Sekai ka Kanojo ka Erabenai", value: "Sekai ka Kanojo ka Erabenai", url: "http://truyentuan.com/sekai-ka-kanojo-ka-erabenai/" }, { label: "Marry Me!", value: "Marry Me!", url: "http://truyentuan.com/marry-me/" }, { label: "Vô Gián Ngục", value: "Vô Gián Ngục", url: "http://truyentuan.com/vo-gian-nguc/" }, { label: "Soushi Souai", value: "Soushi Souai", url: "http://truyentuan.com/soushi-souai/" }, { label: "Mairimashita, senpai!", value: "Mairimashita, senpai!", url: "http://truyentuan.com/mairimashita-senpai/" }, { label: "Taisho Wotome Otogibanashi Taisho Wotome Otogibanashi", value: "Taisho Wotome Otogibanashi Taisho Wotome Otogibanashi", url: "http://truyentuan.com/taisho-wotome-otogibanashi-taisho-wotome-otogibanashi/" }, { label: "Anitomo", value: "Anitomo", url: "http://truyentuan.com/anitomo/" }, { label: "Densetsu no Yuusha no Konkatsu", value: "Densetsu no Yuusha no Konkatsu", url: "http://truyentuan.com/densetsu-no-yuusha-no-konkatsu/" }, { label: "Chuyến hành trình tươi đẹp của Kino", value: "Chuyến hành trình tươi đẹp của Kino", url: "http://truyentuan.com/chuyen-hanh-trinh-tuoi-dep-cua-kino/" }, { label: "Met My Sister on a Dating site", value: "Met My Sister on a Dating site", url: "http://truyentuan.com/met-my-sister-on-a-dating-site/" }, { label: "Ecstas Online", value: "Ecstas Online", url: "http://truyentuan.com/ecstas-online/" }, { label: "Sayonara Piano Sonata", value: "Sayonara Piano Sonata", url: "http://truyentuan.com/sayonara-piano-sonata/" }, { label: "Hỏa Hồng Niên Đại Hắc Cốt Đường", value: "Hỏa Hồng Niên Đại Hắc Cốt Đường", url: "http://truyentuan.com/hoa-hong-nien-dai-hac-cot-duong/" }, { label: "FGO Doujinshi - Chiến Trường Bữa Tối Tuyệt Đối - Altria -", value: "FGO Doujinshi - Chiến Trường Bữa Tối Tuyệt Đối - Altria -", url: "http://truyentuan.com/zettai-gohan-sensen-artoria/" }, { label: "Ichigo 100% - East Side Story", value: "Ichigo 100% - East Side Story", url: "http://truyentuan.com/ichigo-100-east-side-story/" }, { label: "Watashi Wa Tensai O Katte Iru", value: "Watashi Wa Tensai O Katte Iru", url: "http://truyentuan.com/watashi-wa-tensai-o-katte-iru/" }, { label: "Isekai Cheat Magician", value: "Isekai Cheat Magician", url: "http://truyentuan.com/isekai-cheat-magician/" }, { label: "Historie", value: "Historie", url: "http://truyentuan.com/historie/" }, { label: "Buddy go!", value: "Buddy go!", url: "http://truyentuan.com/buddy-go/" }, { label: "Sword Art Online: Aincrad Night of Kirito", value: "Sword Art Online: Aincrad Night of Kirito", url: "http://truyentuan.com/sword-art-online-aincrad-night-of-kirito/" }, { label: "Hào Môn Thiên Giới Tiền Thê", value: "Hào Môn Thiên Giới Tiền Thê", url: "http://truyentuan.com/hao-mon-thien-gioi-tien-the/" }, { label: "Nonbiri VRMMOki", value: "Nonbiri VRMMOki", url: "http://truyentuan.com/nonbiri-vrmmoki/" }, { label: "Curse Blood", value: "Curse Blood", url: "http://truyentuan.com/curse-blood/" }, { label: "Champions", value: "Champions", url: "http://truyentuan.com/champions/" }, { label: "Absolute Duo", value: "Absolute Duo", url: "http://truyentuan.com/absolute-duo/" }, { label: "Xuyên không với chế độ GodMode", value: "Xuyên không với chế độ GodMode", url: "http://truyentuan.com/xuyen-khong-voi-che-do-godmode/" }, { label: "Wonderland", value: "Wonderland", url: "http://truyentuan.com/wonderland-2/" }, { label: "Hinowa ga Yuku!", value: "Hinowa ga Yuku!", url: "http://truyentuan.com/hinowa-ga-yuku/" }, { label: "Kanojo ni Naru Hi", value: "Kanojo ni Naru Hi", url: "http://truyentuan.com/kanojo-ni-naru-hi/" }, { label: "Huyền Giới Chi Môn", value: "Huyền Giới Chi Môn", url: "http://truyentuan.com/huyen-gioi-chi-mon/" }, { label: "Đấu Phá Thương Khung Tiền Truyện - Dược Lão Truyền Kỳ", value: "Đấu Phá Thương Khung Tiền Truyện - Dược Lão Truyền Kỳ", url: "http://truyentuan.com/dau-pha-thuong-khung-tien-truyen-duoc-lao-truyen-ky/" }, { label: "Đấu phá thương khung Ngoại Truyện - Dược Lão Truyền Kỳ Season 2", value: "Đấu phá thương khung Ngoại Truyện - Dược Lão Truyền Kỳ Season 2", url: "http://truyentuan.com/dau-pha-thuong-khung-ngoai-truyen-duoc-lao-truyen-ky-season-2/" }, { label: "Naka no Hito Genome [Jikkyouchuu]", value: "Naka no Hito Genome [Jikkyouchuu]", url: "http://truyentuan.com/naka-no-hito-genome-jikkyouchuu/" }, { label: "ACCA - Cục Thanh Tra 13 Bang", value: "ACCA - Cục Thanh Tra 13 Bang", url: "http://truyentuan.com/acca-cuc-thanh-tra-13-bang/" }, { label: "Anayashi", value: "Anayashi", url: "http://truyentuan.com/anayashi/" }, { label: "Danh Môn Thiên Hậu", value: "Danh Môn Thiên Hậu", url: "http://truyentuan.com/danh-mon-thien-hau/" }, { label: "Kimi to Wonderland", value: "Kimi to Wonderland", url: "http://truyentuan.com/kimi-to-wonderland/" }, { label: "Ikenie Touhyou", value: "Ikenie Touhyou", url: "http://truyentuan.com/ikenie-touhyou/" }, { label: "Mayonaka no Stellarium", value: "Mayonaka no Stellarium", url: "http://truyentuan.com/mayonaka-no-stellarium/" }, { label: "Tsuiraku Jk To Haijin Kyoushi", value: "Tsuiraku Jk To Haijin Kyoushi", url: "http://truyentuan.com/tsuiraku-jk-to-haijin-kyoushi/" }, { label: "Arifureta Shokugyou de Sekai Saikyou", value: "Arifureta Shokugyou de Sekai Saikyou", url: "http://truyentuan.com/arifureta-shokugyou-de-sekai-saikyou/" }, { label: "Thịnh Thế An Nhiên", value: "Thịnh Thế An Nhiên", url: "http://truyentuan.com/thinh-the-an-nhien/" }, { label: "Fate/Grand Order-mortalis:stella", value: "Fate/Grand Order-mortalis:stella", url: "http://truyentuan.com/fategrand-order-mortalisstella/" }, { label: "Cold Moon Chronicles -Biên niên sử lãnh nguyệt", value: "Cold Moon Chronicles -Biên niên sử lãnh nguyệt", url: "http://truyentuan.com/cold-moon-chronicles-bien-nien-su-lanh-nguyet/" }, { label: "Hitorijime Chokyo Ganbo", value: "Hitorijime Chokyo Ganbo", url: "http://truyentuan.com/hitorijime-chokyo-ganbo/" }, { label: "Ikusa x Koi", value: "Ikusa x Koi", url: "http://truyentuan.com/ikusa-x-koi/" }, { label: "Cửu Tinh Thiên Thần Quyết", value: "Cửu Tinh Thiên Thần Quyết", url: "http://truyentuan.com/cuu-tinh-thien-than-quyet/" }, { label: "Huyền Hạo Chiến Kí", value: "Huyền Hạo Chiến Kí", url: "http://truyentuan.com/huyen-hao-chien-ki/" }, { label: "Gaikotsu kishi-sama, tadaima isekai e o dekake-chuu", value: "Gaikotsu kishi-sama, tadaima isekai e o dekake-chuu", url: "http://truyentuan.com/gaikotsu-kishi-sama-tadaima-isekai-e-o-dekake-chuu/" }, { label: "Sakura to Sensei", value: "Sakura to Sensei", url: "http://truyentuan.com/sakura-to-sensei/" }, { label: "Rurouni Kenshin Hokkai Arc", value: "Rurouni Kenshin Hokkai Arc", url: "http://truyentuan.com/rurouni-kenshin-hokkai-arc/" }, { label: "Violence Action", value: "Violence Action", url: "http://truyentuan.com/violence-action/" }, { label: "Hakase no Kimagure Homunculus", value: "Hakase no Kimagure Homunculus", url: "http://truyentuan.com/hakase-no-kimagure-homunculus/" }, { label: "Fate/Grand Order -turas realta-", value: "Fate/Grand Order -turas realta-", url: "http://truyentuan.com/fategrand-order-turas-realta/" }, { label: "Rengoku ni Warau", value: "Rengoku ni Warau", url: "http://truyentuan.com/rengoku-ni-warau/" }, { label: "Migiko Nippon ichi", value: "Migiko Nippon ichi", url: "http://truyentuan.com/migiko-nippon-ichi/" }, { label: "Gakuen Rule Kaikaku", value: "Gakuen Rule Kaikaku", url: "http://truyentuan.com/gakuen-rule-kaikaku/" }, { label: "Trọng Sinh Chi Tinh Quang Thôi Xán", value: "Trọng Sinh Chi Tinh Quang Thôi Xán", url: "http://truyentuan.com/trong-sinh-chi-tinh-quang-thoi-xan/" }, { label: "Ma Cà Rồng, lập tức đi đời", value: "Ma Cà Rồng, lập tức đi đời", url: "http://truyentuan.com/ma-ca-rong-lap-tuc-di-doi/" }, { label: "HIGH&LOW G-SWORD", value: "HIGH&LOW G-SWORD", url: "http://truyentuan.com/highlow-g-sword/" }, { label: "Tạp Đồ", value: "Tạp Đồ", url: "http://truyentuan.com/tap-do/" }, { label: "Kanojo, Okarishimasu", value: "Kanojo, Okarishimasu", url: "http://truyentuan.com/kanojo-okarishimasu/" }, { label: "Uchiage Hanabi, Shita Kara Miru Ka? Yoko Kara Miru Ka?", value: "Uchiage Hanabi, Shita Kara Miru Ka? Yoko Kara Miru Ka?", url: "http://truyentuan.com/uchiage-hanabi-shita-kara-miru-ka-yoko-kara-miru-ka/" }, { label: "Gunner", value: "Gunner", url: "http://truyentuan.com/gunner/" }, { label: "Owari no Seraph: Ichinose Guren, Sự diệt vong năm 16 tuổi", value: "Owari no Seraph: Ichinose Guren, Sự diệt vong năm 16 tuổi", url: "http://truyentuan.com/owari-no-seraph-ichinose-guren-su-diet-vong-nam-16-tuoi/" }, { label: "neko musume michikusa nikki", value: "neko musume michikusa nikki", url: "http://truyentuan.com/neko-musume-michikusa-nikki/" }, { label: "Otome Danshi ni Koisuru Otome", value: "Otome Danshi ni Koisuru Otome", url: "http://truyentuan.com/otome-danshi-ni-koisuru-otome/" }, { label: "Neet-chan", value: "Neet-chan", url: "http://truyentuan.com/neet-chan/" }, { label: "Daidai wa, Hantoumei ni Nidone suru", value: "Daidai wa, Hantoumei ni Nidone suru", url: "http://truyentuan.com/daidai-wa-hantoumei-ni-nidone-suru/" }, { label: "Mật Mã Không Xác Định", value: "Mật Mã Không Xác Định", url: "http://truyentuan.com/mat-ma-khong-xac-dinh/" }, { label: "Moujuusei Shounen Shoujo", value: "Moujuusei Shounen Shoujo", url: "http://truyentuan.com/moujuusei-shounen-shoujo/" }, { label: "Lời Nguyền Lâu Lan : Bạo Quân Hung Ác Sủng Ái Ta", value: "Lời Nguyền Lâu Lan : Bạo Quân Hung Ác Sủng Ái Ta", url: "http://truyentuan.com/loi-nguyen-lau-lan-bao-quan-hung-ac-sung-ai-ta/" }, { label: "Chotto Ippai!", value: "Chotto Ippai!", url: "http://truyentuan.com/chotto-ippai/" }, { label: "Kimi ga Shinu Natsu ni", value: "Kimi ga Shinu Natsu ni", url: "http://truyentuan.com/kimi-ga-shinu-natsu-ni/" }, { label: "Hakata-ben no Onnanoko wa Kawaii to Omoimasen ka?", value: "Hakata-ben no Onnanoko wa Kawaii to Omoimasen ka?", url: "http://truyentuan.com/hakata-ben-no-onnanoko-wa-kawaii-to-omoimasen-ka/" }, { label: "Hồ Sơ của Lord El-Melloi II", value: "Hồ Sơ của Lord El-Melloi II", url: "http://truyentuan.com/ho-so-cua-lord-el-melloi-ii/" }, { label: "Higurashi no Naku Koro ni - Onikakushi Hen", value: "Higurashi no Naku Koro ni - Onikakushi Hen", url: "http://truyentuan.com/higurashi-no-naku-koro-ni-onikakushi-hen/" }, { label: "Tây Du Ký Ngoại Truyện", value: "Tây Du Ký Ngoại Truyện", url: "http://truyentuan.com/tay-du-ky-ngoai-truyen/" }, { label: "Nejimaki Seirei Senki - Tenkyou no Alderamin", value: "Nejimaki Seirei Senki - Tenkyou no Alderamin", url: "http://truyentuan.com/nejimaki-seirei-senki-tenkyou-no-alderamin/" }, { label: "Túc Tội Chi Ca", value: "Túc Tội Chi Ca", url: "http://truyentuan.com/tuc-toi-chi-ca/" }, { label: "Tensei Shitara Slime Datta Ken: Mabutsu no Kuni no Arukikata", value: "Tensei Shitara Slime Datta Ken: Mabutsu no Kuni no Arukikata", url: "http://truyentuan.com/tensei-shitara-slime-datta-ken-mabutsu-no-kuni-no-arukikata/" }, { label: "Cross Account", value: "Cross Account", url: "http://truyentuan.com/cross-account/" }, { label: "SLOW MOTION WO MOU ICHIDO", value: "SLOW MOTION WO MOU ICHIDO", url: "http://truyentuan.com/slow-motion-wo-mou-ichido/" }, { label: "Shin Seiki Evangelion", value: "Shin Seiki Evangelion", url: "http://truyentuan.com/shin-seiki-evangelion/" }, { label: "Bạch Môn Ngũ Giáp", value: "Bạch Môn Ngũ Giáp", url: "http://truyentuan.com/bach-mon-ngu-giap/" }, { label: "Dungeon Seeker", value: "Dungeon Seeker", url: "http://truyentuan.com/dungeon-seeker/" }, { label: "Yugioh Arc V", value: "Yugioh Arc V", url: "http://truyentuan.com/yugioh-arc-v/" }, { label: "Truyền Nhân Atula Phần 3", value: "Truyền Nhân Atula Phần 3", url: "http://truyentuan.com/truyen-nhan-atula-phan-3/" }, { label: "Iroha to Boku to", value: "Iroha to Boku to", url: "http://truyentuan.com/iroha-to-boku-to/" }, { label: "Harapeko no Marie", value: "Harapeko no Marie", url: "http://truyentuan.com/harapeko-no-marie/" }, { label: "Chihaya-san Wa Sono Mama De Ii", value: "Chihaya-san Wa Sono Mama De Ii", url: "http://truyentuan.com/chihaya-san-wa-sono-mama-de-ii/" }, { label: "Tuyết Ưng Lĩnh Chủ", value: "Tuyết Ưng Lĩnh Chủ", url: "http://truyentuan.com/tuyet-ung-linh-chu/" }, { label: "Akame ga KILL! ZERO", value: "Akame ga KILL! ZERO", url: "http://truyentuan.com/akame-ga-kill-zero/" }, { label: "AT LEAST, LIKE THAT SNOW", value: "AT LEAST, LIKE THAT SNOW", url: "http://truyentuan.com/at-least-like-that-snow/" }, { label: "Soukai no eve", value: "Soukai no eve", url: "http://truyentuan.com/soukai-no-eve/" }, { label: "Nano List", value: "Nano List", url: "http://truyentuan.com/nano-list/" }, { label: "Comic Studio", value: "Comic Studio", url: "http://truyentuan.com/comic-studio/" }, { label: "Magnet na Watashitachi", value: "Magnet na Watashitachi", url: "http://truyentuan.com/magnet-na-watashitachi/" }, { label: "Zipang", value: "Zipang", url: "http://truyentuan.com/zipang/" }, { label: "Tama-chen!!", value: "Tama-chen!!", url: "http://truyentuan.com/tama-chen/" }, { label: "Võ Thần Chúa Tể", value: "Võ Thần Chúa Tể", url: "http://truyentuan.com/vo-than-chua-te/" }, { label: "Shoujo shuumatsu ryokou", value: "Shoujo shuumatsu ryokou", url: "http://truyentuan.com/shoujo-shuumatsu-ryokou/" }, { label: "Vĩnh Hằng Chí Tôn", value: "Vĩnh Hằng Chí Tôn", url: "http://truyentuan.com/vinh-hang-chi-ton/" }, { label: "Linh Kiếm Tôn", value: "Linh Kiếm Tôn", url: "http://truyentuan.com/linh-kiem-ton/" }, { label: "Cuồng Thần", value: "Cuồng Thần", url: "http://truyentuan.com/cuong-than/" }, { label: "Houseki no Kuni", value: "Houseki no Kuni", url: "http://truyentuan.com/houseki-no-kuni/" }, { label: "Cực Phẩm Tu Chân Thiếu Niên", value: "Cực Phẩm Tu Chân Thiếu Niên", url: "http://truyentuan.com/cuc-pham-tu-chan-thieu-nien/" }, { label: "Thiên Thanh", value: "Thiên Thanh", url: "http://truyentuan.com/thien-thanh/" }, { label: "Linh Võ Đế Tôn", value: "Linh Võ Đế Tôn", url: "http://truyentuan.com/linh-vo-de-ton/" }, { label: "Ngự Niệm Sư", value: "Ngự Niệm Sư", url: "http://truyentuan.com/ngu-niem-su/" }, { label: "The End of Elysion", value: "The End of Elysion", url: "http://truyentuan.com/the-end-of-elysion/" }, { label: "Tiếu Ngạo Giang Hồ - Màu", value: "Tiếu Ngạo Giang Hồ - Màu", url: "http://truyentuan.com/tieu-ngao-giang-ho-mau/" }, { label: "Shirogane no Nina", value: "Shirogane no Nina", url: "http://truyentuan.com/shirogane-no-nina/" }, { label: "Ichinensei ni Nacchattara", value: "Ichinensei ni Nacchattara", url: "http://truyentuan.com/ichinensei-ni-nacchattara/" }, { label: "Boku Dake Shitteru Ichinomiya-san", value: "Boku Dake Shitteru Ichinomiya-san", url: "http://truyentuan.com/boku-dake-shitteru-ichinomiya-san/" }, { label: "Thành Phố Phù Thủy", value: "Thành Phố Phù Thủy", url: "http://truyentuan.com/thanh-pho-phu-thuy/" }, { label: "Bokutachi wa benkyou ga dekinai", value: "Bokutachi wa benkyou ga dekinai", url: "http://truyentuan.com/bokutachi-wa-benkyou-ga-dekinai/" }, { label: "Sasaki to Miyano", value: "Sasaki to Miyano", url: "http://truyentuan.com/sasaki-to-miyano/" }, { label: "Cạm bẫy của nữ thần", value: "Cạm bẫy của nữ thần", url: "http://truyentuan.com/cam-bay-cua-nu-than/" }, { label: "ISEKAI RYOURIDOU", value: "ISEKAI RYOURIDOU", url: "http://truyentuan.com/isekai-ryouridou/" }, { label: "Isekai Izakaya Nobu", value: "Isekai Izakaya Nobu", url: "http://truyentuan.com/isekai-izakaya-nobu/" }, { label: "Thí Thần", value: "Thí Thần", url: "http://truyentuan.com/thi-than/" }, { label: "Mikkakan no Koufuku", value: "Mikkakan no Koufuku", url: "http://truyentuan.com/mikkakan-no-koufuku/" }, { label: "Ai-Ren", value: "Ai-Ren", url: "http://truyentuan.com/ai-ren/" }, { label: "Thánh Tổ", value: "Thánh Tổ", url: "http://truyentuan.com/thanh-to/" }, { label: "Chung Quỳ Truyền Kỳ", value: "Chung Quỳ Truyền Kỳ", url: "http://truyentuan.com/chung-quy-truyen-ky/" }, { label: "Nguyên Tôn", value: "Nguyên Tôn", url: "http://truyentuan.com/nguyen-ton/" }, { label: "Tu Chân Nói Chuyện Phiếm Quần", value: "Tu Chân Nói Chuyện Phiếm Quần", url: "http://truyentuan.com/tu-chan-noi-chuyen-phiem-quan/" }, { label: "Golem Hearts", value: "Golem Hearts", url: "http://truyentuan.com/golem-hearts/" }, { label: "Trảm Đạo Kỷ", value: "Trảm Đạo Kỷ", url: "http://truyentuan.com/tram-dao-ky/" }, { label: "Jinrou Game", value: "Jinrou Game", url: "http://truyentuan.com/jinrou-game/" }, { label: "Karakai Jouzu no (Moto) Takagi-san", value: "Karakai Jouzu no (Moto) Takagi-san", url: "http://truyentuan.com/karakai-jouzu-no-moto-takagi-san/" }, { label: "Người Bảo Hộ Thần Thánh", value: "Người Bảo Hộ Thần Thánh", url: "http://truyentuan.com/nguoi-bao-ho-than-thanh/" }, { label: "Ma Thổi Đèn (Màu)", value: "Ma Thổi Đèn (Màu)", url: "http://truyentuan.com/ma-thoi-den-mau/" }, { label: "Sự trỗi dậy của Khiên Hiệp Sĩ", value: "Sự trỗi dậy của Khiên Hiệp Sĩ", url: "http://truyentuan.com/su-troi-day-cua-khien-hiep-si/" }, { label: "Giới Ma Nhân", value: "Giới Ma Nhân", url: "http://truyentuan.com/gioi-ma-nhan/" }, { label: "Misu Misou", value: "Misu Misou", url: "http://truyentuan.com/misu-misou/" }, { label: "Umineko no Naku Koro ni Chiru Episode 5: End of the Golden Witch", value: "Umineko no Naku Koro ni Chiru Episode 5: End of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-chiru-episode-5-end-of-the-golden-witch/" }, { label: "Hoshino,me O Tsubutte", value: "Hoshino,me O Tsubutte", url: "http://truyentuan.com/hoshinome-o-tsubutte/" }, { label: "Vạn Giới Tiên Tung", value: "Vạn Giới Tiên Tung", url: "http://truyentuan.com/van-gioi-tien-tung/" }, { label: "Hanikamu Honey", value: "Hanikamu Honey", url: "http://truyentuan.com/hanikamu-honey/" }, { label: "Bakemonogatari", value: "Bakemonogatari", url: "http://truyentuan.com/bakemonogatari/" }, { label: "Darling in the Franxx", value: "Darling in the Franxx", url: "http://truyentuan.com/darling-in-the-franxx/" }, { label: "Chư Thiên Ký", value: "Chư Thiên Ký", url: "http://truyentuan.com/chu-thien-ky/" }, { label: "Dosa", value: "Dosa", url: "http://truyentuan.com/dosa/" }, { label: "Toàn Chức Pháp Sư", value: "Toàn Chức Pháp Sư", url: "http://truyentuan.com/toan-chuc-phap-su/" }, { label: "ISEKAI DEATH GAME NI TENSOU SARETE TSURAI", value: "ISEKAI DEATH GAME NI TENSOU SARETE TSURAI", url: "http://truyentuan.com/isekai-death-game-ni-tensou-sarete-tsurai/" }, { label: "Quỷ Sai", value: "Quỷ Sai", url: "http://truyentuan.com/quy-sai/" }, { label: "Pumpkin Night", value: "Pumpkin Night", url: "http://truyentuan.com/pumpkin-night/" }, { label: "Captain Tsubasa : Golden 23", value: "Captain Tsubasa : Golden 23", url: "http://truyentuan.com/captain-tsubasa-golden-23/" }, { label: "Slime Taoshite 300-nen, Shiranai Uchi ni Level MAX ni Natteshimatta", value: "Slime Taoshite 300-nen, Shiranai Uchi ni Level MAX ni Natteshimatta", url: "http://truyentuan.com/slime-taoshite-300-nen-shiranai-uchi-ni-level-max-ni-natteshimatta/" }, { label: "Ojisama to Neko", value: "Ojisama to Neko", url: "http://truyentuan.com/ojisama-to-neko/" }, { label: "Orenchi no Maid-san", value: "Orenchi no Maid-san", url: "http://truyentuan.com/orenchi-no-maid-san/" }, { label: "PYGMALION", value: "PYGMALION", url: "http://truyentuan.com/pygmalion/" }, { label: "EDEN (TSURUOKA NOBUHISA)", value: "EDEN (TSURUOKA NOBUHISA)", url: "http://truyentuan.com/eden-tsuruoka-nobuhisa/" }, { label: "Vạn Cổ Kiếm Thần", value: "Vạn Cổ Kiếm Thần", url: "http://truyentuan.com/van-co-kiem-than/" }, { label: "Fairy Tail 100 year quest", value: "Fairy Tail 100 year quest", url: "http://truyentuan.com/fairy-tail-100-year-quest/" }, { label: "GIGANT", value: "GIGANT", url: "http://truyentuan.com/gigant/" }, { label: "Kiếm Nghịch Thương Khung", value: "Kiếm Nghịch Thương Khung", url: "http://truyentuan.com/kiem-nghich-thuong-khung/" }, { label: "Edens Zero", value: "Edens Zero", url: "http://truyentuan.com/edens-zero/" }, { label: "Hiệp sĩ đến từ vùng tận cùng của thế giới", value: "Hiệp sĩ đến từ vùng tận cùng của thế giới", url: "http://truyentuan.com/hiep-si-den-tu-vung-tan-cung-cua-the-gioi/" }, { label: "Kono Oto Tomare!", value: "Kono Oto Tomare!", url: "http://truyentuan.com/kono-oto-tomare/" }, { label: "Vua Sinh Tồn", value: "Vua Sinh Tồn", url: "http://truyentuan.com/vua-sinh-ton/" }, { label: "Catharsis", value: "Catharsis", url: "http://truyentuan.com/catharsis/" }, { label: "Life and Death", value: "Life and Death", url: "http://truyentuan.com/life-and-death/" }, { label: "Đồ Lục Tiên Ma", value: "Đồ Lục Tiên Ma", url: "http://truyentuan.com/do-luc-tien-ma/" }, { label: "Chiko-tan, Kowareru", value: "Chiko-tan, Kowareru", url: "http://truyentuan.com/chiko-tan-kowareru/" }, { label: "Banana Fish", value: "Banana Fish", url: "http://truyentuan.com/banana-fish/" }, { label: "Tiên Trụ", value: "Tiên Trụ", url: "http://truyentuan.com/tien-tru/" }, { label: "Death field", value: "Death field", url: "http://truyentuan.com/death-field/" }, { label: "Watashi ni Tenshi ga Maiorita!", value: "Watashi ni Tenshi ga Maiorita!", url: "http://truyentuan.com/watashi-ni-tenshi-ga-maiorita/" }, { label: "Thủ Mộ Bút Ký", value: "Thủ Mộ Bút Ký", url: "http://truyentuan.com/thu-mo-but-ky/" }, { label: "Quy Tự Dao", value: "Quy Tự Dao", url: "http://truyentuan.com/quy-tu-dao/" }, { label: "Cực Hạn Chi Địa", value: "Cực Hạn Chi Địa", url: "http://truyentuan.com/cuc-han-chi-dia/" }, { label: "Những Vụ Án Của Kindaichi Ở Tuổi 37", value: "Những Vụ Án Của Kindaichi Ở Tuổi 37", url: "http://truyentuan.com/nhung-vu-an-cua-kindaichi-o-tuoi-37/" }, { label: "Slime Life", value: "Slime Life", url: "http://truyentuan.com/slime-life/" }, { label: "Poputepipikku", value: "Poputepipikku", url: "http://truyentuan.com/poputepipikku/" }, { label: "Ore No Ie Ga Maryoku Spot Datta Ken: Sundeiru Dake De Sekai Saikyou", value: "Ore No Ie Ga Maryoku Spot Datta Ken: Sundeiru Dake De Sekai Saikyou", url: "http://truyentuan.com/ore-no-ie-ga-maryoku-spot-datta-ken-sundeiru-dake-de-sekai-saikyou/" }, { label: "Cuồng Đồ Tu Tiên", value: "Cuồng Đồ Tu Tiên", url: "http://truyentuan.com/cuong-do-tu-tien/" }, { label: "Yoru ni naru to Boku wa", value: "Yoru ni naru to Boku wa", url: "http://truyentuan.com/yoru-ni-naru-to-boku-wa/" }, { label: "Senpai ga Urusai Kouhai no Hanashi", value: "Senpai ga Urusai Kouhai no Hanashi", url: "http://truyentuan.com/senpai-ga-urusai-kouhai-no-hanashi/" }, { label: "Kawaiikereba Hentai demo Suki ni Natte Kuremasu ka?", value: "Kawaiikereba Hentai demo Suki ni Natte Kuremasu ka?", url: "http://truyentuan.com/kawaiikereba-hentai-demo-suki-ni-natte-kuremasu-ka/" }, { label: "Lessa 2: The Crimson Knight", value: "Lessa 2: The Crimson Knight", url: "http://truyentuan.com/lessa-2-the-crimson-knight/" }, { label: "Yêu Đạo Chí Tôn", value: "Yêu Đạo Chí Tôn", url: "http://truyentuan.com/yeu-dao-chi-ton/" }, { label: "Ngự Thiên", value: "Ngự Thiên", url: "http://truyentuan.com/ngu-thien/" }, { label: "Marry Grave", value: "Marry Grave", url: "http://truyentuan.com/marry-grave/" }, { label: "Trọng Sinh Đô Thị Tu Tiên", value: "Trọng Sinh Đô Thị Tu Tiên", url: "http://truyentuan.com/trong-sinh-do-thi-tu-tien/" }, { label: "Kishuku Gakkou no Juliet", value: "Kishuku Gakkou no Juliet", url: "http://truyentuan.com/kishuku-gakkou-no-juliet/" }, { label: "BIRDMEN", value: "BIRDMEN", url: "http://truyentuan.com/birdmen/" }, { label: "Kushuku Gakkou no Alice", value: "Kushuku Gakkou no Alice", url: "http://truyentuan.com/kushuku-gakkou-no-alice/" }, { label: "Transmigration Girl", value: "Transmigration Girl", url: "http://truyentuan.com/transmigration-girl/" }, { label: "Ngã Dục Phong Thiên", value: "Ngã Dục Phong Thiên", url: "http://truyentuan.com/nga-duc-phong-thien/" }, { label: "Tối Cường Khí Thiếu", value: "Tối Cường Khí Thiếu", url: "http://truyentuan.com/toi-cuong-khi-thieu/" }, { label: "14-SAI NO KOI", value: "14-SAI NO KOI", url: "http://truyentuan.com/14-sai-no-koi/" }, { label: "Lang Hoàn Thư Viện", value: "Lang Hoàn Thư Viện", url: "http://truyentuan.com/lang-hoan-thu-vien/" }, { label: "Kannou Sensei", value: "Kannou Sensei", url: "http://truyentuan.com/kannou-sensei/" }, { label: "Nghịch Thiên Tà Thần", value: "Nghịch Thiên Tà Thần", url: "http://truyentuan.com/nghich-thien-ta-than/" }, { label: "Anh Hùng ? Ta Không Làm Lâu Rồi", value: "Anh Hùng ? Ta Không Làm Lâu Rồi", url: "http://truyentuan.com/anh-hung-ta-khong-lam-lau-roi/" }, { label: "Minus Hand", value: "Minus Hand", url: "http://truyentuan.com/minus-hand/" }, { label: "Vạn Giới Thần Chủ", value: "Vạn Giới Thần Chủ", url: "http://truyentuan.com/van-gioi-than-chu/" }, { label: "DỊ NHÂN BẤT TỬ", value: "DỊ NHÂN BẤT TỬ", url: "http://truyentuan.com/di-nhan-bat-tu/" }, { label: "Hitman", value: "Hitman", url: "http://truyentuan.com/hitman/" }, { label: "Tuyệt Thế Kiếm Thần", value: "Tuyệt Thế Kiếm Thần", url: "http://truyentuan.com/tuyet-the-kiem-than/" }, { label: "ÔNG KẸ SAU 6H TỐI!", value: "ÔNG KẸ SAU 6H TỐI!", url: "http://truyentuan.com/ong-ke-sau-6h-toi/" }, { label: "COHABITATION WITH THE FIANCEE", value: "COHABITATION WITH THE FIANCEE", url: "http://truyentuan.com/cohabitation-with-the-fiancee/" }, { label: "This Man: Sono Kao o Mita Mono ni wa Shi o", value: "This Man: Sono Kao o Mita Mono ni wa Shi o", url: "http://truyentuan.com/this-man-sono-kao-o-mita-mono-ni-wa-shi-o/" }, { label: "Cuộc sống thoái ẩn của võ lâm chi vương", value: "Cuộc sống thoái ẩn của võ lâm chi vương", url: "http://truyentuan.com/cuoc-song-thoai-an-cua-vo-lam-chi-vuong/" }, { label: "Tuyệt Thế Chiến Hồn", value: "Tuyệt Thế Chiến Hồn", url: "http://truyentuan.com/tuyet-the-chien-hon/" }, { label: "Chainsawman", value: "Chainsawman", url: "http://truyentuan.com/chainsawman/" }, { label: "Tuyệt Thế Võ Hồn", value: "Tuyệt Thế Võ Hồn", url: "http://truyentuan.com/tuyet-the-vo-hon/" }, { label: "Hoàng Phi Hồng Phần IV", value: "Hoàng Phi Hồng Phần IV", url: "http://truyentuan.com/hoang-phi-hong-phan-iv/" }, { label: "Địa Ngục Này Ta Mở Ra Đấy", value: "Địa Ngục Này Ta Mở Ra Đấy", url: "http://truyentuan.com/dia-nguc-nay-ta-mo-ra-day/" }, { label: "Mạnh Nhất Lịch Sử", value: "Mạnh Nhất Lịch Sử", url: "http://truyentuan.com/manh-nhat-lich-su/" }, { label: "Tuyệt Thế Yêu Đế", value: "Tuyệt Thế Yêu Đế", url: "http://truyentuan.com/tuyet-the-yeu-de/" }, { label: "Honzuki No Gekokujou", value: "Honzuki No Gekokujou", url: "http://truyentuan.com/honzuki-no-gekokujou/" }, { label: "NENENE", value: "NENENE", url: "http://truyentuan.com/nenene/" }, { label: "Hắc Ám Huyết Thời Đại", value: "Hắc Ám Huyết Thời Đại", url: "http://truyentuan.com/hac-am-huyet-thoi-dai/" }, { label: "Cửu Tuyền Quy Lai", value: "Cửu Tuyền Quy Lai", url: "http://truyentuan.com/cuu-tuyen-quy-lai/" }, { label: "Ta Là Đại Thần Tiên", value: "Ta Là Đại Thần Tiên", url: "http://truyentuan.com/ta-la-dai-than-tien/" }, { label: "Võ Luyện Đỉnh Phong", value: "Võ Luyện Đỉnh Phong", url: "http://truyentuan.com/vo-luyen-dinh-phong/" }, { label: "Skeleton Soldier Couldn’t Protect The Dungeon", value: "Skeleton Soldier Couldn’t Protect The Dungeon", url: "http://truyentuan.com/skeleton-soldier-couldnt-protect-the-dungeon/" }, { label: "BOKU TO KIMI NO TAISETSU NA HANASHI", value: "BOKU TO KIMI NO TAISETSU NA HANASHI", url: "http://truyentuan.com/boku-to-kimi-no-taisetsu-na-hanashi/" }, { label: "Goumon Tournament", value: "Goumon Tournament", url: "http://truyentuan.com/goumon-tournament/" }, { label: "Kokuei No Junk", value: "Kokuei No Junk", url: "http://truyentuan.com/kokuei-no-junk/" }, { label: "Truyền Võ", value: "Truyền Võ", url: "http://truyentuan.com/truyen-vo/" }, { label: "Đại Kiếm Thần", value: "Đại Kiếm Thần", url: "http://truyentuan.com/dai-kiem-than/" }, { label: "Cực Vũ Huyền Đế", value: "Cực Vũ Huyền Đế", url: "http://truyentuan.com/cuc-vu-huyen-de/" }, { label: "Legend Isekai", value: "Legend Isekai", url: "http://truyentuan.com/legend-isekai/" }, { label: "KAIFUKU JUTSUSHI NO YARINAOSHI", value: "KAIFUKU JUTSUSHI NO YARINAOSHI", url: "http://truyentuan.com/kaifuku-jutsushi-no-yarinaoshi/" }, { label: "Chí Tôn Thần Ma", value: "Chí Tôn Thần Ma", url: "http://truyentuan.com/chi-ton-than-ma/" }, { label: "Thương Khung Bảng Chi Thánh Linh Kỷ", value: "Thương Khung Bảng Chi Thánh Linh Kỷ", url: "http://truyentuan.com/thuong-khung-bang-chi-thanh-linh-ky/" }, { label: "Ảnh Hậu Thời Gian", value: "Ảnh Hậu Thời Gian", url: "http://truyentuan.com/anh-hau-thoi-gian/" }, { label: "Điện thoại của ta thông tam giới", value: "Điện thoại của ta thông tam giới", url: "http://truyentuan.com/dien-thoai-cua-ta-thong-tam-gioi/" }, { label: "Đô Thị Cực Phẩm Y Tiên", value: "Đô Thị Cực Phẩm Y Tiên", url: "http://truyentuan.com/do-thi-cuc-pham-y-tien/" }, { label: "Phục Ma Thiên Sư", value: "Phục Ma Thiên Sư", url: "http://truyentuan.com/phuc-ma-thien-su/" }, { label: "Usotoki Rhetoric", value: "Usotoki Rhetoric", url: "http://truyentuan.com/usotoki-rhetoric/" }, { label: "Kage no Jitsuryokusha ni Naritakute!", value: "Kage no Jitsuryokusha ni Naritakute!", url: "http://truyentuan.com/kage-no-jitsuryokusha-ni-naritakute/" }, { label: "Jigokuraku", value: "Jigokuraku", url: "http://truyentuan.com/jigokuraku/" }, { label: "Hộ Hoa Cao Thủ Tại Đô Thị", value: "Hộ Hoa Cao Thủ Tại Đô Thị", url: "http://truyentuan.com/ho-hoa-cao-thu-tai-do-thi/" }, { label: "Tối Cường Thần Thú Hệ Thống", value: "Tối Cường Thần Thú Hệ Thống", url: "http://truyentuan.com/toi-cuong-than-thu-he-thong/" }, { label: "Siêu Cấp Hoàng Kim Nhãn", value: "Siêu Cấp Hoàng Kim Nhãn", url: "http://truyentuan.com/sieu-cap-hoang-kim-nhan/" }, { label: "Thiên Mệnh Cửu Tinh", value: "Thiên Mệnh Cửu Tinh", url: "http://truyentuan.com/thien-menh-cuu-tinh/" }, { label: "Orient", value: "Orient", url: "http://truyentuan.com/orient/" }, { label: "Ta Có Phòng Riêng Thời Tận Thế", value: "Ta Có Phòng Riêng Thời Tận Thế", url: "http://truyentuan.com/ta-co-phong-rieng-thoi-tan-the/" }, { label: "Tuyệt Thế Phi Đao", value: "Tuyệt Thế Phi Đao", url: "http://truyentuan.com/tuyet-the-phi-dao/" }, { label: "Tối Cường Phản Sáo Lộ Hệ Thống", value: "Tối Cường Phản Sáo Lộ Hệ Thống", url: "http://truyentuan.com/toi-cuong-phan-sao-lo-he-thong/" }, { label: "Mage no Kaigashuu", value: "Mage no Kaigashuu", url: "http://truyentuan.com/mage-no-kaigashuu/" }, { label: "Tiên Vương", value: "Tiên Vương", url: "http://truyentuan.com/tien-vuong/" }, { label: "Tu Chân Giả Tại Dị Thế", value: "Tu Chân Giả Tại Dị Thế", url: "http://truyentuan.com/tu-chan-gia-tai-di-the/" }, { label: "Dị Nhân Quán", value: "Dị Nhân Quán", url: "http://truyentuan.com/di-nhan-quan/" }, { label: "Kiếp Thiên Vận", value: "Kiếp Thiên Vận", url: "http://truyentuan.com/kiep-thien-van/" }, { label: "Mạt Thế Phàm Nhân", value: "Mạt Thế Phàm Nhân", url: "http://truyentuan.com/mat-the-pham-nhan/" }, { label: "Đại Nghịch Chi Môn", value: "Đại Nghịch Chi Môn", url: "http://truyentuan.com/dai-nghich-chi-mon/" }, { label: "Tuyệt Thế Thần Hoàng", value: "Tuyệt Thế Thần Hoàng", url: "http://truyentuan.com/tuyet-the-than-hoang/" }, { label: "Võ Nghịch Cửu Thiên", value: "Võ Nghịch Cửu Thiên", url: "http://truyentuan.com/vo-nghich-cuu-thien/" }, { label: "Living in this World with Cut & Paste", value: "Living in this World with Cut & Paste", url: "http://truyentuan.com/living-in-this-world-with-cut-paste/" }, { label: "World End Crusaders", value: "World End Crusaders", url: "http://truyentuan.com/world-end-crusaders/" }, { label: "Dạo quanh lãnh địa Demon", value: "Dạo quanh lãnh địa Demon", url: "http://truyentuan.com/dao-quanh-lanh-dia-demon/" }, { label: "Thiếu Soái ! Vợ Ngài Lại Bỏ Trốn", value: "Thiếu Soái ! Vợ Ngài Lại Bỏ Trốn", url: "http://truyentuan.com/thieu-soai-vo-ngai-lai-bo-tron/" }, { label: "A RETURNER'S MAGIC SHOULD BE SPECIAL", value: "A RETURNER'S MAGIC SHOULD BE SPECIAL", url: "http://truyentuan.com/a-returners-magic-should-be-special/" }, { label: "Võ Nghịch Sơn Hà", value: "Võ Nghịch Sơn Hà", url: "http://truyentuan.com/vo-nghich-son-ha/" }, { label: "Tu Chân Tứ Vạn Niên", value: "Tu Chân Tứ Vạn Niên", url: "http://truyentuan.com/tu-chan-tu-van-nien/" }, { label: "Đặc Nhiệm Siêu Cấp Thành Phố", value: "Đặc Nhiệm Siêu Cấp Thành Phố", url: "http://truyentuan.com/dac-nhiem-sieu-cap-thanh-pho/" }, { label: "Cửu Dương Thần Vương", value: "Cửu Dương Thần Vương", url: "http://truyentuan.com/cuu-duong-than-vuong/" }, { label: "Nhất Phẩm Cao Thủ", value: "Nhất Phẩm Cao Thủ", url: "http://truyentuan.com/nhat-pham-cao-thu/" }, { label: "Tokyo卍Revengers", value: "Tokyo卍Revengers", url: "http://truyentuan.com/tokyo-revengers/" }, { label: "Ngự Thiên Thần Đế", value: "Ngự Thiên Thần Đế", url: "http://truyentuan.com/ngu-thien-than-de/" }, { label: "Nghịch Thiên Đại Thần", value: "Nghịch Thiên Đại Thần", url: "http://truyentuan.com/nghich-thien-dai-than/" }, { label: "Act-Age", value: "Act-Age", url: "http://truyentuan.com/act-age/" }, { label: "Chung Cực Đấu La", value: "Chung Cực Đấu La", url: "http://truyentuan.com/chung-cuc-dau-la/" }, { label: "Tiếng gáy sát thủ", value: "Tiếng gáy sát thủ", url: "http://truyentuan.com/tieng-gay-sat-thu/" }, { label: "Warble", value: "Warble", url: "http://truyentuan.com/warble/" }, { label: "Yajin", value: "Yajin", url: "http://truyentuan.com/yajin/" }, { label: "Jujutsu Kaisen - Vật Thể Bị Nguyền Rủa", value: "Jujutsu Kaisen - Vật Thể Bị Nguyền Rủa", url: "http://truyentuan.com/jujutsu-kaisen-vat-the-bi-nguyen-rua/" }, { label: "Thiên Hạ Đệ Nhất Cao Thủ Đi Học", value: "Thiên Hạ Đệ Nhất Cao Thủ Đi Học", url: "http://truyentuan.com/thien-ha-de-nhat-cao-thu-di-hoc/" }, { label: "Độc Sấm Thiên Nhai", value: "Độc Sấm Thiên Nhai", url: "http://truyentuan.com/doc-sam-thien-nhai/" }, { label: "Thực Sắc Đại Lục", value: "Thực Sắc Đại Lục", url: "http://truyentuan.com/thuc-sac-dai-luc/" }, { label: "Thợ Săn Quỷ - Chainsaw", value: "Thợ Săn Quỷ - Chainsaw", url: "http://truyentuan.com/tho-san-quy-chainsaw/" }, { label: "Araburu Kisetsu no Otomedomo yo", value: "Araburu Kisetsu no Otomedomo yo", url: "http://truyentuan.com/araburu-kisetsu-no-otomedomo-yo/" }, { label: "Hananoi-kun to Koi no Yamai", value: "Hananoi-kun to Koi no Yamai", url: "http://truyentuan.com/hananoi-kun-to-koi-no-yamai/" }, { label: "Shin'ai naru Boku e Satsui wo komete", value: "Shin'ai naru Boku e Satsui wo komete", url: "http://truyentuan.com/shinai-naru-boku-e-satsui-wo-komete/" }, { label: "Bạn Thời Thơ Ấu - My Childhood Friend", value: "Bạn Thời Thơ Ấu - My Childhood Friend", url: "http://truyentuan.com/ban-thoi-tho-au-my-childhood-friend/" }, { label: "YUGIOH!", value: "YUGIOH!", url: "http://truyentuan.com/yugioh/" }, { label: "Card Captor Sakura: Clear Card", value: "Card Captor Sakura: Clear Card", url: "http://truyentuan.com/card-captor-sakura-clear-card/" }, { label: "Này ! đừng động vào phô mai của tôi", value: "Này ! đừng động vào phô mai của tôi", url: "http://truyentuan.com/nay-dung-dong-vao-pho-mai-cua-toi/" }, { label: "Dị Nhân Quán (Quạ Team)", value: "Dị Nhân Quán (Quạ Team)", url: "http://truyentuan.com/di-nhan-quan-qua-team/" }, { label: "Nanatsu no Taizai.", value: "Nanatsu no Taizai.", url: "http://truyentuan.com/nanatsu-no-taizai-2/" }, { label: "IKENIE TOUHYOU", value: "IKENIE TOUHYOU", url: "http://truyentuan.com/ikenie-touhyou-2/" }, { label: "SENPAI NHỎ NHẮN CỦA TÔI RẤT DỄ THƯƠNG", value: "SENPAI NHỎ NHẮN CỦA TÔI RẤT DỄ THƯƠNG", url: "http://truyentuan.com/senpai-nho-nhan-cua-toi-rat-de-thuong/" }, { label: "Đảo Chết Chóc", value: "Đảo Chết Chóc", url: "http://truyentuan.com/dao-chet-choc/" }, { label: "MAR Heaven", value: "MAR Heaven", url: "http://truyentuan.com/mar-heaven/" }, { label: "Ông chồng nội trợ - Gokushufudou", value: "Ông chồng nội trợ - Gokushufudou", url: "http://truyentuan.com/ong-chong-noi-tro-gokushufudou/" }, { label: "The Beginning After The End", value: "The Beginning After The End", url: "http://truyentuan.com/the-beginning-after-the-end/" }, { label: "The Promised Neverland (Mega Team)", value: "The Promised Neverland (Mega Team)", url: "http://truyentuan.com/the-promised-neverland-mega-team/" }, { label: "Shinju No Nectar", value: "Shinju No Nectar", url: "http://truyentuan.com/shinju-no-nectar/" }, { label: "Black Clover.", value: "Black Clover.", url: "http://truyentuan.com/black-clover-2/" }, { label: "Shokugeki no Soma.", value: "Shokugeki no Soma.", url: "http://truyentuan.com/shokugeki-no-soma-2/" }, { label: "Final Fantasy: Lost Stranger", value: "Final Fantasy: Lost Stranger", url: "http://truyentuan.com/final-fantasy-lost-stranger/" }, { label: "Bá Vương Hầm Ngục - The Dungeon Master", value: "Bá Vương Hầm Ngục - The Dungeon Master", url: "http://truyentuan.com/ba-vuong-ham-nguc-the-dungeon-master/" }, { label: "THE SCUM OF GOOD AND EVIL", value: "THE SCUM OF GOOD AND EVIL", url: "http://truyentuan.com/the-scum-of-good-and-evil/" }, { label: "Soul Hunter (Hoshin Engi)", value: "Soul Hunter (Hoshin Engi)", url: "http://truyentuan.com/soul-hunter/" }, { label: "Destiny Lovers", value: "Destiny Lovers", url: "http://truyentuan.com/destiny-lovers/" }, { label: "Nghịch Thiên Kiếm Thần", value: "Nghịch Thiên Kiếm Thần", url: "http://truyentuan.com/nghich-thien-kiem-than/" }, { label: "Cô vợ siêu mẫu của cố thiếu", value: "Cô vợ siêu mẫu của cố thiếu", url: "http://truyentuan.com/co-vo-sieu-mau-cua-co-thieu/" }, { label: "Shuumatsu No Valkyrie", value: "Shuumatsu No Valkyrie", url: "http://truyentuan.com/shuumatsu-no-valkyrie/" }, { label: "Dịch Vụ Trả Thù (Ngoại Truyện)", value: "Dịch Vụ Trả Thù (Ngoại Truyện)", url: "http://truyentuan.com/dich-vu-tra-thu-ngoai-truyen/" }, { label: "MAO", value: "MAO", url: "http://truyentuan.com/mao/" }, { label: "FAIRY GONE.", value: "FAIRY GONE.", url: "http://truyentuan.com/fairy-gone-1/" }, { label: "The Dungeon Master", value: "The Dungeon Master", url: "http://truyentuan.com/the-dungeon-master/" }, { label: "Thôn Phệ Lĩnh Vực", value: "Thôn Phệ Lĩnh Vực", url: "http://truyentuan.com/thon-phe-linh-vuc/" }, { label: "Đô Thị Kiêu Hùng Hệ Thống", value: "Đô Thị Kiêu Hùng Hệ Thống", url: "http://truyentuan.com/do-thi-kieu-hung-he-thong/" }, { label: "Thái Cổ Cuồng Ma", value: "Thái Cổ Cuồng Ma", url: "http://truyentuan.com/thai-co-cuong-ma/" }, { label: "Cao Đẳng Linh Hồn", value: "Cao Đẳng Linh Hồn", url: "http://truyentuan.com/cao-dang-linh-hon/" }, { label: "Detective Conan (Rocket Team)", value: "Detective Conan (Rocket Team)", url: "http://truyentuan.com/detective-conan-remake/" }, { label: "Hành trình hậu tận thế", value: "Hành trình hậu tận thế", url: "http://truyentuan.com/hanh-trinh-hau-tan-the/" }, { label: "Rich Player - Người Chơi Khắc Kim", value: "Rich Player - Người Chơi Khắc Kim", url: "http://truyentuan.com/rich-player-nguoi-choi-khac-kim/" }, { label: "Đấu Chiến Cuồng Triều", value: "Đấu Chiến Cuồng Triều", url: "http://truyentuan.com/dau-chien-cuong-trieu/" }, { label: "Ta Là Phế Vật", value: "Ta Là Phế Vật", url: "http://truyentuan.com/ta-la-phe-vat/" }, { label: "Kusuriya no Hitorigoto", value: "Kusuriya no Hitorigoto", url: "http://truyentuan.com/kusuriya-no-hitorigoto/" }, { label: "Siêu Năng Lập Phương", value: "Siêu Năng Lập Phương", url: "http://truyentuan.com/sieu-nang-lap-phuong/" }, { label: "Shikkaku Mon No Saikyou Kenja", value: "Shikkaku Mon No Saikyou Kenja", url: "http://truyentuan.com/shikkaku-mon-no-saikyou-kenja/" }, { label: "Higanjima Phần 3", value: "Higanjima Phần 3", url: "http://truyentuan.com/higanjima-phan-3/" }, { label: "My Status As An Assassin", value: "My Status As An Assassin", url: "http://truyentuan.com/my-status-as-an-assassin/" }, { label: "Tiên Đế Qui Lai", value: "Tiên Đế Qui Lai", url: "http://truyentuan.com/tien-de-qui-lai/" }, { label: "Hệ Thống Tu Tiên Mạnh Nhất", value: "Hệ Thống Tu Tiên Mạnh Nhất", url: "http://truyentuan.com/he-thong-tu-tien-manh-nhat/" }, { label: "5 Toubun no Hanayome", value: "5 Toubun no Hanayome", url: "http://truyentuan.com/5-toubun-no-hanayome/" }, { label: "FUKUSHUU WO KOINEGAU SAIKYOU YUUSHA WA, YAMI NO CHIKARA DE SENMETSU MUSOU SURU", value: "FUKUSHUU WO KOINEGAU SAIKYOU YUUSHA WA, YAMI NO CHIKARA DE SENMETSU MUSOU SURU", url: "http://truyentuan.com/fukushuu-wo-koinegau-saikyou-yuusha-wa-yami-no-chikara-de-senmetsu-musou-suru/" }, { label: "Genjitsu Shugi Yuusha no Oukoku Saikenki", value: "Genjitsu Shugi Yuusha no Oukoku Saikenki", url: "http://truyentuan.com/genjitsu-shugi-yuusha-no-oukoku-saikenki/" }, { label: "Lãnh Cung Phế Hậu Muốn Nghịch Thiên", value: "Lãnh Cung Phế Hậu Muốn Nghịch Thiên", url: "http://truyentuan.com/lanh-cung-phe-hau-muon-nghich-thien/" }, { label: "Kẻ Phán Xét", value: "Kẻ Phán Xét", url: "http://truyentuan.com/ke-phan-xet/" }, { label: "Hướng Tâm Dẫn Lực", value: "Hướng Tâm Dẫn Lực", url: "http://truyentuan.com/huong-tam-dan-luc/" }, { label: "Khế hôn", value: "Khế hôn", url: "http://truyentuan.com/khe-hon/" }, { label: "Trùng Sinh Chi Đô Thị Cuồng Tiên", value: "Trùng Sinh Chi Đô Thị Cuồng Tiên", url: "http://truyentuan.com/trung-sinh-chi-do-thi-cuong-tien/" }, { label: "Makikomarete Isekai Teni suru Yatsu wa, Taitei Cheat", value: "Makikomarete Isekai Teni suru Yatsu wa, Taitei Cheat", url: "http://truyentuan.com/makikomarete-isekai-teni-suru-yatsu-wa-taitei-cheat/" }, { label: "Long Mạch Võ Thần", value: "Long Mạch Võ Thần", url: "http://truyentuan.com/long-mach-vo-than/" }, { label: "Vì con gái, ngay cả Ma Vương tôi cũng có thể đánh bại", value: "Vì con gái, ngay cả Ma Vương tôi cũng có thể đánh bại", url: "http://truyentuan.com/vi-con-gai-ngay-ca-ma-vuong-toi-cung-co-the-danh-bai/" }, { label: "Zombie King", value: "Zombie King", url: "http://truyentuan.com/zombie-king/" }, { label: "Vợ yêu không ngoan", value: "Vợ yêu không ngoan", url: "http://truyentuan.com/vo-yeu-khong-ngoan/" }, { label: "A Falling Cohabitation", value: "A Falling Cohabitation", url: "http://truyentuan.com/truyen-a-falling-cohabitation/" }, { label: "Isekai Shoukan Wa Nidome Desu", value: "Isekai Shoukan Wa Nidome Desu", url: "http://truyentuan.com/isekai-shoukan-wa-nidome-desu/" }, { label: "Võ Đạo Độc Tôn", value: "Võ Đạo Độc Tôn", url: "http://truyentuan.com/vo-dao-doc-ton/" }, { label: "Bá Chủ Học Đường", value: "Bá Chủ Học Đường", url: "http://truyentuan.com/ba-chu-hoc-duong/" }, { label: "Isekai desu ga Mamono Saibai Shiteimasu", value: "Isekai desu ga Mamono Saibai Shiteimasu", url: "http://truyentuan.com/isekai-desu-ga-mamono-saibai-shiteimasu/" }, { label: "Weak 5000 – Year Old Vegan Dragon", value: "Weak 5000 – Year Old Vegan Dragon", url: "http://truyentuan.com/weak-5000-year-old-vegan-dragon/" }, { label: "Siêu Cấp Bảo An Tại Đô Thị", value: "Siêu Cấp Bảo An Tại Đô Thị", url: "http://truyentuan.com/sieu-cap-bao-an-tai-do-thi/" }, { label: "Sử Thượng Đệ Nhất Chưởng Môn", value: "Sử Thượng Đệ Nhất Chưởng Môn", url: "http://truyentuan.com/su-thuong-de-nhat-chuong-mon/" }, { label: "Tiểu Thư Bị Ám Sát! - Assassin's Pride", value: "Tiểu Thư Bị Ám Sát! - Assassin's Pride", url: "http://truyentuan.com/tieu-thu-bi-am-sat-assassins-pride/" }, { label: "Trên Người Ta Có Một Con Rồng", value: "Trên Người Ta Có Một Con Rồng", url: "http://truyentuan.com/tren-nguoi-ta-co-mot-con-rong/" }, { label: "Duranki", value: "Duranki", url: "http://truyentuan.com/duranki/" }, { label: "Cô vợ có phòng thủ bằng Zero", value: "Cô vợ có phòng thủ bằng Zero", url: "http://truyentuan.com/co-vo-co-phong-thu-bang-zero/" }, { label: "My Dear Cold Blooded King", value: "My Dear Cold Blooded King", url: "http://truyentuan.com/my-dear-cold-blooded-king/" }, { label: "Mục Thần Ký", value: "Mục Thần Ký", url: "http://truyentuan.com/muc-than-ky/" }, { label: "Thần Võ Thiên Tôn", value: "Thần Võ Thiên Tôn", url: "http://truyentuan.com/than-vo-thien-ton/" }, { label: "Higurashi no Naku Koro ni - Tatarigoroshi Hen", value: "Higurashi no Naku Koro ni - Tatarigoroshi Hen", url: "http://truyentuan.com/higurashi-no-naku-koro-ni-tatarigoroshi-hen/" }, { label: "Yu-Gi-Oh! OCG Structure - Kiến tạo Bài thủ truyện", value: "Yu-Gi-Oh! OCG Structure - Kiến tạo Bài thủ truyện", url: "http://truyentuan.com/yu-gi-oh-ocg-structure-kien-tao-bai-thu-truyen/" }, { label: "Sau Khi Tôi Là 1 Ma Vương, Tôi Sẽ Xây Dựng Hầm Ngục Cùng Với Các Nô Lệ!", value: "Sau Khi Tôi Là 1 Ma Vương, Tôi Sẽ Xây Dựng Hầm Ngục Cùng Với Các Nô Lệ!", url: "http://truyentuan.com/sau-khi-toi-la-1-ma-vuong-toi-se-xay-dung-ham-nguc-cung-voi-cac-no-le/" }, { label: "Exterminator", value: "Exterminator", url: "http://truyentuan.com/exterminator/" }, { label: "Phong Quỷ Truyền Thuyết", value: "Phong Quỷ Truyền Thuyết", url: "http://truyentuan.com/phong-quy-truyen-thuyet/" }, { label: "Hard Core Leveling Warrior ss2", value: "Hard Core Leveling Warrior ss2", url: "http://truyentuan.com/hard-core-leveling-warrior-ss2/" }, { label: "Kiếm Thần Tuyệt Thế", value: "Kiếm Thần Tuyệt Thế", url: "http://truyentuan.com/kiem-than-tuyet-the/" }, { label: "Takarakuji de 40-oku Atattandakedo Isekai ni Ijuu Suru", value: "Takarakuji de 40-oku Atattandakedo Isekai ni Ijuu Suru", url: "http://truyentuan.com/takarakuji-de-40-oku-atattandakedo-isekai-ni-ijuu-suru/" }, { label: "Hiraheishi wa Kako wo Yumemiru", value: "Hiraheishi wa Kako wo Yumemiru", url: "http://truyentuan.com/hiraheishi-wa-kako-wo-yumemiru/" }, { label: "Sono Ossan, Isekai De Nishuume Play Wo Mankitsu Chuu", value: "Sono Ossan, Isekai De Nishuume Play Wo Mankitsu Chuu", url: "http://truyentuan.com/sono-ossan-isekai-de-nishuume-play-wo-mankitsu-chuu/" }, { label: "Nidome No Yuusha", value: "Nidome No Yuusha", url: "http://truyentuan.com/nidome-no-yuusha/" }, { label: "Khổng Minh Thích Tiệc Tùng", value: "Khổng Minh Thích Tiệc Tùng", url: "http://truyentuan.com/khong-minh-thich-tiec-tung/" }, { label: "Tokyo Dragon Night", value: "Tokyo Dragon Night", url: "http://truyentuan.com/tokyo-dragon-night/" }, { label: "ZINGNIZE", value: "ZINGNIZE", url: "http://truyentuan.com/zingnize/" }, { label: "Ta Có Một Bộ Hỗn Độn Kinh", value: "Ta Có Một Bộ Hỗn Độn Kinh", url: "http://truyentuan.com/ta-co-mot-bo-hon-don-kinh/" }, { label: "Blacksad", value: "Blacksad", url: "http://truyentuan.com/blacksad-3/" }, { label: "Duelant", value: "Duelant", url: "http://truyentuan.com/duelant/" }, { label: "Japan", value: "Japan", url: "http://truyentuan.com/japan/" }, { label: "Dark Avengers", value: "Dark Avengers", url: "http://truyentuan.com/dark-avengers/" }, { label: "Agravity Boys", value: "Agravity Boys", url: "http://truyentuan.com/agravity-boys/" }, { label: "Superman: Speeding Bullets", value: "Superman: Speeding Bullets", url: "http://truyentuan.com/superman-speeding-bullets/" }, { label: "Berserk Of Gluttony", value: "Berserk Of Gluttony", url: "http://truyentuan.com/berserk-of-gluttony/" }, { label: "Superman: Distant Fire", value: "Superman: Distant Fire", url: "http://truyentuan.com/superman-distant-fire/" }, { label: "Paidon", value: "Paidon", url: "http://truyentuan.com/paidon/" }, { label: "The Ultimate Middle-Aged Hunter Travels To Another World", value: "The Ultimate Middle-Aged Hunter Travels To Another World", url: "http://truyentuan.com/the-ultimate-middle-aged-hunter-travels-to-another-world/" }, { label: "Địa Phủ Khai Phá Thương", value: "Địa Phủ Khai Phá Thương", url: "http://truyentuan.com/dia-phu-khai-pha-thuong/" }, { label: "Tensei Shitara Dragon No Tamago Datta - Saikyou Igai", value: "Tensei Shitara Dragon No Tamago Datta - Saikyou Igai", url: "http://truyentuan.com/tensei-shitara-dragon-no-tamago-datta-saikyou-igai/" }, { label: "Ne0;lation", value: "Ne0;lation", url: "http://truyentuan.com/ne0lation/" }, { label: "Cực Phẩm Tiên Hiệp Học Viện", value: "Cực Phẩm Tiên Hiệp Học Viện", url: "http://truyentuan.com/cuc-pham-tien-hiep-hoc-vien/" }, { label: "Đấu La Đại Lục Ngoại Truyện: Đường Môn Anh Hùng", value: "Đấu La Đại Lục Ngoại Truyện: Đường Môn Anh Hùng", url: "http://truyentuan.com/dau-la-dai-luc-ngoai-truyen-duong-mon-anh-hung/" }, { label: "TÔI LÀ NGƯỜI CHƠI DUY NHẤT ĐĂNG NHẬP", value: "TÔI LÀ NGƯỜI CHƠI DUY NHẤT ĐĂNG NHẬP", url: "http://truyentuan.com/toi-la-nguoi-choi-duy-nhat-dang-nhap/" }, { label: "Mashle: Magic and Muscles", value: "Mashle: Magic and Muscles", url: "http://truyentuan.com/mashle-magic-and-muscles/" }, { label: "Người Chơi Lỗi", value: "Người Chơi Lỗi", url: "http://truyentuan.com/nguoi-choi-loi/" }, { label: "Tao muốn trở thành chúa tể bóng tối!!", value: "Tao muốn trở thành chúa tể bóng tối!!", url: "http://truyentuan.com/tao-muon-tro-thanh-chua-te-bong-toi/" }, { label: "Thương Nguyên Đồ", value: "Thương Nguyên Đồ", url: "http://truyentuan.com/thuong-nguyen-do/" }, { label: "Cửa Hàng Đào Bảo Thông Tam Giới", value: "Cửa Hàng Đào Bảo Thông Tam Giới", url: "http://truyentuan.com/cua-hang-dao-bao-thong-tam-gioi/" }, { label: "Isekai Nonbiri Nouka", value: "Isekai Nonbiri Nouka", url: "http://truyentuan.com/isekai-nonbiri-nouka/" }, { label: "Một Mình Dạo Quanh Hầm Ngục", value: "Một Mình Dạo Quanh Hầm Ngục", url: "http://truyentuan.com/mot-minh-dao-quanh-ham-nguc/" }, { label: "Gia Tộc Điệp Viên Yozakura", value: "Gia Tộc Điệp Viên Yozakura", url: "http://truyentuan.com/gia-toc-diep-vien-yozakura/" }, { label: "Khởi Tạo Nhân Vật Phản Diện", value: "Khởi Tạo Nhân Vật Phản Diện", url: "http://truyentuan.com/khoi-tao-nhan-vat-phan-dien/" }, { label: "Vượt qua giới hạn", value: "Vượt qua giới hạn", url: "http://truyentuan.com/vuot-qua-gioi-han/" }, { label: "Tu Thiên Truyện", value: "Tu Thiên Truyện", url: "http://truyentuan.com/tu-thien-truyen/" }, { label: "Thiên Thần Quyết", value: "Thiên Thần Quyết", url: "http://truyentuan.com/thien-than-quyet/" }, { label: "Tôi Lên Cấp Chỉ Bằng Cách Ăn", value: "Tôi Lên Cấp Chỉ Bằng Cách Ăn", url: "http://truyentuan.com/toi-len-cap-chi-bang-cach-an/" }, { label: "Kanzen Kaihi Healer No Kiseki", value: "Kanzen Kaihi Healer No Kiseki", url: "http://truyentuan.com/kanzen-kaihi-healer-no-kiseki/" }, { label: "Fantasista Stella", value: "Fantasista Stella", url: "http://truyentuan.com/fantasista-stella/" }, { label: "Đấu Hồn Đại Lục", value: "Đấu Hồn Đại Lục", url: "http://truyentuan.com/dau-hon-dai-luc/" }, { label: "Bậc Thầy Kiếm Sư", value: "Bậc Thầy Kiếm Sư", url: "http://truyentuan.com/bac-thay-kiem-su/" }, { label: "The Kingdom Of Ruin", value: "The Kingdom Of Ruin", url: "http://truyentuan.com/the-kingdom-of-ruin/" }, { label: "Ta Là Tà Đế", value: "Ta Là Tà Đế", url: "http://truyentuan.com/ta-la-ta-de/" }, { label: "Trọng Sinh Đại Ngoạn Gia", value: "Trọng Sinh Đại Ngoạn Gia", url: "http://truyentuan.com/trong-sinh-dai-ngoan-gia/" }, { label: "Toàn trí độc giả", value: "Toàn trí độc giả", url: "http://truyentuan.com/toan-tri-doc-gia/" }, { label: "Sự Trở Lại Của Pháp Sư Vĩ Đại Sau 4000 Năm", value: "Sự Trở Lại Của Pháp Sư Vĩ Đại Sau 4000 Năm", url: "http://truyentuan.com/su-tro-lai-cua-phap-su-vi-dai-sau-4000-nam/" }, { label: "Okaeri", value: "Okaeri", url: "http://truyentuan.com/okaeri/" }, { label: "VUA TRỘM MỘ", value: "VUA TRỘM MỘ", url: "http://truyentuan.com/vua-trom-mo/" }, { label: "Baki Dou 2018", value: "Baki Dou 2018", url: "http://truyentuan.com/baki-dou-2018/" }, { label: "Chiến Binh Từ Thế Giới Khác", value: "Chiến Binh Từ Thế Giới Khác", url: "http://truyentuan.com/chien-binh-tu-the-gioi-khac/" }, { label: "Tôi Tự Động Săn Một Mình", value: "Tôi Tự Động Săn Một Mình", url: "http://truyentuan.com/toi-tu-dong-san-mot-minh/" }, { label: "The Boxer - Võ Sĩ Quyền Anh", value: "The Boxer - Võ Sĩ Quyền Anh", url: "http://truyentuan.com/the-boxer-vo-si-quyen-anh/" }, { label: "Kouryakuhon O Kushi Suru Saikyou No Mahoutsukai", value: "Kouryakuhon O Kushi Suru Saikyou No Mahoutsukai", url: "http://truyentuan.com/kouryakuhon-o-kushi-suru-saikyou-no-mahoutsukai/" }, { label: "A Tu La - Tây Du ngoại truyện", value: "A Tu La - Tây Du ngoại truyện", url: "http://truyentuan.com/a-tu-la-tay-du-ngoai-truyen/" }, { label: "Dị Tộc Trùng Sinh", value: "Dị Tộc Trùng Sinh", url: "http://truyentuan.com/di-toc-trung-sinh/" }, { label: "Tà Du Ký", value: "Tà Du Ký", url: "http://truyentuan.com/ta-du-ky/" }, { label: "Hôm Nay - Tôi Hóa Kaiju", value: "Hôm Nay - Tôi Hóa Kaiju", url: "http://truyentuan.com/hom-nay-toi-hoa-kaiju/" }, { label: "Toàn Cầu Cao Võ", value: "Toàn Cầu Cao Võ", url: "http://truyentuan.com/toan-cau-cao-vo/" }, { label: "Sobiwaku Zero No Saikyou Kenshi Demo, Noroi No Soubi (kawai) Nara 9999-ko Tsuke-hodai", value: "Sobiwaku Zero No Saikyou Kenshi Demo, Noroi No Soubi (kawai) Nara 9999-ko Tsuke-hodai", url: "http://truyentuan.com/sobiwaku-zero-no-saikyou-kenshi-demo-noroi-no-soubi-kawai-nara-9999-ko-tsuke-hodai/" }, { label: "Rebuild World", value: "Rebuild World", url: "http://truyentuan.com/rebuild-world/" }, { label: "Tái Thiết Hầm Ngục", value: "Tái Thiết Hầm Ngục", url: "http://truyentuan.com/tai-thiet-ham-nguc/" }, { label: "Phi Lôi Đạo", value: "Phi Lôi Đạo", url: "http://truyentuan.com/phi-loi-dao/" }, { label: "Bậc Thầy Thuần Hóa", value: "Bậc Thầy Thuần Hóa", url: "http://truyentuan.com/bac-thay-thuan-hoa/" }, { label: "Nguyên Long", value: "Nguyên Long", url: "http://truyentuan.com/nguyen-long/" }, { label: "FFF-Class Trashero", value: "FFF-Class Trashero", url: "http://truyentuan.com/fff-class-trashero/" }, { label: "Võ Nghịch", value: "Võ Nghịch", url: "http://truyentuan.com/vo-nghich/" }, { label: "Level 1 with S-rank Drop Rate is the Strongest", value: "Level 1 with S-rank Drop Rate is the Strongest", url: "http://truyentuan.com/level-1-with-s-rank-drop-rate-is-the-strongest/" }, { label: "Thợ Săn Đầu Tiên", value: "Thợ Săn Đầu Tiên", url: "http://truyentuan.com/tho-san-dau-tien/" }, { label: "Ngã lão ma thần", value: "Ngã lão ma thần", url: "http://truyentuan.com/nga-lao-ma-than/" }, { label: "Trọng Sinh Sau Tám Vạn Năm", value: "Trọng Sinh Sau Tám Vạn Năm", url: "http://truyentuan.com/trong-sinh-sau-tam-van-nam/" }, { label: "Hầm Ngục Bóng Tối", value: "Hầm Ngục Bóng Tối", url: "http://truyentuan.com/ham-nguc-bong-toi/" }, { label: "Cung Quỷ Kiếm Thần", value: "Cung Quỷ Kiếm Thần", url: "http://truyentuan.com/cung-quy-kiem-than/" }, { label: "Bắc Kiếm Giang Hồ", value: "Bắc Kiếm Giang Hồ", url: "http://truyentuan.com/bac-kiem-giang-ho/" }, { label: "Đô Thị Chí Tôn Hệ Thống", value: "Đô Thị Chí Tôn Hệ Thống", url: "http://truyentuan.com/do-thi-chi-ton-he-thong/" }, { label: "Biên Niên Sử Của Thiên Quỷ", value: "Biên Niên Sử Của Thiên Quỷ", url: "http://truyentuan.com/bien-nien-su-cua-thien-quy/" }, { label: "Võ Đang Kỳ Hiệp", value: "Võ Đang Kỳ Hiệp", url: "http://truyentuan.com/vo-dang-ky-hiep/" }, { label: "Bất Bại Quyền Ma", value: "Bất Bại Quyền Ma", url: "http://truyentuan.com/bat-bai-quyen-ma/" }, { label: "VUA THĂNG CẤP", value: "VUA THĂNG CẤP", url: "http://truyentuan.com/vua-thang-cap/" }, { label: "Kuro No Shoukanshi", value: "Kuro No Shoukanshi", url: "http://truyentuan.com/kuro-no-shoukanshi/" }, { label: "Tôi Là Thợ Săn Có Kĩ Năng Tự Sát Cấp SSS", value: "Tôi Là Thợ Săn Có Kĩ Năng Tự Sát Cấp SSS", url: "http://truyentuan.com/toi-la-tho-san-co-ki-nang-tu-sat-cap-sss/" }, { label: "Cậu Bé Của Thần Chết", value: "Cậu Bé Của Thần Chết", url: "http://truyentuan.com/cau-be-cua-than-chet/" }, { label: "Lôi Thần Chuyển Sinh", value: "Lôi Thần Chuyển Sinh", url: "http://truyentuan.com/loi-than-chuyen-sinh/" }, { label: "Boukensha Ni Naritai To Miyako Ni Deteitta Musume Ga S Rank Ni Nattet", value: "Boukensha Ni Naritai To Miyako Ni Deteitta Musume Ga S Rank Ni Nattet", url: "http://truyentuan.com/boukensha-ni-naritai-to-miyako-ni-deteitta-musume-ga-s-rank-ni-nattet/" }, { label: "Ngôi Nhà Bị Ma Ám Mạnh Nhất Và Chàng Trai Không Có Năng Lực Tâm Linh", value: "Ngôi Nhà Bị Ma Ám Mạnh Nhất Và Chàng Trai Không Có Năng Lực Tâm Linh", url: "http://truyentuan.com/ngoi-nha-bi-ma-am-manh-nhat-va-chang-trai-khong-co-nang-luc-tam-linh/" }, { label: "Vô Kiếm Tiểu Tử", value: "Vô Kiếm Tiểu Tử", url: "http://truyentuan.com/vo-kiem-tieu-tu/" }, { label: "The Useless Tamer Will Turn into the Top Unconsciously by My Previous Life Knowledge", value: "The Useless Tamer Will Turn into the Top Unconsciously by My Previous Life Knowledge", url: "http://truyentuan.com/the-useless-tamer-will-turn-into-the-top-unconsciously-by-my-previous-life-knowledge/" }];
exports.availableTags = availableTags;

},{}]},{},[59])(59)
});
