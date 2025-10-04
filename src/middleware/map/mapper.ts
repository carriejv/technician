import { ConfigSource } from '../../config-source/config-source';

/** Mapper is a middleware ConfigSource that maps keys to other keys. */
export class Mapper<T> extends ConfigSource<T> {

    // A precomputed key mapping that is checked before running the mappingFunction again.
    private keyMap: {[key: string]: string} = {}

    /**
     * Builds a new Mapper.
     * @param configSource      The config source to alias.
     * @param mappingFunction   A mapping function to convert from the raw key in the config source to the desired key.
     *                          If the mapping function returns undefined in a given case, that key will not be treated as though it does not exist.
     */
    public constructor(private configSource: ConfigSource<T>, private mappingFunction: (key: string) => string | undefined) {
        super();
    }

    /** 
     * Reads a value using the mapping function.
     * @see {@link ConfigSource#read}
     */
    public async read(key: string): Promise<T | undefined> {
        // Attempt to rebuild key map if the key is unknown in case source data has changed.
        if(!Object.hasOwn(this.keyMap, key)) {
            await this.rebuildKeyMap();
        }
        return Object.hasOwn(this.keyMap, key) ? await this.configSource.read(this.keyMap[key]) : undefined;
    }

    /** 
     * Lists all available keys, including aliases, depending on passthrough method.
     * @see {@link ConfigSource#list}
     */
    public async list(): Promise<string[]> {
        await this.rebuildKeyMap();
        return Object.keys(this.keyMap);
    }

    /** 
     * Reads a possibly-aliased value.
     * @see {@link ConfigSource#readSync}
     */
    public readSync(key: string): T | undefined {
        if(!Object.hasOwn(this.keyMap, key)) {
            this.rebuildKeyMapSync();
        }
        return Object.hasOwn(this.keyMap, key) ? this.configSource.readSync(this.keyMap[key]) : undefined;
    }

    /** 
     * Lists all available keys, including aliases, depending on passthrough method.
     * @see {@link ConfigSource#listSync}
     */
    public listSync(): string[] {
        this.rebuildKeyMapSync();
        return Object.keys(this.keyMap);
    }

    /**
     * Rebuilds the internal keyMap. This map is used for faster lookups in cases where the mapping has already been computed.
     */
    private async rebuildKeyMap(): Promise<void> {
        for(const key of await this.configSource.list()) {
            const mappedKey = this.mappingFunction(key);
            if (mappedKey) {
                this.keyMap[mappedKey] = key;
            }
        }
    }

    /**
     * Rebuilds the internal keyMap synchronously.
     * @see {@link Mapper#rebuildKeyMap}
     */
    private rebuildKeyMapSync(): void {
        for(const key of this.configSource.listSync()) {
            const mappedKey = this.mappingFunction(key);
            if (mappedKey) {
                this.keyMap[mappedKey] = key;
            }
        }
    }

}
