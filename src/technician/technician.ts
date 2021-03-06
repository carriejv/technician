import { ConfigNotFoundError } from '../error/config-not-found-error';
import { CachedConfigEntity } from '../types/entity-types';
import { TechnicianParams } from '../types/param-types';
import { ConfigSource } from '../config-source/config-source';
import { ConfigSourceArg, ConfigSourceParams } from '../types/param-types';
import { TechnicianUtil } from '../util/technician-util';

/** 
 * Technician manages a set of config sources, allowing retrieval of config from a central service
 * and providing caching and override capability.
 * 
 * Technician >= 2.0.0 is a hybrid config source, which may be used seamlessly as a source for
 * other Technician instances, which returns up config from all added async sources and sync-only
 * sources as possible.
 */
export class Technician<T> extends ConfigSource<T> {

    /** Internal entity cache. */
    private entityCache: Map<string, CachedConfigEntity<T>> = new Map();

    /** Array of known async entity sources. */
    private knownSources: ConfigSourceParams<T>[] = [];

    /**
     * Builds a new Technician instance.
     * @param configSource  The config source(s) to add. May be a ConfigSource object, an object containing a source and params,
     *                      or an array of these. A Technician instance may also be used as a ConfigSource for another Technician instance.
     * @param params        Params object. @see {@link TechnicianParams}.
     */
    public constructor(configSource?: ConfigSourceArg<T>, private params?: TechnicianParams) {
        super();
        if(configSource) {
            this.setSource(configSource);
        }
    }

    /**
     * Reads a single config value by key asynchronously.
     * @param key         The key of the config value to read.
     * @param fromSources If set, only searches specified sources.
     * @returns           A config value of type T or undefined if the key has no value.
     */
    public async read(key: string, fromSources?: ConfigSource<T>[]): Promise<T | undefined> {

        // Check cache. If cacheIgnoresPriority is enabled, return cached value automatically if it exists.
        const cacheItem = this.checkCache(key);
        if(cacheItem && this.params?.cacheIgnoresPriority) {
            return cacheItem.value;
        }

        // Initialize result buffer.
        let resultCandidate: CachedConfigEntity<T> | undefined;

        // If a cached item exists (cacheIgnoresPriority on), it is the starting candidate.
        if(cacheItem) {
            resultCandidate = cacheItem;
        }

        // Read in the target config data from potential sources.
        // If the key is an alias, all potential subkeys will be checked.
        let runningPriority = cacheItem?.priority;
        let isNewResult;
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {
            // Skip any source that doesn't exceed a currently-valid priority
            const sourcePriority = knownSource.priority ?? 0;
            if(runningPriority !== undefined && runningPriority >= sourcePriority) {
                continue;
            }
            // Skip any source with an ignoreIf that evaluates to true
            if(knownSource.ignoreIf?.()) {
                continue;
            }
            const readResult = await knownSource.source.read(key);
            // Skip any data blocks that do not exist.
            if(readResult === undefined) {
                continue;
            }
            // The candidate is valid.
            isNewResult = true;
            runningPriority = knownSource.priority;
            // Calculate cache length
            const cacheLength = knownSource.cacheFor ?? this.params?.defaultCacheLength;
            // Update result candidate
            resultCandidate = {
                key,
                value: readResult,
                priority: sourcePriority,
                source: knownSource.source,
                cacheUntil: cacheLength ? Date.now() + cacheLength : Infinity
            };
        }

        // Cache the value if it doesn't exist or has been replaced by a higher-priority result.
        if(resultCandidate !== undefined && isNewResult) {
            this.entityCache.set(key, resultCandidate);
        }

        // Return the value
        return resultCandidate?.value;
    }

    /**
     * Reads a single config value by key asynchronously.
     * Throws a `ConfigNotFoundError` error if the value is missing.
     * @param key         The key of the config value to read.
     * @param fromSources If set, only searches specified sources.
     * @throws            `ConfigNotFoundError` error if the value is missing.
     * @returns           A config value of type T.
     */
    public async require(key: string, fromSources?: ConfigSource<T>[]): Promise<T> {
        const value = await this.read(key, fromSources);
        if(value === undefined) {
            throw new ConfigNotFoundError(`Key [${key}] not found in any configured source.`);
        }
        return value;
    }

    /**
     * Reads all config values asynchronously.
     * Depending on the type and quantity of sources, this may be a very expensive operation. Use with caution.
     * If a key exists with no value, the key exists in at least one source but has no valid associated data.
     * @param fromSources If set, only searches specified sources.
     * @returns An object of key/value pairs, with values of type T.
     */
    public async readAll(fromSources?: ConfigSource<T>[]): Promise<{[key: string]: T | undefined}> {
        // Read all values present in list()
        const result: {[key: string]: T | undefined} = {};
        for(const key of await this.list(fromSources)) {
            result[key] = await this.read(key, fromSources);
        }
        return result;
    }
    
    /**
     * Lists all known config keys.
     * @param fromSources If set, only searches specified sources.
     * @returns An array of all known config keys contained in all added sources.
     */
    public async list(fromSources?: ConfigSource<T>[]): Promise<string[]> {
        // List all keys for all sources. Start with aliases created in Technician itself.
        let keys: string[] = [];
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {
            keys = keys.concat(await knownSource.source.list())
        }

        // Dedupe keys via Set.
        return Array.from(new Set(keys));
    }


    /**
     * Reads a single config value by key synchronously.
     * If a value cannot be accessed synchronously, it is considered undefined.
     * ConfigSources that do not provide sync compatability are ignored.
     * @param key         The key of the config value to read.
     * @param fromSources If set, only searches specified sources.
     * @returns           A config value of type T or undefined if the key has no value.
     */
    public readSync(key: string, fromSources?: ConfigSource<T>[]): T | undefined {

        // Check cache. If cacheIgnoresPriority is enabled, return cached value automatically if it exists.
        const cacheItem = this.checkCache(key);
        if(cacheItem && this.params?.cacheIgnoresPriority) {
            return cacheItem.value;
        }

        // Initialize result buffer.
        let resultCandidate: CachedConfigEntity<T> | undefined;

        // If a cached item exists (cacheIgnoresPriority on), it is the starting candidate.
        if(cacheItem) {
            resultCandidate = cacheItem;
        }

        // Read in the target config data from potential sources.
        // If the key is an alias, all potential subkeys will be checked.
        let runningPriority = cacheItem?.priority;
        let isNewResult;
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {
            // Skip any source that doesn't exceed a currently-valid priority
            const sourcePriority = knownSource.priority ?? 0;
            if(runningPriority !== undefined && runningPriority >= sourcePriority) {
                continue;
            }
            // Skip any source with an ignoreIf that evaluates to true
            if(knownSource.ignoreIf?.()) {
                continue;
            }
            const readResult = knownSource.source.readSync(key);
            // Skip any data blocks that do not exist.
            if(readResult === undefined) {
                continue;
            }
            // The candidate is valid.
            isNewResult = true;
            runningPriority = knownSource.priority;
            // Calculate cache length
            const cacheLength = knownSource.cacheFor ?? this.params?.defaultCacheLength;
            // Update result candidate
            resultCandidate = {
                key,
                value: readResult,
                priority: sourcePriority,
                source: knownSource.source,
                cacheUntil: cacheLength ? Date.now() + cacheLength : Infinity
            };
        }

        // Cache the value if it doesn't exist or has been replaced by a higher-priority result.
        if(resultCandidate !== undefined && isNewResult) {
            this.entityCache.set(key, resultCandidate);
        }

        // Return the value
        return resultCandidate?.value;
    }

    /**
     * Reads a single config value by key synchronously.
     * If a value cannot be accessed synchronously, it is considered undefined.
     * Throws a `ConfigNotFoundError` error if the value is missing.
     * @param key         The key of the config value to read.
     * @param fromSources If set, only searches specified sources.
     * @throws            `ConfigNotFoundError` error if the value is missing.
     * @returns           A config value of type T.
     */
    public requireSync(key: string, fromSources?: ConfigSource<T>[]): T {
        const value = this.readSync(key, fromSources);
        if(value === undefined) {
            throw new ConfigNotFoundError(`Key [${key}] not found in any configured source.`);
        }
        return value;
    }

    /**
     * Reads all config values synchronously.
     * If a value cannot be accessed synchronously, it is considered undefined.
     * Depending on the type and quantity of sources, this may be a very expensive operation. Use with caution.
     * If a key exists with no value, the key exists in at least one source but has no valid associated data.
     * @param fromSources If set, only searches specified sources.
     * @returns An object of key/value pairs, with values of type T.
     */
    public readAllSync(fromSources?: ConfigSource<T>[]): {[key: string]: T | undefined} {
        // Read all values present in list()
        const result: {[key: string]: T | undefined} = {};
        for(const key of this.listSync(fromSources)) {
            result[key] = this.readSync(key, fromSources);
        }
        return result;
    }

    /**
     * Lists all known sync-compatible config keys.
     * @param fromSources If set, only searches specified sources.
     * @returns An array of all known config keys contained in all added sources.
     */
    public listSync(fromSources?: ConfigSource<T>[]): string[] {
        // List all keys for all sources. Start with aliases created in Technician itself.
        let keys: string[] = [];
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {
            keys = keys.concat(knownSource.source.listSync())
        }

        // Dedupe keys via Set.
        return Array.from(new Set(keys));
    }

    /**
     * Returns all information on a known key, or undefined if the key is unknown.
     * `describe()` does not read a key that has not yet been read.
     * @param key The key to describe.
     * @returns An object containing the key, its cached value, and all related config.
     */
    public describe(key: string): CachedConfigEntity<T> | undefined {
        return this.entityCache.get(key);
    }

    /**
     * Exports all currently-known config as a {key: value} object.
     * This will not read any config that has not yet been read.
     * Use `readAll()` to capture all possible config.
     * @returns All currently-known config as a {key: value} object.
     */
    public export(): {[key: string]: T} {
        const result: {[key: string]: T} = {};
        for(const cacheItem of this.entityCache.values()) {
            result[cacheItem.key] = cacheItem.value;
        }
        return result;
    }

    /**
     * Adds ConfigSource(s) to Technician or edits existing sources.
     * A given ConfigSource instance may only be added once, so existing sources 
     * will be edited in place if passed into `setSource` again.
     * @param configSource  The config source(s) to add. May be a ConfigSource object, an object containing a source and params,
     *                      or an array of these. A Technician instance may also be used as a ConfigSource for another Technician instance.
     */
    public setSource(configSource: ConfigSourceArg<T>): void {
        // Wrap singular sources in array.
        if(!Array.isArray(configSource)) {
            configSource = [configSource as ConfigSource<T> | ConfigSourceParams<T>];
        }
        // Add sources.
        for(let source of configSource) {
            // Wrap raw sources in objects
            if(!TechnicianUtil.isSourceWithParams(source)) {
                source = {source};
            }
            // Remove the source if it already exists, to replace it with new config.
            // Adding the same source multiple times could create odd behavior.
            this.knownSources = this.knownSources.filter(x => x.source !== (source as ConfigSourceParams<T>).source);
            // Add the source w/ new config.
            this.knownSources.push(source as ConfigSourceParams<T>);
        }
    }

    /**
     * Remove ConfigSource(s) from Technician.
     * @param configSource  The config source(s) to remove. Sources are managed by reference, so the ConfigSource passed in
     *                      must be the same object passed in to setSource.
     *                      If a {source, priority} object was passed in, the only the source should be passed in to unsetSource.
     */
    public unsetSource(configSource: ConfigSource<T> | ConfigSource<T>[]): void {
        // Handle singular params.
        if(!Array.isArray(configSource)) {
            configSource = [configSource];
        }
        // Filter source list.
        this.knownSources = this.knownSources.filter(x => !(configSource as ConfigSource<T>[]).includes(x.source));
    }

    /** 
     * Clears the internal cache.
     * @param key If provided, only deletes a single value from the cache.
     */
    public clearCache(key?: string): void {
        if(key) {
            this.entityCache.delete(key);
        } else {
            this.entityCache = new Map();
        }
    }

    /** 
     * Reads a key from the cache, checking for validity.
     * Invalid and/or expired entries are automatically removed from the cache.
     * @param key The key.
     * @returns The cached entity, or undefined if the cached result did not exist or was expired / invalid.
     */
    private checkCache(key: string): CachedConfigEntity<T> | undefined {
        const cacheItem = this.entityCache.get(key);
        // Return nothing if nothing cached.
        if(!cacheItem) {
            return undefined;
        }
        // If cache is expired, remove it and return nothing.
        if(Date.now() > cacheItem.cacheUntil) {
            this.entityCache.delete(key);
            return undefined;
        }
        // Return valid cache item.
        return cacheItem;
    }

}
