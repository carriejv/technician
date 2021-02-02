import { expect } from 'chai';
import { ConfigNotFoundError, ManualConfigSource, Technician } from '../src';
import { ConfigSourceParams } from '../src/types/param-types';

const VALUE_1 = 'value1';
const VALUE_2 = 'value2';
const VALUE_CACHE = 'hi-im-from-the-cache';
const VALUE_BAD = 'nope-not-this';
const TEST_SOURCE_1 = new ManualConfigSource({
    only1: VALUE_1,
    shared: VALUE_1
});
const TEST_SOURCE_2 = new ManualConfigSource({
    only2: VALUE_2,
    shared: VALUE_2
});
const TEST_SOURCE_FALSY = new ManualConfigSource({
    bool: false,
    num: 0,
    str: ''
});
const TEST_SOURCE_BAD = new ManualConfigSource({
    only1: undefined,
    only2: undefined,
    shared: undefined
});
const TEST_SOURCE_EMPTY = new ManualConfigSource();

describe('Technician', () => {

    it('should build', async () => {
        expect(new Technician()).to.not.throw;
    });

    describe('#read', () => {

        it('should read a single config value.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should return undefined if a config value does not exist.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_BAD);

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(undefined);
        });

        it('should read falsy values correctly.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_FALSY);

            // Test
            const resultBool = await tech.read('bool');
            const resultNum = await tech.read('num');
            const resultStr = await tech.read('str');

            // Assertions
            expect(resultBool).to.equal(false);
            expect(resultNum).to.equal(0);
            expect(resultStr).to.equal('');
        });

        it('should read a single config value when multiple sources are present and ignore sources that return undefined.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should read a single config value when multiple sources are present and ignore those which an ignoreIf that evaluates to true.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_BAD, {source: TEST_SOURCE_1, ignoreIf: () => true}, TEST_SOURCE_2]);

            // Test
            const result = await tech.read('shared');

            // Assertions
            expect(result).to.equal(VALUE_2);
        });

        it('should read the highest priority config value available when a key is present in multiple sources.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

            // Test
            const result = await tech.read('shared');

            // Assertions
            expect(result).to.equal(VALUE_2);
        });

        it('should read a single config value from the cache without cacheRespectsPriority.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_CACHE);
        });

        it('should read from a higher-priority source instead of the cache with cacheRespectsPriority.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: 99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should return a cached value instead of reading from a lower-priority source instead of the cache with cacheRespectsPriority.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: -99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_CACHE);
        });

        it('should read from source if a cached value is expired.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: 99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: -Infinity,
                priority: 0
            });

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should cache forever by default if no cache config exists.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Read the value
            await tech.read('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.equal(Infinity);
        });

        it('should cache a read value using the Technician global cache setting.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1, {defaultCacheLength: 1000});

            // Read the value
            await tech.read('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
        });

        it('should cache a read value using the source\'s cache length if it is defined.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, cacheFor: 1000});

            // Read the value
            await tech.read('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
        });

    }); // --- End #read

    describe('#require', () => {

        it('should read a single config value using the default interpreter and return it if it exists.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Test
            const result = await tech.require('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should throw a ConfigNotFoundError if it a config value does not exist.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_BAD);

            // Test
            try {
                await tech.require('only1');
            }
            catch(err) {
                expect(err).to.be.an.instanceOf(ConfigNotFoundError);
                return;
            }
            throw new Error('No error was thrown.');
        });

    });

    describe('#readAll', () => {

        it('should read config for all keys returned by list() of configured sources.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

            // Test
            const result = await tech.readAll();

            // Assertions
            expect(result['only1']).to.equal(VALUE_1);
            expect(result['only2']).to.equal(VALUE_2);
            expect(result['shared']).to.equal(VALUE_2);
        });

        it('should return an empty object if no valid config values exist.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();

            // Test
            const result = await tech.readAll();

            // Assertions
            expect(result).to.deep.equal({});
        });

    });

    describe('#list', () => {

        it('should list all known keys from all configured sources.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_1, TEST_SOURCE_2]);

            // Test
            const result = await tech.list();

            // Assertions -- order is not necessarily guarenteed.
            expect(result).to.include('only1');
            expect(result).to.include('only2');
            expect(result).to.include('shared');
        });

        it('should return an empty array if no config keys exist.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();

            // Test
            const result = await tech.list();

            // Assertions
            expect(result).to.deep.equal([]);
        });

    });

    describe('#readSync', () => {

        it('should read a single config value.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should return undefined if a config value does not exist.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_BAD);

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(undefined);
        });

        it('should read a single config value when multiple sources are present and ignore sources that return undefined.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should read a single config value when multiple sources are present and ignore those which an ignoreIf that evaluates to true.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_BAD, {source: TEST_SOURCE_1, ignoreIf: () => true}, TEST_SOURCE_2]);

            // Test
            const result = tech.readSync('shared');

            // Assertions
            expect(result).to.equal(VALUE_2);
        });

        it('should read the highest priority config value available when a key is present in multiple sources.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

            // Test
            const result = tech.readSync('shared');

            // Assertions
            expect(result).to.equal(VALUE_2);
        });

        it('should read a single config value from the cache without cacheRespectsPriority.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_CACHE);
        });

        it('should read from a higher-priority source instead of the cache with cacheRespectsPriority.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: 99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should return a cached value instead of reading from a lower-priority source instead of the cache with cacheRespectsPriority.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: -99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: Infinity,
                priority: 0
            });

            // Test
            const result = tech.readSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_CACHE);
        });

        it('should read from source if a cached value is expired.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: 99}, {cacheRespectsPriority: true});

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_CACHE,
                source: TEST_SOURCE_1,
                cacheUntil: -Infinity,
                priority: 0
            });

            // Test
            const result = await tech.read('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should cache forever by default if no cache config exists.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Read the value
            tech.readSync('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.equal(Infinity);
        });

        it('should cache a read value using the Technician global cache setting.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1, {defaultCacheLength: 1000});

            // Read the value
            tech.readSync('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
        });

        it('should cache a read value using the source\'s cache length if it is defined.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, cacheFor: 1000});

            // Read the value
            tech.readSync('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
        });

    }); // --- End #readSync

    describe('#requireSync', () => {

        it('should read a single config value using the default interpreter and return it if it exists.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Test
            const result = tech.requireSync('only1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should throw a ConfigNotFoundError if it a config value does not exist.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_BAD);

            // Test
            try {
                tech.requireSync('only1');
            }
            catch(err) {
                expect(err).to.be.an.instanceOf(ConfigNotFoundError);
                return;
            }
            throw new Error('No error was thrown.');
        });

    });

    describe('#readAllSync', () => {

        it('should read config for all keys returned by listSync() of configured sources.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

            // Test
            const result = tech.readAllSync();

            // Assertions
            expect(result['only1']).to.equal(VALUE_1);
            expect(result['only2']).to.equal(VALUE_2);
            expect(result['shared']).to.equal(VALUE_2);
        });

        it('should return an empty object if no valid config values exist.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician();

            // Test
            const result = tech.readAllSync();

            // Assertions
            expect(result).to.deep.equal({});
        });

    });

    describe('#listSync', () => {

        it('should list all known keys from all configured sources.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician([TEST_SOURCE_1, TEST_SOURCE_2]);

            // Test
            const result = tech.listSync();

            // Assertions -- order is not necessarily guarenteed.
            expect(result).to.include('only1');
            expect(result).to.include('only2');
            expect(result).to.include('shared');
        });

        it('should return an empty array if no config keys exist.', () => {
            // Build and configure a Technician instance.
            const tech = new Technician();

            // Test
            const result = tech.listSync();

            // Assertions
            expect(result).to.deep.equal([]);
        });

    });

    describe('#describe', () => {

        it('should return all known config for a cached value.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

            // Read the value
            await tech.read('only1');

            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result?.key).to.equal('only1');
            expect(result?.value).to.equal(VALUE_1);
            expect(result?.source).to.equal(TEST_SOURCE_1);
            expect(result?.priority).to.equal(1);
            expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
        });

        it('should return undefined if a config value does not exist.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_BAD);
            // Test
            const result = tech.describe('only1');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#export', () => {

        it('should return an object map of all known config values.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

            // Read some values
            await tech.read('only1');
            await tech.read('only2');

            // Test
            const result = tech.export();

            // Assertions
            expect(result['only1']).to.equal(VALUE_1);
            expect(result['only2']).to.equal(VALUE_2);
            // Export should be unaware of unaccessed keys.
            expect(result['shared']).to.equal(undefined);
        });

    });

    describe('#setSource', () => {

        it('should add a config source with default priority.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            tech.setSource(TEST_SOURCE_1);

            // Assertions
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
        });

        it('should add a config source with custom config.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            tech.setSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

            // Assertions
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).priority).to.equal(1);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);
        });

        it('should add an array of config sources.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            const internalTech = new Technician();
            tech.setSource([TEST_SOURCE_1, {source: TEST_SOURCE_2, priority: 2, cacheFor: 2000}, internalTech]);

            // Assertions
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
            
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_2).source).to.equal(TEST_SOURCE_2);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_2).priority).to.equal(2);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_2).cacheFor).to.equal(2000);

            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === internalTech).source).to.equal(internalTech);
        });


        it('should edit a config source, changing priority and cache config.', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            tech.setSource(TEST_SOURCE_1);
            tech.setSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

            // Assertions
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).priority).to.equal(1);
            expect((tech as any).knownSources.find((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);

            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).length).to.equal(1);
        });

    });

    describe('#deleteSource', () => {

        it('should delete a config source', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            tech.setSource([TEST_SOURCE_1, TEST_SOURCE_2]);
            tech.deleteSource(TEST_SOURCE_1);

            // Assertions
            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).length).to.equal(0);
            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_2).length).to.equal(1);
        });

        it('should delete an array of config sources', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician();
            tech.setSource([TEST_SOURCE_1, TEST_SOURCE_2, TEST_SOURCE_EMPTY]);
            tech.deleteSource([TEST_SOURCE_1, TEST_SOURCE_2]);

            // Assertions
            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_1).length).to.equal(0);
            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_2).length).to.equal(0);
            expect((tech as any).knownSources.filter((x: ConfigSourceParams<any>) => x.source === TEST_SOURCE_EMPTY).length).to.equal(1);
        });

    });

    describe('#clearCache', () => {

        it('should clear the cache', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_BAD,
                source: TEST_SOURCE_BAD,
                cacheUntil: Infinity,
                priority: 0
            });

            // Clear the cache
            tech.clearCache();

            // Assertions
            expect(await tech.read('only1')).to.equal(VALUE_1);
        });

        it('should clear a specific key from the cache', async () => {
            // Build and configure a Technician instance.
            const tech = new Technician(TEST_SOURCE_1);

            // Mock a cache entry
            (tech as any).entityCache.set('only1', {
                key: 'only1',
                value: VALUE_BAD,
                source: TEST_SOURCE_BAD,
                cacheUntil: Infinity,
                priority: 0
            });
            (tech as any).entityCache.set('shared', {
                key: 'shared',
                value: VALUE_CACHE,
                source: TEST_SOURCE_BAD,
                cacheUntil: Infinity,
                priority: 0
            });

            // Clear the cache
            tech.clearCache('only1');

            // Assertions
            expect(await tech.read('only1')).to.equal(VALUE_1);
            expect(await tech.read('shared')).to.equal(VALUE_CACHE);
        });

    });

});