import { ConfigNotFoundError } from '../error/config-not-found-error';
import { CachedConfigEntity } from '../types/entity-types';
import { TechnicianParams } from '../types/param-types';
import { ConfigSource, ConfigSourceParams } from '../types/source-types';
import { TechnicianUtil } from '../util/technician-util';

/** 
 * Technician manages a set of config sources,
 * allowing retrieval of config from a central service
 * and providing caching and overriding capability.
 */
export class Technician<T> implements ConfigSource<T> {

    /** Internal entity cache. */
    private entityCache: Map<string, CachedConfigEntity<T>> = new Map();

    /** Array of known async entity sources. */
    private knownSources: ConfigSourceParams<T>[] = [];

    /** Key alias map. */
    private aliases: Map<string, string[]> = new Map();

    /**
     * Builds a new Technician instance.
     * @param configSource  The config source(s) to add. May be a ConfigSource object, an object containing a source and params,
     *                      or an array of these. A Technician instance may also be used as a ConfigSource for another Technician instance.
     * @param params        Params object. @see {@link TechnicianParams}.
     * @constructor Technician
     */
    public constructor(configSource: ConfigSource<T> | ConfigSourceParams<T> | (ConfigSource<T> | ConfigSourceParams<T>)[], private params?: TechnicianParams) {
        this.addSource(configSource);
    }

    /**
     * Reads a single config value by key asynchronously, optionally parsing it into type T using an `interpreter` function.
     * @param key   The key of the config value to read.
     * @returns     A config value of type T or undefined if the key has no value.
     */
    public async read(key: string): Promise<T | undefined> {

        // Check cache. If cacheRespectsPriority is not enabled, return cached value automatically if it exists.
        const cacheItem = this.checkCache(key);
        if(cacheItem && !this.params?.cacheRespectsPriority) {
            return cacheItem.value;
        }

        // Check if key is an alias.
        const sourceKeys = this.aliases.get(key) ?? [key];

        // Initialize result buffer.
        let resultCandidate: CachedConfigEntity<T> | undefined;

        // If a cached item exists (cacheRespectsPriority on), it is the starting candidate.
        if(cacheItem) {
            resultCandidate = cacheItem;
        }

        // Read in the target config data from potential sources.
        // If the key is an alias, all potential subkeys will be checked.
        let runningPriority = cacheItem?.priority;
        let isNewResult;
        for(const sourceKey of sourceKeys) {
            for(const knownSource of this.knownSources) {
                // Skip any source that doesn't exceed a currently-valid priority
                const sourcePriority = knownSource.priority ?? 0;
                if(runningPriority !== undefined && runningPriority > sourcePriority) {
                    continue;
                }
                // Skip any source with an ignoreIf that evaluates to true
                if(knownSource.ignoreIf?.()) {
                    continue;
                }
                let readResult = await knownSource.source.read(sourceKey);
                // Skip any data blocks that do not exist.
                if(!readResult) {
                    continue;
                }
                // The candidate is valid.
                isNewResult = true;
                runningPriority = knownSource.priority;
                // Build result object if a raw result was returned.
                if(!TechnicianUtil.isEntityWithParams(readResult)) {
                    readResult = {
                        value: readResult
                    };
                }
                // Calculate cache length. Entity > Source > Global
                readResult.cacheFor = readResult.cacheFor ?? knownSource.cacheFor ?? this.params?.defaultCacheLength;
                // Update result candidate
                resultCandidate = {
                    key,
                    value: readResult.value,
                    priority: sourcePriority,
                    source: knownSource.source,
                    cacheFor: readResult.cacheFor,
                    cacheUntil: readResult.cacheFor ? Date.now() + readResult.cacheFor : Infinity
                };
            }
        }

        // Cache the value if it doesn't exist or has been replaced by a higher-priority result.
        if(resultCandidate !== undefined && isNewResult) {
            this.entityCache.set(key, resultCandidate);
        }

        // Return the value
        return resultCandidate?.value;
    }

    /**
     * Reads a single config value by key asynchronously, optionally parsing it into type T using an `interpreter` function.
     * Throws a `ConfigNotFoundError` error if the value is missing.
     * @param key   The key of the config value to read.
     * @throws      `ConfigNotFoundError` error if the value is missing.
     * @returns     A config value of type T.
     */
    public async require(key: string): Promise<T> {
        const value = await this.read(key);
        if(value === undefined) {
            throw new ConfigNotFoundError(`Key [${key}] not found in any configured source.`);
        }
        return value;
    }

    /**
     * Reads a all config values asynchronously, optionally parsing them into type(s) T using `interpreter` function(s).
     * Depending on the type and quantity of sources, this may be a very expensive operation. Use with caution.
     * If a key exists with no value, the key exists in at least one source but has no valid associated data.
     * @returns An object of key/value pairs, with values of type T.
     */
    public async readAll(): Promise<{[key: string]: T | undefined}> {
        // Read all values present in list()
        const result: {[key: string]: T | undefined} = {};
        for(const key of await this.list()) {
            result[key] = await this.read(key);
        }
        return result;
    }
    
    /**
     * Lists all known config keys.
     * @returns An array of all known config keys contained in all added sources.
     */
    public async list(): Promise<string[]> {
        // List all keys for all sources. Start with aliases created in Technician itself.
        let keys: string[] = Array.from(this.aliases.keys());
        for(const knownSource of this.knownSources) {
            keys = keys.concat(await knownSource.source.list())
        }

        // Dedupe keys via Set.
        return Array.from(new Set(keys));
    }

    /**
     * Creates an alias key. An alias key can match any number of other keys.
     * When read, the alias will be treated as a single key, reading from any underlying keys
     * and picking the highest priority result from the entire set.
     * This can be used to create a single config entity from multiple sources,
     * such as a `id_rsa.pub` file and an `RSA_PUBKEY` env var.
     * The alias does not prevent directly reading a single underlying key.
     * The alias is a distinct entity in the cache. Reading an alias will not use cached results from previous reads of specific keys.
     * @param aliasKey The alias key to create.
     * @param sourceKeys The source keys to alias.
     */
    public alias(aliasKey: string, sourceKeys: string[]): void {
        this.aliases.set(aliasKey, sourceKeys);
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
     * It should be paired with `readAll()` to export all possible config.
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
     * A given ConfigSource instance may only be added once, so it will be edited in place
     * if passed into `addSource` again.
     * @param configSource  The config source(s) to add. May be a ConfigSource object, an object containing a source and params,
     *                      or an array of these. A Technician instance may also be used as a ConfigSource for another Technician instance.
     */
    public addSource(configSource: ConfigSource<T> | ConfigSourceParams<T> | (ConfigSource<T> | ConfigSourceParams<T>)[]): void {
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
            // Add sync source compatability layer
            source.source = TechnicianUtil.remapSyncSource(source.source)
            // Remove the source if it already exists, to replace it with new config.
            // Adding the same source multiple times could create odd behavior.
            this.knownSources = this.knownSources.filter(x => x.source !== (source as ConfigSourceParams<T>).source);
            // Add the source w/ new config.
            this.knownSources.push(source as ConfigSourceParams<T>);
        }
    }

    /**
     * Delete ConfigSource(s) from Technician.
     * @param configSource  The config source(s) to delete. Sources are managed by reference, so the ConfigSource passed in
     *                      must be the same object passed in to addSource.
     *                      If a {source, priority} object was passed in, the only the source should be passed in to deleteSource.
     */
    public deleteSource(configSource: ConfigSource<T> | ConfigSource<T>[]): void {
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
