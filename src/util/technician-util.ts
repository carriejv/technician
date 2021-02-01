import { ConfigSource, ConfigSourceParams, ConfigSourceParamsSync, ConfigSourceSync } from '../types/source-types';

/** Utility functions used throughout Technician */
export class TechnicianUtil {

    /**
     * Checks if a ConfigSource is a raw source object or a ConfigSourceParams object with config.
     * @param source The source object.
     */
    public static isSourceWithParams<T>(source: ConfigSource<T> | ConfigSourceParams<T> | ConfigSourceSync<T> | ConfigSourceParamsSync<T>): source is ConfigSourceParams<T> | ConfigSourceParamsSync<T> {
        return Object.keys(source).includes('source');
    }

    /**
     * Adds a compatability layer to config sources, allowing sync sources to be called via async functions
     * and defining no-op sync functions for async-only sources.
     * @param source The config source
     * @returns The hybrid source.
     */
    public static buildHybridSource<T>(source: ConfigSource<T> | ConfigSourceSync<T>): ConfigSource<T> & ConfigSourceSync<T> {
        // Typescript isn't okay with checking existance of a function, for some reason.
        const typelessSource = source as any;
        for(const fn of ['read', 'readAll', 'list']) {
            // Add async-compatible functions to sync sources.
            if(typeof typelessSource[fn] === 'undefined' && typeof typelessSource[`${fn}Sync`] === 'function') {
                typelessSource[fn] = typelessSource[`${fn}Sync`];
            }
            // Add noop functions to async-only sources.
            else if(typeof typelessSource[`${fn}Sync`] === 'undefined') {
                typelessSource[`${fn}Sync`] = () => undefined;
            }
        }
        return source as ConfigSource<T> & ConfigSourceSync<T>;
    }
}