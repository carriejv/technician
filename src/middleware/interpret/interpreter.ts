import { ConfigEntity } from '../../types/entity-types';
import { InterpreterFunctionSet } from '../../types/param-types';
import { ConfigSource } from '../../config-source/config-source';

/** Interpreter is a middleware ConfigSource that does pre-cache work on raw config values returned from low-level sources, optionally returning them as a new type. */
export class Interpreter<T, U = T> extends ConfigSource<U> {
    
    /** Interpreter functions in use, as an InterpreterFunctionSet object for (a)sync hybrid support. */
    private interpreterFunction: InterpreterFunctionSet<T, U>;

    /**
     * Builds a new Interpreter.
     * @param configSource        The config source to interpret.
     * @param interpreterFunction The interpreter function used to map input type T to output type U.
     *                            Interpretation is only performed once, and the result is cached instead of the input from the raw config source.
     *                            Interpreters can be used to perform any expensive operations necessary to prepared config values for use.
     *                            If an async interpreter is required, an object containing both an `async` and `sync` variant of the interpreter may be passed.
     *                            The `sync` property may be omitted, but this will cause the Interpreter to be treated as async-only and ignored by `readSync`, etc.
     */
    public constructor(private configSource: ConfigSource<T>, interpreterFunction: InterpreterFunctionSet<T, U> | ((ConfigEntity: ConfigEntity<T | undefined>) => U | undefined)) {
        super();
        if(typeof interpreterFunction === 'function') {
            this.interpreterFunction = {
                async: interpreterFunction,
                sync: interpreterFunction
            };
        }
        else {
            this.interpreterFunction = interpreterFunction;
        }
    }

    /** 
     * Reads the contents of the underlying source and runs the interpreter function on it.
     * @see {@link ConfigSource#read}
     */
    public async read(key: string): Promise<U | undefined> {
        return await this.interpreterFunction.async?.({
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
            interpretedValues[key] = await this.interpreterFunction.async?.({
                key: key,
                source: this.configSource,
                value: await this.configSource.read(key)
            });
        }
        return interpretedValues;
    }

    /** 
     * Lists all keys in the underlying source.
     * @see {@link ConfigSource#list}
     */
    public async list(): Promise<string[]> {
        return await this.configSource.list();
    }

    /** 
     * Reads the contents of the underlying source and runs the interpreter function on it.
     * @see {@link ConfigSource#readSync}
     */
    public readSync(key: string): U | undefined {
        return this.interpreterFunction.sync?.({
            key: key,
            source: this.configSource,
            value: this.configSource.readSync(key)
        });
    }

    /** 
     * Reads all contents of the underlying source and runs the interpreter function on them.
     * @see {@link ConfigSource#readAllSync}
     */
    public readAllSync(): {[key: string]: U | undefined} {
        const rawValues = this.configSource.readAllSync();
        const interpretedValues: {[key: string]: U | undefined} = {};
        for(const key of Object.keys(rawValues)) {
            interpretedValues[key] = this.interpreterFunction.sync?.({
                key: key,
                source: this.configSource,
                value: this.configSource.readSync(key)
            });
        }
        return interpretedValues;
    }

    /** 
     * Lists all keys in the underlying source.
     * @see {@link ConfigSource#listSync}
     */
    public listSync(): string[] {
        return this.configSource.listSync();
    }

}
