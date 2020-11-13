/** Encoding types supported by the default `asText` interpreters. */
export type SupportedEncoding = 'utf8' | 'utf-8' | 'ucs2' | 'ucs-2' | 'utf16le' | 'ascii' | 'hex' | 'base64' | 'binary' | 'latin1';

/** JSON typing for return of the default `asJSON` interpreters. */
export type JSON = {[key: string]: string | number | boolean | Date | JSON | JSON[]};