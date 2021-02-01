/** Encoding types supported by the default `asText` interpreters. */
export type SupportedEncoding = 'utf8' | 'utf-8' | 'ucs2' | 'ucs-2' | 'utf16le' | 'ascii' | 'hex' | 'base64' | 'binary' | 'latin1';

/** Endianness supported by the default `asNumber` interpreter. */
export type SupportedEndianness = 'le' | 'be'

/** Byte sizes and structures supported by the default `asNumber` interpreter. */
export type SupportedNumberForms = 'int8' | 'int16' | 'int32' | 'uint8' | 'uint16' | 'uint32' | 'float' | 'double';

/** Byte sizes / structures supported by `asBigint`. */
export type SupportedBigIntForms = 'bigint64' | 'biguint64';

/** Encoding types supported by the default `asNumber` interpreter. */
export type SupportedNumberEncoding =  SupportedNumberForms | `${SupportedNumberForms}${SupportedEndianness}`

/** Encoding types supported by the default `asBigInt` interpreter. */
export type SupportedBigIntEncoding =  SupportedBigIntForms | `${SupportedBigIntForms}${SupportedEndianness}`

/** Primitive JSON data types */
export type JSONPrimitive = string | number | boolean;

/** JSON typing for return of the default `asJSON` interpreters. */
export type JSONData = {[key: string]: JSONPrimitive | JSONData | JSONData[]} | JSONData[] | JSONPrimitive[];
