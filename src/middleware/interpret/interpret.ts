import * as os from 'os';
import { Interpreter } from './interpreter';
import { ConfigSource } from '../../config-source/config-source';
import { JSONData, SupportedBigIntEncoding, SupportedEncoding, SupportedNumberEncoding } from '../../types/util-types';

/** 
 * Semantic API layer for easily building common Interpreters.
 * This class is designed to be extensible by external interpreter packages.
 */
export class Interpret {

    /** Contains interpreters for mapping from Buffer to other common types. */
    public static buffer: InterpretBuffer = {

        asString: (configSource, encoding = 'utf8') => new Interpreter(configSource, entity => entity.value?.toString(encoding)),

        asBool: configSource => new Interpreter(configSource, entity => {
            switch(entity.value?.readUInt8()) {
                case 0 : return false;
                case 1 : return true;
                default: return undefined;
            }
        }),

        asNumber: (configSource, encoding = 'int32') => new Interpreter(configSource, entity => {
            const fullEncoding = /^.*?[lb]e$/i.test(encoding) || /^u?int8/.test(encoding) ? encoding : `${encoding}${os.endianness().toLowerCase()}`;
            // This is probably more sane than `rawEntity.data[Object.keys(rawEntity.data).find(key => key.toLowerCase() === `read${numType}`) ?? throw new TypeError(`[${numType}]`)]()`
            switch(fullEncoding) {
                case 'int8'    : return entity.value?.readInt8();
                case 'int16be' : return entity.value?.readInt16BE();
                case 'int16le' : return entity.value?.readInt16LE();
                case 'int32be' : return entity.value?.readInt32BE();
                case 'int32le' : return entity.value?.readInt32LE();
                case 'uint8'   : return entity.value?.readUInt8();
                case 'uint16be': return entity.value?.readUInt16BE();
                case 'uint16le': return entity.value?.readUInt16LE();
                case 'uint32be': return entity.value?.readUInt32BE();
                case 'uint32le': return entity.value?.readUInt32LE();
                case 'floatbe' : return entity.value?.readFloatBE();
                case 'floatle' : return entity.value?.readFloatLE();
                case 'doublebe': return entity.value?.readDoubleBE();
                case 'doublele': return entity.value?.readDoubleLE();
                default        : throw new TypeError(`[${fullEncoding}] is not a supported number encoding type.`);
            }
        }),

        asBigInt: (configSource, encoding = 'bigint64') => new Interpreter(configSource, entity => {
            const fullEncoding = /^.*?[lb]e$/i.test(encoding) ? encoding : `${encoding}${os.endianness().toLowerCase()}`;
            switch(fullEncoding) {
                case 'bigint64be' : return entity.value?.readBigInt64BE();
                case 'bigint64le' : return entity.value?.readBigInt64LE();
                case 'biguint64be': return entity.value?.readBigUInt64BE();
                case 'biguint64le': return entity.value?.readBigUInt64LE();
                default           : throw new TypeError(`[${encoding}] is not a supported bigint encoding type.`);
            }
        }),

        asJSON: (configSource, encoding = 'utf8') => new Interpreter(configSource, entity => {
            const text = entity.value?.toString(encoding);
            try {
                return text && JSON.parse(text);
            }
            catch(err) {
                return undefined;
            }
        }),

        asStringOrJSON: (configSource, encoding = 'utf8') => new Interpreter(configSource, entity => {
            const text = entity.value?.toString(encoding);
            try {
                return text && JSON.parse(text);
            }
            catch(err) {
                return text;
            }
        })

    };

    /** Contains interpreters for mapping from string to other common types. */
    public static string: InterpretString = {

        asBuffer: (configSource, encoding = 'utf8') => new Interpreter(configSource, entity => entity.value ? Buffer.from(entity.value, encoding) : undefined),

        asBool: configSource => new Interpreter(configSource, entity => {
            switch(entity.value) {
                case 'false': return false;
                case 'true' : return true;
                default     : return undefined;
            }
        }),

        asNumber: configSource => new Interpreter(configSource, entity => entity.value ? parseFloat(entity.value) : undefined),

        asBigInt: configSource => new Interpreter(configSource, entity => entity.value ? BigInt(entity.value) : undefined),

        asJSON: configSource => new Interpreter(configSource, entity => {
            try {
                return entity.value && JSON.parse(entity.value);
            }
            catch(err) {
                return undefined;
            }
        }),

        asStringOrJSON: configSource => new Interpreter(configSource, entity => {
            try {
                return entity.value && JSON.parse(entity.value);
            }
            catch(err) {
                return entity.value;
            }
        })
        
    };

}

/** 
 * Interface definition for the Interpret.buffer functions.
 * This exists so that they may be easily extended by other modules.
 */
export interface InterpretBuffer {
    /**
     * Interprets buffer values as strings.
     * @param configSource The source to interpret.
     * @param encoding     The string encoding type to use. Default `utf8`.
     */
    asString: (configSource: ConfigSource<Buffer>, encoding?: SupportedEncoding) => Interpreter<Buffer, string>;

    /**
     * Interprets buffer values as booleans.
     * Returns false for 0x00, true for 0x01, and undefined for any other buffer contents.
     * @param configSource The source to interpret.
     */
    asBool: (configSource: ConfigSource<Buffer>) => Interpreter<Buffer, boolean>;

    /**
     * Interprets buffer values as numbers.
     * Assumes the Buffer contains only the number, reading from offset 0 and ignoring any trailing bytes.
     * The constructed interpreter may throw a TypeError if `encoding` is not a supported.
     * @param configSource The source to interpret.
     * @param encoding     The number encoding to use. Default `int32le` or `int32be` based on `os.endianness()`.
     */
    asNumber: (configSource: ConfigSource<Buffer>, encoding?: SupportedNumberEncoding) => Interpreter<Buffer, number>;

    /**
     * Interprets buffer values as bigints.
     * Assumes the Buffer contains only the number, reading from offset 0 and ignoring any trailing bytes.
     * The constructed interpreter may throw a TypeError if `encoding` is not a supported.
     * @param configSource The source to interpret.
     * @param encoding     The number encoding to use. Default `bigint64le` or `bigint64be` based on `os.endianness()`.
     */
    asBigInt: (configSource: ConfigSource<Buffer>, encoding?: SupportedBigIntEncoding) => Interpreter<Buffer, bigint>;

    /**
     * Returns a JSON object as the entity contents, or undefined if the entity did not exist or was not valid JSON.
     * @param configSource The source to interpret.
     * @param encoding     The string encoding type to use. Default `utf8`.
     */
    asJSON: (configSource: ConfigSource<Buffer>, encoding?: SupportedEncoding) => Interpreter<Buffer, JSONData>;

    /**
     * Returns a JSON object as the entity contents or a string if the value exists but is not valid JSON.
     * This process is not as efficient as using more finely-tailored interpreters, but is provided for convenience.
     * @param configSource The source to interpret.
     * @param encoding     The string encoding type to use. Default `utf8`.
     */
    asStringOrJSON: (configSource: ConfigSource<Buffer>, encoding?: SupportedEncoding) => Interpreter<Buffer, JSONData | string>;
}

/** 
 * Interface definition for the Interpret.string functions.
 * This exists so that they may be easily extended by other modules.
 */
export interface InterpretString {
    /**
     * Interprets string values as buffers.
     * @param configSource The source to interpret.
     * @param encoding     The string encoding type to use. Default `utf8`.
     */
    asBuffer: (configSource: ConfigSource<string>, encoding?: SupportedEncoding) => Interpreter<string, Buffer>;

    /**
     * Interprets string values as booleans.
     * Returns false for 'false', true for 'true', and undefined for any other contents.
     * @param configSource The source to interpret.
     */
    asBool: (configSource: ConfigSource<string>) => Interpreter<string, boolean>;

    /**
     * Interprets string values as numbers via `parseFloat`.
     * @param configSource The source to interpret.
     */
    asNumber: (configSource: ConfigSource<string>) => Interpreter<string, number>;

    /**
     * Interprets string values as bigints via `BigInt`.
     * The constructed interpreter will throw a SyntaxError if the string is not a valid int.
     * @param configSource The source to interpret.
     */
    asBigInt: (configSource: ConfigSource<string>) => Interpreter<string, bigint>;

    /**
     * Returns a JSON object as the entity contents, or undefined if the entity did not exist or was not valid JSON.
     * @param configSource The source to interpret.
     */
    asJSON: (configSource: ConfigSource<string>) => Interpreter<string, JSONData>;

    /**
     * Returns a JSON object as the entity contents or a string if the value exists but is not valid JSON.
     * This process is not as efficient as using more finely-tailored interpreters, but is provided for convenience.
     * @param configSource The source to interpret.
     */
    asStringOrJSON: (configSource: ConfigSource<string>) => Interpreter<string, JSONData | string>;
}
