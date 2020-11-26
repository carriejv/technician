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
