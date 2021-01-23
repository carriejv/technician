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
        private value: Buffer | undefined,
        private keys: string[]) {}

    /** @see {@link ConfigSource#read} */
    public async read(key: string): Promise<Buffer | undefined> {
        if(this.keys.includes(key)) {
            return this.value;
        }
        return undefined;
    }

    /** @see {@link ConfigSource#readAll} */
    public async readAll(): Promise<{[key: string]: Buffer | undefined}> {
        const obj: {[key: string]: Buffer | undefined} = {};
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
    public readSync(key: string): Buffer | undefined {
        if(this.keys.includes(key)) {
            return this.value;
        }
        return undefined;
    }

    /** @see {@link ConfigSourceSync#readAllSync} */
    public readAllSync(): {[key: string]: Buffer | undefined} {
        const obj: {[key: string]: Buffer | undefined} = {};
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

/** Sync-only test source. */
export class TestSourceSync implements ConfigSourceSync {
    /**
     * Builds a new TestSourceSync.
     * @param value The value to return from all reads.
     * @param keys Array of keys to return from readAll, list.
     * @constructor TestSourceSync
     */
    constructor(
        private value: Buffer | undefined,
        private keys: string[]) {}

    /** @see {@link ConfigSourceSync#readSync} */
    public readSync(key: string): Buffer | undefined {
        if(this.keys.includes(key)) {
            return this.value;
        }
        return undefined;
    }

    /** @see {@link ConfigSourceSync#readAllSync} */
    public readAllSync(): {[key: string]: Buffer | undefined} {
        const obj: {[key: string]: Buffer | undefined} = {};
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