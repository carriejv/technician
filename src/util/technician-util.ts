import { ConfigSource } from '../config-source/config-source';
import { ConfigSourceParams} from '../types/param-types';

/** Utility functions used throughout Technician */
export class TechnicianUtil {

    /**
     * Checks if a ConfigSource is a raw source object or a ConfigSourceParams object with config.
     * @param source The source object.
     */
    public static isSourceWithParams<T>(source: ConfigSource<T> | ConfigSourceParams<T>): source is ConfigSourceParams<T> {
        return Object.keys(source).includes('source');
    }

}