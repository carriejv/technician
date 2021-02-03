import { ConfigSource } from '../config-source/config-source';
import { ConfigEntity } from './entity-types';

/** Params object passed to the Technician constructor. */
export interface TechnicianParams {
    /** If true, Technician will ignore priority if a cached value exists and always return it. */
    cacheIgnoresPriority?: boolean;
    /** Default cache length in ms. */
    defaultCacheLength?: number;
    /** If true, Technician will prioritize running fewer interpreter functions over fewer source reads. */
    //TODO?: expensiveInterpreter?: boolean;
}

/** Type used by Technician to store a ConfigSource and related config. */
export interface ConfigSourceParams<T> {
    /** The config source. */
    source: ConfigSource<T>,
    /** The priority of the source. Highest number wins when multiple sources provide the same config key. */
    priority?: number,
    /** Default cache length in ms for values retrieved from this source. Used in place of Technician default if set. */
    cacheFor?: number,
    /** If set, the config source is ignored whenever the function set returns true. */
    ignoreIf?: () => boolean
}

/** Shorthand meta-type for ConfigSource-like args accepted by Technician. */
export type ConfigSourceArg<T> = ConfigSource<T> | ConfigSourceParams<T> | (ConfigSource<T> | ConfigSourceParams<T>)[];

/** 
 * A set of sync and async interpreter functions, for use with Interpreter.
 * This object contains both a `sync` and `async` variant of an `interpreterFunction`.
 * 
 * If the async variant is undefined, the sync variant will be used for both `read()` and `readSync()` calls
 * (the same behavior as passing in a function alone).
 * 
 * If the sync variant is undefined, the source will be treated as async-only and will not respond to `readSync()` queries.
 */
export interface InterpreterFunctionSet<T, U> {
    /** The async variant of the interpreter. */
    async?: (ConfigEntity: ConfigEntity<T | undefined>) => Promise<U | undefined> | U | undefined,
    /** The sync variant of the interpreter. */
    sync?: (ConfigEntity: ConfigEntity<T | undefined>) => | U | undefined
}
