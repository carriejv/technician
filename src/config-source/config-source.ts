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
/* eslint-disable @typescript-eslint/no-unused-vars */

 export class ConfigSource<T> {
    /**
     * Reads a single config entity by key asynchronously.
     * If undefined is returned, the source is ignored by Technician and other sources are checked.
     * @param key The key of the secret to read.
     * @returns The type T value associated with the key, or undefined it does not exist.
     */
    public async read(key: string): Promise<T | undefined> {
        return this.readSync(key);
    }

    /**
     * Reads all config entities asynchronously, returning an object keyed by config key with type T values.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs.
     */
    public async readAll(): Promise<{[key: string]: T | undefined}> {
        const result: {[key: string]: T | undefined} = {};
        for(const key of await this.list()) {
            result[key] = await this.read(key);
        }
        return result;
    }

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAll().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    public async list(): Promise<string[]> {
        return this.listSync();
    }

    /**
     * Reads a single config entity by key synchronously.
     * If undefined is returned, the source is ignored by Technician and other sources are checked.
     * @param key The key of the secret to read.
     * @returns The type T value associated with the key, or undefined it does not exist.
     */
    public readSync(key: string): T | undefined {
        return undefined;
    }

    /**
     * Reads all config entities synchronously, returning an object keyed by config key with type T values.
     * If a key has a value of undefined, it assumed that the key is present but the value is nonexistent or invalid.
     * @param key The key of the secret to read.
     * @returns An object of key/value pairs.
     */
    public readAllSync(): {[key: string]: T | undefined} {
        const result: {[key: string]: T | undefined} = {};
        for(const key of this.listSync()) {
            result[key] = this.readSync(key);
        }
        return result;
    }

    /** 
     * Lists all keys known to the config source.
     * This should provide all keys for the object returned by readAllSync().
     * @returns An array of strings containing all keys known to the config source. Should return an empty array if no keys are present.
     */
    public listSync(): string[] {
        return [];
    }
}
