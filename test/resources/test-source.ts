import { ConfigSource, ConfigSourceSync } from "../../src";

/** Super simple ConfigSource for testing. */
export class TestSource implements ConfigSource, ConfigSourceSync {

    /**
     * Builds a new TestSource.
     * @param value The value to return from all reads.
     * @param keys Array of keys to return from readAll, list.
     * @constructor TestSource
     */
    constructor(
        private value: Buffer = Buffer.from('value', 'utf8'),
        private keys: string[] = ['a', 'b', 'c']) {}

    /** @see {@link ConfigSource#read} */
    public async read(): Promise<Buffer> {
        return this.value;
    }

    /** @see {@link ConfigSource#readAll} */
    public async readAll(): Promise<{[key: string]: Buffer}> {
        const obj = {};
        for(const key of this.keys) {
            obj[key] = this.value;
        }
        return obj;
    }

    /** @see {@link ConfigSource#list} */
    public async list(): Promise<string[]> {
        return this.keys;
    }

    /** @see {@link ConfigSourceSync#readSync} */
    public readSync(): Buffer {
        return this.value;
    }

    /** @see {@link ConfigSourceSync#readAllSync} */
    public readAllSync(): {[key: string]: Buffer} {
        const obj = {};
        for(const key of this.keys) {
            obj[key] = this.value;
        }
        return obj;
    }

    /** @see {@link ConfigSourceSync#listSync} */
    public listSync(): string[] {
        return this.keys;
    }
}