/** 
 * Base ConfigSource class, which provides no functionality apart from a hybrid structure for (a)sync access.
 * When extending this class, async accessor functions should override the read, ... functions,
 * whereas sync accessors should override readSync, ...
 * 
 * If a ConfigSource only provides sync access, it should only override the sync functions. Overriding the async
 * functions instead will incorrectly cause the source to be interpreted as async-only and be ignored in sync reads.
 * 
 * Note that, conversely, sync-only sources are completely compatible with async reads.
 */
export class ConfigSource<T> {
    /**
     * Reads a single config entity by key asynchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     * @returns A Buffer containing the data associated with the key, or undefined it does not exist.
     */
    public read(key: string): Promise<T | undefined> {
        return this.read(key);
    }

    /**
     * Reads all config entities asynchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs, where the values are Buffers containing the data for each key.
     */
    public async readAll(): Promise<{[key: string]: T | undefined}> {
        return this.readAllSync();
    }

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAll().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    public async list(): Promise<string[]> {
        return this.listSync();
    };

    /**
     * Reads a single config entity by key synchronously, returning a data Buffer containing its contents.
     * If the read returns undefined, the value is considered to not exist in the source.
     * @param key The key of the secret to read.
     * @returns A Buffer containing the data associated with the key, or undefined it does not exist.
     */
    public readSync(key: string): T | undefined {
        return undefined;
    }

    /**
     * Reads all config entities synchronously, returning an object keyed by config key with data Buffers containing their contents.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs, where the values are Buffers containing the data for each key.
     */
    public readAllSync(): {[key: string]: T | undefined} {
        return {};
    }

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAllSync().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    public　listSync(): string[] {
        return [];
    }
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
