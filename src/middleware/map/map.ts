import { Mapper } from './mapper';
import { ConfigSource } from '../../config-source/config-source';

/** Semantic API layer for building Mappers. */
export class Map {

    /**
     * Constructor for an Map semantic builder.
     * Should not be called directly. Use `Map.from()` or `new Mapper()` instead.
     * @param mappingFunction   A mapping function to convert from the raw key in the config source to the desired key.
     *                          If the mapping function returns undefined in a given case, that key will not be treated as though it does not exist.
     */
    constructor(private mappingFunction: (key: string) => string | undefined) {}

    /**
     * Creates a mapping function for a ConfigSource.
     * Example: `Map.from((configKey: string) => path.parse(name));`
     * @param mappingFunction   A mapping function to convert from the raw key in the config source to the desired key.
     *                          If the mapping function returns undefined in a given case, that key will not be treated as though it does not exist.
     */
    public static from(mappingFunction: (key: string) => string | undefined): Map {
        return new Map(mappingFunction);
    }

    /** 
     * Ends a semantic string and returns the configured Mapper
     */
    public on<T>(configSource: ConfigSource<T>): Mapper<T> {
        return new Mapper(configSource, this.mappingFunction);
    }

}
