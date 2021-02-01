export class Interpret{ 

    /** 
     * Returns the raw data buffer as the entity contents, or undefined if the entity did not exist.
     */
    public static asBuffer(): InterpreterSync<Buffer | undefined> {
        return (rawEntity: ConfigEntity) => rawEntity.data;
    }

    /** 
     * Returns a plain text string as the entity contents, or undefined if the entity did not exist.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asText(encoding: SupportedEncoding = 'utf8'): InterpreterSync<string | undefined> {
        return (rawEntity: ConfigEntity) => rawEntity.data.toString(encoding);
    }

    /** 
     * Returns a boolean as the entity contents.
     * Returns false for 0x00, true for 0x01, and undefined for any other buffer contents.
     */
    public static asBool(): InterpreterSync<boolean | undefined> {
        return (rawEntity: ConfigEntity) => {
            switch(rawEntity.data.readUInt8()) {
                case 0 : return false;
                case 1 : return true;
                default: return undefined;
            }
        };
    }

    /** 
     * Returns a numeric value (int or float) as the entity contents.
     * Assumes the Buffer contains only the number, reading from offset 0 and ignoring any trailing bytes.
     * The constructed interpreter may throw a TypeError if `encoding` is not a supported.
     * @param encoding The number encoding to use. Default `int32le` or `int32be` based on `os.endianness()`.
     */
    public static asNumber(encoding: SupportedNumberEncoding = 'int32'): InterpreterSync<number> {
        const fullEncoding = /^.*?[lb]e$/i.test(encoding) || /^u?int8/.test(encoding) ? encoding : `${encoding}${os.endianness().toLowerCase()}`;
        return (rawEntity: ConfigEntity) => {
            // This is probably more sane than `rawEntity.data[Object.keys(rawEntity.data).find(key => key.toLowerCase() === `read${numType}`) ?? throw new TypeError(`[${numType}]`)]()`
            switch(fullEncoding) {
                case 'int8'    : return rawEntity.data.readInt8();
                case 'int16be' : return rawEntity.data.readInt16BE();
                case 'int16le' : return rawEntity.data.readInt16LE();
                case 'int32be' : return rawEntity.data.readInt32BE();
                case 'int32le' : return rawEntity.data.readInt32LE();
                case 'uint8'   : return rawEntity.data.readUInt8();
                case 'uint16be': return rawEntity.data.readUInt16BE();
                case 'uint16le': return rawEntity.data.readUInt16LE();
                case 'uint32be': return rawEntity.data.readUInt32BE();
                case 'uint32le': return rawEntity.data.readUInt32LE();
                case 'floatbe' : return rawEntity.data.readFloatBE();
                case 'floatle' : return rawEntity.data.readFloatLE();
                case 'doublebe': return rawEntity.data.readDoubleBE();
                case 'doublele': return rawEntity.data.readDoubleLE();
                default        : throw new TypeError(`[${fullEncoding}] is not a supported number encoding type.`);
            }
        };
    }

    /** 
     * Returns a numeric value (bigint) as the entity contents.
     * Assumes the Buffer contains only the number, reading from offset 0 and ignoring any trailing bytes.
     * The constructed interpreter may throw a TypeError if `encoding` is not a supported.
     * @param encoding The number encoding to use. Default `bigint64le` or `bigint64be` based on `os.endianness()`.
     */
    public static asBigInt(encoding: SupportedBigIntEncoding = 'bigint64'): InterpreterSync<BigInt> {
        const fullEncoding = /^.*?[lb]e$/i.test(encoding) ? encoding : `${encoding}${os.endianness().toLowerCase()}`;
        return (rawEntity: ConfigEntity) => {
            switch(fullEncoding) {
                case 'bigint64be' : return rawEntity.data.readBigInt64BE();
                case 'bigint64le' : return rawEntity.data.readBigInt64LE();
                case 'biguint64be': return rawEntity.data.readBigUInt64BE();
                case 'biguint64le': return rawEntity.data.readBigUInt64LE();
                default           : throw new TypeError(`[${encoding}] is not a supported bigint encoding type.`);
            }
        };
    }

    /** 
     * Returns a JSON object as the entity contents, or undefined if the entity did not exist or was not valid JSON.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asJSON(encoding: SupportedEncoding = 'utf8'): InterpreterSync<JSONData | undefined> {
        return (rawEntity: ConfigEntity) => {
            const text = rawEntity.data.toString(encoding);
            try {
                return JSON.parse(text);
            }
            catch(err) {
                return undefined;
            }
        };
    }

    /** 
     * Returns a JSON object as the entity contents or a string if the value exists but is not valid JSON.
     * This process is not as efficient as using more finely-tailored interpreters, but is provided for convenience.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asTextOrJSON(encoding: SupportedEncoding = 'utf8'): InterpreterSync<JSONData | string> {
        return (rawEntity: ConfigEntity) => {
            const text = rawEntity.data.toString(encoding);
            try {
                return JSON.parse(text);
            }
            catch(err) {
                return text
            }
        };
    }
}
}