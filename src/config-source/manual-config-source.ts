import { ConfigSource } from './config-source';

/**
 * A ConfigSource for building a manual key/value map.
 * May store and return any type T.
 */
export class ManualConfigSource<T> extends ConfigSource<T> {

    /**
     * Builds a new ManualConfigSource.
     * @param configMap A key: value object containing the config.
     */
    constructor(private configMap: {[key: string]: T | undefined} = {}) {
        super();
    }

    /** 
     * Reads added values.
     * @see {@link ConfigSource#readSync}
     */
    public readSync(key: string): T | undefined {
        return this.configMap[key];
    }

    /** 
     * Reads all added values.
     * @see {@link ConfigSource#readAllSync}
     */
    public readAllSync(): {[key: string]: T | undefined} {
        return this.configMap;
    }

    /** 
     * Lists all keys.
     * @see {@link ConfigSource#listSync}
     */
    public listSync(): string[] {
        return Object.keys(this.configMap);
    }

    /**
     * Sets key to value in the config map,
     * or several keys at once via an {key: value} object.
     * @param key A key to set, or a {key: value} object.
     * @param value The value, if setting only a single key.
     */
    public set(key: {[key: string]: T}): void;
    public set(key: string, value: T): void;
    public set(key: string | {[key: string]: T}, value?: T): void {
        if(typeof key === 'string') {
            this.configMap[key] = value;
        }
        else {
            for(const keyItem of Object.keys(key)) {
                this.configMap[keyItem] = key[keyItem];
            }
        }
    }

    /**
     * Deletes an entry from the config map.
     * @param key The key to unset.
     */
    public unset(key: string): void {
        delete this.configMap[key]; 
    }
}