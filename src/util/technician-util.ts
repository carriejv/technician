import { ConfigEntity } from "../types/entity-types";
import { KnownConfigSource, KnownConfigSourceSync, MetaConfigSource, MetaConfigSourceSync } from "../types/source-types";

/** Utility functions used throughout Technician */
export class TechnicianUtil {
    /**
     * Checks if the return of an interpreter function is a raw value or an entity object with config.
     * @param entity The interpreter return value.
     */
    public static isEntityWithParams<T>(entity: ConfigEntity<T> | T): entity is ConfigEntity<T> {
        return typeof entity === 'object' && Object.keys(entity).includes('value');
    }

    /**
     * Checks if a ConfigSource is a raw source object or a KnownConfigSource object with config.
     * @param source The source object.
     */
    public static isSourceWithParams(source: MetaConfigSource | KnownConfigSource | MetaConfigSourceSync | KnownConfigSourceSync): source is KnownConfigSource | KnownConfigSourceSync {
        return Object.keys(source).includes('source');
    }

    /**
     * Adds a compatibility layer to a ConfigSourceSync, allowing it to be used as a ConfigSource.
     * No op on async sources.
     * @param source The sync config source
     * @returns The source, remapped to an async-compatible source if necessary.
     */
    public static remapSyncSource(source: MetaConfigSource | MetaConfigSourceSync): MetaConfigSource {
        // Typescript isn't okay with checking existance of a function, for some reason.
        const typelessSource = source as any;
        for(const fn of ['read', 'readAll', 'list']) {
            if(typeof typelessSource[`${fn}Sync`] === 'function') {
                typelessSource[fn] = typelessSource[`${fn}Sync`];
            }
        }
        return source as MetaConfigSource;
    }
}