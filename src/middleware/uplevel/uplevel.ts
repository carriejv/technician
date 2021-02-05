import { Upleveler } from './upleveler';
import { ConfigSource } from '../../config-source/config-source';

/** Semantic API layer for building Uplevelers. */
export class Uplevel {

    /**
     * Constructor for an Uplevel semantic builder.
     * Should not be called directly. Use `Uplevel.only()`, `Uplevel.all`, or `new Upleveler()` instead.
     * @param uplevelKeys The keys to uplevel.
     * @param cacheLength The upleveler cache length to set.
     */
    constructor(private uplevelKeys?: string[], private cacheLength?: number) {}

    /**
     * Uplevels all keys.
     */
    public static all(): Uplevel {
        return new Uplevel();
    }

    /**
     * Uplevels only a single key or array of keys.
     * @param key The key(s) to move up a level.
     */
    public static only(key: string | string[]): Uplevel {
        return new Uplevel(Array.isArray(key) ? key : [key]);
    }
    
    /** 
     * Ends a semantic string and returns the configured Upleveler
     */
    public on<T>(configSource: ConfigSource<{[key: string]: T}>): Upleveler<T> {
        return new Upleveler(configSource, this.uplevelKeys, this.cacheLength);
    }

    /**
     * Sets the Upleveler internal cache length. Default 10000 (10s).
     * This cache exists to prevent burst reads repeatedly accessing the same key on the base source.
     * @param length Cache duration in ms.
     */
    public withCache(length: number): Uplevel {
        return new Uplevel(this.uplevelKeys, length);
    }

    /**
     * Disables the short-lived internal cache on the Upleveler.
     * This may substantially increase burst read cost, but guarentees immediate
     * propegation of changes from the base source.
     */
    public withoutCache(): Uplevel {
        return new Uplevel(this.uplevelKeys, -1);
    }

}
