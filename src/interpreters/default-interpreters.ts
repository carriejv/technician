import { RawConfigEntity } from '../types/entity-types';
import { Interpreter } from '../types/source-types';
import { SupportedEncoding, JSON } from '../types/util-types';

/** Provides a set of ready-to-use Interpreter functions for use with Container Entitys. */
export class DefaultInterpreters {

    /** 
     * Returns the raw data buffer as the entity contents, or undefined if the entity did not exist.
     */
    public static asBuffer(): Interpreter<Buffer> {
        return async (rawEntity: RawConfigEntity) => rawEntity.data;
    }

    /** 
     * Returns a plain text string as the entity contents, or undefined if the entity did not exist.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asText(encoding: SupportedEncoding = 'utf8'): Interpreter<string> {
        return async (rawEntity: RawConfigEntity) => rawEntity.data.toString(encoding);
    }

    /** 
     * Returns a JSON object as the entity contents, or undefined if the entity did not exist or was not valid JSON.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asJSON(encoding: SupportedEncoding = 'utf8'): Interpreter<JSON | undefined> {
        return async (rawEntity: RawConfigEntity) => {
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
    public static asTextOrJSON(encoding: SupportedEncoding = 'utf8'): Interpreter<JSON | string> {
        return async (rawEntity: RawConfigEntity) => {
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
