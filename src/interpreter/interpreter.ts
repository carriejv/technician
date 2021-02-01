import { ConfigEntity } from '../types/entity-types';
import { ConfigSource, ConfigSourceSync } from '../types/source-types';

/** Interpreter is a middleware ConfigSource that does pre-cache work on raw config values returned from low-level sources. */
export class Interpreter<T, U> implements ConfigSource<U> {
    
    /**
     * Builds a new Interpreter.
     * @param configSource        The config source to interpret.
     * @param interpreterFunction The interpreter function used to map input type T to output type U.
     *                            Interpretation is only performed once, and the result is cached instead of the input from the raw config source.
     *                            Interpreters can be used to perform any expensive operations necessary to prepared config values for use.
     * @constructor               Interpreter
     */
    public constructor(private configSource: ConfigSource<T>, private interpreterFunction: (ConfigEntity: ConfigEntity<T | undefined>) => Promise<U> | U) {}

    /** 
     * Reads the contents of the underlying source and runs the interpreter function on it.
     * @see {@link ConfigSource#read}
     */
    public async read(key: string): Promise<U | undefined> {
        return await this.interpreterFunction({
            key: key,
            source: this.configSource,
            value: await this.configSource.read(key)
        });
    }

    /** 
     * Reads all contents of the underlying source and runs the interpreter function on them.
     * @see {@link ConfigSource#readAll}
     */
    public async readAll(): Promise<{[key: string]: U | undefined}> {
        const rawValues = await this.configSource.readAll();
        const interpretedValues: {[key: string]: U | undefined} = {};
        for(const key of Object.keys(rawValues)) {
            interpretedValues[key] = await this.interpreterFunction({
                key: key,
                source: this.configSource,
                value: await this.configSource.read(key)
            });
        }
        return interpretedValues;
    }

    /** 
     * Lists all keys in the underlying source.
     * @see {@link ConfigSource#readAll}
     */
    public async list(): Promise<string[]> {
        return await this.configSource.list();
    }
}