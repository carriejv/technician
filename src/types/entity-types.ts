import { ConfigSource } from './source-types';

/** Defines info about an entity being read and may be passed to middleware. */
export interface ConfigEntity<T> {
    /** The key of the entity. */
    key: string;
    /** The source from which the config value was read. */
    source: ConfigSource<T>;
    /** The data contents of the entity. */
    value: T;
}

/** Entity object stored in Technician's internal cache. */
export interface CachedConfigEntity<T> extends ConfigEntity<T> {
    /** Timestamp at which cached entity will expire. */
    cacheUntil: number;
    /** Priority of the source which generated the config value. */
    priority: number;
}
