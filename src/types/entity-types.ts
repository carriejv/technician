import { ConfigSource } from "./source-types";

/** Defines info about an entity being read, pre-interpretation. */
export interface RawConfigEntity {
    /** The key of the entity. */
    key: string;
    /** The source from which the config value was read. */
    source: ConfigSource
    /** The data contents of the entity. */
    data: Buffer;
}

/** 
 * Defines a parsed config value.
 * This object may be returned by interpreter functions to configure a specific entity.
 */
export interface ConfigEntity<T> {
    /** The intepreted value to store and return. */
    value: T;
    /** Timestamp for cache expirey. If unset, caches forever. If negative, does not cache. */
    cacheFor?: number;
}

/** Entity object stored in the internal cache. */
export interface CachedConfigEntity<T> extends RawConfigEntity, ConfigEntity<T> {
    /** Timestamp at which cached entity will expire. */
    cacheUntil: number;
    /** Priority of the source which generated the config value. */
    priority: number;
}
