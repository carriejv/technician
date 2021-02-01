import { ConfigEntity } from './entity-types';

/** Params object passed to the Technician constructor. */
export interface TechnicianParams {
    /** 
     * If true, cached values are stored with their source priority 
     * and higher-priority sources will be checked on subsequent reads
     * even if a cached value exists.
     */
    cacheRespectsPriority?: boolean;
    /** Default cache length in ms. */
    defaultCacheLength?: number;
    /** If true, Technician will prioritize running fewer interpreter functions over fewer source reads. */
    //TODO?: expensiveInterpreter?: boolean;
}

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