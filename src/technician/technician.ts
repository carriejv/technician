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
    private entityCache: Map<string, Map<ConfigSource<T>, CachedConfigEntity<T>>> = new Map();

    /** Map of the last known values returned for given keys. This does not necessarily mean they are still valid. */
    private knownValues: Map<string, CachedConfigEntity<T>> = new Map();

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
        if(this.params?.cacheIgnoresPriority) {
            const cacheItem = this.scanCache(key);
            if(cacheItem) {
                return cacheItem.value;
            }    
        }

        // Initialize result buffer.
        let resultCandidate;
        let runningPriority = -Infinity;

        const canMerge = this.params?.mergeObjects || this.params?.mergeArrays;

        // Read in the target config data from potential sources.
        // If the key is an alias, all potential subkeys will be checked.
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {

            // Skip any source that doesn't exceed a currently-valid priority
            // If merging is enabled, we should check if equal-priority sources can be merged.
            const sourcePriority = knownSource.priority ?? 0;
            if((!canMerge && runningPriority >= sourcePriority) || (canMerge && runningPriority > sourcePriority)) {
                continue;
            }

            // Skip any source with an ignoreIf that evaluates to true
            if(knownSource.ignoreIf?.()) {
                continue;
            }

            // Read value from cache or source if uncached
            let configEntity = this.checkCache(key, knownSource.source);
            if(!configEntity) {
                const value = await knownSource.source.read(key);
                // Skip any sources without data for the key
                if(value === undefined) {
                    continue;
                }
                // Cache newly read value
                const cacheLength = knownSource.cacheFor ?? this.params?.defaultCacheLength;
                configEntity =  {
                    key,
                    value,
                    priority: sourcePriority,
                    source: knownSource.source,
                    cacheUntil: cacheLength ? Date.now() + cacheLength : Infinity
                }
                this.setCache(key, knownSource.source, configEntity);
            }

            // If we have a new top priority, all earlier results are stomped.
            if(!resultCandidate || sourcePriority > runningPriority) {
                runningPriority = sourcePriority;
                resultCandidate = configEntity;
                continue;
            }

            // Handle merging
            // Merge arrays if enabled, the new result is an array, and we're already merging into an array
            if(this.params?.mergeArrays && Array.isArray(configEntity.value) && Array.isArray(resultCandidate.value)) {
                const merged = [...resultCandidate?.value as T & any[], ...configEntity.value] as T;
                // Set result candidate to the merged result.
                // Merged results are never cached and have no priority. They are rebuilt as needed.
                resultCandidate = {
                    key,
                    value: merged,
                    priority: -Infinity,
                    source: this,
                    cacheUntil: -Infinity
                }
                continue;
            }
            // Merge objects if enabled, the new result is an object, and we're already merging into an object
            // Arrays would pass this check also but we already handled them.
            if(this.params?.mergeObjects && this.isObject(configEntity.value) && this.isObject(resultCandidate.value)) {
                const merged = this.deepMergeObjects(configEntity.value, resultCandidate.value) as T;
                // Set result candidate to the merged result.
                // Merged results are never cached and have no priority. They are rebuilt as needed.
                resultCandidate = {
                    key,
                    value: merged,
                    priority: -Infinity,
                    source: this,
                    cacheUntil: -Infinity
                }
                continue;
            }
        }

        // Return the value
        if(resultCandidate) {
            this.knownValues.set(key, resultCandidate);
        }
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
        if(this.params?.cacheIgnoresPriority) {
            const cacheItem = this.scanCache(key);
            if(cacheItem) {
                return cacheItem.value;
            }    
        }

        // Initialize result buffer.
        let resultCandidate;
        let runningPriority = -Infinity;

        const canMerge = this.params?.mergeObjects || this.params?.mergeArrays;

        // Read in the target config data from potential sources.
        // If the key is an alias, all potential subkeys will be checked.
        for(const knownSource of fromSources ? this.knownSources.filter(x => fromSources.includes(x.source)) : this.knownSources) {

            // Skip any source that doesn't exceed a currently-valid priority
            // If merging is enabled, we should check if equal-priority sources can be merged.
            const sourcePriority = knownSource.priority ?? 0;
            if((!canMerge && runningPriority >= sourcePriority) || (canMerge && runningPriority > sourcePriority)) {
                continue;
            }

            // Skip any source with an ignoreIf that evaluates to true
            if(knownSource.ignoreIf?.()) {
                continue;
            }

            // Read value from cache or source if uncached
            let configEntity = this.checkCache(key, knownSource.source);
            if(!configEntity) {
                const value = knownSource.source.readSync(key);
                // Skip any sources without data for the key
                if(value === undefined) {
                    continue;
                }
                // Cache newly read value
                const cacheLength = knownSource.cacheFor ?? this.params?.defaultCacheLength;
                configEntity =  {
                    key,
                    value,
                    priority: sourcePriority,
                    source: knownSource.source,
                    cacheUntil: cacheLength ? Date.now() + cacheLength : Infinity
                }
                this.setCache(key, knownSource.source, configEntity);
            }

            // If we have a new top priority, all earlier results are stomped.
            if(!resultCandidate || sourcePriority > runningPriority) {
                runningPriority = sourcePriority;
                resultCandidate = configEntity;
                continue;
            }

            // Handle merging
            // Merge arrays if enabled, the new result is an array, and we're already merging into an array
            if(this.params?.mergeArrays && Array.isArray(configEntity.value) && Array.isArray(resultCandidate.value)) {
                const merged = [...resultCandidate?.value as T & any[], ...configEntity.value] as T;
                // Set result candidate to the merged result.
                // Merged results are never cached and have no priority. They are rebuilt as needed.
                resultCandidate = {
                    key,
                    value: merged,
                    priority: -Infinity,
                    source: this,
                    cacheUntil: -Infinity
                }
                continue;
            }
            // Merge objects if enabled, the new result is an object, and we're already merging into an object
            // Arrays would pass this check also but we already handled them.
            if(this.params?.mergeObjects && this.isObject(configEntity.value) && this.isObject(resultCandidate.value)) {
                const merged = this.deepMergeObjects(configEntity.value, resultCandidate.value) as T;
                // Set result candidate to the merged result.
                // Merged results are never cached and have no priority. They are rebuilt as needed.
                resultCandidate = {
                    key,
                    value: merged,
                    priority: -Infinity,
                    source: this,
                    cacheUntil: -Infinity
                }
                continue;
            }
        }

        // Return the value
        if(resultCandidate) {
            this.knownValues.set(key, resultCandidate);
        }
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
        return this.knownValues.get(key);
    }

    /**
     * Exports all currently-known config as a {key: value} object.
     * This will not read any config that has not yet been read.
     * Use `readAll()` to capture all possible config.
     * @returns All currently-known config as a {key: value} object.
     */
    public export(): {[key: string]: T} {
        const result: {[key: string]: T} = {};
        for(const resultItem of this.knownValues.values()) {
            result[resultItem.key] = resultItem.value;
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
     * Sets a new cache item.
     * @param key The key.
     * @param source The origin config source of the value.
     * @param value The value to cache.
     */
    private setCache(key: string, source: ConfigSource<T>, value: CachedConfigEntity<T>): void {
        const keyCache = this.entityCache.get(key);
        if(!keyCache) {
            this.entityCache.set(key, new Map());
        }
        this.entityCache.get(key)?.set(source, value);
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
     * Scans cache entries for a key, checking for validity.
     * Invalid and/or expired entries are automatically removed from the cache.
     * @param key The key.
     * @param fromSource If set, only looks for cached results from the given source.
     * @returns The cached entity, or undefined if the cached result did not exist or was expired / invalid.
     */
    private scanCache(key: string): CachedConfigEntity<T> | undefined {
        const keyCache = this.entityCache.get(key);
        // Exit early if there are no cached results for the key.
        if(!keyCache) {
            return undefined;
        }
        // Scan source caches for the key.
        let cacheItem: CachedConfigEntity<T> | undefined;
        let runningPriority = -Infinity;
        for(const source of this.knownSources) {
            const sourcePriority = source.priority ?? 0;
            if(sourcePriority > runningPriority) {
                const candidateItem = this.checkCache(key, source.source);
                if(candidateItem) {
                    runningPriority = sourcePriority;
                    cacheItem = candidateItem;
                }
            }
        }
        return cacheItem;
    }

    /** 
     * Reads a specific cache item from a specific source.
     * Invalid and/or expired entries are automatically removed from the cache.
     * @param key The key.
     * @param fromSource If set, only looks for cached results from the given source.
     * @returns The cached entity, or undefined if the cached result did not exist or was expired / invalid.
     */
    private checkCache(key: string, fromSource: ConfigSource<T>): CachedConfigEntity<T> | undefined {
        const cacheItem = this.entityCache.get(key)?.get(fromSource);
        // Return nothing if nothing cached.
        if(!cacheItem) {
            return undefined;
        }
        if(Date.now() > cacheItem.cacheUntil) {
            this.entityCache.get(key)?.delete(fromSource);
            return undefined;
        }
        return cacheItem;
    }

    /** 
     * Deep merges two objects. Keys in the 2nd object have precedence.
     * @param a The first object
     * @param b The second object
     * @returns The merged object.
     */
    private deepMergeObjects(a: {[key: string]: any}, b: T & {[key: string]: any}): {[key: string]: any} {
        const merged: {[key: string]: any} = { ...a };
        for(const key of Object.keys(b)) {
            if(this.isObject(a[key]) && this.isObject(b[key])) {
                merged[key] = this.deepMergeObjects(a[key], b[key])
            } else {
                merged[key] = b[key];
            }
        }
        return merged
    }

    /** 
     * Checks if a value T is an Object.
     * @param value The value.
     * @returns bool
     */
    private isObject(obj: T): obj is T & {[key: string]: any} {
        return obj === Object(obj)
    }

}
