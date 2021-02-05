import { ConfigSource } from '../../config-source/config-source';

/** 
 * Upleveler is a middleware ConfigSource that returns keys and values 
 * from an object-returning source directly to Technician.
 * Technician.read('x') == {key: value} -> Technician.read('key') == value
 * 
 * The upleveler maintains a short-lived internal cache to reduce burst read cost, so changes to the base source
 * may not be immediately synchronized. This is configurable by setting `internalCacheLength`.
 */
export class Upleveler<T> extends ConfigSource<T> {

    /** Internal cache. */
    private cache: {[key: string]: T | undefined} = {};

    /** Cache expirey timestamp. */
    private cacheExpires = -Infinity;

    /**
     * Builds a new Upleveler.
     * @param configSource        The base config source.
     * @param uplevelKeys         The keys on the base source to move up a level. If omitted or falsy, all keys are upleveled.
     * @param internalCacheLength The upleveler maintains a short-lived internal cache to reduce burst read cost, so changes to the base source
     *                            may not be immediately synchronized. This cache length defaults to 10000 (10s), but can be set (or disabled by setting to a negative value).
     *                            Permanent caching may be enabled by setting `internalCacheLength` to 0. If set, the base source will only ever be read once (on first `read()` call).
     */
    public constructor(private configSource: ConfigSource<{[key: string]: T | undefined}>, private uplevelKeys?: string[], private internalCacheLength: number = 10000) {
        super();
    }

    /** 
     * Reads an upleveled value.
     * @see {@link ConfigSource#read}
     */
    public async read(key: string): Promise<T | undefined> {
        // Refresh uplevel cache if expired.
        if(Date.now() > this.cacheExpires) {
            this.updateSourceValues(await this.readSourceValues());
        }
        // Return upleveled value.
        return this.cache[key];
    }

    /** 
     * Reads all upleveled values.
     * @see {@link ConfigSource#readAll}
     */
    public async readAll(): Promise<{[key: string]: T | undefined}> {
        const result: {[key: string]: T | undefined} = {};
        for(const key of await this.list()) {
            result[key] = await this.read(key);
        }
        return result;
    }

    /** 
     * Lists all available keys.
     * @see {@link ConfigSource#list}
     */
    public async list(): Promise<string[]> {
        // Refresh uplevel cache if expired.
        if(Date.now() > this.cacheExpires) {
            this.updateSourceValues(await this.readSourceValues());
        }
        // Return cache keys
        return Object.keys(this.cache);
    }

    /** 
     * Reads an upleveled value.
     * @see {@link ConfigSource#readSync}
     */
    public readSync(key: string): T | undefined {
        // Refresh uplevel cache if expired.
        if(Date.now() > this.cacheExpires) {
            this.updateSourceValues(this.readSourceValuesSync());
        }
        // Return upleveled value.
        return this.cache[key];
    }

    /** 
     * Reads all upleveled values.
     * @see {@link ConfigSource#readAllSync}
     */
    public readAllSync(): {[key: string]: T | undefined} {
        const result: {[key: string]: T | undefined} = {};
        for(const key of this.listSync()) {
            result[key] = this.readSync(key);
        }
        return result;
    }

    /** 
     * Lists all available keys.
     * @see {@link ConfigSource#listSync}
     */
    public listSync(): string[] {
        // Refresh uplevel cache if expired.
        if(Date.now() > this.cacheExpires) {
            this.updateSourceValues(this.readSourceValuesSync());
        }
        // Return cache keys
        return Object.keys(this.cache);
    }

    /**
     * Reads values from the base source asynchronously.
     */
    private async readSourceValues(): Promise<({[key: string]: T | undefined} | undefined)[]> {
        if(this.uplevelKeys) {
            const sourceResults: ({[key: string]: T | undefined} | undefined)[] = [];
            for(const key of this.uplevelKeys) {
                sourceResults.push(await this.configSource.read(key));
            }
            return sourceResults;
        }
        else {
            return Object.values(await this.configSource.readAll());
        }
    }

    /**
     * Reads values from the base source synchronously.
     */
    private readSourceValuesSync(): ({[key: string]: T | undefined} | undefined)[] {
        if(this.uplevelKeys) {
            const sourceResults: ({[key: string]: T | undefined} | undefined)[] = [];
            for(const key of this.uplevelKeys) {
                sourceResults.push(this.configSource.readSync(key));
            }
            return sourceResults;
        }
        else {
            return Object.values(this.configSource.readAllSync());
        }
    }

    /**
     * Updates the internal cache with values from the base source.
     * @param sourceValues Result values returned from the base source.
     */
    private updateSourceValues(sourceValues: ({[key: string]: T | undefined} | undefined)[]): void {
        this.cache = {};
        for(const sourceValue of sourceValues) {
            if(!sourceValue) {
                continue;
            }
            for(const key of Object.keys(sourceValue)) {
                // Preserve Technician's first result wins behavior
                this.cache[key] = this.cache[key] ?? sourceValue[key];
            }
        }
        this.cacheExpires = this.internalCacheLength === 0 ? Infinity : Date.now() + this.internalCacheLength;
    }

}