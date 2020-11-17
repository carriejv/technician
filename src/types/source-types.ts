import { Technician } from "..";
import { ConfigEntity, RawConfigEntity } from "./entity-types";

/** Defines a source of config accessible asynchronously by Technician. */
export interface ConfigSource {
    /**
     * Reads a single config entity by key asynchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     * @returns A Buffer containing the data associated with the key, or undefined it does not exist.
     */
    read(key: string): Promise<Buffer> | undefined;

    /**
     * Reads all config entities asynchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs, where the values are Buffers containing the data for each key.
     */
    readAll(): Promise<{[key: string]: Buffer}> | undefined;

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAll().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    list(): Promise<[string]>;
}

/** Defines a source of config accessible synchnronously by Technician. */
export interface ConfigSourceSync {
    /**
     * Reads a single config entity by key synchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     * @returns A Buffer containing the data associated with the key, or undefined it does not exist.
     */
    readSync(key: string): Promise<Buffer> | undefined;

    /**
     * Reads all config entities synchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs, where the values are Buffers containing the data for each key.
     */
    readAllSync(): Promise<{[key: string]: Buffer}> | undefined;

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAllSync().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    listSync(): [string];
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