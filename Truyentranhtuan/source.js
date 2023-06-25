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
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXML = exports.decodeHTMLStrict = exports.decodeHTMLAttribute = exports.decodeHTML = exports.determineBranch = exports.EntityDecoder = exports.DecodingMode = exports.BinTrieFlags = exports.fromCodePoint = exports.replaceCodePoint = exports.decodeCodePoint = exports.xmlDecodeTree = exports.htmlDecodeTree = void 0;
var decode_data_html_js_1 = __importDefault(require("./generated/decode-data-html.js"));
exports.htmlDecodeTree = decode_data_html_js_1.default;
var decode_data_xml_js_1 = __importDefault(require("./generated/decode-data-xml.js"));
exports.xmlDecodeTree = decode_data_xml_js_1.default;
var decode_codepoint_js_1 = __importStar(require("./decode_codepoint.js"));
exports.decodeCodePoint = decode_codepoint_js_1.default;
var decode_codepoint_js_2 = require("./decode_codepoint.js");
Object.defineProperty(exports, "replaceCodePoint", { enumerable: true, get: function () { return decode_codepoint_js_2.replaceCodePoint; } });
Object.defineProperty(exports, "fromCodePoint", { enumerable: true, get: function () { return decode_codepoint_js_2.fromCodePoint; } });
var CharCodes;
(function (CharCodes) {
    CharCodes[CharCodes["NUM"] = 35] = "NUM";
    CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
    CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
    CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
    CharCodes[CharCodes["NINE"] = 57] = "NINE";
    CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
    CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
    CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
    CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
    CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
    CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
var TO_LOWER_BIT = 32;
var BinTrieFlags;
(function (BinTrieFlags) {
    BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
    BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags = exports.BinTrieFlags || (exports.BinTrieFlags = {}));
function isNumber(code) {
    return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F));
}
function isAsciiAlphaNumeric(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z) ||
        isNumber(code));
}
/**
 * Checks if the given character is a valid end character for an entity in an attribute.
 *
 * Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
 * See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
 */
function isEntityInAttributeInvalidEnd(code) {
    return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function (EntityDecoderState) {
    EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function (DecodingMode) {
    /** Entities in text nodes that can end with any character. */
    DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
    /** Only allow entities terminated with a semicolon. */
    DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
    /** Entities in attributes have limitations on ending characters. */
    DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode = exports.DecodingMode || (exports.DecodingMode = {}));
/**
 * Token decoder with support of writing partial entities.
 */
var EntityDecoder = /** @class */ (function () {
    function EntityDecoder(
    /** The tree used to decode entities. */
    decodeTree, 
    /**
     * The function that is called when a codepoint is decoded.
     *
     * For multi-byte named entities, this will be called multiple times,
     * with the second codepoint, and the same `consumed` value.
     *
     * @param codepoint The decoded codepoint.
     * @param consumed The number of bytes consumed by the decoder.
     */
    emitCodePoint, 
    /** An object that is used to produce errors. */
    errors) {
        this.decodeTree = decodeTree;
        this.emitCodePoint = emitCodePoint;
        this.errors = errors;
        /** The current state of the decoder. */
        this.state = EntityDecoderState.EntityStart;
        /** Characters that were consumed while parsing an entity. */
        this.consumed = 1;
        /**
         * The result of the entity.
         *
         * Either the result index of a numeric entity, or the codepoint of a
         * numeric entity.
         */
        this.result = 0;
        /** The current index in the decode tree. */
        this.treeIndex = 0;
        /** The number of characters that were consumed in excess. */
        this.excess = 1;
        /** The mode in which the decoder is operating. */
        this.decodeMode = DecodingMode.Strict;
    }
    /** Resets the instance to make it reusable. */
    EntityDecoder.prototype.startEntity = function (decodeMode) {
        this.decodeMode = decodeMode;
        this.state = EntityDecoderState.EntityStart;
        this.result = 0;
        this.treeIndex = 0;
        this.excess = 1;
        this.consumed = 1;
    };
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param string The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    EntityDecoder.prototype.write = function (str, offset) {
        switch (this.state) {
            case EntityDecoderState.EntityStart: {
                if (str.charCodeAt(offset) === CharCodes.NUM) {
                    this.state = EntityDecoderState.NumericStart;
                    this.consumed += 1;
                    return this.stateNumericStart(str, offset + 1);
                }
                this.state = EntityDecoderState.NamedEntity;
                return this.stateNamedEntity(str, offset);
            }
            case EntityDecoderState.NumericStart: {
                return this.stateNumericStart(str, offset);
            }
            case EntityDecoderState.NumericDecimal: {
                return this.stateNumericDecimal(str, offset);
            }
            case EntityDecoderState.NumericHex: {
                return this.stateNumericHex(str, offset);
            }
            case EntityDecoderState.NamedEntity: {
                return this.stateNamedEntity(str, offset);
            }
        }
    };
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    EntityDecoder.prototype.stateNumericStart = function (str, offset) {
        if (offset >= str.length) {
            return -1;
        }
        if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
            this.state = EntityDecoderState.NumericHex;
            this.consumed += 1;
            return this.stateNumericHex(str, offset + 1);
        }
        this.state = EntityDecoderState.NumericDecimal;
        return this.stateNumericDecimal(str, offset);
    };
    EntityDecoder.prototype.addToNumericResult = function (str, start, end, base) {
        if (start !== end) {
            var digitCount = end - start;
            this.result =
                this.result * Math.pow(base, digitCount) +
                    parseInt(str.substr(start, digitCount), base);
            this.consumed += digitCount;
        }
    };
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    EntityDecoder.prototype.stateNumericHex = function (str, offset) {
        var startIdx = offset;
        while (offset < str.length) {
            var char = str.charCodeAt(offset);
            if (isNumber(char) || isHexadecimalCharacter(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(str, startIdx, offset, 16);
                return this.emitNumericEntity(char, 3);
            }
        }
        this.addToNumericResult(str, startIdx, offset, 16);
        return -1;
    };
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    EntityDecoder.prototype.stateNumericDecimal = function (str, offset) {
        var startIdx = offset;
        while (offset < str.length) {
            var char = str.charCodeAt(offset);
            if (isNumber(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(str, startIdx, offset, 10);
                return this.emitNumericEntity(char, 2);
            }
        }
        this.addToNumericResult(str, startIdx, offset, 10);
        return -1;
    };
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    EntityDecoder.prototype.emitNumericEntity = function (lastCp, expectedLength) {
        var _a;
        // Ensure we consumed at least one digit.
        if (this.consumed <= expectedLength) {
            (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
            return 0;
        }
        // Figure out if this is a legit end of the entity
        if (lastCp === CharCodes.SEMI) {
            this.consumed += 1;
        }
        else if (this.decodeMode === DecodingMode.Strict) {
            return 0;
        }
        this.emitCodePoint((0, decode_codepoint_js_1.replaceCodePoint)(this.result), this.consumed);
        if (this.errors) {
            if (lastCp !== CharCodes.SEMI) {
                this.errors.missingSemicolonAfterCharacterReference();
            }
            this.errors.validateNumericCharacterReference(this.result);
        }
        return this.consumed;
    };
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    EntityDecoder.prototype.stateNamedEntity = function (str, offset) {
        var decodeTree = this.decodeTree;
        var current = decodeTree[this.treeIndex];
        // The mask is the number of bytes of the value, including the current byte.
        var valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        for (; offset < str.length; offset++, this.excess++) {
            var char = str.charCodeAt(offset);
            this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
            if (this.treeIndex < 0) {
                return this.result === 0 ||
                    // If we are parsing an attribute
                    (this.decodeMode === DecodingMode.Attribute &&
                        // We shouldn't have consumed any characters after the entity,
                        (valueLength === 0 ||
                            // And there should be no invalid characters.
                            isEntityInAttributeInvalidEnd(char)))
                    ? 0
                    : this.emitNotTerminatedNamedEntity();
            }
            current = decodeTree[this.treeIndex];
            valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
            // If the branch is a value, store it and continue
            if (valueLength !== 0) {
                // If the entity is terminated by a semicolon, we are done.
                if (char === CharCodes.SEMI) {
                    return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
                }
                // If we encounter a non-terminated (legacy) entity while parsing strictly, then ignore it.
                if (this.decodeMode !== DecodingMode.Strict) {
                    this.result = this.treeIndex;
                    this.consumed += this.excess;
                    this.excess = 0;
                }
            }
        }
        return -1;
    };
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    EntityDecoder.prototype.emitNotTerminatedNamedEntity = function () {
        var _a;
        var _b = this, result = _b.result, decodeTree = _b.decodeTree;
        var valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
        this.emitNamedEntityData(result, valueLength, this.consumed);
        (_a = this.errors) === null || _a === void 0 ? void 0 : _a.missingSemicolonAfterCharacterReference();
        return this.consumed;
    };
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    EntityDecoder.prototype.emitNamedEntityData = function (result, valueLength, consumed) {
        var decodeTree = this.decodeTree;
        this.emitCodePoint(valueLength === 1
            ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH
            : decodeTree[result + 1], consumed);
        if (valueLength === 3) {
            // For multi-byte values, we need to emit the second byte.
            this.emitCodePoint(decodeTree[result + 2], consumed);
        }
        return consumed;
    };
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    EntityDecoder.prototype.end = function () {
        var _a;
        switch (this.state) {
            case EntityDecoderState.NamedEntity: {
                // Emit a named entity if we have one.
                return this.result !== 0 &&
                    (this.decodeMode !== DecodingMode.Attribute ||
                        this.result === this.treeIndex)
                    ? this.emitNotTerminatedNamedEntity()
                    : 0;
            }
            // Otherwise, emit a numeric entity if we have one.
            case EntityDecoderState.NumericDecimal: {
                return this.emitNumericEntity(0, 2);
            }
            case EntityDecoderState.NumericHex: {
                return this.emitNumericEntity(0, 3);
            }
            case EntityDecoderState.NumericStart: {
                (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
                return 0;
            }
            case EntityDecoderState.EntityStart: {
                // Return 0 if we have no entity.
                return 0;
            }
        }
    };
    return EntityDecoder;
}());
exports.EntityDecoder = EntityDecoder;
/**
 * Creates a function that decodes entities in a string.
 *
 * @param decodeTree The decode tree.
 * @returns A function that decodes entities in a string.
 */
function getDecoder(decodeTree) {
    var ret = "";
    var decoder = new EntityDecoder(decodeTree, function (str) { return (ret += (0, decode_codepoint_js_1.fromCodePoint)(str)); });
    return function decodeWithTrie(str, decodeMode) {
        var lastIndex = 0;
        var offset = 0;
        while ((offset = str.indexOf("&", offset)) >= 0) {
            ret += str.slice(lastIndex, offset);
            decoder.startEntity(decodeMode);
            var len = decoder.write(str, 
            // Skip the "&"
            offset + 1);
            if (len < 0) {
                lastIndex = offset + decoder.end();
                break;
            }
            lastIndex = offset + len;
            // If `len` is 0, skip the current `&` and continue.
            offset = len === 0 ? lastIndex + 1 : lastIndex;
        }
        var result = ret + str.slice(lastIndex);
        // Make sure we don't keep a reference to the final string.
        ret = "";
        return result;
    };
}
/**
 * Determines the branch of the current node that is taken given the current
 * character. This function is used to traverse the trie.
 *
 * @param decodeTree The trie.
 * @param current The current node.
 * @param nodeIdx The index right after the current node and its value.
 * @param char The current character.
 * @returns The index of the next node, or -1 if no branch is taken.
 */
function determineBranch(decodeTree, current, nodeIdx, char) {
    var branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    var jumpOffset = current & BinTrieFlags.JUMP_TABLE;
    // Case 1: Single branch encoded in jump offset
    if (branchCount === 0) {
        return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
    }
    // Case 2: Multiple branches encoded in jump table
    if (jumpOffset) {
        var value = char - jumpOffset;
        return value < 0 || value >= branchCount
            ? -1
            : decodeTree[nodeIdx + value] - 1;
    }
    // Case 3: Multiple branches encoded in dictionary
    // Binary search for the character.
    var lo = nodeIdx;
    var hi = lo + branchCount - 1;
    while (lo <= hi) {
        var mid = (lo + hi) >>> 1;
        var midVal = decodeTree[mid];
        if (midVal < char) {
            lo = mid + 1;
        }
        else if (midVal > char) {
            hi = mid - 1;
        }
        else {
            return decodeTree[mid + branchCount];
        }
    }
    return -1;
}
exports.determineBranch = determineBranch;
var htmlDecoder = getDecoder(decode_data_html_js_1.default);
var xmlDecoder = getDecoder(decode_data_xml_js_1.default);
/**
 * Decodes an HTML string.
 *
 * @param str The string to decode.
 * @param mode The decoding mode.
 * @returns The decoded string.
 */
function decodeHTML(str, mode) {
    if (mode === void 0) { mode = DecodingMode.Legacy; }
    return htmlDecoder(str, mode);
}
exports.decodeHTML = decodeHTML;
/**
 * Decodes an HTML string in an attribute.
 *
 * @param str The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLAttribute(str) {
    return htmlDecoder(str, DecodingMode.Attribute);
}
exports.decodeHTMLAttribute = decodeHTMLAttribute;
/**
 * Decodes an HTML string, requiring all entities to be terminated by a semicolon.
 *
 * @param str The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLStrict(str) {
    return htmlDecoder(str, DecodingMode.Strict);
}
exports.decodeHTMLStrict = decodeHTMLStrict;
/**
 * Decodes an XML string, requiring all entities to be terminated by a semicolon.
 *
 * @param str The string to decode.
 * @returns The decoded string.
 */
function decodeXML(str) {
    return xmlDecoder(str, DecodingMode.Strict);
}
exports.decodeXML = decodeXML;

},{"./decode_codepoint.js":4,"./generated/decode-data-html.js":7,"./generated/decode-data-xml.js":8}],4:[function(require,module,exports){
"use strict";
// Adapted from https://github.com/mathiasbynens/he/blob/36afe179392226cf1b6ccdb16ebbb7a5a844d93a/src/he.js#L106-L134
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceCodePoint = exports.fromCodePoint = void 0;
var decodeMap = new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376],
]);
/**
 * Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
 */
exports.fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
(_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function (codePoint) {
    var output = "";
    if (codePoint > 0xffff) {
        codePoint -= 0x10000;
        output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
        codePoint = 0xdc00 | (codePoint & 0x3ff);
    }
    output += String.fromCharCode(codePoint);
    return output;
};
/**
 * Replace the given code point with a replacement character if it is a
 * surrogate or is outside the valid range. Otherwise return the code
 * point unchanged.
 */
function replaceCodePoint(codePoint) {
    var _a;
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return 0xfffd;
    }
    return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
}
exports.replaceCodePoint = replaceCodePoint;
/**
 * Replace the code point if relevant, then convert it to a string.
 *
 * @deprecated Use `fromCodePoint(replaceCodePoint(codePoint))` instead.
 * @param codePoint The code point to decode.
 * @returns The decoded code point.
 */
function decodeCodePoint(codePoint) {
    return (0, exports.fromCodePoint)(replaceCodePoint(codePoint));
}
exports.default = decodeCodePoint;

},{}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeNonAsciiHTML = exports.encodeHTML = void 0;
var encode_html_js_1 = __importDefault(require("./generated/encode-html.js"));
var escape_js_1 = require("./escape.js");
var htmlReplacer = /[\t\n!-,./:-@[-`\f{-}$\x80-\uFFFF]/g;
/**
 * Encodes all characters in the input using HTML entities. This includes
 * characters that are valid ASCII characters in HTML documents, such as `#`.
 *
 * To get a more compact output, consider using the `encodeNonAsciiHTML`
 * function, which will only encode characters that are not valid in HTML
 * documents, as well as non-ASCII characters.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
function encodeHTML(data) {
    return encodeHTMLTrieRe(htmlReplacer, data);
}
exports.encodeHTML = encodeHTML;
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities. This function will not encode characters that
 * are valid in HTML documents, such as `#`.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
function encodeNonAsciiHTML(data) {
    return encodeHTMLTrieRe(escape_js_1.xmlReplacer, data);
}
exports.encodeNonAsciiHTML = encodeNonAsciiHTML;
function encodeHTMLTrieRe(regExp, str) {
    var ret = "";
    var lastIdx = 0;
    var match;
    while ((match = regExp.exec(str)) !== null) {
        var i = match.index;
        ret += str.substring(lastIdx, i);
        var char = str.charCodeAt(i);
        var next = encode_html_js_1.default.get(char);
        if (typeof next === "object") {
            // We are in a branch. Try to match the next char.
            if (i + 1 < str.length) {
                var nextChar = str.charCodeAt(i + 1);
                var value = typeof next.n === "number"
                    ? next.n === nextChar
                        ? next.o
                        : undefined
                    : next.n.get(nextChar);
                if (value !== undefined) {
                    ret += value;
                    lastIdx = regExp.lastIndex += 1;
                    continue;
                }
            }
            next = next.v;
        }
        // We might have a tree node without a value; skip and use a numeric entity.
        if (next !== undefined) {
            ret += next;
            lastIdx = i + 1;
        }
        else {
            var cp = (0, escape_js_1.getCodePoint)(str, i);
            ret += "&#x".concat(cp.toString(16), ";");
            // Increase by 1 if we have a surrogate pair
            lastIdx = regExp.lastIndex += Number(cp !== char);
        }
    }
    return ret + str.substr(lastIdx);
}

},{"./escape.js":6,"./generated/encode-html.js":9}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeText = exports.escapeAttribute = exports.escapeUTF8 = exports.escape = exports.encodeXML = exports.getCodePoint = exports.xmlReplacer = void 0;
exports.xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [39, "&apos;"],
    [60, "&lt;"],
    [62, "&gt;"],
]);
// For compatibility with node < 4, we wrap `codePointAt`
exports.getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null
    ? function (str, index) { return str.codePointAt(index); }
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function (c, index) {
            return (c.charCodeAt(index) & 0xfc00) === 0xd800
                ? (c.charCodeAt(index) - 0xd800) * 0x400 +
                    c.charCodeAt(index + 1) -
                    0xdc00 +
                    0x10000
                : c.charCodeAt(index);
        };
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
function encodeXML(str) {
    var ret = "";
    var lastIdx = 0;
    var match;
    while ((match = exports.xmlReplacer.exec(str)) !== null) {
        var i = match.index;
        var char = str.charCodeAt(i);
        var next = xmlCodeMap.get(char);
        if (next !== undefined) {
            ret += str.substring(lastIdx, i) + next;
            lastIdx = i + 1;
        }
        else {
            ret += "".concat(str.substring(lastIdx, i), "&#x").concat((0, exports.getCodePoint)(str, i).toString(16), ";");
            // Increase by 1 if we have a surrogate pair
            lastIdx = exports.xmlReplacer.lastIndex += Number((char & 0xfc00) === 0xd800);
        }
    }
    return ret + str.substr(lastIdx);
}
exports.encodeXML = encodeXML;
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
exports.escape = encodeXML;
/**
 * Creates a function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 *
 * @param regex Regular expression to match characters to escape.
 * @param map Map of characters to escape to their entities.
 *
 * @returns Function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 */
function getEscaper(regex, map) {
    return function escape(data) {
        var match;
        var lastIdx = 0;
        var result = "";
        while ((match = regex.exec(data))) {
            if (lastIdx !== match.index) {
                result += data.substring(lastIdx, match.index);
            }
            // We know that this character will be in the map.
            result += map.get(match[0].charCodeAt(0));
            // Every match will be of length 1
            lastIdx = match.index + 1;
        }
        return result + data.substring(lastIdx);
    };
}
/**
 * Encodes all characters not valid in XML documents using XML entities.
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
exports.escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
/**
 * Encodes all characters that have to be escaped in HTML attributes,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
exports.escapeAttribute = getEscaper(/["&\u00A0]/g, new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [160, "&nbsp;"],
]));
/**
 * Encodes all characters that have to be escaped in HTML text,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
exports.escapeText = getEscaper(/[&<>\u00A0]/g, new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [160, "&nbsp;"],
]));

},{}],7:[function(require,module,exports){
"use strict";
// Generated using scripts/write-decode-map.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new Uint16Array(
// prettier-ignore
"\u1d41<\xd5\u0131\u028a\u049d\u057b\u05d0\u0675\u06de\u07a2\u07d6\u080f\u0a4a\u0a91\u0da1\u0e6d\u0f09\u0f26\u10ca\u1228\u12e1\u1415\u149d\u14c3\u14df\u1525\0\0\0\0\0\0\u156b\u16cd\u198d\u1c12\u1ddd\u1f7e\u2060\u21b0\u228d\u23c0\u23fb\u2442\u2824\u2912\u2d08\u2e48\u2fce\u3016\u32ba\u3639\u37ac\u38fe\u3a28\u3a71\u3ae0\u3b2e\u0800EMabcfglmnoprstu\\bfms\x7f\x84\x8b\x90\x95\x98\xa6\xb3\xb9\xc8\xcflig\u803b\xc6\u40c6P\u803b&\u4026cute\u803b\xc1\u40c1reve;\u4102\u0100iyx}rc\u803b\xc2\u40c2;\u4410r;\uc000\ud835\udd04rave\u803b\xc0\u40c0pha;\u4391acr;\u4100d;\u6a53\u0100gp\x9d\xa1on;\u4104f;\uc000\ud835\udd38plyFunction;\u6061ing\u803b\xc5\u40c5\u0100cs\xbe\xc3r;\uc000\ud835\udc9cign;\u6254ilde\u803b\xc3\u40c3ml\u803b\xc4\u40c4\u0400aceforsu\xe5\xfb\xfe\u0117\u011c\u0122\u0127\u012a\u0100cr\xea\xf2kslash;\u6216\u0176\xf6\xf8;\u6ae7ed;\u6306y;\u4411\u0180crt\u0105\u010b\u0114ause;\u6235noullis;\u612ca;\u4392r;\uc000\ud835\udd05pf;\uc000\ud835\udd39eve;\u42d8c\xf2\u0113mpeq;\u624e\u0700HOacdefhilorsu\u014d\u0151\u0156\u0180\u019e\u01a2\u01b5\u01b7\u01ba\u01dc\u0215\u0273\u0278\u027ecy;\u4427PY\u803b\xa9\u40a9\u0180cpy\u015d\u0162\u017aute;\u4106\u0100;i\u0167\u0168\u62d2talDifferentialD;\u6145leys;\u612d\u0200aeio\u0189\u018e\u0194\u0198ron;\u410cdil\u803b\xc7\u40c7rc;\u4108nint;\u6230ot;\u410a\u0100dn\u01a7\u01adilla;\u40b8terDot;\u40b7\xf2\u017fi;\u43a7rcle\u0200DMPT\u01c7\u01cb\u01d1\u01d6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01e2\u01f8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020foubleQuote;\u601duote;\u6019\u0200lnpu\u021e\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6a74\u0180git\u022f\u0236\u023aruent;\u6261nt;\u622fourIntegral;\u622e\u0100fr\u024c\u024e;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6a2fcr;\uc000\ud835\udc9ep\u0100;C\u0284\u0285\u62d3ap;\u624d\u0580DJSZacefios\u02a0\u02ac\u02b0\u02b4\u02b8\u02cb\u02d7\u02e1\u02e6\u0333\u048d\u0100;o\u0179\u02a5trahd;\u6911cy;\u4402cy;\u4405cy;\u440f\u0180grs\u02bf\u02c4\u02c7ger;\u6021r;\u61a1hv;\u6ae4\u0100ay\u02d0\u02d5ron;\u410e;\u4414l\u0100;t\u02dd\u02de\u6207a;\u4394r;\uc000\ud835\udd07\u0100af\u02eb\u0327\u0100cm\u02f0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031ccute;\u40b4o\u0174\u030b\u030d;\u42d9bleAcute;\u42ddrave;\u4060ilde;\u42dcond;\u62c4ferentialD;\u6146\u0470\u033d\0\0\0\u0342\u0354\0\u0405f;\uc000\ud835\udd3b\u0180;DE\u0348\u0349\u034d\u40a8ot;\u60dcqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03cf\u03e2\u03f8ontourIntegra\xec\u0239o\u0274\u0379\0\0\u037b\xbb\u0349nArrow;\u61d3\u0100eo\u0387\u03a4ft\u0180ART\u0390\u0396\u03a1rrow;\u61d0ightArrow;\u61d4e\xe5\u02cang\u0100LR\u03ab\u03c4eft\u0100AR\u03b3\u03b9rrow;\u67f8ightArrow;\u67faightArrow;\u67f9ight\u0100AT\u03d8\u03derrow;\u61d2ee;\u62a8p\u0241\u03e9\0\0\u03efrrow;\u61d1ownArrow;\u61d5erticalBar;\u6225n\u0300ABLRTa\u0412\u042a\u0430\u045e\u047f\u037crrow\u0180;BU\u041d\u041e\u0422\u6193ar;\u6913pArrow;\u61f5reve;\u4311eft\u02d2\u043a\0\u0446\0\u0450ightVector;\u6950eeVector;\u695eector\u0100;B\u0459\u045a\u61bdar;\u6956ight\u01d4\u0467\0\u0471eeVector;\u695fector\u0100;B\u047a\u047b\u61c1ar;\u6957ee\u0100;A\u0486\u0487\u62a4rrow;\u61a7\u0100ct\u0492\u0497r;\uc000\ud835\udc9frok;\u4110\u0800NTacdfglmopqstux\u04bd\u04c0\u04c4\u04cb\u04de\u04e2\u04e7\u04ee\u04f5\u0521\u052f\u0536\u0552\u055d\u0560\u0565G;\u414aH\u803b\xd0\u40d0cute\u803b\xc9\u40c9\u0180aiy\u04d2\u04d7\u04dcron;\u411arc\u803b\xca\u40ca;\u442dot;\u4116r;\uc000\ud835\udd08rave\u803b\xc8\u40c8ement;\u6208\u0100ap\u04fa\u04fecr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65fberySmallSquare;\u65ab\u0100gp\u0526\u052aon;\u4118f;\uc000\ud835\udd3csilon;\u4395u\u0100ai\u053c\u0549l\u0100;T\u0542\u0543\u6a75ilde;\u6242librium;\u61cc\u0100ci\u0557\u055ar;\u6130m;\u6a73a;\u4397ml\u803b\xcb\u40cb\u0100ip\u056a\u056fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058d\u05b2\u05ccy;\u4424r;\uc000\ud835\udd09lled\u0253\u0597\0\0\u05a3mallSquare;\u65fcerySmallSquare;\u65aa\u0370\u05ba\0\u05bf\0\0\u05c4f;\uc000\ud835\udd3dAll;\u6200riertrf;\u6131c\xf2\u05cb\u0600JTabcdfgorst\u05e8\u05ec\u05ef\u05fa\u0600\u0612\u0616\u061b\u061d\u0623\u066c\u0672cy;\u4403\u803b>\u403emma\u0100;d\u05f7\u05f8\u4393;\u43dcreve;\u411e\u0180eiy\u0607\u060c\u0610dil;\u4122rc;\u411c;\u4413ot;\u4120r;\uc000\ud835\udd0a;\u62d9pf;\uc000\ud835\udd3eeater\u0300EFGLST\u0635\u0644\u064e\u0656\u065b\u0666qual\u0100;L\u063e\u063f\u6265ess;\u62dbullEqual;\u6267reater;\u6aa2ess;\u6277lantEqual;\u6a7eilde;\u6273cr;\uc000\ud835\udca2;\u626b\u0400Aacfiosu\u0685\u068b\u0696\u069b\u069e\u06aa\u06be\u06caRDcy;\u442a\u0100ct\u0690\u0694ek;\u42c7;\u405eirc;\u4124r;\u610clbertSpace;\u610b\u01f0\u06af\0\u06b2f;\u610dizontalLine;\u6500\u0100ct\u06c3\u06c5\xf2\u06a9rok;\u4126mp\u0144\u06d0\u06d8ownHum\xf0\u012fqual;\u624f\u0700EJOacdfgmnostu\u06fa\u06fe\u0703\u0707\u070e\u071a\u071e\u0721\u0728\u0744\u0778\u078b\u078f\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803b\xcd\u40cd\u0100iy\u0713\u0718rc\u803b\xce\u40ce;\u4418ot;\u4130r;\u6111rave\u803b\xcc\u40cc\u0180;ap\u0720\u072f\u073f\u0100cg\u0734\u0737r;\u412ainaryI;\u6148lie\xf3\u03dd\u01f4\u0749\0\u0762\u0100;e\u074d\u074e\u622c\u0100gr\u0753\u0758ral;\u622bsection;\u62c2isible\u0100CT\u076c\u0772omma;\u6063imes;\u6062\u0180gpt\u077f\u0783\u0788on;\u412ef;\uc000\ud835\udd40a;\u4399cr;\u6110ilde;\u4128\u01eb\u079a\0\u079ecy;\u4406l\u803b\xcf\u40cf\u0280cfosu\u07ac\u07b7\u07bc\u07c2\u07d0\u0100iy\u07b1\u07b5rc;\u4134;\u4419r;\uc000\ud835\udd0dpf;\uc000\ud835\udd41\u01e3\u07c7\0\u07ccr;\uc000\ud835\udca5rcy;\u4408kcy;\u4404\u0380HJacfos\u07e4\u07e8\u07ec\u07f1\u07fd\u0802\u0808cy;\u4425cy;\u440cppa;\u439a\u0100ey\u07f6\u07fbdil;\u4136;\u441ar;\uc000\ud835\udd0epf;\uc000\ud835\udd42cr;\uc000\ud835\udca6\u0580JTaceflmost\u0825\u0829\u082c\u0850\u0863\u09b3\u09b8\u09c7\u09cd\u0a37\u0a47cy;\u4409\u803b<\u403c\u0280cmnpr\u0837\u083c\u0841\u0844\u084dute;\u4139bda;\u439bg;\u67ealacetrf;\u6112r;\u619e\u0180aey\u0857\u085c\u0861ron;\u413ddil;\u413b;\u441b\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087e\u08a9\u08b1\u08e0\u08e6\u08fc\u092f\u095b\u0390\u096a\u0100nr\u0883\u088fgleBracket;\u67e8row\u0180;BR\u0899\u089a\u089e\u6190ar;\u61e4ightArrow;\u61c6eiling;\u6308o\u01f5\u08b7\0\u08c3bleBracket;\u67e6n\u01d4\u08c8\0\u08d2eeVector;\u6961ector\u0100;B\u08db\u08dc\u61c3ar;\u6959loor;\u630aight\u0100AV\u08ef\u08f5rrow;\u6194ector;\u694e\u0100er\u0901\u0917e\u0180;AV\u0909\u090a\u0910\u62a3rrow;\u61a4ector;\u695aiangle\u0180;BE\u0924\u0925\u0929\u62b2ar;\u69cfqual;\u62b4p\u0180DTV\u0937\u0942\u094cownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61bfar;\u6958ector\u0100;B\u0965\u0966\u61bcar;\u6952ight\xe1\u039cs\u0300EFGLST\u097e\u098b\u0995\u099d\u09a2\u09adqualGreater;\u62daullEqual;\u6266reater;\u6276ess;\u6aa1lantEqual;\u6a7dilde;\u6272r;\uc000\ud835\udd0f\u0100;e\u09bd\u09be\u62d8ftarrow;\u61daidot;\u413f\u0180npw\u09d4\u0a16\u0a1bg\u0200LRlr\u09de\u09f7\u0a02\u0a10eft\u0100AR\u09e6\u09ecrrow;\u67f5ightArrow;\u67f7ightArrow;\u67f6eft\u0100ar\u03b3\u0a0aight\xe1\u03bfight\xe1\u03caf;\uc000\ud835\udd43er\u0100LR\u0a22\u0a2ceftArrow;\u6199ightArrow;\u6198\u0180cht\u0a3e\u0a40\u0a42\xf2\u084c;\u61b0rok;\u4141;\u626a\u0400acefiosu\u0a5a\u0a5d\u0a60\u0a77\u0a7c\u0a85\u0a8b\u0a8ep;\u6905y;\u441c\u0100dl\u0a65\u0a6fiumSpace;\u605flintrf;\u6133r;\uc000\ud835\udd10nusPlus;\u6213pf;\uc000\ud835\udd44c\xf2\u0a76;\u439c\u0480Jacefostu\u0aa3\u0aa7\u0aad\u0ac0\u0b14\u0b19\u0d91\u0d97\u0d9ecy;\u440acute;\u4143\u0180aey\u0ab4\u0ab9\u0aberon;\u4147dil;\u4145;\u441d\u0180gsw\u0ac7\u0af0\u0b0eative\u0180MTV\u0ad3\u0adf\u0ae8ediumSpace;\u600bhi\u0100cn\u0ae6\u0ad8\xeb\u0ad9eryThi\xee\u0ad9ted\u0100GL\u0af8\u0b06reaterGreate\xf2\u0673essLes\xf3\u0a48Line;\u400ar;\uc000\ud835\udd11\u0200Bnpt\u0b22\u0b28\u0b37\u0b3areak;\u6060BreakingSpace;\u40a0f;\u6115\u0680;CDEGHLNPRSTV\u0b55\u0b56\u0b6a\u0b7c\u0ba1\u0beb\u0c04\u0c5e\u0c84\u0ca6\u0cd8\u0d61\u0d85\u6aec\u0100ou\u0b5b\u0b64ngruent;\u6262pCap;\u626doubleVerticalBar;\u6226\u0180lqx\u0b83\u0b8a\u0b9bement;\u6209ual\u0100;T\u0b92\u0b93\u6260ilde;\uc000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0bb6\u0bb7\u0bbd\u0bc9\u0bd3\u0bd8\u0be5\u626fqual;\u6271ullEqual;\uc000\u2267\u0338reater;\uc000\u226b\u0338ess;\u6279lantEqual;\uc000\u2a7e\u0338ilde;\u6275ump\u0144\u0bf2\u0bfdownHump;\uc000\u224e\u0338qual;\uc000\u224f\u0338e\u0100fs\u0c0a\u0c27tTriangle\u0180;BE\u0c1a\u0c1b\u0c21\u62eaar;\uc000\u29cf\u0338qual;\u62ecs\u0300;EGLST\u0c35\u0c36\u0c3c\u0c44\u0c4b\u0c58\u626equal;\u6270reater;\u6278ess;\uc000\u226a\u0338lantEqual;\uc000\u2a7d\u0338ilde;\u6274ested\u0100GL\u0c68\u0c79reaterGreater;\uc000\u2aa2\u0338essLess;\uc000\u2aa1\u0338recedes\u0180;ES\u0c92\u0c93\u0c9b\u6280qual;\uc000\u2aaf\u0338lantEqual;\u62e0\u0100ei\u0cab\u0cb9verseElement;\u620cghtTriangle\u0180;BE\u0ccb\u0ccc\u0cd2\u62ebar;\uc000\u29d0\u0338qual;\u62ed\u0100qu\u0cdd\u0d0cuareSu\u0100bp\u0ce8\u0cf9set\u0100;E\u0cf0\u0cf3\uc000\u228f\u0338qual;\u62e2erset\u0100;E\u0d03\u0d06\uc000\u2290\u0338qual;\u62e3\u0180bcp\u0d13\u0d24\u0d4eset\u0100;E\u0d1b\u0d1e\uc000\u2282\u20d2qual;\u6288ceeds\u0200;EST\u0d32\u0d33\u0d3b\u0d46\u6281qual;\uc000\u2ab0\u0338lantEqual;\u62e1ilde;\uc000\u227f\u0338erset\u0100;E\u0d58\u0d5b\uc000\u2283\u20d2qual;\u6289ilde\u0200;EFT\u0d6e\u0d6f\u0d75\u0d7f\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uc000\ud835\udca9ilde\u803b\xd1\u40d1;\u439d\u0700Eacdfgmoprstuv\u0dbd\u0dc2\u0dc9\u0dd5\u0ddb\u0de0\u0de7\u0dfc\u0e02\u0e20\u0e22\u0e32\u0e3f\u0e44lig;\u4152cute\u803b\xd3\u40d3\u0100iy\u0dce\u0dd3rc\u803b\xd4\u40d4;\u441eblac;\u4150r;\uc000\ud835\udd12rave\u803b\xd2\u40d2\u0180aei\u0dee\u0df2\u0df6cr;\u414cga;\u43a9cron;\u439fpf;\uc000\ud835\udd46enCurly\u0100DQ\u0e0e\u0e1aoubleQuote;\u601cuote;\u6018;\u6a54\u0100cl\u0e27\u0e2cr;\uc000\ud835\udcaaash\u803b\xd8\u40d8i\u016c\u0e37\u0e3cde\u803b\xd5\u40d5es;\u6a37ml\u803b\xd6\u40d6er\u0100BP\u0e4b\u0e60\u0100ar\u0e50\u0e53r;\u603eac\u0100ek\u0e5a\u0e5c;\u63deet;\u63b4arenthesis;\u63dc\u0480acfhilors\u0e7f\u0e87\u0e8a\u0e8f\u0e92\u0e94\u0e9d\u0eb0\u0efcrtialD;\u6202y;\u441fr;\uc000\ud835\udd13i;\u43a6;\u43a0usMinus;\u40b1\u0100ip\u0ea2\u0eadncareplan\xe5\u069df;\u6119\u0200;eio\u0eb9\u0eba\u0ee0\u0ee4\u6abbcedes\u0200;EST\u0ec8\u0ec9\u0ecf\u0eda\u627aqual;\u6aaflantEqual;\u627cilde;\u627eme;\u6033\u0100dp\u0ee9\u0eeeuct;\u620fortion\u0100;a\u0225\u0ef9l;\u621d\u0100ci\u0f01\u0f06r;\uc000\ud835\udcab;\u43a8\u0200Ufos\u0f11\u0f16\u0f1b\u0f1fOT\u803b\"\u4022r;\uc000\ud835\udd14pf;\u611acr;\uc000\ud835\udcac\u0600BEacefhiorsu\u0f3e\u0f43\u0f47\u0f60\u0f73\u0fa7\u0faa\u0fad\u1096\u10a9\u10b4\u10bearr;\u6910G\u803b\xae\u40ae\u0180cnr\u0f4e\u0f53\u0f56ute;\u4154g;\u67ebr\u0100;t\u0f5c\u0f5d\u61a0l;\u6916\u0180aey\u0f67\u0f6c\u0f71ron;\u4158dil;\u4156;\u4420\u0100;v\u0f78\u0f79\u611cerse\u0100EU\u0f82\u0f99\u0100lq\u0f87\u0f8eement;\u620builibrium;\u61cbpEquilibrium;\u696fr\xbb\u0f79o;\u43a1ght\u0400ACDFTUVa\u0fc1\u0feb\u0ff3\u1022\u1028\u105b\u1087\u03d8\u0100nr\u0fc6\u0fd2gleBracket;\u67e9row\u0180;BL\u0fdc\u0fdd\u0fe1\u6192ar;\u61e5eftArrow;\u61c4eiling;\u6309o\u01f5\u0ff9\0\u1005bleBracket;\u67e7n\u01d4\u100a\0\u1014eeVector;\u695dector\u0100;B\u101d\u101e\u61c2ar;\u6955loor;\u630b\u0100er\u102d\u1043e\u0180;AV\u1035\u1036\u103c\u62a2rrow;\u61a6ector;\u695biangle\u0180;BE\u1050\u1051\u1055\u62b3ar;\u69d0qual;\u62b5p\u0180DTV\u1063\u106e\u1078ownVector;\u694feeVector;\u695cector\u0100;B\u1082\u1083\u61bear;\u6954ector\u0100;B\u1091\u1092\u61c0ar;\u6953\u0100pu\u109b\u109ef;\u611dndImplies;\u6970ightarrow;\u61db\u0100ch\u10b9\u10bcr;\u611b;\u61b1leDelayed;\u69f4\u0680HOacfhimoqstu\u10e4\u10f1\u10f7\u10fd\u1119\u111e\u1151\u1156\u1161\u1167\u11b5\u11bb\u11bf\u0100Cc\u10e9\u10eeHcy;\u4429y;\u4428FTcy;\u442ccute;\u415a\u0280;aeiy\u1108\u1109\u110e\u1113\u1117\u6abcron;\u4160dil;\u415erc;\u415c;\u4421r;\uc000\ud835\udd16ort\u0200DLRU\u112a\u1134\u113e\u1149ownArrow\xbb\u041eeftArrow\xbb\u089aightArrow\xbb\u0fddpArrow;\u6191gma;\u43a3allCircle;\u6218pf;\uc000\ud835\udd4a\u0272\u116d\0\0\u1170t;\u621aare\u0200;ISU\u117b\u117c\u1189\u11af\u65a1ntersection;\u6293u\u0100bp\u118f\u119eset\u0100;E\u1197\u1198\u628fqual;\u6291erset\u0100;E\u11a8\u11a9\u6290qual;\u6292nion;\u6294cr;\uc000\ud835\udcaear;\u62c6\u0200bcmp\u11c8\u11db\u1209\u120b\u0100;s\u11cd\u11ce\u62d0et\u0100;E\u11cd\u11d5qual;\u6286\u0100ch\u11e0\u1205eeds\u0200;EST\u11ed\u11ee\u11f4\u11ff\u627bqual;\u6ab0lantEqual;\u627dilde;\u627fTh\xe1\u0f8c;\u6211\u0180;es\u1212\u1213\u1223\u62d1rset\u0100;E\u121c\u121d\u6283qual;\u6287et\xbb\u1213\u0580HRSacfhiors\u123e\u1244\u1249\u1255\u125e\u1271\u1276\u129f\u12c2\u12c8\u12d1ORN\u803b\xde\u40deADE;\u6122\u0100Hc\u124e\u1252cy;\u440by;\u4426\u0100bu\u125a\u125c;\u4009;\u43a4\u0180aey\u1265\u126a\u126fron;\u4164dil;\u4162;\u4422r;\uc000\ud835\udd17\u0100ei\u127b\u1289\u01f2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128e\u1298kSpace;\uc000\u205f\u200aSpace;\u6009lde\u0200;EFT\u12ab\u12ac\u12b2\u12bc\u623cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uc000\ud835\udd4bipleDot;\u60db\u0100ct\u12d6\u12dbr;\uc000\ud835\udcafrok;\u4166\u0ae1\u12f7\u130e\u131a\u1326\0\u132c\u1331\0\0\0\0\0\u1338\u133d\u1377\u1385\0\u13ff\u1404\u140a\u1410\u0100cr\u12fb\u1301ute\u803b\xda\u40dar\u0100;o\u1307\u1308\u619fcir;\u6949r\u01e3\u1313\0\u1316y;\u440eve;\u416c\u0100iy\u131e\u1323rc\u803b\xdb\u40db;\u4423blac;\u4170r;\uc000\ud835\udd18rave\u803b\xd9\u40d9acr;\u416a\u0100di\u1341\u1369er\u0100BP\u1348\u135d\u0100ar\u134d\u1350r;\u405fac\u0100ek\u1357\u1359;\u63dfet;\u63b5arenthesis;\u63ddon\u0100;P\u1370\u1371\u62c3lus;\u628e\u0100gp\u137b\u137fon;\u4172f;\uc000\ud835\udd4c\u0400ADETadps\u1395\u13ae\u13b8\u13c4\u03e8\u13d2\u13d7\u13f3rrow\u0180;BD\u1150\u13a0\u13a4ar;\u6912ownArrow;\u61c5ownArrow;\u6195quilibrium;\u696eee\u0100;A\u13cb\u13cc\u62a5rrow;\u61a5own\xe1\u03f3er\u0100LR\u13de\u13e8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13f9\u13fa\u43d2on;\u43a5ing;\u416ecr;\uc000\ud835\udcb0ilde;\u4168ml\u803b\xdc\u40dc\u0480Dbcdefosv\u1427\u142c\u1430\u1433\u143e\u1485\u148a\u1490\u1496ash;\u62abar;\u6aeby;\u4412ash\u0100;l\u143b\u143c\u62a9;\u6ae6\u0100er\u1443\u1445;\u62c1\u0180bty\u144c\u1450\u147aar;\u6016\u0100;i\u144f\u1455cal\u0200BLST\u1461\u1465\u146a\u1474ar;\u6223ine;\u407ceparator;\u6758ilde;\u6240ThinSpace;\u600ar;\uc000\ud835\udd19pf;\uc000\ud835\udd4dcr;\uc000\ud835\udcb1dash;\u62aa\u0280cefos\u14a7\u14ac\u14b1\u14b6\u14bcirc;\u4174dge;\u62c0r;\uc000\ud835\udd1apf;\uc000\ud835\udd4ecr;\uc000\ud835\udcb2\u0200fios\u14cb\u14d0\u14d2\u14d8r;\uc000\ud835\udd1b;\u439epf;\uc000\ud835\udd4fcr;\uc000\ud835\udcb3\u0480AIUacfosu\u14f1\u14f5\u14f9\u14fd\u1504\u150f\u1514\u151a\u1520cy;\u442fcy;\u4407cy;\u442ecute\u803b\xdd\u40dd\u0100iy\u1509\u150drc;\u4176;\u442br;\uc000\ud835\udd1cpf;\uc000\ud835\udd50cr;\uc000\ud835\udcb4ml;\u4178\u0400Hacdefos\u1535\u1539\u153f\u154b\u154f\u155d\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417d;\u4417ot;\u417b\u01f2\u1554\0\u155boWidt\xe8\u0ad9a;\u4396r;\u6128pf;\u6124cr;\uc000\ud835\udcb5\u0be1\u1583\u158a\u1590\0\u15b0\u15b6\u15bf\0\0\0\0\u15c6\u15db\u15eb\u165f\u166d\0\u1695\u169b\u16b2\u16b9\0\u16becute\u803b\xe1\u40e1reve;\u4103\u0300;Ediuy\u159c\u159d\u15a1\u15a3\u15a8\u15ad\u623e;\uc000\u223e\u0333;\u623frc\u803b\xe2\u40e2te\u80bb\xb4\u0306;\u4430lig\u803b\xe6\u40e6\u0100;r\xb2\u15ba;\uc000\ud835\udd1erave\u803b\xe0\u40e0\u0100ep\u15ca\u15d6\u0100fp\u15cf\u15d4sym;\u6135\xe8\u15d3ha;\u43b1\u0100ap\u15dfc\u0100cl\u15e4\u15e7r;\u4101g;\u6a3f\u0264\u15f0\0\0\u160a\u0280;adsv\u15fa\u15fb\u15ff\u1601\u1607\u6227nd;\u6a55;\u6a5clope;\u6a58;\u6a5a\u0380;elmrsz\u1618\u1619\u161b\u161e\u163f\u164f\u1659\u6220;\u69a4e\xbb\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163a\u163c\u163e;\u69a8;\u69a9;\u69aa;\u69ab;\u69ac;\u69ad;\u69ae;\u69aft\u0100;v\u1645\u1646\u621fb\u0100;d\u164c\u164d\u62be;\u699d\u0100pt\u1654\u1657h;\u6222\xbb\xb9arr;\u637c\u0100gp\u1663\u1667on;\u4105f;\uc000\ud835\udd52\u0380;Eaeiop\u12c1\u167b\u167d\u1682\u1684\u1687\u168a;\u6a70cir;\u6a6f;\u624ad;\u624bs;\u4027rox\u0100;e\u12c1\u1692\xf1\u1683ing\u803b\xe5\u40e5\u0180cty\u16a1\u16a6\u16a8r;\uc000\ud835\udcb6;\u402amp\u0100;e\u12c1\u16af\xf1\u0288ilde\u803b\xe3\u40e3ml\u803b\xe4\u40e4\u0100ci\u16c2\u16c8onin\xf4\u0272nt;\u6a11\u0800Nabcdefiklnoprsu\u16ed\u16f1\u1730\u173c\u1743\u1748\u1778\u177d\u17e0\u17e6\u1839\u1850\u170d\u193d\u1948\u1970ot;\u6aed\u0100cr\u16f6\u171ek\u0200ceps\u1700\u1705\u170d\u1713ong;\u624cpsilon;\u43f6rime;\u6035im\u0100;e\u171a\u171b\u623dq;\u62cd\u0176\u1722\u1726ee;\u62bded\u0100;g\u172c\u172d\u6305e\xbb\u172drk\u0100;t\u135c\u1737brk;\u63b6\u0100oy\u1701\u1741;\u4431quo;\u601e\u0280cmprt\u1753\u175b\u1761\u1764\u1768aus\u0100;e\u010a\u0109ptyv;\u69b0s\xe9\u170cno\xf5\u0113\u0180ahw\u176f\u1771\u1773;\u43b2;\u6136een;\u626cr;\uc000\ud835\udd1fg\u0380costuvw\u178d\u179d\u17b3\u17c1\u17d5\u17db\u17de\u0180aiu\u1794\u1796\u179a\xf0\u0760rc;\u65efp\xbb\u1371\u0180dpt\u17a4\u17a8\u17adot;\u6a00lus;\u6a01imes;\u6a02\u0271\u17b9\0\0\u17becup;\u6a06ar;\u6605riangle\u0100du\u17cd\u17d2own;\u65bdp;\u65b3plus;\u6a04e\xe5\u1444\xe5\u14adarow;\u690d\u0180ako\u17ed\u1826\u1835\u0100cn\u17f2\u1823k\u0180lst\u17fa\u05ab\u1802ozenge;\u69ebriangle\u0200;dlr\u1812\u1813\u1818\u181d\u65b4own;\u65beeft;\u65c2ight;\u65b8k;\u6423\u01b1\u182b\0\u1833\u01b2\u182f\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183e\u184d\u0100;q\u1843\u1846\uc000=\u20e5uiv;\uc000\u2261\u20e5t;\u6310\u0200ptwx\u1859\u185e\u1867\u186cf;\uc000\ud835\udd53\u0100;t\u13cb\u1863om\xbb\u13cctie;\u62c8\u0600DHUVbdhmptuv\u1885\u1896\u18aa\u18bb\u18d7\u18db\u18ec\u18ff\u1905\u190a\u1910\u1921\u0200LRlr\u188e\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18a1\u18a2\u18a4\u18a6\u18a8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18b3\u18b5\u18b7\u18b9;\u655d;\u655a;\u655c;\u6559\u0380;HLRhlr\u18ca\u18cb\u18cd\u18cf\u18d1\u18d3\u18d5\u6551;\u656c;\u6563;\u6560;\u656b;\u6562;\u655fox;\u69c9\u0200LRlr\u18e4\u18e6\u18e8\u18ea;\u6555;\u6552;\u6510;\u650c\u0280;DUdu\u06bd\u18f7\u18f9\u18fb\u18fd;\u6565;\u6568;\u652c;\u6534inus;\u629flus;\u629eimes;\u62a0\u0200LRlr\u1919\u191b\u191d\u191f;\u655b;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193b\u6502;\u656a;\u6561;\u655e;\u653c;\u6524;\u651c\u0100ev\u0123\u1942bar\u803b\xa6\u40a6\u0200ceio\u1951\u1956\u195a\u1960r;\uc000\ud835\udcb7mi;\u604fm\u0100;e\u171a\u171cl\u0180;bh\u1968\u1969\u196b\u405c;\u69c5sub;\u67c8\u016c\u1974\u197el\u0100;e\u1979\u197a\u6022t\xbb\u197ap\u0180;Ee\u012f\u1985\u1987;\u6aae\u0100;q\u06dc\u06db\u0ce1\u19a7\0\u19e8\u1a11\u1a15\u1a32\0\u1a37\u1a50\0\0\u1ab4\0\0\u1ac1\0\0\u1b21\u1b2e\u1b4d\u1b52\0\u1bfd\0\u1c0c\u0180cpr\u19ad\u19b2\u19ddute;\u4107\u0300;abcds\u19bf\u19c0\u19c4\u19ca\u19d5\u19d9\u6229nd;\u6a44rcup;\u6a49\u0100au\u19cf\u19d2p;\u6a4bp;\u6a47ot;\u6a40;\uc000\u2229\ufe00\u0100eo\u19e2\u19e5t;\u6041\xee\u0693\u0200aeiu\u19f0\u19fb\u1a01\u1a05\u01f0\u19f5\0\u19f8s;\u6a4don;\u410ddil\u803b\xe7\u40e7rc;\u4109ps\u0100;s\u1a0c\u1a0d\u6a4cm;\u6a50ot;\u410b\u0180dmn\u1a1b\u1a20\u1a26il\u80bb\xb8\u01adptyv;\u69b2t\u8100\xa2;e\u1a2d\u1a2e\u40a2r\xe4\u01b2r;\uc000\ud835\udd20\u0180cei\u1a3d\u1a40\u1a4dy;\u4447ck\u0100;m\u1a47\u1a48\u6713ark\xbb\u1a48;\u43c7r\u0380;Ecefms\u1a5f\u1a60\u1a62\u1a6b\u1aa4\u1aaa\u1aae\u65cb;\u69c3\u0180;el\u1a69\u1a6a\u1a6d\u42c6q;\u6257e\u0261\u1a74\0\0\u1a88rrow\u0100lr\u1a7c\u1a81eft;\u61baight;\u61bb\u0280RSacd\u1a92\u1a94\u1a96\u1a9a\u1a9f\xbb\u0f47;\u64c8st;\u629birc;\u629aash;\u629dnint;\u6a10id;\u6aefcir;\u69c2ubs\u0100;u\u1abb\u1abc\u6663it\xbb\u1abc\u02ec\u1ac7\u1ad4\u1afa\0\u1b0aon\u0100;e\u1acd\u1ace\u403a\u0100;q\xc7\xc6\u026d\u1ad9\0\0\u1ae2a\u0100;t\u1ade\u1adf\u402c;\u4040\u0180;fl\u1ae8\u1ae9\u1aeb\u6201\xee\u1160e\u0100mx\u1af1\u1af6ent\xbb\u1ae9e\xf3\u024d\u01e7\u1afe\0\u1b07\u0100;d\u12bb\u1b02ot;\u6a6dn\xf4\u0246\u0180fry\u1b10\u1b14\u1b17;\uc000\ud835\udd54o\xe4\u0254\u8100\xa9;s\u0155\u1b1dr;\u6117\u0100ao\u1b25\u1b29rr;\u61b5ss;\u6717\u0100cu\u1b32\u1b37r;\uc000\ud835\udcb8\u0100bp\u1b3c\u1b44\u0100;e\u1b41\u1b42\u6acf;\u6ad1\u0100;e\u1b49\u1b4a\u6ad0;\u6ad2dot;\u62ef\u0380delprvw\u1b60\u1b6c\u1b77\u1b82\u1bac\u1bd4\u1bf9arr\u0100lr\u1b68\u1b6a;\u6938;\u6935\u0270\u1b72\0\0\u1b75r;\u62dec;\u62dfarr\u0100;p\u1b7f\u1b80\u61b6;\u693d\u0300;bcdos\u1b8f\u1b90\u1b96\u1ba1\u1ba5\u1ba8\u622arcap;\u6a48\u0100au\u1b9b\u1b9ep;\u6a46p;\u6a4aot;\u628dr;\u6a45;\uc000\u222a\ufe00\u0200alrv\u1bb5\u1bbf\u1bde\u1be3rr\u0100;m\u1bbc\u1bbd\u61b7;\u693cy\u0180evw\u1bc7\u1bd4\u1bd8q\u0270\u1bce\0\0\u1bd2re\xe3\u1b73u\xe3\u1b75ee;\u62ceedge;\u62cfen\u803b\xa4\u40a4earrow\u0100lr\u1bee\u1bf3eft\xbb\u1b80ight\xbb\u1bbde\xe4\u1bdd\u0100ci\u1c01\u1c07onin\xf4\u01f7nt;\u6231lcty;\u632d\u0980AHabcdefhijlorstuwz\u1c38\u1c3b\u1c3f\u1c5d\u1c69\u1c75\u1c8a\u1c9e\u1cac\u1cb7\u1cfb\u1cff\u1d0d\u1d7b\u1d91\u1dab\u1dbb\u1dc6\u1dcdr\xf2\u0381ar;\u6965\u0200glrs\u1c48\u1c4d\u1c52\u1c54ger;\u6020eth;\u6138\xf2\u1133h\u0100;v\u1c5a\u1c5b\u6010\xbb\u090a\u016b\u1c61\u1c67arow;\u690fa\xe3\u0315\u0100ay\u1c6e\u1c73ron;\u410f;\u4434\u0180;ao\u0332\u1c7c\u1c84\u0100gr\u02bf\u1c81r;\u61catseq;\u6a77\u0180glm\u1c91\u1c94\u1c98\u803b\xb0\u40b0ta;\u43b4ptyv;\u69b1\u0100ir\u1ca3\u1ca8sht;\u697f;\uc000\ud835\udd21ar\u0100lr\u1cb3\u1cb5\xbb\u08dc\xbb\u101e\u0280aegsv\u1cc2\u0378\u1cd6\u1cdc\u1ce0m\u0180;os\u0326\u1cca\u1cd4nd\u0100;s\u0326\u1cd1uit;\u6666amma;\u43ddin;\u62f2\u0180;io\u1ce7\u1ce8\u1cf8\u40f7de\u8100\xf7;o\u1ce7\u1cf0ntimes;\u62c7n\xf8\u1cf7cy;\u4452c\u026f\u1d06\0\0\u1d0arn;\u631eop;\u630d\u0280lptuw\u1d18\u1d1d\u1d22\u1d49\u1d55lar;\u4024f;\uc000\ud835\udd55\u0280;emps\u030b\u1d2d\u1d37\u1d3d\u1d42q\u0100;d\u0352\u1d33ot;\u6251inus;\u6238lus;\u6214quare;\u62a1blebarwedg\xe5\xfan\u0180adh\u112e\u1d5d\u1d67ownarrow\xf3\u1c83arpoon\u0100lr\u1d72\u1d76ef\xf4\u1cb4igh\xf4\u1cb6\u0162\u1d7f\u1d85karo\xf7\u0f42\u026f\u1d8a\0\0\u1d8ern;\u631fop;\u630c\u0180cot\u1d98\u1da3\u1da6\u0100ry\u1d9d\u1da1;\uc000\ud835\udcb9;\u4455l;\u69f6rok;\u4111\u0100dr\u1db0\u1db4ot;\u62f1i\u0100;f\u1dba\u1816\u65bf\u0100ah\u1dc0\u1dc3r\xf2\u0429a\xf2\u0fa6angle;\u69a6\u0100ci\u1dd2\u1dd5y;\u445fgrarr;\u67ff\u0900Dacdefglmnopqrstux\u1e01\u1e09\u1e19\u1e38\u0578\u1e3c\u1e49\u1e61\u1e7e\u1ea5\u1eaf\u1ebd\u1ee1\u1f2a\u1f37\u1f44\u1f4e\u1f5a\u0100Do\u1e06\u1d34o\xf4\u1c89\u0100cs\u1e0e\u1e14ute\u803b\xe9\u40e9ter;\u6a6e\u0200aioy\u1e22\u1e27\u1e31\u1e36ron;\u411br\u0100;c\u1e2d\u1e2e\u6256\u803b\xea\u40ealon;\u6255;\u444dot;\u4117\u0100Dr\u1e41\u1e45ot;\u6252;\uc000\ud835\udd22\u0180;rs\u1e50\u1e51\u1e57\u6a9aave\u803b\xe8\u40e8\u0100;d\u1e5c\u1e5d\u6a96ot;\u6a98\u0200;ils\u1e6a\u1e6b\u1e72\u1e74\u6a99nters;\u63e7;\u6113\u0100;d\u1e79\u1e7a\u6a95ot;\u6a97\u0180aps\u1e85\u1e89\u1e97cr;\u4113ty\u0180;sv\u1e92\u1e93\u1e95\u6205et\xbb\u1e93p\u01001;\u1e9d\u1ea4\u0133\u1ea1\u1ea3;\u6004;\u6005\u6003\u0100gs\u1eaa\u1eac;\u414bp;\u6002\u0100gp\u1eb4\u1eb8on;\u4119f;\uc000\ud835\udd56\u0180als\u1ec4\u1ece\u1ed2r\u0100;s\u1eca\u1ecb\u62d5l;\u69e3us;\u6a71i\u0180;lv\u1eda\u1edb\u1edf\u43b5on\xbb\u1edb;\u43f5\u0200csuv\u1eea\u1ef3\u1f0b\u1f23\u0100io\u1eef\u1e31rc\xbb\u1e2e\u0269\u1ef9\0\0\u1efb\xed\u0548ant\u0100gl\u1f02\u1f06tr\xbb\u1e5dess\xbb\u1e7a\u0180aei\u1f12\u1f16\u1f1als;\u403dst;\u625fv\u0100;D\u0235\u1f20D;\u6a78parsl;\u69e5\u0100Da\u1f2f\u1f33ot;\u6253rr;\u6971\u0180cdi\u1f3e\u1f41\u1ef8r;\u612fo\xf4\u0352\u0100ah\u1f49\u1f4b;\u43b7\u803b\xf0\u40f0\u0100mr\u1f53\u1f57l\u803b\xeb\u40ebo;\u60ac\u0180cip\u1f61\u1f64\u1f67l;\u4021s\xf4\u056e\u0100eo\u1f6c\u1f74ctatio\xee\u0559nential\xe5\u0579\u09e1\u1f92\0\u1f9e\0\u1fa1\u1fa7\0\0\u1fc6\u1fcc\0\u1fd3\0\u1fe6\u1fea\u2000\0\u2008\u205allingdotse\xf1\u1e44y;\u4444male;\u6640\u0180ilr\u1fad\u1fb3\u1fc1lig;\u8000\ufb03\u0269\u1fb9\0\0\u1fbdg;\u8000\ufb00ig;\u8000\ufb04;\uc000\ud835\udd23lig;\u8000\ufb01lig;\uc000fj\u0180alt\u1fd9\u1fdc\u1fe1t;\u666dig;\u8000\ufb02ns;\u65b1of;\u4192\u01f0\u1fee\0\u1ff3f;\uc000\ud835\udd57\u0100ak\u05bf\u1ff7\u0100;v\u1ffc\u1ffd\u62d4;\u6ad9artint;\u6a0d\u0100ao\u200c\u2055\u0100cs\u2011\u2052\u03b1\u201a\u2030\u2038\u2045\u2048\0\u2050\u03b2\u2022\u2025\u2027\u202a\u202c\0\u202e\u803b\xbd\u40bd;\u6153\u803b\xbc\u40bc;\u6155;\u6159;\u615b\u01b3\u2034\0\u2036;\u6154;\u6156\u02b4\u203e\u2041\0\0\u2043\u803b\xbe\u40be;\u6157;\u615c5;\u6158\u01b6\u204c\0\u204e;\u615a;\u615d8;\u615el;\u6044wn;\u6322cr;\uc000\ud835\udcbb\u0880Eabcdefgijlnorstv\u2082\u2089\u209f\u20a5\u20b0\u20b4\u20f0\u20f5\u20fa\u20ff\u2103\u2112\u2138\u0317\u213e\u2152\u219e\u0100;l\u064d\u2087;\u6a8c\u0180cmp\u2090\u2095\u209dute;\u41f5ma\u0100;d\u209c\u1cda\u43b3;\u6a86reve;\u411f\u0100iy\u20aa\u20aerc;\u411d;\u4433ot;\u4121\u0200;lqs\u063e\u0642\u20bd\u20c9\u0180;qs\u063e\u064c\u20c4lan\xf4\u0665\u0200;cdl\u0665\u20d2\u20d5\u20e5c;\u6aa9ot\u0100;o\u20dc\u20dd\u6a80\u0100;l\u20e2\u20e3\u6a82;\u6a84\u0100;e\u20ea\u20ed\uc000\u22db\ufe00s;\u6a94r;\uc000\ud835\udd24\u0100;g\u0673\u061bmel;\u6137cy;\u4453\u0200;Eaj\u065a\u210c\u210e\u2110;\u6a92;\u6aa5;\u6aa4\u0200Eaes\u211b\u211d\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6a8arox\xbb\u2124\u0100;q\u212e\u212f\u6a88\u0100;q\u212e\u211bim;\u62e7pf;\uc000\ud835\udd58\u0100ci\u2143\u2146r;\u610am\u0180;el\u066b\u214e\u2150;\u6a8e;\u6a90\u8300>;cdlqr\u05ee\u2160\u216a\u216e\u2173\u2179\u0100ci\u2165\u2167;\u6aa7r;\u6a7aot;\u62d7Par;\u6995uest;\u6a7c\u0280adels\u2184\u216a\u2190\u0656\u219b\u01f0\u2189\0\u218epro\xf8\u209er;\u6978q\u0100lq\u063f\u2196les\xf3\u2088i\xed\u066b\u0100en\u21a3\u21adrtneqq;\uc000\u2269\ufe00\xc5\u21aa\u0500Aabcefkosy\u21c4\u21c7\u21f1\u21f5\u21fa\u2218\u221d\u222f\u2268\u227dr\xf2\u03a0\u0200ilmr\u21d0\u21d4\u21d7\u21dbrs\xf0\u1484f\xbb\u2024il\xf4\u06a9\u0100dr\u21e0\u21e4cy;\u444a\u0180;cw\u08f4\u21eb\u21efir;\u6948;\u61adar;\u610firc;\u4125\u0180alr\u2201\u220e\u2213rts\u0100;u\u2209\u220a\u6665it\xbb\u220alip;\u6026con;\u62b9r;\uc000\ud835\udd25s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223a\u223e\u2243\u225e\u2263rr;\u61fftht;\u623bk\u0100lr\u2249\u2253eftarrow;\u61a9ightarrow;\u61aaf;\uc000\ud835\udd59bar;\u6015\u0180clt\u226f\u2274\u2278r;\uc000\ud835\udcbdas\xe8\u21f4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xbb\u1c5b\u0ae1\u22a3\0\u22aa\0\u22b8\u22c5\u22ce\0\u22d5\u22f3\0\0\u22f8\u2322\u2367\u2362\u237f\0\u2386\u23aa\u23b4cute\u803b\xed\u40ed\u0180;iy\u0771\u22b0\u22b5rc\u803b\xee\u40ee;\u4438\u0100cx\u22bc\u22bfy;\u4435cl\u803b\xa1\u40a1\u0100fr\u039f\u22c9;\uc000\ud835\udd26rave\u803b\xec\u40ec\u0200;ino\u073e\u22dd\u22e9\u22ee\u0100in\u22e2\u22e6nt;\u6a0ct;\u622dfin;\u69dcta;\u6129lig;\u4133\u0180aop\u22fe\u231a\u231d\u0180cgt\u2305\u2308\u2317r;\u412b\u0180elp\u071f\u230f\u2313in\xe5\u078ear\xf4\u0720h;\u4131f;\u62b7ed;\u41b5\u0280;cfot\u04f4\u232c\u2331\u233d\u2341are;\u6105in\u0100;t\u2338\u2339\u621eie;\u69dddo\xf4\u2319\u0280;celp\u0757\u234c\u2350\u235b\u2361al;\u62ba\u0100gr\u2355\u2359er\xf3\u1563\xe3\u234darhk;\u6a17rod;\u6a3c\u0200cgpt\u236f\u2372\u2376\u237by;\u4451on;\u412ff;\uc000\ud835\udd5aa;\u43b9uest\u803b\xbf\u40bf\u0100ci\u238a\u238fr;\uc000\ud835\udcben\u0280;Edsv\u04f4\u239b\u239d\u23a1\u04f3;\u62f9ot;\u62f5\u0100;v\u23a6\u23a7\u62f4;\u62f3\u0100;i\u0777\u23aelde;\u4129\u01eb\u23b8\0\u23bccy;\u4456l\u803b\xef\u40ef\u0300cfmosu\u23cc\u23d7\u23dc\u23e1\u23e7\u23f5\u0100iy\u23d1\u23d5rc;\u4135;\u4439r;\uc000\ud835\udd27ath;\u4237pf;\uc000\ud835\udd5b\u01e3\u23ec\0\u23f1r;\uc000\ud835\udcbfrcy;\u4458kcy;\u4454\u0400acfghjos\u240b\u2416\u2422\u2427\u242d\u2431\u2435\u243bppa\u0100;v\u2413\u2414\u43ba;\u43f0\u0100ey\u241b\u2420dil;\u4137;\u443ar;\uc000\ud835\udd28reen;\u4138cy;\u4445cy;\u445cpf;\uc000\ud835\udd5ccr;\uc000\ud835\udcc0\u0b80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248d\u2491\u250e\u253d\u255a\u2580\u264e\u265e\u2665\u2679\u267d\u269a\u26b2\u26d8\u275d\u2768\u278b\u27c0\u2801\u2812\u0180art\u2477\u247a\u247cr\xf2\u09c6\xf2\u0395ail;\u691barr;\u690e\u0100;g\u0994\u248b;\u6a8bar;\u6962\u0963\u24a5\0\u24aa\0\u24b1\0\0\0\0\0\u24b5\u24ba\0\u24c6\u24c8\u24cd\0\u24f9ute;\u413amptyv;\u69b4ra\xee\u084cbda;\u43bbg\u0180;dl\u088e\u24c1\u24c3;\u6991\xe5\u088e;\u6a85uo\u803b\xab\u40abr\u0400;bfhlpst\u0899\u24de\u24e6\u24e9\u24eb\u24ee\u24f1\u24f5\u0100;f\u089d\u24e3s;\u691fs;\u691d\xeb\u2252p;\u61abl;\u6939im;\u6973l;\u61a2\u0180;ae\u24ff\u2500\u2504\u6aabil;\u6919\u0100;s\u2509\u250a\u6aad;\uc000\u2aad\ufe00\u0180abr\u2515\u2519\u251drr;\u690crk;\u6772\u0100ak\u2522\u252cc\u0100ek\u2528\u252a;\u407b;\u405b\u0100es\u2531\u2533;\u698bl\u0100du\u2539\u253b;\u698f;\u698d\u0200aeuy\u2546\u254b\u2556\u2558ron;\u413e\u0100di\u2550\u2554il;\u413c\xec\u08b0\xe2\u2529;\u443b\u0200cqrs\u2563\u2566\u256d\u257da;\u6936uo\u0100;r\u0e19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694bh;\u61b2\u0280;fgqs\u258b\u258c\u0989\u25f3\u25ff\u6264t\u0280ahlrt\u2598\u25a4\u25b7\u25c2\u25e8rrow\u0100;t\u0899\u25a1a\xe9\u24f6arpoon\u0100du\u25af\u25b4own\xbb\u045ap\xbb\u0966eftarrows;\u61c7ight\u0180ahs\u25cd\u25d6\u25derrow\u0100;s\u08f4\u08a7arpoon\xf3\u0f98quigarro\xf7\u21f0hreetimes;\u62cb\u0180;qs\u258b\u0993\u25falan\xf4\u09ac\u0280;cdgs\u09ac\u260a\u260d\u261d\u2628c;\u6aa8ot\u0100;o\u2614\u2615\u6a7f\u0100;r\u261a\u261b\u6a81;\u6a83\u0100;e\u2622\u2625\uc000\u22da\ufe00s;\u6a93\u0280adegs\u2633\u2639\u263d\u2649\u264bppro\xf8\u24c6ot;\u62d6q\u0100gq\u2643\u2645\xf4\u0989gt\xf2\u248c\xf4\u099bi\xed\u09b2\u0180ilr\u2655\u08e1\u265asht;\u697c;\uc000\ud835\udd29\u0100;E\u099c\u2663;\u6a91\u0161\u2669\u2676r\u0100du\u25b2\u266e\u0100;l\u0965\u2673;\u696alk;\u6584cy;\u4459\u0280;acht\u0a48\u2688\u268b\u2691\u2696r\xf2\u25c1orne\xf2\u1d08ard;\u696bri;\u65fa\u0100io\u269f\u26a4dot;\u4140ust\u0100;a\u26ac\u26ad\u63b0che\xbb\u26ad\u0200Eaes\u26bb\u26bd\u26c9\u26d4;\u6268p\u0100;p\u26c3\u26c4\u6a89rox\xbb\u26c4\u0100;q\u26ce\u26cf\u6a87\u0100;q\u26ce\u26bbim;\u62e6\u0400abnoptwz\u26e9\u26f4\u26f7\u271a\u272f\u2741\u2747\u2750\u0100nr\u26ee\u26f1g;\u67ecr;\u61fdr\xeb\u08c1g\u0180lmr\u26ff\u270d\u2714eft\u0100ar\u09e6\u2707ight\xe1\u09f2apsto;\u67fcight\xe1\u09fdparrow\u0100lr\u2725\u2729ef\xf4\u24edight;\u61ac\u0180afl\u2736\u2739\u273dr;\u6985;\uc000\ud835\udd5dus;\u6a2dimes;\u6a34\u0161\u274b\u274fst;\u6217\xe1\u134e\u0180;ef\u2757\u2758\u1800\u65cange\xbb\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277c\u2785\u2787r\xf2\u08a8orne\xf2\u1d8car\u0100;d\u0f98\u2783;\u696d;\u600eri;\u62bf\u0300achiqt\u2798\u279d\u0a40\u27a2\u27ae\u27bbquo;\u6039r;\uc000\ud835\udcc1m\u0180;eg\u09b2\u27aa\u27ac;\u6a8d;\u6a8f\u0100bu\u252a\u27b3o\u0100;r\u0e1f\u27b9;\u601arok;\u4142\u8400<;cdhilqr\u082b\u27d2\u2639\u27dc\u27e0\u27e5\u27ea\u27f0\u0100ci\u27d7\u27d9;\u6aa6r;\u6a79re\xe5\u25f2mes;\u62c9arr;\u6976uest;\u6a7b\u0100Pi\u27f5\u27f9ar;\u6996\u0180;ef\u2800\u092d\u181b\u65c3r\u0100du\u2807\u280dshar;\u694ahar;\u6966\u0100en\u2817\u2821rtneqq;\uc000\u2268\ufe00\xc5\u281e\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288e\u2893\u28a0\u28a5\u28a8\u28da\u28e2\u28e4\u0a83\u28f3\u2902Dot;\u623a\u0200clpr\u284e\u2852\u2863\u287dr\u803b\xaf\u40af\u0100et\u2857\u2859;\u6642\u0100;e\u285e\u285f\u6720se\xbb\u285f\u0100;s\u103b\u2868to\u0200;dlu\u103b\u2873\u2877\u287bow\xee\u048cef\xf4\u090f\xf0\u13d1ker;\u65ae\u0100oy\u2887\u288cmma;\u6a29;\u443cash;\u6014asuredangle\xbb\u1626r;\uc000\ud835\udd2ao;\u6127\u0180cdn\u28af\u28b4\u28c9ro\u803b\xb5\u40b5\u0200;acd\u1464\u28bd\u28c0\u28c4s\xf4\u16a7ir;\u6af0ot\u80bb\xb7\u01b5us\u0180;bd\u28d2\u1903\u28d3\u6212\u0100;u\u1d3c\u28d8;\u6a2a\u0163\u28de\u28e1p;\u6adb\xf2\u2212\xf0\u0a81\u0100dp\u28e9\u28eeels;\u62a7f;\uc000\ud835\udd5e\u0100ct\u28f8\u28fdr;\uc000\ud835\udcc2pos\xbb\u159d\u0180;lm\u2909\u290a\u290d\u43bctimap;\u62b8\u0c00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297e\u2989\u2998\u29da\u29e9\u2a15\u2a1a\u2a58\u2a5d\u2a83\u2a95\u2aa4\u2aa8\u2b04\u2b07\u2b44\u2b7f\u2bae\u2c34\u2c67\u2c7c\u2ce9\u0100gt\u2947\u294b;\uc000\u22d9\u0338\u0100;v\u2950\u0bcf\uc000\u226b\u20d2\u0180elt\u295a\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61cdightarrow;\u61ce;\uc000\u22d8\u0338\u0100;v\u297b\u0c47\uc000\u226a\u20d2ightarrow;\u61cf\u0100Dd\u298e\u2993ash;\u62afash;\u62ae\u0280bcnpt\u29a3\u29a7\u29ac\u29b1\u29ccla\xbb\u02deute;\u4144g;\uc000\u2220\u20d2\u0280;Eiop\u0d84\u29bc\u29c0\u29c5\u29c8;\uc000\u2a70\u0338d;\uc000\u224b\u0338s;\u4149ro\xf8\u0d84ur\u0100;a\u29d3\u29d4\u666el\u0100;s\u29d3\u0b38\u01f3\u29df\0\u29e3p\u80bb\xa0\u0b37mp\u0100;e\u0bf9\u0c00\u0280aeouy\u29f4\u29fe\u2a03\u2a10\u2a13\u01f0\u29f9\0\u29fb;\u6a43on;\u4148dil;\u4146ng\u0100;d\u0d7e\u2a0aot;\uc000\u2a6d\u0338p;\u6a42;\u443dash;\u6013\u0380;Aadqsx\u0b92\u2a29\u2a2d\u2a3b\u2a41\u2a45\u2a50rr;\u61d7r\u0100hr\u2a33\u2a36k;\u6924\u0100;o\u13f2\u13f0ot;\uc000\u2250\u0338ui\xf6\u0b63\u0100ei\u2a4a\u2a4ear;\u6928\xed\u0b98ist\u0100;s\u0ba0\u0b9fr;\uc000\ud835\udd2b\u0200Eest\u0bc5\u2a66\u2a79\u2a7c\u0180;qs\u0bbc\u2a6d\u0be1\u0180;qs\u0bbc\u0bc5\u2a74lan\xf4\u0be2i\xed\u0bea\u0100;r\u0bb6\u2a81\xbb\u0bb7\u0180Aap\u2a8a\u2a8d\u2a91r\xf2\u2971rr;\u61aear;\u6af2\u0180;sv\u0f8d\u2a9c\u0f8c\u0100;d\u2aa1\u2aa2\u62fc;\u62facy;\u445a\u0380AEadest\u2ab7\u2aba\u2abe\u2ac2\u2ac5\u2af6\u2af9r\xf2\u2966;\uc000\u2266\u0338rr;\u619ar;\u6025\u0200;fqs\u0c3b\u2ace\u2ae3\u2aeft\u0100ar\u2ad4\u2ad9rro\xf7\u2ac1ightarro\xf7\u2a90\u0180;qs\u0c3b\u2aba\u2aealan\xf4\u0c55\u0100;s\u0c55\u2af4\xbb\u0c36i\xed\u0c5d\u0100;r\u0c35\u2afei\u0100;e\u0c1a\u0c25i\xe4\u0d90\u0100pt\u2b0c\u2b11f;\uc000\ud835\udd5f\u8180\xac;in\u2b19\u2b1a\u2b36\u40acn\u0200;Edv\u0b89\u2b24\u2b28\u2b2e;\uc000\u22f9\u0338ot;\uc000\u22f5\u0338\u01e1\u0b89\u2b33\u2b35;\u62f7;\u62f6i\u0100;v\u0cb8\u2b3c\u01e1\u0cb8\u2b41\u2b43;\u62fe;\u62fd\u0180aor\u2b4b\u2b63\u2b69r\u0200;ast\u0b7b\u2b55\u2b5a\u2b5flle\xec\u0b7bl;\uc000\u2afd\u20e5;\uc000\u2202\u0338lint;\u6a14\u0180;ce\u0c92\u2b70\u2b73u\xe5\u0ca5\u0100;c\u0c98\u2b78\u0100;e\u0c92\u2b7d\xf1\u0c98\u0200Aait\u2b88\u2b8b\u2b9d\u2ba7r\xf2\u2988rr\u0180;cw\u2b94\u2b95\u2b99\u619b;\uc000\u2933\u0338;\uc000\u219d\u0338ghtarrow\xbb\u2b95ri\u0100;e\u0ccb\u0cd6\u0380chimpqu\u2bbd\u2bcd\u2bd9\u2b04\u0b78\u2be4\u2bef\u0200;cer\u0d32\u2bc6\u0d37\u2bc9u\xe5\u0d45;\uc000\ud835\udcc3ort\u026d\u2b05\0\0\u2bd6ar\xe1\u2b56m\u0100;e\u0d6e\u2bdf\u0100;q\u0d74\u0d73su\u0100bp\u2beb\u2bed\xe5\u0cf8\xe5\u0d0b\u0180bcp\u2bf6\u2c11\u2c19\u0200;Ees\u2bff\u2c00\u0d22\u2c04\u6284;\uc000\u2ac5\u0338et\u0100;e\u0d1b\u2c0bq\u0100;q\u0d23\u2c00c\u0100;e\u0d32\u2c17\xf1\u0d38\u0200;Ees\u2c22\u2c23\u0d5f\u2c27\u6285;\uc000\u2ac6\u0338et\u0100;e\u0d58\u2c2eq\u0100;q\u0d60\u2c23\u0200gilr\u2c3d\u2c3f\u2c45\u2c47\xec\u0bd7lde\u803b\xf1\u40f1\xe7\u0c43iangle\u0100lr\u2c52\u2c5ceft\u0100;e\u0c1a\u2c5a\xf1\u0c26ight\u0100;e\u0ccb\u2c65\xf1\u0cd7\u0100;m\u2c6c\u2c6d\u43bd\u0180;es\u2c74\u2c75\u2c79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2c8f\u2c94\u2c99\u2c9e\u2ca3\u2cb0\u2cb6\u2cd3\u2ce3ash;\u62adarr;\u6904p;\uc000\u224d\u20d2ash;\u62ac\u0100et\u2ca8\u2cac;\uc000\u2265\u20d2;\uc000>\u20d2nfin;\u69de\u0180Aet\u2cbd\u2cc1\u2cc5rr;\u6902;\uc000\u2264\u20d2\u0100;r\u2cca\u2ccd\uc000<\u20d2ie;\uc000\u22b4\u20d2\u0100At\u2cd8\u2cdcrr;\u6903rie;\uc000\u22b5\u20d2im;\uc000\u223c\u20d2\u0180Aan\u2cf0\u2cf4\u2d02rr;\u61d6r\u0100hr\u2cfa\u2cfdk;\u6923\u0100;o\u13e7\u13e5ear;\u6927\u1253\u1a95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2d2d\0\u2d38\u2d48\u2d60\u2d65\u2d72\u2d84\u1b07\0\0\u2d8d\u2dab\0\u2dc8\u2dce\0\u2ddc\u2e19\u2e2b\u2e3e\u2e43\u0100cs\u2d31\u1a97ute\u803b\xf3\u40f3\u0100iy\u2d3c\u2d45r\u0100;c\u1a9e\u2d42\u803b\xf4\u40f4;\u443e\u0280abios\u1aa0\u2d52\u2d57\u01c8\u2d5alac;\u4151v;\u6a38old;\u69bclig;\u4153\u0100cr\u2d69\u2d6dir;\u69bf;\uc000\ud835\udd2c\u036f\u2d79\0\0\u2d7c\0\u2d82n;\u42dbave\u803b\xf2\u40f2;\u69c1\u0100bm\u2d88\u0df4ar;\u69b5\u0200acit\u2d95\u2d98\u2da5\u2da8r\xf2\u1a80\u0100ir\u2d9d\u2da0r;\u69beoss;\u69bbn\xe5\u0e52;\u69c0\u0180aei\u2db1\u2db5\u2db9cr;\u414dga;\u43c9\u0180cdn\u2dc0\u2dc5\u01cdron;\u43bf;\u69b6pf;\uc000\ud835\udd60\u0180ael\u2dd4\u2dd7\u01d2r;\u69b7rp;\u69b9\u0380;adiosv\u2dea\u2deb\u2dee\u2e08\u2e0d\u2e10\u2e16\u6228r\xf2\u1a86\u0200;efm\u2df7\u2df8\u2e02\u2e05\u6a5dr\u0100;o\u2dfe\u2dff\u6134f\xbb\u2dff\u803b\xaa\u40aa\u803b\xba\u40bagof;\u62b6r;\u6a56lope;\u6a57;\u6a5b\u0180clo\u2e1f\u2e21\u2e27\xf2\u2e01ash\u803b\xf8\u40f8l;\u6298i\u016c\u2e2f\u2e34de\u803b\xf5\u40f5es\u0100;a\u01db\u2e3as;\u6a36ml\u803b\xf6\u40f6bar;\u633d\u0ae1\u2e5e\0\u2e7d\0\u2e80\u2e9d\0\u2ea2\u2eb9\0\0\u2ecb\u0e9c\0\u2f13\0\0\u2f2b\u2fbc\0\u2fc8r\u0200;ast\u0403\u2e67\u2e72\u0e85\u8100\xb6;l\u2e6d\u2e6e\u40b6le\xec\u0403\u0269\u2e78\0\0\u2e7bm;\u6af3;\u6afdy;\u443fr\u0280cimpt\u2e8b\u2e8f\u2e93\u1865\u2e97nt;\u4025od;\u402eil;\u6030enk;\u6031r;\uc000\ud835\udd2d\u0180imo\u2ea8\u2eb0\u2eb4\u0100;v\u2ead\u2eae\u43c6;\u43d5ma\xf4\u0a76ne;\u660e\u0180;tv\u2ebf\u2ec0\u2ec8\u43c0chfork\xbb\u1ffd;\u43d6\u0100au\u2ecf\u2edfn\u0100ck\u2ed5\u2eddk\u0100;h\u21f4\u2edb;\u610e\xf6\u21f4s\u0480;abcdemst\u2ef3\u2ef4\u1908\u2ef9\u2efd\u2f04\u2f06\u2f0a\u2f0e\u402bcir;\u6a23ir;\u6a22\u0100ou\u1d40\u2f02;\u6a25;\u6a72n\u80bb\xb1\u0e9dim;\u6a26wo;\u6a27\u0180ipu\u2f19\u2f20\u2f25ntint;\u6a15f;\uc000\ud835\udd61nd\u803b\xa3\u40a3\u0500;Eaceinosu\u0ec8\u2f3f\u2f41\u2f44\u2f47\u2f81\u2f89\u2f92\u2f7e\u2fb6;\u6ab3p;\u6ab7u\xe5\u0ed9\u0100;c\u0ece\u2f4c\u0300;acens\u0ec8\u2f59\u2f5f\u2f66\u2f68\u2f7eppro\xf8\u2f43urlye\xf1\u0ed9\xf1\u0ece\u0180aes\u2f6f\u2f76\u2f7approx;\u6ab9qq;\u6ab5im;\u62e8i\xed\u0edfme\u0100;s\u2f88\u0eae\u6032\u0180Eas\u2f78\u2f90\u2f7a\xf0\u2f75\u0180dfp\u0eec\u2f99\u2faf\u0180als\u2fa0\u2fa5\u2faalar;\u632eine;\u6312urf;\u6313\u0100;t\u0efb\u2fb4\xef\u0efbrel;\u62b0\u0100ci\u2fc0\u2fc5r;\uc000\ud835\udcc5;\u43c8ncsp;\u6008\u0300fiopsu\u2fda\u22e2\u2fdf\u2fe5\u2feb\u2ff1r;\uc000\ud835\udd2epf;\uc000\ud835\udd62rime;\u6057cr;\uc000\ud835\udcc6\u0180aeo\u2ff8\u3009\u3013t\u0100ei\u2ffe\u3005rnion\xf3\u06b0nt;\u6a16st\u0100;e\u3010\u3011\u403f\xf1\u1f19\xf4\u0f14\u0a80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30e0\u310e\u312b\u3147\u3162\u3172\u318e\u3206\u3215\u3224\u3229\u3258\u326e\u3272\u3290\u32b0\u32b7\u0180art\u3047\u304a\u304cr\xf2\u10b3\xf2\u03ddail;\u691car\xf2\u1c65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307f\u308f\u3094\u30cc\u0100eu\u306d\u3071;\uc000\u223d\u0331te;\u4155i\xe3\u116emptyv;\u69b3g\u0200;del\u0fd1\u3089\u308b\u308d;\u6992;\u69a5\xe5\u0fd1uo\u803b\xbb\u40bbr\u0580;abcfhlpstw\u0fdc\u30ac\u30af\u30b7\u30b9\u30bc\u30be\u30c0\u30c3\u30c7\u30cap;\u6975\u0100;f\u0fe0\u30b4s;\u6920;\u6933s;\u691e\xeb\u225d\xf0\u272el;\u6945im;\u6974l;\u61a3;\u619d\u0100ai\u30d1\u30d5il;\u691ao\u0100;n\u30db\u30dc\u6236al\xf3\u0f1e\u0180abr\u30e7\u30ea\u30eer\xf2\u17e5rk;\u6773\u0100ak\u30f3\u30fdc\u0100ek\u30f9\u30fb;\u407d;\u405d\u0100es\u3102\u3104;\u698cl\u0100du\u310a\u310c;\u698e;\u6990\u0200aeuy\u3117\u311c\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xec\u0ff2\xe2\u30fa;\u4440\u0200clqs\u3134\u3137\u313d\u3144a;\u6937dhar;\u6969uo\u0100;r\u020e\u020dh;\u61b3\u0180acg\u314e\u315f\u0f44l\u0200;ips\u0f78\u3158\u315b\u109cn\xe5\u10bbar\xf4\u0fa9t;\u65ad\u0180ilr\u3169\u1023\u316esht;\u697d;\uc000\ud835\udd2f\u0100ao\u3177\u3186r\u0100du\u317d\u317f\xbb\u047b\u0100;l\u1091\u3184;\u696c\u0100;v\u318b\u318c\u43c1;\u43f1\u0180gns\u3195\u31f9\u31fcht\u0300ahlrst\u31a4\u31b0\u31c2\u31d8\u31e4\u31eerrow\u0100;t\u0fdc\u31ada\xe9\u30c8arpoon\u0100du\u31bb\u31bfow\xee\u317ep\xbb\u1092eft\u0100ah\u31ca\u31d0rrow\xf3\u0feaarpoon\xf3\u0551ightarrows;\u61c9quigarro\xf7\u30cbhreetimes;\u62ccg;\u42daingdotse\xf1\u1f32\u0180ahm\u320d\u3210\u3213r\xf2\u0feaa\xf2\u0551;\u600foust\u0100;a\u321e\u321f\u63b1che\xbb\u321fmid;\u6aee\u0200abpt\u3232\u323d\u3240\u3252\u0100nr\u3237\u323ag;\u67edr;\u61fer\xeb\u1003\u0180afl\u3247\u324a\u324er;\u6986;\uc000\ud835\udd63us;\u6a2eimes;\u6a35\u0100ap\u325d\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6a12ar\xf2\u31e3\u0200achq\u327b\u3280\u10bc\u3285quo;\u603ar;\uc000\ud835\udcc7\u0100bu\u30fb\u328ao\u0100;r\u0214\u0213\u0180hir\u3297\u329b\u32a0re\xe5\u31f8mes;\u62cai\u0200;efl\u32aa\u1059\u1821\u32ab\u65b9tri;\u69celuhar;\u6968;\u611e\u0d61\u32d5\u32db\u32df\u332c\u3338\u3371\0\u337a\u33a4\0\0\u33ec\u33f0\0\u3428\u3448\u345a\u34ad\u34b1\u34ca\u34f1\0\u3616\0\0\u3633cute;\u415bqu\xef\u27ba\u0500;Eaceinpsy\u11ed\u32f3\u32f5\u32ff\u3302\u330b\u330f\u331f\u3326\u3329;\u6ab4\u01f0\u32fa\0\u32fc;\u6ab8on;\u4161u\xe5\u11fe\u0100;d\u11f3\u3307il;\u415frc;\u415d\u0180Eas\u3316\u3318\u331b;\u6ab6p;\u6abaim;\u62e9olint;\u6a13i\xed\u1204;\u4441ot\u0180;be\u3334\u1d47\u3335\u62c5;\u6a66\u0380Aacmstx\u3346\u334a\u3357\u335b\u335e\u3363\u336drr;\u61d8r\u0100hr\u3350\u3352\xeb\u2228\u0100;o\u0a36\u0a34t\u803b\xa7\u40a7i;\u403bwar;\u6929m\u0100in\u3369\xf0nu\xf3\xf1t;\u6736r\u0100;o\u3376\u2055\uc000\ud835\udd30\u0200acoy\u3382\u3386\u3391\u33a0rp;\u666f\u0100hy\u338b\u338fcy;\u4449;\u4448rt\u026d\u3399\0\0\u339ci\xe4\u1464ara\xec\u2e6f\u803b\xad\u40ad\u0100gm\u33a8\u33b4ma\u0180;fv\u33b1\u33b2\u33b2\u43c3;\u43c2\u0400;deglnpr\u12ab\u33c5\u33c9\u33ce\u33d6\u33de\u33e1\u33e6ot;\u6a6a\u0100;q\u12b1\u12b0\u0100;E\u33d3\u33d4\u6a9e;\u6aa0\u0100;E\u33db\u33dc\u6a9d;\u6a9fe;\u6246lus;\u6a24arr;\u6972ar\xf2\u113d\u0200aeit\u33f8\u3408\u340f\u3417\u0100ls\u33fd\u3404lsetm\xe9\u336ahp;\u6a33parsl;\u69e4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341c\u341d\u6aaa\u0100;s\u3422\u3423\u6aac;\uc000\u2aac\ufe00\u0180flp\u342e\u3433\u3442tcy;\u444c\u0100;b\u3438\u3439\u402f\u0100;a\u343e\u343f\u69c4r;\u633ff;\uc000\ud835\udd64a\u0100dr\u344d\u0402es\u0100;u\u3454\u3455\u6660it\xbb\u3455\u0180csu\u3460\u3479\u349f\u0100au\u3465\u346fp\u0100;s\u1188\u346b;\uc000\u2293\ufe00p\u0100;s\u11b4\u3475;\uc000\u2294\ufe00u\u0100bp\u347f\u348f\u0180;es\u1197\u119c\u3486et\u0100;e\u1197\u348d\xf1\u119d\u0180;es\u11a8\u11ad\u3496et\u0100;e\u11a8\u349d\xf1\u11ae\u0180;af\u117b\u34a6\u05b0r\u0165\u34ab\u05b1\xbb\u117car\xf2\u1148\u0200cemt\u34b9\u34be\u34c2\u34c5r;\uc000\ud835\udcc8tm\xee\xf1i\xec\u3415ar\xe6\u11be\u0100ar\u34ce\u34d5r\u0100;f\u34d4\u17bf\u6606\u0100an\u34da\u34edight\u0100ep\u34e3\u34eapsilo\xee\u1ee0h\xe9\u2eafs\xbb\u2852\u0280bcmnp\u34fb\u355e\u1209\u358b\u358e\u0480;Edemnprs\u350e\u350f\u3511\u3515\u351e\u3523\u352c\u3531\u3536\u6282;\u6ac5ot;\u6abd\u0100;d\u11da\u351aot;\u6ac3ult;\u6ac1\u0100Ee\u3528\u352a;\u6acb;\u628alus;\u6abfarr;\u6979\u0180eiu\u353d\u3552\u3555t\u0180;en\u350e\u3545\u354bq\u0100;q\u11da\u350feq\u0100;q\u352b\u3528m;\u6ac7\u0100bp\u355a\u355c;\u6ad5;\u6ad3c\u0300;acens\u11ed\u356c\u3572\u3579\u357b\u3326ppro\xf8\u32faurlye\xf1\u11fe\xf1\u11f3\u0180aes\u3582\u3588\u331bppro\xf8\u331aq\xf1\u3317g;\u666a\u0680123;Edehlmnps\u35a9\u35ac\u35af\u121c\u35b2\u35b4\u35c0\u35c9\u35d5\u35da\u35df\u35e8\u35ed\u803b\xb9\u40b9\u803b\xb2\u40b2\u803b\xb3\u40b3;\u6ac6\u0100os\u35b9\u35bct;\u6abeub;\u6ad8\u0100;d\u1222\u35c5ot;\u6ac4s\u0100ou\u35cf\u35d2l;\u67c9b;\u6ad7arr;\u697bult;\u6ac2\u0100Ee\u35e4\u35e6;\u6acc;\u628blus;\u6ac0\u0180eiu\u35f4\u3609\u360ct\u0180;en\u121c\u35fc\u3602q\u0100;q\u1222\u35b2eq\u0100;q\u35e7\u35e4m;\u6ac8\u0100bp\u3611\u3613;\u6ad4;\u6ad6\u0180Aan\u361c\u3620\u362drr;\u61d9r\u0100hr\u3626\u3628\xeb\u222e\u0100;o\u0a2b\u0a29war;\u692alig\u803b\xdf\u40df\u0be1\u3651\u365d\u3660\u12ce\u3673\u3679\0\u367e\u36c2\0\0\0\0\0\u36db\u3703\0\u3709\u376c\0\0\0\u3787\u0272\u3656\0\0\u365bget;\u6316;\u43c4r\xeb\u0e5f\u0180aey\u3666\u366b\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uc000\ud835\udd31\u0200eiko\u3686\u369d\u36b5\u36bc\u01f2\u368b\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369b\u43b8ym;\u43d1\u0100cn\u36a2\u36b2k\u0100as\u36a8\u36aeppro\xf8\u12c1im\xbb\u12acs\xf0\u129e\u0100as\u36ba\u36ae\xf0\u12c1rn\u803b\xfe\u40fe\u01ec\u031f\u36c6\u22e7es\u8180\xd7;bd\u36cf\u36d0\u36d8\u40d7\u0100;a\u190f\u36d5r;\u6a31;\u6a30\u0180eps\u36e1\u36e3\u3700\xe1\u2a4d\u0200;bcf\u0486\u36ec\u36f0\u36f4ot;\u6336ir;\u6af1\u0100;o\u36f9\u36fc\uc000\ud835\udd65rk;\u6ada\xe1\u3362rime;\u6034\u0180aip\u370f\u3712\u3764d\xe5\u1248\u0380adempst\u3721\u374d\u3740\u3751\u3757\u375c\u375fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65b5own\xbb\u1dbbeft\u0100;e\u2800\u373e\xf1\u092e;\u625cight\u0100;e\u32aa\u374b\xf1\u105aot;\u65ecinus;\u6a3alus;\u6a39b;\u69cdime;\u6a3bezium;\u63e2\u0180cht\u3772\u377d\u3781\u0100ry\u3777\u377b;\uc000\ud835\udcc9;\u4446cy;\u445brok;\u4167\u0100io\u378b\u378ex\xf4\u1777head\u0100lr\u3797\u37a0eftarro\xf7\u084fightarrow\xbb\u0f5d\u0900AHabcdfghlmoprstuw\u37d0\u37d3\u37d7\u37e4\u37f0\u37fc\u380e\u381c\u3823\u3834\u3851\u385d\u386b\u38a9\u38cc\u38d2\u38ea\u38f6r\xf2\u03edar;\u6963\u0100cr\u37dc\u37e2ute\u803b\xfa\u40fa\xf2\u1150r\u01e3\u37ea\0\u37edy;\u445eve;\u416d\u0100iy\u37f5\u37farc\u803b\xfb\u40fb;\u4443\u0180abh\u3803\u3806\u380br\xf2\u13adlac;\u4171a\xf2\u13c3\u0100ir\u3813\u3818sht;\u697e;\uc000\ud835\udd32rave\u803b\xf9\u40f9\u0161\u3827\u3831r\u0100lr\u382c\u382e\xbb\u0957\xbb\u1083lk;\u6580\u0100ct\u3839\u384d\u026f\u383f\0\0\u384arn\u0100;e\u3845\u3846\u631cr\xbb\u3846op;\u630fri;\u65f8\u0100al\u3856\u385acr;\u416b\u80bb\xa8\u0349\u0100gp\u3862\u3866on;\u4173f;\uc000\ud835\udd66\u0300adhlsu\u114b\u3878\u387d\u1372\u3891\u38a0own\xe1\u13b3arpoon\u0100lr\u3888\u388cef\xf4\u382digh\xf4\u382fi\u0180;hl\u3899\u389a\u389c\u43c5\xbb\u13faon\xbb\u389aparrows;\u61c8\u0180cit\u38b0\u38c4\u38c8\u026f\u38b6\0\0\u38c1rn\u0100;e\u38bc\u38bd\u631dr\xbb\u38bdop;\u630eng;\u416fri;\u65f9cr;\uc000\ud835\udcca\u0180dir\u38d9\u38dd\u38e2ot;\u62f0lde;\u4169i\u0100;f\u3730\u38e8\xbb\u1813\u0100am\u38ef\u38f2r\xf2\u38a8l\u803b\xfc\u40fcangle;\u69a7\u0780ABDacdeflnoprsz\u391c\u391f\u3929\u392d\u39b5\u39b8\u39bd\u39df\u39e4\u39e8\u39f3\u39f9\u39fd\u3a01\u3a20r\xf2\u03f7ar\u0100;v\u3926\u3927\u6ae8;\u6ae9as\xe8\u03e1\u0100nr\u3932\u3937grt;\u699c\u0380eknprst\u34e3\u3946\u394b\u3952\u395d\u3964\u3996app\xe1\u2415othin\xe7\u1e96\u0180hir\u34eb\u2ec8\u3959op\xf4\u2fb5\u0100;h\u13b7\u3962\xef\u318d\u0100iu\u3969\u396dgm\xe1\u33b3\u0100bp\u3972\u3984setneq\u0100;q\u397d\u3980\uc000\u228a\ufe00;\uc000\u2acb\ufe00setneq\u0100;q\u398f\u3992\uc000\u228b\ufe00;\uc000\u2acc\ufe00\u0100hr\u399b\u399fet\xe1\u369ciangle\u0100lr\u39aa\u39afeft\xbb\u0925ight\xbb\u1051y;\u4432ash\xbb\u1036\u0180elr\u39c4\u39d2\u39d7\u0180;be\u2dea\u39cb\u39cfar;\u62bbq;\u625alip;\u62ee\u0100bt\u39dc\u1468a\xf2\u1469r;\uc000\ud835\udd33tr\xe9\u39aesu\u0100bp\u39ef\u39f1\xbb\u0d1c\xbb\u0d59pf;\uc000\ud835\udd67ro\xf0\u0efbtr\xe9\u39b4\u0100cu\u3a06\u3a0br;\uc000\ud835\udccb\u0100bp\u3a10\u3a18n\u0100Ee\u3980\u3a16\xbb\u397en\u0100Ee\u3992\u3a1e\xbb\u3990igzag;\u699a\u0380cefoprs\u3a36\u3a3b\u3a56\u3a5b\u3a54\u3a61\u3a6airc;\u4175\u0100di\u3a40\u3a51\u0100bg\u3a45\u3a49ar;\u6a5fe\u0100;q\u15fa\u3a4f;\u6259erp;\u6118r;\uc000\ud835\udd34pf;\uc000\ud835\udd68\u0100;e\u1479\u3a66at\xe8\u1479cr;\uc000\ud835\udccc\u0ae3\u178e\u3a87\0\u3a8b\0\u3a90\u3a9b\0\0\u3a9d\u3aa8\u3aab\u3aaf\0\0\u3ac3\u3ace\0\u3ad8\u17dc\u17dftr\xe9\u17d1r;\uc000\ud835\udd35\u0100Aa\u3a94\u3a97r\xf2\u03c3r\xf2\u09f6;\u43be\u0100Aa\u3aa1\u3aa4r\xf2\u03b8r\xf2\u09eba\xf0\u2713is;\u62fb\u0180dpt\u17a4\u3ab5\u3abe\u0100fl\u3aba\u17a9;\uc000\ud835\udd69im\xe5\u17b2\u0100Aa\u3ac7\u3acar\xf2\u03cer\xf2\u0a01\u0100cq\u3ad2\u17b8r;\uc000\ud835\udccd\u0100pt\u17d6\u3adcr\xe9\u17d4\u0400acefiosu\u3af0\u3afd\u3b08\u3b0c\u3b11\u3b15\u3b1b\u3b21c\u0100uy\u3af6\u3afbte\u803b\xfd\u40fd;\u444f\u0100iy\u3b02\u3b06rc;\u4177;\u444bn\u803b\xa5\u40a5r;\uc000\ud835\udd36cy;\u4457pf;\uc000\ud835\udd6acr;\uc000\ud835\udcce\u0100cm\u3b26\u3b29y;\u444el\u803b\xff\u40ff\u0500acdefhiosw\u3b42\u3b48\u3b54\u3b58\u3b64\u3b69\u3b6d\u3b74\u3b7a\u3b80cute;\u417a\u0100ay\u3b4d\u3b52ron;\u417e;\u4437ot;\u417c\u0100et\u3b5d\u3b61tr\xe6\u155fa;\u43b6r;\uc000\ud835\udd37cy;\u4436grarr;\u61ddpf;\uc000\ud835\udd6bcr;\uc000\ud835\udccf\u0100jn\u3b85\u3b87;\u600dj;\u600c"
    .split("")
    .map(function (c) { return c.charCodeAt(0); }));

},{}],8:[function(require,module,exports){
"use strict";
// Generated using scripts/write-decode-map.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new Uint16Array(
// prettier-ignore
"\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022"
    .split("")
    .map(function (c) { return c.charCodeAt(0); }));

},{}],9:[function(require,module,exports){
"use strict";
// Generated using scripts/write-encode-map.ts
Object.defineProperty(exports, "__esModule", { value: true });
function restoreDiff(arr) {
    for (var i = 1; i < arr.length; i++) {
        arr[i][0] += arr[i - 1][0] + 1;
    }
    return arr;
}
// prettier-ignore
exports.default = new Map(/* #__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: new Map(/* #__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: new Map(/* #__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: new Map(/* #__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLAttribute = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.DecodingMode = exports.EntityDecoder = exports.encodeHTML5 = exports.encodeHTML4 = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.escapeText = exports.escapeAttribute = exports.escapeUTF8 = exports.escape = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = exports.EncodingMode = exports.EntityLevel = void 0;
var decode_js_1 = require("./decode.js");
var encode_js_1 = require("./encode.js");
var escape_js_1 = require("./escape.js");
/** The level of entities to support. */
var EntityLevel;
(function (EntityLevel) {
    /** Support only XML entities. */
    EntityLevel[EntityLevel["XML"] = 0] = "XML";
    /** Support HTML entities, which are a superset of XML entities. */
    EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
})(EntityLevel = exports.EntityLevel || (exports.EntityLevel = {}));
var EncodingMode;
(function (EncodingMode) {
    /**
     * The output is UTF-8 encoded. Only characters that need escaping within
     * XML will be escaped.
     */
    EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
    /**
     * The output consists only of ASCII characters. Characters that need
     * escaping within HTML, and characters that aren't ASCII characters will
     * be escaped.
     */
    EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
    /**
     * Encode all characters that have an equivalent entity, as well as all
     * characters that are not ASCII characters.
     */
    EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
    /**
     * Encode all characters that have to be escaped in HTML attributes,
     * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
     */
    EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
    /**
     * Encode all characters that have to be escaped in HTML text,
     * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
     */
    EncodingMode[EncodingMode["Text"] = 4] = "Text";
})(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param options Decoding options.
 */
function decode(data, options) {
    if (options === void 0) { options = EntityLevel.XML; }
    var level = typeof options === "number" ? options : options.level;
    if (level === EntityLevel.HTML) {
        var mode = typeof options === "object" ? options.mode : undefined;
        return (0, decode_js_1.decodeHTML)(data, mode);
    }
    return (0, decode_js_1.decodeXML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param options Decoding options.
 * @deprecated Use `decode` with the `mode` set to `Strict`.
 */
function decodeStrict(data, options) {
    var _a;
    if (options === void 0) { options = EntityLevel.XML; }
    var opts = typeof options === "number" ? { level: options } : options;
    (_a = opts.mode) !== null && _a !== void 0 ? _a : (opts.mode = decode_js_1.DecodingMode.Strict);
    return decode(data, opts);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param options Encoding options.
 */
function encode(data, options) {
    if (options === void 0) { options = EntityLevel.XML; }
    var opts = typeof options === "number" ? { level: options } : options;
    // Mode `UTF8` just escapes XML entities
    if (opts.mode === EncodingMode.UTF8)
        return (0, escape_js_1.escapeUTF8)(data);
    if (opts.mode === EncodingMode.Attribute)
        return (0, escape_js_1.escapeAttribute)(data);
    if (opts.mode === EncodingMode.Text)
        return (0, escape_js_1.escapeText)(data);
    if (opts.level === EntityLevel.HTML) {
        if (opts.mode === EncodingMode.ASCII) {
            return (0, encode_js_1.encodeNonAsciiHTML)(data);
        }
        return (0, encode_js_1.encodeHTML)(data);
    }
    // ASCII and Extensive are equivalent
    return (0, escape_js_1.encodeXML)(data);
}
exports.encode = encode;
var escape_js_2 = require("./escape.js");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return escape_js_2.encodeXML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return escape_js_2.escape; } });
Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return escape_js_2.escapeUTF8; } });
Object.defineProperty(exports, "escapeAttribute", { enumerable: true, get: function () { return escape_js_2.escapeAttribute; } });
Object.defineProperty(exports, "escapeText", { enumerable: true, get: function () { return escape_js_2.escapeText; } });
var encode_js_2 = require("./encode.js");
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_js_2.encodeHTML; } });
Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_js_2.encodeNonAsciiHTML; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_js_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_js_2.encodeHTML; } });
var decode_js_2 = require("./decode.js");
Object.defineProperty(exports, "EntityDecoder", { enumerable: true, get: function () { return decode_js_2.EntityDecoder; } });
Object.defineProperty(exports, "DecodingMode", { enumerable: true, get: function () { return decode_js_2.DecodingMode; } });
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_js_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_js_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_js_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTMLAttribute", { enumerable: true, get: function () { return decode_js_2.decodeHTMLAttribute; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_js_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_js_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_js_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_js_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_js_2.decodeXML; } });

},{"./decode.js":3,"./encode.js":5,"./escape.js":6}],11:[function(require,module,exports){
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
    version: '1.0.0',
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

},{"entities":10}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableTags = void 0;
var availableTags = [{ label: "07 Ghost", value: "07 Ghost", url: "http://truyentuan.com/07-ghost/" }, { label: "1/2 Prince", value: "1/2 Prince", url: "http://truyentuan.com/1-2-prince/" }, { label: "Naruto", value: "Naruto", url: "http://truyentuan.com/naruto/" }, { label: "1001 Nights", value: "1001 Nights", url: "http://truyentuan.com/1001-nights/" }, { label: "One Piece", value: "One Piece", url: "http://truyentuan.com/one-piece/" }, { label: "Zombie Loan", value: "Zombie Loan", url: "http://truyentuan.com/zombie-loan/" }, { label: "Zombie Hunter", value: "Zombie Hunter", url: "http://truyentuan.com/zombie-hunter/" }, { label: "Zippy Ziggy", value: "Zippy Ziggy", url: "http://truyentuan.com/zippy-ziggy/" }, { label: "A Love That Feels The Cold", value: "A Love That Feels The Cold", url: "http://truyentuan.com/a-love-that-feels-the-cold/" }, { label: "A Town Where You Live", value: "A Town Where You Live", url: "http://truyentuan.com/a-town-where-you-live/" }, { label: "14 Juicy", value: "14 Juicy", url: "http://truyentuan.com/14-juicy/" }, { label: "16 Life", value: "16 Life", url: "http://truyentuan.com/16-life/" }, { label: "17 Sai Natsu - Seifuku no Jouji", value: "17 Sai Natsu - Seifuku no Jouji", url: "http://truyentuan.com/17-sai-natsu-seifuku-no-jouji/" }, { label: "20th Century Boys", value: "20th Century Boys", url: "http://truyentuan.com/20th-century-boys/" }, { label: "21st Century Boys", value: "21st Century Boys", url: "http://truyentuan.com/21st-century-boys/" }, { label: "666 Satan", value: "666 Satan", url: "http://truyentuan.com/666-satan/" }, { label: "7 Seeds", value: "7 Seeds", url: "http://truyentuan.com/7-seeds/" }, { label: "9 Faces of Love", value: "9 Faces of Love", url: "http://truyentuan.com/9-faces-of-love/" }, { label: "Accel World", value: "Accel World", url: "http://truyentuan.com/accel-world/" }, { label: "Addicted to Curry", value: "Addicted to Curry", url: "http://truyentuan.com/addicted-to-curry/" }, { label: "Adolf", value: "Adolf", url: "http://truyentuan.com/adolf/" }, { label: "Daichohen Doraemon", value: "Daichohen Doraemon", url: "http://truyentuan.com/daichohen-doraemon/" }, { label: "Đại Đường Song Long Truyện", value: "Đại Đường Song Long Truyện", url: "http://truyentuan.com/dai-duong-song-long-truyen/" }, { label: "Đại Đường Uy Long", value: "Đại Đường Uy Long", url: "http://truyentuan.com/dai-duong-uy-long/" }, { label: "Dark Air", value: "Dark Air", url: "http://truyentuan.com/dark-air/" }, { label: "Zetman", value: "Zetman", url: "http://truyentuan.com/zetman/" }, { label: "Zero no Tsukaima", value: "Zero no Tsukaima", url: "http://truyentuan.com/zero-no-tsukaima/" }, { label: "Darker than Black: Shikkoku no Hana", value: "Darker than Black: Shikkoku no Hana", url: "http://truyentuan.com/darker-than-black-shikkoku-no-hana/" }, { label: "Gakuen Alice", value: "Gakuen Alice", url: "http://truyentuan.com/gakuen-alice/" }, { label: "Đại Thánh Vương", value: "Đại Thánh Vương", url: "http://truyentuan.com/dai-thanh-vuong/" }, { label: "Zennou No Noa", value: "Zennou No Noa", url: "http://truyentuan.com/zennou-no-noa/" }, { label: "Zen Martial", value: "Zen Martial", url: "http://truyentuan.com/zen-martial/" }, { label: "Darren Shan", value: "Darren Shan", url: "http://truyentuan.com/darren-shan/" }, { label: "Deadman Wonderland", value: "Deadman Wonderland", url: "http://truyentuan.com/deadman-wonderland/" }, { label: "Death Note", value: "Death Note", url: "http://truyentuan.com/death-note/" }, { label: "Deep Love - Ayu no Monogatari", value: "Deep Love - Ayu no Monogatari", url: "http://truyentuan.com/deep-love-ayu-no-monogatari/" }, { label: "Deep Love - Host", value: "Deep Love - Host", url: "http://truyentuan.com/deep-love-host/" }, { label: "Deep Love - Reina no Unmei", value: "Deep Love - Reina no Unmei", url: "http://truyentuan.com/deep-love-reina-no-unmei/" }, { label: "Deep Love - Pao no Monogatari", value: "Deep Love - Pao no Monogatari", url: "http://truyentuan.com/deep-love-pao-no-monogatari/" }, { label: "Gakuen Babysitters", value: "Gakuen Babysitters", url: "http://truyentuan.com/gakuen-babysitters/" }, { label: "Gamaran", value: "Gamaran", url: "http://truyentuan.com/gamaran/" }, { label: "Gamble Fish", value: "Gamble Fish", url: "http://truyentuan.com/gamble-fish/" }, { label: "Ganba! Fly High", value: "Ganba! Fly High", url: "http://truyentuan.com/ganba-fly-high/" }, { label: "Gantz", value: "Gantz", url: "http://truyentuan.com/gantz/" }, { label: "Aflame Inferno", value: "Aflame Inferno", url: "http://truyentuan.com/aflame-inferno/" }, { label: "Aflame Inferno (DP)", value: "Aflame Inferno (DP)", url: "http://truyentuan.com/aflame-inferno-dp/" }, { label: "Ah! My Goddess", value: "Ah! My Goddess", url: "http://truyentuan.com/ah-my-goddess/" }, { label: "AIKI", value: "AIKI", url: "http://truyentuan.com/aiki/" }, { label: "Air Gear", value: "Air Gear", url: "http://truyentuan.com/air-gear/" }, { label: "Defense Devil", value: "Defense Devil", url: "http://truyentuan.com/defense-devil/" }, { label: "Zekkyou Gakkyuu (Screaming Lessons)", value: "Zekkyou Gakkyuu (Screaming Lessons)", url: "http://truyentuan.com/zekkyou-gakkyuu/" }, { label: "Zashiki Onna", value: "Zashiki Onna", url: "http://truyentuan.com/zashiki-onna/" }, { label: "Yuu & Mi - Con Ma Dễ Thương", value: "Yuu & Mi - Con Ma Dễ Thương", url: "http://truyentuan.com/yuu-mi-con-ma-de-thuong/" }, { label: "Yureka - Lost Saga", value: "Yureka - Lost Saga", url: "http://truyentuan.com/yureka-lost-saga/" }, { label: "Detective Conan", value: "Detective Conan", url: "http://truyentuan.com/detective-conan/" }, { label: "Yumekui Merry", value: "Yumekui Merry", url: "http://truyentuan.com/yumekui-merry/" }, { label: "Yume de Aetara", value: "Yume de Aetara", url: "http://truyentuan.com/yume-de-aetara/" }, { label: "Yubisaki Milk Tea", value: "Yubisaki Milk Tea", url: "http://truyentuan.com/yubisaki-milk-tea/" }, { label: "Gash Bell", value: "Gash Bell", url: "http://truyentuan.com/gash-bell/" }, { label: "Gepetto", value: "Gepetto", url: "http://truyentuan.com/gepetto/" }, { label: "Get Backers", value: "Get Backers", url: "http://truyentuan.com/get-backers/" }, { label: "Giọt Rượu Thần Thánh", value: "Giọt Rượu Thần Thánh", url: "http://truyentuan.com/giot-ruou-than-thanh/" }, { label: "Gintama", value: "Gintama", url: "http://truyentuan.com/gintama/" }, { label: "Aishiteruze Baby", value: "Aishiteruze Baby", url: "http://truyentuan.com/aishiteruze-baby/" }, { label: "Akaboshi", value: "Akaboshi", url: "http://truyentuan.com/akaboshi/" }, { label: "Fairy Tail", value: "Fairy Tail", url: "http://truyentuan.com/fairy-tail/" }, { label: "Akame Ga Kiru", value: "Akame Ga Kiru", url: "http://truyentuan.com/akame-ga-kiru/" }, { label: "Akumetsu", value: "Akumetsu", url: "http://truyentuan.com/akumetsu/" }, { label: "Alive - The Final Evolution", value: "Alive - The Final Evolution", url: "http://truyentuan.com/alive-the-final-evolution/" }, { label: "Alive!", value: "Alive!", url: "http://truyentuan.com/alive/" }, { label: "Ám Hành Ngự Sử", value: "Ám Hành Ngự Sử", url: "http://truyentuan.com/am-hanh-ngu-su/" }, { label: "Amagami Precious Diary", value: "Amagami Precious Diary", url: "http://truyentuan.com/amagami-precious-diary/" }, { label: "H2", value: "H2", url: "http://truyentuan.com/h2/" }, { label: "Hồng Vũ Đại Đế", value: "Hồng Vũ Đại Đế", url: "http://truyentuan.com/hong-vu-dai-de/" }, { label: "Hỏa Phụng Liêu Nguyên", value: "Hỏa Phụng Liêu Nguyên", url: "http://truyentuan.com/hoa-phung-lieu-nguyen/" }, { label: "Hỏa Vân Tà Thần", value: "Hỏa Vân Tà Thần", url: "http://truyentuan.com/hoa-van-ta-than/" }, { label: "Hỏa Vân Tà Thần II", value: "Hỏa Vân Tà Thần II", url: "http://truyentuan.com/hoa-van-ta-than-ii/" }, { label: "Hội Mắt Nai", value: "Hội Mắt Nai", url: "http://truyentuan.com/hoi-mat-nai/" }, { label: "L-DK", value: "L-DK", url: "http://truyentuan.com/l-dk/" }, { label: "Hajimete no Aku", value: "Hajimete no Aku", url: "http://truyentuan.com/hajimete-no-aku/" }, { label: "Half &Half", value: "Half &Half", url: "http://truyentuan.com/half-half/" }, { label: "Hammer Session!", value: "Hammer Session!", url: "http://truyentuan.com/hammer-session/" }, { label: "Hanza Sky", value: "Hanza Sky", url: "http://truyentuan.com/hanza-sky/" }, { label: "Hanzou no Mon", value: "Hanzou no Mon", url: "http://truyentuan.com/hanzou-no-mon/" }, { label: "Amagami Precious Diary - Kaoru", value: "Amagami Precious Diary - Kaoru", url: "http://truyentuan.com/amagami-precious-diary-kaoru/" }, { label: "Amagami Sincrely Yours", value: "Amagami Sincrely Yours", url: "http://truyentuan.com/amagami-sincrely-yours/" }, { label: "Amanchu!", value: "Amanchu!", url: "http://truyentuan.com/amanchu/" }, { label: "Anagle Mole", value: "Anagle Mole", url: "http://truyentuan.com/anagle-mole/" }, { label: "Ane Doki", value: "Ane Doki", url: "http://truyentuan.com/ane-doki/" }, { label: "Angel Beats! Heaven's Door", value: "Angel Beats! Heaven's Door", url: "http://truyentuan.com/angel-beats-heavens-door/" }, { label: "Angel Densetsu", value: "Angel Densetsu", url: "http://truyentuan.com/angel-densetsu/" }, { label: "Angel Sanctuary", value: "Angel Sanctuary", url: "http://truyentuan.com/angel-sanctuary/" }, { label: "Anh Hùng Xạ Điêu", value: "Anh Hùng Xạ Điêu", url: "http://truyentuan.com/anh-hung-xa-dieu/" }, { label: "Ansatsu Kyoushitsu", value: "Ansatsu Kyoushitsu", url: "http://truyentuan.com/ansatsu-kyoushitsu/" }, { label: "Ao no Exorcist", value: "Ao no Exorcist", url: "http://truyentuan.com/ao-no-exorcist/" }, { label: "Aphorism", value: "Aphorism", url: "http://truyentuan.com/aphorism/" }, { label: "Apocalypse no Toride", value: "Apocalypse no Toride", url: "http://truyentuan.com/apocalypse-no-toride/" }, { label: "Arachnid", value: "Arachnid", url: "http://truyentuan.com/arachnid/" }, { label: "Arago", value: "Arago", url: "http://truyentuan.com/arago/" }, { label: "Are you Alice?", value: "Are you Alice?", url: "http://truyentuan.com/are-you-alice/" }, { label: "Area no Kishi", value: "Area no Kishi", url: "http://truyentuan.com/area-no-kishi/" }, { label: "Ares", value: "Ares", url: "http://truyentuan.com/ares/" }, { label: "Asa made Jugyou Chu!", value: "Asa made Jugyou Chu!", url: "http://truyentuan.com/asa-made-jugyou-chu/" }, { label: "Ayu Mayu", value: "Ayu Mayu", url: "http://truyentuan.com/ayu-mayu/" }, { label: "Azumanga Daioh", value: "Azumanga Daioh", url: "http://truyentuan.com/azumanga-daioh/" }, { label: "B.Reaction", value: "B.Reaction", url: "http://truyentuan.com/b-reaction/" }, { label: "Bàn Long", value: "Bàn Long", url: "http://truyentuan.com/ban-long/" }, { label: "Bách Quỷ Dạ Hành", value: "Bách Quỷ Dạ Hành", url: "http://truyentuan.com/bach-quy-da-hanh/" }, { label: "Baby, Please Kill Me", value: "Baby, Please Kill Me", url: "http://truyentuan.com/baby-please-kill-me/" }, { label: "Bad Company", value: "Bad Company", url: "http://truyentuan.com/bad-company/" }, { label: "Baka And Boing", value: "Baka And Boing", url: "http://truyentuan.com/baka-and-boing/" }, { label: "Bakuman", value: "Bakuman", url: "http://truyentuan.com/bakuman/" }, { label: "Banya", value: "Banya", url: "http://truyentuan.com/banya/" }, { label: "Bắc Đẩu Thần Quyền", value: "Bắc Đẩu Thần Quyền", url: "http://truyentuan.com/bac-dau-than-quyen/" }, { label: "Bạo Tộc X", value: "Bạo Tộc X", url: "http://truyentuan.com/bao-toc-x/" }, { label: "Bảng Phong Thần", value: "Bảng Phong Thần", url: "http://truyentuan.com/bang-phong-than/" }, { label: "Bartender", value: "Bartender", url: "http://truyentuan.com/bartender/" }, { label: "Basara", value: "Basara", url: "http://truyentuan.com/basara/" }, { label: "Battle Angel Alita", value: "Battle Angel Alita", url: "http://truyentuan.com/battle-angel-alita/" }, { label: "Battle Angel Alita - Last Order", value: "Battle Angel Alita - Last Order", url: "http://truyentuan.com/battle-angel-alita-last-order/" }, { label: "Battle Royale", value: "Battle Royale", url: "http://truyentuan.com/battle-royale/" }, { label: "BB Project", value: "BB Project", url: "http://truyentuan.com/bb-project/" }, { label: "Beach Stars", value: "Beach Stars", url: "http://truyentuan.com/beach-stars/" }, { label: "Beauty Pop", value: "Beauty Pop", url: "http://truyentuan.com/beauty-pop/" }, { label: "Because I'm the Goddess", value: "Because I'm the Goddess", url: "http://truyentuan.com/because-im-the-goddess/" }, { label: "Beelzebub", value: "Beelzebub", url: "http://truyentuan.com/beelzebub/" }, { label: "Beelzebub (MG)", value: "Beelzebub (MG)", url: "http://truyentuan.com/beelzebub-mg/" }, { label: "Berserk", value: "Berserk", url: "http://truyentuan.com/berserk/" }, { label: "Biên Hoang Truyền Thuyết", value: "Biên Hoang Truyền Thuyết", url: "http://truyentuan.com/bien-hoang-truyen-thuyet/" }, { label: "Bibi", value: "Bibi", url: "http://truyentuan.com/bibi/" }, { label: "Billy Bat", value: "Billy Bat", url: "http://truyentuan.com/billy-bat/" }, { label: "Bio Meat: Nectar", value: "Bio Meat: Nectar", url: "http://truyentuan.com/bio-meat-nectar/" }, { label: "Birdcage Manor", value: "Birdcage Manor", url: "http://truyentuan.com/birdcage-manor/" }, { label: "Bitter Virgin", value: "Bitter Virgin", url: "http://truyentuan.com/bitter-virgin/" }, { label: "Black Cat", value: "Black Cat", url: "http://truyentuan.com/black-cat/" }, { label: "Hắc Quản Gia", value: "Hắc Quản Gia", url: "http://truyentuan.com/hac-quan-gia/" }, { label: "La Mosca", value: "La Mosca", url: "http://truyentuan.com/la-mosca/" }, { label: "Lady Georgie", value: "Lady Georgie", url: "http://truyentuan.com/lady-georgie/" }, { label: "Law of Ueki", value: "Law of Ueki", url: "http://truyentuan.com/law-of-ueki/" }, { label: "Law of Ueki Plus", value: "Law of Ueki Plus", url: "http://truyentuan.com/law-of-ueki-plus/" }, { label: "Layers", value: "Layers", url: "http://truyentuan.com/layers/" }, { label: "Legend of Tyr", value: "Legend of Tyr", url: "http://truyentuan.com/legend-of-tyr/" }, { label: "Hạt Giống Của Sự Bất An", value: "Hạt Giống Của Sự Bất An", url: "http://truyentuan.com/hat-giong-cua-su-bat-an/" }, { label: "Hapi Mari", value: "Hapi Mari", url: "http://truyentuan.com/hapi-mari/" }, { label: "Hareluya", value: "Hareluya", url: "http://truyentuan.com/hareluya/" }, { label: "Hareluya II Boy", value: "Hareluya II Boy", url: "http://truyentuan.com/hareluya-ii-boy/" }, { label: "Legend of Zelda: Oracle of Ages", value: "Legend of Zelda: Oracle of Ages", url: "http://truyentuan.com/legend-of-zelda-oracle-of-ages/" }, { label: "Legend of Zelda: Oracle of Seasons", value: "Legend of Zelda: Oracle of Seasons", url: "http://truyentuan.com/legend-of-zelda-oracle-of-seasons/" }, { label: "Liar Game", value: "Liar Game", url: "http://truyentuan.com/liar-game/" }, { label: "Little Witch's Diary", value: "Little Witch's Diary", url: "http://truyentuan.com/little-witchs-diary/" }, { label: "Harisugawa Ở Thế Giới Trong Gương", value: "Harisugawa Ở Thế Giới Trong Gương", url: "http://truyentuan.com/harisugawa-o-the-gioi-trong-guong/" }, { label: "Hatsujouteki Yajyuu", value: "Hatsujouteki Yajyuu", url: "http://truyentuan.com/hatsujouteki-yajyuu/" }, { label: "Hatsukoi Limited", value: "Hatsukoi Limited", url: "http://truyentuan.com/hatsukoi-limited/" }, { label: "Hayate no Gotoku!", value: "Hayate no Gotoku!", url: "http://truyentuan.com/hayate-no-gotoku/" }, { label: "Long Phi Bất Bại", value: "Long Phi Bất Bại", url: "http://truyentuan.com/long-phi-bat-bai/" }, { label: "Love Monster", value: "Love Monster", url: "http://truyentuan.com/love-monster/" }, { label: "Lucifer and the Biscuit Hammer", value: "Lucifer and the Biscuit Hammer", url: "http://truyentuan.com/lucifer-and-the-biscuit-hammer/" }, { label: "Hekikai no AiON", value: "Hekikai no AiON", url: "http://truyentuan.com/hekikai-no-aion/" }, { label: "Hiệp Khách Giang Hồ", value: "Hiệp Khách Giang Hồ", url: "http://truyentuan.com/hiep-khach-giang-ho/" }, { label: "Lucky Luke", value: "Lucky Luke", url: "http://truyentuan.com/lucky-luke/" }, { label: "Lucky Star", value: "Lucky Star", url: "http://truyentuan.com/lucky-star/" }, { label: "Ludwig Kakumei", value: "Ludwig Kakumei", url: "http://truyentuan.com/ludwig-kakumei/" }, { label: "Thần Binh Huyền Kỳ I", value: "Thần Binh Huyền Kỳ I", url: "http://truyentuan.com/than-binh-huyen-ky-i/" }, { label: "Thiết Tướng Tung Hoành", value: "Thiết Tướng Tung Hoành", url: "http://truyentuan.com/thiet-tuong-tung-hoanh/" }, { label: "Magi", value: "Magi", url: "http://truyentuan.com/magi/" }, { label: "Magic Ban Removal! Hyde and Closer", value: "Magic Ban Removal! Hyde and Closer", url: "http://truyentuan.com/magic-ban-removal-hyde-and-closer/" }, { label: "Magician", value: "Magician", url: "http://truyentuan.com/magician/" }, { label: "Magico", value: "Magico", url: "http://truyentuan.com/magico/" }, { label: "Hiệp Sĩ Giấy", value: "Hiệp Sĩ Giấy", url: "http://truyentuan.com/hiep-si-giay/" }, { label: "Hiatari Ryoukou!", value: "Hiatari Ryoukou!", url: "http://truyentuan.com/hiatari-ryoukou/" }, { label: "Hibi Chouchou", value: "Hibi Chouchou", url: "http://truyentuan.com/hibi-chouchou/" }, { label: "Hidan no Aria", value: "Hidan no Aria", url: "http://truyentuan.com/hidan-no-aria/" }, { label: "Higanjima", value: "Higanjima", url: "http://truyentuan.com/higanjima/" }, { label: "High School", value: "High School", url: "http://truyentuan.com/high-school/" }, { label: "Black God", value: "Black God", url: "http://truyentuan.com/black-god/" }, { label: "Blast", value: "Blast", url: "http://truyentuan.com/blast/" }, { label: "Blazer Drive", value: "Blazer Drive", url: "http://truyentuan.com/blazer-drive/" }, { label: "Bleach", value: "Bleach", url: "http://truyentuan.com/bleach/" }, { label: "Blood Lad", value: "Blood Lad", url: "http://truyentuan.com/blood-lad/" }, { label: "Blood Parade", value: "Blood Parade", url: "http://truyentuan.com/blood-parade/" }, { label: "Bloody Kiss", value: "Bloody Kiss", url: "http://truyentuan.com/bloody-kiss/" }, { label: "Bloody Monday", value: "Bloody Monday", url: "http://truyentuan.com/bloody-monday/" }, { label: "Bloody Monday 2", value: "Bloody Monday 2", url: "http://truyentuan.com/bloody-monday-2/" }, { label: "Blue Dragon: Ral Ω Grado", value: "Blue Dragon: Ral Ω Grado", url: "http://truyentuan.com/blue-dragon-ral-%cf%89-grado/" }, { label: "Blue Seal", value: "Blue Seal", url: "http://truyentuan.com/blue-seal/" }, { label: "Boku Kimi", value: "Boku Kimi", url: "http://truyentuan.com/boku-kimi/" }, { label: "Bokura ga Ita", value: "Bokura ga Ita", url: "http://truyentuan.com/bokura-ga-ita/" }, { label: "Bonnouji", value: "Bonnouji", url: "http://truyentuan.com/bonnouji/" }, { label: "Booking Life", value: "Booking Life", url: "http://truyentuan.com/booking-life/" }, { label: "Bowling King", value: "Bowling King", url: "http://truyentuan.com/bowling-king/" }, { label: "Boyfriend", value: "Boyfriend", url: "http://truyentuan.com/boyfriend/" }, { label: "Boys Over Flowers", value: "Boys Over Flowers", url: "http://truyentuan.com/boys-over-flowers/" }, { label: "Break Blade", value: "Break Blade", url: "http://truyentuan.com/break-blade/" }, { label: "Break Shot", value: "Break Shot", url: "http://truyentuan.com/break-shot/" }, { label: "Btooom!", value: "Btooom!", url: "http://truyentuan.com/btooom/" }, { label: "Buddha", value: "Buddha", url: "http://truyentuan.com/buddha/" }, { label: "Burning Hell", value: "Burning Hell", url: "http://truyentuan.com/burning-hell/" }, { label: "Busou Renkin", value: "Busou Renkin", url: "http://truyentuan.com/busou-renkin/" }, { label: "Buster Keel", value: "Buster Keel", url: "http://truyentuan.com/buster-keel/" }, { label: "Butterfly", value: "Butterfly", url: "http://truyentuan.com/butterfly/" }, { label: "Buyuden", value: "Buyuden", url: "http://truyentuan.com/buyuden/" }, { label: "Highschool of the Dead", value: "Highschool of the Dead", url: "http://truyentuan.com/highschool-of-the-dead/" }, { label: "Hikaru No Go", value: "Hikaru No Go", url: "http://truyentuan.com/hikaru-no-go/" }, { label: "History's Strongest Disciple Kenichi", value: "History's Strongest Disciple Kenichi", url: "http://truyentuan.com/historys-strongest-disciple-kenichi/" }, { label: "Magikano", value: "Magikano", url: "http://truyentuan.com/magikano/" }, { label: "Mahoromatic", value: "Mahoromatic", url: "http://truyentuan.com/mahoromatic/" }, { label: "Mahou Sensei Negima", value: "Mahou Sensei Negima", url: "http://truyentuan.com/mahou-sensei-negima/" }, { label: "Hitogatana", value: "Hitogatana", url: "http://truyentuan.com/hitogatana/" }, { label: "Cửu Long Thành Trại", value: "Cửu Long Thành Trại", url: "http://truyentuan.com/cuu-long-thanh-trai/" }, { label: "Cửu Long Thành Trại II", value: "Cửu Long Thành Trại II", url: "http://truyentuan.com/cuu-long-thanh-trai-ii/" }, { label: "Cổ Long Quần Hiệp Truyện", value: "Cổ Long Quần Hiệp Truyện", url: "http://truyentuan.com/co-long-quan-hiep-truyen/" }, { label: "Cage of Eden", value: "Cage of Eden", url: "http://truyentuan.com/cage-of-eden/" }, { label: "Hoàng Tử Biến Thái Và Mèo Cái Không Cười", value: "Hoàng Tử Biến Thái Và Mèo Cái Không Cười", url: "http://truyentuan.com/hoang-tu-bien-thai-va-meo-cai-khong-cuoi/" }, { label: "Holyland", value: "Holyland", url: "http://truyentuan.com/holyland/" }, { label: "Homunculus", value: "Homunculus", url: "http://truyentuan.com/homunculus/" }, { label: "Honorable Baek Dong Soo", value: "Honorable Baek Dong Soo", url: "http://truyentuan.com/honorable-baek-dong-soo/" }, { label: "Hot Gimmick", value: "Hot Gimmick", url: "http://truyentuan.com/hot-gimmick/" }, { label: "Hunter X Hunter", value: "Hunter X Hunter", url: "http://truyentuan.com/hunter-x-hunter/" }, { label: "Huyễn Thành", value: "Huyễn Thành", url: "http://truyentuan.com/huyen-thanh/" }, { label: "Can't See Can't Hear But Love", value: "Can't See Can't Hear But Love", url: "http://truyentuan.com/cant-see-cant-hear-but-love/" }, { label: "Cậu Bé 3 Mắt", value: "Cậu Bé 3 Mắt", url: "http://truyentuan.com/cau-be-3-mat/" }, { label: "Cặp Bài Trùng", value: "Cặp Bài Trùng", url: "http://truyentuan.com/cap-bai-trung/" }, { label: "Cavalier of the Abyss", value: "Cavalier of the Abyss", url: "http://truyentuan.com/cavalier-of-the-abyss/" }, { label: "Cơn lốc - Fight No Akatsuki", value: "Cơn lốc - Fight No Akatsuki", url: "http://truyentuan.com/con-loc-fight-no-akatsuki/" }, { label: "Cerberus", value: "Cerberus", url: "http://truyentuan.com/cerberus/" }, { label: "Change 123", value: "Change 123", url: "http://truyentuan.com/change-123/" }, { label: "Change Guy", value: "Change Guy", url: "http://truyentuan.com/change-guy/" }, { label: "Chú Bé Rồng", value: "Chú Bé Rồng", url: "http://truyentuan.com/chu-be-rong/" }, { label: "Chaosic Rune", value: "Chaosic Rune", url: "http://truyentuan.com/chaosic-rune/" }, { label: "Chii's Sweet Home", value: "Chii's Sweet Home", url: "http://truyentuan.com/chiis-sweet-home/" }, { label: "Chobits", value: "Chobits", url: "http://truyentuan.com/chobits/" }, { label: "Chocolat", value: "Chocolat", url: "http://truyentuan.com/chocolat/" }, { label: "Chocolate Cosmos", value: "Chocolate Cosmos", url: "http://truyentuan.com/chocolate-cosmos/" }, { label: "Chrono Crusade", value: "Chrono Crusade", url: "http://truyentuan.com/chrono-crusade/" }, { label: "Ciel", value: "Ciel", url: "http://truyentuan.com/ciel/" }, { label: "City Hunter", value: "City Hunter", url: "http://truyentuan.com/city-hunter/" }, { label: "Clover", value: "Clover", url: "http://truyentuan.com/clover/" }, { label: "Clover (Tetsuhiro Hirakawa)", value: "Clover (Tetsuhiro Hirakawa)", url: "http://truyentuan.com/clover-tetsuhiro-hirakawa/" }, { label: "Code Geass: Lelouch of the Rebellion", value: "Code Geass: Lelouch of the Rebellion", url: "http://truyentuan.com/code-geass-lelouch-of-the-rebellion/" }, { label: "Code:Breaker", value: "Code:Breaker", url: "http://truyentuan.com/codebreaker/" }, { label: "Conde Koma", value: "Conde Koma", url: "http://truyentuan.com/conde-koma/" }, { label: "Cosmic Break Manga", value: "Cosmic Break Manga", url: "http://truyentuan.com/cosmic-break-manga/" }, { label: "Countrouble", value: "Countrouble", url: "http://truyentuan.com/countrouble/" }, { label: "Cradle of Monsters", value: "Cradle of Monsters", url: "http://truyentuan.com/cradle-of-monsters/" }, { label: "Crazy for You", value: "Crazy for You", url: "http://truyentuan.com/crazy-for-you/" }, { label: "Crazy Girl Shin Bia", value: "Crazy Girl Shin Bia", url: "http://truyentuan.com/crazy-girl-shin-bia/" }, { label: "Crepuscule", value: "Crepuscule", url: "http://truyentuan.com/crepuscule/" }, { label: "Cross Game", value: "Cross Game", url: "http://truyentuan.com/cross-game/" }, { label: "Crows", value: "Crows", url: "http://truyentuan.com/crows/" }, { label: "D-Frag!", value: "D-Frag!", url: "http://truyentuan.com/d-frag/" }, { label: "D.Gray-man", value: "D.Gray-man", url: "http://truyentuan.com/d-gray-man/" }, { label: "Di[e]ce - Trò Chơi Sinh Tử", value: "Di[e]ce - Trò Chơi Sinh Tử", url: "http://truyentuan.com/diece-tro-choi-sinh-tu/" }, { label: "Detective Conan (CFC Team)", value: "Detective Conan (CFC Team)", url: "http://truyentuan.com/detective-conan-cfc-team/" }, { label: "Diamond Cut Diamond", value: "Diamond Cut Diamond", url: "http://truyentuan.com/diamond-cut-diamond/" }, { label: "Diamond no Ace", value: "Diamond no Ace", url: "http://truyentuan.com/diamond-no-ace/" }, { label: "Digimon Next", value: "Digimon Next", url: "http://truyentuan.com/digimon-next/" }, { label: "Digimon V-Tamer", value: "Digimon V-Tamer", url: "http://truyentuan.com/digimon-v-tamer/" }, { label: "Dr. Slump", value: "Dr. Slump", url: "http://truyentuan.com/dr-slump/" }, { label: "Dragon Ball", value: "Dragon Ball", url: "http://truyentuan.com/dragon-ball/" }, { label: "Dragon Drive", value: "Dragon Drive", url: "http://truyentuan.com/dragon-drive/" }, { label: "Dragon Quest: Dai no Daiboken", value: "Dragon Quest: Dai no Daiboken", url: "http://truyentuan.com/dragon-quest-dai-no-daiboken/" }, { label: "Dragon Who", value: "Dragon Who", url: "http://truyentuan.com/dragon-who/" }, { label: "Elfen Lied", value: "Elfen Lied", url: "http://truyentuan.com/elfen-lied/" }, { label: "Eternal Sabbath", value: "Eternal Sabbath", url: "http://truyentuan.com/eternal-sabbath/" }, { label: "Dolls", value: "Dolls", url: "http://truyentuan.com/dolls/" }, { label: "Doraemon", value: "Doraemon", url: "http://truyentuan.com/doraemon/" }, { label: "Doraemon Plus", value: "Doraemon Plus", url: "http://truyentuan.com/doraemon-plus/" }, { label: "Dororo", value: "Dororo", url: "http://truyentuan.com/dororo/" }, { label: "Doubt", value: "Doubt", url: "http://truyentuan.com/doubt/" }, { label: "Dr. Rurru", value: "Dr. Rurru", url: "http://truyentuan.com/dr-rurru/" }, { label: "Dragon Ball SD", value: "Dragon Ball SD", url: "http://truyentuan.com/dragon-ball-sd/" }, { label: "Dragon Ball x One Piece Cross Epoch", value: "Dragon Ball x One Piece Cross Epoch", url: "http://truyentuan.com/dragon-ball-x-one-piece-cross-epoch/" }, { label: "Enigma", value: "Enigma", url: "http://truyentuan.com/enigma/" }, { label: "Erementar Gerad", value: "Erementar Gerad", url: "http://truyentuan.com/erementar-gerad/" }, { label: "Eyeshield 21", value: "Eyeshield 21", url: "http://truyentuan.com/eyeshield-21/" }, { label: "Fairy Tail x Rave Crossover", value: "Fairy Tail x Rave Crossover", url: "http://truyentuan.com/fairy-tail-x-rave-crossover/" }, { label: "Fate/Kaleid Liner Prisma Illya", value: "Fate/Kaleid Liner Prisma Illya", url: "http://truyentuan.com/fatekaleid-liner-prisma-illya/" }, { label: "Fate/Stay Night", value: "Fate/Stay Night", url: "http://truyentuan.com/fatestay-night/" }, { label: "Fire Emblem - Hasha no Tsurugi", value: "Fire Emblem - Hasha no Tsurugi", url: "http://truyentuan.com/fire-emblem-hasha-no-tsurugi/" }, { label: "Flame of Recca", value: "Flame of Recca", url: "http://truyentuan.com/flame-of-recca/" }, { label: "Fly High!", value: "Fly High!", url: "http://truyentuan.com/fly-high/" }, { label: "Forest of Lore", value: "Forest of Lore", url: "http://truyentuan.com/forest-of-lore/" }, { label: "Franken Fran", value: "Franken Fran", url: "http://truyentuan.com/franken-fran/" }, { label: "Freezing", value: "Freezing", url: "http://truyentuan.com/freezing/" }, { label: "Frogman", value: "Frogman", url: "http://truyentuan.com/frogman/" }, { label: "Fujimura-kun Meitsu", value: "Fujimura-kun Meitsu", url: "http://truyentuan.com/fujimura-kun-meitsu/" }, { label: "Fullmetal Alchemist", value: "Fullmetal Alchemist", url: "http://truyentuan.com/fullmetal-alchemist/" }, { label: "Giri Koi", value: "Giri Koi", url: "http://truyentuan.com/giri-koi/" }, { label: "Girl The Wild's", value: "Girl The Wild's", url: "http://truyentuan.com/girl-the-wilds/" }, { label: "Glass Mask", value: "Glass Mask", url: "http://truyentuan.com/glass-mask/" }, { label: "God Eater - The Summer Wars", value: "God Eater - The Summer Wars", url: "http://truyentuan.com/god-eater-the-summer-wars/" }, { label: "God's Left Hand, Devil's Right Hand", value: "God's Left Hand, Devil's Right Hand", url: "http://truyentuan.com/gods-left-hand-devils-right-hand/" }, { label: "Golden Days", value: "Golden Days", url: "http://truyentuan.com/golden-days/" }, { label: "Good Ending", value: "Good Ending", url: "http://truyentuan.com/good-ending/" }, { label: "Good Ending One Shot", value: "Good Ending One Shot", url: "http://truyentuan.com/good-ending-one-shot/" }, { label: "Goumaden Shutendoji", value: "Goumaden Shutendoji", url: "http://truyentuan.com/goumaden-shutendoji/" }, { label: "Great Teacher Onizuka", value: "Great Teacher Onizuka", url: "http://truyentuan.com/great-teacher-onizuka/" }, { label: "GT-R - Great Transporter Ryuji", value: "GT-R - Great Transporter Ryuji", url: "http://truyentuan.com/gt-r-great-transporter-ryuji/" }, { label: "GTO: Shonan 14 Days", value: "GTO: Shonan 14 Days", url: "http://truyentuan.com/gto-shonan-14-days/" }, { label: "Guardian Dog", value: "Guardian Dog", url: "http://truyentuan.com/guardian-dog/" }, { label: "Gwisin Byeolgok", value: "Gwisin Byeolgok", url: "http://truyentuan.com/gwisin-byeolgok/" }, { label: "Y Đội Rồng", value: "Y Đội Rồng", url: "http://truyentuan.com/y-doi-rong/" }, { label: "Yakitate!! Japan", value: "Yakitate!! Japan", url: "http://truyentuan.com/yakitate-japan/" }, { label: "Yamada-kun to 7-nin no Majo", value: "Yamada-kun to 7-nin no Majo", url: "http://truyentuan.com/yamada-kun-to-7-nin-no-majo/" }, { label: "Yomeiro Choice", value: "Yomeiro Choice", url: "http://truyentuan.com/yomeiro-choice/" }, { label: "Yoningurashi", value: "Yoningurashi", url: "http://truyentuan.com/yoningurashi/" }, { label: "Yosuga no Sora", value: "Yosuga no Sora", url: "http://truyentuan.com/yosuga-no-sora/" }, { label: "Yotsuba&!", value: "Yotsuba&!", url: "http://truyentuan.com/yotsuba/" }, { label: "Youkai Doctor", value: "Youkai Doctor", url: "http://truyentuan.com/youkai-doctor/" }, { label: "Yu Yu Hakusho", value: "Yu Yu Hakusho", url: "http://truyentuan.com/yu-yu-hakusho/" }, { label: "Yu-Gi-Oh!", value: "Yu-Gi-Oh!", url: "http://truyentuan.com/yu-gi-oh/" }, { label: "Yu-Gi-Oh! GX", value: "Yu-Gi-Oh! GX", url: "http://truyentuan.com/yu-gi-oh-gx/" }, { label: "XO Sisters", value: "XO Sisters", url: "http://truyentuan.com/xo-sisters/" }, { label: "Xuân Thu Chiến Hùng", value: "Xuân Thu Chiến Hùng", url: "http://truyentuan.com/xuan-thu-chien-hung/" }, { label: "xxxHolic", value: "xxxHolic", url: "http://truyentuan.com/xxxholic/" }, { label: "Wake Up Deadman", value: "Wake Up Deadman", url: "http://truyentuan.com/wake-up-deadman/" }, { label: "Watashi ni XX Shinasai!", value: "Watashi ni XX Shinasai!", url: "http://truyentuan.com/watashi-ni-xx-shinasai/" }, { label: "Western Shotgun", value: "Western Shotgun", url: "http://truyentuan.com/western-shotgun/" }, { label: "Whistle - Cơn Lốc Sân Cỏ", value: "Whistle - Cơn Lốc Sân Cỏ", url: "http://truyentuan.com/whistle-con-loc-san-co/" }, { label: "Witch Hunter", value: "Witch Hunter", url: "http://truyentuan.com/witch-hunter/" }, { label: "Wonderful Wonder World", value: "Wonderful Wonder World", url: "http://truyentuan.com/wonderful-wonder-world/" }, { label: "World Embryo", value: "World Embryo", url: "http://truyentuan.com/world-embryo/" }, { label: "Worst", value: "Worst", url: "http://truyentuan.com/worst/" }, { label: "Vũ Điệu Trên Sân Cỏ - Fantasista", value: "Vũ Điệu Trên Sân Cỏ - Fantasista", url: "http://truyentuan.com/vu-dieu-tren-san-co-fantasista/" }, { label: "Vagabond (Lãng Khách)", value: "Vagabond (Lãng Khách)", url: "http://truyentuan.com/vagabond-lang-khach/" }, { label: "Võ Thần 300", value: "Võ Thần 300", url: "http://truyentuan.com/vo-than-300/" }, { label: "Vampire Knight", value: "Vampire Knight", url: "http://truyentuan.com/vampire-knight/" }, { label: "Võ Thần Phượng Hoàng", value: "Võ Thần Phượng Hoàng", url: "http://truyentuan.com/vo-than-phuong-hoang/" }, { label: "Võ Thần Chung Cực", value: "Võ Thần Chung Cực", url: "http://truyentuan.com/vo-than-chung-cuc/" }, { label: "Võ Thần Hải Hổ - Địa Ngục", value: "Võ Thần Hải Hổ - Địa Ngục", url: "http://truyentuan.com/vo-than-hai-ho-dia-nguc/" }, { label: "Vương Phong Lôi I", value: "Vương Phong Lôi I", url: "http://truyentuan.com/vuong-phong-loi-i/" }, { label: "Vương Phong Lôi II", value: "Vương Phong Lôi II", url: "http://truyentuan.com/vuong-phong-loi-ii/" }, { label: "Veritas", value: "Veritas", url: "http://truyentuan.com/veritas/" }, { label: "Vinland Saga", value: "Vinland Saga", url: "http://truyentuan.com/vinland-saga/" }, { label: "I-Revo", value: "I-Revo", url: "http://truyentuan.com/i-revo/" }, { label: 'I"S', value: 'I"S', url: "http://truyentuan.com/is/" }, { label: "Ubel Blatt", value: "Ubel Blatt", url: "http://truyentuan.com/ubel-blatt/" }, { label: "Ultimate!! Hentai Kamen", value: "Ultimate!! Hentai Kamen", url: "http://truyentuan.com/ultimate-hentai-kamen/" }, { label: "Ultra Maniac", value: "Ultra Maniac", url: "http://truyentuan.com/ultra-maniac/" }, { label: "Umi no Misaki", value: "Umi no Misaki", url: "http://truyentuan.com/umi-no-misaki/" }, { label: "Umi no Yami, Tsuki no Kage", value: "Umi no Yami, Tsuki no Kage", url: "http://truyentuan.com/umi-no-yami-tsuki-no-kage/" }, { label: "Unbalance X Unbalance", value: "Unbalance X Unbalance", url: "http://truyentuan.com/unbalance-x-unbalance/" }, { label: "Until Death Do Us Part", value: "Until Death Do Us Part", url: "http://truyentuan.com/until-death-do-us-part/" }, { label: "Urusei Yatsura", value: "Urusei Yatsura", url: "http://truyentuan.com/urusei-yatsura/" }, { label: "Ushio & Tora", value: "Ushio & Tora", url: "http://truyentuan.com/ushio-tora/" }, { label: "Uzumaki", value: "Uzumaki", url: "http://truyentuan.com/uzumaki/" }, { label: "Tà Thần", value: "Tà Thần", url: "http://truyentuan.com/ta-than/" }, { label: "Tứ Đại Danh Bổ", value: "Tứ Đại Danh Bổ", url: "http://truyentuan.com/tu-dai-danh-bo/" }, { label: "Tân Tác Long Hổ Môn", value: "Tân Tác Long Hổ Môn", url: "http://truyentuan.com/tan-tac-long-ho-mon/" }, { label: "Tam Quốc Kiêu Hoàng", value: "Tam Quốc Kiêu Hoàng", url: "http://truyentuan.com/tam-quoc-kieu-hoang/" }, { label: "Tầm Tần Ký", value: "Tầm Tần Ký", url: "http://truyentuan.com/tam-tan-ky/" }, { label: "Tasogare Otome x Amnesia", value: "Tasogare Otome x Amnesia", url: "http://truyentuan.com/tasogare-otome-x-amnesia/" }, { label: "Tende Freeze", value: "Tende Freeze", url: "http://truyentuan.com/tende-freeze/" }, { label: "Tenkuu no Hasha Z", value: "Tenkuu no Hasha Z", url: "http://truyentuan.com/tenkuu-no-hasha-z/" }, { label: "Thích Hoàng", value: "Thích Hoàng", url: "http://truyentuan.com/thich-hoang/" }, { label: "Thạch Hắc Long Truyện", value: "Thạch Hắc Long Truyện", url: "http://truyentuan.com/thach-hac-long-truyen/" }, { label: "Thần Binh 4", value: "Thần Binh 4", url: "http://truyentuan.com/than-binh-4/" }, { label: "Thần Binh Huyền Kỳ II", value: "Thần Binh Huyền Kỳ II", url: "http://truyentuan.com/than-binh-huyen-ky-ii/" }, { label: "Thần chết và 4 cô bạn gái", value: "Thần chết và 4 cô bạn gái", url: "http://truyentuan.com/than-chet-va-4-co-ban-gai/" }, { label: "Thần Chưởng Long Cửu Châu", value: "Thần Chưởng Long Cửu Châu", url: "http://truyentuan.com/than-chuong-long-cuu-chau/" }, { label: "Thất Chủng Binh Khí", value: "Thất Chủng Binh Khí", url: "http://truyentuan.com/that-chung-binh-khi/" }, { label: "Thương Thiên Bá Hoàng", value: "Thương Thiên Bá Hoàng", url: "http://truyentuan.com/thuong-thien-ba-hoang/" }, { label: "The Breaker", value: "The Breaker", url: "http://truyentuan.com/the-breaker/" }, { label: "The Breaker: New Waves", value: "The Breaker: New Waves", url: "http://truyentuan.com/the-breaker-new-waves/" }, { label: "Ichigo 100%", value: "Ichigo 100%", url: "http://truyentuan.com/ichigo-100/" }, { label: "Id - The Greatest Fusion Fantasy", value: "Id - The Greatest Fusion Fantasy", url: "http://truyentuan.com/id-the-greatest-fusion-fantasy/" }, { label: "Ikkitousen", value: "Ikkitousen", url: "http://truyentuan.com/ikkitousen/" }, { label: "Immortal Regis", value: "Immortal Regis", url: "http://truyentuan.com/immortal-regis/" }, { label: "The Bug Boy", value: "The Bug Boy", url: "http://truyentuan.com/the-bug-boy/" }, { label: "The Gentlemen's Alliance Cross", value: "The Gentlemen's Alliance Cross", url: "http://truyentuan.com/the-gentlemens-alliance-cross/" }, { label: "The God Of High School", value: "The God Of High School", url: "http://truyentuan.com/the-god-of-high-school/" }, { label: "The Horror Mansion", value: "The Horror Mansion", url: "http://truyentuan.com/the-horror-mansion/" }, { label: "The Legend of Maian", value: "The Legend of Maian", url: "http://truyentuan.com/the-legend-of-maian/" }, { label: "The Prince's Cactus", value: "The Prince's Cactus", url: "http://truyentuan.com/the-princes-cactus/" }, { label: "The Ring", value: "The Ring", url: "http://truyentuan.com/the-ring/" }, { label: "The Walking Dead", value: "The Walking Dead", url: "http://truyentuan.com/the-walking-dead/" }, { label: "The World God Only Knows (Kami nomi zo Shiru Sekai)", value: "The World God Only Knows (Kami nomi zo Shiru Sekai)", url: "http://truyentuan.com/the-world-god-only-knows-kami-nomi-zo-shiru-sekai/" }, { label: "Thi Quỷ", value: "Thi Quỷ", url: "http://truyentuan.com/thi-quy/" }, { label: "Thiên Long Bát Bộ", value: "Thiên Long Bát Bộ", url: "http://truyentuan.com/thien-long-bat-bo/" }, { label: "Thiên Tằm Biến", value: "Thiên Tằm Biến", url: "http://truyentuan.com/thien-tam-bien/" }, { label: "Thiết Huyết Nam Nhi", value: "Thiết Huyết Nam Nhi", url: "http://truyentuan.com/thiet-huyet-nam-nhi/" }, { label: "Thiếu Lâm Đệ 8 Đồng Nhân", value: "Thiếu Lâm Đệ 8 Đồng Nhân", url: "http://truyentuan.com/thieu-lam-de-8-dong-nhan/" }, { label: "Thiếu Lâm Đệ 8 Đồng Nhân Ngoại Truyện", value: "Thiếu Lâm Đệ 8 Đồng Nhân Ngoại Truyện", url: "http://truyentuan.com/thieu-lam-de-8-dong-nhan-ngoai-truyen/" }, { label: "Threads of Time", value: "Threads of Time", url: "http://truyentuan.com/threads-of-time/" }, { label: "Tiểu Đội UFO EXTRA", value: "Tiểu Đội UFO EXTRA", url: "http://truyentuan.com/tieu-doi-ufo-extra/" }, { label: "Tiểu Hoà Thượng", value: "Tiểu Hoà Thượng", url: "http://truyentuan.com/tieu-hoa-thuong/" }, { label: "To Aru Kagaku no Railgun", value: "To Aru Kagaku no Railgun", url: "http://truyentuan.com/to-aru-kagaku-no-railgun/" }, { label: "To Love-Ru", value: "To Love-Ru", url: "http://truyentuan.com/to-love-ru/" }, { label: "To Love-Ru Darkness", value: "To Love-Ru Darkness", url: "http://truyentuan.com/to-love-ru-darkness/" }, { label: "Tonari no Kaibutsu-kun", value: "Tonari no Kaibutsu-kun", url: "http://truyentuan.com/tonari-no-kaibutsu-kun/" }, { label: "Tonari no Kashiwagi-san", value: "Tonari no Kashiwagi-san", url: "http://truyentuan.com/tonari-no-kashiwagi-san/" }, { label: "Tonari no Seki-kun", value: "Tonari no Seki-kun", url: "http://truyentuan.com/tonari-no-seki-kun/" }, { label: "Toradora!", value: "Toradora!", url: "http://truyentuan.com/toradora/" }, { label: "Toriko", value: "Toriko", url: "http://truyentuan.com/toriko/" }, { label: "Touch", value: "Touch", url: "http://truyentuan.com/touch/" }, { label: "Tower Of God", value: "Tower Of God", url: "http://truyentuan.com/tower-of-god/" }, { label: "Trace", value: "Trace", url: "http://truyentuan.com/trace/" }, { label: "Trace (blogtruyen)", value: "Trace (blogtruyen)", url: "http://truyentuan.com/trace-blogtruyen/" }, { label: "Transfer Student Storm Bringer", value: "Transfer Student Storm Bringer", url: "http://truyentuan.com/transfer-student-storm-bringer/" }, { label: "Trinity Seven: 7-Nin no Mahoutsukai ", value: "Trinity Seven: 7-Nin no Mahoutsukai ", url: "http://truyentuan.com/trinity-seven-7-nin-no-mahoutsukai/" }, { label: "Tru Tiên", value: "Tru Tiên", url: "http://truyentuan.com/tru-tien/" }, { label: "Tsubasa Reservoir Chronicle", value: "Tsubasa Reservoir Chronicle", url: "http://truyentuan.com/tsubasa-reservoir-chronicle/" }, { label: "Tsuki Tsuki!", value: "Tsuki Tsuki!", url: "http://truyentuan.com/tsuki-tsuki/" }, { label: "Sáng Thế Thần Binh", value: "Sáng Thế Thần Binh", url: "http://truyentuan.com/sang-the-than-binh/" }, { label: "Sát Đạo Hành Giả", value: "Sát Đạo Hành Giả", url: "http://truyentuan.com/sat-dao-hanh-gia/" }, { label: "Sói Mang Con", value: "Sói Mang Con", url: "http://truyentuan.com/soi-mang-con/" }, { label: "Sakamichi no Apollon", value: "Sakamichi no Apollon", url: "http://truyentuan.com/sakamichi-no-apollon/" }, { label: "Mai-HiME", value: "Mai-HiME", url: "http://truyentuan.com/mai-hime/" }, { label: "Mail", value: "Mail", url: "http://truyentuan.com/mail/" }, { label: "Tuyệt Thế Vô Song", value: "Tuyệt Thế Vô Song", url: "http://truyentuan.com/tuyet-the-vo-song/" }, { label: "Sakon", value: "Sakon", url: "http://truyentuan.com/sakon/" }, { label: "Samurai Deeper Kyo", value: "Samurai Deeper Kyo", url: "http://truyentuan.com/samurai-deeper-kyo/" }, { label: "Samurai High School", value: "Samurai High School", url: "http://truyentuan.com/samurai-high-school/" }, { label: "Samurai Usagi", value: "Samurai Usagi", url: "http://truyentuan.com/samurai-usagi/" }, { label: "Sanctuary", value: "Sanctuary", url: "http://truyentuan.com/sanctuary/" }, { label: "Sankarea", value: "Sankarea", url: "http://truyentuan.com/sankarea/" }, { label: "Sanzokuou", value: "Sanzokuou", url: "http://truyentuan.com/sanzokuou/" }, { label: "Savage Garden - Vườn Hoang", value: "Savage Garden - Vườn Hoang", url: "http://truyentuan.com/savage-garden-vuon-hoang/" }, { label: "School Rumble", value: "School Rumble", url: "http://truyentuan.com/school-rumble/" }, { label: "Shounan Junaigumi!", value: "Shounan Junaigumi!", url: "http://truyentuan.com/shounan-junaigumi/" }, { label: "Slam Dunk", value: "Slam Dunk", url: "http://truyentuan.com/slam-dunk/" }, { label: "Song Hùng Kỳ Hiệp", value: "Song Hùng Kỳ Hiệp", url: "http://truyentuan.com/song-hung-ky-hiep/" }, { label: "Siêu Quậy Teppi", value: "Siêu Quậy Teppi", url: "http://truyentuan.com/sieu-quay-teppi/" }, { label: "School Shock", value: "School Shock", url: "http://truyentuan.com/school-shock/" }, { label: "Searching for Love, Miss Fool?", value: "Searching for Love, Miss Fool?", url: "http://truyentuan.com/searching-for-love-miss-fool/" }, { label: "Seishun For-get!", value: "Seishun For-get!", url: "http://truyentuan.com/seishun-for-get/" }, { label: "Sekirei", value: "Sekirei", url: "http://truyentuan.com/sekirei/" }, { label: "Shakugan no Shana", value: "Shakugan no Shana", url: "http://truyentuan.com/shakugan-no-shana/" }, { label: "Shaman King", value: "Shaman King", url: "http://truyentuan.com/shaman-king/" }, { label: "Shamo", value: "Shamo", url: "http://truyentuan.com/shamo/" }, { label: "Shana oh Yoshitsune (Thiếu Niên Vương)", value: "Shana oh Yoshitsune (Thiếu Niên Vương)", url: "http://truyentuan.com/shana-oh-yoshitsune-thieu-nien-vuong/" }, { label: "Shana oh Yoshitsune II (Thiếu Niên Vương 2)", value: "Shana oh Yoshitsune II (Thiếu Niên Vương 2)", url: "http://truyentuan.com/shana-oh-yoshitsune-ii-thieu-nien-vuong-2/" }, { label: "Shigurui - Cuồng Tử", value: "Shigurui - Cuồng Tử", url: "http://truyentuan.com/shigurui-cuong-tu/" }, { label: "Shingeki no Kyojin", value: "Shingeki no Kyojin", url: "http://truyentuan.com/shingeki-no-kyojin/" }, { label: "Shingeki no Kyojin - Before the fall", value: "Shingeki no Kyojin - Before the fall", url: "http://truyentuan.com/shingeki-no-kyojin-before-the-fall/" }, { label: "Shokugeki no Soma", value: "Shokugeki no Soma", url: "http://truyentuan.com/shokugeki-no-soma/" }, { label: "Shounen Dolls", value: "Shounen Dolls", url: "http://truyentuan.com/shounen-dolls/" }, { label: "Show Me the Money", value: "Show Me the Money", url: "http://truyentuan.com/show-me-the-money/" }, { label: "Shugo Chara", value: "Shugo Chara", url: "http://truyentuan.com/shugo-chara/" }, { label: "Shuukatsu!! - Kimi ni Naitei ", value: "Shuukatsu!! - Kimi ni Naitei ", url: "http://truyentuan.com/shuukatsu-kimi-ni-naitei/" }, { label: "Silver Spoon", value: "Silver Spoon", url: "http://truyentuan.com/silver-spoon/" }, { label: "Silvery Crow", value: "Silvery Crow", url: "http://truyentuan.com/silvery-crow/" }, { label: "Sket Dance", value: "Sket Dance", url: "http://truyentuan.com/sket-dance/" }, { label: "Skip Beat", value: "Skip Beat", url: "http://truyentuan.com/skip-beat/" }, { label: "Skyhigh", value: "Skyhigh", url: "http://truyentuan.com/skyhigh/" }, { label: "Skyhigh Karma", value: "Skyhigh Karma", url: "http://truyentuan.com/skyhigh-karma/" }, { label: "Slow Step", value: "Slow Step", url: "http://truyentuan.com/slow-step/" }, { label: "So Long, Mr. Despair", value: "So Long, Mr. Despair", url: "http://truyentuan.com/so-long-mr-despair/" }, { label: "Sora no Otoshimono", value: "Sora no Otoshimono", url: "http://truyentuan.com/sora-no-otoshimono/" }, { label: "Sora no Otoshimono (MTO)", value: "Sora no Otoshimono (MTO)", url: "http://truyentuan.com/sora-no-otoshimono-mto/" }, { label: "Sora Sora", value: "Sora Sora", url: "http://truyentuan.com/sora-sora/" }, { label: "Soul Cartel", value: "Soul Cartel", url: "http://truyentuan.com/soul-cartel/" }, { label: "Spas-pa", value: "Spas-pa", url: "http://truyentuan.com/spas-pa/" }, { label: "Sprite", value: "Sprite", url: "http://truyentuan.com/sprite/" }, { label: "St&rs", value: "St&rs", url: "http://truyentuan.com/strs/" }, { label: "Strain", value: "Strain", url: "http://truyentuan.com/strain/" }, { label: "Street Fighter", value: "Street Fighter", url: "http://truyentuan.com/street-fighter/" }, { label: "Strobe Edge", value: "Strobe Edge", url: "http://truyentuan.com/strobe-edge/" }, { label: "Sugar Dark", value: "Sugar Dark", url: "http://truyentuan.com/sugar-dark/" }, { label: "Sun-ken Rock", value: "Sun-ken Rock", url: "http://truyentuan.com/sun-ken-rock/" }, { label: "Sun-ken Rock (Amethyst)", value: "Sun-ken Rock (Amethyst)", url: "http://truyentuan.com/sun-ken-rock-amethyst/" }, { label: "Super Oresama Love Story", value: "Super Oresama Love Story", url: "http://truyentuan.com/super-oresama-love-story/" }, { label: "Suzuka", value: "Suzuka", url: "http://truyentuan.com/suzuka/" }, { label: "Switch girl!", value: "Switch girl!", url: "http://truyentuan.com/switch-girl/" }, { label: "SWOT", value: "SWOT", url: "http://truyentuan.com/swot/" }, { label: "Ragnarok - Into the Abyss", value: "Ragnarok - Into the Abyss", url: "http://truyentuan.com/ragnarok-into-the-abyss/" }, { label: "Rainbow", value: "Rainbow", url: "http://truyentuan.com/rainbow/" }, { label: "Ranma 1/2", value: "Ranma 1/2", url: "http://truyentuan.com/ranma-1-2/" }, { label: "Rappi Rangai", value: "Rappi Rangai", url: "http://truyentuan.com/rappi-rangai/" }, { label: "Ratman", value: "Ratman", url: "http://truyentuan.com/ratman/" }, { label: "Rave Master", value: "Rave Master", url: "http://truyentuan.com/rave-master/" }, { label: "RE:BIRTH - The Lunatic Taker", value: "RE:BIRTH - The Lunatic Taker", url: "http://truyentuan.com/rebirth-the-lunatic-taker/" }, { label: "Rorona no Atelier: Watashi no Takaramono", value: "Rorona no Atelier: Watashi no Takaramono", url: "http://truyentuan.com/rorona-no-atelier-watashi-no-takaramono/" }, { label: "Rosario+Vampire", value: "Rosario+Vampire", url: "http://truyentuan.com/rosariovampire/" }, { label: "Rosario+Vampire II", value: "Rosario+Vampire II", url: "http://truyentuan.com/rosariovampire-ii/" }, { label: "Rose Hip Rose", value: "Rose Hip Rose", url: "http://truyentuan.com/rose-hip-rose/" }, { label: "Rose Hip Zero", value: "Rose Hip Zero", url: "http://truyentuan.com/rose-hip-zero/" }, { label: "Paladin", value: "Paladin", url: "http://truyentuan.com/paladin/" }, { label: "Pandora Hearts", value: "Pandora Hearts", url: "http://truyentuan.com/pandora-hearts/" }, { label: "Parallel", value: "Parallel", url: "http://truyentuan.com/parallel/" }, { label: "Pastel", value: "Pastel", url: "http://truyentuan.com/pastel/" }, { label: "Penguin Brothers", value: "Penguin Brothers", url: "http://truyentuan.com/penguin-brothers/" }, { label: "Persona 3", value: "Persona 3", url: "http://truyentuan.com/persona-3/" }, { label: "Phong Lôi", value: "Phong Lôi", url: "http://truyentuan.com/phong-loi/" }, { label: "Phong Thần Ký", value: "Phong Thần Ký", url: "http://truyentuan.com/phong-than-ky/" }, { label: "Phong Vân", value: "Phong Vân", url: "http://truyentuan.com/phong-van/" }, { label: "Phong Vân Tân Tác Thần Võ Ký", value: "Phong Vân Tân Tác Thần Võ Ký", url: "http://truyentuan.com/phong-van-tan-tac-than-vo-ky/" }, { label: "Ping", value: "Ping", url: "http://truyentuan.com/ping/" }, { label: "Pink Lady", value: "Pink Lady", url: "http://truyentuan.com/pink-lady/" }, { label: "Pluto", value: "Pluto", url: "http://truyentuan.com/pluto/" }, { label: "Pokémon Pocket Monsters", value: "Pokémon Pocket Monsters", url: "http://truyentuan.com/pokemon-pocket-monsters/" }, { label: "Power!!", value: "Power!!", url: "http://truyentuan.com/power/" }, { label: "Present", value: "Present", url: "http://truyentuan.com/present/" }, { label: "Prince of Tennis", value: "Prince of Tennis", url: "http://truyentuan.com/prince-of-tennis/" }, { label: "Prison School", value: "Prison School", url: "http://truyentuan.com/prison-school/" }, { label: "Prunus Girl", value: "Prunus Girl", url: "http://truyentuan.com/prunus-girl/" }, { label: "Psycho Pass", value: "Psycho Pass", url: "http://truyentuan.com/psycho-pass/" }, { label: "Psychometrer Eiji", value: "Psychometrer Eiji", url: "http://truyentuan.com/psychometrer-eiji/" }, { label: "Psyren", value: "Psyren", url: "http://truyentuan.com/psyren/" }, { label: "Q&A", value: "Q&A", url: "http://truyentuan.com/qa/" }, { label: "Old Boy", value: "Old Boy", url: "http://truyentuan.com/old-boy/" }, { label: "Omamori Himari", value: "Omamori Himari", url: "http://truyentuan.com/omamori-himari/" }, { label: "One Piece x Toriko", value: "One Piece x Toriko", url: "http://truyentuan.com/one-piece-x-toriko/" }, { label: "Onepunch-Man", value: "Onepunch-Man", url: "http://truyentuan.com/onepunch-man/" }, { label: "Ong Đưa Thư", value: "Ong Đưa Thư", url: "http://truyentuan.com/ong-dua-thu/" }, { label: "Onii-chan Em Ghét Anh!", value: "Onii-chan Em Ghét Anh!", url: "http://truyentuan.com/onii-chan-em-ghet-anh/" }, { label: "Oresama Teacher", value: "Oresama Teacher", url: "http://truyentuan.com/oresama-teacher/" }, { label: "Orochi", value: "Orochi", url: "http://truyentuan.com/orochi/" }, { label: "Otogi Matsuri", value: "Otogi Matsuri", url: "http://truyentuan.com/otogi-matsuri/" }, { label: "Otoyomegatari", value: "Otoyomegatari", url: "http://truyentuan.com/otoyomegatari/" }, { label: "Ouke no Monshou - Nữ Hoàng Ai Cập", value: "Ouke no Monshou - Nữ Hoàng Ai Cập", url: "http://truyentuan.com/ouke-no-monshou-nu-hoang-ai-cap/" }, { label: "Our Happy Hours", value: "Our Happy Hours", url: "http://truyentuan.com/our-happy-hours/" }, { label: "Nabari no Ou", value: "Nabari no Ou", url: "http://truyentuan.com/nabari-no-ou/" }, { label: "Nagasarete Airantou", value: "Nagasarete Airantou", url: "http://truyentuan.com/nagasarete-airantou/" }, { label: "Nana", value: "Nana", url: "http://truyentuan.com/nana/" }, { label: "Natsume Yuujinchou", value: "Natsume Yuujinchou", url: "http://truyentuan.com/natsume-yuujinchou/" }, { label: "Nephilim", value: "Nephilim", url: "http://truyentuan.com/nephilim/" }, { label: "New Prince of Tennis", value: "New Prince of Tennis", url: "http://truyentuan.com/new-prince-of-tennis/" }, { label: "Như Lai Thần Chưởng", value: "Như Lai Thần Chưởng", url: "http://truyentuan.com/nhu-lai-than-chuong/" }, { label: "Nine", value: "Nine", url: "http://truyentuan.com/nine/" }, { label: "Nineteen, Twenty-one", value: "Nineteen, Twenty-one", url: "http://truyentuan.com/nineteen-twenty-one/" }, { label: "Nise Koi", value: "Nise Koi", url: "http://truyentuan.com/nise-koi/" }, { label: "Nise Koi (One Shot)", value: "Nise Koi (One Shot)", url: "http://truyentuan.com/nise-koi-one-shot/" }, { label: "Noblesse", value: "Noblesse", url: "http://truyentuan.com/noblesse/" }, { label: "Nodame Cantabile", value: "Nodame Cantabile", url: "http://truyentuan.com/nodame-cantabile/" }, { label: "Number", value: "Number", url: "http://truyentuan.com/number/" }, { label: "Nyankoi!", value: "Nyankoi!", url: "http://truyentuan.com/nyankoi/" }, { label: "Jackals", value: "Jackals", url: "http://truyentuan.com/jackals/" }, { label: "Jisatsu Circle (Vòng Quay Tự Sát)", value: "Jisatsu Circle (Vòng Quay Tự Sát)", url: "http://truyentuan.com/jisatsu-circle-vong-quay-tu-sat/" }, { label: "JoJo's Bizarre Adventure", value: "JoJo's Bizarre Adventure", url: "http://truyentuan.com/jojos-bizarre-adventure/" }, { label: "Joshikousei", value: "Joshikousei", url: "http://truyentuan.com/joshikousei/" }, { label: "K-On!", value: "K-On!", url: "http://truyentuan.com/k-on/" }, { label: "Kamen Teacher", value: "Kamen Teacher", url: "http://truyentuan.com/kamen-teacher/" }, { label: "Kamen Teacher Black", value: "Kamen Teacher Black", url: "http://truyentuan.com/kamen-teacher-black/" }, { label: "Kamisama Hajimemashita", value: "Kamisama Hajimemashita", url: "http://truyentuan.com/kamisama-hajimemashita/" }, { label: "Kandachime", value: "Kandachime", url: "http://truyentuan.com/kandachime/" }, { label: "Karate Shoukoushi Kohinata Minoru", value: "Karate Shoukoushi Kohinata Minoru", url: "http://truyentuan.com/karate-shoukoushi-kohinata-minoru/" }, { label: "Karin", value: "Karin", url: "http://truyentuan.com/karin/" }, { label: "Kateikyoushi Hitman Reborn", value: "Kateikyoushi Hitman Reborn", url: "http://truyentuan.com/kateikyoushi-hitman-reborn/" }, { label: "Kateikyoushi Hitman Reborn Special Racer", value: "Kateikyoushi Hitman Reborn Special Racer", url: "http://truyentuan.com/kateikyoushi-hitman-reborn-special-racer/" }, { label: "Kaze Hikaru", value: "Kaze Hikaru", url: "http://truyentuan.com/kaze-hikaru/" }, { label: "Kekkaishi", value: "Kekkaishi", url: "http://truyentuan.com/kekkaishi/" }, { label: "Kenji", value: "Kenji", url: "http://truyentuan.com/kenji/" }, { label: "Kenji Ngoại Truyện", value: "Kenji Ngoại Truyện", url: "http://truyentuan.com/kenji-ngoai-truyen/" }, { label: "Kid Gang", value: "Kid Gang", url: "http://truyentuan.com/kid-gang/" }, { label: "Kimi ni Todoke", value: "Kimi ni Todoke", url: "http://truyentuan.com/kimi-ni-todoke/" }, { label: "Kimi to Koi no Tochuu", value: "Kimi to Koi no Tochuu", url: "http://truyentuan.com/kimi-to-koi-no-tochuu/" }, { label: "King of Fighters Kyo", value: "King of Fighters Kyo", url: "http://truyentuan.com/king-of-fighters-kyo/" }, { label: "Kingdom Hearts", value: "Kingdom Hearts", url: "http://truyentuan.com/kingdom-hearts/" }, { label: "Kinnikuman", value: "Kinnikuman", url: "http://truyentuan.com/kinnikuman/" }, { label: "Kiseijuu", value: "Kiseijuu", url: "http://truyentuan.com/kiseijuu/" }, { label: "Kitchen Princess", value: "Kitchen Princess", url: "http://truyentuan.com/kitchen-princess/" }, { label: "Koe de Oshigoto!", value: "Koe de Oshigoto!", url: "http://truyentuan.com/koe-de-oshigoto/" }, { label: "Koi Neko", value: "Koi Neko", url: "http://truyentuan.com/koi-neko/" }, { label: "Koko Tekken-den TOUGH", value: "Koko Tekken-den TOUGH", url: "http://truyentuan.com/koko-tekken-den-tough/" }, { label: "Kongou Banchou", value: "Kongou Banchou", url: "http://truyentuan.com/kongou-banchou/" }, { label: "Kotaro Makaritoru", value: "Kotaro Makaritoru", url: "http://truyentuan.com/kotaro-makaritoru/" }, { label: "Kungfu", value: "Kungfu", url: "http://truyentuan.com/kungfu/" }, { label: "Kurogane", value: "Kurogane", url: "http://truyentuan.com/kurogane/" }, { label: "Kurohime", value: "Kurohime", url: "http://truyentuan.com/kurohime/" }, { label: "Kuroko no Basket", value: "Kuroko no Basket", url: "http://truyentuan.com/kuroko-no-basket/" }, { label: "Kurosagi: The Black Swindler", value: "Kurosagi: The Black Swindler", url: "http://truyentuan.com/kurosagi-the-black-swindler/" }, { label: "Kyou, Koi wo Hajimemasu", value: "Kyou, Koi wo Hajimemasu", url: "http://truyentuan.com/kyou-koi-wo-hajimemasu/" }, { label: "Kyoukai no Rinne", value: "Kyoukai no Rinne", url: "http://truyentuan.com/kyoukai-no-rinne/" }, { label: "Mangaka-san to Assistant-san to", value: "Mangaka-san to Assistant-san to", url: "http://truyentuan.com/mangaka-san-to-assistant-san-to/" }, { label: "Manhole", value: "Manhole", url: "http://truyentuan.com/manhole/" }, { label: "Maoh: Juvenile Remix", value: "Maoh: Juvenile Remix", url: "http://truyentuan.com/maoh-juvenile-remix/" }, { label: 'Maoyuu Maoh Yuusha - "Kono Watashi no Mono Tonare, Yuusha yo" "Kotowaru!"', value: 'Maoyuu Maoh Yuusha - "Kono Watashi no Mono Tonare, Yuusha yo" "Kotowaru!"', url: "http://truyentuan.com/maoyuu-maoh-yuusha-kono-watashi-no-mono-tonare-yuusha-yo-kotowaru/" }, { label: "MAR", value: "MAR", url: "http://truyentuan.com/mar/" }, { label: "Marmalade Boy", value: "Marmalade Boy", url: "http://truyentuan.com/marmalade-boy/" }, { label: "Max Lovely", value: "Max Lovely", url: "http://truyentuan.com/max-lovely/" }, { label: "Me wo Mite Hanase (Hãy Nhìn Vào Mắt Em Khi Anh Nói)", value: "Me wo Mite Hanase (Hãy Nhìn Vào Mắt Em Khi Anh Nói)", url: "http://truyentuan.com/me-wo-mite-hanase-hay-nhin-vao-mat-em-khi-anh-noi/" }, { label: "Medaka Box", value: "Medaka Box", url: "http://truyentuan.com/medaka-box/" }, { label: "Melty Blood", value: "Melty Blood", url: "http://truyentuan.com/melty-blood/" }, { label: "Mermaid Saga", value: "Mermaid Saga", url: "http://truyentuan.com/mermaid-saga/" }, { label: "Merupuri", value: "Merupuri", url: "http://truyentuan.com/merupuri/" }, { label: "Midori no Hibi", value: "Midori no Hibi", url: "http://truyentuan.com/midori-no-hibi/" }, { label: "Minami-ke", value: "Minami-ke", url: "http://truyentuan.com/minami-ke/" }, { label: "Minamoto-kun Monogatari", value: "Minamoto-kun Monogatari", url: "http://truyentuan.com/minamoto-kun-monogatari/" }, { label: "Mister Ajikko", value: "Mister Ajikko", url: "http://truyentuan.com/mister-ajikko/" }, { label: "MIXiM★11", value: "MIXiM★11", url: "http://truyentuan.com/mixim%e2%98%8511/" }, { label: "Miyuki", value: "Miyuki", url: "http://truyentuan.com/miyuki/" }, { label: "Moe Kare!!", value: "Moe Kare!!", url: "http://truyentuan.com/moe-kare/" }, { label: "Momo", value: "Momo", url: "http://truyentuan.com/momo/" }, { label: "Monk", value: "Monk", url: "http://truyentuan.com/monk/" }, { label: "Monster Soul", value: "Monster Soul", url: "http://truyentuan.com/monster-soul/" }, { label: "Mr. Fullswing", value: "Mr. Fullswing", url: "http://truyentuan.com/mr-fullswing/" }, { label: "Musashi Number Nine", value: "Musashi Number Nine", url: "http://truyentuan.com/musashi-number-nine/" }, { label: "Muv-Luv Alternative", value: "Muv-Luv Alternative", url: "http://truyentuan.com/muv-luv-alternative/" }, { label: "Mx0", value: "Mx0", url: "http://truyentuan.com/mx0/" }, { label: "My Little Sister Can't Be This Cute", value: "My Little Sister Can't Be This Cute", url: "http://truyentuan.com/my-little-sister-cant-be-this-cute/" }, { label: "Mysterious Girlfriend X", value: "Mysterious Girlfriend X", url: "http://truyentuan.com/mysterious-girlfriend-x/" }, { label: "Infinite Stratos", value: "Infinite Stratos", url: "http://truyentuan.com/infinite-stratos/" }, { label: "Into the Forest of Fireflies' Light", value: "Into the Forest of Fireflies' Light", url: "http://truyentuan.com/into-the-forest-of-fireflies-light/" }, { label: "Inu Yasha", value: "Inu Yasha", url: "http://truyentuan.com/inu-yasha/" }, { label: "Iris Zero", value: "Iris Zero", url: "http://truyentuan.com/iris-zero/" }, { label: "Isuca", value: "Isuca", url: "http://truyentuan.com/isuca/" }, { label: "It Started With a Kiss", value: "It Started With a Kiss", url: "http://truyentuan.com/it-started-with-a-kiss/" }, { label: "It's Not My Fault That I'm Not Popular!", value: "It's Not My Fault That I'm Not Popular!", url: "http://truyentuan.com/its-not-my-fault-that-im-not-popular/" }, { label: "Ỷ Thiên Đồ Long Ký", value: "Ỷ Thiên Đồ Long Ký", url: "http://truyentuan.com/y-thien-do-long-ky/" }, { label: "Đất Rồng", value: "Đất Rồng", url: "http://truyentuan.com/dat-rong/" }, { label: "Đấu La Đại Lục", value: "Đấu La Đại Lục", url: "http://truyentuan.com/dau-la-dai-luc/" }, { label: "Đấu Phá Thương Khung", value: "Đấu Phá Thương Khung", url: "http://truyentuan.com/dau-pha-thuong-khung/" }, { label: "Ganbare Genki - Khát Vọng Vô Địch", value: "Ganbare Genki - Khát Vọng Vô Địch", url: "http://truyentuan.com/ganbare-genki-khat-vong-vo-dich/" }, { label: "Claymore", value: "Claymore", url: "http://truyentuan.com/claymore/" }, { label: "Ô Long Viện 2", value: "Ô Long Viện 2", url: "http://truyentuan.com/o-long-vien-2/" }, { label: "Bitagi - Anh Chàng Ngổ Ngáo", value: "Bitagi - Anh Chàng Ngổ Ngáo", url: "http://truyentuan.com/bitagi-anh-chang-ngo-ngao/" }, { label: "The Devil King Is Bored", value: "The Devil King Is Bored", url: "http://truyentuan.com/the-devil-king-is-bored/" }, { label: "Dengeki Daisy", value: "Dengeki Daisy", url: "http://truyentuan.com/dengeki-daisy/" }, { label: "Hàng Xóm Của Tôi Là Rồng", value: "Hàng Xóm Của Tôi Là Rồng", url: "http://truyentuan.com/hang-xom-cua-toi-la-rong/" }, { label: "Denpa Kyoushi", value: "Denpa Kyoushi", url: "http://truyentuan.com/denpa-kyoushi/" }, { label: "Terra Formars", value: "Terra Formars", url: "http://truyentuan.com/terra-formars/" }, { label: "Nanatsu no Taizai", value: "Nanatsu no Taizai", url: "http://truyentuan.com/nanatsu-no-taizai/" }, { label: "Rakshasa Street", value: "Rakshasa Street", url: "http://truyentuan.com/rakshasa-street/" }, { label: "Examurai", value: "Examurai", url: "http://truyentuan.com/examurai/" }, { label: "Nobunaga no Chef", value: "Nobunaga no Chef", url: "http://truyentuan.com/nobunaga-chef/" }, { label: "Area D", value: "Area D", url: "http://truyentuan.com/area-d/" }, { label: "UQ Holder!", value: "UQ Holder!", url: "http://truyentuan.com/uq-holder/" }, { label: "Donyatsu", value: "Donyatsu", url: "http://truyentuan.com/donyatsu/" }, { label: "Lục Đạo Thiên Thư", value: "Lục Đạo Thiên Thư", url: "http://truyentuan.com/luc-dao-thien-thu/" }, { label: "The Gamer", value: "The Gamer", url: "http://truyentuan.com/the-gamer/" }, { label: "Mangaka-san to Assistant-san to 2", value: "Mangaka-san to Assistant-san to 2", url: "http://truyentuan.com/mangaka-san-to-assistant-san-to-2/" }, { label: "Flags", value: "Flags", url: "http://truyentuan.com/flags/" }, { label: "Inaba Rabbits", value: "Inaba Rabbits", url: "http://truyentuan.com/inaba-rabbits/" }, { label: "Iron Knight", value: "Iron Knight", url: "http://truyentuan.com/iron-knight/" }, { label: "Dragon Recipe", value: "Dragon Recipe", url: "http://truyentuan.com/dragon-recipe/" }, { label: "Fantasma", value: "Fantasma", url: "http://truyentuan.com/fantasma/" }, { label: "World Trigger", value: "World Trigger", url: "http://truyentuan.com/world-trigger/" }, { label: "DICE", value: "DICE", url: "http://truyentuan.com/dice/" }, { label: "All You Need Is Kill", value: "All You Need Is Kill", url: "http://truyentuan.com/all-you-need-is-kill/" }, { label: "Aiki-S", value: "Aiki-S", url: "http://truyentuan.com/aiki-s/" }, { label: "Shaman King: Flowers", value: "Shaman King: Flowers", url: "http://truyentuan.com/shaman-king-flowers/" }, { label: "Adventure of Sinbad", value: "Adventure of Sinbad", url: "http://truyentuan.com/adventure-of-sinbad/" }, { label: "Area D (DP)", value: "Area D (DP)", url: "http://truyentuan.com/area-d-dp/" }, { label: "Túy Quyền", value: "Túy Quyền", url: "http://truyentuan.com/tuy-quyen/" }, { label: "Aho Girl", value: "Aho Girl", url: "http://truyentuan.com/aho-girl/" }, { label: "Dragons Rioting", value: "Dragons Rioting", url: "http://truyentuan.com/dragons-rioting/" }, { label: "Demon King Daimao", value: "Demon King Daimao", url: "http://truyentuan.com/demon-king-daimao/" }, { label: "Thôn Phệ Tinh Không", value: "Thôn Phệ Tinh Không", url: "http://truyentuan.com/thon-phe-tinh-khong/" }, { label: "Shin Kurosagi: Con Diệc Đen 2", value: "Shin Kurosagi: Con Diệc Đen 2", url: "http://truyentuan.com/shin-kurosagi-con-diec-den-2/" }, { label: "Black Haze", value: "Black Haze", url: "http://truyentuan.com/black-haze/" }, { label: "Forever Evil", value: "Forever Evil", url: "http://truyentuan.com/forever-evil/" }, { label: "Haikyuu!!", value: "Haikyuu!!", url: "http://truyentuan.com/haikyuu/" }, { label: "Giant Killing", value: "Giant Killing", url: "http://truyentuan.com/giant-killing/" }, { label: "Doubt! (AMANO Sakuya)", value: "Doubt! (AMANO Sakuya)", url: "http://truyentuan.com/doubt-amano-sakuya/" }, { label: "Coppelion", value: "Coppelion", url: "http://truyentuan.com/coppelion/" }, { label: "Cửu Đỉnh Ký", value: "Cửu Đỉnh Ký", url: "http://truyentuan.com/cuu-dinh-ky/" }, { label: "Kotaro Makaritoru! L", value: "Kotaro Makaritoru! L", url: "http://truyentuan.com/kotaro-makaritoru-l/" }, { label: "Rockman 1", value: "Rockman 1", url: "http://truyentuan.com/rockman-1/" }, { label: "Sakamoto Desu ga?", value: "Sakamoto Desu ga?", url: "http://truyentuan.com/sakamoto-desu-ga/" }, { label: "Rockman 2", value: "Rockman 2", url: "http://truyentuan.com/rockman-2/" }, { label: "Dragon's Son Changsik", value: "Dragon's Son Changsik", url: "http://truyentuan.com/dragons-son-changsik/" }, { label: "Megaman X1", value: "Megaman X1", url: "http://truyentuan.com/megaman-x1/" }, { label: "Megaman X2", value: "Megaman X2", url: "http://truyentuan.com/megaman-x2/" }, { label: "Himouto! Umaru-chan", value: "Himouto! Umaru-chan", url: "http://truyentuan.com/himouto-umaru-chan/" }, { label: "Megaman X3", value: "Megaman X3", url: "http://truyentuan.com/megaman-x3/" }, { label: "Liên Minh Huyền Thoại", value: "Liên Minh Huyền Thoại", url: "http://truyentuan.com/lien-minh-huyen-thoai/" }, { label: "Megaman X Irregular Hunter", value: "Megaman X Irregular Hunter", url: "http://truyentuan.com/megaman-x-irregular-hunter/" }, { label: "Illegal Rare", value: "Illegal Rare", url: "http://truyentuan.com/illegal-rare/" }, { label: "Sưu Thần Ký", value: "Sưu Thần Ký", url: "http://truyentuan.com/suu-than-ky/" }, { label: "Boku Girl", value: "Boku Girl", url: "http://truyentuan.com/boku-girl/" }, { label: "Noragami", value: "Noragami", url: "http://truyentuan.com/noragami/" }, { label: "Ability", value: "Ability", url: "http://truyentuan.com/ability/" }, { label: "Jojo's Bizarre Adventure [Jojo]", value: "Jojo's Bizarre Adventure [Jojo]", url: "http://truyentuan.com/jojo-bizarre-adventure-jojo/" }, { label: "Majin Tantei Nougami Neuro", value: "Majin Tantei Nougami Neuro", url: "http://truyentuan.com/majin-tantei-nougami-neuro/" }, { label: "Arslan Chiến Ký", value: "Arslan Chiến Ký", url: "http://truyentuan.com/arslan-chien-ky/" }, { label: "Gamble Fish (thegioithugian)", value: "Gamble Fish (thegioithugian)", url: "http://truyentuan.com/gamble-fish-thegioithugian/" }, { label: "Dong Binh Thiên Hạ", value: "Dong Binh Thiên Hạ", url: "http://truyentuan.com/dong-binh-thien-ha/" }, { label: "Stealth Symphony", value: "Stealth Symphony", url: "http://truyentuan.com/stealth-symphony/" }, { label: "Shingeki no Kyojin - Birth of Levi", value: "Shingeki no Kyojin - Birth of Levi", url: "http://truyentuan.com/shingeki-no-kyojin-birth-of-levi/" }, { label: "Tsugumomo", value: "Tsugumomo", url: "http://truyentuan.com/tsugumomo/" }, { label: "Attaque", value: "Attaque", url: "http://truyentuan.com/attaque/" }, { label: "Gun x Clover", value: "Gun x Clover", url: "http://truyentuan.com/gun-x-clover/" }, { label: "Black Bullet", value: "Black Bullet", url: "http://truyentuan.com/black-bullet/" }, { label: "Tokyo ESP", value: "Tokyo ESP", url: "http://truyentuan.com/tokyo-esp/" }, { label: "Flow", value: "Flow", url: "http://truyentuan.com/flow/" }, { label: "Ultraman", value: "Ultraman", url: "http://truyentuan.com/ultraman/" }, { label: "Cô Gái Người Máy Odette", value: "Cô Gái Người Máy Odette", url: "http://truyentuan.com/co-gai-nguoi-may-odette/" }, { label: "Bushidou Sixteen", value: "Bushidou Sixteen", url: "http://truyentuan.com/bushidou-sixteen/" }, { label: "Nozo x Kimi", value: "Nozo x Kimi", url: "http://truyentuan.com/nozo-x-kimi/" }, { label: "Pokemon Pippi DP", value: "Pokemon Pippi DP", url: "http://truyentuan.com/pokemon-pippi-dp/" }, { label: "Bullet Armors", value: "Bullet Armors", url: "http://truyentuan.com/bullet-armors/" }, { label: "Hive", value: "Hive", url: "http://truyentuan.com/hive/" }, { label: "Real Account", value: "Real Account", url: "http://truyentuan.com/real-account/" }, { label: "Long Thần Tướng ", value: "Long Thần Tướng ", url: "http://truyentuan.com/long-than-tuong/" }, { label: "Maken-Ki!", value: "Maken-Ki!", url: "http://truyentuan.com/maken-ki/" }, { label: "Green Blood", value: "Green Blood", url: "http://truyentuan.com/green-blood/" }, { label: "Pokemon Special", value: "Pokemon Special", url: "http://truyentuan.com/pokemon-special/" }, { label: "GTO: Paradise Lost", value: "GTO: Paradise Lost", url: "http://truyentuan.com/gto-paradise-lost/" }, { label: "Ultimate Legend: Kang Hae Hyo", value: "Ultimate Legend: Kang Hae Hyo", url: "http://truyentuan.com/ultimate-legend-kang-hae-hyo/" }, { label: "Rubic số 8", value: "Rubic số 8", url: "http://truyentuan.com/rubic-so-8/" }, { label: "Shinobi no Kuni", value: "Shinobi no Kuni", url: "http://truyentuan.com/shinobi-no-kuni/" }, { label: "Life", value: "Life", url: "http://truyentuan.com/life/" }, { label: "Tokyo Innocent", value: "Tokyo Innocent", url: "http://truyentuan.com/tokyo-innocent/" }, { label: "Modify", value: "Modify", url: "http://truyentuan.com/modify/" }, { label: "Inu Yashiki - Lão Già Khốn Khổ", value: "Inu Yashiki - Lão Già Khốn Khổ", url: "http://truyentuan.com/inu-yashiki-lao-gia-khon-kho/" }, { label: "Green Worldz", value: "Green Worldz", url: "http://truyentuan.com/green-worldz/" }, { label: "1001 Knights", value: "1001 Knights", url: "http://truyentuan.com/1001-knights/" }, { label: "Stepping on roses", value: "Stepping on roses", url: "http://truyentuan.com/stepping-on-roses/" }, { label: "TAL", value: "TAL", url: "http://truyentuan.com/tal/" }, { label: "Silver Diamond", value: "Silver Diamond", url: "http://truyentuan.com/silver-diamond/" }, { label: "A-bout!", value: "A-bout!", url: "http://truyentuan.com/a-bout/" }, { label: "Hakaijuu", value: "Hakaijuu", url: "http://truyentuan.com/hakaijuu/" }, { label: "Fuuka", value: "Fuuka", url: "http://truyentuan.com/fuuka/" }, { label: "One Piece Mini Story", value: "One Piece Mini Story", url: "http://truyentuan.com/one-piece-mini-story/" }, { label: "Yuureitou", value: "Yuureitou", url: "http://truyentuan.com/yuureitou/" }, { label: "Sentou Hakai Gakuen Dangerous", value: "Sentou Hakai Gakuen Dangerous", url: "http://truyentuan.com/sentou-hakai-gakuen-dangerous/" }, { label: "Blackest Night", value: "Blackest Night", url: "http://truyentuan.com/blackest-night/" }, { label: "Vua Bếp Soma", value: "Vua Bếp Soma", url: "http://truyentuan.com/vua-bep-soma/" }, { label: "Ana Satsujin", value: "Ana Satsujin", url: "http://truyentuan.com/ana-satsujin/" }, { label: "Cross Over", value: "Cross Over", url: "http://truyentuan.com/cross-over/" }, { label: "Youkai Shoujo - Monsuga", value: "Youkai Shoujo - Monsuga", url: "http://truyentuan.com/youkai-shoujo-monsuga/" }, { label: "Kami-sama Drop", value: "Kami-sama Drop", url: "http://truyentuan.com/kami-sama-drop/" }, { label: "Shinigami no Ballad", value: "Shinigami no Ballad", url: "http://truyentuan.com/shinigami-no-ballad/" }, { label: "Saiki Kusuo no Sainan", value: "Saiki Kusuo no Sainan", url: "http://truyentuan.com/saiki-kusuo-no-sainan/" }, { label: "Toukyou Kushu", value: "Toukyou Kushu", url: "http://truyentuan.com/toukyou-kushu/" }, { label: "Huyền Thoại Karate", value: "Huyền Thoại Karate", url: "http://truyentuan.com/huyen-thoai-karate/" }, { label: "Painting Warriors", value: "Painting Warriors", url: "http://truyentuan.com/painting-warriors/" }, { label: "Mairunovich", value: "Mairunovich", url: "http://truyentuan.com/mairunovich/" }, { label: "Wonted", value: "Wonted", url: "http://truyentuan.com/wonted/" }, { label: "Evergreen Tea", value: "Evergreen Tea", url: "http://truyentuan.com/evergreen-tea/" }, { label: "Binbougami Ga!", value: "Binbougami Ga!", url: "http://truyentuan.com/binbougami-ga/" }, { label: "Boku to Issho", value: "Boku to Issho", url: "http://truyentuan.com/boku-to-issho/" }, { label: "Wagatsuma-san wa Ore no Yome", value: "Wagatsuma-san wa Ore no Yome", url: "http://truyentuan.com/wagatsuma-san-wa-ore-no-yome/" }, { label: "Let's Lagoon", value: "Let's Lagoon", url: "http://truyentuan.com/lets-lagoon/" }, { label: "Nội Tôi Toàn Kể Truyện Bựa", value: "Nội Tôi Toàn Kể Truyện Bựa", url: "http://truyentuan.com/noi-toi-toan-ke-truyen-bua/" }, { label: "Love Riron", value: "Love Riron", url: "http://truyentuan.com/love-riron/" }, { label: "Kingdom - Vương Giả Thiên Hạ", value: "Kingdom - Vương Giả Thiên Hạ", url: "http://truyentuan.com/kingdom-vuong-gia-thien-ha/" }, { label: "Ashita Dorobou", value: "Ashita Dorobou", url: "http://truyentuan.com/ashita-dorobou/" }, { label: "Zai x 10", value: "Zai x 10", url: "http://truyentuan.com/zai-x-10/" }, { label: "Kodomo no Jikan", value: "Kodomo no Jikan", url: "http://truyentuan.com/kodomo-no-jikan/" }, { label: "Thiên Mệnh", value: "Thiên Mệnh", url: "http://truyentuan.com/thien-menh/" }, { label: "Chim cánh cụt Ginji", value: "Chim cánh cụt Ginji", url: "http://truyentuan.com/chim-canh-cut-ginji/" }, { label: "Ocha Nigosu", value: "Ocha Nigosu", url: "http://truyentuan.com/ocha-nigosu/" }, { label: "Versailles no Bara", value: "Versailles no Bara", url: "http://truyentuan.com/versailles-no-bara/" }, { label: "Giang Hồ Bá Đạo Ký", value: "Giang Hồ Bá Đạo Ký", url: "http://truyentuan.com/giang-ho-ba-dao-ky/" }, { label: "Tần Thời Minh Nguyệt - Bách Bộ Phi Kiếm", value: "Tần Thời Minh Nguyệt - Bách Bộ Phi Kiếm", url: "http://truyentuan.com/tan-thoi-minh-nguyet-bach-bo-phi-kiem/" }, { label: "Fairy Tail Ice Trail", value: "Fairy Tail Ice Trail", url: "http://truyentuan.com/fairy-tail-ice-trail/" }, { label: "Fairy Tail Zero", value: "Fairy Tail Zero", url: "http://truyentuan.com/fairy-tail-zero/" }, { label: "Killing Bites", value: "Killing Bites", url: "http://truyentuan.com/killing-bites/" }, { label: "Orange Marmalade", value: "Orange Marmalade", url: "http://truyentuan.com/orange-marmalade/" }, { label: "Black Lagoon", value: "Black Lagoon", url: "http://truyentuan.com/black-lagoon/" }, { label: "Ashita no Joe", value: "Ashita no Joe", url: "http://truyentuan.com/ashita-no-joe/" }, { label: "Rising x Rydeen", value: "Rising x Rydeen", url: "http://truyentuan.com/rising-x-rydeen/" }, { label: "Shindere Shoujo to Kodoku na Shinigami", value: "Shindere Shoujo to Kodoku na Shinigami", url: "http://truyentuan.com/shindere-shoujo-to-kodoku-na-shinigami/" }, { label: "Seikoku No Dragonar", value: "Seikoku No Dragonar", url: "http://truyentuan.com/seikoku-no-dragonar/" }, { label: "Danshi Koukousei no Nichijou", value: "Danshi Koukousei no Nichijou", url: "http://truyentuan.com/danshi-koukousei-no-nichijou/" }, { label: "B Gata H Kei", value: "B Gata H Kei", url: "http://truyentuan.com/b-gata-h-kei/" }, { label: "Horimiya", value: "Horimiya", url: "http://truyentuan.com/horimiya/" }, { label: "+Anima", value: "+Anima", url: "http://truyentuan.com/anima/" }, { label: "Owari no Seraph", value: "Owari no Seraph", url: "http://truyentuan.com/owari-no-seraph/" }, { label: "Boku wa Mari no Naka", value: "Boku wa Mari no Naka", url: "http://truyentuan.com/boku-wa-mari-no-naka/" }, { label: "Em Bé Ufo", value: "Em Bé Ufo", url: "http://truyentuan.com/em-be-ufo/" }, { label: "Witch Craft Works", value: "Witch Craft Works", url: "http://truyentuan.com/witch-craft-works/" }, { label: "Kung Fu Komang", value: "Kung Fu Komang", url: "http://truyentuan.com/kung-fu-komang/" }, { label: "Umisho", value: "Umisho", url: "http://truyentuan.com/umisho/" }, { label: "Meteor Methuselah", value: "Meteor Methuselah", url: "http://truyentuan.com/meteor-methuselah/" }, { label: "Alice In Hell", value: "Alice In Hell", url: "http://truyentuan.com/alice-in-hell/" }, { label: "Centaur no Nayami", value: "Centaur no Nayami", url: "http://truyentuan.com/centaur-no-nayami/" }, { label: "Rain", value: "Rain", url: "http://truyentuan.com/rain/" }, { label: "Ore ga Heroine o Tasukesugite Sekai ga Little Mokushiroku!?", value: "Ore ga Heroine o Tasukesugite Sekai ga Little Mokushiroku!?", url: "http://truyentuan.com/ore-ga-heroine-o-tasukesugite-sekai-ga-little-mokushiroku/" }, { label: "Nukoduke!", value: "Nukoduke!", url: "http://truyentuan.com/nukoduke/" }, { label: "Kono Bijutsubu ni wa Mondai ga Aru!", value: "Kono Bijutsubu ni wa Mondai ga Aru!", url: "http://truyentuan.com/kono-bijutsubu-ni-wa-mondai-ga-aru/" }, { label: "Nature-0", value: "Nature-0", url: "http://truyentuan.com/nature-0/" }, { label: "Shura no Mon I", value: "Shura no Mon I", url: "http://truyentuan.com/shura-no-mon-i/" }, { label: "Tora Kiss - A School Odyssey", value: "Tora Kiss - A School Odyssey", url: "http://truyentuan.com/tora-kiss-a-school-odyssey/" }, { label: "Inubaka", value: "Inubaka", url: "http://truyentuan.com/inubaka/" }, { label: "Saito-kun wa Chounouryokusha Rashii", value: "Saito-kun wa Chounouryokusha Rashii", url: "http://truyentuan.com/saito-kun-wa-chounouryokusha-rashii/" }, { label: "Dragon Voice", value: "Dragon Voice", url: "http://truyentuan.com/dragon-voice/" }, { label: "Uwagaki", value: "Uwagaki", url: "http://truyentuan.com/uwagaki/" }, { label: "Senyuu", value: "Senyuu", url: "http://truyentuan.com/senyuu/" }, { label: "Saki", value: "Saki", url: "http://truyentuan.com/saki/" }, { label: "Hatarakanai Futari", value: "Hatarakanai Futari", url: "http://truyentuan.com/hatarakanai-futari/" }, { label: "Chiến Quốc Yêu Hồ", value: "Chiến Quốc Yêu Hồ", url: "http://truyentuan.com/chien-quoc-yeu-ho/" }, { label: "Gokicha!!", value: "Gokicha!!", url: "http://truyentuan.com/gokicha/" }, { label: "Tale of Eun Aran", value: "Tale of Eun Aran", url: "http://truyentuan.com/tale-of-eun-aran/" }, { label: "Kanojo ga Flag o Oraretara", value: "Kanojo ga Flag o Oraretara", url: "http://truyentuan.com/kanojo-ga-flag-o-oraretara/" }, { label: "Ryuushika Ryuushika", value: "Ryuushika Ryuushika", url: "http://truyentuan.com/ryuushika-ryuushika/" }, { label: "Green Worldz (DP)", value: "Green Worldz (DP)", url: "http://truyentuan.com/green-worldz-dp/" }, { label: "DearS", value: "DearS", url: "http://truyentuan.com/dears/" }, { label: "Tokyo Crazy Paradise", value: "Tokyo Crazy Paradise", url: "http://truyentuan.com/tokyo-crazy-paradise/" }, { label: "Shuukyuu Shoujo", value: "Shuukyuu Shoujo", url: "http://truyentuan.com/shuukyuu-shoujo/" }, { label: "Lovely Complex", value: "Lovely Complex", url: "http://truyentuan.com/lovely-complex/" }, { label: "Teppu", value: "Teppu", url: "http://truyentuan.com/teppu/" }, { label: "Mother Keeper", value: "Mother Keeper", url: "http://truyentuan.com/mother-keeper/" }, { label: "Madan no Ou to Senki", value: "Madan no Ou to Senki", url: "http://truyentuan.com/madan-no-ou-to-senki/" }, { label: "Hirunaka no Ryuusei", value: "Hirunaka no Ryuusei", url: "http://truyentuan.com/hirunaka-no-ryuusei/" }, { label: "Ore ga Doutei wo Sutetara Shinu Ken ni Tsuite", value: "Ore ga Doutei wo Sutetara Shinu Ken ni Tsuite", url: "http://truyentuan.com/ore-ga-doutei-wo-sutetara-shinu-ken-ni-tsuite/" }, { label: "Hantsu x Torasshu", value: "Hantsu x Torasshu", url: "http://truyentuan.com/hantsu-x-torasshu/" }, { label: "Magnolia", value: "Magnolia", url: "http://truyentuan.com/magnolia/" }, { label: "Starbiter Satsuki", value: "Starbiter Satsuki", url: "http://truyentuan.com/starbiter-satsuki/" }, { label: "Seikon no Qwaser", value: "Seikon no Qwaser", url: "http://truyentuan.com/seikon-no-qwaser/" }, { label: "W-Juliet", value: "W-Juliet", url: "http://truyentuan.com/w-juliet/" }, { label: "Akachan to Boku - Em bé và tôi", value: "Akachan to Boku - Em bé và tôi", url: "http://truyentuan.com/akachan-to-boku-em-be-va-toi/" }, { label: "Yume Miru Taiyou", value: "Yume Miru Taiyou", url: "http://truyentuan.com/yume-miru-taiyou/" }, { label: "Bokura wa Minna Kawaisou", value: "Bokura wa Minna Kawaisou", url: "http://truyentuan.com/bokura-wa-minna-kawaisou/" }, { label: "Katsu!", value: "Katsu!", url: "http://truyentuan.com/katsu/" }, { label: "Cố Lên Nào, Đại Ma Vương!", value: "Cố Lên Nào, Đại Ma Vương!", url: "http://truyentuan.com/co-len-nao-dai-ma-vuong/" }, { label: "Võ Đạo Cuồng Chi Thi", value: "Võ Đạo Cuồng Chi Thi", url: "http://truyentuan.com/vo-dao-cuong-chi-thi/" }, { label: "3 Gatsu no lion", value: "3 Gatsu no lion", url: "http://truyentuan.com/3-gatsu-no-lion/" }, { label: "Hitsugime no Chaika", value: "Hitsugime no Chaika", url: "http://truyentuan.com/hitsugime-no-chaika/" }, { label: "Sidonia No Kishi", value: "Sidonia No Kishi", url: "http://truyentuan.com/sidonia-no-kishi/" }, { label: "Crimson Hero", value: "Crimson Hero", url: "http://truyentuan.com/crimson-hero/" }, { label: "Honey x Honey Drops", value: "Honey x Honey Drops", url: "http://truyentuan.com/honey-x-honey-drops/" }, { label: "Habaek-eui Shinbu", value: "Habaek-eui Shinbu", url: "http://truyentuan.com/habaek-eui-shinbu/" }, { label: "Dear, Only You Don't Know!", value: "Dear, Only You Don't Know!", url: "http://truyentuan.com/dear-only-you-dont-know/" }, { label: "Buttobi Itto", value: "Buttobi Itto", url: "http://truyentuan.com/buttobi-itto/" }, { label: "Hinomaru Zumou", value: "Hinomaru Zumou", url: "http://truyentuan.com/hinomaru-zumou/" }, { label: "Rurouni Kenshin", value: "Rurouni Kenshin", url: "http://truyentuan.com/rurouni-kenshin/" }, { label: "Heart no Kuni no Alice", value: "Heart no Kuni no Alice", url: "http://truyentuan.com/heart-no-kuni-no-alice/" }, { label: "Kattobi Itto ", value: "Kattobi Itto ", url: "http://truyentuan.com/kattobi-itto/" }, { label: "Upotte!!", value: "Upotte!!", url: "http://truyentuan.com/upotte/" }, { label: "Dorohedoro", value: "Dorohedoro", url: "http://truyentuan.com/dorohedoro/" }, { label: "Gấu ngốc và những người bạn", value: "Gấu ngốc và những người bạn", url: "http://truyentuan.com/gau-ngoc-va-nhung-nguoi-ban/" }, { label: "Natsuyuki Rendez-vous", value: "Natsuyuki Rendez-vous", url: "http://truyentuan.com/natsuyuki-rendez-vous/" }, { label: "Kono Kanojo wa Fiction desu", value: "Kono Kanojo wa Fiction desu", url: "http://truyentuan.com/kono-kanojo-wa-fiction-desu/" }, { label: "Cố Lên Nào, Đại Ma Vương 2", value: "Cố Lên Nào, Đại Ma Vương 2", url: "http://truyentuan.com/co-len-nao-dai-ma-vuong-2/" }, { label: "Shinmai Maou no Keiyakusha", value: "Shinmai Maou no Keiyakusha", url: "http://truyentuan.com/shinmai-maou-no-keiyakusha/" }, { label: "Doubutsu no Kuni - Vương quốc động vật", value: "Doubutsu no Kuni - Vương quốc động vật", url: "http://truyentuan.com/doubutsu-no-kuni-vuong-quoc-dong-vat/" }, { label: "History's Strongest Disciple Kenichi (OtakuPlus)", value: "History's Strongest Disciple Kenichi (OtakuPlus)", url: "http://truyentuan.com/history-s-strongest-disciple-kenichi-otakuplus/" }, { label: "Love So Life", value: "Love So Life", url: "http://truyentuan.com/love-so-life/" }, { label: "Teen Titans Short Comics", value: "Teen Titans Short Comics", url: "http://truyentuan.com/teen-titans-short-comics/" }, { label: "Makai Ouji: Devils and Realist", value: "Makai Ouji: Devils and Realist", url: "http://truyentuan.com/makai-ouji-devils-and-realist/" }, { label: "Sugar Soldier", value: "Sugar Soldier", url: "http://truyentuan.com/sugar-soldier/" }, { label: "Soul Cartel (DP)", value: "Soul Cartel (DP)", url: "http://truyentuan.com/soul-cartel-dp/" }, { label: "Ô Long Viện Linh Vật Sống", value: "Ô Long Viện Linh Vật Sống", url: "http://truyentuan.com/o-long-vien-linh-vat-song/" }, { label: "Yoakemono", value: "Yoakemono", url: "http://truyentuan.com/yoakemono/" }, { label: "World Of Super Sand Box", value: "World Of Super Sand Box", url: "http://truyentuan.com/world-of-super-sand-box/" }, { label: "Thần thoại minh vương", value: "Thần thoại minh vương", url: "http://truyentuan.com/than-thoai-minh-vuong/" }, { label: "Long Phi Bất Bại 2", value: "Long Phi Bất Bại 2", url: "http://truyentuan.com/long-phi-bat-bai-2/" }, { label: "Dragonball EX", value: "Dragonball EX", url: "http://truyentuan.com/dragonball-ex/" }, { label: "Masks", value: "Masks", url: "http://truyentuan.com/masks/" }, { label: "Ai Hơn Ai", value: "Ai Hơn Ai", url: "http://truyentuan.com/ai-hon-ai/" }, { label: "Tháp Kỳ", value: "Tháp Kỳ", url: "http://truyentuan.com/thap-ky/" }, { label: "Con Ma Vui Vẻ", value: "Con Ma Vui Vẻ", url: "http://truyentuan.com/con-ma-vui-ve/" }, { label: "Yureka Lost Saga", value: "Yureka Lost Saga", url: "http://truyentuan.com/yureka-lost-saga-2/" }, { label: "Binlang", value: "Binlang", url: "http://truyentuan.com/binlang/" }, { label: "Mayonaka no X Giten", value: "Mayonaka no X Giten", url: "http://truyentuan.com/mayonaka-no-x-giten/" }, { label: "Musashi", value: "Musashi", url: "http://truyentuan.com/musashi/" }, { label: "Đại Chiến Bóng Tối", value: "Đại Chiến Bóng Tối", url: "http://truyentuan.com/dai-chien-bong-toi/" }, { label: "Baki - Son of Ogre", value: "Baki - Son of Ogre", url: "http://truyentuan.com/baki-son-of-ogre/" }, { label: "Seitokai Tantei Kirika", value: "Seitokai Tantei Kirika", url: "http://truyentuan.com/seitokai-tantei-kirika/" }, { label: "Dolls Fall ", value: "Dolls Fall ", url: "http://truyentuan.com/dolls-fall/" }, { label: "108 Tân Thủy Hử", value: "108 Tân Thủy Hử", url: "http://truyentuan.com/108-tan-thuy-hu/" }, { label: "Ma Võ Độ", value: "Ma Võ Độ", url: "http://truyentuan.com/ma-vo-do/" }, { label: "Băng Hoả Ma Trù", value: "Băng Hoả Ma Trù", url: "http://truyentuan.com/bang-hoa-ma-tru/" }, { label: "Thần Thoại Hy Lạp", value: "Thần Thoại Hy Lạp", url: "http://truyentuan.com/than-thoai-hy-lap/" }, { label: "Cảnh Sát Siêu Quậy", value: "Cảnh Sát Siêu Quậy", url: "http://truyentuan.com/canh-sat-sieu-quay/" }, { label: "Toukyou Kushu:re", value: "Toukyou Kushu:re", url: "http://truyentuan.com/toukyou-kushu-re/" }, { label: "Thú cưng của tôi là Quỷ vương", value: "Thú cưng của tôi là Quỷ vương", url: "http://truyentuan.com/thu-cung-cua-toi-la-quy-vuong/" }, { label: "Bác Sĩ Thú Y", value: "Bác Sĩ Thú Y", url: "http://truyentuan.com/bac-si-thu-y/" }, { label: "Ore ga Ojou-sama Gakkou ni Shomin Sample Toshite Rachirareta Ken", value: "Ore ga Ojou-sama Gakkou ni Shomin Sample Toshite Rachirareta Ken", url: "http://truyentuan.com/ore-ga-ojou-sama-gakkou-ni-shomin-sample-toshite-rachirareta-ken/" }, { label: "Nise Koi (Otaku Plus)", value: "Nise Koi (Otaku Plus)", url: "http://truyentuan.com/nise-koi-otaku-plus/" }, { label: "Kimi no Sei", value: "Kimi no Sei", url: "http://truyentuan.com/kimi-no-sei/" }, { label: "Koi to Uso", value: "Koi to Uso", url: "http://truyentuan.com/koi-to-uso/" }, { label: "Xung Xuất Lê Minh", value: "Xung Xuất Lê Minh", url: "http://truyentuan.com/xung-xuat-le-minh/" }, { label: "Thánh Đường", value: "Thánh Đường", url: "http://truyentuan.com/thanh-duong/" }, { label: "Dendrobates", value: "Dendrobates", url: "http://truyentuan.com/dendrobates/" }, { label: "Rock Lee's Springtime of Youth", value: "Rock Lee's Springtime of Youth", url: "http://truyentuan.com/rock-lees-springtime-of-youth/" }, { label: "Đông Phương Chân Long", value: "Đông Phương Chân Long", url: "http://truyentuan.com/dong-phuong-chan-long/" }, { label: "Cấp Độ Phân Liệt", value: "Cấp Độ Phân Liệt", url: "http://truyentuan.com/cap-do-phan-liet/" }, { label: "Hajime No Ippo", value: "Hajime No Ippo", url: "http://truyentuan.com/hajime-no-ippo/" }, { label: "Ten Count", value: "Ten Count", url: "http://truyentuan.com/ten-count/" }, { label: "Khai Phong Kỳ Đàm", value: "Khai Phong Kỳ Đàm", url: "http://truyentuan.com/khai-phong-ky-dam/" }, { label: "Baketeria", value: "Baketeria", url: "http://truyentuan.com/baketeria/" }, { label: "Ám Chi Lạc Ấn", value: "Ám Chi Lạc Ấn", url: "http://truyentuan.com/am-chi-lac-an/" }, { label: "Hậu dấu ấn rồng thiêng", value: "Hậu dấu ấn rồng thiêng", url: "http://truyentuan.com/hau-dau-an-rong-thieng/" }, { label: "Ao Haru Ride", value: "Ao Haru Ride", url: "http://truyentuan.com/ao-haru-ride/" }, { label: "Jingle Jungle", value: "Jingle Jungle", url: "http://truyentuan.com/jingle-jungle/" }, { label: "Kikou Shoujo wa Kizutsukanai", value: "Kikou Shoujo wa Kizutsukanai", url: "http://truyentuan.com/kikou-shoujo-wa-kizutsukanai/" }, { label: "Hầm trú ẩn", value: "Hầm trú ẩn", url: "http://truyentuan.com/ham-tru-an/" }, { label: "Last Game", value: "Last Game", url: "http://truyentuan.com/last-game/" }, { label: "True Love", value: "True Love", url: "http://truyentuan.com/true-love/" }, { label: "Amagoi", value: "Amagoi", url: "http://truyentuan.com/amagoi/" }, { label: "Tate no Yuusha no Nariagari", value: "Tate no Yuusha no Nariagari", url: "http://truyentuan.com/tate-no-yuusha-no-nariagari/" }, { label: "Kono Oneesan wa fliction desu!?", value: "Kono Oneesan wa fliction desu!?", url: "http://truyentuan.com/kono-oneesan-wa-fliction-desu/" }, { label: "Now", value: "Now", url: "http://truyentuan.com/now/" }, { label: "Tough - Miyazawa Kiichi", value: "Tough - Miyazawa Kiichi", url: "http://truyentuan.com/tough-miyazawa-kiichi/" }, { label: "Ultimate Venus", value: "Ultimate Venus", url: "http://truyentuan.com/ultimate-venus/" }, { label: "Love Berrish", value: "Love Berrish", url: "http://truyentuan.com/love-berrish/" }, { label: "Kamisama No Iutoori II", value: "Kamisama No Iutoori II", url: "http://truyentuan.com/kamisama-no-iutoori-ii/" }, { label: "Cerberus(DP)", value: "Cerberus(DP)", url: "http://truyentuan.com/cerberusdp/" }, { label: "Orenchi no Furo Jijou", value: "Orenchi no Furo Jijou", url: "http://truyentuan.com/orenchi-no-furo-jijou/" }, { label: "Getsurin Ni Kiri Saku", value: "Getsurin Ni Kiri Saku", url: "http://truyentuan.com/getsurin-ni-kiri-saku/" }, { label: "Jelsa Comic Series", value: "Jelsa Comic Series", url: "http://truyentuan.com/jelsa-comic-series/" }, { label: "Ookami shoujo to kuro ouji", value: "Ookami shoujo to kuro ouji", url: "http://truyentuan.com/ookami-shoujo-to-kuro-ouji/" }, { label: "Plunderer", value: "Plunderer", url: "http://truyentuan.com/plunderer/" }, { label: "Người Trong Giang Hồ", value: "Người Trong Giang Hồ", url: "http://truyentuan.com/nguoi-trong-giang-ho/" }, { label: "Bá Đao", value: "Bá Đao", url: "http://truyentuan.com/ba-dao/" }, { label: "Ya! Oee", value: "Ya! Oee", url: "http://truyentuan.com/ya-oee/" }, { label: "Bất Bại Chiến Thần", value: "Bất Bại Chiến Thần", url: "http://truyentuan.com/bat-bai-chien-than/" }, { label: "Manh Phong Thần", value: "Manh Phong Thần", url: "http://truyentuan.com/manh-phong-than/" }, { label: "Crash!", value: "Crash!", url: "http://truyentuan.com/crash/" }, { label: "Nozo x Kimi (Devil Slayer Team)", value: "Nozo x Kimi (Devil Slayer Team)", url: "http://truyentuan.com/nozo-x-kimi-devil-slayer-team/" }, { label: "Đại chúa tể", value: "Đại chúa tể", url: "http://truyentuan.com/dai-chua-te/" }, { label: "Ajin", value: "Ajin", url: "http://truyentuan.com/ajin/" }, { label: "Dolly Kill Kill", value: "Dolly Kill Kill", url: "http://truyentuan.com/dolly-kill-kill/" }, { label: "Tenkuu Shinpan", value: "Tenkuu Shinpan", url: "http://truyentuan.com/tenkuu-shinpan/" }, { label: "Trảm Long", value: "Trảm Long", url: "http://truyentuan.com/tram-long/" }, { label: "Boku to Kanojo no Renai Mokuroku", value: "Boku to Kanojo no Renai Mokuroku", url: "http://truyentuan.com/boku-to-kanojo-no-renai-mokuroku/" }, { label: "Tuyết Ảnh Đặc Phái Tổ", value: "Tuyết Ảnh Đặc Phái Tổ", url: "http://truyentuan.com/tuyet-anh-dac-phai-to/" }, { label: "Thâu Tinh Cửu Nguyệt Thiên", value: "Thâu Tinh Cửu Nguyệt Thiên", url: "http://truyentuan.com/thau-tinh-cuu-nguyet-thien/" }, { label: "Ngự Long", value: "Ngự Long", url: "http://truyentuan.com/ngu-long/" }, { label: "Thần Ấn Vương Tọa", value: "Thần Ấn Vương Tọa", url: "http://truyentuan.com/than-an-vuong-toa/" }, { label: "Rodiura Kurashi", value: "Rodiura Kurashi", url: "http://truyentuan.com/rodiura-kurashi/" }, { label: "Mạt Nhật Chiến Lang", value: "Mạt Nhật Chiến Lang", url: "http://truyentuan.com/mat-nhat-chien-lang/" }, { label: "Hatsukoi Shinjuu", value: "Hatsukoi Shinjuu", url: "http://truyentuan.com/hatsukoi-shinjuu/" }, { label: "Cây Bút Thần Kỳ", value: "Cây Bút Thần Kỳ", url: "http://truyentuan.com/cay-but-than-ky/" }, { label: "Ookiku Furikabutte", value: "Ookiku Furikabutte", url: "http://truyentuan.com/ookiku-furikabutte/" }, { label: "Joshi Kausei", value: "Joshi Kausei", url: "http://truyentuan.com/joshi-kausei/" }, { label: "Zettai Joousei", value: "Zettai Joousei", url: "http://truyentuan.com/zettai-joousei/" }, { label: "Alyosha", value: "Alyosha", url: "http://truyentuan.com/alyosha/" }, { label: "Lớp Trưởng Đại Nhân", value: "Lớp Trưởng Đại Nhân", url: "http://truyentuan.com/lop-truong-dai-nhan/" }, { label: "Zansho", value: "Zansho", url: "http://truyentuan.com/zansho/" }, { label: "Zanbara", value: "Zanbara", url: "http://truyentuan.com/zanbara/" }, { label: "Yuuhi Romance", value: "Yuuhi Romance", url: "http://truyentuan.com/yuuhi-romance/" }, { label: "Yaotsukumo", value: "Yaotsukumo", url: "http://truyentuan.com/yaotsukumo/" }, { label: "Yaiba Remake", value: "Yaiba Remake", url: "http://truyentuan.com/yaiba-remake/" }, { label: "W's", value: "W's", url: "http://truyentuan.com/ws/" }, { label: "Zetsuen No Tempest", value: "Zetsuen No Tempest", url: "http://truyentuan.com/zetsuen-no-tempest/" }, { label: "Lam Sí", value: "Lam Sí", url: "http://truyentuan.com/lam-si/" }, { label: "Watashitachi no Tamura-kun", value: "Watashitachi no Tamura-kun", url: "http://truyentuan.com/watashitachi-no-tamura-kun/" }, { label: "Vương Tiểu Long", value: "Vương Tiểu Long", url: "http://truyentuan.com/vuong-tieu-long/" }, { label: "Vương Quốc Mộng Mơ", value: "Vương Quốc Mộng Mơ", url: "http://truyentuan.com/vuong-quoc-mong-mo/" }, { label: "Vua Côn Trùng", value: "Vua Côn Trùng", url: "http://truyentuan.com/vua-con-trung/" }, { label: "Võ Thần Phi Thiên", value: "Võ Thần Phi Thiên", url: "http://truyentuan.com/vo-than-phi-thien/" }, { label: "Uttare Daikichi", value: "Uttare Daikichi", url: "http://truyentuan.com/uttare-daikichi/" }, { label: "Godly Bells", value: "Godly Bells", url: "http://truyentuan.com/godly-bells/" }, { label: "Rere Hello", value: "Rere Hello", url: "http://truyentuan.com/rere-hello/" }, { label: "Ultimate Power", value: "Ultimate Power", url: "http://truyentuan.com/ultimate-power/" }, { label: "Ultimate Origin", value: "Ultimate Origin", url: "http://truyentuan.com/ultimate-origin/" }, { label: "Ultimate Comics X", value: "Ultimate Comics X", url: "http://truyentuan.com/ultimate-comics-x/" }, { label: "Tsumitsuki", value: "Tsumitsuki", url: "http://truyentuan.com/tsumitsuki/" }, { label: "Nghệ Thuật Gian Lận", value: "Nghệ Thuật Gian Lận", url: "http://truyentuan.com/nghe-thuat-gian-lan/" }, { label: "Nijiiro Togarashi", value: "Nijiiro Togarashi", url: "http://truyentuan.com/nijiiro-togarashi/" }, { label: "Akarui Sekai Keikaku", value: "Akarui Sekai Keikaku", url: "http://truyentuan.com/akarui-sekai-keikaku/" }, { label: "Dousei Recipe", value: "Dousei Recipe", url: "http://truyentuan.com/dousei-recipe/" }, { label: "Tribal 12", value: "Tribal 12", url: "http://truyentuan.com/tribal-12/" }, { label: "Toto ! The wonderful adventure", value: "Toto ! The wonderful adventure", url: "http://truyentuan.com/toto-the-wonderful-adventure/" }, { label: "TOKKO", value: "TOKKO", url: "http://truyentuan.com/tokko/" }, { label: "Rozen Maiden", value: "Rozen Maiden", url: "http://truyentuan.com/rozen-maiden/" }, { label: "Tôn Ngộ Không", value: "Tôn Ngộ Không", url: "http://truyentuan.com/ton-ngo-khong/" }, { label: "Kazu Doctor K", value: "Kazu Doctor K", url: "http://truyentuan.com/kazu-doctor-k/" }, { label: "Yubikiri", value: "Yubikiri", url: "http://truyentuan.com/yubikiri/" }, { label: "X-Men Necrosha", value: "X-Men Necrosha", url: "http://truyentuan.com/x-men-necrosha/" }, { label: "Wish - Ước Nguyện", value: "Wish - Ước Nguyện", url: "http://truyentuan.com/wish-uoc-nguyen/" }, { label: "Shin cậu bé bút chì", value: "Shin cậu bé bút chì", url: "http://truyentuan.com/shin-cau-be-but-chi/" }, { label: "Vương Bài Ngự Sử", value: "Vương Bài Ngự Sử", url: "http://truyentuan.com/vuong-bai-ngu-su/" }, { label: "Kekkon Yubiwa Monogatari", value: "Kekkon Yubiwa Monogatari", url: "http://truyentuan.com/kekkon-yubiwa-monogatari/" }, { label: "TianDi Naner", value: "TianDi Naner", url: "http://truyentuan.com/tiandi-naner/" }, { label: "Thiên thần bảo hộ", value: "Thiên thần bảo hộ", url: "http://truyentuan.com/thien-than-bao-ho/" }, { label: "Thiên Hạ Vô Địch Tiểu Kiếm Tiên", value: "Thiên Hạ Vô Địch Tiểu Kiếm Tiên", url: "http://truyentuan.com/thien-ha-vo-dich-tieu-kiem-tien/" }, { label: "The Strongest Virus", value: "The Strongest Virus", url: "http://truyentuan.com/the-strongest-virus/" }, { label: "My Hero Academia", value: "My Hero Academia", url: "http://truyentuan.com/my-hero-academia/" }, { label: "Thiên Tử Truyền Kỳ 1 - Cơ Phát Khai Chu Bản", value: "Thiên Tử Truyền Kỳ 1 - Cơ Phát Khai Chu Bản", url: "http://truyentuan.com/thien-tu-truyen-ky-1-co-phat-khai-chu-ban/" }, { label: "The Guy Who Will Give a Kiss for 5000 Won", value: "The Guy Who Will Give a Kiss for 5000 Won", url: "http://truyentuan.com/the-guy-who-will-give-a-kiss-for-5000-won/" }, { label: "Thần Khí Vương", value: "Thần Khí Vương", url: "http://truyentuan.com/than-khi-vuong/" }, { label: "Thần Chi Lĩnh Vực", value: "Thần Chi Lĩnh Vực", url: "http://truyentuan.com/than-chi-linh-vuc/" }, { label: "The Cliff", value: "The Cliff", url: "http://truyentuan.com/the-cliff/" }, { label: "Hitomi-sensei no Hokenshitsu", value: "Hitomi-sensei no Hokenshitsu", url: "http://truyentuan.com/hitomi-sensei-no-hokenshitsu/" }, { label: "37 Kiss", value: "37 Kiss", url: "http://truyentuan.com/37/" }, { label: "Tân Từ Điển Kỳ Bí", value: "Tân Từ Điển Kỳ Bí", url: "http://truyentuan.com/tan-tu-dien-ky-bi/" }, { label: "Hanebado!", value: "Hanebado!", url: "http://truyentuan.com/hanebado/" }, { label: "Sugars (Yamamori Mika)", value: "Sugars (Yamamori Mika)", url: "http://truyentuan.com/sugars-yamamori-mika/" }, { label: "Full Metal Wing", value: "Full Metal Wing", url: "http://truyentuan.com/full-metal-wing/" }, { label: "The Red Soul", value: "The Red Soul", url: "http://truyentuan.com/the-red-soul/" }, { label: "The One I Love", value: "The One I Love", url: "http://truyentuan.com/the-one-i-love/" }, { label: "Takamagahara", value: "Takamagahara", url: "http://truyentuan.com/takamagahara/" }, { label: "Super Darling", value: "Super Darling", url: "http://truyentuan.com/super-darling/" }, { label: "Takeru - Opera Susanoh Sword of the Devil", value: "Takeru - Opera Susanoh Sword of the Devil", url: "http://truyentuan.com/takeru-opera-susanoh-sword-of-the-devil/" }, { label: "Tales for a sleepless night", value: "Tales for a sleepless night", url: "http://truyentuan.com/tales-for-a-sleepless-night/" }, { label: "Soukyuu no Lapis Lazuli", value: "Soukyuu no Lapis Lazuli", url: "http://truyentuan.com/soukyuu-no-lapis-lazuli/" }, { label: "Gate - Jietai Kare no Chi nite, Kaku Tatakeri", value: "Gate - Jietai Kare no Chi nite, Kaku Tatakeri", url: "http://truyentuan.com/gate-jietai-kare-no-chi-nite-kaku-tatakeri/" }, { label: "DEAD DAYS", value: "DEAD DAYS", url: "http://truyentuan.com/dead-days/" }, { label: "Starry☆Sky four seasons (full)", value: "Starry☆Sky four seasons (full)", url: "http://truyentuan.com/starry%e2%98%86sky-four-seasons-full/" }, { label: "Suki Natsuki Koi", value: "Suki Natsuki Koi", url: "http://truyentuan.com/suki-natsuki-koi/" }, { label: "Sorayume no Uta", value: "Sorayume no Uta", url: "http://truyentuan.com/sorayume-no-uta/" }, { label: "Shuumatsu no Laughter", value: "Shuumatsu no Laughter", url: "http://truyentuan.com/shuumatsu-no-laughter/" }, { label: "Sora wa Akai Kawa no Hotori", value: "Sora wa Akai Kawa no Hotori", url: "http://truyentuan.com/sora-wa-akai-kawa-no-hotori/" }, { label: "Beyond Evil", value: "Beyond Evil", url: "http://truyentuan.com/beyond-evil/" }, { label: "Drifters", value: "Drifters", url: "http://truyentuan.com/drifters/" }, { label: "Seraph of the End", value: "Seraph of the End", url: "http://truyentuan.com/seraph-of-the-end/" }, { label: "ReLIFE", value: "ReLIFE", url: "http://truyentuan.com/relife/" }, { label: "Ren-ai Shijou Shugi", value: "Ren-ai Shijou Shugi", url: "http://truyentuan.com/ren-ai-shijou-shugi/" }, { label: "Yae no Sakura", value: "Yae no Sakura", url: "http://truyentuan.com/yae-no-sakura/" }, { label: "Medicine One shot", value: "Medicine One shot", url: "http://truyentuan.com/medicine-one-shot/" }, { label: "Tam Nhãn Hao Thiên Lục", value: "Tam Nhãn Hao Thiên Lục", url: "http://truyentuan.com/tam-nhan-hao-thien-luc/" }, { label: "Lessa", value: "Lessa", url: "http://truyentuan.com/lessa/" }, { label: "Namaikizakari", value: "Namaikizakari", url: "http://truyentuan.com/namaikizakari/" }, { label: "Tsuki no Shippo", value: "Tsuki no Shippo", url: "http://truyentuan.com/tsuki-no-shippo/" }, { label: "Inu x Boku SS", value: "Inu x Boku SS", url: "http://truyentuan.com/inu-x-boku-ss/" }, { label: "Hero Waltz", value: "Hero Waltz", url: "http://truyentuan.com/hero-waltz/" }, { label: "Alto", value: "Alto", url: "http://truyentuan.com/alto/" }, { label: "The Friendly Winter", value: "The Friendly Winter", url: "http://truyentuan.com/the-friendly-winter/" }, { label: "Video Girl AI", value: "Video Girl AI", url: "http://truyentuan.com/video-girl-ai/" }, { label: "Ore ga Akuma de, Aitsu ga Yome de.", value: "Ore ga Akuma de, Aitsu ga Yome de.", url: "http://truyentuan.com/ore-ga-akuma-de-aitsu-ga-yome-de/" }, { label: "Otome wa Boku ni Koishiteru", value: "Otome wa Boku ni Koishiteru", url: "http://truyentuan.com/otome-wa-boku-ni-koishiteru/" }, { label: "Shinonome Yuuko wa Tanpen Shousetsu o Aishite Iru", value: "Shinonome Yuuko wa Tanpen Shousetsu o Aishite Iru", url: "http://truyentuan.com/shinonome-yuuko-wa-tanpen-shousetsu-o-aishite-iru/" }, { label: "Legendary Moonlight Sculptor – Con Đường Đế Vương", value: "Legendary Moonlight Sculptor – Con Đường Đế Vương", url: "http://truyentuan.com/legendary-moonlight-sculptor-con-duong-de-vuong/" }, { label: "Seirei Tsukai no Blade Dance", value: "Seirei Tsukai no Blade Dance", url: "http://truyentuan.com/seirei-tsukai-no-blade-dance/" }, { label: "Oukoku Game", value: "Oukoku Game", url: "http://truyentuan.com/oukoku-game/" }, { label: "Mercenary Maruhan", value: "Mercenary Maruhan", url: "http://truyentuan.com/mercenary-maruhan/" }, { label: "Advent of Snow White to Hell - Địa ngục tuyết trắng", value: "Advent of Snow White to Hell - Địa ngục tuyết trắng", url: "http://truyentuan.com/advent-of-snow-white-to-hell-dia-nguc-tuyet-trang/" }, { label: "Horizon", value: "Horizon", url: "http://truyentuan.com/horizon/" }, { label: "The Sword of Emperor", value: "The Sword of Emperor", url: "http://truyentuan.com/the-sword-of-emperor/" }, { label: "Đoàn Xiếc Thú Ánh Trăng", value: "Đoàn Xiếc Thú Ánh Trăng", url: "http://truyentuan.com/doan-xiec-thu-anh-trang/" }, { label: "Shin Kotaro Makaritoru! Juudouhen", value: "Shin Kotaro Makaritoru! Juudouhen", url: "http://truyentuan.com/shin-kotaro-makaritoru-juudouhen/" }, { label: "Đại Quân Phiệt", value: "Đại Quân Phiệt", url: "http://truyentuan.com/dai-quan-phiet/" }, { label: "Okitenemuru", value: "Okitenemuru", url: "http://truyentuan.com/okitenemuru/" }, { label: "Nữ Nhân Dũng Cảm", value: "Nữ Nhân Dũng Cảm", url: "http://truyentuan.com/nu-nhan-dung-cam/" }, { label: "Dragon Ball Z – Frieza Hồi Sinh", value: "Dragon Ball Z – Frieza Hồi Sinh", url: "http://truyentuan.com/dragon-ball-z-frieza-hoi-sinh/" }, { label: "Thanh Gươm Ma Thuật", value: "Thanh Gươm Ma Thuật", url: "http://truyentuan.com/thanh-guom-ma-thuat/" }, { label: "Black Bird", value: "Black Bird", url: "http://truyentuan.com/black-bird/" }, { label: "Shinigamisama ni Saigo no Onegai", value: "Shinigamisama ni Saigo no Onegai", url: "http://truyentuan.com/shinigamisama-ni-saigo-no-onegai/" }, { label: "Shini Itaru Yamai", value: "Shini Itaru Yamai", url: "http://truyentuan.com/shini-itaru-yamai/" }, { label: "GDGD-DOGS", value: "GDGD-DOGS", url: "http://truyentuan.com/gdgd-dogs/" }, { label: "Hoa Phi Hoa", value: "Hoa Phi Hoa", url: "http://truyentuan.com/hoa-phi-hoa/" }, { label: "Naruto Ngoại Truyện", value: "Naruto Ngoại Truyện", url: "http://truyentuan.com/naruto-ngoai-truyen/" }, { label: "Sailor Moon", value: "Sailor Moon", url: "http://truyentuan.com/sailor-moon/" }, { label: "Shinsengumi imon peace maker", value: "Shinsengumi imon peace maker", url: "http://truyentuan.com/shinsengumi-imon-peace-maker/" }, { label: "Akatsuki no Yona", value: "Akatsuki no Yona", url: "http://truyentuan.com/akatsuki-no-yona/" }, { label: "YUUSHA GA SHINDA!", value: "YUUSHA GA SHINDA!", url: "http://truyentuan.com/yuusha-ga-shinda/" }, { label: "Sangoku Rensenki - Otome no Heihou!", value: "Sangoku Rensenki - Otome no Heihou!", url: "http://truyentuan.com/sangoku-rensenki-otome-no-heihou/" }, { label: "Sandwich Girl", value: "Sandwich Girl", url: "http://truyentuan.com/sandwich-girl/" }, { label: "SandLand", value: "SandLand", url: "http://truyentuan.com/sandland/" }, { label: "Sailor Fuku ni Onegai!", value: "Sailor Fuku ni Onegai!", url: "http://truyentuan.com/sailor-fuku-ni-onegai/" }, { label: "Ore no Kanojo to Osananajimi ga Shuraba Sugiru", value: "Ore no Kanojo to Osananajimi ga Shuraba Sugiru", url: "http://truyentuan.com/ore-no-kanojo-to-osananajimi-ga-shuraba-sugiru/" }, { label: "Trường Sinh Giới", value: "Trường Sinh Giới", url: "http://truyentuan.com/truong-sinh-gioi/" }, { label: "Snow of Spring", value: "Snow of Spring", url: "http://truyentuan.com/snow-of-spring/" }, { label: "Sai:Taker - Futari no Artemis", value: "Sai:Taker - Futari no Artemis", url: "http://truyentuan.com/saitaker-futari-no-artemis/" }, { label: "Flying Witch", value: "Flying Witch", url: "http://truyentuan.com/flying-witch/" }, { label: "Rutta to Kodama", value: "Rutta to Kodama", url: "http://truyentuan.com/rutta-to-kodama/" }, { label: "Riki-Oh", value: "Riki-Oh", url: "http://truyentuan.com/riki-oh/" }, { label: "Rocking Heaven", value: "Rocking Heaven", url: "http://truyentuan.com/rocking-heaven/" }, { label: "Redrum 327", value: "Redrum 327", url: "http://truyentuan.com/redrum-327/" }, { label: "Quyền Đạo", value: "Quyền Đạo", url: "http://truyentuan.com/quyen-dao/" }, { label: "Barajou no Kiss", value: "Barajou no Kiss", url: "http://truyentuan.com/barajou-no-kiss/" }, { label: "Princess Princess", value: "Princess Princess", url: "http://truyentuan.com/princess-princess/" }, { label: "Pretty Face", value: "Pretty Face", url: "http://truyentuan.com/pretty-face/" }, { label: "Amaama to Inazuma", value: "Amaama to Inazuma", url: "http://truyentuan.com/amaama-to-inazuma/" }, { label: "Mạo Bài Đại Anh Hùng", value: "Mạo Bài Đại Anh Hùng", url: "http://truyentuan.com/mao-bai-dai-anh-hung/" }, { label: "Ouroboros", value: "Ouroboros", url: "http://truyentuan.com/ouroboros/" }, { label: "BioMega (Remake)", value: "BioMega (Remake)", url: "http://truyentuan.com/biomega-remake/" }, { label: "Phụng Lâm Thiên Hạ Vương Phi 13 Tuổi", value: "Phụng Lâm Thiên Hạ Vương Phi 13 Tuổi", url: "http://truyentuan.com/phung-lam-thien-ha-vuong-phi-13-tuoi/" }, { label: "Pháp Sư Trừ Tà", value: "Pháp Sư Trừ Tà", url: "http://truyentuan.com/phap-su-tru-ta/" }, { label: "Onegai Teacher", value: "Onegai Teacher", url: "http://truyentuan.com/onegai-teacher/" }, { label: "Bloodxblood", value: "Bloodxblood", url: "http://truyentuan.com/bloodxblood/" }, { label: "Ragnarok: Sword Of The Dark Ones", value: "Ragnarok: Sword Of The Dark Ones", url: "http://truyentuan.com/ragnarok-sword-of-the-dark-ones/" }, { label: "Paradise Kiss", value: "Paradise Kiss", url: "http://truyentuan.com/paradise-kiss/" }, { label: "Orange Yane no Chiisana Ie", value: "Orange Yane no Chiisana Ie", url: "http://truyentuan.com/orange-yane-no-chiisana-ie/" }, { label: "Nobody Knows", value: "Nobody Knows", url: "http://truyentuan.com/nobody-knows/" }, { label: "Neon Genesis Evangelion: Gakuen Datenroku", value: "Neon Genesis Evangelion: Gakuen Datenroku", url: "http://truyentuan.com/neon-genesis-evangelion-gakuen-datenroku/" }, { label: "Tiểu Ma Thần", value: "Tiểu Ma Thần", url: "http://truyentuan.com/tieu-ma-than/" }, { label: "Ngọc Trong Đá", value: "Ngọc Trong Đá", url: "http://truyentuan.com/ngoc-trong-da/" }, { label: "Ngoại Truyện Thần Binh", value: "Ngoại Truyện Thần Binh", url: "http://truyentuan.com/ngoai-truyen-than-binh/" }, { label: "Nana Mix!", value: "Nana Mix!", url: "http://truyentuan.com/nana-mix/" }, { label: "Nami Iro", value: "Nami Iro", url: "http://truyentuan.com/nami-iro/" }, { label: "My Boyfriend is a Vampire", value: "My Boyfriend is a Vampire", url: "http://truyentuan.com/my-boyfriend-is-a-vampire/" }, { label: "Ninja Loạn Thị (vuilen Scan)", value: "Ninja Loạn Thị (vuilen Scan)", url: "http://truyentuan.com/ninja-loan-thi-vuilen-scan/" }, { label: "Nhà Trọ Hoàn Hảo", value: "Nhà Trọ Hoàn Hảo", url: "http://truyentuan.com/nha-tro-hoan-hao/" }, { label: "Neko Majin Z", value: "Neko Majin Z", url: "http://truyentuan.com/neko-majin-z/" }, { label: "Mobile Suit Crossbone Gundam", value: "Mobile Suit Crossbone Gundam", url: "http://truyentuan.com/mobile-suit-crossbone-gundam/" }, { label: "Chrono Monochrome", value: "Chrono Monochrome", url: "http://truyentuan.com/chrono-monochrome/" }, { label: "Nguyệt Lạc Tử Hoa", value: "Nguyệt Lạc Tử Hoa", url: "http://truyentuan.com/nguyet-lac-tu-hoa/" }, { label: "Huyết Tộc Cấm Vực", value: "Huyết Tộc Cấm Vực", url: "http://truyentuan.com/huyet-toc-cam-vuc/" }, { label: "Nejimakiboshi to Aoi Sora", value: "Nejimakiboshi to Aoi Sora", url: "http://truyentuan.com/nejimakiboshi-to-aoi-sora/" }, { label: "Moryo Kiden", value: "Moryo Kiden", url: "http://truyentuan.com/moryo-kiden/" }, { label: "Mononoke", value: "Mononoke", url: "http://truyentuan.com/mononoke/" }, { label: "Miku Plus", value: "Miku Plus", url: "http://truyentuan.com/miku-plus/" }, { label: "Mizu no yakata", value: "Mizu no yakata", url: "http://truyentuan.com/mizu-no-yakata/" }, { label: "Re:Monster", value: "Re:Monster", url: "http://truyentuan.com/remonster/" }, { label: "Melancholic Princess", value: "Melancholic Princess", url: "http://truyentuan.com/melancholic-princess/" }, { label: "Matsuri Special", value: "Matsuri Special", url: "http://truyentuan.com/matsuri-special/" }, { label: "Marugoto Anjyu Gakuen", value: "Marugoto Anjyu Gakuen", url: "http://truyentuan.com/marugoto-anjyu-gakuen/" }, { label: "Mahou-no-Iroha!", value: "Mahou-no-Iroha!", url: "http://truyentuan.com/mahou-no-iroha/" }, { label: "Arcana Soul", value: "Arcana Soul", url: "http://truyentuan.com/arcana-soul/" }, { label: "Sự Mê Hoặc Của Sói", value: "Sự Mê Hoặc Của Sói", url: "http://truyentuan.com/su-me-hoac-cua-soi/" }, { label: "A Bittersweet Life", value: "A Bittersweet Life", url: "http://truyentuan.com/a-bittersweet-life/" }, { label: "A book of dreams", value: "A book of dreams", url: "http://truyentuan.com/a-book-of-dreams/" }, { label: "A Channel", value: "A Channel", url: "http://truyentuan.com/a-channel/" }, { label: "A Fairytale For The Demon Lord", value: "A Fairytale For The Demon Lord", url: "http://truyentuan.com/a-fairytale-for-the-demon-lord/" }, { label: "A Kiss For My Prince - Nụ hôn hoàng tử", value: "A Kiss For My Prince - Nụ hôn hoàng tử", url: "http://truyentuan.com/a-kiss-for-my-prince-nu-h/" }, { label: "Magic Kaito", value: "Magic Kaito", url: "http://truyentuan.com/magic-kaito/" }, { label: "Maburaho", value: "Maburaho", url: "http://truyentuan.com/maburaho/" }, { label: "Lovely Monster", value: "Lovely Monster", url: "http://truyentuan.com/lovely-monster/" }, { label: "Lục Tiểu Phụng - U Linh Sơn Trang", value: "Lục Tiểu Phụng - U Linh Sơn Trang", url: "http://truyentuan.com/luc-tieu-phung-u-linh-son-trang/" }, { label: "Cuốn từ điển kì bí", value: "Cuốn từ điển kì bí", url: "http://truyentuan.com/cuon-tu-dien-ki-bi/" }, { label: "Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka", value: "Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka", url: "http://truyentuan.com/dungeon-ni-deai-o-motomeru-no-wa-machigatte-iru-darou-ka/" }, { label: "Thần Châu Kỳ Hiệp", value: "Thần Châu Kỳ Hiệp", url: "http://truyentuan.com/than-chau-ky-hiep/" }, { label: "A Method to Make the Gentle World", value: "A Method to Make the Gentle World", url: "http://truyentuan.com/a-method-to-make-the-gentle-world/" }, { label: "A Simple Thinking About Bloodtype", value: "A Simple Thinking About Bloodtype", url: "http://truyentuan.com/a-simple-thinking-about-bloodtype/" }, { label: "A Thousand Years Ninetails", value: "A Thousand Years Ninetails", url: "http://truyentuan.com/a-thousand-years-ninetails/" }, { label: "AAA", value: "AAA", url: "http://truyentuan.com/aaa/" }, { label: "Gakkou Gurashi!", value: "Gakkou Gurashi!", url: "http://truyentuan.com/gakkou-gurashi/" }, { label: "HAMMER SESSION! IN HIGH SCHOOL", value: "HAMMER SESSION! IN HIGH SCHOOL", url: "http://truyentuan.com/hammer-session-in-high-school/" }, { label: "Otaku no Musume-san", value: "Otaku no Musume-san", url: "http://truyentuan.com/otaku-no-musume-san/" }, { label: "M.C.Law", value: "M.C.Law", url: "http://truyentuan.com/m-c-law/" }, { label: "Lớp Học Ưu Tú", value: "Lớp Học Ưu Tú", url: "http://truyentuan.com/lop-hoc-uu-tu/" }, { label: "Long Tộc", value: "Long Tộc", url: "http://truyentuan.com/long-toc/" }, { label: "Lolita Complex Phoenix", value: "Lolita Complex Phoenix", url: "http://truyentuan.com/lolita-complex-phoenix/" }, { label: "Akuma no Hanayome", value: "Akuma no Hanayome", url: "http://truyentuan.com/akuma-no-hanayome/" }, { label: "Abara", value: "Abara", url: "http://truyentuan.com/abara/" }, { label: "Absolute Boyfriend", value: "Absolute Boyfriend", url: "http://truyentuan.com/absolute-boyfriend/" }, { label: "Absolute Witch", value: "Absolute Witch", url: "http://truyentuan.com/absolute-witch/" }, { label: "Tsuyokute New Saga", value: "Tsuyokute New Saga", url: "http://truyentuan.com/tsuyokute-new-saga/" }, { label: "Detective Academy Q", value: "Detective Academy Q", url: "http://truyentuan.com/detective-academy-q/" }, { label: "Untouchable", value: "Untouchable", url: "http://truyentuan.com/untouchable/" }, { label: "Đấu La Đại Lục 2", value: "Đấu La Đại Lục 2", url: "http://truyentuan.com/dau-la-dai-luc-2/" }, { label: "Acchi Kocchi", value: "Acchi Kocchi", url: "http://truyentuan.com/acchi-kocchi/" }, { label: "Ace of Hearts", value: "Ace of Hearts", url: "http://truyentuan.com/ace-of-hearts/" }, { label: "Acony", value: "Acony", url: "http://truyentuan.com/acony/" }, { label: "Shishunki no Iron Maiden", value: "Shishunki no Iron Maiden", url: "http://truyentuan.com/shishunki-no-iron-maiden/" }, { label: "Nhà Trọ Nhất Khắc", value: "Nhà Trọ Nhất Khắc", url: "http://truyentuan.com/nha-tro-nhat-khac/" }, { label: "AKATSUKI NO ARIA", value: "AKATSUKI NO ARIA", url: "http://truyentuan.com/akatsuki-no-aria/" }, { label: "Koharu no Hibi", value: "Koharu no Hibi", url: "http://truyentuan.com/koharu-no-hibi/" }, { label: "Kobato", value: "Kobato", url: "http://truyentuan.com/kobato/" }, { label: "Action", value: "Action", url: "http://truyentuan.com/action/" }, { label: "Again!!", value: "Again!!", url: "http://truyentuan.com/again/" }, { label: "Age of Ultron", value: "Age of Ultron", url: "http://truyentuan.com/age-of-ultron/" }, { label: "Age of X", value: "Age of X", url: "http://truyentuan.com/age-of-x/" }, { label: "Ageha 100%", value: "Ageha 100%", url: "http://truyentuan.com/ageha-100/" }, { label: "Kuzu no Honkai", value: "Kuzu no Honkai", url: "http://truyentuan.com/kuzu-no-honkai/" }, { label: "Ai Hime - Ai to Himegoto", value: "Ai Hime - Ai to Himegoto", url: "http://truyentuan.com/ai-hime-ai-to-himegoto/" }, { label: "Ai Kara Hajimaru", value: "Ai Kara Hajimaru", url: "http://truyentuan.com/ai-kara-hajimaru/" }, { label: "Ai no Shitsutakabutta", value: "Ai no Shitsutakabutta", url: "http://truyentuan.com/ai-no-shitsutakabutta/" }, { label: "Ai Yori Aoshi", value: "Ai Yori Aoshi", url: "http://truyentuan.com/ai-yori-aoshi/" }, { label: "Aimer", value: "Aimer", url: "http://truyentuan.com/aimer/" }, { label: "Akagami no Shirayukihime", value: "Akagami no Shirayukihime", url: "http://truyentuan.com/akagami-no-shirayukihime/" }, { label: "Princess Resurrection", value: "Princess Resurrection", url: "http://truyentuan.com/princess-resurrection/" }, { label: "Mahou Tsukai no Yome", value: "Mahou Tsukai no Yome", url: "http://truyentuan.com/mahou-tsukai-no-yome/" }, { label: "Resentment", value: "Resentment", url: "http://truyentuan.com/resentment/" }, { label: "Idol Shopping", value: "Idol Shopping", url: "http://truyentuan.com/idol-shopping/" }, { label: "Rikudou", value: "Rikudou", url: "http://truyentuan.com/rikudou/" }, { label: "Chihayafuru", value: "Chihayafuru", url: "http://truyentuan.com/chihayafuru/" }, { label: "Shinya Shokudou", value: "Shinya Shokudou", url: "http://truyentuan.com/shinya-shokudou/" }, { label: "KUROZAKURO", value: "KUROZAKURO", url: "http://truyentuan.com/kurozakuro/" }, { label: "Zusun", value: "Zusun", url: "http://truyentuan.com/zusun/" }, { label: "Zettai Karen Children", value: "Zettai Karen Children", url: "http://truyentuan.com/zettai-karen-children/" }, { label: "Akaki Tsuki no Mawaru Koro", value: "Akaki Tsuki no Mawaru Koro", url: "http://truyentuan.com/akaki-tsuki-no-mawaru-koro/" }, { label: "Akaya Akashiya Ayakashino", value: "Akaya Akashiya Ayakashino", url: "http://truyentuan.com/akaya-akashiya-ayakashino/" }, { label: "Aku no Hana - Những bông hoa ác", value: "Aku no Hana - Những bông hoa ác", url: "http://truyentuan.com/aku-no-hana-nhung-bong-hoa-ac/" }, { label: "Aku no Higan", value: "Aku no Higan", url: "http://truyentuan.com/aku-no-higan/" }, { label: "Akuma de Sourou", value: "Akuma de Sourou", url: "http://truyentuan.com/akuma-de-sourou/" }, { label: "Aletheia", value: "Aletheia", url: "http://truyentuan.com/aletheia/" }, { label: "Vợ tôi là Hổ", value: "Vợ tôi là Hổ", url: "http://truyentuan.com/vo-toi-la-ho/" }, { label: "Diêm Đế", value: "Diêm Đế", url: "http://truyentuan.com/diem-de/" }, { label: "ALICE 38", value: "ALICE 38", url: "http://truyentuan.com/alice-38/" }, { label: "Amakusa 1637", value: "Amakusa 1637", url: "http://truyentuan.com/amakusa-1637/" }, { label: "Ane Log - Moyako Neesan no Tomaranai Monologue", value: "Ane Log - Moyako Neesan no Tomaranai Monologue", url: "http://truyentuan.com/ane-log-moyako-neesan-no-tomaranai-monologue/" }, { label: "Angel Voice", value: "Angel Voice", url: "http://truyentuan.com/angel-voice/" }, { label: "Angelic Layer", value: "Angelic Layer", url: "http://truyentuan.com/angelic-layer/" }, { label: "Fairy Tail Zero: Chú Mèo Lam Happy", value: "Fairy Tail Zero: Chú Mèo Lam Happy", url: "http://truyentuan.com/fairy-tail-zero-chu-meo-lam-happy/" }, { label: "Angel Diary", value: "Angel Diary", url: "http://truyentuan.com/angel/" }, { label: "Ani-Com", value: "Ani-Com", url: "http://truyentuan.com/ani-com/" }, { label: "ANNARASUMANARA", value: "ANNARASUMANARA", url: "http://truyentuan.com/annarasumanara/" }, { label: "Another", value: "Another", url: "http://truyentuan.com/another/" }, { label: "Ou-sama Game - Kigen", value: "Ou-sama Game - Kigen", url: "http://truyentuan.com/ou-sama-game-kigen/" }, { label: "EGO - Đôi Cánh Mơ Ước", value: "EGO - Đôi Cánh Mơ Ước", url: "http://truyentuan.com/ego-doi-canh-mo-uoc/" }, { label: "Special Martial Arts Extreme Hell Private High School", value: "Special Martial Arts Extreme Hell Private High School", url: "http://truyentuan.com/special-martial-arts-extreme-hell-private-high-school/" }, { label: "Bắc đẩu du hiệp", value: "Bắc đẩu du hiệp", url: "http://truyentuan.com/bac-dau-du-hiep/" }, { label: "Hare Kon", value: "Hare Kon", url: "http://truyentuan.com/hare-kon/" }, { label: "Qwan", value: "Qwan", url: "http://truyentuan.com/qwan/" }, { label: "Princess Lucia", value: "Princess Lucia", url: "http://truyentuan.com/princess-lucia/" }, { label: "Shin Kurosagi - Kanketsu Hen", value: "Shin Kurosagi - Kanketsu Hen", url: "http://truyentuan.com/shin-kurosagi-kanketsu-hen/" }, { label: "ANTIDOTE", value: "ANTIDOTE", url: "http://truyentuan.com/antidote/" }, { label: "Anti Anti Angel", value: "Anti Anti Angel", url: "http://truyentuan.com/anti-anti-angel/" }, { label: "ANTIMAGIA", value: "ANTIMAGIA", url: "http://truyentuan.com/antimagia/" }, { label: "Aoki Hagane no Arpeggio", value: "Aoki Hagane no Arpeggio", url: "http://truyentuan.com/aoki-hagane-no-arpeggio/" }, { label: "Apollo’s Song", value: "Apollo’s Song", url: "http://truyentuan.com/apollos-song/" }, { label: "Tuyệt Thế Vô Song 2", value: "Tuyệt Thế Vô Song 2", url: "http://truyentuan.com/tuyet-the-vo-song-2/" }, { label: "Love Of Firos You", value: "Love Of Firos You", url: "http://truyentuan.com/love-of-firos-you/" }, { label: "AKB0048 - Episode 0", value: "AKB0048 - Episode 0", url: "http://truyentuan.com/akb0048-episode-0/" }, { label: "Red Living On The Edge", value: "Red Living On The Edge", url: "http://truyentuan.com/red-living-on-the-edge/" }, { label: "Real", value: "Real", url: "http://truyentuan.com/real/" }, { label: "QP - Soul Of Violence", value: "QP - Soul Of Violence", url: "http://truyentuan.com/qp-soul-of-violence/" }, { label: "AQUA", value: "AQUA", url: "http://truyentuan.com/aqua/" }, { label: "Aquaman", value: "Aquaman", url: "http://truyentuan.com/aquaman/" }, { label: "Arata Kangatari", value: "Arata Kangatari", url: "http://truyentuan.com/arata-kangatari/" }, { label: "Aratama Tribe", value: "Aratama Tribe", url: "http://truyentuan.com/aratama-tribe/" }, { label: "ARIA", value: "ARIA", url: "http://truyentuan.com/aria/" }, { label: "Ero manga sensei", value: "Ero manga sensei", url: "http://truyentuan.com/ero-manga-sensei/" }, { label: "Mahou Gyoshonin Roma", value: "Mahou Gyoshonin Roma", url: "http://truyentuan.com/mahou-gyoshonin-roma/" }, { label: "Monku no Tsukeyou ga Nai Rabukome", value: "Monku no Tsukeyou ga Nai Rabukome", url: "http://truyentuan.com/monku-no-tsukeyou-ga-nai-rabukome/" }, { label: "Omae o Otaku ni Shiteyaru kara, Ore o Riajuu ni Shitekure!", value: "Omae o Otaku ni Shiteyaru kara, Ore o Riajuu ni Shitekure!", url: "http://truyentuan.com/omae-o-otaku-ni-shiteyaru-kara-ore-o-riajuu-ni-shitekure/" }, { label: "Zombie Brother - Thi Huynh", value: "Zombie Brother - Thi Huynh", url: "http://truyentuan.com/zombie-brother-thi-huynh/" }, { label: "Nakanmon!", value: "Nakanmon!", url: "http://truyentuan.com/nakanmon/" }, { label: "Zero In", value: "Zero In", url: "http://truyentuan.com/zero-in/" }, { label: "Aries", value: "Aries", url: "http://truyentuan.com/aries-th/" }, { label: "Aruosumente", value: "Aruosumente", url: "http://truyentuan.com/aruosumente/" }, { label: "Asari tinh nghịch", value: "Asari tinh nghịch", url: "http://truyentuan.com/asari-tinh-nghich/" }, { label: "Ashita no Kyouko-san", value: "Ashita no Kyouko-san", url: "http://truyentuan.com/ashita-no-kyouko-san/" }, { label: "Asklepios", value: "Asklepios", url: "http://truyentuan.com/asklepios/" }, { label: "Yowamushi Pedal - Chân đạp nhát gan", value: "Yowamushi Pedal - Chân đạp nhát gan", url: "http://truyentuan.com/yowamushi-pedal-chan-dap-nhat-gan/" }, { label: "Kanokon", value: "Kanokon", url: "http://truyentuan.com/kanokon/" }, { label: "Yugo - Kẻ thương thuyết", value: "Yugo - Kẻ thương thuyết", url: "http://truyentuan.com/yugo-ke-thuong-thuyet/" }, { label: "LiLim Kiss", value: "LiLim Kiss", url: "http://truyentuan.com/lilim-kiss/" }, { label: "Life Is Money", value: "Life Is Money", url: "http://truyentuan.com/life-is-money/" }, { label: "Kokoni iru yo", value: "Kokoni iru yo", url: "http://truyentuan.com/kokoni-iru-yo/" }, { label: "Attack!!", value: "Attack!!", url: "http://truyentuan.com/attack/" }, { label: "AUTOMATA", value: "AUTOMATA", url: "http://truyentuan.com/automata/" }, { label: "Ayakashi Hisen", value: "Ayakashi Hisen", url: "http://truyentuan.com/ayakashi-hisen/" }, { label: "Ayakashi Koi Emaki", value: "Ayakashi Koi Emaki", url: "http://truyentuan.com/ayakashi-koi-emaki/" }, { label: "Ayame to Amane", value: "Ayame to Amane", url: "http://truyentuan.com/ayame-to-amane/" }, { label: "Thiện Lương Tử Thần", value: "Thiện Lương Tử Thần", url: "http://truyentuan.com/thien-luong-tu-than/" }, { label: "Kobayashi ga Kawai Sugite Tsurai!!", value: "Kobayashi ga Kawai Sugite Tsurai!!", url: "http://truyentuan.com/kobayashi-ga-kawai-sugite-tsurai/" }, { label: "Kitsune no Akuma to Kuroi Madousho", value: "Kitsune no Akuma to Kuroi Madousho", url: "http://truyentuan.com/kitsune-no-akuma-to-kuroi-madousho/" }, { label: "King Of Thorns", value: "King Of Thorns", url: "http://truyentuan.com/king-of-thorns/" }, { label: "Bá Tước Lạnh Lùng", value: "Bá Tước Lạnh Lùng", url: "http://truyentuan.com/ba-tuoc-lanh-lung/" }, { label: "Baby Love", value: "Baby Love", url: "http://truyentuan.com/baby-love/" }, { label: "Baby Steps", value: "Baby Steps", url: "http://truyentuan.com/baby-steps/" }, { label: "Baki Dou", value: "Baki Dou", url: "http://truyentuan.com/baki-dou/" }, { label: "Bambino!", value: "Bambino!", url: "http://truyentuan.com/bambino/" }, { label: "KimiKiss - Various Heroines", value: "KimiKiss - Various Heroines", url: "http://truyentuan.com/kimikiss-various-heroines/" }, { label: "Kimi to Kami Hikoki to", value: "Kimi to Kami Hikoki to", url: "http://truyentuan.com/kimi-to-kami-hikoki-to/" }, { label: "Kimi ga Koi ni Oboreru", value: "Kimi ga Koi ni Oboreru", url: "http://truyentuan.com/kimi-ga-koi-ni-oboreru/" }, { label: "Kimi ni Koishite Ii desu ka.", value: "Kimi ni Koishite Ii desu ka.", url: "http://truyentuan.com/kimi-ni-koishite-ii-desu-ka/" }, { label: "Kimi ga Uso wo Tsuita", value: "Kimi ga Uso wo Tsuita", url: "http://truyentuan.com/kimi-ga-uso-wo-tsuita/" }, { label: "Kimi ni Happiness", value: "Kimi ni Happiness", url: "http://truyentuan.com/kimi-ni-happiness/" }, { label: "Kiben Gakuha, Yotsuya Senpai no Kaidan", value: "Kiben Gakuha, Yotsuya Senpai no Kaidan", url: "http://truyentuan.com/kiben-gakuha-yotsuya-senpai-no-kaidan/" }, { label: "Batman: Death Mask", value: "Batman: Death Mask", url: "http://truyentuan.com/batman-death-mask/" }, { label: "Battle B-Daman", value: "Battle B-Daman", url: "http://truyentuan.com/battle-b-daman/" }, { label: "Be Heun", value: "Be Heun", url: "http://truyentuan.com/be-heun/" }, { label: "Beley - Con quay truyền thuyết", value: "Beley - Con quay truyền thuyết", url: "http://truyentuan.com/beley-con-quay-truyen-thuyet/" }, { label: "Between You And I", value: "Between You And I", url: "http://truyentuan.com/between-you-and-i/" }, { label: "Bí Mật Tình Báo -ICA", value: "Bí Mật Tình Báo -ICA", url: "http://truyentuan.com/b/" }, { label: "Bi Minh Chi Kiêm", value: "Bi Minh Chi Kiêm", url: "http://truyentuan.com/bi-minh-chi-ki/" }, { label: "Big Sister VS Big Brother", value: "Big Sister VS Big Brother", url: "http://truyentuan.com/big-sister-vs-big-brother/" }, { label: "Billion Dogs", value: "Billion Dogs", url: "http://truyentuan.com/billion-dogs/" }, { label: "Black Rock Shooter - Innocent Soul", value: "Black Rock Shooter - Innocent Soul", url: "http://truyentuan.com/black-rock-shooter-innocent-soul/" }, { label: "Gakkyu Houtei - Trường Phán Quyết", value: "Gakkyu Houtei - Trường Phán Quyết", url: "http://truyentuan.com/gakkyu-houtei-truong-phan-quyet/" }, { label: "Lunar Legend Tsukihime", value: "Lunar Legend Tsukihime", url: "http://truyentuan.com/lunar-legend-tsukihime/" }, { label: "Tân Tứ Đại Danh Bổ", value: "Tân Tứ Đại Danh Bổ", url: "http://truyentuan.com/tan-tu-dai-danh-bo/" }, { label: "Blood", value: "Blood", url: "http://truyentuan.com/blood/" }, { label: "Bloody Mary", value: "Bloody Mary", url: "http://truyentuan.com/bloody-mary/" }, { label: "Boku kara Kimi ga Kienai", value: "Boku kara Kimi ga Kienai", url: "http://truyentuan.com/boku-kara-kimi-ga-kienai/" }, { label: "Boku ni Koi suru Mechanical", value: "Boku ni Koi suru Mechanical", url: "http://truyentuan.com/boku-ni-koi-suru-mechanical/" }, { label: "Boku ni Natta Watashi", value: "Boku ni Natta Watashi", url: "http://truyentuan.com/boku-ni-natta-watashi/" }, { label: "Darwins Game", value: "Darwins Game", url: "http://truyentuan.com/darwins-game/" }, { label: "Quỷ Vương", value: "Quỷ Vương", url: "http://truyentuan.com/quy-vuong/" }, { label: "Boku to Kanojo no XXX", value: "Boku to Kanojo no XXX", url: "http://truyentuan.com/boku-to-kanojo-no-xxx/" }, { label: "Boku no ushiro ni majo ga iru", value: "Boku no ushiro ni majo ga iru", url: "http://truyentuan.com/boku-no-ushiro-ni-majo-ga-iru/" }, { label: "Boku wa Ookami", value: "Boku wa Ookami", url: "http://truyentuan.com/boku-wa-ookami/" }, { label: "Bokura wa Itsumo", value: "Bokura wa Itsumo", url: "http://truyentuan.com/bokura-wa-itsumo/" }, { label: "Bokurano", value: "Bokurano", url: "http://truyentuan.com/bokurano/" }, { label: "Hội Pháp Sư", value: "Hội Pháp Sư", url: "http://truyentuan.com/hoi-phap-su/" }, { label: "Bóng rổ đường phố", value: "Bóng rổ đường phố", url: "http://truyentuan.com/bong-ro-duong-pho/" }, { label: "Boy Princess", value: "Boy Princess", url: "http://truyentuan.com/boy-princess/" }, { label: "Bremen", value: "Bremen", url: "http://truyentuan.com/bremen/" }, { label: "Book of Cain -", value: "Book of Cain -", url: "http://truyentuan.com/book-of-cain/" }, { label: "Bouken Shounen ( Adventure Boy )", value: "Bouken Shounen ( Adventure Boy )", url: "http://truyentuan.com/bouken-shounen-adventure-boy/" }, { label: "Kagamigami", value: "Kagamigami", url: "http://truyentuan.com/kagamigami/" }, { label: "Btx", value: "Btx", url: "http://truyentuan.com/b-2/" }, { label: "Brothers", value: "Brothers", url: "http://truyentuan.com/brothers/" }, { label: "BuzzeR BeateR", value: "BuzzeR BeateR", url: "http://truyentuan.com/buzzer-beater/" }, { label: "C.B.A (caber adventure)", value: "C.B.A (caber adventure)", url: "http://truyentuan.com/c-b-a-caber-adventure/" }, { label: "C.M.B.", value: "C.M.B.", url: "http://truyentuan.com/c-m-b/" }, { label: "Cain Saga", value: "Cain Saga", url: "http://truyentuan.com/cain-saga/" }, { label: "Candy Candy", value: "Candy Candy", url: "http://truyentuan.com/candy-candy/" }, { label: "Capoo cat", value: "Capoo cat", url: "http://truyentuan.com/capoo-cat/" }, { label: "Cat in the car", value: "Cat in the car", url: "http://truyentuan.com/cat-in-the-car/" }, { label: "Captain Tsubasa", value: "Captain Tsubasa", url: "http://truyentuan.com/captain-tsubasa/" }, { label: "Captain Tsubasa Road to 2002", value: "Captain Tsubasa Road to 2002", url: "http://truyentuan.com/captain-tsubasa-road-to-2002/" }, { label: "Captain Tsubasa World Youth", value: "Captain Tsubasa World Youth", url: "http://truyentuan.com/captain-tsubasa-world-youth/" }, { label: "Caramel Diary", value: "Caramel Diary", url: "http://truyentuan.com/caramel-diary/" }, { label: "C-BLOSSOM - CASE 729", value: "C-BLOSSOM - CASE 729", url: "http://truyentuan.com/c-blossom-case-729/" }, { label: "The Voynich Hotel", value: "The Voynich Hotel", url: "http://truyentuan.com/the-voynich-hotel/" }, { label: "In Full Bloom", value: "In Full Bloom", url: "http://truyentuan.com/in-full-bloom/" }, { label: "Chou yo hana yo", value: "Chou yo hana yo", url: "http://truyentuan.com/chou-yo-hana-yo/" }, { label: "Mahou Shoujo Site", value: "Mahou Shoujo Site", url: "http://truyentuan.com/mahou-shoujo-site/" }, { label: "Namida Usagi - Seifuku no Kataomoi", value: "Namida Usagi - Seifuku no Kataomoi", url: "http://truyentuan.com/namida-usagi-seifuku-no-kataomoi/" }, { label: "Youth Gone Wild", value: "Youth Gone Wild", url: "http://truyentuan.com/youth-gone-wild/" }, { label: "Yoru Cafe", value: "Yoru Cafe", url: "http://truyentuan.com/yoru-cafe/" }, { label: "Yamato Gensouki", value: "Yamato Gensouki", url: "http://truyentuan.com/yamato-gensouki/" }, { label: "Yamamoto Zenjirou To Moushimasu", value: "Yamamoto Zenjirou To Moushimasu", url: "http://truyentuan.com/yamamoto-zenjirou-to-moushimasu/" }, { label: "Card Captor Sakura", value: "Card Captor Sakura", url: "http://truyentuan.com/card-captor-sakura/" }, { label: "Cat Street", value: "Cat Street", url: "http://truyentuan.com/cat-street/" }, { label: "Cesare", value: "Cesare", url: "http://truyentuan.com/cesare/" }, { label: "charisma doll", value: "charisma doll", url: "http://truyentuan.com/charisma-doll/" }, { label: "Cherry love", value: "Cherry love", url: "http://truyentuan.com/cherry-love/" }, { label: "CHERRY BOY, THAT GIRL", value: "CHERRY BOY, THAT GIRL", url: "http://truyentuan.com/cherry-boy-that-girl/" }, { label: "Cherry Juice", value: "Cherry Juice", url: "http://truyentuan.com/cherry-juice/" }, { label: "Chess Isle", value: "Chess Isle", url: "http://truyentuan.com/chess-isle/" }, { label: "Chiến binh Totem", value: "Chiến binh Totem", url: "http://truyentuan.com/chien-binh-totem/" }, { label: "Chimpui- Chú Chuột Chinba", value: "Chimpui- Chú Chuột Chinba", url: "http://truyentuan.com/chimpui-ch/" }, { label: "Tiên Nghịch", value: "Tiên Nghịch", url: "http://truyentuan.com/tien-nghich/" }, { label: "XBLADE", value: "XBLADE", url: "http://truyentuan.com/xblade/" }, { label: "Working!!", value: "Working!!", url: "http://truyentuan.com/working/" }, { label: "Wolverine MAX (2013)", value: "Wolverine MAX (2013)", url: "http://truyentuan.com/wolverine-max-2013/" }, { label: "Chín chín tám mươi mốt", value: "Chín chín tám mươi mốt", url: "http://truyentuan.com/chin-chin-tam-muoi-mot/" }, { label: "Chitose etc.", value: "Chitose etc.", url: "http://truyentuan.com/chitose-etc/" }, { label: "Chronos DEEP", value: "Chronos DEEP", url: "http://truyentuan.com/chronos-deep/" }, { label: "Cinderella Boy", value: "Cinderella Boy", url: "http://truyentuan.com/cinderella-boy/" }, { label: "Chronicles of the Grim Peddler", value: "Chronicles of the Grim Peddler", url: "http://truyentuan.com/chronicles-of-the-grim-peddler/" }, { label: "Ngư Tổ Thần Châu", value: "Ngư Tổ Thần Châu", url: "http://truyentuan.com/ngu-to-than-chau/" }, { label: "Inari, Konkon, Koi Iroha", value: "Inari, Konkon, Koi Iroha", url: "http://truyentuan.com/inari-konkon-koi-iroha/" }, { label: "Kamichama Karin", value: "Kamichama Karin", url: "http://truyentuan.com/kamichama-karin/" }, { label: "Jigokuren - Love in the Hell", value: "Jigokuren - Love in the Hell", url: "http://truyentuan.com/jigokuren-love-in-the-hell/" }, { label: "Itsumo Misora", value: "Itsumo Misora", url: "http://truyentuan.com/itsumo-misora/" }, { label: "Clamp Gakuen Tanteidan", value: "Clamp Gakuen Tanteidan", url: "http://truyentuan.com/clamp-gakuen-tanteidan/" }, { label: "Clannad", value: "Clannad", url: "http://truyentuan.com/clannad/" }, { label: "Clockwork Planet", value: "Clockwork Planet", url: "http://truyentuan.com/clockwork-planet/" }, { label: "Coda", value: "Coda", url: "http://truyentuan.com/coda/" }, { label: "Coin laundry no onna", value: "Coin laundry no onna", url: "http://truyentuan.com/coin-laundry-no-onna/" }, { label: "Kannazuki no Miko", value: "Kannazuki no Miko", url: "http://truyentuan.com/kannazuki-no-miko/" }, { label: "Kamisama no Iutoori", value: "Kamisama no Iutoori", url: "http://truyentuan.com/kamisama-no-iutoori/" }, { label: "Itoshi No Karin", value: "Itoshi No Karin", url: "http://truyentuan.com/itoshi-no-karin/" }, { label: "Island", value: "Island", url: "http://truyentuan.com/island/" }, { label: "Inu Neko Jump", value: "Inu Neko Jump", url: "http://truyentuan.com/inu-neko-jump/" }, { label: "Inumimi", value: "Inumimi", url: "http://truyentuan.com/inumimi/" }, { label: "Imadoki", value: "Imadoki", url: "http://truyentuan.com/imadoki/" }, { label: "Ido Ido", value: "Ido Ido", url: "http://truyentuan.com/ido-ido/" }, { label: "i love u Suzuki", value: "i love u Suzuki", url: "http://truyentuan.com/i-love-u-suzuki/" }, { label: "Hungry Joker", value: "Hungry Joker", url: "http://truyentuan.com/hungry-joker/" }, { label: "Honey Coming - Sweet Love Lesson", value: "Honey Coming - Sweet Love Lesson", url: "http://truyentuan.com/honey-coming-sweet-love-lesson/" }, { label: "Chu Tước Ký", value: "Chu Tước Ký", url: "http://truyentuan.com/chu-tuoc-ki/" }, { label: "Covertness: Secretly, Greatly", value: "Covertness: Secretly, Greatly", url: "http://truyentuan.com/covertness-secretly-greatly/" }, { label: "Crab kiss", value: "Crab kiss", url: "http://truyentuan.com/crab-kiss/" }, { label: "Cutie Boy", value: "Cutie Boy", url: "http://truyentuan.com/cutie-boy/" }, { label: "High High", value: "High High", url: "http://truyentuan.com/high-high/" }, { label: "LOST IN LONDON", value: "LOST IN LONDON", url: "http://truyentuan.com/lost-in-london/" }, { label: "Tokku Hakkenshi [code:t-8]", value: "Tokku Hakkenshi [code:t-8]", url: "http://truyentuan.com/tokku-hakkenshi-codet-8/" }, { label: "Truyền thuyết về nakua", value: "Truyền thuyết về nakua", url: "http://truyentuan.com/truyen-thuyet-ve-nakua/" }, { label: "Nhân Cách Tối Cường", value: "Nhân Cách Tối Cường", url: "http://truyentuan.com/nhan-cach-toi-cuong/" }, { label: "Ultra Battle Satellite", value: "Ultra Battle Satellite", url: "http://truyentuan.com/ultra-battle-satellite/" }, { label: "cynical orange", value: "cynical orange", url: "http://truyentuan.com/cynical-orange/" }, { label: "Daa! Daa! Daa!", value: "Daa! Daa! Daa!", url: "http://truyentuan.com/daa-daa-daa/" }, { label: "Daburu Jurietto", value: "Daburu Jurietto", url: "http://truyentuan.com/daburu-jurietto/" }, { label: "Đặc Vụ Của Địa Ngục", value: "Đặc Vụ Của Địa Ngục", url: "http://truyentuan.com/dac-vu-cua-dia-nguc/" }, { label: "DAME NA WATASHI NI KOISHITE KUDASAI", value: "DAME NA WATASHI NI KOISHITE KUDASAI", url: "http://truyentuan.com/dame-na-watashi-ni-koishite-kudasai/" }, { label: "Yukikaze", value: "Yukikaze", url: "http://truyentuan.com/yukikaze/" }, { label: "Dan Doh! Xi", value: "Dan Doh! Xi", url: "http://truyentuan.com/dan-doh-xi/" }, { label: "Dansai Bunri no Crime Edge", value: "Dansai Bunri no Crime Edge", url: "http://truyentuan.com/dansai-bunri-no-crime-edge/" }, { label: "Dantalian no Shoka", value: "Dantalian no Shoka", url: "http://truyentuan.com/dantalian-no-shoka/" }, { label: "Đạo mộ bút ký", value: "Đạo mộ bút ký", url: "http://truyentuan.com/dao-mo-b/" }, { label: "Đảo tự sát", value: "Đảo tự sát", url: "http://truyentuan.com/dao-tu-sat/" }, { label: "Wild life Cuộc Sống Hoang Dã", value: "Wild life Cuộc Sống Hoang Dã", url: "http://truyentuan.com/wild-life-cuoc-song-hoang-da/" }, { label: "Tối Cường Tà Thiểu", value: "Tối Cường Tà Thiểu", url: "http://truyentuan.com/toi-cuong-ta-thieu/" }, { label: "Builder", value: "Builder", url: "http://truyentuan.com/builder/" }, { label: "Yondemasu yo, Azazel-san", value: "Yondemasu yo, Azazel-san", url: "http://truyentuan.com/yondemasu-yo-azazel-san/" }, { label: "Magical x Miracle", value: "Magical x Miracle", url: "http://truyentuan.com/magical-x-miracle/" }, { label: "Hanagimi to Koisuru Watashi", value: "Hanagimi to Koisuru Watashi", url: "http://truyentuan.com/hanagimi-to-koisuru-watashi/" }, { label: "Darker than Black", value: "Darker than Black", url: "http://truyentuan.com/darker-than-black/" }, { label: "Datte Suki Nandamon", value: "Datte Suki Nandamon", url: "http://truyentuan.com/datte-suki-nandamon/" }, { label: "Dear Mine", value: "Dear Mine", url: "http://truyentuan.com/dear-mine/" }, { label: "Dear Myself", value: "Dear Myself", url: "http://truyentuan.com/dear-myself/" }, { label: "Dekoboko Girlish", value: "Dekoboko Girlish", url: "http://truyentuan.com/dekoboko-girlish/" }, { label: "Dennou Alice to Inaba-kun", value: "Dennou Alice to Inaba-kun", url: "http://truyentuan.com/dennou-alice-to-inaba-kun/" }, { label: "Under Execution Under Jailbreak", value: "Under Execution Under Jailbreak", url: "http://truyentuan.com/under-execution-under-jailbreak/" }, { label: "Thần tại Nhân Gian", value: "Thần tại Nhân Gian", url: "http://truyentuan.com/than-tai-nhan-gian/" }, { label: "Nhất Võ Đạo", value: "Nhất Võ Đạo", url: "http://truyentuan.com/nhat-vo-dao/" }, { label: "Ibitsu", value: "Ibitsu", url: "http://truyentuan.com/ibitsu/" }, { label: "Hot Milk", value: "Hot Milk", url: "http://truyentuan.com/hot-milk/" }, { label: "Hozuki-san Chi no Aneki", value: "Hozuki-san Chi no Aneki", url: "http://truyentuan.com/hozuki-san-chi-no-aneki/" }, { label: "Densha Otoko", value: "Densha Otoko", url: "http://truyentuan.com/densha-otoko/" }, { label: "Dersert Coral", value: "Dersert Coral", url: "http://truyentuan.com/dersert-coral/" }, { label: "Devilman", value: "Devilman", url: "http://truyentuan.com/devilman/" }, { label: "Diamond Life", value: "Diamond Life", url: "http://truyentuan.com/diamond-life/" }, { label: "Địch Gia Lam", value: "Địch Gia Lam", url: "http://truyentuan.com/dich-gia-lam/" }, { label: "MIX", value: "MIX", url: "http://truyentuan.com/mix/" }, { label: "Trường Ca Hành", value: "Trường Ca Hành", url: "http://truyentuan.com/truong-ca-hanh/" }, { label: "Shiki", value: "Shiki", url: "http://truyentuan.com/shiki/" }, { label: "Freezing - Zero", value: "Freezing - Zero", url: "http://truyentuan.com/freezing-zero/" }, { label: "Soul eater", value: "Soul eater", url: "http://truyentuan.com/soul-eater/" }, { label: "DISTANT SKY", value: "DISTANT SKY", url: "http://truyentuan.com/distant-sky/" }, { label: "Divine Melody", value: "Divine Melody", url: "http://truyentuan.com/divine-melody-ti/" }, { label: "Do you want to try?", value: "Do you want to try?", url: "http://truyentuan.com/do-you-want-to-try/" }, { label: "Iten No Tsubasa", value: "Iten No Tsubasa", url: "http://truyentuan.com/d/" }, { label: "Donten ni Warau", value: "Donten ni Warau", url: "http://truyentuan.com/donten-ni-warau/" }, { label: "Montage (WATANABE Jun)", value: "Montage (WATANABE Jun)", url: "http://truyentuan.com/montage-watanabe-jun/" }, { label: "Hắc Báo Liệt Truyện", value: "Hắc Báo Liệt Truyện", url: "http://truyentuan.com/hac-bao-liet-truyen/" }, { label: "Ngôi Sao Kabi", value: "Ngôi Sao Kabi", url: "http://truyentuan.com/ngoi-sao-kabi/" }, { label: "Dorabase", value: "Dorabase", url: "http://truyentuan.com/dorabase-doraemon-b/" }, { label: "Dorothy of Oz", value: "Dorothy of Oz", url: "http://truyentuan.com/dorothy-of-oz/" }, { label: "Double Arts", value: "Double Arts", url: "http://truyentuan.com/double-arts/" }, { label: "Dragon Nest Random Scribbles", value: "Dragon Nest Random Scribbles", url: "http://truyentuan.com/dragon-nest-random-scribbles/" }, { label: "Dragon Nest: Shungeki no Sedo", value: "Dragon Nest: Shungeki no Sedo", url: "http://truyentuan.com/dragon-nest-shungeki-no-sedo/" }, { label: "Honey and Clover", value: "Honey and Clover", url: "http://truyentuan.com/honey-and-clover/" }, { label: "Home", value: "Home", url: "http://truyentuan.com/home/" }, { label: "Hohzuki Island - Đảo Kinh Hoàng", value: "Hohzuki Island - Đảo Kinh Hoàng", url: "http://truyentuan.com/hohzuki-island-dao-kinh-hoang/" }, { label: "Junji Itou Horror Comic Collection", value: "Junji Itou Horror Comic Collection", url: "http://truyentuan.com/junji-itou-horror-comic-collection/" }, { label: "Hirahira-kun Seishun Jingi", value: "Hirahira-kun Seishun Jingi", url: "http://truyentuan.com/hirahira-kun-seishun-jingi/" }, { label: "Dragon Quest II: Emblem of Roto", value: "Dragon Quest II: Emblem of Roto", url: "http://truyentuan.com/dragon-quest-ii-emblem-of-roto/" }, { label: "Drug-on", value: "Drug-on", url: "http://truyentuan.com/drug-on/" }, { label: "Duction Man", value: "Duction Man", url: "http://truyentuan.com/duction-man/" }, { label: "Durarara!! - Dollars/Mika Harima Arc", value: "Durarara!! - Dollars/Mika Harima Arc", url: "http://truyentuan.com/durarara-dollarsmika-harima-arc/" }, { label: "Dragon's Son Changsik (DeathPlace)", value: "Dragon's Son Changsik (DeathPlace)", url: "http://truyentuan.com/dragons-son-changsik-dp/" }, { label: "Yuusen Shoujo", value: "Yuusen Shoujo", url: "http://truyentuan.com/yuusen-shoujo/" }, { label: "Yuru Yuri", value: "Yuru Yuri", url: "http://truyentuan.com/yuru-yuri/" }, { label: "Yumeiro Patissiere", value: "Yumeiro Patissiere", url: "http://truyentuan.com/yumeiro-patissiere/" }, { label: "3D Kanojo - Bạn gái 3D", value: "3D Kanojo - Bạn gái 3D", url: "http://truyentuan.com/3d-kanojo-ban-gai-3d/" }, { label: "Eat-man", value: "Eat-man", url: "http://truyentuan.com/eat-man-2/" }, { label: "Elios electrical", value: "Elios electrical", url: "http://truyentuan.com/elios-electrical/" }, { label: "Elixir", value: "Elixir", url: "http://truyentuan.com/elixir/" }, { label: "Embalming - Ướp xác", value: "Embalming - Ướp xác", url: "http://truyentuan.com/embalming-uop-xac/" }, { label: "Emerging", value: "Emerging", url: "http://truyentuan.com/emerging/" }, { label: "Shokugeki no Soma - Etoile", value: "Shokugeki no Soma - Etoile", url: "http://truyentuan.com/shokugeki-no-soma-etoile/" }, { label: "X-Men: Hope Trilogy", value: "X-Men: Hope Trilogy", url: "http://truyentuan.com/x-men-hope-trilogy/" }, { label: "Welcome To The Convenience Store", value: "Welcome To The Convenience Store", url: "http://truyentuan.com/welcome-to-the-convenience-store/" }, { label: "Watchmen", value: "Watchmen", url: "http://truyentuan.com/watchmen/" }, { label: "Wake Up Deadman (Second Season)", value: "Wake Up Deadman (Second Season)", url: "http://truyentuan.com/wake-up-deadman-second-season/" }, { label: "With!!", value: "With!!", url: "http://truyentuan.com/with/" }, { label: "Wagaya no Oinarisama", value: "Wagaya no Oinarisama", url: "http://truyentuan.com/wagaya-no-oinarisama/" }, { label: "Emma", value: "Emma", url: "http://truyentuan.com/emma/" }, { label: "Emma đến từ địa phủ", value: "Emma đến từ địa phủ", url: "http://truyentuan.com/emma-den-tu-dia-phu/" }, { label: "En Passant", value: "En Passant", url: "http://truyentuan.com/en-passant/" }, { label: "End of Eternity: The Secret Hours", value: "End of Eternity: The Secret Hours", url: "http://truyentuan.com/end-of-eternity-the-secret-hours/" }, { label: "Endless Love", value: "Endless Love", url: "http://truyentuan.com/endless-love/" }, { label: "Naruto Gaiden: Hokage Đệ Thất", value: "Naruto Gaiden: Hokage Đệ Thất", url: "http://truyentuan.com/naruto-gaiden-hokage-de-that/" }, { label: "Evyione", value: "Evyione", url: "http://truyentuan.com/evyione-2/" }, { label: "Esprit", value: "Esprit", url: "http://truyentuan.com/esprit/" }, { label: "Fable", value: "Fable", url: "http://truyentuan.com/fable/" }, { label: "Fairy cube", value: "Fairy cube", url: "http://truyentuan.com/fairy-cube/" }, { label: "Fairy Heart", value: "Fairy Heart", url: "http://truyentuan.com/fairy-heart/" }, { label: "Fall In Love Like a Comic!", value: "Fall In Love Like a Comic!", url: "http://truyentuan.com/fall-in-love-like-a-comic/" }, { label: "Plastic Nee-san", value: "Plastic Nee-san", url: "http://truyentuan.com/plastic-nee-san/" }, { label: "Black Clover", value: "Black Clover", url: "http://truyentuan.com/black-clover/" }, { label: "Vương quốc của những dải băng bịt mắt (TT8)", value: "Vương quốc của những dải băng bịt mắt (TT8)", url: "http://truyentuan.com/vuong-quoc-cua-nhung-dai-bang-bit-mat-tt8/" }, { label: "Vùng Đất Xa Xăm", value: "Vùng Đất Xa Xăm", url: "http://truyentuan.com/vung-dat-xa-xam/" }, { label: "Hoán Đổi Nhiệm Màu", value: "Hoán Đổi Nhiệm Màu", url: "http://truyentuan.com/hoan-doi-nhiem-mau/" }, { label: "Đại Hiệp Truyền Kỳ", value: "Đại Hiệp Truyền Kỳ", url: "http://truyentuan.com/dai-hiep-truyen-ky/" }, { label: "Handa-kun", value: "Handa-kun", url: "http://truyentuan.com/handa-kun/" }, { label: "Stop!! Hibari-kun!", value: "Stop!! Hibari-kun!", url: "http://truyentuan.com/stop-hibari-kun/" }, { label: "Haru Matsu Bokura", value: "Haru Matsu Bokura", url: "http://truyentuan.com/haru-matsu-bokura/" }, { label: "Naruto Ngoại Truyện: Gương Mặt Thầy Kakashi", value: "Naruto Ngoại Truyện: Gương Mặt Thầy Kakashi", url: "http://truyentuan.com/naruto-ngoai-truyen-guong-mat-thay-kakashi/" }, { label: "Family compo", value: "Family compo", url: "http://truyentuan.com/family-compo/" }, { label: "Family Size", value: "Family Size", url: "http://truyentuan.com/family-size/" }, { label: "Fear Itself", value: "Fear Itself", url: "http://truyentuan.com/fear-itself/" }, { label: "Fetish Berry", value: "Fetish Berry", url: "http://truyentuan.com/fetish-berry/" }, { label: "Film girl", value: "Film girl", url: "http://truyentuan.com/film-girl/" }, { label: "Necrophile of Darkside Sister", value: "Necrophile of Darkside Sister", url: "http://truyentuan.com/necrophile-of-darkside-sister/" }, { label: "Urasai", value: "Urasai", url: "http://truyentuan.com/urasai/" }, { label: "Uwasa no Midori-Kun", value: "Uwasa no Midori-Kun", url: "http://truyentuan.com/uwasa-no-midori-kun/" }, { label: "Valkyria Nainen Kikan", value: "Valkyria Nainen Kikan", url: "http://truyentuan.com/valkyria-nainen-kikan/" }, { label: "Vampire Juujikai", value: "Vampire Juujikai", url: "http://truyentuan.com/vampire-juujikai/" }, { label: "Vampire Princess Miyu", value: "Vampire Princess Miyu", url: "http://truyentuan.com/vampire-princess-miyu/" }, { label: "Venus in love", value: "Venus in love", url: "http://truyentuan.com/venus-in-love/" }, { label: "Fire Stone", value: "Fire Stone", url: "http://truyentuan.com/fire-stone/" }, { label: "Fisheye Placebo", value: "Fisheye Placebo", url: "http://truyentuan.com/fisheye-placebo/" }, { label: "Fist of Legend", value: "Fist of Legend", url: "http://truyentuan.com/fist-of-legend/" }, { label: "FlashPoint", value: "FlashPoint", url: "http://truyentuan.com/flashpoint/" }, { label: "Flesh Colored Horror", value: "Flesh Colored Horror", url: "http://truyentuan.com/flesh-colored-horror/" }, { label: "Foreign Land of Ogres", value: "Foreign Land of Ogres", url: "http://truyentuan.com/foreign-land-of-ogres/" }, { label: "Fuan no Tane Plus", value: "Fuan no Tane Plus", url: "http://truyentuan.com/fuan-no-tane-plus/" }, { label: "Umineko no Naku Koro ni Episode 1: Legend of the Golden Witch", value: "Umineko no Naku Koro ni Episode 1: Legend of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-1-legend-of-the-golden-witch/" }, { label: "Umineko no Naku Koro ni Episode 2: Turn of the Golden Witch", value: "Umineko no Naku Koro ni Episode 2: Turn of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-2-turn-of-the-golden-witch/" }, { label: "Umineko no Naku Koro ni Episode 4: Alliance of the Golden Witch", value: "Umineko no Naku Koro ni Episode 4: Alliance of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-episode-4-alliance-of-the-golden-witch/" }, { label: "Ultimate Fantastic Four", value: "Ultimate Fantastic Four", url: "http://truyentuan.com/ultimate-fantastic-four/" }, { label: "Tubame Syndrome", value: "Tubame Syndrome", url: "http://truyentuan.com/tubame-syndrome/" }, { label: "Fuguruma Memories", value: "Fuguruma Memories", url: "http://truyentuan.com/fuguruma-memories/" }, { label: "Fukashigi Philia", value: "Fukashigi Philia", url: "http://truyentuan.com/fukashigi-philia/" }, { label: "Fukigen Cinderella", value: "Fukigen Cinderella", url: "http://truyentuan.com/fukigen-cinderella/" }, { label: "Full Moon wo Sagashite", value: "Full Moon wo Sagashite", url: "http://truyentuan.com/full-moon-wo-sagashite/" }, { label: "Fun Fun Factory", value: "Fun Fun Factory", url: "http://truyentuan.com/fun-fun-factory/" }, { label: "Urami Koi, Koi, Urami Koi", value: "Urami Koi, Koi, Urami Koi", url: "http://truyentuan.com/urami-koi-koi-urami-koi/" }, { label: "Fushigi na shounen", value: "Fushigi na shounen", url: "http://truyentuan.com/fushigi-na-shounen/" }, { label: "Fushigi Yuugi Genbu Kaiden", value: "Fushigi Yuugi Genbu Kaiden", url: "http://truyentuan.com/fushigi-yuugi-genbu-kaiden/" }, { label: "Gakkou Kaidan", value: "Gakkou Kaidan", url: "http://truyentuan.com/gakkou-kaidan/" }, { label: "Gals", value: "Gals", url: "http://truyentuan.com/gals/" }, { label: "Gamushara", value: "Gamushara", url: "http://truyentuan.com/gamushara/" }, { label: "Ta Không Muốn Nói Ta Chỉ Là Một Con Gà", value: "Ta Không Muốn Nói Ta Chỉ Là Một Con Gà", url: "http://truyentuan.com/ta-khong-muon-noi-ta-chi-la-mot-con-ga/" }, { label: "Kasane", value: "Kasane", url: "http://truyentuan.com/kasane/" }, { label: "6000 the deep sea of madness", value: "6000 the deep sea of madness", url: "http://truyentuan.com/6000-the-deep-sea-of-madness/" }, { label: "Oh, My God!", value: "Oh, My God!", url: "http://truyentuan.com/oh-my-god/" }, { label: "Gan Kon", value: "Gan Kon", url: "http://truyentuan.com/gan-kon/" }, { label: "Gang King-Băng Đảng Học Đường", value: "Gang King-Băng Đảng Học Đường", url: "http://truyentuan.com/gang-king-bang-dang-hoc-duong/" }, { label: "GÁNH XIẾC QUÁI DỊ", value: "GÁNH XIẾC QUÁI DỊ", url: "http://truyentuan.com/ganh-xiec-quai-di/" }, { label: "Ganota No Onna", value: "Ganota No Onna", url: "http://truyentuan.com/ganota-no-onna/" }, { label: "Gate 7", value: "Gate 7", url: "http://truyentuan.com/gate-7/" }, { label: "Violinist of Hameln", value: "Violinist of Hameln", url: "http://truyentuan.com/violinist-of-hameln/" }, { label: "Vô Hạn Khủng Bố", value: "Vô Hạn Khủng Bố", url: "http://truyentuan.com/vo-han-khung-bo/" }, { label: "Twelve Nights", value: "Twelve Nights", url: "http://truyentuan.com/twelve-nights/" }, { label: "Tướng Dạ", value: "Tướng Dạ", url: "http://truyentuan.com/tuong-da/" }, { label: "Under One Roof", value: "Under One Roof", url: "http://truyentuan.com/under-one-roof/" }, { label: "Gekka no Kimi", value: "Gekka no Kimi", url: "http://truyentuan.com/gekka-no-kimi/" }, { label: "Gekkan Shojo Nozaki-kun", value: "Gekkan Shojo Nozaki-kun", url: "http://truyentuan.com/gekkan-shojo-nozaki-kun/" }, { label: "Gekkou Chou", value: "Gekkou Chou", url: "http://truyentuan.com/gekkou-chou/" }, { label: "Genjuu No Seiza", value: "Genjuu No Seiza", url: "http://truyentuan.com/genjuu-no-seiza/" }, { label: "Genkaku Picasso", value: "Genkaku Picasso", url: "http://truyentuan.com/genkaku-picasso/" }, { label: "Need a girl", value: "Need a girl", url: "http://truyentuan.com/need-a-girl/" }, { label: "Yamako", value: "Yamako", url: "http://truyentuan.com/yamako/" }, { label: "Nước Nhật Vui Vẻ", value: "Nước Nhật Vui Vẻ", url: "http://truyentuan.com/nuoc-nhat-vui-ve/" }, { label: "Hana to Akuma", value: "Hana to Akuma", url: "http://truyentuan.com/hana-to-akuma/" }, { label: "Sensei Kunshu", value: "Sensei Kunshu", url: "http://truyentuan.com/sensei-kunshu/" }, { label: "Genshiken", value: "Genshiken", url: "http://truyentuan.com/genshiken/" }, { label: "Gerbera", value: "Gerbera", url: "http://truyentuan.com/gerbera/" }, { label: "Getsu Mei Sei Ki", value: "Getsu Mei Sei Ki", url: "http://truyentuan.com/getsu-mei-sei-ki/" }, { label: "Sakurasaku Syndrome", value: "Sakurasaku Syndrome", url: "http://truyentuan.com/sakurasaku-syndrome/" }, { label: "Trường Học Bí Ẩn", value: "Trường Học Bí Ẩn", url: "http://truyentuan.com/truong-hoc-bi-an/" }, { label: "Tripeace", value: "Tripeace", url: "http://truyentuan.com/tripeace/" }, { label: "Triệu Hoá Vạn Tuế", value: "Triệu Hoá Vạn Tuế", url: "http://truyentuan.com/trieu-hoa-van-tue/" }, { label: "Trái Tim Của Một Người Bạn", value: "Trái Tim Của Một Người Bạn", url: "http://truyentuan.com/trai-tim-cua-mot-nguoi-ban/" }, { label: "Già Thiên", value: "Già Thiên", url: "http://truyentuan.com/gia-thien/" }, { label: "Gia Tộc Kumo", value: "Gia Tộc Kumo", url: "http://truyentuan.com/gia-toc-kumo/" }, { label: "Getter Robo Anthology", value: "Getter Robo Anthology", url: "http://truyentuan.com/getter-robo-anthology/" }, { label: "Giấc Mơ Ngọt Ngào", value: "Giấc Mơ Ngọt Ngào", url: "http://truyentuan.com/giac-mo-ngot-ngao/" }, { label: "Giang Hồ Hành", value: "Giang Hồ Hành", url: "http://truyentuan.com/giang-ho-hanh/" }, { label: "Giang Hồ Tương Vong", value: "Giang Hồ Tương Vong", url: "http://truyentuan.com/giang-ho-tuong-vong/" }, { label: "Giày Thuỷ Tinh", value: "Giày Thuỷ Tinh", url: "http://truyentuan.com/giay-thuy%cc%89-tinh/" }, { label: "Gigantomakhia", value: "Gigantomakhia", url: "http://truyentuan.com/gigantomakhia/" }, { label: "Imawa no Kuni no Alice", value: "Imawa no Kuni no Alice", url: "http://truyentuan.com/imawa-no-kuni-no-alice/" }, { label: "Toraneko Folklore", value: "Toraneko Folklore", url: "http://truyentuan.com/toraneko-folklore/" }, { label: "Tora to Ookami", value: "Tora to Ookami", url: "http://truyentuan.com/tora-to-ookami/" }, { label: "Tokyo Ravens", value: "Tokyo Ravens", url: "http://truyentuan.com/tokyo-ravens/" }, { label: "Tiji-kun!", value: "Tiji-kun!", url: "http://truyentuan.com/tiji-kun/" }, { label: "Ginga nagareboshi Gin", value: "Ginga nagareboshi Gin", url: "http://truyentuan.com/ginga-nagareboshi-gin/" }, { label: "Ginzatoushi to Kuro no Yousei - Sugar Apple Fairytale", value: "Ginzatoushi to Kuro no Yousei - Sugar Apple Fairytale", url: "http://truyentuan.com/ginzatoushi-to-kuro-no-yousei-sugar-apple-fairytale/" }, { label: "Gió Xuân", value: "Gió Xuân", url: "http://truyentuan.com/gio-xuan/" }, { label: "Girl Friends", value: "Girl Friends", url: "http://truyentuan.com/girl-friends/" }, { label: "God Child", value: "God Child", url: "http://truyentuan.com/god-child/" }, { label: "Going to you", value: "Going to you", url: "http://truyentuan.com/going-to-you/" }, { label: "Gohou Drug", value: "Gohou Drug", url: "http://truyentuan.com/gohou-drug/" }, { label: "Gojikanme no Sensou", value: "Gojikanme no Sensou", url: "http://truyentuan.com/gojikanme-no-sensou/" }, { label: "Đồng Hồ Cát", value: "Đồng Hồ Cát", url: "http://truyentuan.com/dong-ho-cat/" }, { label: "Hitoribocchi No Chikyuu Shinryaku", value: "Hitoribocchi No Chikyuu Shinryaku", url: "http://truyentuan.com/hitoribocchi-no-chikyuu-shinryaku/" }, { label: "Touhou - Life of Maid", value: "Touhou - Life of Maid", url: "http://truyentuan.com/touhou-life-of-maid/" }, { label: "Tokyo Girl Destruction", value: "Tokyo Girl Destruction", url: "http://truyentuan.com/tokyo-girl-destruction/" }, { label: "Tiệm Thời Trang", value: "Tiệm Thời Trang", url: "http://truyentuan.com/tiem-thoi-trang/" }, { label: "Thuyết Anh Hùng Thùy Thị Anh Hùng", value: "Thuyết Anh Hùng Thùy Thị Anh Hùng", url: "http://truyentuan.com/thuyet-anh-hung-thuy-thi-anh-hung/" }, { label: "Thề ước người và rồng", value: "Thề ước người và rồng", url: "http://truyentuan.com/the-uoc-nguoi-va-rong/" }, { label: "The Strings Dolls", value: "The Strings Dolls", url: "http://truyentuan.com/the-strings-dolls/" }, { label: "The kurosagi corpse delivery service", value: "The kurosagi corpse delivery service", url: "http://truyentuan.com/the-kurosagi-corpse-delivery-service/" }, { label: "The Hour Of The Mice", value: "The Hour Of The Mice", url: "http://truyentuan.com/the-hour-of-the-mice/" }, { label: "Gokusen", value: "Gokusen", url: "http://truyentuan.com/gokusen/" }, { label: "Ga-rei", value: "Ga-rei", url: "http://truyentuan.com/ga-rei/" }, { label: "Golden Time", value: "Golden Time", url: "http://truyentuan.com/golden-time/" }, { label: "Good Morning Call", value: "Good Morning Call", url: "http://truyentuan.com/good-morning-call/" }, { label: "Graineliers", value: "Graineliers", url: "http://truyentuan.com/graineliers/" }, { label: "Red String", value: "Red String", url: "http://truyentuan.com/red-string/" }, { label: "Võ Động Càn Khôn", value: "Võ Động Càn Khôn", url: "http://truyentuan.com/vo-dong-can-khon/" }, { label: "Thế Giới Tiên Hiệp", value: "Thế Giới Tiên Hiệp", url: "http://truyentuan.com/the-gioi-tien-hiep/" }, { label: "My Heart Is Beating", value: "My Heart Is Beating", url: "http://truyentuan.com/my-heart-is-beating/" }, { label: "Tri Bắc Du", value: "Tri Bắc Du", url: "http://truyentuan.com/tri-bac-du/" }, { label: "Grand Sun", value: "Grand Sun", url: "http://truyentuan.com/grand-sun/" }, { label: "Green Lantern", value: "Green Lantern", url: "http://truyentuan.com/green-lantern/" }, { label: "G-School", value: "G-School", url: "http://truyentuan.com/g-school/" }, { label: "Guardians of The Galaxy v3 2013", value: "Guardians of The Galaxy v3 2013", url: "http://truyentuan.com/guardians-of-the-galaxy-v3-2013-2/" }, { label: "Gundam Build Fighters: Amazing", value: "Gundam Build Fighters: Amazing", url: "http://truyentuan.com/gundam-build-fighters-amazing/" }, { label: "Thiên Tử Truyền Kỳ 3 - Lưu Manh Thiên Tử", value: "Thiên Tử Truyền Kỳ 3 - Lưu Manh Thiên Tử", url: "http://truyentuan.com/thien-tu-truyen-ki-luu-manh-thien-tu/" }, { label: "Thiên Thần Tập Sự", value: "Thiên Thần Tập Sự", url: "http://truyentuan.com/thien-than-tap-su/" }, { label: "Thiên Diệp Anh Hoa", value: "Thiên Diệp Anh Hoa", url: "http://truyentuan.com/thien-diep-anh-hoa/" }, { label: "Tenshi no Uta", value: "Tenshi no Uta", url: "http://truyentuan.com/tenshi-no-uta/" }, { label: "Tân Tác Trung Hoa Anh Hùng", value: "Tân Tác Trung Hoa Anh Hùng", url: "http://truyentuan.com/tan-tac-trung-hoa-anh-hung/" }, { label: "Gunjou Gakusha", value: "Gunjou Gakusha", url: "http://truyentuan.com/gunjou-gakusha/" }, { label: "Gunjou Senki", value: "Gunjou Senki", url: "http://truyentuan.com/gunjou-senki/" }, { label: "Gunka no Baltzar", value: "Gunka no Baltzar", url: "http://truyentuan.com/gunka-no-baltzar/" }, { label: "PoKeMon Pippi", value: "PoKeMon Pippi", url: "http://truyentuan.com/pokemon-pippi/" }, { label: "Aikora", value: "Aikora", url: "http://truyentuan.com/aikora/" }, { label: "Cửu Tinh Vô Song", value: "Cửu Tinh Vô Song", url: "http://truyentuan.com/cuu-tinh-vo-song/" }, { label: "Gyon-Woo và Jik-Nyu", value: "Gyon-Woo và Jik-Nyu", url: "http://truyentuan.com/gyon-woo-va-jik-nyu/" }, { label: "Gyutto Shite Chuu", value: "Gyutto Shite Chuu", url: "http://truyentuan.com/gyutto-shite-chuu/" }, { label: "H.H", value: "H.H", url: "http://truyentuan.com/h-h/" }, { label: "Hắc Khuyển", value: "Hắc Khuyển", url: "http://truyentuan.com/hac-khuyen/" }, { label: "Hachi", value: "Hachi", url: "http://truyentuan.com/hachi/" }, { label: "Seishun Pop", value: "Seishun Pop", url: "http://truyentuan.com/seishun-pop/" }, { label: "Hyakka no Shirushi", value: "Hyakka no Shirushi", url: "http://truyentuan.com/hyakka-no-shirushi/" }, { label: "Phong Khởi Thượng Lam", value: "Phong Khởi Thượng Lam", url: "http://truyentuan.com/phong-khoi-thuong-lam/" }, { label: "Thời Đại X Long", value: "Thời Đại X Long", url: "http://truyentuan.com/thoi-dai-x-long/" }, { label: "Thám Tử Kindaichi – Phần 2", value: "Thám Tử Kindaichi – Phần 2", url: "http://truyentuan.com/tham-tu-kindaichi-phan-2/" }, { label: "Tenkyuugi Sephirahtus", value: "Tenkyuugi Sephirahtus", url: "http://truyentuan.com/tenkyuugi-sephirahtus/" }, { label: "Teiden Shoujo to Hanemushi no Orchestra", value: "Teiden Shoujo to Hanemushi no Orchestra", url: "http://truyentuan.com/teiden-shoujo-to-hanemushi-no-orchestra/" }, { label: "Tế Công Truyền Kì", value: "Tế Công Truyền Kì", url: "http://truyentuan.com/te-cong-truyen-ki/" }, { label: "Tam Quốc Thần Binh", value: "Tam Quốc Thần Binh", url: "http://truyentuan.com/tam-quoc-than-binh/" }, { label: "Hachimitsu ni Hatsukoi", value: "Hachimitsu ni Hatsukoi", url: "http://truyentuan.com/hachimitsu-ni-hatsukoi/" }, { label: "HACK//LINK", value: "HACK//LINK", url: "http://truyentuan.com/hacklink/" }, { label: "Hai nửa tâm hồn", value: "Hai nửa tâm hồn", url: "http://truyentuan.com/hai-nua-tam-hon/" }, { label: "Hajimari no Niina", value: "Hajimari no Niina", url: "http://truyentuan.com/hajimari-no-niina/" }, { label: "HAKAIOU NORITAKA", value: "HAKAIOU NORITAKA", url: "http://truyentuan.com/hakaiou-noritaka/" }, { label: "Hakoiri Drops", value: "Hakoiri Drops", url: "http://truyentuan.com/hakoiri-drops/" }, { label: "Hakuji", value: "Hakuji", url: "http://truyentuan.com/hakuji/" }, { label: "Hakushaku to Yousei", value: "Hakushaku to Yousei", url: "http://truyentuan.com/hakushaku-to-yousei/" }, { label: "Hamatora", value: "Hamatora", url: "http://truyentuan.com/hamatora/" }, { label: "Hana ni Arashi", value: "Hana ni Arashi", url: "http://truyentuan.com/hana-ni-arashi/" }, { label: "Hana ni Kedamono", value: "Hana ni Kedamono", url: "http://truyentuan.com/hana-ni-kedamono/" }, { label: "Hana to Uso to Makoto", value: "Hana to Uso to Makoto", url: "http://truyentuan.com/hana-to-uso-to-makoto/" }, { label: "Hanamaru Youchien", value: "Hanamaru Youchien", url: "http://truyentuan.com/hanamaru-youchien/" }, { label: "Hanamai Koeda de Aimashou", value: "Hanamai Koeda de Aimashou", url: "http://truyentuan.com/hanamai-koeda-de-aimashou/" }, { label: "Hanatsukihime", value: "Hanatsukihime", url: "http://truyentuan.com/hanatsukihime/" }, { label: "Hanged Doll", value: "Hanged Doll", url: "http://truyentuan.com/hanged-doll/" }, { label: "Haou Densetsu Takeru", value: "Haou Densetsu Takeru", url: "http://truyentuan.com/haou-densetsu-takeru/" }, { label: "Hapi Buni", value: "Hapi Buni", url: "http://truyentuan.com/hapi-buni/" }, { label: "HAPPY and MURPHY", value: "HAPPY and MURPHY", url: "http://truyentuan.com/happy-and-murphy/" }, { label: "Hard Romantica", value: "Hard Romantica", url: "http://truyentuan.com/hard-romantica/" }, { label: "Shigatsu wa Kimi no Uso", value: "Shigatsu wa Kimi no Uso", url: "http://truyentuan.com/shigatsu-wa-kimi-no-uso/" }, { label: "Thiên Hạ Đệ Nhất Manh Phu", value: "Thiên Hạ Đệ Nhất Manh Phu", url: "http://truyentuan.com/thien-ha-de-nhat-manh-phu/" }, { label: "KING OF FIGHTERS ZILLION", value: "KING OF FIGHTERS ZILLION", url: "http://truyentuan.com/king-of-fighters-zillion/" }, { label: "Yakushoku Distpiari - Gesellshaft Blue", value: "Yakushoku Distpiari - Gesellshaft Blue", url: "http://truyentuan.com/yakushoku-distpiari/" }, { label: "Haru no Houtai Shoujo", value: "Haru no Houtai Shoujo", url: "http://truyentuan.com/haru-no-houtai-shoujo/" }, { label: "Hataraku Maousama", value: "Hataraku Maousama", url: "http://truyentuan.com/hataraku-maousama/" }, { label: "Hatenkou Yuugi", value: "Hatenkou Yuugi", url: "http://truyentuan.com/hatenkou-yuugi/" }, { label: "Hatsune Mix", value: "Hatsune Mix", url: "http://truyentuan.com/hatsune-mix/" }, { label: "Hayate x Blade", value: "Hayate x Blade", url: "http://truyentuan.com/hayate-x-blade/" }, { label: "Dagashi Kashi", value: "Dagashi Kashi", url: "http://truyentuan.com/dagashi-kashi/" }, { label: "Kengan Ashua", value: "Kengan Ashua", url: "http://truyentuan.com/kengan-ashua/" }, { label: "Michelin Star", value: "Michelin Star", url: "http://truyentuan.com/michelin-star/" }, { label: "Pine in the Flower Garden", value: "Pine in the Flower Garden", url: "http://truyentuan.com/pine-in-the-flower-garden/" }, { label: "He Is a High-school Girl", value: "He Is a High-school Girl", url: "http://truyentuan.com/he-is-a-high-school-girl/" }, { label: "Heart No Kakurega", value: "Heart No Kakurega", url: "http://truyentuan.com/heart-no-kakurega/" }, { label: "Hebi to Maria to Otsukisama", value: "Hebi to Maria to Otsukisama", url: "http://truyentuan.com/hebi-to-maria-to-otsukisama/" }, { label: "Hell’s Kitchen", value: "Hell’s Kitchen", url: "http://truyentuan.com/hells-kitchen/" }, { label: "Kaichou wa Maid-sama!", value: "Kaichou wa Maid-sama!", url: "http://truyentuan.com/kaichou-wa-maid-sama/" }, { label: "Watashi Ga Motete Dousunda", value: "Watashi Ga Motete Dousunda", url: "http://truyentuan.com/watashi-ga-motete-dousunda/" }, { label: "Shinrei Tantei Yakumo", value: "Shinrei Tantei Yakumo", url: "http://truyentuan.com/shinrei-tantei-yakumo/" }, { label: "Museum", value: "Museum", url: "http://truyentuan.com/museum/" }, { label: "Kare kano", value: "Kare kano", url: "http://truyentuan.com/kare-kano/" }, { label: "Sword Soul", value: "Sword Soul", url: "http://truyentuan.com/sword-soul/" }, { label: "Hero mask", value: "Hero mask", url: "http://truyentuan.com/hero-mask/" }, { label: "Marchan : The Embodiment of Tales", value: "Marchan : The Embodiment of Tales", url: "http://truyentuan.com/marchan-the-embodiment-of-tales/" }, { label: "The Children's Teacher, Mr. Kwon", value: "The Children's Teacher, Mr. Kwon", url: "http://truyentuan.com/the-children-teacher-mr-kwon/" }, { label: "Suki desu Suzuki-kun", value: "Suki desu Suzuki-kun", url: "http://truyentuan.com/suki-desu-suzuki-kun/" }, { label: "Sư tử Huyền Sơn", value: "Sư tử Huyền Sơn", url: "http://truyentuan.com/su-tu-huyen-son/" }, { label: "Stardust Wink", value: "Stardust Wink", url: "http://truyentuan.com/stardust-wink/" }, { label: "Heroine Shikkaku", value: "Heroine Shikkaku", url: "http://truyentuan.com/heroine-shikkaku/" }, { label: "Hetalia Blog Strips", value: "Hetalia Blog Strips", url: "http://truyentuan.com/hetalia-blog-strips/" }, { label: "Hi no Tori", value: "Hi no Tori", url: "http://truyentuan.com/hi-no-tori/" }, { label: "Hiệp Khách Hành", value: "Hiệp Khách Hành", url: "http://truyentuan.com/hiep-khach-hanh/" }, { label: "Hiệp sĩ nữ hoàng", value: "Hiệp sĩ nữ hoàng", url: "http://truyentuan.com/hiep-si-nu-hoang/" }, { label: "My boyfriend", value: "My boyfriend", url: "http://truyentuan.com/my-boyfriend/" }, { label: "By Chance, We... and...", value: "By Chance, We... and...", url: "http://truyentuan.com/by-chance-we-and/" }, { label: "Sekai Oni", value: "Sekai Oni", url: "http://truyentuan.com/sekai-oni/" }, { label: "Super Lovers", value: "Super Lovers", url: "http://truyentuan.com/super-lovers/" }, { label: "Superior Spider Man", value: "Superior Spider Man", url: "http://truyentuan.com/superior-spider-man/" }, { label: "Hiiro Ouji", value: "Hiiro Ouji", url: "http://truyentuan.com/hiiro-ouji/" }, { label: "Himawari-san", value: "Himawari-san", url: "http://truyentuan.com/himawari-san/" }, { label: "Hinamatsuri", value: "Hinamatsuri", url: "http://truyentuan.com/hinamatsuri/" }, { label: "Hiniiru", value: "Hiniiru", url: "http://truyentuan.com/hiniiru/" }, { label: "Hiyokoi", value: "Hiyokoi", url: "http://truyentuan.com/hiyokoi/" }, { label: "Hồ Ly Lãng Mạn", value: "Hồ Ly Lãng Mạn", url: "http://truyentuan.com/ho-ly-lang-man/" }, { label: "Hoa Hồng Tặng Anh", value: "Hoa Hồng Tặng Anh", url: "http://truyentuan.com/hoa-hong-tang-anh/" }, { label: "Hoa Thiên Cốt", value: "Hoa Thiên Cốt", url: "http://truyentuan.com/hoa-thien-cot/" }, { label: "Komatta Toki ni wa Hoshi ni Kike!", value: "Komatta Toki ni wa Hoshi ni Kike!", url: "http://truyentuan.com/komatta-toki-ni-wa-hoshi-ni-kike/" }, { label: "Nise Koi - Magical Patissier Kosaki-chan", value: "Nise Koi - Magical Patissier Kosaki-chan", url: "http://truyentuan.com/nise-koi-magical-patissier-kosaki-chan/" }, { label: "Tales Of Destiny", value: "Tales Of Destiny", url: "http://truyentuan.com/tales-of-destiny/" }, { label: "Tadashii Kodomo no Tsukurikata!", value: "Tadashii Kodomo no Tsukurikata!", url: "http://truyentuan.com/tadashii-kodomo-no-tsukurikata/" }, { label: "Sugarless", value: "Sugarless", url: "http://truyentuan.com/sugarless/" }, { label: "Steel Rose", value: "Steel Rose", url: "http://truyentuan.com/steel-rose/" }, { label: "Sougiya Ridoru - Undertaker Riddle", value: "Sougiya Ridoru - Undertaker Riddle", url: "http://truyentuan.com/sougiya-ridoru-undertaker-riddle/" }, { label: "Soukai Kessen", value: "Soukai Kessen", url: "http://truyentuan.com/soukai-kessen/" }, { label: "Toukyou Kushu (DP)", value: "Toukyou Kushu (DP)", url: "http://truyentuan.com/toukyou-kushu-dp/" }, { label: "Onihime VS", value: "Onihime VS", url: "http://truyentuan.com/onihime-vs/" }, { label: "Ookami-san to Shichinin no Nakamatachi", value: "Ookami-san to Shichinin no Nakamatachi", url: "http://truyentuan.com/ookami-san-to-shichinin-no-nakamatachi/" }, { label: "Open sesame", value: "Open sesame", url: "http://truyentuan.com/open-sesame/" }, { label: "Nowhere Boy", value: "Nowhere Boy", url: "http://truyentuan.com/nowhere-boy/" }, { label: "Monster X Monster", value: "Monster X Monster", url: "http://truyentuan.com/monster-x-monster/" }, { label: "Siêu nhân Locke", value: "Siêu nhân Locke", url: "http://truyentuan.com/sieu-nhan-locke/" }, { label: "Sidooh", value: "Sidooh", url: "http://truyentuan.com/sidooh/" }, { label: "Hoa và đoản kiếm", value: "Hoa và đoản kiếm", url: "http://truyentuan.com/hoa-va-doan-kiem/" }, { label: "Honey Crush", value: "Honey Crush", url: "http://truyentuan.com/honey-crush/" }, { label: "Honey na Koto", value: "Honey na Koto", url: "http://truyentuan.com/honey-na-koto/" }, { label: "Hoozuki no Reitetsu", value: "Hoozuki no Reitetsu", url: "http://truyentuan.com/hoozuki-no-reitetsu/" }, { label: "Hoshi no Koe", value: "Hoshi no Koe", url: "http://truyentuan.com/hoshi-no-koe/" }, { label: "Hyakki Yakoushou", value: "Hyakki Yakoushou", url: "http://truyentuan.com/hyakki-yakoushou/" }, { label: "Love Tyrant", value: "Love Tyrant", url: "http://truyentuan.com/love-tyrant/" }, { label: "Tân Teppi", value: "Tân Teppi", url: "http://truyentuan.com/tan-teppi/" }, { label: "Thiên Tử Truyền Kỳ 2 - Tần Vương Doanh Chính", value: "Thiên Tử Truyền Kỳ 2 - Tần Vương Doanh Chính", url: "http://truyentuan.com/thien-tu-truyen-ky-tan-vuong-doanh-chinh/" }, { label: "Shounen Oujo", value: "Shounen Oujo", url: "http://truyentuan.com/shounen-oujo/" }, { label: "Shounen Maid", value: "Shounen Maid", url: "http://truyentuan.com/shounen-maid/" }, { label: "Hoshi No Furu Machi", value: "Hoshi No Furu Machi", url: "http://truyentuan.com/hoshi-no-furu-machi/" }, { label: "Huyễn Thế Kỷ", value: "Huyễn Thế Kỷ", url: "http://truyentuan.com/huyen-the-ky/" }, { label: "Hyakko", value: "Hyakko", url: "http://truyentuan.com/hyakko/" }, { label: "Houkago no Ouji-sama", value: "Houkago no Ouji-sama", url: "http://truyentuan.com/houkago-no-ouji-sama/" }, { label: "Houkago X Ponytail", value: "Houkago X Ponytail", url: "http://truyentuan.com/houkago-x-ponytail/" }, { label: "Tung Tiền Hữu Tọa Linh Kiếm Sơn", value: "Tung Tiền Hữu Tọa Linh Kiếm Sơn", url: "http://truyentuan.com/tung-tien-huu-toa-linh-kiem-son/" }, { label: "Ma Vương Và Dũng Sĩ Và Thánh Kiếm Thần Điện", value: "Ma Vương Và Dũng Sĩ Và Thánh Kiếm Thần Điện", url: "http://truyentuan.com/ma-vuong-va-dung-si-va-thanh-kiem-than-dien/" }, { label: "Bạc Hà Chi Hạ", value: "Bạc Hà Chi Hạ", url: "http://truyentuan.com/bac-ha-chi-ha/" }, { label: "I Am a Hero", value: "I Am a Hero", url: "http://truyentuan.com/i-am-a-hero/" }, { label: "Ichiban Ushiro no Daimaou", value: "Ichiban Ushiro no Daimaou", url: "http://truyentuan.com/ichiban-ushiro-no-daimaou/" }, { label: "Ichigo Mashimaro", value: "Ichigo Mashimaro", url: "http://truyentuan.com/ichigo-mashimaro/" }, { label: "Ichigo To Anzu", value: "Ichigo To Anzu", url: "http://truyentuan.com/ichigo-to-anzu/" }, { label: "Shinshi Doumei Cross", value: "Shinshi Doumei Cross", url: "http://truyentuan.com/shinshi-doumei-cross/" }, { label: "Shin Saiseien - Minouchou Kyuutei Monogatari", value: "Shin Saiseien - Minouchou Kyuutei Monogatari", url: "http://truyentuan.com/shin-saiseien-minouchou-kyuutei-monogatari/" }, { label: "Seiken no Blacksmith", value: "Seiken no Blacksmith", url: "http://truyentuan.com/seiken-no-blacksmith/" }, { label: "Sayounara, Zetsubou-Sensei - Goodbye, Mr. Despair", value: "Sayounara, Zetsubou-Sensei - Goodbye, Mr. Despair", url: "http://truyentuan.com/sayounara-zetsubou-sensei-goodbye-mr-despair/" }, { label: "Scarlet Palace", value: "Scarlet Palace", url: "http://truyentuan.com/scarlet-palace/" }, { label: "IFRIT - Danzai no Enjin", value: "IFRIT - Danzai no Enjin", url: "http://truyentuan.com/ifrit-danzai-no-enjin/" }, { label: "Igyoujin Oniwakamaru", value: "Igyoujin Oniwakamaru", url: "http://truyentuan.com/igyoujin-oniwakamaru/" }, { label: "Iinchou No Himegoto", value: "Iinchou No Himegoto", url: "http://truyentuan.com/iinchou-no-himegoto/" }, { label: "Ikigami", value: "Ikigami", url: "http://truyentuan.com/ikigami/" }, { label: "Ikasama Memory", value: "Ikasama Memory", url: "http://truyentuan.com/ikasama-memory/" }, { label: "Seto No Hanayome", value: "Seto No Hanayome", url: "http://truyentuan.com/seto-no-hanayome/" }, { label: "Sengoku Armors", value: "Sengoku Armors", url: "http://truyentuan.com/sengoku-armors/" }, { label: "Sao Đổi Ngôi", value: "Sao Đổi Ngôi", url: "http://truyentuan.com/sao-doi-ngoi/" }, { label: "Sarasah", value: "Sarasah", url: "http://truyentuan.com/sarasah/" }, { label: "Sao Băng Trong Lòng", value: "Sao Băng Trong Lòng", url: "http://truyentuan.com/sao-bang-trong-long/" }, { label: "Ilegenes - Kokuyou no Kiseki", value: "Ilegenes - Kokuyou no Kiseki", url: "http://truyentuan.com/ilegenes-kokuyou-no-kiseki/" }, { label: "Immortal Hounds", value: "Immortal Hounds", url: "http://truyentuan.com/immortal-hounds/" }, { label: "Inochi", value: "Inochi", url: "http://truyentuan.com/inochi/" }, { label: "Sousei no Onmyouji", value: "Sousei no Onmyouji", url: "http://truyentuan.com/sousei-no-onmyouji/" }, { label: "Sorenari Ni Shinken Nandesu", value: "Sorenari Ni Shinken Nandesu", url: "http://truyentuan.com/sorenari-ni-shinken-nandesu/" }, { label: "Sora no Shita Yane no Naka", value: "Sora no Shita Yane no Naka", url: "http://truyentuan.com/sora-no-shita-yane-no-naka/" }, { label: "SaGa - Kiếm Thánh Sứ", value: "SaGa - Kiếm Thánh Sứ", url: "http://truyentuan.com/saga-kiem-thanh-su/" }, { label: "Ito Junji Cat", value: "Ito Junji Cat", url: "http://truyentuan.com/ito-junji-cat/" }, { label: "Itsuwaribito Utsuho", value: "Itsuwaribito Utsuho", url: "http://truyentuan.com/itsuwaribito-utsuho/" }, { label: "Jarinko Chie", value: "Jarinko Chie", url: "http://truyentuan.com/jarinko-chie/" }, { label: "Jigoku Sensei Nube", value: "Jigoku Sensei Nube", url: "http://truyentuan.com/jigoku-sensei-nube/" }, { label: "Jigoku Shoujo", value: "Jigoku Shoujo", url: "http://truyentuan.com/jigoku-shoujo/" }, { label: "Tây Du Ký Bựa", value: "Tây Du Ký Bựa", url: "http://truyentuan.com/tay-du-ki-bua/" }, { label: "Nichijou", value: "Nichijou", url: "http://truyentuan.com/nichijou/" }, { label: "Cuộc Phiêu Lưu Của Cậu Bé Croket", value: "Cuộc Phiêu Lưu Của Cậu Bé Croket", url: "http://truyentuan.com/cuoc-phieu-luu-cua-cau-be-croket/" }, { label: "Freak Island - Đảo Quái Dị", value: "Freak Island - Đảo Quái Dị", url: "http://truyentuan.com/freak-island-dao-quai-di/" }, { label: "Rokujouma no Shinryakusha!?", value: "Rokujouma no Shinryakusha!?", url: "http://truyentuan.com/rokujouma-no-shinryakusha/" }, { label: "Rokudenashi Blues", value: "Rokudenashi Blues", url: "http://truyentuan.com/rokudenashi-blues/" }, { label: "RE-TAKE", value: "RE-TAKE", url: "http://truyentuan.com/re-take/" }, { label: "RG Veda", value: "RG Veda", url: "http://truyentuan.com/rg-veda/" }, { label: "Puchimon", value: "Puchimon", url: "http://truyentuan.com/puchimon/" }, { label: "Judge", value: "Judge", url: "http://truyentuan.com/judge/" }, { label: "Junketsu Kareshi", value: "Junketsu Kareshi", url: "http://truyentuan.com/junketsu-kareshi/" }, { label: "Kagerou Day Anthology", value: "Kagerou Day Anthology", url: "http://truyentuan.com/kagerou-day-anthology/" }, { label: "Kagijin-Khóa Nhân", value: "Kagijin-Khóa Nhân", url: "http://truyentuan.com/kagijin-khoa-nhan/" }, { label: "Kaguya Hime", value: "Kaguya Hime", url: "http://truyentuan.com/kaguya-hime/" }, { label: "Nanoka no Kare", value: "Nanoka no Kare", url: "http://truyentuan.com/nanoka-no-kare/" }, { label: "Stand Up!", value: "Stand Up!", url: "http://truyentuan.com/stand-up/" }, { label: "Ojousama wa Oyomesama", value: "Ojousama wa Oyomesama", url: "http://truyentuan.com/ojousama-wa-oyomesama/" }, { label: "Shitsuji-sama no Okiniiri", value: "Shitsuji-sama no Okiniiri", url: "http://truyentuan.com/shitsuji-sama-no-okiniiri/" }, { label: "Reimei no Arcana", value: "Reimei no Arcana", url: "http://truyentuan.com/reimei-no-arcana/" }, { label: "Puripuri", value: "Puripuri", url: "http://truyentuan.com/puripuri/" }, { label: "Kaiouki - Hải Hoàng Ký", value: "Kaiouki - Hải Hoàng Ký", url: "http://truyentuan.com/kaiouki-hai-hoang-ky/" }, { label: "kaito kid", value: "kaito kid", url: "http://truyentuan.com/kaito-kid/" }, { label: "KAIN", value: "KAIN", url: "http://truyentuan.com/kain/" }, { label: "K - The First", value: "K - The First", url: "http://truyentuan.com/k-the-first/" }, { label: "Kono Sekai ga Game da to, Ore dake ga Shitteiru", value: "Kono Sekai ga Game da to, Ore dake ga Shitteiru", url: "http://truyentuan.com/kono-sekai-ga-game-da-to-ore-dake-ga-shitteiru/" }, { label: "Pokemon philatelic: Dou", value: "Pokemon philatelic: Dou", url: "http://truyentuan.com/pokemon-philatelic-dou/" }, { label: "Player Kill", value: "Player Kill", url: "http://truyentuan.com/player-kill/" }, { label: "Piano no Mori", value: "Piano no Mori", url: "http://truyentuan.com/piano-no-mori/" }, { label: "KAKEGURUI", value: "KAKEGURUI", url: "http://truyentuan.com/kakegurui/" }, { label: "Kami no Shizuku", value: "Kami no Shizuku", url: "http://truyentuan.com/kami-no-shizuku/" }, { label: "Kamikami Kaeshi", value: "Kamikami Kaeshi", url: "http://truyentuan.com/kamikami-kaeshi/" }, { label: "Kanata Kara", value: "Kanata Kara", url: "http://truyentuan.com/kanata-kara/" }, { label: "Level Up", value: "Level Up", url: "http://truyentuan.com/level-up/" }, { label: "Karakai Jouzu no Takagi-san", value: "Karakai Jouzu no Takagi-san", url: "http://truyentuan.com/karakai-jouzu-no-takagi-san/" }, { label: "Karakuridouji Ultimo", value: "Karakuridouji Ultimo", url: "http://truyentuan.com/karakuridouji-ultimo/" }, { label: "Kẻ Đồng Hành", value: "Kẻ Đồng Hành", url: "http://truyentuan.com/ke-dong-hanh/" }, { label: "Kế Hoạch Bướm", value: "Kế Hoạch Bướm", url: "http://truyentuan.com/ke-hoach-buom/" }, { label: "Kemono Kingdom Zoo", value: "Kemono Kingdom Zoo", url: "http://truyentuan.com/kemono-kingdom-zoo/" }, { label: "Ribbon no kishi", value: "Ribbon no kishi", url: "http://truyentuan.com/ribbon-no-kishi/" }, { label: "Pika Ichi", value: "Pika Ichi", url: "http://truyentuan.com/pika-ichi/" }, { label: "PLANETARY", value: "PLANETARY", url: "http://truyentuan.com/planetary/" }, { label: "Phi Đãi Nghiên Tuyết", value: "Phi Đãi Nghiên Tuyết", url: "http://truyentuan.com/phi-dai-nghien-tuyet/" }, { label: "Papillon hana to chou", value: "Papillon hana to chou", url: "http://truyentuan.com/papillon-hana-to-chou/" }, { label: "Khát Vọng Đường Đua", value: "Khát Vọng Đường Đua", url: "http://truyentuan.com/khat-vong-duong-dua/" }, { label: "Khỉ Biển", value: "Khỉ Biển", url: "http://truyentuan.com/khi-bien/" }, { label: "Kiba no Tabishounin - The Arms Peddler", value: "Kiba no Tabishounin - The Arms Peddler", url: "http://truyentuan.com/kiba-no-tabishounin-the-arms-peddler/" }, { label: "Kidou Senshi Crossbone Gundam", value: "Kidou Senshi Crossbone Gundam", url: "http://truyentuan.com/kidou-senshi-crossbone-gundam/" }, { label: "Kiếm Đạo Độc Tôn", value: "Kiếm Đạo Độc Tôn", url: "http://truyentuan.com/kiem-dao-doc-ton/" }, { label: "Nhiệm vụ đặc biệt", value: "Nhiệm vụ đặc biệt", url: "http://truyentuan.com/nhiem-vu-dac-biet/" }, { label: "Parfait Tic!", value: "Parfait Tic!", url: "http://truyentuan.com/parfait-tic/" }, { label: "Peace Maker Kurogane", value: "Peace Maker Kurogane", url: "http://truyentuan.com/peace-maker-kurogane/" }, { label: "Pen Saki ni Syrup", value: "Pen Saki ni Syrup", url: "http://truyentuan.com/pen-saki-ni-syrup/" }, { label: "Pajama na Kanojo", value: "Pajama na Kanojo", url: "http://truyentuan.com/pajama-na-kanojo/" }, { label: "Kiếm khách Baek Dong So", value: "Kiếm khách Baek Dong So", url: "http://truyentuan.com/kiem-khach-baek-dong-so/" }, { label: "Kiêu Lý Kiều Khí", value: "Kiêu Lý Kiều Khí", url: "http://truyentuan.com/kieu-ly-kieu-khi/" }, { label: "Killer Stall", value: "Killer Stall", url: "http://truyentuan.com/killer-stall/" }, { label: "Kimi ja Nakya Dame Nanda", value: "Kimi ja Nakya Dame Nanda", url: "http://truyentuan.com/kimi-ja-nakya-dame-nanda/" }, { label: "Kiku", value: "Kiku", url: "http://truyentuan.com/kiku/" }, { label: "Ouran High School Host Club[ remake]", value: "Ouran High School Host Club[ remake]", url: "http://truyentuan.com/ouran-high-school-host-club-remake/" }, { label: "OreImo DJ Collection", value: "OreImo DJ Collection", url: "http://truyentuan.com/oreimo-dj-collection/" }, { label: "Orange", value: "Orange", url: "http://truyentuan.com/orange/" }, { label: "Only The Flower Knows", value: "Only The Flower Knows", url: "http://truyentuan.com/only-the-flower-knows/" }, { label: "Oniisama e...", value: "Oniisama e...", url: "http://truyentuan.com/oniisama-e/" }, { label: "Onidere!", value: "Onidere!", url: "http://truyentuan.com/onidere/" }, { label: "One-Pound Gospel", value: "One-Pound Gospel", url: "http://truyentuan.com/one-pound-gospel/" }, { label: "Oda Nobuna no Yabou - Himesama to Issho", value: "Oda Nobuna no Yabou - Himesama to Issho", url: "http://truyentuan.com/oda-nobuna-no-yabou-himesama-to-issho/" }, { label: "Kimi no Knife", value: "Kimi no Knife", url: "http://truyentuan.com/kimi-no-knife/" }, { label: "Kimi no Neiro", value: "Kimi no Neiro", url: "http://truyentuan.com/kimi-no-neiro/" }, { label: "Kimi wa Pet", value: "Kimi wa Pet", url: "http://truyentuan.com/kimi-wa-pet/" }, { label: "King Golf", value: "King Golf", url: "http://truyentuan.com/king-golf/" }, { label: "Kingdom of Zombie", value: "Kingdom of Zombie", url: "http://truyentuan.com/kingdom-of-zombie/" }, { label: "Kyokou Suiri", value: "Kyokou Suiri", url: "http://truyentuan.com/kyokou-suiri/" }, { label: "Missile & Planckton", value: "Missile & Planckton", url: "http://truyentuan.com/missile-planckton/" }, { label: "Kiss Wood", value: "Kiss Wood", url: "http://truyentuan.com/kiss-wood/" }, { label: "Kobatotei Ibun", value: "Kobatotei Ibun", url: "http://truyentuan.com/kobatotei-ibun/" }, { label: "Kodomo no omocha", value: "Kodomo no omocha", url: "http://truyentuan.com/kodomo-no-omocha/" }, { label: "Koisome Momiji", value: "Koisome Momiji", url: "http://truyentuan.com/koisome-momiji/" }, { label: "Kokoro Ni Hana Wo", value: "Kokoro Ni Hana Wo", url: "http://truyentuan.com/kokoro-ni-hana-wo/" }, { label: "Zang Hun Men", value: "Zang Hun Men", url: "http://truyentuan.com/zang-hun-men/" }, { label: "Okitsune-sama de Chu", value: "Okitsune-sama de Chu", url: "http://truyentuan.com/okitsune-sama-de-chu/" }, { label: "Obaka-chan, Koigatariki", value: "Obaka-chan, Koigatariki", url: "http://truyentuan.com/obaka-chan-koigatariki/" }, { label: "O/A", value: "O/A", url: "http://truyentuan.com/oa/" }, { label: "Nụ Hôn Tinh Ngịch", value: "Nụ Hôn Tinh Ngịch", url: "http://truyentuan.com/nu-hon-tinh-nghich/" }, { label: "Nozomi Witches", value: "Nozomi Witches", url: "http://truyentuan.com/nozomi-witches/" }, { label: "Komorebi no Kuni", value: "Komorebi no Kuni", url: "http://truyentuan.com/komorebi-no-kuni/" }, { label: "Konjiki no Gash!!", value: "Konjiki no Gash!!", url: "http://truyentuan.com/konjiki-no-gash/" }, { label: "Konya Mo Nemurenai", value: "Konya Mo Nemurenai", url: "http://truyentuan.com/konya-mo-nemurenai/" }, { label: "Konohanatei Kitan", value: "Konohanatei Kitan", url: "http://truyentuan.com/konohanatei-kitan/" }, { label: "Ngân Chi Thủ Mộ Nhân", value: "Ngân Chi Thủ Mộ Nhân", url: "http://truyentuan.com/ngan-chi-thu-mo-nhan/" }, { label: "Ngưu Lang - Chức Nữ", value: "Ngưu Lang - Chức Nữ", url: "http://truyentuan.com/nguu-lang-chuc-nu/" }, { label: "Ng Life", value: "Ng Life", url: "http://truyentuan.com/ng-life/" }, { label: "New X-Men: Academy X", value: "New X-Men: Academy X", url: "http://truyentuan.com/new-x-men-academy-x/" }, { label: "Koucha Ouji", value: "Koucha Ouji", url: "http://truyentuan.com/koucha-ouji/" }, { label: "Những Cô Bé Bạc Hà", value: "Những Cô Bé Bạc Hà", url: "http://truyentuan.com/nhung-co-be-bac-ha/" }, { label: "Neung Neung", value: "Neung Neung", url: "http://truyentuan.com/neung-neung/" }, { label: "Nejimaki Kagyu", value: "Nejimaki Kagyu", url: "http://truyentuan.com/nejimaki-kagyu/" }, { label: "Necromancer", value: "Necromancer", url: "http://truyentuan.com/necromancer/" }, { label: "Nabi - Cánh Bướm", value: "Nabi - Cánh Bướm", url: "http://truyentuan.com/nabi-canh-buom/" }, { label: "Kouishou Radio", value: "Kouishou Radio", url: "http://truyentuan.com/kouishou-radio/" }, { label: "Kuragehime - Công chúa sứa", value: "Kuragehime - Công chúa sứa", url: "http://truyentuan.com/kuragehime-cong-chua-sua/" }, { label: "Kyokou No Ou", value: "Kyokou No Ou", url: "http://truyentuan.com/kyokou-no-ou/" }, { label: "Kyou no kira kun", value: "Kyou no kira kun", url: "http://truyentuan.com/kyou-no-kira-kun/" }, { label: "Kuroyome", value: "Kuroyome", url: "http://truyentuan.com/kuroyome/" }, { label: "Princess - công chúa xứ hoa p1 - p4", value: "Princess - công chúa xứ hoa p1 - p4", url: "http://truyentuan.com/princess-cong-chua-xu-hoa/" }, { label: "La Linh Ma Lực", value: "La Linh Ma Lực", url: "http://truyentuan.com/la-linh-ma-luc/" }, { label: "La Phù", value: "La Phù", url: "http://truyentuan.com/la-phu/" }, { label: "Làm Thuê", value: "Làm Thuê", url: "http://truyentuan.com/lam-thue/" }, { label: "Làm Vương Gia Không Dễ", value: "Làm Vương Gia Không Dễ", url: "http://truyentuan.com/lam-vuong-gia-khong-de/" }, { label: "Làng quái vật", value: "Làng quái vật", url: "http://truyentuan.com/lang-quai-vat/" }, { label: "Lập Hoa Chánh Nhân", value: "Lập Hoa Chánh Nhân", url: "http://truyentuan.com/lap-hoa-chanh-nhan/" }, { label: "Na Tra", value: "Na Tra", url: "http://truyentuan.com/na-tra/" }, { label: "My Junior Can't Be This Cute", value: "My Junior Can't Be This Cute", url: "http://truyentuan.com/my-junior-cant-be-this-cute/" }, { label: "MUV LUV Unlimited", value: "MUV LUV Unlimited", url: "http://truyentuan.com/muv-luv-unlimited/" }, { label: "Musunde Hiraite", value: "Musunde Hiraite", url: "http://truyentuan.com/musunde-hiraite/" }, { label: "Mushoku Tensei - Isekai Ittara Honki Dasu", value: "Mushoku Tensei - Isekai Ittara Honki Dasu", url: "http://truyentuan.com/mushoku-tensei-isekai-ittara-honki-dasu/" }, { label: "Musashi No9", value: "Musashi No9", url: "http://truyentuan.com/musashi-no9/" }, { label: "Last man", value: "Last man", url: "http://truyentuan.com/last-man/" }, { label: "Legend Hustle", value: "Legend Hustle", url: "http://truyentuan.com/legend-hustle/" }, { label: "Leo Murder Case", value: "Leo Murder Case", url: "http://truyentuan.com/leo-murder-case/" }, { label: "Lets Fight Ghost", value: "Lets Fight Ghost", url: "http://truyentuan.com/lets-fight-ghost/" }, { label: "Level 1 Zuikaku", value: "Level 1 Zuikaku", url: "http://truyentuan.com/level-1-zuikaku/" }, { label: "Chú Bé Quyền Năng", value: "Chú Bé Quyền Năng", url: "http://truyentuan.com/chu-be-quyen-nang/" }, { label: "Level E", value: "Level E", url: "http://truyentuan.com/level-e/" }, { label: "Lian Ai Makeup", value: "Lian Ai Makeup", url: "http://truyentuan.com/lian-ai-makeup/" }, { label: "Liberty Liberty", value: "Liberty Liberty", url: "http://truyentuan.com/liberty-liberty/" }, { label: "Liên Vận Trai", value: "Liên Vận Trai", url: "http://truyentuan.com/lien-van-trai/" }, { label: "Liệp Chiến", value: "Liệp Chiến", url: "http://truyentuan.com/liep-chien/" }, { label: "Liệp Sát Vương Tọa", value: "Liệp Sát Vương Tọa", url: "http://truyentuan.com/liep-sat-vuong-toa/" }, { label: "BugCat-Capoo", value: "BugCat-Capoo", url: "http://truyentuan.com/bugcat-capoo/" }, { label: "Ran to haiiro no sekai", value: "Ran to haiiro no sekai", url: "http://truyentuan.com/ran-to-haiiro-no-sekai/" }, { label: "Mushi to Medama to Teddy Bear", value: "Mushi to Medama to Teddy Bear", url: "http://truyentuan.com/mushi-to-medama-to-teddy-bear/" }, { label: "Ten Prism", value: "Ten Prism", url: "http://truyentuan.com/ten-prism/" }, { label: "Moriguchi orito no Teiougaku", value: "Moriguchi orito no Teiougaku", url: "http://truyentuan.com/moriguchi-orito-no-teiougaku/" }, { label: "Monster Collection", value: "Monster Collection", url: "http://truyentuan.com/monster-collection/" }, { label: "Momoyama Kyo–dai", value: "Momoyama Kyo–dai", url: "http://truyentuan.com/momoyama-kyo-dai/" }, { label: "Mondaiji-tachi ga Isekai kara Kuru sou desu yo? Z", value: "Mondaiji-tachi ga Isekai kara Kuru sou desu yo? Z", url: "http://truyentuan.com/mondaiji-tachi-ga-isekai-kara-kuru-sou-desu-yo-z/" }, { label: "Momoiro Heaven", value: "Momoiro Heaven", url: "http://truyentuan.com/momoiro-heaven/" }, { label: "Lights Out", value: "Lights Out", url: "http://truyentuan.com/lights-out/" }, { label: "Lingerie - Cửa hàng Trang phục lót", value: "Lingerie - Cửa hàng Trang phục lót", url: "http://truyentuan.com/lingerie-cua-hang-trang-phuc-lot/" }, { label: "Like Doodling", value: "Like Doodling", url: "http://truyentuan.com/like-doodling/" }, { label: "Liệp Vật Giả - Thợ Săn", value: "Liệp Vật Giả - Thợ Săn", url: "http://truyentuan.com/liep-vat-gia-tho-san/" }, { label: "Lime Odyssey: The Chronicles of ORTA", value: "Lime Odyssey: The Chronicles of ORTA", url: "http://truyentuan.com/lime-odyssey-the-chronicles-of-orta/" }, { label: "One Outs", value: "One Outs", url: "http://truyentuan.com/one-outs/" }, { label: "Chính Nghĩa Hào Hùng", value: "Chính Nghĩa Hào Hùng", url: "http://truyentuan.com/chinh-nghia-hao-hung/" }, { label: "Mankichi - Đại Tướng Nhóc Con", value: "Mankichi - Đại Tướng Nhóc Con", url: "http://truyentuan.com/mankichi-dai-tuong-nhoc-con/" }, { label: "Mami Cô Bé Siêu Phàm", value: "Mami Cô Bé Siêu Phàm", url: "http://truyentuan.com/mami-co-be-sieu-pham/" }, { label: "Majo no shinzou", value: "Majo no shinzou", url: "http://truyentuan.com/majo-no-shinzou/" }, { label: "Shiro no Koukoku Monogatari", value: "Shiro no Koukoku Monogatari", url: "http://truyentuan.com/shiro-no-koukoku-monogatari/" }, { label: "Phượng Nghịch Thiên Hạ", value: "Phượng Nghịch Thiên Hạ", url: "http://truyentuan.com/phuong-nghich-thi/" }, { label: "Miunohri to Swan -Cô Nàng Xinh Đẹp", value: "Miunohri to Swan -Cô Nàng Xinh Đẹp", url: "http://truyentuan.com/miunohri-to-swan-co-nang-xinh-dep/" }, { label: "Toaru Ossan no VRMMO Katsudouki", value: "Toaru Ossan no VRMMO Katsudouki", url: "http://truyentuan.com/toaru-ossan-no-vrmmo-katsudouki/" }, { label: "Linh Khế Sư", value: "Linh Khế Sư", url: "http://truyentuan.com/linh-khe-su/" }, { label: "Liselotte Và Khu Rừng Phù Thủy", value: "Liselotte Và Khu Rừng Phù Thủy", url: "http://truyentuan.com/liselotte-va-khu-rung-phu-thuy/" }, { label: "Little Jumper", value: "Little Jumper", url: "http://truyentuan.com/little-jumper/" }, { label: "Lives", value: "Lives", url: "http://truyentuan.com/lives/" }, { label: "Lọ lem tinh nghịch", value: "Lọ lem tinh nghịch", url: "http://truyentuan.com/lo-lem-tinh-nghich/" }, { label: "Minto Na Bokura", value: "Minto Na Bokura", url: "http://truyentuan.com/minto-na-bokura/" }, { label: "Mimi Kỳ Lạ", value: "Mimi Kỳ Lạ", url: "http://truyentuan.com/mimi-ky-la/" }, { label: "Miman Renai", value: "Miman Renai", url: "http://truyentuan.com/miman-renai/" }, { label: "Miiko Desu - Cô Bé Nhí Nhảnh", value: "Miiko Desu - Cô Bé Nhí Nhảnh", url: "http://truyentuan.com/miiko-desu-co-be-nhi-nhanh/" }, { label: "Mieru Hito", value: "Mieru Hito", url: "http://truyentuan.com/mieru-hito/" }, { label: "Truyện Boku wa Ookami", value: "Truyện Boku wa Ookami", url: "http://truyentuan.com/truyen-boku-wa-ookami/" }, { label: "Princess – công chúa xứ hoa p5", value: "Princess – công chúa xứ hoa p5", url: "http://truyentuan.com/princess-cong-chua-xu-hoa-p5/" }, { label: "Lonesome Eden", value: "Lonesome Eden", url: "http://truyentuan.com/lonesome-eden/" }, { label: "Long Hổ Phong Bạo", value: "Long Hổ Phong Bạo", url: "http://truyentuan.com/long-ho-phong-bao/" }, { label: "Long Phượng Trình Tường", value: "Long Phượng Trình Tường", url: "http://truyentuan.com/long-phuong-trinh-tuong/" }, { label: "Long Tử Giá Lâm", value: "Long Tử Giá Lâm", url: "http://truyentuan.com/long-tu-gia-lam/" }, { label: "Long Xà Diễn Nghĩa", value: "Long Xà Diễn Nghĩa", url: "http://truyentuan.com/long-xa-dien-nghia/" }, { label: "Mielino Kashiwagi", value: "Mielino Kashiwagi", url: "http://truyentuan.com/mielino-kashiwagi/" }, { label: "Michiru Heya", value: "Michiru Heya", url: "http://truyentuan.com/michiru-heya/" }, { label: "Melo Holic", value: "Melo Holic", url: "http://truyentuan.com/melo-holic/" }, { label: "Tonari no Koigataki", value: "Tonari no Koigataki", url: "http://truyentuan.com/tonari-no-koigataki/" }, { label: "Megaman NT warrior", value: "Megaman NT warrior", url: "http://truyentuan.com/megaman-nt-warrior/" }, { label: "Keyman: The Hand Of Judgement", value: "Keyman: The Hand Of Judgement", url: "http://truyentuan.com/keyman-the-hand-of-judgement/" }, { label: "LOOKING FOR CLOTHO", value: "LOOKING FOR CLOTHO", url: "http://truyentuan.com/looking-for-clotho/" }, { label: "Lost Seven", value: "Lost Seven", url: "http://truyentuan.com/lost-seven/" }, { label: "Love Like Crazy", value: "Love Like Crazy", url: "http://truyentuan.com/love-like-crazy/" }, { label: "Love Roma", value: "Love Roma", url: "http://truyentuan.com/love-roma/" }, { label: "Love Sick", value: "Love Sick", url: "http://truyentuan.com/love-sick/" }, { label: "Kuso Manga Bukuro", value: "Kuso Manga Bukuro", url: "http://truyentuan.com/kuso-manga-bukuro/" }, { label: "Vua Bóng Ném", value: "Vua Bóng Ném", url: "http://truyentuan.com/vua-bong-nem/" }, { label: "Mayo Chiki", value: "Mayo Chiki", url: "http://truyentuan.com/mayo-chiki/" }, { label: "Mayonaka no Ariadone", value: "Mayonaka no Ariadone", url: "http://truyentuan.com/mayonaka-no-ariadone/" }, { label: "Masamune-kun no Revenge", value: "Masamune-kun no Revenge", url: "http://truyentuan.com/masamune-kun-no-revenge/" }, { label: "Dragon Ball Super", value: "Dragon Ball Super", url: "http://truyentuan.com/dragon-ball-super/" }, { label: "Evergreen", value: "Evergreen", url: "http://truyentuan.com/evergreen/" }, { label: "Mahouka Koukou no Rettousei - Nyuugaku hen", value: "Mahouka Koukou no Rettousei - Nyuugaku hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-nyuugaku-hen/" }, { label: "Mahou Shoujo Lyrical Nanoha Vivid", value: "Mahou Shoujo Lyrical Nanoha Vivid", url: "http://truyentuan.com/mahou-shoujo-lyrical-nanoha-vivid/" }, { label: "Love Stage!!", value: "Love Stage!!", url: "http://truyentuan.com/love-stage/" }, { label: "Loveplus Rinko Days", value: "Loveplus Rinko Days", url: "http://truyentuan.com/loveplus-rinko-days/" }, { label: "Lover Doll", value: "Lover Doll", url: "http://truyentuan.com/lover-doll/" }, { label: "Lucid Dream", value: "Lucid Dream", url: "http://truyentuan.com/lucid-dream/" }, { label: "Lucky Dog 1 Blast", value: "Lucky Dog 1 Blast", url: "http://truyentuan.com/lucky-dog-1-blast/" }, { label: "Sengoku Youko", value: "Sengoku Youko", url: "http://truyentuan.com/sengoku-youko/" }, { label: "Lucu Lucu", value: "Lucu Lucu", url: "http://truyentuan.com/lucu-lucu/" }, { label: "Ma Tạp Tiên Tung", value: "Ma Tạp Tiên Tung", url: "http://truyentuan.com/ma-tap-tien-tung/" }, { label: "Ma Thổi Đèn", value: "Ma Thổi Đèn", url: "http://truyentuan.com/ma-thoi-den/" }, { label: "Ma Vương Quản Gia", value: "Ma Vương Quản Gia", url: "http://truyentuan.com/ma-vuong-quan-gia/" }, { label: "Magudala de Nemure", value: "Magudala de Nemure", url: "http://truyentuan.com/magudala-de-nemure/" }, { label: "Câu lạc bộ ngôi sao", value: "Câu lạc bộ ngôi sao", url: "http://truyentuan.com/cau-lac-bo-ngoi-sao/" }, { label: "Shina Dark", value: "Shina Dark", url: "http://truyentuan.com/shina-dark/" }, { label: "Henshin Ganbo", value: "Henshin Ganbo", url: "http://truyentuan.com/henshin-ganbo/" }, { label: "Maga-Tsuki", value: "Maga-Tsuki", url: "http://truyentuan.com/maga-tsuki/" }, { label: "Lock On!(Shutter Eye)", value: "Lock On!(Shutter Eye)", url: "http://truyentuan.com/lock-on-shutter-eye/" }, { label: "Gaussian Blur", value: "Gaussian Blur", url: "http://truyentuan.com/gaussian-blur/" }, { label: "Werewolf Breeding", value: "Werewolf Breeding", url: "http://truyentuan.com/werewolf-breeding/" }, { label: "Blind Faith Descent", value: "Blind Faith Descent", url: "http://truyentuan.com/blind-faith-descent/" }, { label: "Roppongi Black Cross", value: "Roppongi Black Cross", url: "http://truyentuan.com/roppongi-black-cross/" }, { label: "Mahoraba", value: "Mahoraba", url: "http://truyentuan.com/mahoraba/" }, { label: "Du Thế Vô Song", value: "Du Thế Vô Song", url: "http://truyentuan.com/du-the-vo-song/" }, { label: "Salty Studio", value: "Salty Studio", url: "http://truyentuan.com/salty-studio/" }, { label: "Puchi Collection!", value: "Puchi Collection!", url: "http://truyentuan.com/puchi-collection/" }, { label: "Zoushoku Shoujo Plana-chan!", value: "Zoushoku Shoujo Plana-chan!", url: "http://truyentuan.com/zoushoku-shoujo-plana-chan/" }, { label: "Looking For A Father", value: "Looking For A Father", url: "http://truyentuan.com/looking-for-a-father/" }, { label: "Yoroshiku Master", value: "Yoroshiku Master", url: "http://truyentuan.com/yoroshiku-master/" }, { label: "Lộc Đỉnh Kí", value: "Lộc Đỉnh Kí", url: "http://truyentuan.com/loc-dinh-ki/" }, { label: "Đại viên thần", value: "Đại viên thần", url: "http://truyentuan.com/dai-vien-than/" }, { label: "Taiyou no Ie", value: "Taiyou no Ie", url: "http://truyentuan.com/taiyou-no-ie/" }, { label: "Huyết Ma Nhân", value: "Huyết Ma Nhân", url: "http://truyentuan.com/huyet-ma-nhan/" }, { label: "Yandere Kanojo", value: "Yandere Kanojo", url: "http://truyentuan.com/yandere-kanojo/" }, { label: "Girls Saurus Deluxe", value: "Girls Saurus Deluxe", url: "http://truyentuan.com/girls-saurus-deluxe/" }, { label: "Amari Mawari", value: "Amari Mawari", url: "http://truyentuan.com/amari-mawari/" }, { label: "Dear", value: "Dear", url: "http://truyentuan.com/dear/" }, { label: "Fluttering Feelings", value: "Fluttering Feelings", url: "http://truyentuan.com/fluttering-feelings/" }, { label: "Kedamono Kareshi", value: "Kedamono Kareshi", url: "http://truyentuan.com/kedamono-kareshi/" }, { label: "Fate/Kaleid Liner Prisma Illya Drei! [Jikan FS]", value: "Fate/Kaleid Liner Prisma Illya Drei! [Jikan FS]", url: "http://truyentuan.com/fatekaleid-liner-prisma-illya-drei-jikan-fs/" }, { label: "Hideout", value: "Hideout", url: "http://truyentuan.com/hideout/" }, { label: "Amahara-kun", value: "Amahara-kun", url: "http://truyentuan.com/amahara-kun/" }, { label: "Togari Shiro", value: "Togari Shiro", url: "http://truyentuan.com/togari-shiro/" }, { label: "WORLD CUSTOMIZE CREATOR", value: "WORLD CUSTOMIZE CREATOR", url: "http://truyentuan.com/world-customize-creator/" }, { label: "To Aru Majutsu no Kinsho Mokuroku - Endymion no Kiseki", value: "To Aru Majutsu no Kinsho Mokuroku - Endymion no Kiseki", url: "http://truyentuan.com/to-aru-majutsu-no-kinsho-mokuroku-endymion-no-kiseki/" }, { label: "Nisekoi Doumei", value: "Nisekoi Doumei", url: "http://truyentuan.com/nisekoi-doumei/" }, { label: "Blue Friend season 1", value: "Blue Friend season 1", url: "http://truyentuan.com/blue-friend-season-1/" }, { label: "Tuần Tra Viên Ngân Hà JACO", value: "Tuần Tra Viên Ngân Hà JACO", url: "http://truyentuan.com/tuan-tra-vien-ngan-ha-jaco/" }, { label: "Overlord", value: "Overlord", url: "http://truyentuan.com/overlord/" }, { label: "American Ghost Jack", value: "American Ghost Jack", url: "http://truyentuan.com/american-ghost-jack/" }, { label: "Crimson Skies", value: "Crimson Skies", url: "http://truyentuan.com/crimson-skies/" }, { label: "Saiyaku wa Boku o Suki Sugiru", value: "Saiyaku wa Boku o Suki Sugiru", url: "http://truyentuan.com/saiyaku-wa-boku-o-suki-sugiru/" }, { label: "Hitoribocchi wa Samishikute", value: "Hitoribocchi wa Samishikute", url: "http://truyentuan.com/hitoribocchi-wa-samishikute/" }, { label: "Skill of Lure - nghệ Thuật Quyến Rũ", value: "Skill of Lure - nghệ Thuật Quyến Rũ", url: "http://truyentuan.com/skill-of-lure-nghe-thuat-quyen-ru/" }, { label: "Junkie Fiction", value: "Junkie Fiction", url: "http://truyentuan.com/junkie-fiction/" }, { label: "Bắt Cóc Hoàng Đế Về Hiện Đại", value: "Bắt Cóc Hoàng Đế Về Hiện Đại", url: "http://truyentuan.com/bat-coc-hoang-de-ve-hien-dai/" }, { label: "Kyoudai hodo Chikaku Tooimono wa Nai", value: "Kyoudai hodo Chikaku Tooimono wa Nai", url: "http://truyentuan.com/kyoudai-hodo-chikaku-tooimono-wa-nai/" }, { label: "Sơn Thần Và Tiểu Táo", value: "Sơn Thần Và Tiểu Táo", url: "http://truyentuan.com/son-than-va-tieu-tao/" }, { label: "Thuần Tình Nha Đầu Hoả Lạt Lạt", value: "Thuần Tình Nha Đầu Hoả Lạt Lạt", url: "http://truyentuan.com/thuan-tinh-nha-dau-hoa-lat-lat/" }, { label: "Saint Seiya - Áo Giáp Vàng", value: "Saint Seiya - Áo Giáp Vàng", url: "http://truyentuan.com/saint-seiya-ao-giap-vang/" }, { label: "17 YEARS OLD, THAT SUMMER DAY’S MIRACLE", value: "17 YEARS OLD, THAT SUMMER DAY’S MIRACLE", url: "http://truyentuan.com/17-years-old-that-summer-days-miracle/" }, { label: "Vua Sáng Chế (bản đẹp)", value: "Vua Sáng Chế (bản đẹp)", url: "http://truyentuan.com/vua-sang-che-ban-dep/" }, { label: "Khanh Hữu Độc Chung", value: "Khanh Hữu Độc Chung", url: "http://truyentuan.com/khanh-huu-doc-chung/" }, { label: "Kako To Nise Tantei", value: "Kako To Nise Tantei", url: "http://truyentuan.com/kako-to-nise-tantei/" }, { label: "Kuroko No Basket Extra Game", value: "Kuroko No Basket Extra Game", url: "http://truyentuan.com/kuroko-no-basket-extra-game/" }, { label: "Rai - Võ Tướng Thiên Hạ", value: "Rai - Võ Tướng Thiên Hạ", url: "http://truyentuan.com/rai-vo-tuong-thien-ha/" }, { label: "Pochi Kuro", value: "Pochi Kuro", url: "http://truyentuan.com/pochi-kuro/" }, { label: "Love Live! - School Idol Project", value: "Love Live! - School Idol Project", url: "http://truyentuan.com/love-live-school-idol-project/" }, { label: "Zettai Heiwa Daisakusen", value: "Zettai Heiwa Daisakusen", url: "http://truyentuan.com/zettai-heiwa-daisakusen/" }, { label: "ZodiacBoys", value: "ZodiacBoys", url: "http://truyentuan.com/zodiacboys/" }, { label: "Zombie Romanticism", value: "Zombie Romanticism", url: "http://truyentuan.com/zombie-romanticism/" }, { label: "Rừng Đông", value: "Rừng Đông", url: "http://truyentuan.com/rung-dong/" }, { label: "Online - The Comic", value: "Online - The Comic", url: "http://truyentuan.com/online-the-comic/" }, { label: "Oiran Girl", value: "Oiran Girl", url: "http://truyentuan.com/oiran-girl/" }, { label: "Citrus (Saburouta)", value: "Citrus (Saburouta)", url: "http://truyentuan.com/citrus-saburouta/" }, { label: "Black Jack", value: "Black Jack", url: "http://truyentuan.com/black-jack/" }, { label: "Tử Vong Hồi", value: "Tử Vong Hồi", url: "http://truyentuan.com/tu-vong-hoi/" }, { label: "Kokou no Hito", value: "Kokou no Hito", url: "http://truyentuan.com/kokou-no-hito/" }, { label: "Koe no Katachi (AG Team)", value: "Koe no Katachi (AG Team)", url: "http://truyentuan.com/koe-no-katachi-ag-team/" }, { label: "4 Cut Hero", value: "4 Cut Hero", url: "http://truyentuan.com/4-cut-hero/" }, { label: "Flight Highschool", value: "Flight Highschool", url: "http://truyentuan.com/flight-highschool/" }, { label: "Rough Bản đẹp", value: "Rough Bản đẹp", url: "http://truyentuan.com/rough-ban-dep/" }, { label: "Dũng Sĩ Hesman", value: "Dũng Sĩ Hesman", url: "http://truyentuan.com/dung-si-hesman/" }, { label: "Nemuri No Fuchi", value: "Nemuri No Fuchi", url: "http://truyentuan.com/nemuri-no-fuchi/" }, { label: "AKB49 - Renai Kinshi Jourei", value: "AKB49 - Renai Kinshi Jourei", url: "http://truyentuan.com/akb49-renai-kinshi-jourei/" }, { label: "Supernatural Investigation Department", value: "Supernatural Investigation Department", url: "http://truyentuan.com/supernatural-investigation-department/" }, { label: "009 Re:Cyborg", value: "009 Re:Cyborg", url: "http://truyentuan.com/009-recyborg/" }, { label: "Hôm Nay Bắt Đầu Làm Nữ Thần", value: "Hôm Nay Bắt Đầu Làm Nữ Thần", url: "http://truyentuan.com/hom-nay-bat-dau-lam-nu-than/" }, { label: "Zombie Knight", value: "Zombie Knight", url: "http://truyentuan.com/zombie-knight/" }, { label: "Tokiwa Kitareri", value: "Tokiwa Kitareri", url: "http://truyentuan.com/tokiwa-kitareri/" }, { label: "Thiên Chi Vương Nữ", value: "Thiên Chi Vương Nữ", url: "http://truyentuan.com/thien-chi-vuong-nu/" }, { label: "81 Diver", value: "81 Diver", url: "http://truyentuan.com/81-diver/" }, { label: "Tomo chan wa Onnanoko", value: "Tomo chan wa Onnanoko", url: "http://truyentuan.com/tomo-chan-wa-onnanoko/" }, { label: "One Week Friends", value: "One Week Friends", url: "http://truyentuan.com/one-week-friends/" }, { label: "Appleseed", value: "Appleseed", url: "http://truyentuan.com/appleseed/" }, { label: "Bastard - Đứa con của quỷ", value: "Bastard - Đứa con của quỷ", url: "http://truyentuan.com/bastard-dua-con-cua-quy/" }, { label: "Saijou no Meii", value: "Saijou no Meii", url: "http://truyentuan.com/saijou-no-meii/" }, { label: "Osananajimi wa Onnanoko ni Naare", value: "Osananajimi wa Onnanoko ni Naare", url: "http://truyentuan.com/osananajimi-wa-onnanoko-ni-naare/" }, { label: "Whamanga", value: "Whamanga", url: "http://truyentuan.com/whamanga/" }, { label: "Sora x Rira - Sorairo no Lila to Okubyou na Boku", value: "Sora x Rira - Sorairo no Lila to Okubyou na Boku", url: "http://truyentuan.com/sora-x-rira-sorairo-no-lila-to-okubyou-na-boku/" }, { label: "Red Storm", value: "Red Storm", url: "http://truyentuan.com/red-storm/" }, { label: "Wild life", value: "Wild life", url: "http://truyentuan.com/wild-life/" }, { label: "Súng Thần Ký", value: "Súng Thần Ký", url: "http://truyentuan.com/sung-than-ky/" }, { label: "KOIZUMI - Cô nàng nghiền Ramen", value: "KOIZUMI - Cô nàng nghiền Ramen", url: "http://truyentuan.com/koizumi-co-nang-nghien-ramen/" }, { label: "Kyoushashou", value: "Kyoushashou", url: "http://truyentuan.com/kyoushashou-3/" }, { label: "Cooking Papa", value: "Cooking Papa", url: "http://truyentuan.com/cooking-papa/" }, { label: "Fairy Tail Sabertooth", value: "Fairy Tail Sabertooth", url: "http://truyentuan.com/fairy-tail-sabertooth/" }, { label: "Tsujiura-san to Chupacabra", value: "Tsujiura-san to Chupacabra", url: "http://truyentuan.com/tsujiura-san-to-chupacabra/" }, { label: "Tenkamusou Edajima Heihachi Den", value: "Tenkamusou Edajima Heihachi Den", url: "http://truyentuan.com/tenkamusou-edajima-heihachi-den/" }, { label: "Usagi Drop", value: "Usagi Drop", url: "http://truyentuan.com/usagi-drop/" }, { label: "Tensei Shitara Slime Datta Ken", value: "Tensei Shitara Slime Datta Ken", url: "http://truyentuan.com/tensei-shitara-slime-datta-ken/" }, { label: "Mayoe! Nanatsu no Taizai Gakuen!", value: "Mayoe! Nanatsu no Taizai Gakuen!", url: "http://truyentuan.com/mayoe-nanatsu-no-taizai-gakuen/" }, { label: "Assassin's Creed 4 - Black Flag - Kakusei", value: "Assassin's Creed 4 - Black Flag - Kakusei", url: "http://truyentuan.com/assassins-creed-4-black-flag-kakusei/" }, { label: "Zero - Kage Miko", value: "Zero - Kage Miko", url: "http://truyentuan.com/zero-kage-miko/" }, { label: "Yêu Thần Ký", value: "Yêu Thần Ký", url: "http://truyentuan.com/yeu-than-ky/" }, { label: "Chuyện Của Họ", value: "Chuyện Của Họ", url: "http://truyentuan.com/chuyen-cua-ho/" }, { label: "SWAN - VŨ KHÚC THIÊN NGA", value: "SWAN - VŨ KHÚC THIÊN NGA", url: "http://truyentuan.com/swan-vu-khuc-thien-nga/" }, { label: "Shonan Seven", value: "Shonan Seven", url: "http://truyentuan.com/shonan-seven/" }, { label: "Jitsu wa Watashi wa", value: "Jitsu wa Watashi wa", url: "http://truyentuan.com/jitsu-wa-watashi-wa/" }, { label: "Chronos Ruler", value: "Chronos Ruler", url: "http://truyentuan.com/chronos-ruler/" }, { label: "Độ Linh", value: "Độ Linh", url: "http://truyentuan.com/do-linh/" }, { label: "Dare mo Shiranai Tou no Aru machi", value: "Dare mo Shiranai Tou no Aru machi", url: "http://truyentuan.com/dare-mo-shiranai-tou-no-aru-machi/" }, { label: "Saint Legend - Bát Tiên Đạo", value: "Saint Legend - Bát Tiên Đạo", url: "http://truyentuan.com/saint-legend-bat-tien-dao/" }, { label: "The New Gate", value: "The New Gate", url: "http://truyentuan.com/the-new-gate/" }, { label: "INO-HEAD GARGOYLE", value: "INO-HEAD GARGOYLE", url: "http://truyentuan.com/ino-head-gargoyle/" }, { label: "RPG", value: "RPG", url: "http://truyentuan.com/rpg/" }, { label: "Tail Star", value: "Tail Star", url: "http://truyentuan.com/tail-star/" }, { label: "Sousoukyoku Nightmare", value: "Sousoukyoku Nightmare", url: "http://truyentuan.com/sousoukyoku-nightmare/" }, { label: "THỤC SƠN KIẾM HIỆP TRUYỆN", value: "THỤC SƠN KIẾM HIỆP TRUYỆN", url: "http://truyentuan.com/thuc-son-kiem-hiep-truyen/" }, { label: "Hắn Đến Từ Sao Hỏa", value: "Hắn Đến Từ Sao Hỏa", url: "http://truyentuan.com/han-den-tu-sao-hoa/" }, { label: "Bựa du kí", value: "Bựa du kí", url: "http://truyentuan.com/bua-du-ki/" }, { label: "ONE PIECE (MTO)", value: "ONE PIECE (MTO)", url: "http://truyentuan.com/one-piece-mto/" }, { label: "THẦN CHƯỞNG", value: "THẦN CHƯỞNG", url: "http://truyentuan.com/than-chuong/" }, { label: "Futaba-kun Change", value: "Futaba-kun Change", url: "http://truyentuan.com/futaba-kun-change/" }, { label: "Watashi no Messiah-sama", value: "Watashi no Messiah-sama", url: "http://truyentuan.com/watashi-no-messiah-sama/" }, { label: "Kingdom", value: "Kingdom", url: "http://truyentuan.com/kingdom/" }, { label: "UNITY OF HEAVEN", value: "UNITY OF HEAVEN", url: "http://truyentuan.com/unity-of-heaven/" }, { label: "Charlotte", value: "Charlotte", url: "http://truyentuan.com/charlotte/" }, { label: "Holy Alice", value: "Holy Alice", url: "http://truyentuan.com/holy-alice/" }, { label: "Loạn Nhập", value: "Loạn Nhập", url: "http://truyentuan.com/loan-nhap/" }, { label: "AkAKATSUKI!! OTOKOJUKU - SEINEN YO, TAISHI WO IDAKE", value: "AkAKATSUKI!! OTOKOJUKU - SEINEN YO, TAISHI WO IDAKE", url: "http://truyentuan.com/akakatsuki-otokojuku-seinen-yo-taishi-wo-idake/" }, { label: "Bakudan", value: "Bakudan", url: "http://truyentuan.com/bakudan/" }, { label: "Kamisama, Kisama wo Koroshitai", value: "Kamisama, Kisama wo Koroshitai", url: "http://truyentuan.com/kamisama-kisama-wo-koroshitai/" }, { label: "NINKU SECOND STAGE - ETO NINHEN", value: "NINKU SECOND STAGE - ETO NINHEN", url: "http://truyentuan.com/ninku-second-stage-eto-ninhen/" }, { label: "Shimoneta toiu Gainen ga Sonzaishinai Taikutsu na Sekai", value: "Shimoneta toiu Gainen ga Sonzaishinai Taikutsu na Sekai", url: "http://truyentuan.com/shimoneta-toiu-gainen-ga-sonzaishinai-taikutsu-na-sekai/" }, { label: "Beyblade", value: "Beyblade", url: "http://truyentuan.com/beyblade/" }, { label: "Song Sinh Linh Thám", value: "Song Sinh Linh Thám", url: "http://truyentuan.com/song-sinh-linh-tham/" }, { label: "Green Boy", value: "Green Boy", url: "http://truyentuan.com/green-boy/" }, { label: "Usogui", value: "Usogui", url: "http://truyentuan.com/usogui/" }, { label: "Sakigake!! Otokojuku", value: "Sakigake!! Otokojuku", url: "http://truyentuan.com/sakigake-otokojuku/" }, { label: "Kantai Collection -The Things She Saw", value: "Kantai Collection -The Things She Saw", url: "http://truyentuan.com/kantai-collection-the-things-she-saw-2/" }, { label: "Yami no Aegis", value: "Yami no Aegis", url: "http://truyentuan.com/yami-no-aegis/" }, { label: "Full Metal Panic! Sigma", value: "Full Metal Panic! Sigma", url: "http://truyentuan.com/full-metal-panic-sigma/" }, { label: "BAKUMAN. - age 13", value: "BAKUMAN. - age 13", url: "http://truyentuan.com/bakuman-age-13/" }, { label: "Hồ Sơ Xã Hội Đen", value: "Hồ Sơ Xã Hội Đen", url: "http://truyentuan.com/ho-so-xa-hoi-den/" }, { label: "Daydream Nightmare", value: "Daydream Nightmare", url: "http://truyentuan.com/daydream-nightmare/" }, { label: "Totsugami", value: "Totsugami", url: "http://truyentuan.com/totsugami/" }, { label: "Frag Time", value: "Frag Time", url: "http://truyentuan.com/frag-time/" }, { label: "Platinum End", value: "Platinum End", url: "http://truyentuan.com/platinum-end/" }, { label: "Ác quỷ và bản tình ca", value: "Ác quỷ và bản tình ca", url: "http://truyentuan.com/ac-quy-va-ban-tinh-ca/" }, { label: "Boku to Senpai no Tekken Kousai", value: "Boku to Senpai no Tekken Kousai", url: "http://truyentuan.com/boku-to-senpai-no-tekken-kousai/" }, { label: "Kid Gang - Nhóc Siêu Quậy", value: "Kid Gang - Nhóc Siêu Quậy", url: "http://truyentuan.com/kid-gang-nhoc-sieu-quay/" }, { label: "Hellper - Đào Ngục Đồ", value: "Hellper - Đào Ngục Đồ", url: "http://truyentuan.com/hellper-dao-nguc-do/" }, { label: "Konjiki no Moji Tsukai", value: "Konjiki no Moji Tsukai", url: "http://truyentuan.com/konjiki-no-moji-tsukai/" }, { label: "Tây Du", value: "Tây Du", url: "http://truyentuan.com/tay-du/" }, { label: "Thần Bút Họa Sư", value: "Thần Bút Họa Sư", url: "http://truyentuan.com/than-b/" }, { label: "Komori-san wa Kotowarenai", value: "Komori-san wa Kotowarenai", url: "http://truyentuan.com/komori-san-wa-kotowarenai/" }, { label: "Nghịch Hành Thiên Hậu", value: "Nghịch Hành Thiên Hậu", url: "http://truyentuan.com/nghich-hanh-thien-hau/" }, { label: "Mouryou no Yurikago", value: "Mouryou no Yurikago", url: "http://truyentuan.com/mouryou-no-yurikago/" }, { label: "Torikago no Tsugai", value: "Torikago no Tsugai", url: "http://truyentuan.com/torikago-no-tsugai/" }, { label: "Kyou kara Hitman", value: "Kyou kara Hitman", url: "http://truyentuan.com/kyou-kara-hitman/" }, { label: "Dragon Ball After", value: "Dragon Ball After", url: "http://truyentuan.com/dragon-ball-after/" }, { label: "Aoki Umi no Torawarehime", value: "Aoki Umi no Torawarehime", url: "http://truyentuan.com/aoki-umi-no-torawarehime/" }, { label: "Domestic na Kanojo", value: "Domestic na Kanojo", url: "http://truyentuan.com/domestic-na-kanojo/" }, { label: "Fukushuu Kyoushitsu", value: "Fukushuu Kyoushitsu", url: "http://truyentuan.com/fukushuu-kyoushitsu/" }, { label: "B-SHOCK", value: "B-SHOCK", url: "http://truyentuan.com/b-shock/" }, { label: "Shishang Zui Qiang Jiazu", value: "Shishang Zui Qiang Jiazu", url: "http://truyentuan.com/shishang-zui-qiang-jiazu/" }, { label: "WOLFSMUND", value: "WOLFSMUND", url: "http://truyentuan.com/wolfsmund/" }, { label: "Fudatsuki no Kyoko-chan", value: "Fudatsuki no Kyoko-chan", url: "http://truyentuan.com/fudatsuki-no-kyoko-chan/" }, { label: "Death Note (Color)", value: "Death Note (Color)", url: "http://truyentuan.com/death-note-color/" }, { label: "Ashita no Yoichi", value: "Ashita no Yoichi", url: "http://truyentuan.com/ashita-no-yoichi/" }, { label: "The Devil's Bag", value: "The Devil's Bag", url: "http://truyentuan.com/the-devils-bag/" }, { label: "Happiness", value: "Happiness", url: "http://truyentuan.com/happiness/" }, { label: "Ueki", value: "Ueki", url: "http://truyentuan.com/ueki/" }, { label: "Thần Giới Truyền Thuyết", value: "Thần Giới Truyền Thuyết", url: "http://truyentuan.com/than-gioi-truyen-thuyet/" }, { label: "Amaenaideyo MS", value: "Amaenaideyo MS", url: "http://truyentuan.com/amaenaideyo-ms/" }, { label: "Unbalance Triangle", value: "Unbalance Triangle", url: "http://truyentuan.com/unbalance-triangle/" }, { label: "Arakawa Under The Bridge", value: "Arakawa Under The Bridge", url: "http://truyentuan.com/arakawa-under-the-bridge/" }, { label: "Biohazard - Heavenly Island", value: "Biohazard - Heavenly Island", url: "http://truyentuan.com/biohazard-heavenly-island/" }, { label: "ARK:Romancer", value: "ARK:Romancer", url: "http://truyentuan.com/arkromancer/" }, { label: "Vân Trung Ca", value: "Vân Trung Ca", url: "http://truyentuan.com/van-trung-ca/" }, { label: "umishou", value: "umishou", url: "http://truyentuan.com/umishou/" }, { label: "Lọ Lem Kén Rể", value: "Lọ Lem Kén Rể", url: "http://truyentuan.com/lo-lem-ken-re/" }, { label: "Dusk Howler", value: "Dusk Howler", url: "http://truyentuan.com/dusk-howler/" }, { label: "Tiên Liên Kiếp", value: "Tiên Liên Kiếp", url: "http://truyentuan.com/tien-lien-kiep/" }, { label: "Bách Luyện Thành Thần", value: "Bách Luyện Thành Thần", url: "http://truyentuan.com/bach-luyen-thanh-than/" }, { label: "Peach Pluck", value: "Peach Pluck", url: "http://truyentuan.com/peach-pluck/" }, { label: "Sekai Maou", value: "Sekai Maou", url: "http://truyentuan.com/sekai-maou/" }, { label: "Trả Thù Trường Trung Học", value: "Trả Thù Trường Trung Học", url: "http://truyentuan.com/tra-thu-truong-trung-hoc/" }, { label: "Sơn Hải Thú", value: "Sơn Hải Thú", url: "http://truyentuan.com/son-hai-thu/" }, { label: "Rotte no Omocha", value: "Rotte no Omocha", url: "http://truyentuan.com/rotte-no-omocha/" }, { label: "Yokohama Kaidashi Kikou", value: "Yokohama Kaidashi Kikou", url: "http://truyentuan.com/yokohama-kaidashi-kikou/" }, { label: "Deadpool", value: "Deadpool", url: "http://truyentuan.com/deadpool/" }, { label: "Spirit Migration", value: "Spirit Migration", url: "http://truyentuan.com/spirit-migration/" }, { label: "Elena", value: "Elena", url: "http://truyentuan.com/elena/" }, { label: "Oh! Lord Jesus", value: "Oh! Lord Jesus", url: "http://truyentuan.com/oh-lord-jesus/" }, { label: "Ứng Dụng Thẩm Mỹ", value: "Ứng Dụng Thẩm Mỹ", url: "http://truyentuan.com/ung-dung-tham-my/" }, { label: "Sủng Phi Của Pharaoh", value: "Sủng Phi Của Pharaoh", url: "http://truyentuan.com/sung-phi-cua-pharaoh/" }, { label: "Baramon no Kazoku", value: "Baramon no Kazoku", url: "http://truyentuan.com/baramon-no-kazoku/" }, { label: "Nhất Thế Chi Tôn", value: "Nhất Thế Chi Tôn", url: "http://truyentuan.com/nhat-the-chi-ton/" }, { label: "Megami no Libra", value: "Megami no Libra", url: "http://truyentuan.com/megami-no-libra/" }, { label: "Onepunch-man (ONE)", value: "Onepunch-man (ONE)", url: "http://truyentuan.com/onepunch-man-one/" }, { label: "Olimpos", value: "Olimpos", url: "http://truyentuan.com/olimpos/" }, { label: "Dungeon Meshi", value: "Dungeon Meshi", url: "http://truyentuan.com/dungeon-meshi/" }, { label: "Gleipnir", value: "Gleipnir", url: "http://truyentuan.com/gleipnir/" }, { label: "Kaitai Shinsho Zero", value: "Kaitai Shinsho Zero", url: "http://truyentuan.com/kaitai-shinsho-zero/" }, { label: "Gosu", value: "Gosu", url: "http://truyentuan.com/gosu/" }, { label: "Psycho Buster", value: "Psycho Buster", url: "http://truyentuan.com/psycho-buster/" }, { label: "I Shoujo", value: "I Shoujo", url: "http://truyentuan.com/i-shoujo/" }, { label: "NHK ni Youkoso!", value: "NHK ni Youkoso!", url: "http://truyentuan.com/nhk-ni-youkoso/" }, { label: "Toumei ningen kyoutei", value: "Toumei ningen kyoutei", url: "http://truyentuan.com/toumei-ningen-kyoutei/" }, { label: "Mirai Nikki", value: "Mirai Nikki", url: "http://truyentuan.com/mirai-nikki/" }, { label: "Instant Bullet", value: "Instant Bullet", url: "http://truyentuan.com/instant-bullet/" }, { label: "Mousou Meets Girl", value: "Mousou Meets Girl", url: "http://truyentuan.com/mousou-meets-girl/" }, { label: "Chronological Marvel Civil War", value: "Chronological Marvel Civil War", url: "http://truyentuan.com/chronological-marvel-civil-war/" }, { label: "Miêu Hựu", value: "Miêu Hựu", url: "http://truyentuan.com/mieu-huu/" }, { label: "Seitokai Yakuindomo", value: "Seitokai Yakuindomo", url: "http://truyentuan.com/seitokai-yakuindomo/" }, { label: "Chichi Kogusa", value: "Chichi Kogusa", url: "http://truyentuan.com/chichi-kogusa/" }, { label: "Thiên Tài Tiên Thuật sư", value: "Thiên Tài Tiên Thuật sư", url: "http://truyentuan.com/thien-tai-tien-thuat-su/" }, { label: "Shiryoku Kensa", value: "Shiryoku Kensa", url: "http://truyentuan.com/shiryoku-kensa/" }, { label: "Sengoku Strays", value: "Sengoku Strays", url: "http://truyentuan.com/sengoku-strays/" }, { label: "ASHIYA-SAN NO NEKO", value: "ASHIYA-SAN NO NEKO", url: "http://truyentuan.com/ashiya-san-no-neko/" }, { label: "Kiss x Death", value: "Kiss x Death", url: "http://truyentuan.com/kiss-x-death/" }, { label: "Hachi Ichi - Tám Nàng Một Chàng", value: "Hachi Ichi - Tám Nàng Một Chàng", url: "http://truyentuan.com/hachi-ichi-tam-nang-mot-chang/" }, { label: "Helck", value: "Helck", url: "http://truyentuan.com/helck/" }, { label: "Thất Nhật Chi Hậu", value: "Thất Nhật Chi Hậu", url: "http://truyentuan.com/that-nhat-chi-hau/" }, { label: "MONSTER NIGHT", value: "MONSTER NIGHT", url: "http://truyentuan.com/monster-night/" }, { label: "Cheese In The Trap", value: "Cheese In The Trap", url: "http://truyentuan.com/cheese-in-the-trap/" }, { label: "Usotsuki Ouji to Nisemono Kanojo", value: "Usotsuki Ouji to Nisemono Kanojo", url: "http://truyentuan.com/usotsuki-ouji-to-nisemono-kanojo/" }, { label: "Kataribe no List", value: "Kataribe no List", url: "http://truyentuan.com/kataribe-no-list/" }, { label: "Prison School (Skyrule)", value: "Prison School (Skyrule)", url: "http://truyentuan.com/prison-school-skyrule/" }, { label: "Mộc Lan Vô Trưởng Huynh", value: "Mộc Lan Vô Trưởng Huynh", url: "http://truyentuan.com/moc-lan-vo-truong-huynh/" }, { label: "Hatsukoi Zombie", value: "Hatsukoi Zombie", url: "http://truyentuan.com/hatsukoi-zombie/" }, { label: "Noblesse: Rai's Adventure", value: "Noblesse: Rai's Adventure", url: "http://truyentuan.com/noblesse-rai-s-adventure/" }, { label: "Pigeonhole Fantasia", value: "Pigeonhole Fantasia", url: "http://truyentuan.com/pigeonhole-fantasia/" }, { label: "13 Club", value: "13 Club", url: "http://truyentuan.com/13-club/" }, { label: "Real Account II", value: "Real Account II", url: "http://truyentuan.com/real-account-ii/" }, { label: "White Epic", value: "White Epic", url: "http://truyentuan.com/white-epic/" }, { label: "Kimi Shi ni Tamafu Koto Nakare", value: "Kimi Shi ni Tamafu Koto Nakare", url: "http://truyentuan.com/kimi-shi-ni-tamafu-koto-nakare/" }, { label: "Okusan", value: "Okusan", url: "http://truyentuan.com/okusan/" }, { label: "Ballroom e Youkoso", value: "Ballroom e Youkoso", url: "http://truyentuan.com/ballroom-e-youkoso/" }, { label: "The Chef - Đầu Bếp Trứ Danh", value: "The Chef - Đầu Bếp Trứ Danh", url: "http://truyentuan.com/the-chef-dau-bep-tru-danh/" }, { label: "Garfield", value: "Garfield", url: "http://truyentuan.com/garfield/" }, { label: "Ác Ma Pháp Tắc", value: "Ác Ma Pháp Tắc", url: "http://truyentuan.com/ac-ma-phap-tac/" }, { label: "Adekan", value: "Adekan", url: "http://truyentuan.com/adekan/" }, { label: "Double Casting", value: "Double Casting", url: "http://truyentuan.com/double-casting/" }, { label: "At Each Others Throats", value: "At Each Others Throats", url: "http://truyentuan.com/at-each-others-throats/" }, { label: "Shikabane Hime", value: "Shikabane Hime", url: "http://truyentuan.com/shikabane-hime/" }, { label: "Doraemon Bóng Chày", value: "Doraemon Bóng Chày", url: "http://truyentuan.com/doraemon-bong-chay/" }, { label: "Kigurumi Boueitai", value: "Kigurumi Boueitai", url: "http://truyentuan.com/kigurumi-boueitai/" }, { label: "Shinryaku! Ika Musume", value: "Shinryaku! Ika Musume", url: "http://truyentuan.com/shinryaku-ika-musume/" }, { label: "Tái Tạo Không Gian", value: "Tái Tạo Không Gian", url: "http://truyentuan.com/tai-tao-khong-gian/" }, { label: "Mob Psycho 100", value: "Mob Psycho 100", url: "http://truyentuan.com/mob-psycho-100/" }, { label: "Witch Workshop", value: "Witch Workshop", url: "http://truyentuan.com/witch-workshop/" }, { label: "Trầm Hương Phá", value: "Trầm Hương Phá", url: "http://truyentuan.com/tram-huong-pha/" }, { label: "Sen to Man", value: "Sen to Man", url: "http://truyentuan.com/sen-to-man/" }, { label: "X-O MANOWAR", value: "X-O MANOWAR", url: "http://truyentuan.com/x-o-manowar/" }, { label: "Doctor Duo", value: "Doctor Duo", url: "http://truyentuan.com/doctor-duo/" }, { label: "An Always-Available Man", value: "An Always-Available Man", url: "http://truyentuan.com/an-always-available-man/" }, { label: "Ichi the Killer", value: "Ichi the Killer", url: "http://truyentuan.com/ichi-the-killer/" }, { label: "Gochuumon wa Usagi Desu ka?", value: "Gochuumon wa Usagi Desu ka?", url: "http://truyentuan.com/gochuumon-wa-usagi-desu-ka/" }, { label: "Thiên Hành Thiết Sự", value: "Thiên Hành Thiết Sự", url: "http://truyentuan.com/thien-hanh-thiet-su/" }, { label: "Tinh Mộng Thần Tượng", value: "Tinh Mộng Thần Tượng", url: "http://truyentuan.com/tinh-mong-than-tuong/" }, { label: "ĐẠI ĐƯỜNG HUYỀN BÚT KÝ", value: "ĐẠI ĐƯỜNG HUYỀN BÚT KÝ", url: "http://truyentuan.com/dai-duong-huyen-but-ky/" }, { label: "Tsubaki-chou Lonely Planet", value: "Tsubaki-chou Lonely Planet", url: "http://truyentuan.com/tsubaki-chou-lonely-planet/" }, { label: "Nagareboshi Lens", value: "Nagareboshi Lens", url: "http://truyentuan.com/nagareboshi-lens/" }, { label: "DRAGON EFFECT", value: "DRAGON EFFECT", url: "http://truyentuan.com/dragon-effect/" }, { label: "Black out", value: "Black out", url: "http://truyentuan.com/black-out/" }, { label: "Busou Shoujo Machiavellianism", value: "Busou Shoujo Machiavellianism", url: "http://truyentuan.com/busou-shoujo-machiavellianism/" }, { label: "Dimension W", value: "Dimension W", url: "http://truyentuan.com/dimension-w/" }, { label: "Space China Dress", value: "Space China Dress", url: "http://truyentuan.com/space-china-dress/" }, { label: "The Devil Who Can't Fly", value: "The Devil Who Can't Fly", url: "http://truyentuan.com/the-devil-who-cant-fly/" }, { label: "Sumika Sumire", value: "Sumika Sumire", url: "http://truyentuan.com/sumika-sumire/" }, { label: "Cromartie High School", value: "Cromartie High School", url: "http://truyentuan.com/cromartie-high-school/" }, { label: "Thuấn Linh", value: "Thuấn Linh", url: "http://truyentuan.com/thuan-linh/" }, { label: "Cực Đạo Hoa Giá", value: "Cực Đạo Hoa Giá", url: "http://truyentuan.com/cuc-dao-hoa-gia/" }, { label: "Gangsta", value: "Gangsta", url: "http://truyentuan.com/gangsta/" }, { label: "Greatest Outcast", value: "Greatest Outcast", url: "http://truyentuan.com/greatest-outcast/" }, { label: "Ajin-Chan Wa Kataritai", value: "Ajin-Chan Wa Kataritai", url: "http://truyentuan.com/ajin-chan-wa-kataritai/" }, { label: "Magical Exam Student", value: "Magical Exam Student", url: "http://truyentuan.com/magical-exam-student/" }, { label: "Thoát Cốt Hương", value: "Thoát Cốt Hương", url: "http://truyentuan.com/thoat-cot-huong/" }, { label: "Sổ Tay Trồng Yêu Tinh", value: "Sổ Tay Trồng Yêu Tinh", url: "http://truyentuan.com/so-tay-trong-yeu-tinh/" }, { label: "Golden Kamui", value: "Golden Kamui", url: "http://truyentuan.com/golden-kamui/" }, { label: "World Destruction", value: "World Destruction", url: "http://truyentuan.com/world-destruction/" }, { label: "Gokuto Jihen", value: "Gokuto Jihen", url: "http://truyentuan.com/gokuto-jihen/" }, { label: "Ngu Nhân Chi Lữ", value: "Ngu Nhân Chi Lữ", url: "http://truyentuan.com/ngu-nhan-chi-lu/" }, { label: "Huyết Sắc Thương Khung", value: "Huyết Sắc Thương Khung", url: "http://truyentuan.com/huyet-sac-thuong-khung/" }, { label: "Oumagadoki Doubutsuen", value: "Oumagadoki Doubutsuen", url: "http://truyentuan.com/oumagadoki-doubutsuen/" }, { label: "Senpai, Sore Hitokuchi Kudasai!", value: "Senpai, Sore Hitokuchi Kudasai!", url: "http://truyentuan.com/senpai-sore-hitokuchi-kudasai/" }, { label: "Tegami bachi", value: "Tegami bachi", url: "http://truyentuan.com/tegami-bachi/" }, { label: "Kare First Love", value: "Kare First Love", url: "http://truyentuan.com/kare-first-love/" }, { label: "Mắt Đỏ", value: "Mắt Đỏ", url: "http://truyentuan.com/mat-do/" }, { label: "Mujang", value: "Mujang", url: "http://truyentuan.com/mujang/" }, { label: "Yuragi-sou no Yuuna-san", value: "Yuragi-sou no Yuuna-san", url: "http://truyentuan.com/yuragi-sou-no-yuuna-san/" }, { label: "Terror Man", value: "Terror Man", url: "http://truyentuan.com/terror-man/" }, { label: "Hard Core Leveling Warrior", value: "Hard Core Leveling Warrior", url: "http://truyentuan.com/hard-core-leveling-warrior/" }, { label: "Yugioh Zexal", value: "Yugioh Zexal", url: "http://truyentuan.com/yugioh-zexal/" }, { label: "Boruto", value: "Boruto", url: "http://truyentuan.com/boruto/" }, { label: "Sword Art Online: Progressive", value: "Sword Art Online: Progressive", url: "http://truyentuan.com/sword-art-online-progressive/" }, { label: "Jesus - Sajin Kouro", value: "Jesus - Sajin Kouro", url: "http://truyentuan.com/jesus-sajin-kouro/" }, { label: "SHADOW CHASERS", value: "SHADOW CHASERS", url: "http://truyentuan.com/shadow-chasers/" }, { label: "Tanaka-kun wa Itsumo Kedaruge", value: "Tanaka-kun wa Itsumo Kedaruge", url: "http://truyentuan.com/tanaka-kun-wa-itsumo-kedaruge/" }, { label: "Đường Dần tại Dị Giới", value: "Đường Dần tại Dị Giới", url: "http://truyentuan.com/duong-dan-tai-di-gioi/" }, { label: "Keijo", value: "Keijo", url: "http://truyentuan.com/keijo/" }, { label: "Shirayuki Panimix!", value: "Shirayuki Panimix!", url: "http://truyentuan.com/shirayuki-panimix/" }, { label: "Liar x Liar", value: "Liar x Liar", url: "http://truyentuan.com/liar-x-liar/" }, { label: "Hoa Quý", value: "Hoa Quý", url: "http://truyentuan.com/hoa-quy/" }, { label: "Yesterday Wo Utatte", value: "Yesterday Wo Utatte", url: "http://truyentuan.com/yesterday-wo-utatte/" }, { label: "Smokin'Parade", value: "Smokin'Parade", url: "http://truyentuan.com/smokin-parade/" }, { label: "Ake no Tobari", value: "Ake no Tobari", url: "http://truyentuan.com/ake-no-tobari/" }, { label: "Thông Linh Phi", value: "Thông Linh Phi", url: "http://truyentuan.com/thong-linh-phi/" }, { label: "Space Time Prison", value: "Space Time Prison", url: "http://truyentuan.com/space-time-prison/" }, { label: "Toàn Chức Cao Thủ", value: "Toàn Chức Cao Thủ", url: "http://truyentuan.com/toan-chuc-cao-thu/" }, { label: ":REverSAL", value: ":REverSAL", url: "http://truyentuan.com/reversal/" }, { label: "Cat is silver vine", value: "Cat is silver vine", url: "http://truyentuan.com/cat-is-silver-vine/" }, { label: "Book Club", value: "Book Club", url: "http://truyentuan.com/book-club/" }, { label: "If I have 1 day to live", value: "If I have 1 day to live", url: "http://truyentuan.com/if-i-have-1-day-to-live/" }, { label: "Harigane Service", value: "Harigane Service", url: "http://truyentuan.com/harigane-service/" }, { label: "Truyện Kinh Dị Ở Tòa Nhà Số 44", value: "Truyện Kinh Dị Ở Tòa Nhà Số 44", url: "http://truyentuan.com/truyen-kinh-di-o-toa-nha-so-44/" }, { label: "Võ lâm manh chủ", value: "Võ lâm manh chủ", url: "http://truyentuan.com/vo-lam-manh-chu/" }, { label: "Kamisama no Inai Nichiyoubi", value: "Kamisama no Inai Nichiyoubi", url: "http://truyentuan.com/kamisama-no-inai-nichiyoubi/" }, { label: "Boogiepop Wa Warawanai", value: "Boogiepop Wa Warawanai", url: "http://truyentuan.com/boogiepop-wa-warawanai/" }, { label: "Avengers VS X-men", value: "Avengers VS X-men", url: "http://truyentuan.com/avengers-vs-x-men/" }, { label: "Isekai Tensei Soudouki", value: "Isekai Tensei Soudouki", url: "http://truyentuan.com/isekai-tensei-soudouki/" }, { label: "Justice League", value: "Justice League", url: "http://truyentuan.com/justice-league/" }, { label: "Shuuen no Shiori", value: "Shuuen no Shiori", url: "http://truyentuan.com/shuuen-no-shiori/" }, { label: "Địa Ngục Thần Y", value: "Địa Ngục Thần Y", url: "http://truyentuan.com/dia-nguc-than-y/" }, { label: "Reincarnation no Kaben", value: "Reincarnation no Kaben", url: "http://truyentuan.com/reincarnation-no-kaben/" }, { label: "Gen Thợ Săn", value: "Gen Thợ Săn", url: "http://truyentuan.com/gen-tho-san/" }, { label: "Koi Inu", value: "Koi Inu", url: "http://truyentuan.com/koi-inu/" }, { label: "Karakuri Circus", value: "Karakuri Circus", url: "http://truyentuan.com/karakuri-circus/" }, { label: "Damned", value: "Damned", url: "http://truyentuan.com/damned/" }, { label: "Tiếu Ngạo Giang Hồ", value: "Tiếu Ngạo Giang Hồ", url: "http://truyentuan.com/tieu-ngao-giang-ho/" }, { label: "Thần Y Đích Nữ", value: "Thần Y Đích Nữ", url: "http://truyentuan.com/than-y-dich-nu/" }, { label: "Dịch Vụ Giao Hàng Âm Dương", value: "Dịch Vụ Giao Hàng Âm Dương", url: "http://truyentuan.com/dich-vu-giao-hang-am-duong/" }, { label: "Ore Monogatari!!", value: "Ore Monogatari!!", url: "http://truyentuan.com/ore-monogatari/" }, { label: "S.L.H (Stray Love Hearts)", value: "S.L.H (Stray Love Hearts)", url: "http://truyentuan.com/slh-stray-love-hearts/" }, { label: "Fourteen", value: "Fourteen", url: "http://truyentuan.com/fourteen/" }, { label: "Những Chuyện Quái Đản", value: "Những Chuyện Quái Đản", url: "http://truyentuan.com/nhung-chuyen-quai-dan/" }, { label: "Táng Hồn Môn", value: "Táng Hồn Môn", url: "http://truyentuan.com/tang-hon-mon/" }, { label: "Tô Sinh Chiến Súng", value: "Tô Sinh Chiến Súng", url: "http://truyentuan.com/to-sinh-chien-sung/" }, { label: "Thiên Sứ Của tôi", value: "Thiên Sứ Của tôi", url: "http://truyentuan.com/thien-su-cua-toi/" }, { label: "Kỵ Sĩ Hoang Tưởng Dạ", value: "Kỵ Sĩ Hoang Tưởng Dạ", url: "http://truyentuan.com/ky-si-hoang-tuong-da/" }, { label: "Tiara", value: "Tiara", url: "http://truyentuan.com/tiara/" }, { label: "Asatte Dance", value: "Asatte Dance", url: "http://truyentuan.com/asatte-dance/" }, { label: "Deathtopia", value: "Deathtopia", url: "http://truyentuan.com/deathtopia/" }, { label: "Woori", value: "Woori", url: "http://truyentuan.com/woori/" }, { label: "Hướng Tới Ánh Mặt Trời", value: "Hướng Tới Ánh Mặt Trời", url: "http://truyentuan.com/huong-toi-anh-mat-troi/" }, { label: "Vương Gia Bá Đạo", value: "Vương Gia Bá Đạo", url: "http://truyentuan.com/vuong-gia-ba-dao/" }, { label: "Thâu Hồn", value: "Thâu Hồn", url: "http://truyentuan.com/thau-hon/" }, { label: "Needless", value: "Needless", url: "http://truyentuan.com/needless/" }, { label: "Đạo Sư Độc Nhãn Long", value: "Đạo Sư Độc Nhãn Long", url: "http://truyentuan.com/dao-su-doc-nhan-long/" }, { label: "Song Tu Đạo Lữ Của Tôi", value: "Song Tu Đạo Lữ Của Tôi", url: "http://truyentuan.com/song-tu-dao-lu-cua-toi/" }, { label: "Lượm Được 1 Tiểu Hồ Ly", value: "Lượm Được 1 Tiểu Hồ Ly", url: "http://truyentuan.com/luom-duoc-1-tieu-ho-ly/" }, { label: "Fairy Tail Gaiden: Lord Knight", value: "Fairy Tail Gaiden: Lord Knight", url: "http://truyentuan.com/fairy-tail-gaiden-lord-knight/" }, { label: "Dạ Du Thần", value: "Dạ Du Thần", url: "http://truyentuan.com/da-du-than/" }, { label: "Tường Vi Quấn Loạn", value: "Tường Vi Quấn Loạn", url: "http://truyentuan.com/tuong-vi-quan-loan/" }, { label: "World Game", value: "World Game", url: "http://truyentuan.com/world-game/" }, { label: "Hồng Vân", value: "Hồng Vân", url: "http://truyentuan.com/hong-van/" }, { label: "Phá Hiểu Thế Kỷ", value: "Phá Hiểu Thế Kỷ", url: "http://truyentuan.com/pha-hieu-the-ky/" }, { label: "Huyễn Thú Vương", value: "Huyễn Thú Vương", url: "http://truyentuan.com/huyen-thu-vuong/" }, { label: "Nhất Nhân Chi Hạ", value: "Nhất Nhân Chi Hạ", url: "http://truyentuan.com/nhat-nhan-chi-ha/" }, { label: "Trump", value: "Trump", url: "http://truyentuan.com/trump/" }, { label: "Yến Sơn Phái Và Bách Hoa Môn", value: "Yến Sơn Phái Và Bách Hoa Môn", url: "http://truyentuan.com/yen-son-phai-va-bach-hoa-mon/" }, { label: "Re:Zero kara Hajimeru Isekai Seikatsu - Daisshou - Outo no Ichinichi Hen", value: "Re:Zero kara Hajimeru Isekai Seikatsu - Daisshou - Outo no Ichinichi Hen", url: "http://truyentuan.com/rezero-kara-hajimeru-isekai-seikatsu-daisshou-outo-no-ichinichi-hen/" }, { label: "xxxHOLiC Rei", value: "xxxHOLiC Rei", url: "http://truyentuan.com/xxxholic-rei/" }, { label: "Quyền Bá Thiên Hạ", value: "Quyền Bá Thiên Hạ", url: "http://truyentuan.com/quyen-ba-thien-ha/" }, { label: "Thời niên thiếu của Black Jack", value: "Thời niên thiếu của Black Jack", url: "http://truyentuan.com/thoi-nien-thieu-cua-black-jack/" }, { label: "Mushishi", value: "Mushishi", url: "http://truyentuan.com/mushishi/" }, { label: "Tô Tịch Kỳ Quái", value: "Tô Tịch Kỳ Quái", url: "http://truyentuan.com/to-tich-ky-quai/" }, { label: "Nguyên Mục", value: "Nguyên Mục", url: "http://truyentuan.com/nguyen-muc/" }, { label: "Giả Diện Thế Thân", value: "Giả Diện Thế Thân", url: "http://truyentuan.com/gia-dien-the-than/" }, { label: "Your Lie in April", value: "Your Lie in April", url: "http://truyentuan.com/your-lie-in-april/" }, { label: "Kenja No Mago", value: "Kenja No Mago", url: "http://truyentuan.com/kenja-no-mago/" }, { label: "Kid Gang II", value: "Kid Gang II", url: "http://truyentuan.com/kid-gang-ii/" }, { label: "Avengers (2013)", value: "Avengers (2013)", url: "http://truyentuan.com/avengers-2013/" }, { label: "I'm A Loser", value: "I'm A Loser", url: "http://truyentuan.com/im-a-loser/" }, { label: "Trung Quốc Kinh Ngạc Tiên Sinh", value: "Trung Quốc Kinh Ngạc Tiên Sinh", url: "http://truyentuan.com/trung-quoc-kinh-ngac-tien-sinh/" }, { label: "Đầu Óc Đại Sư Huynh Của Ta Rất Đen Tối", value: "Đầu Óc Đại Sư Huynh Của Ta Rất Đen Tối", url: "http://truyentuan.com/dau-oc-dai-su-huynh-cua-ta-rat-den-toi/" }, { label: "Nekota no Koto ga Ki ni Natte Shikatana", value: "Nekota no Koto ga Ki ni Natte Shikatana", url: "http://truyentuan.com/nekota-no-koto-ga-ki-ni-natte-shikatana/" }, { label: "Tsuki ga Michibiku Isekai Douchuu", value: "Tsuki ga Michibiku Isekai Douchuu", url: "http://truyentuan.com/tsuki-ga-michibiku-isekai-douchuu/" }, { label: "Thăng Long Đạo", value: "Thăng Long Đạo", url: "http://truyentuan.com/thang-long-dao/" }, { label: "Nhẫn Tây Du", value: "Nhẫn Tây Du", url: "http://truyentuan.com/nhan-tay-du/" }, { label: "Thành Phố Quỷ Dị – The Lost City", value: "Thành Phố Quỷ Dị – The Lost City", url: "http://truyentuan.com/thanh-pho-quy-di-the-lost-city/" }, { label: "Phụng Lâm Thiên Hạ III", value: "Phụng Lâm Thiên Hạ III", url: "http://truyentuan.com/phung-lam-thien-ha-iii/" }, { label: "I Am Killer Maid", value: "I Am Killer Maid", url: "http://truyentuan.com/i-am-killer-maid/" }, { label: "Life Howling", value: "Life Howling", url: "http://truyentuan.com/life-howling/" }, { label: "Quang Ảnh Đối Quyết", value: "Quang Ảnh Đối Quyết", url: "http://truyentuan.com/quang-anh-doi-quyet/" }, { label: "Tuổi 15", value: "Tuổi 15", url: "http://truyentuan.com/tuoi-15/" }, { label: "Wizardly Tower", value: "Wizardly Tower", url: "http://truyentuan.com/wizardly-tower/" }, { label: "Kamen Rider Spirits", value: "Kamen Rider Spirits", url: "http://truyentuan.com/kamen-rider-spirits/" }, { label: "Phoenix no Ongaeshi", value: "Phoenix no Ongaeshi", url: "http://truyentuan.com/phoenix-no-ongaeshi/" }, { label: "Đấu La Đại Lục 3 – Long Vương Truyền Thuyết", value: "Đấu La Đại Lục 3 – Long Vương Truyền Thuyết", url: "http://truyentuan.com/dau-la-dai-luc-3-long-vuong-truyen-thuyet/" }, { label: "Chimamire Sukeban Chainsaw", value: "Chimamire Sukeban Chainsaw", url: "http://truyentuan.com/chimamire-sukeban-chainsaw/" }, { label: "MIA: Lost in Operation", value: "MIA: Lost in Operation", url: "http://truyentuan.com/mia-lost-in-operation/" }, { label: "Ecstasy Hearts", value: "Ecstasy Hearts", url: "http://truyentuan.com/ecstasy-hearts/" }, { label: "Tale Of Felluah", value: "Tale Of Felluah", url: "http://truyentuan.com/tale-of-felluah/" }, { label: "A Thousand Years Ninetails - Ai Scans", value: "A Thousand Years Ninetails - Ai Scans", url: "http://truyentuan.com/atyn/" }, { label: "Aoharu x Kikanjuu", value: "Aoharu x Kikanjuu", url: "http://truyentuan.com/aoharu-x-kikanjuu/" }, { label: "Beautiful Stranger", value: "Beautiful Stranger", url: "http://truyentuan.com/beautiful-stranger/" }, { label: "F.o.x", value: "F.o.x", url: "http://truyentuan.com/f-o-x/" }, { label: "Hana ni Nare", value: "Hana ni Nare", url: "http://truyentuan.com/hana-ni-nare/" }, { label: "Choujin Sensen", value: "Choujin Sensen", url: "http://truyentuan.com/choujin-sensen/" }, { label: "High School DXD", value: "High School DXD", url: "http://truyentuan.com/high-school-dxd/" }, { label: "Transparent Cohabitation (Tt8)", value: "Transparent Cohabitation (Tt8)", url: "http://truyentuan.com/transparent-cohabitation-tt8/" }, { label: "Chú Thoong", value: "Chú Thoong", url: "http://truyentuan.com/chu-thoong/" }, { label: "Barakamon", value: "Barakamon", url: "http://truyentuan.com/barakamon/" }, { label: "Tinh Võ Thần Quyết", value: "Tinh Võ Thần Quyết", url: "http://truyentuan.com/tinh-vo-than-quyet/" }, { label: "Shion Of The Dead", value: "Shion Of The Dead", url: "http://truyentuan.com/shion-of-the-dead/" }, { label: "Kyou no Asuka Show", value: "Kyou no Asuka Show", url: "http://truyentuan.com/kyou-no-asuka-show/" }, { label: "Good Night World", value: "Good Night World", url: "http://truyentuan.com/good-night-world/" }, { label: "Kure-nai", value: "Kure-nai", url: "http://truyentuan.com/kure-nai/" }, { label: "The Legend of Wonder Woman", value: "The Legend of Wonder Woman", url: "http://truyentuan.com/the-legend-of-wonder-woman/" }, { label: "Kashimashi", value: "Kashimashi", url: "http://truyentuan.com/kashimashi/" }, { label: "Waga Na Wa Umishi", value: "Waga Na Wa Umishi", url: "http://truyentuan.com/waga-na-wa-umishi/" }, { label: "Fureru to Kikoeru", value: "Fureru to Kikoeru", url: "http://truyentuan.com/fureru-to-kikoeru/" }, { label: "Boku no Kanojo ga Majime Sugiru Shojo Bitch na Ken", value: "Boku no Kanojo ga Majime Sugiru Shojo Bitch na Ken", url: "http://truyentuan.com/boku-no-kanojo-ga-majime-sugiru-shojo-bitch-na-ken/" }, { label: "Gabriel Dropout", value: "Gabriel Dropout", url: "http://truyentuan.com/gabriel-dropout/" }, { label: "Ojojojo", value: "Ojojojo", url: "http://truyentuan.com/ojojojo/" }, { label: "Kagerou Deizu", value: "Kagerou Deizu", url: "http://truyentuan.com/kagerou-deizu/" }, { label: "DOKGO REWIND - Độc Cô Tiền Truyện", value: "DOKGO REWIND - Độc Cô Tiền Truyện", url: "http://truyentuan.com/dokgo-rewind-doc-co-tien-truyen/" }, { label: "MAZE AGE Z", value: "MAZE AGE Z", url: "http://truyentuan.com/maze-age-z/" }, { label: "Higashi No Kurume To Tonari No Meguru", value: "Higashi No Kurume To Tonari No Meguru", url: "http://truyentuan.com/higashi-no-kurume-to-tonari-no-meguru/" }, { label: "Denpatou", value: "Denpatou", url: "http://truyentuan.com/denpatou/" }, { label: "Bán Yêu Khuynh Thành", value: "Bán Yêu Khuynh Thành", url: "http://truyentuan.com/ban-yeu-khuynh-thanh/" }, { label: "Dansan Joshi", value: "Dansan Joshi", url: "http://truyentuan.com/dansan-joshi/" }, { label: "Xích Hoàng Truyền Kỳ", value: "Xích Hoàng Truyền Kỳ", url: "http://truyentuan.com/xich-hoang-truyen-ky/" }, { label: "Bác Sĩ Tình Yêu", value: "Bác Sĩ Tình Yêu", url: "http://truyentuan.com/bac-si-tinh-yeu/" }, { label: "Bokutachi wa Shitte Shimatta", value: "Bokutachi wa Shitte Shimatta", url: "http://truyentuan.com/bokutachi-wa-shitte-shimatta/" }, { label: "Tình yêu không nói dối", value: "Tình yêu không nói dối", url: "http://truyentuan.com/tinh-yeu-khong-noi-doi/" }, { label: "Vương Bài Giáo Thảo", value: "Vương Bài Giáo Thảo", url: "http://truyentuan.com/vuong-bai-giao-thao/" }, { label: "Lưỡng Bất Nghi", value: "Lưỡng Bất Nghi", url: "http://truyentuan.com/luong-bat-nghi/" }, { label: "Tam Thiên Nhứ", value: "Tam Thiên Nhứ", url: "http://truyentuan.com/tam-thien-nhu/" }, { label: "Ma Vương - Liễu Kỹ Vân", value: "Ma Vương - Liễu Kỹ Vân", url: "http://truyentuan.com/ma-vuong-lieu-ky-van/" }, { label: "Back Street Girls", value: "Back Street Girls", url: "http://truyentuan.com/back-street-girls/" }, { label: "Gunota ga Mahou Sekai ni Tensei Shitara", value: "Gunota ga Mahou Sekai ni Tensei Shitara", url: "http://truyentuan.com/gunota-ga-mahou-sekai-ni-tensei-shitara/" }, { label: "Bạn Trai Tôi Là Cẩm Y Vệ", value: "Bạn Trai Tôi Là Cẩm Y Vệ", url: "http://truyentuan.com/ban-trai-toi-la-cam-y-ve/" }, { label: "Tước Tích", value: "Tước Tích", url: "http://truyentuan.com/tuoc-tich/" }, { label: "Tầm Trảo Tiền Thế Chi Lữ", value: "Tầm Trảo Tiền Thế Chi Lữ", url: "http://truyentuan.com/tam-trao-tien-the-chi-lu/" }, { label: "Boku dake ga Inai Machi", value: "Boku dake ga Inai Machi", url: "http://truyentuan.com/boku-dake-ga-inai-machi/" }, { label: "Spice and Wolf", value: "Spice and Wolf", url: "http://truyentuan.com/spice-and-wolf/" }, { label: "Tấn Công Nào! Ma Vương!", value: "Tấn Công Nào! Ma Vương!", url: "http://truyentuan.com/tan-cong-nao-ma-vuong/" }, { label: "Thành Phố Sống", value: "Thành Phố Sống", url: "http://truyentuan.com/thanh-pho-song/" }, { label: "Sự Cám Dỗ Xấu Xa", value: "Sự Cám Dỗ Xấu Xa", url: "http://truyentuan.com/su-cam-do-xau-xa/" }, { label: "Lasboss x Hero", value: "Lasboss x Hero", url: "http://truyentuan.com/lasboss-x-hero/" }, { label: "Thế Giới Hoàn Mỹ", value: "Thế Giới Hoàn Mỹ", url: "http://truyentuan.com/the-gioi-hoan-my/" }, { label: "Wild Half", value: "Wild Half", url: "http://truyentuan.com/wild-half/" }, { label: "Ngạo Thế Cửu Trọng Thiên", value: "Ngạo Thế Cửu Trọng Thiên", url: "http://truyentuan.com/ngao-the-cuu-trong-thien/" }, { label: "Mỹ Nam Học Đường", value: "Mỹ Nam Học Đường", url: "http://truyentuan.com/my-nam-hoc-duong/" }, { label: "New Game!", value: "New Game!", url: "http://truyentuan.com/new-game/" }, { label: "Trạch Thiên Ký", value: "Trạch Thiên Ký", url: "http://truyentuan.com/trach-thien-ky/" }, { label: "Ookami to Koushinryou", value: "Ookami to Koushinryou", url: "http://truyentuan.com/ookami-to-koushinryou/" }, { label: "Orange Chocolate", value: "Orange Chocolate", url: "http://truyentuan.com/orange-chocolate/" }, { label: "Gift ±", value: "Gift ±", url: "http://truyentuan.com/gift/" }, { label: "Xuyên Việt Chi Thiên Tâm Linh", value: "Xuyên Việt Chi Thiên Tâm Linh", url: "http://truyentuan.com/xuyen-viet-chi-thien-tam-linh/" }, { label: "Perfect Half", value: "Perfect Half", url: "http://truyentuan.com/perfect-half/" }, { label: "Strike the Blood", value: "Strike the Blood", url: "http://truyentuan.com/strike-the-blood/" }, { label: "Chihou Kishi Hans no Junan", value: "Chihou Kishi Hans no Junan", url: "http://truyentuan.com/chihou-kishi-hans-no-junan/" }, { label: "Vương Gia ! Ngươi Thật Bỉ Ổi !", value: "Vương Gia ! Ngươi Thật Bỉ Ổi !", url: "http://truyentuan.com/vuong-gia-nguoi-that-bi-oi/" }, { label: "Kaguya-sama wa Kokurasetai - Tensai-tachi no Renai Zunousen", value: "Kaguya-sama wa Kokurasetai - Tensai-tachi no Renai Zunousen", url: "http://truyentuan.com/kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen/" }, { label: "Trinity Wonder", value: "Trinity Wonder", url: "http://truyentuan.com/trinity-wonder/" }, { label: "Thanh Ninh Chi Hạ", value: "Thanh Ninh Chi Hạ", url: "http://truyentuan.com/thanh-ninh-chi-ha/" }, { label: "Our Reason For Living", value: "Our Reason For Living", url: "http://truyentuan.com/our-reason-for-living/" }, { label: "Thánh Vương", value: "Thánh Vương", url: "http://truyentuan.com/thanh-vuong/" }, { label: "Moritat", value: "Moritat", url: "http://truyentuan.com/moritat/" }, { label: "Aka Akatoretachi no Monogatari", value: "Aka Akatoretachi no Monogatari", url: "http://truyentuan.com/aka-akatoretachi-no-monogatari/" }, { label: "Kono Subarashii Sekai ni Shukufuku o!", value: "Kono Subarashii Sekai ni Shukufuku o!", url: "http://truyentuan.com/kono-subarashii-sekai-ni-shukufuku-o/" }, { label: "Kyou No Yuiko-san", value: "Kyou No Yuiko-san", url: "http://truyentuan.com/kyou-no-yuiko-san/" }, { label: "Nam Thần Ở Phòng Bên Cạnh", value: "Nam Thần Ở Phòng Bên Cạnh", url: "http://truyentuan.com/nam-than-o-phong-ben-canh/" }, { label: "Honey", value: "Honey", url: "http://truyentuan.com/honey/" }, { label: "Sở Sở Động Lòng Nhân Ái", value: "Sở Sở Động Lòng Nhân Ái", url: "http://truyentuan.com/so-so-dong-long-nhan-ai/" }, { label: "Cross Manage", value: "Cross Manage", url: "http://truyentuan.com/cross-manage/" }, { label: "Lưu Luyến Tinh Diệu", value: "Lưu Luyến Tinh Diệu", url: "http://truyentuan.com/luu-luyen-tinh-dieu/" }, { label: "Thời Gian Chi Ngoại", value: "Thời Gian Chi Ngoại", url: "http://truyentuan.com/thoi-gian-chi-ngoai/" }, { label: "Ngự Linh Thế Giới", value: "Ngự Linh Thế Giới", url: "http://truyentuan.com/ngu-linh-the-gioi/" }, { label: "Hensokukei Quadrangle", value: "Hensokukei Quadrangle", url: "http://truyentuan.com/hensokukei-quadrangle/" }, { label: "Vong Linh Vương [Undead King]", value: "Vong Linh Vương [Undead King]", url: "http://truyentuan.com/vong-linh-vuong-undead-king/" }, { label: "Watashi no Ookami-kun", value: "Watashi no Ookami-kun", url: "http://truyentuan.com/watashi-no-ookami-kun/" }, { label: "UnOrdinary", value: "UnOrdinary", url: "http://truyentuan.com/unordinary/" }, { label: "Red Sprite", value: "Red Sprite", url: "http://truyentuan.com/red-sprite/" }, { label: "Kunisaki izumo no jijou", value: "Kunisaki izumo no jijou", url: "http://truyentuan.com/kunisaki-izumo-no-jijou/" }, { label: "Enen no Shouboutai", value: "Enen no Shouboutai", url: "http://truyentuan.com/enen-no-shouboutai/" }, { label: "Uyển Hương", value: "Uyển Hương", url: "http://truyentuan.com/uyen-huong/" }, { label: "Ngụy Thủy Nghi Vân", value: "Ngụy Thủy Nghi Vân", url: "http://truyentuan.com/nguy-thuy-nghi-van/" }, { label: "Việt Thế Thiên Niên", value: "Việt Thế Thiên Niên", url: "http://truyentuan.com/viet-the-thien-nien/" }, { label: "Love Rush !!", value: "Love Rush !!", url: "http://truyentuan.com/love-rush/" }, { label: "Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!", value: "Watashi ga Motenai no wa Dou Kangaetemo Omaera ga Warui!", url: "http://truyentuan.com/watashi-ga-motenai-no-wa-dou-kangaetemo-omaera-ga-warui/" }, { label: "Mãng Hoang Ký", value: "Mãng Hoang Ký", url: "http://truyentuan.com/mang-hoang-ky/" }, { label: "Kumo Desu ga, Nani ka?", value: "Kumo Desu ga, Nani ka?", url: "http://truyentuan.com/kumo-desu-ga-nani-ka/" }, { label: "Girl And Science", value: "Girl And Science", url: "http://truyentuan.com/girl-and-science/" }, { label: "Musuko ga Kawaikute Shikataganai Mazoku no Hahaoya", value: "Musuko ga Kawaikute Shikataganai Mazoku no Hahaoya", url: "http://truyentuan.com/musuko-ga-kawaikute-shikataganai-mazoku-no-hahaoya/" }, { label: "La Sát Đại Nhân Hãy Dừng Chân", value: "La Sát Đại Nhân Hãy Dừng Chân", url: "http://truyentuan.com/la-sat-dai-nhan-hay-dung-chan/" }, { label: "Hajimete No Gal", value: "Hajimete No Gal", url: "http://truyentuan.com/hajimete-no-gal/" }, { label: "Fleet Journal", value: "Fleet Journal", url: "http://truyentuan.com/fleet-journal/" }, { label: "Linh Khiết", value: "Linh Khiết", url: "http://truyentuan.com/linh-khiet/" }, { label: "VÔ DANH TIÊU CỤC", value: "VÔ DANH TIÊU CỤC", url: "http://truyentuan.com/vo-danh-tieu-cuc/" }, { label: "MONONOTE: EDO SHINOBI KAGYOU", value: "MONONOTE: EDO SHINOBI KAGYOU", url: "http://truyentuan.com/mononote-edo-shinobi-kagyou/" }, { label: "Zannen Jokanbu Black General-san", value: "Zannen Jokanbu Black General-san", url: "http://truyentuan.com/zannen-jokanbu-black-general-san/" }, { label: "Gokukoku no Brynhildr", value: "Gokukoku no Brynhildr", url: "http://truyentuan.com/gokukoku-no-brynhildr/" }, { label: "Yaoguai Mingdan", value: "Yaoguai Mingdan", url: "http://truyentuan.com/yaoguai-mingdan/" }, { label: "Yujo No Yume", value: "Yujo No Yume", url: "http://truyentuan.com/yujo-no-yume/" }, { label: "Iinazuke Kyoutei", value: "Iinazuke Kyoutei", url: "http://truyentuan.com/iinazuke-kyoutei/" }, { label: "Hương Vị Mùa Hạ", value: "Hương Vị Mùa Hạ", url: "http://truyentuan.com/huong-vi-mua-ha/" }, { label: "Keishichou Tokuhanka 007", value: "Keishichou Tokuhanka 007", url: "http://truyentuan.com/keishichou-tokuhanka-007/" }, { label: "Days", value: "Days", url: "http://truyentuan.com/days/" }, { label: "Trạch Yêu Ký", value: "Trạch Yêu Ký", url: "http://truyentuan.com/trach-yeu-ky/" }, { label: "Resident Evil Biohazard Heavenly Island", value: "Resident Evil Biohazard Heavenly Island", url: "http://truyentuan.com/resident-evil-biohazard-heavenly-island/" }, { label: "Criminale!", value: "Criminale!", url: "http://truyentuan.com/criminale/" }, { label: "Maou-jou de Oyasumi", value: "Maou-jou de Oyasumi", url: "http://truyentuan.com/maou-jou-de-oyasumi/" }, { label: "Võng Du Chi Cận Chiến Pháp Sư", value: "Võng Du Chi Cận Chiến Pháp Sư", url: "http://truyentuan.com/vong-du-chi-can-chien-phap-su/" }, { label: "Mikakunin de Shinkoukei", value: "Mikakunin de Shinkoukei", url: "http://truyentuan.com/mikakunin-de-shinkoukei/" }, { label: "Chước Chước Lưu Ly Hạ", value: "Chước Chước Lưu Ly Hạ", url: "http://truyentuan.com/chuoc-chuoc-luu-ly-ha/" }, { label: "Sekai no Owari no Encore", value: "Sekai no Owari no Encore", url: "http://truyentuan.com/sekai-no-owari-no-encore/" }, { label: "Cực Phẩm Gia Đinh", value: "Cực Phẩm Gia Đinh", url: "http://truyentuan.com/cuc-pham-gia-dinh/" }, { label: "Floor ni maou ga imasu", value: "Floor ni maou ga imasu", url: "http://truyentuan.com/floor-ni-maou-ga-imasu/" }, { label: "Cô rồng hầu gái của Kobayashi-san", value: "Cô rồng hầu gái của Kobayashi-san", url: "http://truyentuan.com/co-rong-hau-gai-cua-kobayashi-san/" }, { label: "Tôi Là Vợ Tôi", value: "Tôi Là Vợ Tôi", url: "http://truyentuan.com/toi-la-vo-toi/" }, { label: "Dragon Ball Gaiden - Tensei shitara Yamcha datta ken", value: "Dragon Ball Gaiden - Tensei shitara Yamcha datta ken", url: "http://truyentuan.com/dragon-ball-gaiden-tensei-shitara-yamcha-datta-ken/" }, { label: "Anh Hùng Vô Lệ", value: "Anh Hùng Vô Lệ", url: "http://truyentuan.com/anh-hung-vo-le/" }, { label: "C Sword and Cornett", value: "C Sword and Cornett", url: "http://truyentuan.com/c-sword-and-cornett/" }, { label: "Inugami-san to Sarutobi-kun wa Naka ga Warui", value: "Inugami-san to Sarutobi-kun wa Naka ga Warui", url: "http://truyentuan.com/inugami-san-to-sarutobi-kun-wa-naka-ga-warui/" }, { label: "To Aru Kagaku No Accelerator", value: "To Aru Kagaku No Accelerator", url: "http://truyentuan.com/to-aru-kagaku-no-accelerator/" }, { label: "Thấu Ngọc Từ", value: "Thấu Ngọc Từ", url: "http://truyentuan.com/thau-ngoc-tu/" }, { label: "Niflheim", value: "Niflheim", url: "http://truyentuan.com/niflheim/" }, { label: "The Promised Neverland", value: "The Promised Neverland", url: "http://truyentuan.com/the-promised-neverland/" }, { label: "Chí Tôn Chư Thiên", value: "Chí Tôn Chư Thiên", url: "http://truyentuan.com/chi-ton-chu-thien/" }, { label: "Himegoto Comic Rex", value: "Himegoto Comic Rex", url: "http://truyentuan.com/himegoto-comic-rex/" }, { label: "Tinh Thần Biến", value: "Tinh Thần Biến", url: "http://truyentuan.com/tinh-than-bien/" }, { label: "Granblue Fantasy", value: "Granblue Fantasy", url: "http://truyentuan.com/granblue-fantasy/" }, { label: "Bloody Girl", value: "Bloody Girl", url: "http://truyentuan.com/bloody-girl/" }, { label: "Thần thoại Bắc Âu", value: "Thần thoại Bắc Âu", url: "http://truyentuan.com/than-thoai-bac-au/" }, { label: "Aizawa-san Zoushoku", value: "Aizawa-san Zoushoku", url: "http://truyentuan.com/aizawa-san-zoushoku/" }, { label: "Hito Hitori Futari", value: "Hito Hitori Futari", url: "http://truyentuan.com/hito-hitori-futari/" }, { label: "Servamp", value: "Servamp", url: "http://truyentuan.com/servamp/" }, { label: "The Strange Tales Of Oscar Zahn", value: "The Strange Tales Of Oscar Zahn", url: "http://truyentuan.com/the-strange-tales-of-oscar-zahn/" }, { label: "Zelda no Densetsu - Twilight Princess", value: "Zelda no Densetsu - Twilight Princess", url: "http://truyentuan.com/zelda-no-densetsu-twilight-princess/" }, { label: "Mist Story", value: "Mist Story", url: "http://truyentuan.com/mist-story/" }, { label: "Uratarou", value: "Uratarou", url: "http://truyentuan.com/uratarou/" }, { label: "Kimetsu no Yaiba", value: "Kimetsu no Yaiba", url: "http://truyentuan.com/kimetsu-no-yaiba/" }, { label: "Grand Blue", value: "Grand Blue", url: "http://truyentuan.com/grand-blue/" }, { label: "Maousama Chotto Sore Totte!!", value: "Maousama Chotto Sore Totte!!", url: "http://truyentuan.com/maousama-chotto-sore-totte/" }, { label: "Tokage no Ou", value: "Tokage no Ou", url: "http://truyentuan.com/tokage-no-ou/" }, { label: "Saijaku Muhai no Shinsou Kiryuu", value: "Saijaku Muhai no Shinsou Kiryuu", url: "http://truyentuan.com/saijaku-muhai-no-shinsou-kiryuu/" }, { label: "Edogawa Ranpo Ijinkan", value: "Edogawa Ranpo Ijinkan", url: "http://truyentuan.com/edogawa-ranpo-ijinkan/" }, { label: "Knights & Magic", value: "Knights & Magic", url: "http://truyentuan.com/knights-magic/" }, { label: "Tiêu Nhân", value: "Tiêu Nhân", url: "http://truyentuan.com/tieu-nhan/" }, { label: "No Guns Life", value: "No Guns Life", url: "http://truyentuan.com/no-guns-life/" }, { label: "Epic of Gilgamesh", value: "Epic of Gilgamesh", url: "http://truyentuan.com/epic-of-gilgamesh/" }, { label: "Prison Lab", value: "Prison Lab", url: "http://truyentuan.com/prison-lab/" }, { label: "Wind Breaker", value: "Wind Breaker", url: "http://truyentuan.com/wind-breaker/" }, { label: "Savanna Game: The Comic", value: "Savanna Game: The Comic", url: "http://truyentuan.com/savanna-game-the-comic/" }, { label: "Dawn of the Frozen Wastelands", value: "Dawn of the Frozen Wastelands", url: "http://truyentuan.com/dawn-of-the-frozen-wastelands/" }, { label: "Love-X", value: "Love-X", url: "http://truyentuan.com/love-x/" }, { label: "Kono Shima ni wa Midara de Jaaku na Mono ga Sumu", value: "Kono Shima ni wa Midara de Jaaku na Mono ga Sumu", url: "http://truyentuan.com/kono-shima-ni-wa-midara-de-jaaku-na-mono-ga-sumu/" }, { label: "Bloody Maiden", value: "Bloody Maiden", url: "http://truyentuan.com/bloody-maiden/" }, { label: "Thành phố vô tội", value: "Thành phố vô tội", url: "http://truyentuan.com/thanh-pho-vo-toi/" }, { label: "Ibitsu no Amalgam", value: "Ibitsu no Amalgam", url: "http://truyentuan.com/ibitsu-no-amalgam/" }, { label: "Miền đất hứa", value: "Miền đất hứa", url: "http://truyentuan.com/mien-dat-hua/" }, { label: "Yozakura Quartet", value: "Yozakura Quartet", url: "http://truyentuan.com/yozakura-quartet/" }, { label: "-SINS-", value: "-SINS-", url: "http://truyentuan.com/sins/" }, { label: "(G) Edition", value: "(G) Edition", url: "http://truyentuan.com/g-edition/" }, { label: "Jojo’s Bizarre Adventure - Rohan Thus Spoken", value: "Jojo’s Bizarre Adventure - Rohan Thus Spoken", url: "http://truyentuan.com/jojos-bizarre-adventure-rohan-thus-spoken/" }, { label: "Omaera Zenin Mendokusai!", value: "Omaera Zenin Mendokusai!", url: "http://truyentuan.com/omaera-zenin-mendokusai/" }, { label: "Shinseiki Evangelion", value: "Shinseiki Evangelion", url: "http://truyentuan.com/shinseiki-evangelion/" }, { label: "Premarital Relationship", value: "Premarital Relationship", url: "http://truyentuan.com/premarital-relationship/" }, { label: "Demonizer Zilch", value: "Demonizer Zilch", url: "http://truyentuan.com/demonizer-zilch/" }, { label: "Thiên Giáng Hiền Thục Nam", value: "Thiên Giáng Hiền Thục Nam", url: "http://truyentuan.com/thien-giang-hien-thuc-nam/" }, { label: "Oyasumi Punpun", value: "Oyasumi Punpun", url: "http://truyentuan.com/oyasumi-punpun/" }, { label: "Anorexia - Shikabane Hanako wa Kyoshokushou", value: "Anorexia - Shikabane Hanako wa Kyoshokushou", url: "http://truyentuan.com/anorexia-shikabane-hanako-wa-kyoshokushou/" }, { label: "Mỹ Nhân Làm Tướng", value: "Mỹ Nhân Làm Tướng", url: "http://truyentuan.com/my-nhan-lam-tuong/" }, { label: "Arisa", value: "Arisa", url: "http://truyentuan.com/arisa/" }, { label: "Death March Kara Hajimaru Isekai Kyousou Kyoku", value: "Death March Kara Hajimaru Isekai Kyousou Kyoku", url: "http://truyentuan.com/death-march-kara-hajimaru-isekai-kyousou-kyoku/" }, { label: "Xuyên Duyệt Tây Nguyên 3000", value: "Xuyên Duyệt Tây Nguyên 3000", url: "http://truyentuan.com/xuyen-duyet-tay-nguyen-3000/" }, { label: "Black Torch", value: "Black Torch", url: "http://truyentuan.com/black-torch/" }, { label: "Kemono Jihen", value: "Kemono Jihen", url: "http://truyentuan.com/kemono-jihen/" }, { label: "Fate/Extra CCC Fox Tail", value: "Fate/Extra CCC Fox Tail", url: "http://truyentuan.com/fateextra-ccc-foxtail/" }, { label: "Nein ~9th Story~", value: "Nein ~9th Story~", url: "http://truyentuan.com/nein-9th-story/" }, { label: "D.Y.N. Freaks", value: "D.Y.N. Freaks", url: "http://truyentuan.com/d-y-n-freaks/" }, { label: "Ngọn lửa Recca", value: "Ngọn lửa Recca", url: "http://truyentuan.com/ngon-lua-recca/" }, { label: "Hungry Marie", value: "Hungry Marie", url: "http://truyentuan.com/hungry-marie/" }, { label: "Mairimashita! Iruma-kun", value: "Mairimashita! Iruma-kun", url: "http://truyentuan.com/mairimashita-iruma-kun/" }, { label: "Wortenia Senki", value: "Wortenia Senki", url: "http://truyentuan.com/wortenia-senki/" }, { label: "Sukedachi 09", value: "Sukedachi 09", url: "http://truyentuan.com/sukedachi-09/" }, { label: "Destroy and Revolution", value: "Destroy and Revolution", url: "http://truyentuan.com/destroy-and-revolution/" }, { label: "Yumekuri", value: "Yumekuri", url: "http://truyentuan.com/yumekuri/" }, { label: "Innocent", value: "Innocent", url: "http://truyentuan.com/innocent-2/" }, { label: "Stretch", value: "Stretch", url: "http://truyentuan.com/stretch/" }, { label: "Bungo Stray Dogs", value: "Bungo Stray Dogs", url: "http://truyentuan.com/bungo-stray-dogs/" }, { label: "Ansatsu Kyoushitsu Korosensei Quest", value: "Ansatsu Kyoushitsu Korosensei Quest", url: "http://truyentuan.com/ansatsu-kyoushitsu-korosensei-quest/" }, { label: "Cực Phẩm Manh Nương Thật Uy Vũ", value: "Cực Phẩm Manh Nương Thật Uy Vũ", url: "http://truyentuan.com/cuc-pham-manh-nuong-that-uy-vu/" }, { label: "Goblin Slayer", value: "Goblin Slayer", url: "http://truyentuan.com/goblin-slayer/" }, { label: "Mouhitsu Hallucination", value: "Mouhitsu Hallucination", url: "http://truyentuan.com/mouhitsu-hallucination/" }, { label: "Dr. Stone", value: "Dr. Stone", url: "http://truyentuan.com/dr-stone/" }, { label: "eldLIVE", value: "eldLIVE", url: "http://truyentuan.com/eldlive/" }, { label: "Fumetsu No Anata E", value: "Fumetsu No Anata E", url: "http://truyentuan.com/fumetsu-no-anata-e/" }, { label: "Karada Sagashi", value: "Karada Sagashi", url: "http://truyentuan.com/karada-sagashi/" }, { label: "Zero Game", value: "Zero Game", url: "http://truyentuan.com/zero-game/" }, { label: "Parallel Paradise", value: "Parallel Paradise", url: "http://truyentuan.com/parallel-paradise/" }, { label: "Kimi wa Midara na Boku no Joou", value: "Kimi wa Midara na Boku no Joou", url: "http://truyentuan.com/kimi-wa-midara-na-boku-no-joou/" }, { label: "Origin", value: "Origin", url: "http://truyentuan.com/origin/" }, { label: "Tây Du Ký màu", value: "Tây Du Ký màu", url: "http://truyentuan.com/tay-du-ky-mau/" }, { label: "Ai-sensei wa Wakaranai", value: "Ai-sensei wa Wakaranai", url: "http://truyentuan.com/ai-sensei-wa-wakaranai/" }, { label: "Robot x Laserbeam", value: "Robot x Laserbeam", url: "http://truyentuan.com/robot-x-laserbeam/" }, { label: "Kuutei Dragons", value: "Kuutei Dragons", url: "http://truyentuan.com/kuutei-dragons/" }, { label: "Only Sense Online", value: "Only Sense Online", url: "http://truyentuan.com/only-sense-online/" }, { label: "Tôi đang đứng trên 1 triệu sinh mệnh", value: "Tôi đang đứng trên 1 triệu sinh mệnh", url: "http://truyentuan.com/toi-dang-dung-tren-1-trieu-sinh-menh/" }, { label: "Black June", value: "Black June", url: "http://truyentuan.com/black-june/" }, { label: "Sát Thủ Đeo Mặt Nạ", value: "Sát Thủ Đeo Mặt Nạ", url: "http://truyentuan.com/sat-thu-deo-mat-na/" }, { label: "Jagaaaaaan", value: "Jagaaaaaan", url: "http://truyentuan.com/jagaaaaaan/" }, { label: "Umibe no Onnanoko", value: "Umibe no Onnanoko", url: "http://truyentuan.com/umibe-no-onnanoko/" }, { label: "Gal Gohan", value: "Gal Gohan", url: "http://truyentuan.com/gal-gohan/" }, { label: "Mahou Shoujo Tokushuusen Asuka", value: "Mahou Shoujo Tokushuusen Asuka", url: "http://truyentuan.com/mahou-shoujo-tokushuusen-asuka/" }, { label: "Golden Times", value: "Golden Times", url: "http://truyentuan.com/golden-times/" }, { label: "Rapaz Theme Park", value: "Rapaz Theme Park", url: "http://truyentuan.com/rapaz-theme-park/" }, { label: "REC - Silver Street Romantic", value: "REC - Silver Street Romantic", url: "http://truyentuan.com/rec/" }, { label: "Satanophany", value: "Satanophany", url: "http://truyentuan.com/satanophany/" }, { label: "Mujaki No Rakuen", value: "Mujaki No Rakuen", url: "http://truyentuan.com/mujaki-no-rakuen-2/" }, { label: "Tenshi na Konamaiki", value: "Tenshi na Konamaiki", url: "http://truyentuan.com/tenshi-na-konamaiki/" }, { label: "Mahou Shoujo of the End", value: "Mahou Shoujo of the End", url: "http://truyentuan.com/mahou-shoujo-of-the-end/" }, { label: "Liquor & Cigarette", value: "Liquor & Cigarette", url: "http://truyentuan.com/liquor-cigarette/" }, { label: "Osmotic Pressure", value: "Osmotic Pressure", url: "http://truyentuan.com/osmotic-pressure/" }, { label: "Forest of Drizzling Rain", value: "Forest of Drizzling Rain", url: "http://truyentuan.com/forest-of-drizzling-rain/" }, { label: "Zenryoku 'Otome'", value: "Zenryoku 'Otome'", url: "http://truyentuan.com/zenryoku-otome/" }, { label: "Luyện Ngục Trọng Sinh", value: "Luyện Ngục Trọng Sinh", url: "http://truyentuan.com/luyen-nguc-trong-sinh/" }, { label: "Chi no Wadachi", value: "Chi no Wadachi", url: "http://truyentuan.com/chi-no-wadachi/" }, { label: "Bamboo Blade", value: "Bamboo Blade", url: "http://truyentuan.com/bamboo-blade/" }, { label: "Kusumi-kun, Kuuki Yometemasu ka?", value: "Kusumi-kun, Kuuki Yometemasu ka?", url: "http://truyentuan.com/kusumi-kun-kuuki-yometemasu-ka/" }, { label: "Yuizaki-san ha Nageru!", value: "Yuizaki-san ha Nageru!", url: "http://truyentuan.com/yuizaki-san-ha-nageru/" }, { label: "Tuyệt Thế Võ Thần", value: "Tuyệt Thế Võ Thần", url: "http://truyentuan.com/tuyet-the-vo-than/" }, { label: "Futaba-san Chi no Kyoudai", value: "Futaba-san Chi no Kyoudai", url: "http://truyentuan.com/futaba-san-chi-no-kyoudai/" }, { label: "Hào Môn Đệ Nhất Thịnh Hôn", value: "Hào Môn Đệ Nhất Thịnh Hôn", url: "http://truyentuan.com/hao-mon-de-nhat-thinh-hon/" }, { label: "Kyou no Cerberus", value: "Kyou no Cerberus", url: "http://truyentuan.com/kyou-no-cerberus/" }, { label: "Elf-san wa Yaserarenai", value: "Elf-san wa Yaserarenai", url: "http://truyentuan.com/elf-san-wa-yaserarenai/" }, { label: "Fire Punch", value: "Fire Punch", url: "http://truyentuan.com/fire-punch/" }, { label: "Naa-tan to Goshujin-tama", value: "Naa-tan to Goshujin-tama", url: "http://truyentuan.com/naa-tan-to-goshujin-tama/" }, { label: "Yamikagishi", value: "Yamikagishi", url: "http://truyentuan.com/yamikagishi/" }, { label: "Otome Sensou", value: "Otome Sensou", url: "http://truyentuan.com/otome-sensou/" }, { label: "Long Phù Chi Vương Đạo Thiên Hạ", value: "Long Phù Chi Vương Đạo Thiên Hạ", url: "http://truyentuan.com/long-phu-chi-vuong-dao-thien-ha/" }, { label: "NGUYỆT THƯƠNG", value: "NGUYỆT THƯƠNG", url: "http://truyentuan.com/nguyet-thuong/" }, { label: "Ochitekita Ryuuou to Horobiyuku Majo no Kuni", value: "Ochitekita Ryuuou to Horobiyuku Majo no Kuni", url: "http://truyentuan.com/ochitekita-ryuuou-to-horobiyuku-majo-no-kuni/" }, { label: "Điều ước bên hồ tây", value: "Điều ước bên hồ tây", url: "http://truyentuan.com/dieu-uoc-ben-ho-tay/" }, { label: "Rebirth", value: "Rebirth", url: "http://truyentuan.com/rebirth/" }, { label: "Starting Gate - Horsegirl Pretty Derby", value: "Starting Gate - Horsegirl Pretty Derby", url: "http://truyentuan.com/starting-gate-horsegirl-pretty-derby/" }, { label: "Yuuutsu to Succubus-san", value: "Yuuutsu to Succubus-san", url: "http://truyentuan.com/yuuutsu-to-succubus-san/" }, { label: "Ứng dụng anh hùng", value: "Ứng dụng anh hùng", url: "http://truyentuan.com/ung-dung-anh-hung/" }, { label: "Super Secret", value: "Super Secret", url: "http://truyentuan.com/super-secret/" }, { label: "Satsuriku no Tenshi", value: "Satsuriku no Tenshi", url: "http://truyentuan.com/satsuriku-no-tenshi/" }, { label: "Itoshi No Muco", value: "Itoshi No Muco", url: "http://truyentuan.com/itoshi-no-muco/" }, { label: "Jyaryu Tensei", value: "Jyaryu Tensei", url: "http://truyentuan.com/jyaryu-tensei/" }, { label: "Saike Mata Shitemo", value: "Saike Mata Shitemo", url: "http://truyentuan.com/saike-mata-shitemo/" }, { label: "Mattaku Saikin no Tantei to Kitara", value: "Mattaku Saikin no Tantei to Kitara", url: "http://truyentuan.com/mattaku-saikin-no-tantei-to-kitara/" }, { label: "Sơn Hải Nghịch Chiến", value: "Sơn Hải Nghịch Chiến", url: "http://truyentuan.com/son-hai-nghich-chien/" }, { label: "Innocent Devil", value: "Innocent Devil", url: "http://truyentuan.com/innocent-devil/" }, { label: "Eto Royale", value: "Eto Royale", url: "http://truyentuan.com/eto-royale/" }, { label: "Ki ni Naru Mori-san", value: "Ki ni Naru Mori-san", url: "http://truyentuan.com/ki-ni-naru-mori-san/" }, { label: "Baby", value: "Baby", url: "http://truyentuan.com/baby/" }, { label: "Đại Khâu Giáp Sư", value: "Đại Khâu Giáp Sư", url: "http://truyentuan.com/dai-khau-giap-su/" }, { label: "Cao thủ cận vệ của hoa khôi", value: "Cao thủ cận vệ của hoa khôi", url: "http://truyentuan.com/cao-thu-can-ve-cua-hoa-khoi/" }, { label: "Thiên ngoại phi tiên", value: "Thiên ngoại phi tiên", url: "http://truyentuan.com/thien-ngoai-phi-tien/" }, { label: "Tây du tầm sư phục ma lục", value: "Tây du tầm sư phục ma lục", url: "http://truyentuan.com/tay-du-tam-su-phuc-ma-luc/" }, { label: "Tam quốc diễn nghĩa", value: "Tam quốc diễn nghĩa", url: "http://truyentuan.com/tam-quoc-dien-nghia/" }, { label: "Sozo no Eterunite", value: "Sozo no Eterunite", url: "http://truyentuan.com/sozo-no-eterunite/" }, { label: "Sozo no Eterunite", value: "Sozo no Eterunite", url: "http://truyentuan.com/sozo-no-eterunite-2/" }, { label: "Danh tướng nghịch thiên", value: "Danh tướng nghịch thiên", url: "http://truyentuan.com/danh-tuong-nghich-thien/" }, { label: "Plus Alpha no Tachiichi", value: "Plus Alpha no Tachiichi", url: "http://truyentuan.com/plus-alpha-no-tachiichi/" }, { label: "Futsumashi na Yome desu ga", value: "Futsumashi na Yome desu ga", url: "http://truyentuan.com/futsumashi-na-yome-desu-ga/" }, { label: "Hoàng Triều Quân Lâm", value: "Hoàng Triều Quân Lâm", url: "http://truyentuan.com/hoang-trieu-quan-lam/" }, { label: "Võ Thần Không Gian", value: "Võ Thần Không Gian", url: "http://truyentuan.com/vo-than-khong-gian/" }, { label: "Konya wa Tsuki ga Kirei Desu ga, Toriaezu Shi ne", value: "Konya wa Tsuki ga Kirei Desu ga, Toriaezu Shi ne", url: "http://truyentuan.com/konya-wa-tsuki-ga-kirei-desu-ga-toriaezu-shi-ne/" }, { label: "Nani mo Nai Kedo Sora wa Aoi", value: "Nani mo Nai Kedo Sora wa Aoi", url: "http://truyentuan.com/nani-mo-nai-kedo-sora-wa-aoi/" }, { label: "Áo Thuật Thần Tọa", value: "Áo Thuật Thần Tọa", url: "http://truyentuan.com/ao-thuat-than-toa/" }, { label: "Shiroi Majo", value: "Shiroi Majo", url: "http://truyentuan.com/shiroi-majo/" }, { label: "King of idols", value: "King of idols", url: "http://truyentuan.com/king-of-idols/" }, { label: "Narakunoadu", value: "Narakunoadu", url: "http://truyentuan.com/narakunoadu/" }, { label: "Bạn Trai Là Ngôi Sao", value: "Bạn Trai Là Ngôi Sao", url: "http://truyentuan.com/ban-trai-la-ngoi-sao/" }, { label: "Futaribocchi Sensou", value: "Futaribocchi Sensou", url: "http://truyentuan.com/futaribocchi-sensou/" }, { label: "Futaribocchi Sensou", value: "Futaribocchi Sensou", url: "http://truyentuan.com/futaribocchi-sensou-2/" }, { label: "Saikin Kono Sekai wa Watashi dake no Mono ni Narimashita......", value: "Saikin Kono Sekai wa Watashi dake no Mono ni Narimashita......", url: "http://truyentuan.com/saikin-kono-sekai-wa-watashi-dake-no-mono-ni-narimashita/" }, { label: "Samon-kun wa Summoner", value: "Samon-kun wa Summoner", url: "http://truyentuan.com/samon-kun-wa-summoner/" }, { label: "Diệu Thủ Tiên Đan", value: "Diệu Thủ Tiên Đan", url: "http://truyentuan.com/dieu-thu-tien-dan/" }, { label: "Maken No Daydreamer", value: "Maken No Daydreamer", url: "http://truyentuan.com/maken-no-daydreamer/" }, { label: "Dragon Ball Z & Onepunch-Man", value: "Dragon Ball Z & Onepunch-Man", url: "http://truyentuan.com/dragon-ball-z-onepunch-man/" }, { label: "Ragna Crimson", value: "Ragna Crimson", url: "http://truyentuan.com/ragna-crimson/" }, { label: "Henjo - Hen na Joshi Kousei Amaguri Chiko", value: "Henjo - Hen na Joshi Kousei Amaguri Chiko", url: "http://truyentuan.com/henjo-hen-na-joshi-kousei-amaguri-chiko/" }, { label: "Rokudou no Onna-tachi", value: "Rokudou no Onna-tachi", url: "http://truyentuan.com/rokudou-no-onna-tachi/" }, { label: "Imawa no Michi no Alice", value: "Imawa no Michi no Alice", url: "http://truyentuan.com/imawa-no-michi-no-alice/" }, { label: "Ore to Kawazu-san no Isekai Hourouki", value: "Ore to Kawazu-san no Isekai Hourouki", url: "http://truyentuan.com/ore-to-kawazu-san-no-isekai-hourouki/" }, { label: "Tales of Berseria", value: "Tales of Berseria", url: "http://truyentuan.com/tales-of-berseria/" }, { label: "Next Life", value: "Next Life", url: "http://truyentuan.com/next-life/" }, { label: "Kengan Ashua - Zero Atula", value: "Kengan Ashua - Zero Atula", url: "http://truyentuan.com/kengan-ashua-zero-atula/" }, { label: "6 Giờ Ký Ức", value: "6 Giờ Ký Ức", url: "http://truyentuan.com/6-gio-ky-uc/" }, { label: "Yêu Túc Sơn", value: "Yêu Túc Sơn", url: "http://truyentuan.com/yeu-tuc-son/" }, { label: "Bungou Stray Dogs Wan!", value: "Bungou Stray Dogs Wan!", url: "http://truyentuan.com/bungou-stray-dogs-wan/" }, { label: "Nhân Ngẫu Đế Quốc", value: "Nhân Ngẫu Đế Quốc", url: "http://truyentuan.com/nhan-ngau-de-quoc/" }, { label: "Thật khó để yêu một Otaku", value: "Thật khó để yêu một Otaku", url: "http://truyentuan.com/that-kho-de-yeu-mot-otaku/" }, { label: "Trọng Sinh Chi Hao Môn Cường Thế Quy Lai", value: "Trọng Sinh Chi Hao Môn Cường Thế Quy Lai", url: "http://truyentuan.com/trong-sinh-chi-hao-mon-cuong-the-quy-lai/" }, { label: "The Dragon Next Door - Hàng Xóm Của Tôi Là Rồng", value: "The Dragon Next Door - Hàng Xóm Của Tôi Là Rồng", url: "http://truyentuan.com/the-dragon-next-door-hang-xom-cua-toi-la-rong/" }, { label: "Shortcake Cake", value: "Shortcake Cake", url: "http://truyentuan.com/shortcake-cake/" }, { label: "Kine san no 1 ri de Cinema", value: "Kine san no 1 ri de Cinema", url: "http://truyentuan.com/kine-san-no-1-ri-de-cinema/" }, { label: "FPS - Trò chơi hỗn loạn", value: "FPS - Trò chơi hỗn loạn", url: "http://truyentuan.com/fps-tro-choi-hon-loan/" }, { label: "Sinh Tử Thư Kích", value: "Sinh Tử Thư Kích", url: "http://truyentuan.com/sinh-tu-thu-kich/" }, { label: "Terra Formars Gaiden - Asimov", value: "Terra Formars Gaiden - Asimov", url: "http://truyentuan.com/terra-formars-gaiden-asimov/" }, { label: "Ookami ni Kuchizuke", value: "Ookami ni Kuchizuke", url: "http://truyentuan.com/ookami-ni-kuchizuke/" }, { label: "Fukigen na Mononokean", value: "Fukigen na Mononokean", url: "http://truyentuan.com/fukigen-na-mononokean/" }, { label: "Đấu Chiến Ma", value: "Đấu Chiến Ma", url: "http://truyentuan.com/dau-chien-ma/" }, { label: "Shokuryou Jinrui", value: "Shokuryou Jinrui", url: "http://truyentuan.com/shokuryou-jinrui/" }, { label: "Assassin's Pride", value: "Assassin's Pride", url: "http://truyentuan.com/assassins-pride/" }, { label: "VERSUS THE EARTH", value: "VERSUS THE EARTH", url: "http://truyentuan.com/versus-the-earth/" }, { label: "Fate/Apocrypha", value: "Fate/Apocrypha", url: "http://truyentuan.com/fateapocrypha/" }, { label: "LV999 no Murabito", value: "LV999 no Murabito", url: "http://truyentuan.com/lv999-no-murabito/" }, { label: "Infinite Stratos: Black Bunny/White Bitter", value: "Infinite Stratos: Black Bunny/White Bitter", url: "http://truyentuan.com/infinite-stratos-black-bunnywhite-bitter/" }, { label: "Hakoniwa No Soleil", value: "Hakoniwa No Soleil", url: "http://truyentuan.com/hakoniwa-no-soleil/" }, { label: "Dạy Kèm Sau Giờ Học", value: "Dạy Kèm Sau Giờ Học", url: "http://truyentuan.com/day-kem-sau-gio-hoc/" }, { label: "Dokyuu Hentai HxEros", value: "Dokyuu Hentai HxEros", url: "http://truyentuan.com/dokyuu-hentai-hxeros/" }, { label: "Isekai Mahou wa Okureteru!", value: "Isekai Mahou wa Okureteru!", url: "http://truyentuan.com/isekai-mahou-wa-okureteru/" }, { label: "Sougou Tovarisch", value: "Sougou Tovarisch", url: "http://truyentuan.com/sougou-tovarisch/" }, { label: "Fight For Myself", value: "Fight For Myself", url: "http://truyentuan.com/fight-for-myself/" }, { label: "Suginami-ku Isekai Dungeon kouryaku-ka", value: "Suginami-ku Isekai Dungeon kouryaku-ka", url: "http://truyentuan.com/suginami-ku-isekai-dungeon-kouryaku-ka/" }, { label: "Hoshi to Kuzu", value: "Hoshi to Kuzu", url: "http://truyentuan.com/hoshi-to-kuzu/" }, { label: "Monkey Peak", value: "Monkey Peak", url: "http://truyentuan.com/monkey-peak/" }, { label: "Mahouka Koukou no Rettousei - Daburu Sebun Hen", value: "Mahouka Koukou no Rettousei - Daburu Sebun Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-daburu-sebun-hen/" }, { label: "Đại Ca Giang Hồ", value: "Đại Ca Giang Hồ", url: "http://truyentuan.com/dai-ca-giang-ho/" }, { label: "Xích Trụ Phạn Đường", value: "Xích Trụ Phạn Đường", url: "http://truyentuan.com/xich-tru-phan-duong/" }, { label: "Fulldrum", value: "Fulldrum", url: "http://truyentuan.com/fulldrum/" }, { label: "Kono Subarashii Sekai ni Bakuen wo!", value: "Kono Subarashii Sekai ni Bakuen wo!", url: "http://truyentuan.com/kono-subarashii-sekai-ni-bakuen-wo/" }, { label: "Thực Tập Sinh", value: "Thực Tập Sinh", url: "http://truyentuan.com/thuc-tap-sinh/" }, { label: "Ryle to Louis", value: "Ryle to Louis", url: "http://truyentuan.com/ryle-to-louis/" }, { label: "Kami to Yobareta Kyuuketsuki", value: "Kami to Yobareta Kyuuketsuki", url: "http://truyentuan.com/kami-to-yobareta-kyuuketsuki/" }, { label: "Sono Mono. Nochi ni", value: "Sono Mono. Nochi ni", url: "http://truyentuan.com/sono-mono-nochi-ni/" }, { label: "Tensei Shitara Suraimuda", value: "Tensei Shitara Suraimuda", url: "http://truyentuan.com/tensei-shitara-suraimuda/" }, { label: "Catulus Syndrome", value: "Catulus Syndrome", url: "http://truyentuan.com/catulus-syndrome/" }, { label: "S Watari-san to M Mura-kun", value: "S Watari-san to M Mura-kun", url: "http://truyentuan.com/s-watari-san-to-m-mura-kun/" }, { label: "Happy If You Died", value: "Happy If You Died", url: "http://truyentuan.com/happy-if-you-died/" }, { label: "Hinmin Choujin Kanenashi-kun", value: "Hinmin Choujin Kanenashi-kun", url: "http://truyentuan.com/hinmin-choujin-kanenashi-kun/" }, { label: "Ashita, Kimi ni Aetara", value: "Ashita, Kimi ni Aetara", url: "http://truyentuan.com/ashita-kimi-ni-aetara/" }, { label: "Girigiri Out", value: "Girigiri Out", url: "http://truyentuan.com/girigiri-out/" }, { label: "Osake wa Fuufu ni Natte Kara", value: "Osake wa Fuufu ni Natte Kara", url: "http://truyentuan.com/osake-wa-fuufu-ni-natte-kara/" }, { label: "Huyền Vũ Luyến Ca: Vạn Vật Sinh Linh", value: "Huyền Vũ Luyến Ca: Vạn Vật Sinh Linh", url: "http://truyentuan.com/huyen-vu-luyen-ca-van-vat-sinh-linh/" }, { label: "Ao no Flag", value: "Ao no Flag", url: "http://truyentuan.com/ao-no-flag/" }, { label: "Isekai wa Smartphone to Tomoni", value: "Isekai wa Smartphone to Tomoni", url: "http://truyentuan.com/isekai-wa-smartphone-to-tomoni/" }, { label: "S Rare Soubi no Niau Kanojo", value: "S Rare Soubi no Niau Kanojo", url: "http://truyentuan.com/s-rare-soubi-no-niau-kanojo/" }, { label: "Toàn Cơ Tử", value: "Toàn Cơ Tử", url: "http://truyentuan.com/toan-co-tu/" }, { label: "Mahouka Koukou no Rettousei - Kyuukousen Hen", value: "Mahouka Koukou no Rettousei - Kyuukousen Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-kyuukousen-hen/" }, { label: "Magan & Danai", value: "Magan & Danai", url: "http://truyentuan.com/magan-danai/" }, { label: "Kokukoku", value: "Kokukoku", url: "http://truyentuan.com/kokukoku/" }, { label: "Hoenkan Evans no Uso", value: "Hoenkan Evans no Uso", url: "http://truyentuan.com/hoenkan-evans-no-uso/" }, { label: "Devilchi", value: "Devilchi", url: "http://truyentuan.com/devilchi/" }, { label: "Tam Sinh Tam Thế - Thập Lý Đào Hoa", value: "Tam Sinh Tam Thế - Thập Lý Đào Hoa", url: "http://truyentuan.com/tam-sinh-tam-the-thap-ly-dao-hoa/" }, { label: "Tensei Shitara Kendeshita", value: "Tensei Shitara Kendeshita", url: "http://truyentuan.com/tensei-shitara-kendeshita/" }, { label: "Soul Catcher(S)", value: "Soul Catcher(S)", url: "http://truyentuan.com/soul-catchers/" }, { label: "Ayakashiko", value: "Ayakashiko", url: "http://truyentuan.com/ayakashiko-2/" }, { label: "Goblin Wa Mou Juubun Ni Tsuyoi", value: "Goblin Wa Mou Juubun Ni Tsuyoi", url: "http://truyentuan.com/goblin-wa-mou-juubun-ni-tsuyoi/" }, { label: "Mahouka Koukou No Rettousei - Tsuioku Hen", value: "Mahouka Koukou No Rettousei - Tsuioku Hen", url: "http://truyentuan.com/mahouka-koukou-no-rettousei-tsuioku-hen/" }, { label: "Murabito Desu Ga Nani Ka?", value: "Murabito Desu Ga Nani Ka?", url: "http://truyentuan.com/murabito-desu-ga-nani-ka/" }, { label: "Ookumo-chan Flashback", value: "Ookumo-chan Flashback", url: "http://truyentuan.com/ookumo-chan-flashback/" }, { label: "Made in Abyss", value: "Made in Abyss", url: "http://truyentuan.com/made-in-abyss/" }, { label: "Rental Onii-chan", value: "Rental Onii-chan", url: "http://truyentuan.com/rental-onii-chan/" }, { label: "Yuzumori-san", value: "Yuzumori-san", url: "http://truyentuan.com/yuzumori-san/" }, { label: "Gặp Em Trong Tương Lai", value: "Gặp Em Trong Tương Lai", url: "http://truyentuan.com/gap-em-trong-tuong-lai/" }, { label: "Komatsubara ga Koibito ni Naritasou ni Kochira o Miteiru!", value: "Komatsubara ga Koibito ni Naritasou ni Kochira o Miteiru!", url: "http://truyentuan.com/komatsubara-ga-koibito-ni-naritasou-ni-kochira-o-miteiru-2/" }, { label: "Atsumare! Fushigi Kenkyuubu", value: "Atsumare! Fushigi Kenkyuubu", url: "http://truyentuan.com/atsumare-fushigi-kenkyuubu/" }, { label: "Going in the Wrong Direction", value: "Going in the Wrong Direction", url: "http://truyentuan.com/going-in-the-wrong-direction/" }, { label: "Bocchiman", value: "Bocchiman", url: "http://truyentuan.com/bocchiman/" }, { label: "Kyo Kara Zombie", value: "Kyo Kara Zombie", url: "http://truyentuan.com/kyo-kara-zombie/" }, { label: "Shingeki No Kyojin - Lost Girls", value: "Shingeki No Kyojin - Lost Girls", url: "http://truyentuan.com/shingeki-no-kyojin-lost-girls/" }, { label: "Tsumi Koi", value: "Tsumi Koi", url: "http://truyentuan.com/tsumi-koi/" }, { label: "Genjitsushugisha no Oukokukaizouki", value: "Genjitsushugisha no Oukokukaizouki", url: "http://truyentuan.com/genjitsushugisha-no-oukokukaizouki/" }, { label: "Isekai Meikyuu de Harem o", value: "Isekai Meikyuu de Harem o", url: "http://truyentuan.com/isekai-meikyuu-de-harem-o/" }, { label: "Munou na Nana", value: "Munou na Nana", url: "http://truyentuan.com/munou-na-nana/" }, { label: "SOMALI TO MORI NO KAMI-SAMA", value: "SOMALI TO MORI NO KAMI-SAMA", url: "http://truyentuan.com/somali-to-mori-no-kami-sama/" }, { label: "Kimi no Suizou wo Tabetai", value: "Kimi no Suizou wo Tabetai", url: "http://truyentuan.com/kimi-no-suizou-wo-tabetai/" }, { label: "Seigi no Mikata", value: "Seigi no Mikata", url: "http://truyentuan.com/seigi-no-mikata/" }, { label: "Killer meet girl", value: "Killer meet girl", url: "http://truyentuan.com/killer-meet-girl/" }, { label: "Spirit Circle", value: "Spirit Circle", url: "http://truyentuan.com/spirit-circle/" }, { label: "Mei no Maiden", value: "Mei no Maiden", url: "http://truyentuan.com/mei-no-maiden/" }, { label: "Ryuuou no Oshigoto!", value: "Ryuuou no Oshigoto!", url: "http://truyentuan.com/ryuuou-no-oshigoto/" }, { label: "Isekai Yakkyoku", value: "Isekai Yakkyoku", url: "http://truyentuan.com/isekai-yakkyoku/" }, { label: "Seifuku no Vampireslod", value: "Seifuku no Vampireslod", url: "http://truyentuan.com/seifuku-no-vampireslod/" }, { label: "ALMADIANOS EIYUUDEN", value: "ALMADIANOS EIYUUDEN", url: "http://truyentuan.com/almadianos-eiyuuden/" }, { label: "Coulomb File", value: "Coulomb File", url: "http://truyentuan.com/coulomb-file/" }, { label: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e", value: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e", url: "http://truyentuan.com/youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e/" }, { label: "Sayonara Ryuusei, Konnichiwa Jinsei", value: "Sayonara Ryuusei, Konnichiwa Jinsei", url: "http://truyentuan.com/sayonara-ryuusei-konnichiwa-jinsei/" }, { label: "Futsuu no Koiko-chan", value: "Futsuu no Koiko-chan", url: "http://truyentuan.com/futsuu-no-koiko-chan/" }, { label: "Raisekamika", value: "Raisekamika", url: "http://truyentuan.com/raisekamika/" }, { label: "Tui là Busamen!", value: "Tui là Busamen!", url: "http://truyentuan.com/tui-la-busamen/" }, { label: "Ane no Onaka o Fukuramaseru wa Boku", value: "Ane no Onaka o Fukuramaseru wa Boku", url: "http://truyentuan.com/ane-no-onaka-o-fukuramaseru-wa-boku/" }, { label: "Cô bạn ác quỷ - Devilchi", value: "Cô bạn ác quỷ - Devilchi", url: "http://truyentuan.com/co-ban-ac-quy-devilchi/" }, { label: "Isekai wo Seigyo Mahou de Kirihirake", value: "Isekai wo Seigyo Mahou de Kirihirake", url: "http://truyentuan.com/isekai-wo-seigyo-mahou-de-kirihirake/" }, { label: "ACCA: Jusan-ku Kansatsu-ka", value: "ACCA: Jusan-ku Kansatsu-ka", url: "http://truyentuan.com/acca-jusan-ku-kansatsu-ka/" }, { label: "TONDEMO SKILL DE ISEKAI HOUROU MESHI", value: "TONDEMO SKILL DE ISEKAI HOUROU MESHI", url: "http://truyentuan.com/tondemo-skill-de-isekai-hourou-meshi/" }, { label: "Gaishuu Isshoku", value: "Gaishuu Isshoku", url: "http://truyentuan.com/gaishuu-isshoku/" }, { label: "Moee-chan wa Ki ni Shinai", value: "Moee-chan wa Ki ni Shinai", url: "http://truyentuan.com/moee-chan-wa-ki-ni-shinai/" }, { label: "Dennou Kakugi Mephisto Waltz", value: "Dennou Kakugi Mephisto Waltz", url: "http://truyentuan.com/dennou-kakugi-mephisto-waltz/" }, { label: "Tỏa Long", value: "Tỏa Long", url: "http://truyentuan.com/toa-long/" }, { label: "Shunkan Gradation", value: "Shunkan Gradation", url: "http://truyentuan.com/shunkan-gradation/" }, { label: "Ubau Mono Ubawareru Mono", value: "Ubau Mono Ubawareru Mono", url: "http://truyentuan.com/ubau-mono-ubawareru-mono/" }, { label: "Isekai Onsen ni Tensei shita Ore no Kounou ga Tondemosugiru", value: "Isekai Onsen ni Tensei shita Ore no Kounou ga Tondemosugiru", url: "http://truyentuan.com/isekai-onsen-ni-tensei-shita-ore-no-kounou-ga-tondemosugiru/" }, { label: "JOJO’S BIZARRE ADVENTURE PART 7: Steel Ball Run", value: "JOJO’S BIZARRE ADVENTURE PART 7: Steel Ball Run", url: "http://truyentuan.com/jojos-bizarre-adventure-part-7-steel-ball-run/" }, { label: "KOBAYASHI-SAN CHI NO MAID DRAGON: KANNA NO NICHIJOU", value: "KOBAYASHI-SAN CHI NO MAID DRAGON: KANNA NO NICHIJOU", url: "http://truyentuan.com/kobayashi-san-chi-no-maid-dragon-kanna-no-nichijou/" }, { label: "Hoshikuzu no Sorakil", value: "Hoshikuzu no Sorakil", url: "http://truyentuan.com/hoshikuzu-no-sorakil/" }, { label: "YANKEE WA ISEKAI DE SEIREI NI AISAREMASU", value: "YANKEE WA ISEKAI DE SEIREI NI AISAREMASU", url: "http://truyentuan.com/yankee-wa-isekai-de-seirei-ni-aisaremasu/" }, { label: "Baby, Kokoro no Mama ni!", value: "Baby, Kokoro no Mama ni!", url: "http://truyentuan.com/baby-kokoro-no-mama-ni/" }, { label: "Chuuko demo Koi ga Shitai!", value: "Chuuko demo Koi ga Shitai!", url: "http://truyentuan.com/chuuko-demo-koi-ga-shitai/" }, { label: "YUUSHA NO MAGO TO MAOU NO MUSUME", value: "YUUSHA NO MAGO TO MAOU NO MUSUME", url: "http://truyentuan.com/yuusha-no-mago-to-maou-no-musume/" }, { label: "Tenshou no Quadrable", value: "Tenshou no Quadrable", url: "http://truyentuan.com/tenshou-no-quadrable/" }, { label: "YASEI NO LAST BOSS GA ARAWARETA", value: "YASEI NO LAST BOSS GA ARAWARETA", url: "http://truyentuan.com/yasei-no-last-boss-ga-arawareta/" }, { label: "Devil's Line", value: "Devil's Line", url: "http://truyentuan.com/devils-line/" }, { label: "Aku no Meshitsukai", value: "Aku no Meshitsukai", url: "http://truyentuan.com/aku-no-meshitsukai/" }, { label: "THE WRONG WAY TO USE HEALING MAGIC", value: "THE WRONG WAY TO USE HEALING MAGIC", url: "http://truyentuan.com/the-wrong-way-to-use-healing-magic/" }, { label: "Aposimz", value: "Aposimz", url: "http://truyentuan.com/aposimz/" }, { label: "Miracle! Hero-nim", value: "Miracle! Hero-nim", url: "http://truyentuan.com/miracle-hero-nim/" }, { label: "Jigoku no Enra", value: "Jigoku no Enra", url: "http://truyentuan.com/jigoku-no-enra/" }, { label: "Youkai Apartment no Yuuga na Nichijou", value: "Youkai Apartment no Yuuga na Nichijou", url: "http://truyentuan.com/youkai-apartment-no-yuuga-na-nichijou/" }, { label: "Nijiiro Secret", value: "Nijiiro Secret", url: "http://truyentuan.com/nijiiro-secret/" }, { label: "Black Lily to White Yuri", value: "Black Lily to White Yuri", url: "http://truyentuan.com/black-lily-to-white-yuri/" }, { label: "P to JK", value: "P to JK", url: "http://truyentuan.com/p-to-jk/" }, { label: "Misumaruka Koukoku Monogatari", value: "Misumaruka Koukoku Monogatari", url: "http://truyentuan.com/misumaruka-koukoku-monogatari/" }, { label: "Koi to Untatane", value: "Koi to Untatane", url: "http://truyentuan.com/koi-to-untatane/" }, { label: "Saikyou Mahoushi no Inton Keikaku", value: "Saikyou Mahoushi no Inton Keikaku", url: "http://truyentuan.com/saikyou-mahoushi-no-inton-keikaku/" }, { label: "Tenseishichatta yo (Iya, Gomen)", value: "Tenseishichatta yo (Iya, Gomen)", url: "http://truyentuan.com/tenseishichatta-yo-iya-gomen/" }, { label: "Tenseishichatta yo", value: "Tenseishichatta yo", url: "http://truyentuan.com/tenseishichatta-yo/" }, { label: "Battle Mexia", value: "Battle Mexia", url: "http://truyentuan.com/battle-mexia/" }, { label: "Shitei Bouryoku Shoujo Shiomi-chan", value: "Shitei Bouryoku Shoujo Shiomi-chan", url: "http://truyentuan.com/shitei-bouryoku-shoujo-shiomi-chan/" }, { label: "Sekai ka Kanojo ka Erabenai", value: "Sekai ka Kanojo ka Erabenai", url: "http://truyentuan.com/sekai-ka-kanojo-ka-erabenai/" }, { label: "Marry Me!", value: "Marry Me!", url: "http://truyentuan.com/marry-me/" }, { label: "Vô Gián Ngục", value: "Vô Gián Ngục", url: "http://truyentuan.com/vo-gian-nguc/" }, { label: "Soushi Souai", value: "Soushi Souai", url: "http://truyentuan.com/soushi-souai/" }, { label: "Mairimashita, senpai!", value: "Mairimashita, senpai!", url: "http://truyentuan.com/mairimashita-senpai/" }, { label: "Taisho Wotome Otogibanashi Taisho Wotome Otogibanashi", value: "Taisho Wotome Otogibanashi Taisho Wotome Otogibanashi", url: "http://truyentuan.com/taisho-wotome-otogibanashi-taisho-wotome-otogibanashi/" }, { label: "Anitomo", value: "Anitomo", url: "http://truyentuan.com/anitomo/" }, { label: "Densetsu no Yuusha no Konkatsu", value: "Densetsu no Yuusha no Konkatsu", url: "http://truyentuan.com/densetsu-no-yuusha-no-konkatsu/" }, { label: "Chuyến hành trình tươi đẹp của Kino", value: "Chuyến hành trình tươi đẹp của Kino", url: "http://truyentuan.com/chuyen-hanh-trinh-tuoi-dep-cua-kino/" }, { label: "Met My Sister on a Dating site", value: "Met My Sister on a Dating site", url: "http://truyentuan.com/met-my-sister-on-a-dating-site/" }, { label: "Ecstas Online", value: "Ecstas Online", url: "http://truyentuan.com/ecstas-online/" }, { label: "Sayonara Piano Sonata", value: "Sayonara Piano Sonata", url: "http://truyentuan.com/sayonara-piano-sonata/" }, { label: "Hỏa Hồng Niên Đại Hắc Cốt Đường", value: "Hỏa Hồng Niên Đại Hắc Cốt Đường", url: "http://truyentuan.com/hoa-hong-nien-dai-hac-cot-duong/" }, { label: "FGO Doujinshi - Chiến Trường Bữa Tối Tuyệt Đối - Altria -", value: "FGO Doujinshi - Chiến Trường Bữa Tối Tuyệt Đối - Altria -", url: "http://truyentuan.com/zettai-gohan-sensen-artoria/" }, { label: "Ichigo 100% - East Side Story", value: "Ichigo 100% - East Side Story", url: "http://truyentuan.com/ichigo-100-east-side-story/" }, { label: "Watashi Wa Tensai O Katte Iru", value: "Watashi Wa Tensai O Katte Iru", url: "http://truyentuan.com/watashi-wa-tensai-o-katte-iru/" }, { label: "Isekai Cheat Magician", value: "Isekai Cheat Magician", url: "http://truyentuan.com/isekai-cheat-magician/" }, { label: "Historie", value: "Historie", url: "http://truyentuan.com/historie/" }, { label: "Buddy go!", value: "Buddy go!", url: "http://truyentuan.com/buddy-go/" }, { label: "Sword Art Online: Aincrad Night of Kirito", value: "Sword Art Online: Aincrad Night of Kirito", url: "http://truyentuan.com/sword-art-online-aincrad-night-of-kirito/" }, { label: "Hào Môn Thiên Giới Tiền Thê", value: "Hào Môn Thiên Giới Tiền Thê", url: "http://truyentuan.com/hao-mon-thien-gioi-tien-the/" }, { label: "Nonbiri VRMMOki", value: "Nonbiri VRMMOki", url: "http://truyentuan.com/nonbiri-vrmmoki/" }, { label: "Curse Blood", value: "Curse Blood", url: "http://truyentuan.com/curse-blood/" }, { label: "Champions", value: "Champions", url: "http://truyentuan.com/champions/" }, { label: "Absolute Duo", value: "Absolute Duo", url: "http://truyentuan.com/absolute-duo/" }, { label: "Xuyên không với chế độ GodMode", value: "Xuyên không với chế độ GodMode", url: "http://truyentuan.com/xuyen-khong-voi-che-do-godmode/" }, { label: "Wonderland", value: "Wonderland", url: "http://truyentuan.com/wonderland-2/" }, { label: "Hinowa ga Yuku!", value: "Hinowa ga Yuku!", url: "http://truyentuan.com/hinowa-ga-yuku/" }, { label: "Kanojo ni Naru Hi", value: "Kanojo ni Naru Hi", url: "http://truyentuan.com/kanojo-ni-naru-hi/" }, { label: "Huyền Giới Chi Môn", value: "Huyền Giới Chi Môn", url: "http://truyentuan.com/huyen-gioi-chi-mon/" }, { label: "Đấu Phá Thương Khung Tiền Truyện - Dược Lão Truyền Kỳ", value: "Đấu Phá Thương Khung Tiền Truyện - Dược Lão Truyền Kỳ", url: "http://truyentuan.com/dau-pha-thuong-khung-tien-truyen-duoc-lao-truyen-ky/" }, { label: "Đấu phá thương khung Ngoại Truyện - Dược Lão Truyền Kỳ Season 2", value: "Đấu phá thương khung Ngoại Truyện - Dược Lão Truyền Kỳ Season 2", url: "http://truyentuan.com/dau-pha-thuong-khung-ngoai-truyen-duoc-lao-truyen-ky-season-2/" }, { label: "Naka no Hito Genome [Jikkyouchuu]", value: "Naka no Hito Genome [Jikkyouchuu]", url: "http://truyentuan.com/naka-no-hito-genome-jikkyouchuu/" }, { label: "ACCA - Cục Thanh Tra 13 Bang", value: "ACCA - Cục Thanh Tra 13 Bang", url: "http://truyentuan.com/acca-cuc-thanh-tra-13-bang/" }, { label: "Anayashi", value: "Anayashi", url: "http://truyentuan.com/anayashi/" }, { label: "Danh Môn Thiên Hậu", value: "Danh Môn Thiên Hậu", url: "http://truyentuan.com/danh-mon-thien-hau/" }, { label: "Kimi to Wonderland", value: "Kimi to Wonderland", url: "http://truyentuan.com/kimi-to-wonderland/" }, { label: "Ikenie Touhyou", value: "Ikenie Touhyou", url: "http://truyentuan.com/ikenie-touhyou/" }, { label: "Mayonaka no Stellarium", value: "Mayonaka no Stellarium", url: "http://truyentuan.com/mayonaka-no-stellarium/" }, { label: "Tsuiraku Jk To Haijin Kyoushi", value: "Tsuiraku Jk To Haijin Kyoushi", url: "http://truyentuan.com/tsuiraku-jk-to-haijin-kyoushi/" }, { label: "Arifureta Shokugyou de Sekai Saikyou", value: "Arifureta Shokugyou de Sekai Saikyou", url: "http://truyentuan.com/arifureta-shokugyou-de-sekai-saikyou/" }, { label: "Thịnh Thế An Nhiên", value: "Thịnh Thế An Nhiên", url: "http://truyentuan.com/thinh-the-an-nhien/" }, { label: "Fate/Grand Order-mortalis:stella", value: "Fate/Grand Order-mortalis:stella", url: "http://truyentuan.com/fategrand-order-mortalisstella/" }, { label: "Cold Moon Chronicles -Biên niên sử lãnh nguyệt", value: "Cold Moon Chronicles -Biên niên sử lãnh nguyệt", url: "http://truyentuan.com/cold-moon-chronicles-bien-nien-su-lanh-nguyet/" }, { label: "Hitorijime Chokyo Ganbo", value: "Hitorijime Chokyo Ganbo", url: "http://truyentuan.com/hitorijime-chokyo-ganbo/" }, { label: "Ikusa x Koi", value: "Ikusa x Koi", url: "http://truyentuan.com/ikusa-x-koi/" }, { label: "Cửu Tinh Thiên Thần Quyết", value: "Cửu Tinh Thiên Thần Quyết", url: "http://truyentuan.com/cuu-tinh-thien-than-quyet/" }, { label: "Huyền Hạo Chiến Kí", value: "Huyền Hạo Chiến Kí", url: "http://truyentuan.com/huyen-hao-chien-ki/" }, { label: "Gaikotsu kishi-sama, tadaima isekai e o dekake-chuu", value: "Gaikotsu kishi-sama, tadaima isekai e o dekake-chuu", url: "http://truyentuan.com/gaikotsu-kishi-sama-tadaima-isekai-e-o-dekake-chuu/" }, { label: "Sakura to Sensei", value: "Sakura to Sensei", url: "http://truyentuan.com/sakura-to-sensei/" }, { label: "Rurouni Kenshin Hokkai Arc", value: "Rurouni Kenshin Hokkai Arc", url: "http://truyentuan.com/rurouni-kenshin-hokkai-arc/" }, { label: "Violence Action", value: "Violence Action", url: "http://truyentuan.com/violence-action/" }, { label: "Hakase no Kimagure Homunculus", value: "Hakase no Kimagure Homunculus", url: "http://truyentuan.com/hakase-no-kimagure-homunculus/" }, { label: "Fate/Grand Order -turas realta-", value: "Fate/Grand Order -turas realta-", url: "http://truyentuan.com/fategrand-order-turas-realta/" }, { label: "Rengoku ni Warau", value: "Rengoku ni Warau", url: "http://truyentuan.com/rengoku-ni-warau/" }, { label: "Migiko Nippon ichi", value: "Migiko Nippon ichi", url: "http://truyentuan.com/migiko-nippon-ichi/" }, { label: "Gakuen Rule Kaikaku", value: "Gakuen Rule Kaikaku", url: "http://truyentuan.com/gakuen-rule-kaikaku/" }, { label: "Trọng Sinh Chi Tinh Quang Thôi Xán", value: "Trọng Sinh Chi Tinh Quang Thôi Xán", url: "http://truyentuan.com/trong-sinh-chi-tinh-quang-thoi-xan/" }, { label: "Ma Cà Rồng, lập tức đi đời", value: "Ma Cà Rồng, lập tức đi đời", url: "http://truyentuan.com/ma-ca-rong-lap-tuc-di-doi/" }, { label: "HIGH&LOW G-SWORD", value: "HIGH&LOW G-SWORD", url: "http://truyentuan.com/highlow-g-sword/" }, { label: "Tạp Đồ", value: "Tạp Đồ", url: "http://truyentuan.com/tap-do/" }, { label: "Kanojo, Okarishimasu", value: "Kanojo, Okarishimasu", url: "http://truyentuan.com/kanojo-okarishimasu/" }, { label: "Uchiage Hanabi, Shita Kara Miru Ka? Yoko Kara Miru Ka?", value: "Uchiage Hanabi, Shita Kara Miru Ka? Yoko Kara Miru Ka?", url: "http://truyentuan.com/uchiage-hanabi-shita-kara-miru-ka-yoko-kara-miru-ka/" }, { label: "Gunner", value: "Gunner", url: "http://truyentuan.com/gunner/" }, { label: "Owari no Seraph: Ichinose Guren, Sự diệt vong năm 16 tuổi", value: "Owari no Seraph: Ichinose Guren, Sự diệt vong năm 16 tuổi", url: "http://truyentuan.com/owari-no-seraph-ichinose-guren-su-diet-vong-nam-16-tuoi/" }, { label: "neko musume michikusa nikki", value: "neko musume michikusa nikki", url: "http://truyentuan.com/neko-musume-michikusa-nikki/" }, { label: "Otome Danshi ni Koisuru Otome", value: "Otome Danshi ni Koisuru Otome", url: "http://truyentuan.com/otome-danshi-ni-koisuru-otome/" }, { label: "Neet-chan", value: "Neet-chan", url: "http://truyentuan.com/neet-chan/" }, { label: "Daidai wa, Hantoumei ni Nidone suru", value: "Daidai wa, Hantoumei ni Nidone suru", url: "http://truyentuan.com/daidai-wa-hantoumei-ni-nidone-suru/" }, { label: "Mật Mã Không Xác Định", value: "Mật Mã Không Xác Định", url: "http://truyentuan.com/mat-ma-khong-xac-dinh/" }, { label: "Moujuusei Shounen Shoujo", value: "Moujuusei Shounen Shoujo", url: "http://truyentuan.com/moujuusei-shounen-shoujo/" }, { label: "Lời Nguyền Lâu Lan : Bạo Quân Hung Ác Sủng Ái Ta", value: "Lời Nguyền Lâu Lan : Bạo Quân Hung Ác Sủng Ái Ta", url: "http://truyentuan.com/loi-nguyen-lau-lan-bao-quan-hung-ac-sung-ai-ta/" }, { label: "Chotto Ippai!", value: "Chotto Ippai!", url: "http://truyentuan.com/chotto-ippai/" }, { label: "Kimi ga Shinu Natsu ni", value: "Kimi ga Shinu Natsu ni", url: "http://truyentuan.com/kimi-ga-shinu-natsu-ni/" }, { label: "Hakata-ben no Onnanoko wa Kawaii to Omoimasen ka?", value: "Hakata-ben no Onnanoko wa Kawaii to Omoimasen ka?", url: "http://truyentuan.com/hakata-ben-no-onnanoko-wa-kawaii-to-omoimasen-ka/" }, { label: "Hồ Sơ của Lord El-Melloi II", value: "Hồ Sơ của Lord El-Melloi II", url: "http://truyentuan.com/ho-so-cua-lord-el-melloi-ii/" }, { label: "Higurashi no Naku Koro ni - Onikakushi Hen", value: "Higurashi no Naku Koro ni - Onikakushi Hen", url: "http://truyentuan.com/higurashi-no-naku-koro-ni-onikakushi-hen/" }, { label: "Tây Du Ký Ngoại Truyện", value: "Tây Du Ký Ngoại Truyện", url: "http://truyentuan.com/tay-du-ky-ngoai-truyen/" }, { label: "Nejimaki Seirei Senki - Tenkyou no Alderamin", value: "Nejimaki Seirei Senki - Tenkyou no Alderamin", url: "http://truyentuan.com/nejimaki-seirei-senki-tenkyou-no-alderamin/" }, { label: "Túc Tội Chi Ca", value: "Túc Tội Chi Ca", url: "http://truyentuan.com/tuc-toi-chi-ca/" }, { label: "Tensei Shitara Slime Datta Ken: Mabutsu no Kuni no Arukikata", value: "Tensei Shitara Slime Datta Ken: Mabutsu no Kuni no Arukikata", url: "http://truyentuan.com/tensei-shitara-slime-datta-ken-mabutsu-no-kuni-no-arukikata/" }, { label: "Cross Account", value: "Cross Account", url: "http://truyentuan.com/cross-account/" }, { label: "SLOW MOTION WO MOU ICHIDO", value: "SLOW MOTION WO MOU ICHIDO", url: "http://truyentuan.com/slow-motion-wo-mou-ichido/" }, { label: "Shin Seiki Evangelion", value: "Shin Seiki Evangelion", url: "http://truyentuan.com/shin-seiki-evangelion/" }, { label: "Bạch Môn Ngũ Giáp", value: "Bạch Môn Ngũ Giáp", url: "http://truyentuan.com/bach-mon-ngu-giap/" }, { label: "Dungeon Seeker", value: "Dungeon Seeker", url: "http://truyentuan.com/dungeon-seeker/" }, { label: "Yugioh Arc V", value: "Yugioh Arc V", url: "http://truyentuan.com/yugioh-arc-v/" }, { label: "Truyền Nhân Atula Phần 3", value: "Truyền Nhân Atula Phần 3", url: "http://truyentuan.com/truyen-nhan-atula-phan-3/" }, { label: "Iroha to Boku to", value: "Iroha to Boku to", url: "http://truyentuan.com/iroha-to-boku-to/" }, { label: "Harapeko no Marie", value: "Harapeko no Marie", url: "http://truyentuan.com/harapeko-no-marie/" }, { label: "Chihaya-san Wa Sono Mama De Ii", value: "Chihaya-san Wa Sono Mama De Ii", url: "http://truyentuan.com/chihaya-san-wa-sono-mama-de-ii/" }, { label: "Tuyết Ưng Lĩnh Chủ", value: "Tuyết Ưng Lĩnh Chủ", url: "http://truyentuan.com/tuyet-ung-linh-chu/" }, { label: "Akame ga KILL! ZERO", value: "Akame ga KILL! ZERO", url: "http://truyentuan.com/akame-ga-kill-zero/" }, { label: "AT LEAST, LIKE THAT SNOW", value: "AT LEAST, LIKE THAT SNOW", url: "http://truyentuan.com/at-least-like-that-snow/" }, { label: "Soukai no eve", value: "Soukai no eve", url: "http://truyentuan.com/soukai-no-eve/" }, { label: "Nano List", value: "Nano List", url: "http://truyentuan.com/nano-list/" }, { label: "Comic Studio", value: "Comic Studio", url: "http://truyentuan.com/comic-studio/" }, { label: "Magnet na Watashitachi", value: "Magnet na Watashitachi", url: "http://truyentuan.com/magnet-na-watashitachi/" }, { label: "Zipang", value: "Zipang", url: "http://truyentuan.com/zipang/" }, { label: "Tama-chen!!", value: "Tama-chen!!", url: "http://truyentuan.com/tama-chen/" }, { label: "Võ Thần Chúa Tể", value: "Võ Thần Chúa Tể", url: "http://truyentuan.com/vo-than-chua-te/" }, { label: "Shoujo shuumatsu ryokou", value: "Shoujo shuumatsu ryokou", url: "http://truyentuan.com/shoujo-shuumatsu-ryokou/" }, { label: "Vĩnh Hằng Chí Tôn", value: "Vĩnh Hằng Chí Tôn", url: "http://truyentuan.com/vinh-hang-chi-ton/" }, { label: "Linh Kiếm Tôn", value: "Linh Kiếm Tôn", url: "http://truyentuan.com/linh-kiem-ton/" }, { label: "Cuồng Thần", value: "Cuồng Thần", url: "http://truyentuan.com/cuong-than/" }, { label: "Houseki no Kuni", value: "Houseki no Kuni", url: "http://truyentuan.com/houseki-no-kuni/" }, { label: "Cực Phẩm Tu Chân Thiếu Niên", value: "Cực Phẩm Tu Chân Thiếu Niên", url: "http://truyentuan.com/cuc-pham-tu-chan-thieu-nien/" }, { label: "Thiên Thanh", value: "Thiên Thanh", url: "http://truyentuan.com/thien-thanh/" }, { label: "Linh Võ Đế Tôn", value: "Linh Võ Đế Tôn", url: "http://truyentuan.com/linh-vo-de-ton/" }, { label: "Ngự Niệm Sư", value: "Ngự Niệm Sư", url: "http://truyentuan.com/ngu-niem-su/" }, { label: "The End of Elysion", value: "The End of Elysion", url: "http://truyentuan.com/the-end-of-elysion/" }, { label: "Tiếu Ngạo Giang Hồ - Màu", value: "Tiếu Ngạo Giang Hồ - Màu", url: "http://truyentuan.com/tieu-ngao-giang-ho-mau/" }, { label: "Shirogane no Nina", value: "Shirogane no Nina", url: "http://truyentuan.com/shirogane-no-nina/" }, { label: "Ichinensei ni Nacchattara", value: "Ichinensei ni Nacchattara", url: "http://truyentuan.com/ichinensei-ni-nacchattara/" }, { label: "Boku Dake Shitteru Ichinomiya-san", value: "Boku Dake Shitteru Ichinomiya-san", url: "http://truyentuan.com/boku-dake-shitteru-ichinomiya-san/" }, { label: "Thành Phố Phù Thủy", value: "Thành Phố Phù Thủy", url: "http://truyentuan.com/thanh-pho-phu-thuy/" }, { label: "Bokutachi wa benkyou ga dekinai", value: "Bokutachi wa benkyou ga dekinai", url: "http://truyentuan.com/bokutachi-wa-benkyou-ga-dekinai/" }, { label: "Sasaki to Miyano", value: "Sasaki to Miyano", url: "http://truyentuan.com/sasaki-to-miyano/" }, { label: "Cạm bẫy của nữ thần", value: "Cạm bẫy của nữ thần", url: "http://truyentuan.com/cam-bay-cua-nu-than/" }, { label: "ISEKAI RYOURIDOU", value: "ISEKAI RYOURIDOU", url: "http://truyentuan.com/isekai-ryouridou/" }, { label: "Isekai Izakaya Nobu", value: "Isekai Izakaya Nobu", url: "http://truyentuan.com/isekai-izakaya-nobu/" }, { label: "Thí Thần", value: "Thí Thần", url: "http://truyentuan.com/thi-than/" }, { label: "Mikkakan no Koufuku", value: "Mikkakan no Koufuku", url: "http://truyentuan.com/mikkakan-no-koufuku/" }, { label: "Ai-Ren", value: "Ai-Ren", url: "http://truyentuan.com/ai-ren/" }, { label: "Thánh Tổ", value: "Thánh Tổ", url: "http://truyentuan.com/thanh-to/" }, { label: "Chung Quỳ Truyền Kỳ", value: "Chung Quỳ Truyền Kỳ", url: "http://truyentuan.com/chung-quy-truyen-ky/" }, { label: "Nguyên Tôn", value: "Nguyên Tôn", url: "http://truyentuan.com/nguyen-ton/" }, { label: "Tu Chân Nói Chuyện Phiếm Quần", value: "Tu Chân Nói Chuyện Phiếm Quần", url: "http://truyentuan.com/tu-chan-noi-chuyen-phiem-quan/" }, { label: "Golem Hearts", value: "Golem Hearts", url: "http://truyentuan.com/golem-hearts/" }, { label: "Trảm Đạo Kỷ", value: "Trảm Đạo Kỷ", url: "http://truyentuan.com/tram-dao-ky/" }, { label: "Jinrou Game", value: "Jinrou Game", url: "http://truyentuan.com/jinrou-game/" }, { label: "Karakai Jouzu no (Moto) Takagi-san", value: "Karakai Jouzu no (Moto) Takagi-san", url: "http://truyentuan.com/karakai-jouzu-no-moto-takagi-san/" }, { label: "Người Bảo Hộ Thần Thánh", value: "Người Bảo Hộ Thần Thánh", url: "http://truyentuan.com/nguoi-bao-ho-than-thanh/" }, { label: "Ma Thổi Đèn (Màu)", value: "Ma Thổi Đèn (Màu)", url: "http://truyentuan.com/ma-thoi-den-mau/" }, { label: "Sự trỗi dậy của Khiên Hiệp Sĩ", value: "Sự trỗi dậy của Khiên Hiệp Sĩ", url: "http://truyentuan.com/su-troi-day-cua-khien-hiep-si/" }, { label: "Giới Ma Nhân", value: "Giới Ma Nhân", url: "http://truyentuan.com/gioi-ma-nhan/" }, { label: "Misu Misou", value: "Misu Misou", url: "http://truyentuan.com/misu-misou/" }, { label: "Umineko no Naku Koro ni Chiru Episode 5: End of the Golden Witch", value: "Umineko no Naku Koro ni Chiru Episode 5: End of the Golden Witch", url: "http://truyentuan.com/umineko-no-naku-koro-ni-chiru-episode-5-end-of-the-golden-witch/" }, { label: "Hoshino,me O Tsubutte", value: "Hoshino,me O Tsubutte", url: "http://truyentuan.com/hoshinome-o-tsubutte/" }, { label: "Vạn Giới Tiên Tung", value: "Vạn Giới Tiên Tung", url: "http://truyentuan.com/van-gioi-tien-tung/" }, { label: "Hanikamu Honey", value: "Hanikamu Honey", url: "http://truyentuan.com/hanikamu-honey/" }, { label: "Bakemonogatari", value: "Bakemonogatari", url: "http://truyentuan.com/bakemonogatari/" }, { label: "Darling in the Franxx", value: "Darling in the Franxx", url: "http://truyentuan.com/darling-in-the-franxx/" }, { label: "Chư Thiên Ký", value: "Chư Thiên Ký", url: "http://truyentuan.com/chu-thien-ky/" }, { label: "Dosa", value: "Dosa", url: "http://truyentuan.com/dosa/" }, { label: "Toàn Chức Pháp Sư", value: "Toàn Chức Pháp Sư", url: "http://truyentuan.com/toan-chuc-phap-su/" }, { label: "ISEKAI DEATH GAME NI TENSOU SARETE TSURAI", value: "ISEKAI DEATH GAME NI TENSOU SARETE TSURAI", url: "http://truyentuan.com/isekai-death-game-ni-tensou-sarete-tsurai/" }, { label: "Quỷ Sai", value: "Quỷ Sai", url: "http://truyentuan.com/quy-sai/" }, { label: "Pumpkin Night", value: "Pumpkin Night", url: "http://truyentuan.com/pumpkin-night/" }, { label: "Captain Tsubasa : Golden 23", value: "Captain Tsubasa : Golden 23", url: "http://truyentuan.com/captain-tsubasa-golden-23/" }, { label: "Slime Taoshite 300-nen, Shiranai Uchi ni Level MAX ni Natteshimatta", value: "Slime Taoshite 300-nen, Shiranai Uchi ni Level MAX ni Natteshimatta", url: "http://truyentuan.com/slime-taoshite-300-nen-shiranai-uchi-ni-level-max-ni-natteshimatta/" }, { label: "Ojisama to Neko", value: "Ojisama to Neko", url: "http://truyentuan.com/ojisama-to-neko/" }, { label: "Orenchi no Maid-san", value: "Orenchi no Maid-san", url: "http://truyentuan.com/orenchi-no-maid-san/" }, { label: "PYGMALION", value: "PYGMALION", url: "http://truyentuan.com/pygmalion/" }, { label: "EDEN (TSURUOKA NOBUHISA)", value: "EDEN (TSURUOKA NOBUHISA)", url: "http://truyentuan.com/eden-tsuruoka-nobuhisa/" }, { label: "Vạn Cổ Kiếm Thần", value: "Vạn Cổ Kiếm Thần", url: "http://truyentuan.com/van-co-kiem-than/" }, { label: "Fairy Tail 100 year quest", value: "Fairy Tail 100 year quest", url: "http://truyentuan.com/fairy-tail-100-year-quest/" }, { label: "GIGANT", value: "GIGANT", url: "http://truyentuan.com/gigant/" }, { label: "Kiếm Nghịch Thương Khung", value: "Kiếm Nghịch Thương Khung", url: "http://truyentuan.com/kiem-nghich-thuong-khung/" }, { label: "Edens Zero", value: "Edens Zero", url: "http://truyentuan.com/edens-zero/" }, { label: "Hiệp sĩ đến từ vùng tận cùng của thế giới", value: "Hiệp sĩ đến từ vùng tận cùng của thế giới", url: "http://truyentuan.com/hiep-si-den-tu-vung-tan-cung-cua-the-gioi/" }, { label: "Kono Oto Tomare!", value: "Kono Oto Tomare!", url: "http://truyentuan.com/kono-oto-tomare/" }, { label: "Vua Sinh Tồn", value: "Vua Sinh Tồn", url: "http://truyentuan.com/vua-sinh-ton/" }, { label: "Catharsis", value: "Catharsis", url: "http://truyentuan.com/catharsis/" }, { label: "Life and Death", value: "Life and Death", url: "http://truyentuan.com/life-and-death/" }, { label: "Đồ Lục Tiên Ma", value: "Đồ Lục Tiên Ma", url: "http://truyentuan.com/do-luc-tien-ma/" }, { label: "Chiko-tan, Kowareru", value: "Chiko-tan, Kowareru", url: "http://truyentuan.com/chiko-tan-kowareru/" }, { label: "Banana Fish", value: "Banana Fish", url: "http://truyentuan.com/banana-fish/" }, { label: "Tiên Trụ", value: "Tiên Trụ", url: "http://truyentuan.com/tien-tru/" }, { label: "Death field", value: "Death field", url: "http://truyentuan.com/death-field/" }, { label: "Watashi ni Tenshi ga Maiorita!", value: "Watashi ni Tenshi ga Maiorita!", url: "http://truyentuan.com/watashi-ni-tenshi-ga-maiorita/" }, { label: "Thủ Mộ Bút Ký", value: "Thủ Mộ Bút Ký", url: "http://truyentuan.com/thu-mo-but-ky/" }, { label: "Quy Tự Dao", value: "Quy Tự Dao", url: "http://truyentuan.com/quy-tu-dao/" }, { label: "Cực Hạn Chi Địa", value: "Cực Hạn Chi Địa", url: "http://truyentuan.com/cuc-han-chi-dia/" }, { label: "Những Vụ Án Của Kindaichi Ở Tuổi 37", value: "Những Vụ Án Của Kindaichi Ở Tuổi 37", url: "http://truyentuan.com/nhung-vu-an-cua-kindaichi-o-tuoi-37/" }, { label: "Slime Life", value: "Slime Life", url: "http://truyentuan.com/slime-life/" }, { label: "Poputepipikku", value: "Poputepipikku", url: "http://truyentuan.com/poputepipikku/" }, { label: "Ore No Ie Ga Maryoku Spot Datta Ken: Sundeiru Dake De Sekai Saikyou", value: "Ore No Ie Ga Maryoku Spot Datta Ken: Sundeiru Dake De Sekai Saikyou", url: "http://truyentuan.com/ore-no-ie-ga-maryoku-spot-datta-ken-sundeiru-dake-de-sekai-saikyou/" }, { label: "Cuồng Đồ Tu Tiên", value: "Cuồng Đồ Tu Tiên", url: "http://truyentuan.com/cuong-do-tu-tien/" }, { label: "Yoru ni naru to Boku wa", value: "Yoru ni naru to Boku wa", url: "http://truyentuan.com/yoru-ni-naru-to-boku-wa/" }, { label: "Senpai ga Urusai Kouhai no Hanashi", value: "Senpai ga Urusai Kouhai no Hanashi", url: "http://truyentuan.com/senpai-ga-urusai-kouhai-no-hanashi/" }, { label: "Kawaiikereba Hentai demo Suki ni Natte Kuremasu ka?", value: "Kawaiikereba Hentai demo Suki ni Natte Kuremasu ka?", url: "http://truyentuan.com/kawaiikereba-hentai-demo-suki-ni-natte-kuremasu-ka/" }, { label: "Lessa 2: The Crimson Knight", value: "Lessa 2: The Crimson Knight", url: "http://truyentuan.com/lessa-2-the-crimson-knight/" }, { label: "Yêu Đạo Chí Tôn", value: "Yêu Đạo Chí Tôn", url: "http://truyentuan.com/yeu-dao-chi-ton/" }, { label: "Ngự Thiên", value: "Ngự Thiên", url: "http://truyentuan.com/ngu-thien/" }, { label: "Marry Grave", value: "Marry Grave", url: "http://truyentuan.com/marry-grave/" }, { label: "Trọng Sinh Đô Thị Tu Tiên", value: "Trọng Sinh Đô Thị Tu Tiên", url: "http://truyentuan.com/trong-sinh-do-thi-tu-tien/" }, { label: "Kishuku Gakkou no Juliet", value: "Kishuku Gakkou no Juliet", url: "http://truyentuan.com/kishuku-gakkou-no-juliet/" }, { label: "BIRDMEN", value: "BIRDMEN", url: "http://truyentuan.com/birdmen/" }, { label: "Kushuku Gakkou no Alice", value: "Kushuku Gakkou no Alice", url: "http://truyentuan.com/kushuku-gakkou-no-alice/" }, { label: "Transmigration Girl", value: "Transmigration Girl", url: "http://truyentuan.com/transmigration-girl/" }, { label: "Ngã Dục Phong Thiên", value: "Ngã Dục Phong Thiên", url: "http://truyentuan.com/nga-duc-phong-thien/" }, { label: "Tối Cường Khí Thiếu", value: "Tối Cường Khí Thiếu", url: "http://truyentuan.com/toi-cuong-khi-thieu/" }, { label: "14-SAI NO KOI", value: "14-SAI NO KOI", url: "http://truyentuan.com/14-sai-no-koi/" }, { label: "Lang Hoàn Thư Viện", value: "Lang Hoàn Thư Viện", url: "http://truyentuan.com/lang-hoan-thu-vien/" }, { label: "Kannou Sensei", value: "Kannou Sensei", url: "http://truyentuan.com/kannou-sensei/" }, { label: "Nghịch Thiên Tà Thần", value: "Nghịch Thiên Tà Thần", url: "http://truyentuan.com/nghich-thien-ta-than/" }, { label: "Anh Hùng ? Ta Không Làm Lâu Rồi", value: "Anh Hùng ? Ta Không Làm Lâu Rồi", url: "http://truyentuan.com/anh-hung-ta-khong-lam-lau-roi/" }, { label: "Minus Hand", value: "Minus Hand", url: "http://truyentuan.com/minus-hand/" }, { label: "Vạn Giới Thần Chủ", value: "Vạn Giới Thần Chủ", url: "http://truyentuan.com/van-gioi-than-chu/" }, { label: "DỊ NHÂN BẤT TỬ", value: "DỊ NHÂN BẤT TỬ", url: "http://truyentuan.com/di-nhan-bat-tu/" }, { label: "Hitman", value: "Hitman", url: "http://truyentuan.com/hitman/" }, { label: "Tuyệt Thế Kiếm Thần", value: "Tuyệt Thế Kiếm Thần", url: "http://truyentuan.com/tuyet-the-kiem-than/" }, { label: "ÔNG KẸ SAU 6H TỐI!", value: "ÔNG KẸ SAU 6H TỐI!", url: "http://truyentuan.com/ong-ke-sau-6h-toi/" }, { label: "COHABITATION WITH THE FIANCEE", value: "COHABITATION WITH THE FIANCEE", url: "http://truyentuan.com/cohabitation-with-the-fiancee/" }, { label: "This Man: Sono Kao o Mita Mono ni wa Shi o", value: "This Man: Sono Kao o Mita Mono ni wa Shi o", url: "http://truyentuan.com/this-man-sono-kao-o-mita-mono-ni-wa-shi-o/" }, { label: "Cuộc sống thoái ẩn của võ lâm chi vương", value: "Cuộc sống thoái ẩn của võ lâm chi vương", url: "http://truyentuan.com/cuoc-song-thoai-an-cua-vo-lam-chi-vuong/" }, { label: "Tuyệt Thế Chiến Hồn", value: "Tuyệt Thế Chiến Hồn", url: "http://truyentuan.com/tuyet-the-chien-hon/" }, { label: "Chainsawman", value: "Chainsawman", url: "http://truyentuan.com/chainsawman/" }, { label: "Tuyệt Thế Võ Hồn", value: "Tuyệt Thế Võ Hồn", url: "http://truyentuan.com/tuyet-the-vo-hon/" }, { label: "Hoàng Phi Hồng Phần IV", value: "Hoàng Phi Hồng Phần IV", url: "http://truyentuan.com/hoang-phi-hong-phan-iv/" }, { label: "Địa Ngục Này Ta Mở Ra Đấy", value: "Địa Ngục Này Ta Mở Ra Đấy", url: "http://truyentuan.com/dia-nguc-nay-ta-mo-ra-day/" }, { label: "Mạnh Nhất Lịch Sử", value: "Mạnh Nhất Lịch Sử", url: "http://truyentuan.com/manh-nhat-lich-su/" }, { label: "Tuyệt Thế Yêu Đế", value: "Tuyệt Thế Yêu Đế", url: "http://truyentuan.com/tuyet-the-yeu-de/" }, { label: "Honzuki No Gekokujou", value: "Honzuki No Gekokujou", url: "http://truyentuan.com/honzuki-no-gekokujou/" }, { label: "NENENE", value: "NENENE", url: "http://truyentuan.com/nenene/" }, { label: "Hắc Ám Huyết Thời Đại", value: "Hắc Ám Huyết Thời Đại", url: "http://truyentuan.com/hac-am-huyet-thoi-dai/" }, { label: "Cửu Tuyền Quy Lai", value: "Cửu Tuyền Quy Lai", url: "http://truyentuan.com/cuu-tuyen-quy-lai/" }, { label: "Ta Là Đại Thần Tiên", value: "Ta Là Đại Thần Tiên", url: "http://truyentuan.com/ta-la-dai-than-tien/" }, { label: "Võ Luyện Đỉnh Phong", value: "Võ Luyện Đỉnh Phong", url: "http://truyentuan.com/vo-luyen-dinh-phong/" }, { label: "Skeleton Soldier Couldn’t Protect The Dungeon", value: "Skeleton Soldier Couldn’t Protect The Dungeon", url: "http://truyentuan.com/skeleton-soldier-couldnt-protect-the-dungeon/" }, { label: "BOKU TO KIMI NO TAISETSU NA HANASHI", value: "BOKU TO KIMI NO TAISETSU NA HANASHI", url: "http://truyentuan.com/boku-to-kimi-no-taisetsu-na-hanashi/" }, { label: "Goumon Tournament", value: "Goumon Tournament", url: "http://truyentuan.com/goumon-tournament/" }, { label: "Kokuei No Junk", value: "Kokuei No Junk", url: "http://truyentuan.com/kokuei-no-junk/" }, { label: "Truyền Võ", value: "Truyền Võ", url: "http://truyentuan.com/truyen-vo/" }, { label: "Đại Kiếm Thần", value: "Đại Kiếm Thần", url: "http://truyentuan.com/dai-kiem-than/" }, { label: "Cực Vũ Huyền Đế", value: "Cực Vũ Huyền Đế", url: "http://truyentuan.com/cuc-vu-huyen-de/" }, { label: "Legend Isekai", value: "Legend Isekai", url: "http://truyentuan.com/legend-isekai/" }, { label: "KAIFUKU JUTSUSHI NO YARINAOSHI", value: "KAIFUKU JUTSUSHI NO YARINAOSHI", url: "http://truyentuan.com/kaifuku-jutsushi-no-yarinaoshi/" }, { label: "Chí Tôn Thần Ma", value: "Chí Tôn Thần Ma", url: "http://truyentuan.com/chi-ton-than-ma/" }, { label: "Thương Khung Bảng Chi Thánh Linh Kỷ", value: "Thương Khung Bảng Chi Thánh Linh Kỷ", url: "http://truyentuan.com/thuong-khung-bang-chi-thanh-linh-ky/" }, { label: "Ảnh Hậu Thời Gian", value: "Ảnh Hậu Thời Gian", url: "http://truyentuan.com/anh-hau-thoi-gian/" }, { label: "Điện thoại của ta thông tam giới", value: "Điện thoại của ta thông tam giới", url: "http://truyentuan.com/dien-thoai-cua-ta-thong-tam-gioi/" }, { label: "Đô Thị Cực Phẩm Y Tiên", value: "Đô Thị Cực Phẩm Y Tiên", url: "http://truyentuan.com/do-thi-cuc-pham-y-tien/" }, { label: "Phục Ma Thiên Sư", value: "Phục Ma Thiên Sư", url: "http://truyentuan.com/phuc-ma-thien-su/" }, { label: "Usotoki Rhetoric", value: "Usotoki Rhetoric", url: "http://truyentuan.com/usotoki-rhetoric/" }, { label: "Kage no Jitsuryokusha ni Naritakute!", value: "Kage no Jitsuryokusha ni Naritakute!", url: "http://truyentuan.com/kage-no-jitsuryokusha-ni-naritakute/" }, { label: "Jigokuraku", value: "Jigokuraku", url: "http://truyentuan.com/jigokuraku/" }, { label: "Hộ Hoa Cao Thủ Tại Đô Thị", value: "Hộ Hoa Cao Thủ Tại Đô Thị", url: "http://truyentuan.com/ho-hoa-cao-thu-tai-do-thi/" }, { label: "Tối Cường Thần Thú Hệ Thống", value: "Tối Cường Thần Thú Hệ Thống", url: "http://truyentuan.com/toi-cuong-than-thu-he-thong/" }, { label: "Siêu Cấp Hoàng Kim Nhãn", value: "Siêu Cấp Hoàng Kim Nhãn", url: "http://truyentuan.com/sieu-cap-hoang-kim-nhan/" }, { label: "Thiên Mệnh Cửu Tinh", value: "Thiên Mệnh Cửu Tinh", url: "http://truyentuan.com/thien-menh-cuu-tinh/" }, { label: "Orient", value: "Orient", url: "http://truyentuan.com/orient/" }, { label: "Ta Có Phòng Riêng Thời Tận Thế", value: "Ta Có Phòng Riêng Thời Tận Thế", url: "http://truyentuan.com/ta-co-phong-rieng-thoi-tan-the/" }, { label: "Tuyệt Thế Phi Đao", value: "Tuyệt Thế Phi Đao", url: "http://truyentuan.com/tuyet-the-phi-dao/" }, { label: "Tối Cường Phản Sáo Lộ Hệ Thống", value: "Tối Cường Phản Sáo Lộ Hệ Thống", url: "http://truyentuan.com/toi-cuong-phan-sao-lo-he-thong/" }, { label: "Mage no Kaigashuu", value: "Mage no Kaigashuu", url: "http://truyentuan.com/mage-no-kaigashuu/" }, { label: "Tiên Vương", value: "Tiên Vương", url: "http://truyentuan.com/tien-vuong/" }, { label: "Tu Chân Giả Tại Dị Thế", value: "Tu Chân Giả Tại Dị Thế", url: "http://truyentuan.com/tu-chan-gia-tai-di-the/" }, { label: "Dị Nhân Quán", value: "Dị Nhân Quán", url: "http://truyentuan.com/di-nhan-quan/" }, { label: "Kiếp Thiên Vận", value: "Kiếp Thiên Vận", url: "http://truyentuan.com/kiep-thien-van/" }, { label: "Mạt Thế Phàm Nhân", value: "Mạt Thế Phàm Nhân", url: "http://truyentuan.com/mat-the-pham-nhan/" }, { label: "Đại Nghịch Chi Môn", value: "Đại Nghịch Chi Môn", url: "http://truyentuan.com/dai-nghich-chi-mon/" }, { label: "Tuyệt Thế Thần Hoàng", value: "Tuyệt Thế Thần Hoàng", url: "http://truyentuan.com/tuyet-the-than-hoang/" }, { label: "Võ Nghịch Cửu Thiên", value: "Võ Nghịch Cửu Thiên", url: "http://truyentuan.com/vo-nghich-cuu-thien/" }, { label: "Living in this World with Cut & Paste", value: "Living in this World with Cut & Paste", url: "http://truyentuan.com/living-in-this-world-with-cut-paste/" }, { label: "World End Crusaders", value: "World End Crusaders", url: "http://truyentuan.com/world-end-crusaders/" }, { label: "Dạo quanh lãnh địa Demon", value: "Dạo quanh lãnh địa Demon", url: "http://truyentuan.com/dao-quanh-lanh-dia-demon/" }, { label: "Thiếu Soái ! Vợ Ngài Lại Bỏ Trốn", value: "Thiếu Soái ! Vợ Ngài Lại Bỏ Trốn", url: "http://truyentuan.com/thieu-soai-vo-ngai-lai-bo-tron/" }, { label: "A RETURNER'S MAGIC SHOULD BE SPECIAL", value: "A RETURNER'S MAGIC SHOULD BE SPECIAL", url: "http://truyentuan.com/a-returners-magic-should-be-special/" }, { label: "Võ Nghịch Sơn Hà", value: "Võ Nghịch Sơn Hà", url: "http://truyentuan.com/vo-nghich-son-ha/" }, { label: "Tu Chân Tứ Vạn Niên", value: "Tu Chân Tứ Vạn Niên", url: "http://truyentuan.com/tu-chan-tu-van-nien/" }, { label: "Đặc Nhiệm Siêu Cấp Thành Phố", value: "Đặc Nhiệm Siêu Cấp Thành Phố", url: "http://truyentuan.com/dac-nhiem-sieu-cap-thanh-pho/" }, { label: "Cửu Dương Thần Vương", value: "Cửu Dương Thần Vương", url: "http://truyentuan.com/cuu-duong-than-vuong/" }, { label: "Nhất Phẩm Cao Thủ", value: "Nhất Phẩm Cao Thủ", url: "http://truyentuan.com/nhat-pham-cao-thu/" }, { label: "Tokyo卍Revengers", value: "Tokyo卍Revengers", url: "http://truyentuan.com/tokyo-revengers/" }, { label: "Ngự Thiên Thần Đế", value: "Ngự Thiên Thần Đế", url: "http://truyentuan.com/ngu-thien-than-de/" }, { label: "Nghịch Thiên Đại Thần", value: "Nghịch Thiên Đại Thần", url: "http://truyentuan.com/nghich-thien-dai-than/" }, { label: "Act-Age", value: "Act-Age", url: "http://truyentuan.com/act-age/" }, { label: "Chung Cực Đấu La", value: "Chung Cực Đấu La", url: "http://truyentuan.com/chung-cuc-dau-la/" }, { label: "Tiếng gáy sát thủ", value: "Tiếng gáy sát thủ", url: "http://truyentuan.com/tieng-gay-sat-thu/" }, { label: "Warble", value: "Warble", url: "http://truyentuan.com/warble/" }, { label: "Yajin", value: "Yajin", url: "http://truyentuan.com/yajin/" }, { label: "Jujutsu Kaisen - Vật Thể Bị Nguyền Rủa", value: "Jujutsu Kaisen - Vật Thể Bị Nguyền Rủa", url: "http://truyentuan.com/jujutsu-kaisen-vat-the-bi-nguyen-rua/" }, { label: "Thiên Hạ Đệ Nhất Cao Thủ Đi Học", value: "Thiên Hạ Đệ Nhất Cao Thủ Đi Học", url: "http://truyentuan.com/thien-ha-de-nhat-cao-thu-di-hoc/" }, { label: "Độc Sấm Thiên Nhai", value: "Độc Sấm Thiên Nhai", url: "http://truyentuan.com/doc-sam-thien-nhai/" }, { label: "Thực Sắc Đại Lục", value: "Thực Sắc Đại Lục", url: "http://truyentuan.com/thuc-sac-dai-luc/" }, { label: "Thợ Săn Quỷ - Chainsaw", value: "Thợ Săn Quỷ - Chainsaw", url: "http://truyentuan.com/tho-san-quy-chainsaw/" }, { label: "Araburu Kisetsu no Otomedomo yo", value: "Araburu Kisetsu no Otomedomo yo", url: "http://truyentuan.com/araburu-kisetsu-no-otomedomo-yo/" }, { label: "Hananoi-kun to Koi no Yamai", value: "Hananoi-kun to Koi no Yamai", url: "http://truyentuan.com/hananoi-kun-to-koi-no-yamai/" }, { label: "Shin'ai naru Boku e Satsui wo komete", value: "Shin'ai naru Boku e Satsui wo komete", url: "http://truyentuan.com/shinai-naru-boku-e-satsui-wo-komete/" }, { label: "Bạn Thời Thơ Ấu - My Childhood Friend", value: "Bạn Thời Thơ Ấu - My Childhood Friend", url: "http://truyentuan.com/ban-thoi-tho-au-my-childhood-friend/" }, { label: "YUGIOH!", value: "YUGIOH!", url: "http://truyentuan.com/yugioh/" }, { label: "Card Captor Sakura: Clear Card", value: "Card Captor Sakura: Clear Card", url: "http://truyentuan.com/card-captor-sakura-clear-card/" }, { label: "Này ! đừng động vào phô mai của tôi", value: "Này ! đừng động vào phô mai của tôi", url: "http://truyentuan.com/nay-dung-dong-vao-pho-mai-cua-toi/" }, { label: "Dị Nhân Quán (Quạ Team)", value: "Dị Nhân Quán (Quạ Team)", url: "http://truyentuan.com/di-nhan-quan-qua-team/" }, { label: "Nanatsu no Taizai.", value: "Nanatsu no Taizai.", url: "http://truyentuan.com/nanatsu-no-taizai-2/" }, { label: "IKENIE TOUHYOU", value: "IKENIE TOUHYOU", url: "http://truyentuan.com/ikenie-touhyou-2/" }, { label: "SENPAI NHỎ NHẮN CỦA TÔI RẤT DỄ THƯƠNG", value: "SENPAI NHỎ NHẮN CỦA TÔI RẤT DỄ THƯƠNG", url: "http://truyentuan.com/senpai-nho-nhan-cua-toi-rat-de-thuong/" }, { label: "Đảo Chết Chóc", value: "Đảo Chết Chóc", url: "http://truyentuan.com/dao-chet-choc/" }, { label: "MAR Heaven", value: "MAR Heaven", url: "http://truyentuan.com/mar-heaven/" }, { label: "Ông chồng nội trợ - Gokushufudou", value: "Ông chồng nội trợ - Gokushufudou", url: "http://truyentuan.com/ong-chong-noi-tro-gokushufudou/" }, { label: "The Beginning After The End", value: "The Beginning After The End", url: "http://truyentuan.com/the-beginning-after-the-end/" }, { label: "The Promised Neverland (Mega Team)", value: "The Promised Neverland (Mega Team)", url: "http://truyentuan.com/the-promised-neverland-mega-team/" }, { label: "Shinju No Nectar", value: "Shinju No Nectar", url: "http://truyentuan.com/shinju-no-nectar/" }, { label: "Black Clover.", value: "Black Clover.", url: "http://truyentuan.com/black-clover-2/" }, { label: "Shokugeki no Soma.", value: "Shokugeki no Soma.", url: "http://truyentuan.com/shokugeki-no-soma-2/" }, { label: "Final Fantasy: Lost Stranger", value: "Final Fantasy: Lost Stranger", url: "http://truyentuan.com/final-fantasy-lost-stranger/" }, { label: "Bá Vương Hầm Ngục - The Dungeon Master", value: "Bá Vương Hầm Ngục - The Dungeon Master", url: "http://truyentuan.com/ba-vuong-ham-nguc-the-dungeon-master/" }, { label: "THE SCUM OF GOOD AND EVIL", value: "THE SCUM OF GOOD AND EVIL", url: "http://truyentuan.com/the-scum-of-good-and-evil/" }, { label: "Soul Hunter (Hoshin Engi)", value: "Soul Hunter (Hoshin Engi)", url: "http://truyentuan.com/soul-hunter/" }, { label: "Destiny Lovers", value: "Destiny Lovers", url: "http://truyentuan.com/destiny-lovers/" }, { label: "Nghịch Thiên Kiếm Thần", value: "Nghịch Thiên Kiếm Thần", url: "http://truyentuan.com/nghich-thien-kiem-than/" }, { label: "Cô vợ siêu mẫu của cố thiếu", value: "Cô vợ siêu mẫu của cố thiếu", url: "http://truyentuan.com/co-vo-sieu-mau-cua-co-thieu/" }, { label: "Shuumatsu No Valkyrie", value: "Shuumatsu No Valkyrie", url: "http://truyentuan.com/shuumatsu-no-valkyrie/" }, { label: "Dịch Vụ Trả Thù (Ngoại Truyện)", value: "Dịch Vụ Trả Thù (Ngoại Truyện)", url: "http://truyentuan.com/dich-vu-tra-thu-ngoai-truyen/" }, { label: "MAO", value: "MAO", url: "http://truyentuan.com/mao/" }, { label: "FAIRY GONE.", value: "FAIRY GONE.", url: "http://truyentuan.com/fairy-gone-1/" }, { label: "The Dungeon Master", value: "The Dungeon Master", url: "http://truyentuan.com/the-dungeon-master/" }, { label: "Thôn Phệ Lĩnh Vực", value: "Thôn Phệ Lĩnh Vực", url: "http://truyentuan.com/thon-phe-linh-vuc/" }, { label: "Đô Thị Kiêu Hùng Hệ Thống", value: "Đô Thị Kiêu Hùng Hệ Thống", url: "http://truyentuan.com/do-thi-kieu-hung-he-thong/" }, { label: "Thái Cổ Cuồng Ma", value: "Thái Cổ Cuồng Ma", url: "http://truyentuan.com/thai-co-cuong-ma/" }, { label: "Cao Đẳng Linh Hồn", value: "Cao Đẳng Linh Hồn", url: "http://truyentuan.com/cao-dang-linh-hon/" }, { label: "Detective Conan (Rocket Team)", value: "Detective Conan (Rocket Team)", url: "http://truyentuan.com/detective-conan-remake/" }, { label: "Hành trình hậu tận thế", value: "Hành trình hậu tận thế", url: "http://truyentuan.com/hanh-trinh-hau-tan-the/" }, { label: "Rich Player - Người Chơi Khắc Kim", value: "Rich Player - Người Chơi Khắc Kim", url: "http://truyentuan.com/rich-player-nguoi-choi-khac-kim/" }, { label: "Đấu Chiến Cuồng Triều", value: "Đấu Chiến Cuồng Triều", url: "http://truyentuan.com/dau-chien-cuong-trieu/" }, { label: "Ta Là Phế Vật", value: "Ta Là Phế Vật", url: "http://truyentuan.com/ta-la-phe-vat/" }, { label: "Kusuriya no Hitorigoto", value: "Kusuriya no Hitorigoto", url: "http://truyentuan.com/kusuriya-no-hitorigoto/" }, { label: "Siêu Năng Lập Phương", value: "Siêu Năng Lập Phương", url: "http://truyentuan.com/sieu-nang-lap-phuong/" }, { label: "Shikkaku Mon No Saikyou Kenja", value: "Shikkaku Mon No Saikyou Kenja", url: "http://truyentuan.com/shikkaku-mon-no-saikyou-kenja/" }, { label: "Higanjima Phần 3", value: "Higanjima Phần 3", url: "http://truyentuan.com/higanjima-phan-3/" }, { label: "My Status As An Assassin", value: "My Status As An Assassin", url: "http://truyentuan.com/my-status-as-an-assassin/" }, { label: "Tiên Đế Qui Lai", value: "Tiên Đế Qui Lai", url: "http://truyentuan.com/tien-de-qui-lai/" }, { label: "Hệ Thống Tu Tiên Mạnh Nhất", value: "Hệ Thống Tu Tiên Mạnh Nhất", url: "http://truyentuan.com/he-thong-tu-tien-manh-nhat/" }, { label: "5 Toubun no Hanayome", value: "5 Toubun no Hanayome", url: "http://truyentuan.com/5-toubun-no-hanayome/" }, { label: "FUKUSHUU WO KOINEGAU SAIKYOU YUUSHA WA, YAMI NO CHIKARA DE SENMETSU MUSOU SURU", value: "FUKUSHUU WO KOINEGAU SAIKYOU YUUSHA WA, YAMI NO CHIKARA DE SENMETSU MUSOU SURU", url: "http://truyentuan.com/fukushuu-wo-koinegau-saikyou-yuusha-wa-yami-no-chikara-de-senmetsu-musou-suru/" }, { label: "Genjitsu Shugi Yuusha no Oukoku Saikenki", value: "Genjitsu Shugi Yuusha no Oukoku Saikenki", url: "http://truyentuan.com/genjitsu-shugi-yuusha-no-oukoku-saikenki/" }, { label: "Lãnh Cung Phế Hậu Muốn Nghịch Thiên", value: "Lãnh Cung Phế Hậu Muốn Nghịch Thiên", url: "http://truyentuan.com/lanh-cung-phe-hau-muon-nghich-thien/" }, { label: "Kẻ Phán Xét", value: "Kẻ Phán Xét", url: "http://truyentuan.com/ke-phan-xet/" }, { label: "Hướng Tâm Dẫn Lực", value: "Hướng Tâm Dẫn Lực", url: "http://truyentuan.com/huong-tam-dan-luc/" }, { label: "Khế hôn", value: "Khế hôn", url: "http://truyentuan.com/khe-hon/" }, { label: "Trùng Sinh Chi Đô Thị Cuồng Tiên", value: "Trùng Sinh Chi Đô Thị Cuồng Tiên", url: "http://truyentuan.com/trung-sinh-chi-do-thi-cuong-tien/" }, { label: "Makikomarete Isekai Teni suru Yatsu wa, Taitei Cheat", value: "Makikomarete Isekai Teni suru Yatsu wa, Taitei Cheat", url: "http://truyentuan.com/makikomarete-isekai-teni-suru-yatsu-wa-taitei-cheat/" }, { label: "Long Mạch Võ Thần", value: "Long Mạch Võ Thần", url: "http://truyentuan.com/long-mach-vo-than/" }, { label: "Vì con gái, ngay cả Ma Vương tôi cũng có thể đánh bại", value: "Vì con gái, ngay cả Ma Vương tôi cũng có thể đánh bại", url: "http://truyentuan.com/vi-con-gai-ngay-ca-ma-vuong-toi-cung-co-the-danh-bai/" }, { label: "Zombie King", value: "Zombie King", url: "http://truyentuan.com/zombie-king/" }, { label: "Vợ yêu không ngoan", value: "Vợ yêu không ngoan", url: "http://truyentuan.com/vo-yeu-khong-ngoan/" }, { label: "A Falling Cohabitation", value: "A Falling Cohabitation", url: "http://truyentuan.com/truyen-a-falling-cohabitation/" }, { label: "Isekai Shoukan Wa Nidome Desu", value: "Isekai Shoukan Wa Nidome Desu", url: "http://truyentuan.com/isekai-shoukan-wa-nidome-desu/" }, { label: "Võ Đạo Độc Tôn", value: "Võ Đạo Độc Tôn", url: "http://truyentuan.com/vo-dao-doc-ton/" }, { label: "Bá Chủ Học Đường", value: "Bá Chủ Học Đường", url: "http://truyentuan.com/ba-chu-hoc-duong/" }, { label: "Isekai desu ga Mamono Saibai Shiteimasu", value: "Isekai desu ga Mamono Saibai Shiteimasu", url: "http://truyentuan.com/isekai-desu-ga-mamono-saibai-shiteimasu/" }, { label: "Weak 5000 – Year Old Vegan Dragon", value: "Weak 5000 – Year Old Vegan Dragon", url: "http://truyentuan.com/weak-5000-year-old-vegan-dragon/" }, { label: "Siêu Cấp Bảo An Tại Đô Thị", value: "Siêu Cấp Bảo An Tại Đô Thị", url: "http://truyentuan.com/sieu-cap-bao-an-tai-do-thi/" }, { label: "Sử Thượng Đệ Nhất Chưởng Môn", value: "Sử Thượng Đệ Nhất Chưởng Môn", url: "http://truyentuan.com/su-thuong-de-nhat-chuong-mon/" }, { label: "Tiểu Thư Bị Ám Sát! - Assassin's Pride", value: "Tiểu Thư Bị Ám Sát! - Assassin's Pride", url: "http://truyentuan.com/tieu-thu-bi-am-sat-assassins-pride/" }, { label: "Trên Người Ta Có Một Con Rồng", value: "Trên Người Ta Có Một Con Rồng", url: "http://truyentuan.com/tren-nguoi-ta-co-mot-con-rong/" }, { label: "Duranki", value: "Duranki", url: "http://truyentuan.com/duranki/" }, { label: "Cô vợ có phòng thủ bằng Zero", value: "Cô vợ có phòng thủ bằng Zero", url: "http://truyentuan.com/co-vo-co-phong-thu-bang-zero/" }, { label: "My Dear Cold Blooded King", value: "My Dear Cold Blooded King", url: "http://truyentuan.com/my-dear-cold-blooded-king/" }, { label: "Mục Thần Ký", value: "Mục Thần Ký", url: "http://truyentuan.com/muc-than-ky/" }, { label: "Thần Võ Thiên Tôn", value: "Thần Võ Thiên Tôn", url: "http://truyentuan.com/than-vo-thien-ton/" }, { label: "Higurashi no Naku Koro ni - Tatarigoroshi Hen", value: "Higurashi no Naku Koro ni - Tatarigoroshi Hen", url: "http://truyentuan.com/higurashi-no-naku-koro-ni-tatarigoroshi-hen/" }, { label: "Yu-Gi-Oh! OCG Structure - Kiến tạo Bài thủ truyện", value: "Yu-Gi-Oh! OCG Structure - Kiến tạo Bài thủ truyện", url: "http://truyentuan.com/yu-gi-oh-ocg-structure-kien-tao-bai-thu-truyen/" }, { label: "Sau Khi Tôi Là 1 Ma Vương, Tôi Sẽ Xây Dựng Hầm Ngục Cùng Với Các Nô Lệ!", value: "Sau Khi Tôi Là 1 Ma Vương, Tôi Sẽ Xây Dựng Hầm Ngục Cùng Với Các Nô Lệ!", url: "http://truyentuan.com/sau-khi-toi-la-1-ma-vuong-toi-se-xay-dung-ham-nguc-cung-voi-cac-no-le/" }, { label: "Exterminator", value: "Exterminator", url: "http://truyentuan.com/exterminator/" }, { label: "Phong Quỷ Truyền Thuyết", value: "Phong Quỷ Truyền Thuyết", url: "http://truyentuan.com/phong-quy-truyen-thuyet/" }, { label: "Hard Core Leveling Warrior ss2", value: "Hard Core Leveling Warrior ss2", url: "http://truyentuan.com/hard-core-leveling-warrior-ss2/" }, { label: "Kiếm Thần Tuyệt Thế", value: "Kiếm Thần Tuyệt Thế", url: "http://truyentuan.com/kiem-than-tuyet-the/" }, { label: "Takarakuji de 40-oku Atattandakedo Isekai ni Ijuu Suru", value: "Takarakuji de 40-oku Atattandakedo Isekai ni Ijuu Suru", url: "http://truyentuan.com/takarakuji-de-40-oku-atattandakedo-isekai-ni-ijuu-suru/" }, { label: "Hiraheishi wa Kako wo Yumemiru", value: "Hiraheishi wa Kako wo Yumemiru", url: "http://truyentuan.com/hiraheishi-wa-kako-wo-yumemiru/" }, { label: "Sono Ossan, Isekai De Nishuume Play Wo Mankitsu Chuu", value: "Sono Ossan, Isekai De Nishuume Play Wo Mankitsu Chuu", url: "http://truyentuan.com/sono-ossan-isekai-de-nishuume-play-wo-mankitsu-chuu/" }, { label: "Nidome No Yuusha", value: "Nidome No Yuusha", url: "http://truyentuan.com/nidome-no-yuusha/" }, { label: "Khổng Minh Thích Tiệc Tùng", value: "Khổng Minh Thích Tiệc Tùng", url: "http://truyentuan.com/khong-minh-thich-tiec-tung/" }, { label: "Tokyo Dragon Night", value: "Tokyo Dragon Night", url: "http://truyentuan.com/tokyo-dragon-night/" }, { label: "ZINGNIZE", value: "ZINGNIZE", url: "http://truyentuan.com/zingnize/" }, { label: "Ta Có Một Bộ Hỗn Độn Kinh", value: "Ta Có Một Bộ Hỗn Độn Kinh", url: "http://truyentuan.com/ta-co-mot-bo-hon-don-kinh/" }, { label: "Blacksad", value: "Blacksad", url: "http://truyentuan.com/blacksad-3/" }, { label: "Duelant", value: "Duelant", url: "http://truyentuan.com/duelant/" }, { label: "Japan", value: "Japan", url: "http://truyentuan.com/japan/" }, { label: "Dark Avengers", value: "Dark Avengers", url: "http://truyentuan.com/dark-avengers/" }, { label: "Agravity Boys", value: "Agravity Boys", url: "http://truyentuan.com/agravity-boys/" }, { label: "Superman: Speeding Bullets", value: "Superman: Speeding Bullets", url: "http://truyentuan.com/superman-speeding-bullets/" }, { label: "Berserk Of Gluttony", value: "Berserk Of Gluttony", url: "http://truyentuan.com/berserk-of-gluttony/" }, { label: "Superman: Distant Fire", value: "Superman: Distant Fire", url: "http://truyentuan.com/superman-distant-fire/" }, { label: "Paidon", value: "Paidon", url: "http://truyentuan.com/paidon/" }, { label: "The Ultimate Middle-Aged Hunter Travels To Another World", value: "The Ultimate Middle-Aged Hunter Travels To Another World", url: "http://truyentuan.com/the-ultimate-middle-aged-hunter-travels-to-another-world/" }, { label: "Địa Phủ Khai Phá Thương", value: "Địa Phủ Khai Phá Thương", url: "http://truyentuan.com/dia-phu-khai-pha-thuong/" }, { label: "Tensei Shitara Dragon No Tamago Datta - Saikyou Igai", value: "Tensei Shitara Dragon No Tamago Datta - Saikyou Igai", url: "http://truyentuan.com/tensei-shitara-dragon-no-tamago-datta-saikyou-igai/" }, { label: "Ne0;lation", value: "Ne0;lation", url: "http://truyentuan.com/ne0lation/" }, { label: "Cực Phẩm Tiên Hiệp Học Viện", value: "Cực Phẩm Tiên Hiệp Học Viện", url: "http://truyentuan.com/cuc-pham-tien-hiep-hoc-vien/" }, { label: "Đấu La Đại Lục Ngoại Truyện: Đường Môn Anh Hùng", value: "Đấu La Đại Lục Ngoại Truyện: Đường Môn Anh Hùng", url: "http://truyentuan.com/dau-la-dai-luc-ngoai-truyen-duong-mon-anh-hung/" }, { label: "TÔI LÀ NGƯỜI CHƠI DUY NHẤT ĐĂNG NHẬP", value: "TÔI LÀ NGƯỜI CHƠI DUY NHẤT ĐĂNG NHẬP", url: "http://truyentuan.com/toi-la-nguoi-choi-duy-nhat-dang-nhap/" }, { label: "Mashle: Magic and Muscles", value: "Mashle: Magic and Muscles", url: "http://truyentuan.com/mashle-magic-and-muscles/" }, { label: "Người Chơi Lỗi", value: "Người Chơi Lỗi", url: "http://truyentuan.com/nguoi-choi-loi/" }, { label: "Tao muốn trở thành chúa tể bóng tối!!", value: "Tao muốn trở thành chúa tể bóng tối!!", url: "http://truyentuan.com/tao-muon-tro-thanh-chua-te-bong-toi/" }, { label: "Thương Nguyên Đồ", value: "Thương Nguyên Đồ", url: "http://truyentuan.com/thuong-nguyen-do/" }, { label: "Cửa Hàng Đào Bảo Thông Tam Giới", value: "Cửa Hàng Đào Bảo Thông Tam Giới", url: "http://truyentuan.com/cua-hang-dao-bao-thong-tam-gioi/" }, { label: "Isekai Nonbiri Nouka", value: "Isekai Nonbiri Nouka", url: "http://truyentuan.com/isekai-nonbiri-nouka/" }, { label: "Một Mình Dạo Quanh Hầm Ngục", value: "Một Mình Dạo Quanh Hầm Ngục", url: "http://truyentuan.com/mot-minh-dao-quanh-ham-nguc/" }, { label: "Gia Tộc Điệp Viên Yozakura", value: "Gia Tộc Điệp Viên Yozakura", url: "http://truyentuan.com/gia-toc-diep-vien-yozakura/" }, { label: "Khởi Tạo Nhân Vật Phản Diện", value: "Khởi Tạo Nhân Vật Phản Diện", url: "http://truyentuan.com/khoi-tao-nhan-vat-phan-dien/" }, { label: "Vượt qua giới hạn", value: "Vượt qua giới hạn", url: "http://truyentuan.com/vuot-qua-gioi-han/" }, { label: "Tu Thiên Truyện", value: "Tu Thiên Truyện", url: "http://truyentuan.com/tu-thien-truyen/" }, { label: "Thiên Thần Quyết", value: "Thiên Thần Quyết", url: "http://truyentuan.com/thien-than-quyet/" }, { label: "Tôi Lên Cấp Chỉ Bằng Cách Ăn", value: "Tôi Lên Cấp Chỉ Bằng Cách Ăn", url: "http://truyentuan.com/toi-len-cap-chi-bang-cach-an/" }, { label: "Kanzen Kaihi Healer No Kiseki", value: "Kanzen Kaihi Healer No Kiseki", url: "http://truyentuan.com/kanzen-kaihi-healer-no-kiseki/" }, { label: "Fantasista Stella", value: "Fantasista Stella", url: "http://truyentuan.com/fantasista-stella/" }, { label: "Đấu Hồn Đại Lục", value: "Đấu Hồn Đại Lục", url: "http://truyentuan.com/dau-hon-dai-luc/" }, { label: "Bậc Thầy Kiếm Sư", value: "Bậc Thầy Kiếm Sư", url: "http://truyentuan.com/bac-thay-kiem-su/" }, { label: "The Kingdom Of Ruin", value: "The Kingdom Of Ruin", url: "http://truyentuan.com/the-kingdom-of-ruin/" }, { label: "Ta Là Tà Đế", value: "Ta Là Tà Đế", url: "http://truyentuan.com/ta-la-ta-de/" }, { label: "Trọng Sinh Đại Ngoạn Gia", value: "Trọng Sinh Đại Ngoạn Gia", url: "http://truyentuan.com/trong-sinh-dai-ngoan-gia/" }, { label: "Toàn trí độc giả", value: "Toàn trí độc giả", url: "http://truyentuan.com/toan-tri-doc-gia/" }, { label: "Sự Trở Lại Của Pháp Sư Vĩ Đại Sau 4000 Năm", value: "Sự Trở Lại Của Pháp Sư Vĩ Đại Sau 4000 Năm", url: "http://truyentuan.com/su-tro-lai-cua-phap-su-vi-dai-sau-4000-nam/" }, { label: "Okaeri", value: "Okaeri", url: "http://truyentuan.com/okaeri/" }, { label: "VUA TRỘM MỘ", value: "VUA TRỘM MỘ", url: "http://truyentuan.com/vua-trom-mo/" }, { label: "Baki Dou 2018", value: "Baki Dou 2018", url: "http://truyentuan.com/baki-dou-2018/" }, { label: "Chiến Binh Từ Thế Giới Khác", value: "Chiến Binh Từ Thế Giới Khác", url: "http://truyentuan.com/chien-binh-tu-the-gioi-khac/" }, { label: "Tôi Tự Động Săn Một Mình", value: "Tôi Tự Động Săn Một Mình", url: "http://truyentuan.com/toi-tu-dong-san-mot-minh/" }, { label: "The Boxer - Võ Sĩ Quyền Anh", value: "The Boxer - Võ Sĩ Quyền Anh", url: "http://truyentuan.com/the-boxer-vo-si-quyen-anh/" }, { label: "Kouryakuhon O Kushi Suru Saikyou No Mahoutsukai", value: "Kouryakuhon O Kushi Suru Saikyou No Mahoutsukai", url: "http://truyentuan.com/kouryakuhon-o-kushi-suru-saikyou-no-mahoutsukai/" }, { label: "A Tu La - Tây Du ngoại truyện", value: "A Tu La - Tây Du ngoại truyện", url: "http://truyentuan.com/a-tu-la-tay-du-ngoai-truyen/" }, { label: "Dị Tộc Trùng Sinh", value: "Dị Tộc Trùng Sinh", url: "http://truyentuan.com/di-toc-trung-sinh/" }, { label: "Tà Du Ký", value: "Tà Du Ký", url: "http://truyentuan.com/ta-du-ky/" }, { label: "Hôm Nay - Tôi Hóa Kaiju", value: "Hôm Nay - Tôi Hóa Kaiju", url: "http://truyentuan.com/hom-nay-toi-hoa-kaiju/" }, { label: "Toàn Cầu Cao Võ", value: "Toàn Cầu Cao Võ", url: "http://truyentuan.com/toan-cau-cao-vo/" }, { label: "Sobiwaku Zero No Saikyou Kenshi Demo, Noroi No Soubi (kawai) Nara 9999-ko Tsuke-hodai", value: "Sobiwaku Zero No Saikyou Kenshi Demo, Noroi No Soubi (kawai) Nara 9999-ko Tsuke-hodai", url: "http://truyentuan.com/sobiwaku-zero-no-saikyou-kenshi-demo-noroi-no-soubi-kawai-nara-9999-ko-tsuke-hodai/" }, { label: "Rebuild World", value: "Rebuild World", url: "http://truyentuan.com/rebuild-world/" }, { label: "Tái Thiết Hầm Ngục", value: "Tái Thiết Hầm Ngục", url: "http://truyentuan.com/tai-thiet-ham-nguc/" }, { label: "Phi Lôi Đạo", value: "Phi Lôi Đạo", url: "http://truyentuan.com/phi-loi-dao/" }, { label: "Bậc Thầy Thuần Hóa", value: "Bậc Thầy Thuần Hóa", url: "http://truyentuan.com/bac-thay-thuan-hoa/" }, { label: "Nguyên Long", value: "Nguyên Long", url: "http://truyentuan.com/nguyen-long/" }, { label: "FFF-Class Trashero", value: "FFF-Class Trashero", url: "http://truyentuan.com/fff-class-trashero/" }, { label: "Võ Nghịch", value: "Võ Nghịch", url: "http://truyentuan.com/vo-nghich/" }, { label: "Level 1 with S-rank Drop Rate is the Strongest", value: "Level 1 with S-rank Drop Rate is the Strongest", url: "http://truyentuan.com/level-1-with-s-rank-drop-rate-is-the-strongest/" }, { label: "Thợ Săn Đầu Tiên", value: "Thợ Săn Đầu Tiên", url: "http://truyentuan.com/tho-san-dau-tien/" }, { label: "Ngã lão ma thần", value: "Ngã lão ma thần", url: "http://truyentuan.com/nga-lao-ma-than/" }, { label: "Trọng Sinh Sau Tám Vạn Năm", value: "Trọng Sinh Sau Tám Vạn Năm", url: "http://truyentuan.com/trong-sinh-sau-tam-van-nam/" }, { label: "Hầm Ngục Bóng Tối", value: "Hầm Ngục Bóng Tối", url: "http://truyentuan.com/ham-nguc-bong-toi/" }, { label: "Cung Quỷ Kiếm Thần", value: "Cung Quỷ Kiếm Thần", url: "http://truyentuan.com/cung-quy-kiem-than/" }, { label: "Bắc Kiếm Giang Hồ", value: "Bắc Kiếm Giang Hồ", url: "http://truyentuan.com/bac-kiem-giang-ho/" }, { label: "Đô Thị Chí Tôn Hệ Thống", value: "Đô Thị Chí Tôn Hệ Thống", url: "http://truyentuan.com/do-thi-chi-ton-he-thong/" }, { label: "Biên Niên Sử Của Thiên Quỷ", value: "Biên Niên Sử Của Thiên Quỷ", url: "http://truyentuan.com/bien-nien-su-cua-thien-quy/" }, { label: "Võ Đang Kỳ Hiệp", value: "Võ Đang Kỳ Hiệp", url: "http://truyentuan.com/vo-dang-ky-hiep/" }, { label: "Bất Bại Quyền Ma", value: "Bất Bại Quyền Ma", url: "http://truyentuan.com/bat-bai-quyen-ma/" }, { label: "VUA THĂNG CẤP", value: "VUA THĂNG CẤP", url: "http://truyentuan.com/vua-thang-cap/" }, { label: "Kuro No Shoukanshi", value: "Kuro No Shoukanshi", url: "http://truyentuan.com/kuro-no-shoukanshi/" }, { label: "Tôi Là Thợ Săn Có Kĩ Năng Tự Sát Cấp SSS", value: "Tôi Là Thợ Săn Có Kĩ Năng Tự Sát Cấp SSS", url: "http://truyentuan.com/toi-la-tho-san-co-ki-nang-tu-sat-cap-sss/" }, { label: "Cậu Bé Của Thần Chết", value: "Cậu Bé Của Thần Chết", url: "http://truyentuan.com/cau-be-cua-than-chet/" }, { label: "Lôi Thần Chuyển Sinh", value: "Lôi Thần Chuyển Sinh", url: "http://truyentuan.com/loi-than-chuyen-sinh/" }, { label: "Boukensha Ni Naritai To Miyako Ni Deteitta Musume Ga S Rank Ni Nattet", value: "Boukensha Ni Naritai To Miyako Ni Deteitta Musume Ga S Rank Ni Nattet", url: "http://truyentuan.com/boukensha-ni-naritai-to-miyako-ni-deteitta-musume-ga-s-rank-ni-nattet/" }, { label: "Ngôi Nhà Bị Ma Ám Mạnh Nhất Và Chàng Trai Không Có Năng Lực Tâm Linh", value: "Ngôi Nhà Bị Ma Ám Mạnh Nhất Và Chàng Trai Không Có Năng Lực Tâm Linh", url: "http://truyentuan.com/ngoi-nha-bi-ma-am-manh-nhat-va-chang-trai-khong-co-nang-luc-tam-linh/" }, { label: "Vô Kiếm Tiểu Tử", value: "Vô Kiếm Tiểu Tử", url: "http://truyentuan.com/vo-kiem-tieu-tu/" }, { label: "The Useless Tamer Will Turn into the Top Unconsciously by My Previous Life Knowledge", value: "The Useless Tamer Will Turn into the Top Unconsciously by My Previous Life Knowledge", url: "http://truyentuan.com/the-useless-tamer-will-turn-into-the-top-unconsciously-by-my-previous-life-knowledge/" }];
exports.availableTags = availableTags;

},{}]},{},[59])(59)
});
