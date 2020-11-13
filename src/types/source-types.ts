import { ConfigEntity, RawConfigEntity } from "./entity-types";

/** Defines a source of config accessible asynchronously by Technician. */
export interface ConfigSource {
    /**
     * Reads a single config entity by key asynchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     */
    read(key: string): Promise<Buffer> | undefined;

    /**
     * Reads all config entities asynchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     */
    readAll(): Promise<{[key: string]: Buffer}> | undefined;
}

/** Defines a source of config accessible synchnronously by Technician. */
export interface ConfigSourceSync {
    /**
     * Reads a single config entity by key synchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     */
    readSync(key: string): Promise<Buffer> | undefined;

    /**
     * Reads all config entities synchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     */
    readAllSync(): Promise<{[key: string]: Buffer}> | undefined;
}

/** Internal type used by Technician to store an async ConfigSource and related config. */
export interface KnownConfigSource {
    /** The ConfigSource */
    source: ConfigSource,
    /** The priority of the source. Highest number wins when multiple sources provide the same config key. */
    priority: number,
    /** Default cache length in ms for values retrieved from this source. Used in place of Technician default if set. */
    cacheFor?: number
}

/** Internal type used by Technician to store a sync ConfigSource and related config. */
export interface KnownConfigSourceSync {
    /** The ConfigSource */
    source: ConfigSourceSync,
    /** The priority of the source. Highest number wins when multiple sources provide the same config key. */
    priority: number,
    /** Default cache length in ms for values retrieved from this source. Used in place of Technician default if set. */
    cacheFor?: number
}

/** Defines an interpreter function. */
export type Interpreter<T> = (rawEntity: RawConfigEntity) => Promise<T> | Promise<ConfigEntity<T>>

/** Defines a synchronous interpreter function. */
export type InterpreterSync<T> = (rawEntity: RawConfigEntity) => T | ConfigEntity<T>

/** Defines an interpreter predicate function. */
export type Predicate = (rawEntity: RawConfigEntity) => Promise<boolean>;

/** Defines a synchronous interpreter predicate function. */
export type PredicateSync = (rawEntity: RawConfigEntity) => boolean;

/** Defines an interpreter which is only run if a given condition is satisfied. */
export interface PredicatedInterpreter<T> {
    interpreter: Interpreter<T>;
    predicate: Predicate;
}

/** Defines a synchronous interpreter which is only run if a given condition is satisfied. */
export interface PredicatedInterpreterSync<T> {
    interpreter: InterpreterSync<T>;
    predicate: PredicateSync;
}
