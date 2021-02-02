import { Aliaser } from './aliaser';
import { ConfigSource } from '../../config-source/config-source';

/** Semantic API layer for building Aliasers. */
export class Alias {

    /**
     * Constructor for an Alias semantic builder.
     * Should not be called directly. use `Alias.key()` or `Alias.keys()` instead.
     * @param aliasMap The alias map to use.
     */
    constructor(private aliasMap: {[key: string]: string} = {}) {};

    /**
     * Creates a single key alias.
     * Must be followed by `to(aliasKey)`.
     * Example: `Alias.key('MY_ENV_VAR').to('my-var')...;`
     * @param key The key used by the base config source.
     */
    public static key(key: string) {
        return {
            to: (alias: string) => new Alias({[key]: alias})
        };
    }

    /**
     * Creates a map of keys to aliases.
     * Example: `Alias.keys({'MY_ENV_VAR': 'my-var', ...});`
     * @param key The key used by the base config source.
     */
    public static keys(aliasMap: {[key: string]: string}) {
        return new Alias(aliasMap);
    }

    /**
     * Adds a single key alias.
     * Must be followed by `to(aliasKey)`.
     * Example: `Alias.key('MY_ENV_VAR').to('my-var')...;`
     * @param key The key used by the base config source.
     */
    public key(key: string) {
        return {
            to: (alias: string) => new Alias({...this.aliasMap, [key]: alias})
        };
    }

    /**
     * Adds a map of keys to aliases.
     * Example: `Alias.keys({'MY_ENV_VAR': 'my-var', ...});`
     * @param key The key used by the base config source.
     */
    public keys(aliasMap: {[key: string]: string}) {
        return new Alias({...this.aliasMap, ...aliasMap});
    }

    /**
     * Returns an aliased config source using the configured keys and values with partial passthrough enabled.
     * This allows unaliased keys to be read as-is, but masks aliased keys behind their alias.
     */
    public withPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'partial');
    }

    /**
     * Returns an aliased config source using the configured keys and values with passthrough disabled.
     * Only explicitly set aliases will be readable.
     */
    public withoutPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'none');
    }

    /**
     * Returns an aliased config source using the configured keys and values with complete passthrough.
     * Config values will be readable as both their original keys and aliases that have been set.
     */
    public withFullPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'full');
    }
    
    /** 
     * Shorthand for default passhthrough behavior.
     * @see {@link Alias#withPassthrough}
     */
    public on = this.withPassthrough;

}