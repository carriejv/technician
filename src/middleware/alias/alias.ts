import { Aliaser } from './aliaser';
import { ConfigSource } from '../../config-source/config-source';

/** Semantic API layer for building Aliasers. */
export class Alias {
        
    /** 
     * Shorthand for default passhthrough behavior.
     * @see {@link Alias#withPassthrough}
     */
    public on = this.withPassthrough;

    /**
     * Constructor for an Alias semantic builder.
     * Should not be called directly. Use `Alias.set()` or `new Alaiser()` instead.
     * @param aliasMap The alias map to use.
     */
    constructor(private aliasMap: {[key: string]: string}) {}

    /**
     * Creates a single alias.
     * Must be followed by `to(aliasKey)`.
     * Example: `Alias.set('my-var').to('MY_ENV_VAR')...;`
     *          `Alias.set({my-var: 'MY_ENV_VAR', ...})`;
     * @param alias The alias to create, or an object mapping multiple alias:sourceKey.
     */
    public static set(alias: string): {to: (sourceKey: string) => Alias};
    public static set(alias: {[key: string]: string}): Alias;
    public static set(alias: string | {[key: string]: string}): {to: (sourceKey: string) => Alias} | Alias {
        if(typeof alias === 'string') {
            return {
                to: (sourceKey: string) => new Alias({[alias]: sourceKey})
            };
        }
        else {
            return new Alias(alias);
        }
    }

    /**
     * Creates a single alias.
     * Must be followed by `to(aliasKey)`.
     * Example: `Alias.set('my-var').to('MY_ENV_VAR')...;`
     *          `Alias.set({my-var: 'MY_ENV_VAR', ...})`;
     * @param alias The alias to create, or an object mapping multiple alias:sourceKey.
     */
    public set(alias: string): {to: (sourceKey: string) => Alias};
    public set(alias: {[key: string]: string}): Alias;
    public set(alias: string | {[key: string]: string}): {to: (sourceKey: string) => Alias} | Alias {
        if(typeof alias === 'string') {
            return {
                to: (sourceKey: string) => {
                    this.aliasMap[alias] = sourceKey;
                    return this;
                }
            };
        }
        else {
            this.aliasMap = {...this.aliasMap, ...alias};
            return this;
        }
    }

    /**
     * Returns an aliased config source using the configured keys and aliases with passthrough enabled.
     * Config values will be readable as both their original keys and any aliases that have been set.
     */
    public withPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'full');
    }

    /**
     * Returns an aliased config source using the configured keys and aliases with passthrough disabled.
     * Only explicitly set aliases will be readable.
     */
    public withoutPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'none');
    }

    /**
     * Returns an aliased config source using the configured keys and values with partial passthrough.
     * Unaliased config values will be readable via their original keys, but aliased values
     * will only be readable by alias.
     */
    public withPartialPassthrough<T>(configSource: ConfigSource<T>): Aliaser<T> {
        return new Aliaser(configSource, this.aliasMap, 'partial');
    }

}