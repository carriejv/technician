import { ConfigEntity } from '../types/entity-types';
import { ConfigSourceSync } from '../types/source-types';

/** InterpreterSync is a middleware ConfigSource that does pre-cache work on raw config values returned from low-level sources. */
export class InterpreterSync<T, U> implements ConfigSourceSync<U> {
    
    /**
     * Builds a new InterpreterSync.
     * @param configSource        The config source to interpret.
     * @param interpreterFunction The interpreter function used to map input type T to output type U.
     *                            Interpretation is only performed once, and the result is cached instead of the input from the raw config source.
     *                            Interpreters can be used to perform any expensive operations necessary to prepared config values for use.
     * @constructor               InterpreterSync
     */
    public constructor(private configSource: ConfigSourceSync<T>, private interpreterFunction: (ConfigEntity: ConfigEntity<T | undefined>) => U) {}

    /** 
     * Reads the contents of the underlying source and runs the interpreter function on it.
     * @see {@link ConfigSourceSync#readSync}
     */
    public readSync(key: string): U | undefined {
        return this.interpreterFunction({
            key: key,
            source: this.configSource,
            value: this.configSource.readSync(key)
        });
    }

    /** 
     * Reads all contents of the underlying source and runs the interpreter function on them.
     * @see {@link ConfigSourceSync#readAllSync}
     */
    public readAllSync(): {[key: string]: U | undefined} {
        const rawValues = this.configSource.readAllSync();
        const interpretedValues: {[key: string]: U | undefined} = {};
        for(const key of Object.keys(rawValues)) {
            interpretedValues[key] = this.interpreterFunction({
                key: key,
                source: this.configSource,
                value: this.configSource.readSync(key)
            });
        }
        return interpretedValues;
    }

    /** 
     * Lists all keys in the underlying source.
     * @see {@link ConfigSourceSync#readAllSync}
     */
    public listSync(): string[] {
        return this.configSource.listSync();
    }
}