import { ConfigSource } from '../../config-source/config-source';

/** Aliaser is a middleware ConfigSource that creates key aliases. */
export class Aliaser<T> extends ConfigSource<T> {

    private aliasedKeys: string[] = [];
    
    /**
     * Builds a new Interpreter.
     * @param configSource  The config source to alias.
     * @param aliasMap      An aliasKey:sourceKey map as a string:string object.
     * @param passthrough   Passthrough mode. May be `none` -> only explicitly aliased keys are available for read,
     *                      `partial` -> Keys without aliases are available via the key(s) used by the root source, but aliased keys are only available via their alias, or
     *                      `full` -> All values remain available via their source key(s), even if an alias is created for them.
     *                      Default `full`
     */
    public constructor(private configSource: ConfigSource<T>, private aliasMap: {[key: string]: string}, private passthrough: 'full' | 'partial' | 'none' = 'full') {
        super();
        this.aliasedKeys = Object.values(aliasMap);
    }

    /** 
     * Reads a possibly-aliased value.
     * @see {@link ConfigSource#read}
     */
    public async read(key: string): Promise<T | undefined> {
        const aliasedKey = this.aliasMap[key];
        switch(this.passthrough) {
            case 'full':
                return aliasedKey && await this.configSource.read(aliasedKey) || await this.configSource.read(key); 
            case 'partial':
                if(this.aliasedKeys.includes(key)) {
                    return undefined; 
                }
                else {
                    return aliasedKey ? await this.configSource.read(aliasedKey) : await this.configSource.read(key);
                }
            case 'none':
                // Typescript chokes on the type check here if written as isAlias && ... for some reason.
                return aliasedKey ? await this.configSource.read(aliasedKey) : undefined;
        }
    }

    /** 
     * Reads all values, using aliases as appropriate depending on passthrough method.
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
     * Lists all available keys, including aliases, depending on passthrough method.
     * @see {@link ConfigSource#list}
     */
    public async list(): Promise<string[]> {
        let sourceList: string[];
        const aliasList = Object.keys(this.aliasMap);
        switch(this.passthrough) {
            case 'full':
                sourceList = await this.configSource.list();
                return [...sourceList, ...aliasList];
            case 'partial':
                sourceList = await this.configSource.list();
                return [...sourceList.filter(x => !this.aliasedKeys.includes(x)), ...aliasList];
            case 'none':
                return aliasList;
        }
    }

    /** 
     * Reads a possibly-aliased value.
     * @see {@link ConfigSource#readSync}
     */
    public readSync(key: string): T | undefined {
        const aliasedKey = this.aliasMap[key];
        switch(this.passthrough) {
            case 'full':
                return aliasedKey && this.configSource.readSync(aliasedKey) || this.configSource.readSync(key); 
                case 'partial':
                    if(this.aliasedKeys.includes(key)) {
                        return undefined; 
                    }
                    else {
                        return aliasedKey ? this.configSource.readSync(aliasedKey) : this.configSource.readSync(key);
                    }
            case 'none':
                // Typescript chokes on the type check here if written as isAlias && ... for some reason.
                return aliasedKey ? this.configSource.readSync(aliasedKey) : undefined;
        }
    }

    /** 
     * Reads all values, using aliases as appropriate depending on passthrough method.
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
     * Lists all available keys, including aliases, depending on passthrough method.
     * @see {@link ConfigSource#listSync}
     */
    public listSync(): string[] {
        let sourceList: string[];
        const aliasList = Object.keys(this.aliasMap);
        switch(this.passthrough) {
            case 'full':
                sourceList = this.configSource.listSync();
                return [...sourceList, ...aliasList];
            case 'partial':
                sourceList = this.configSource.listSync();
                return [...sourceList.filter(x => !this.aliasedKeys.includes(x)), ...aliasList];
            case 'none':
                return aliasList;
        }
    }

}