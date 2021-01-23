import { DefaultInterpretersSync } from "../interpreters/default-interpreters-sync";
import { ConfigNotFoundError } from "../error/config-not-found-error";
import { CachedConfigEntity } from "../types/entity-types";
import { TechnicianParams } from "../types/param-types";
import { InterpreterSync, KnownConfigSourceSync, MetaConfigSourceSync } from "../types/source-types";
import { TechnicianUtil } from "../util/technician-util";

/** 
 * Technician manages a set of config sources,
 * allowing retrieval of config from a central service
 * and providing caching and overriding capability.
 * Synchronous edition.
 */
export class TechnicianSync<T = Buffer> {
    
    /** Internal entity cache. */
    private entityCache: Map<string, CachedConfigEntity<T>> = new Map();

    /** Array of known sync entity sources. */
    private knownSources: KnownConfigSourceSync[] = [];

    /** Key alias map. */
    private aliases: Map<string, string[]> = new Map();

    /** 
     * Compatability layer for nesting TechnicianSync<Buffer> as a ConfigSourceSync.
     * This allows access via the normal Technician API, and the xSync API used internally by async/sync hybrid sources.
     */
    public readSync = this.read;

    /** 
     * Compatability layer for nesting TechnicianSync<Buffer> as a ConfigSourceSync.
     * This allows access via the normal Technician API, and the xSync API used internally by async/sync hybrid sources.
     */
    public readAllSync = this.readAll;

    /** 
     * Compatability layer for nesting TechnicianSync<Buffer> as a ConfigSourceSync.
     * This allows access via the normal Technician API, and the xSync API used internally by async/sync hybrid sources.
     */
    public listSync = this.list;

    /**
     * Builds a new TechnicianSync instance.
     * @param interpreter   The interpreter function to use when parsing config values.
                            This function will be called on a raw buffer after it is read. Its return will be used & cached as the true config value.
                            The return type of the interpreter function will be the type used for all values accessed by read(), etc.
                            If the interpreter returns undefined, the config value is treated as nonexistent and will not be returned by read(), etc.
                            Interpreters may be used to validatey, deserialize, decrypt, and/or do any other work necessary to parse the raw buffer into type T.
                            If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     * @param params Params object. @see {@link TechnicianParams}.
     * @constructor TechnicianSync
     */
    public constructor(
        private interpreter: InterpreterSync<T> = DefaultInterpretersSync.asBuffer() as any, // As any cast required because <T = Buffer> default is not properly recognized.
        private params?: TechnicianParams) {}

    /**
     * Reads a single config value by key synchronously, optionally parsing it into type T using an `interpreter` function.
     * @param key   The key of the config value to read.
     * @returns     A config value of type T or undefined if the key has no value.
     */
    public read(key: string): T | undefined {
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
        let runningPriority = cacheItem?.priority;
        let isNewResult;
        for(const sourceKey of sourceKeys) {
            for(const knownSource of this.knownSources) {
                // Skip any source that doesn't exceed a currently-valid priority
                if(runningPriority !== undefined && runningPriority > knownSource.priority) {
                    continue;
                }
                const data = knownSource.source.readSync(sourceKey);
                // Skip any data blocks that do not exist.
                if(!data) {
                    continue;
                }
                let interpreterResult = this.interpreter({key, data, source: knownSource.source});
                // If the interpreter returns undefined, it is assumed the input data was invalid and the source is skipped.
                if(interpreterResult === undefined) {
                    continue;
                }
                // The candidate is valid.
                isNewResult = true;
                runningPriority = knownSource.priority;
                // Build result object if a raw result was returned.
                if(!TechnicianUtil.isEntityWithParams(interpreterResult)) {
                    interpreterResult = {
                        value: interpreterResult
                    };
                }
                // Calculate cache length. Entity > Source > Global
                interpreterResult.cacheFor = interpreterResult.cacheFor ?? knownSource.cacheFor ?? this.params?.defaultCacheLength;
                // Update result candidate
                resultCandidate = {
                    key,
                    data,
                    value: interpreterResult.value,
                    priority: knownSource.priority,
                    source: knownSource.source,
                    cacheFor: interpreterResult.cacheFor,
                    cacheUntil: interpreterResult.cacheFor ? Date.now() + interpreterResult.cacheFor : Infinity
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
     * Reads a single config value by key synchronously, optionally parsing it into type T using an `interpreter` function.
     * Throws a `ConfigNotFoundError` error if the value is missing.
     * @param key           The key of the config value to read.
     * @throws              A `ConfigNotFoundError` error if the value is missing.
     * @returns             A config value of type T.
     */
    public require(key: string): T {
        const value = this.read(key);
        if(value === undefined) {
            throw new ConfigNotFoundError(`Key [${key}] not found in any configured source.`);
        }
        return value;
    }

    /**
     * Reads a all config values synchronously, optionally parsing them into type(s) T using `interpreter` function(s).
     * Depending on the type and quantity of sources, this may be a very expensive operation. Use with caution.
     * If a key exists with no value, the key exists in at least one source but has no valid associated data.
     * @returns An object of key/value pairs, with values of type T.
     */
    public readAll(): {[key: string]: T | undefined} {
        // Read all values present in list()
        const result: {[key: string]: T | undefined} = {};
        for(const key of this.list()) {
            result[key] = this.read(key);
        }
        return result;
    }
    
    /**
     * Lists all known config keys.
     * @returns An array of all known config keys contained in all added sources.
     */
    public list(): string[] {
        // List all keys for all sources. Start with aliases created in Technician itself.
        let keys: string[] = Array.from(this.aliases.keys());
        for(const knownSource of this.knownSources) {
            keys = keys.concat(knownSource.source.listSync())
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
     * Adds ConfigSource(s) to Technician.
     * If the ConfigSource already exists, this function may be used again to edit its config in place.
     * @param sources   The config source(s) to add. May be a ConfigSource object, an object containing a source and priority,
     *                  or an array of these. If passing an array of ConfigSources, the same priority will be used for each.
     *                  A Technician<Buffer> may also be used as a ConfigSource for a higher-level Technician instance.
     * @param priority  If passing in a raw ConfigSource, the priority may be passed separately.
     *                  When reading a value, the source with the highest priority will be used.
     *                  Default priority is 0.
     *                  This param is ignored if {source, priorirty} object(s) are passed.
     */
    public addSource(sources: MetaConfigSourceSync | KnownConfigSourceSync | (MetaConfigSourceSync | KnownConfigSourceSync)[], priority?: number): void {
        // Handle singular params.
        if(!Array.isArray(sources)) {
            sources = [sources as any];
        }
        // Add sources.
        for(let source of sources) {
            // Wrap raw sources in objects
            if(!TechnicianUtil.isSourceWithParams(source)) {
                source = {source, priority: priority ?? 0};
            }
            // Remove the source if it already exists, to replace it with new config.
            // Adding the same source multiple times could create odd behavior.
            this.knownSources = this.knownSources.filter(x => x.source !== (source as KnownConfigSourceSync).source);
            // Add the source w/ new config.
            this.knownSources.push(source);
        }
    }

    /**
     * Delete ConfigSource(s) from Technician.
     * @param sources   The config source(s) to delete. Sources are managed by reference, so the ConfigSource passed in
     *                  must be the same object passed in to addSource.
     *                  If a {source, priority} object was passed in, the only the source should be passed in to deleteSource.
     */
    public deleteSource(sources: MetaConfigSourceSync | MetaConfigSourceSync[]): void {
        // Handle singular params.
        if(!Array.isArray(sources)) {
            sources = [sources];
        }
        // Filter source list.
        this.knownSources = this.knownSources.filter(x => !(sources as MetaConfigSourceSync[]).includes(x.source));
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
