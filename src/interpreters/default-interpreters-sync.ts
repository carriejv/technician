import { RawConfigEntity } from '../types/entity-types';
import { InterpreterSync } from '../types/source-types';
import { SupportedEncoding, JSON } from '../types/util-types';

/** Provides a set of ready-to-use Interpreter functions for use with Container Entitys. Synchronous edition. */
export class DefaultInterpretersSync {

    /** 
     * Returns the raw data buffer as the entity contents, or undefined if the entity did not exist.
     */
    public static asBuffer(): InterpreterSync<Buffer | undefined> {
        return (rawEntity: RawConfigEntity) => rawEntity.data;
    }

    /** 
     * Returns a plain text string as the entity contents, or undefined if the entity did not exist.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asText(encoding: SupportedEncoding = 'utf8'): InterpreterSync<string | undefined> {
        return (rawEntity: RawConfigEntity) => rawEntity.data.toString(encoding);
    }

    /** 
     * Returns a JSON object as the entity contents, or undefined if the entity did not exist or was not valid JSON.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asJSON(encoding: SupportedEncoding = 'utf8'): InterpreterSync<JSON | undefined> {
        return (rawEntity: RawConfigEntity) => {
            const text = rawEntity.data.toString(encoding);
            try {
                return JSON.parse(text);
            }
            catch(err) {
                return undefined;
            }
        };
    }
}
