import { DefaultInterpreters } from "..";
import { CachedConfigEntity, ConfigEntity, RawConfigEntity } from "../types/entity-types";
import { TechnicianParams } from "../types/param-types";
import { Interpreter, InterpreterSync, KnownConfigSource, PredicatedInterpreter, PredicatedInterpreterSync } from "../types/source-types";

/** 
 * Technician manages a set of config sources,
 * allowing retrieval of config from a central service
 * and providing caching and overriding capability.
 */
export class Technician {
    
    // TODO: Move interpreters out of read calls?

    /** Internal entity cache. This entity cache does not track type, but should be consistent as long as it is not directly modified. */
    private entityCache: Map<string, CachedConfigEntity<any>> = new Map();

    /** Array of known async entity sources. */
    private knownSources: KnownConfigSource[] = [];

    /**
     * Builds a new Technician instance.
     * @param params Params object. @see {@link TechnicianParams}.
     * @constructor Technician
     */
    public constructor(private params?: TechnicianParams) {}

    /**
     * Reads a single config value by key asynchronously, optionally parsing it into type T using an `interpreter` function.
     * @param key           The key of the config value to read
     * @param interpreter   The interpreter function to run on the config value.
     *                      This function will be called on a config value after it is read, setting the config value to its return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data as type T.
     *                      If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     *                      If an interpreter and predicate are provided, config sources that do not match the predicate will be ignored.
     */
    public async read<T = Buffer>(key: string, interpreter?: Interpreter<T> | PredicatedInterpreter<T>): Promise<T | undefined> {
        // Check cache. If cacheRespectsPriority is not enabled, return cached value automatically if it exists.
        const cacheItem = this.entityCache.get(key);
        if(cacheItem && !this.params?.cacheRespectsPriority) {
            return cacheItem.value;
        }

        // Add true predicate to unpredicated interpreter.
        if(!this.isPredicatedInterpreter(interpreter)) {
            interpreter = {
                interpreter: interpreter ?? DefaultInterpreters.asBuffer() as any,
                predicate: async () => true
            }
        }

        // Initialize result buffer.
        let resultCandidate: CachedConfigEntity<T> | undefined;

        // If a cached item exists (cacheRespectsPriority on), it is the starting candidate.
        if(cacheItem) {
            resultCandidate = cacheItem;
        }

        // Read in the target config data from potential sources.
        let runningPriority = cacheItem?.priority;
        let isNewResult;
        for(const knownSource of this.knownSources) {
            // Skip any source that doesn't exceed a currently-valid priority
            if(runningPriority !== undefined && runningPriority > knownSource.priority) {
                continue;
            }
            const data = await knownSource.source.read(key);
            // Skip any data blocks that do not exist or fail the predicate check.
            if(!data || ! await interpreter.predicate({key, data, source: knownSource.source})) {
                continue;
            }
            let interpreterResult = await interpreter.interpreter({key, data, source: knownSource.source});
            // If the interpreter returns undefined, it is assumed the input data was invalid and the source is skipped.
            if(interpreterResult === undefined) {
                continue;
            }
            // The candidate is valid. Check priority.
            // Update candidate if priority is higher than existing, or no existing candidate.
            if(runningPriority !== undefined && knownSource.priority > runningPriority) {
                isNewResult = true;
                runningPriority = knownSource.priority;
                // Build result object if a raw result was returned.
                if(!this.isEntityObject(interpreterResult)) {
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
     * Reads a all config values asynchronously, optionally parsing them into type(s) T using `interpreter` function(s).
     * Depending on the type and quantity of sources, this may be a very expensive operation. Use with caution.
     * @param interpreter   The interpreter function(s) to run on the config value.
     *                      This function will be called on a config value after it is read, setting the config value to its return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data as type T.
     *                      If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     *                      If an interpreter has a predicate provided, config sources that do not match the predicate will be ignored.
     */
    public async readAll<T = Buffer>(interpreter?: Interpreter<T> | PredicatedInterpreter<T> | Interpreter<T>[] | PredicatedInterpreter<T>[]): Promise<{[key: string]: T}> {
        const configEntityMap: {[key: string]: Partial<CachedConfigEntity<T>>[]} = {};

        // Seed the configEntityMap with cached values.


        // Perform a readAll from all available sources and build a map of data buffers.
        for(const knownSource of this.knownSources) {
            const readResult = await knownSource.source.readAll();
            // Skip sources with no return.
            if(!readResult) {
                continue;
            }
            for(const key of Object.keys(readResult)) {
                // Initialize key returns if first result
                if(!configEntityMap[key]) {
                    configEntityMap[key] = [];
                }
                // Push new result.
                configEntityMap[key].push({
                    data: readResult[key],
                    priority: knownSource.priority,
                    source: knownSource.source
                });
            }
        }

        // Refine result object by finding highest priority valid intepretation for each key.
        const finalConfigMap: {[key: string]: Partial<CachedConfigEntity<T>>} = {};
        for(const key of Object.keys(configEntityMap)) {
            let resultCandidate: Partial<CachedConfigEntity<T>>;
            for()
        }
        
        // Check cache. If cacheRespectsPriority is not enabled, return cached value automatically if it exists.
        const cacheItem = this.entityCache.get(key);
        if(cacheItem && !this.params?.cacheRespectsPriority) {
            return cacheItem.value;
        }

        // Add true predicate to unpredicated interpreter.
        if(!this.isPredicatedInterpreter(interpreter)) {
            interpreter = {
                interpreter: interpreter ?? DefaultInterpreters.asBuffer() as any,
                predicate: async () => true
            }
        }

        // Initialize return values (to cached item, if it exists).
        let data = cacheItem?.data;
        let result = cacheItem?.value;
        let priority = cacheItem?.priority
        let resultSource: KnownConfigSource | undefined = cacheItem ? {source: cacheItem.source, priority: cacheItem.priority} : undefined;
        let isNewResult = false;

        // Filter source list to only include sources of higher priority than existing (cacheRespectsPriority).
        const potentialSources = this.knownSources.filter(e => priority !== undefined && e.priority > priority);

        // Read in the target config data from potential sources.
        for(const knownSource of potentialSources) {
            data = await knownSource.source.read(key);
            // Skip any interpreters which fail their predicate.
            if(! await interpreter.predicate({key, data, source: knownSource.source})) {
                continue;
            }
            // If source has a higher priority than the currently-used source, replace it.
            if(priority === undefined || knownSource.priority > priority) {
                const interpreterResult = await interpreter.interpreter({key, data, source: knownSource.source});
                // Update final result if interpreter result exists.
                if(interpreterResult !== undefined) {
                    result = interpreterResult;
                    resultSource = knownSource;
                    priority = knownSource.priority;
                    isNewResult = true;
                }
            }
        }

        // If no result found, return undefined.
        // The second condition exists to convince TS that resultSource, priority exists.
        if(result === undefined || priority === undefined || resultSource === undefined) {
            return undefined;
        }

        // Build result object if a raw result was returned.
        if(!this.isEntityObject(result)) {
            result = {
                value: result
            };
        }

        // Calculate cache length. Entity > Source > Global
        result.cacheFor = result.cacheFor ?? resultSource.cacheFor ?? this.params?.defaultCacheLength;

        // Cache the value if it doesn't exist or has been replaced by a higher-priority result.
        if(isNewResult) {
            this.entityCache.set(key, {
                key,
                data,
                value: result.value,
                source: resultSource.source,
                priority: priority,
                cacheFor: result.cacheFor,
                cacheUntil: result.cacheFor ? Date.now() + result.cacheFor : Infinity
            });
        }

        // Return the value
        return result.value;
    }

    /** 
     * Clears the internal cache.
     * @param key If provided, only deletes a single value from the cache.
     */
    public clearCache(key?: string) {
        if(key) {
            this.entityCache.delete(key);
        } else {
            this.entityCache = new Map();
        }
    }

    /**
     * Switches Technician to run in asynchronous mode.
     * This will clear the cache and all configured sources.
     * In async mode, all sources, interpreters, and predicates must be asynchronous.
     */
    public switchToAsync() {
        
    }

    /**
     * Switches Technician to run in synchronous mode.
     * This will clear the cache and all configured sources.
     * In sync mode, all sources, interpreters, and predicates must be synchronous.
     */
    public switchToSync() {

    }

    private getHighestPriorityRawEntity(rawEntities: RawConfigEntity[])

    /**
     * Checks if the return of an interpreter function is a raw value or an entity object with config.
     * @param entity The interpreter return value.
     */
    private isEntityObject<T>(entity: ConfigEntity<T> | T): entity is ConfigEntity<T> {
        return typeof entity === 'object' && Object.keys(entity).includes('value');
    }

    /**
     * Checks if an interpreter is a basic interpreter or an object with a predicate configured.
     * @param entity The interpreter return value.
     */
    private isPredicatedInterpreter<T>(interpreter: Interpreter<T> | PredicatedInterpreter<T> |  InterpreterSync<T> | PredicatedInterpreterSync<T> | undefined): interpreter is PredicatedInterpreter<T> | PredicatedInterpreterSync<T> {
        return typeof interpreter === 'object' && Object.keys(interpreter).includes('interpreter') && Object.keys(interpreter).includes('predicate');
    }
}
