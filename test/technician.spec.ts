import { expect } from 'chai';
import { ConfigNotFoundError, DefaultInterpreters, DefaultInterpretersSync, Technician } from '../src';
import { KnownConfigSource } from '../src/types/source-types';
import { TestSource, TestSourceSync } from './resources/test-source';

const VALUE_1 = 'value1';
const VALUE_2 = 'value2';
const VALUE_BAD = 'nope-not-this';
const TEST_SOURCE_1 = new TestSource(Buffer.from(VALUE_1), ['1only', 'shared']);
const TEST_SOURCE_2 = new TestSource(Buffer.from(VALUE_2), ['2only', 'shared']);
const TEST_SOURCE_BAD = new TestSource(undefined, ['1only', '2only', 'shared']);
const TEST_SOURCE_EMPTY = new TestSource(undefined, []);
const TEST_SOURCE_SYNC = new TestSourceSync(Buffer.from(VALUE_1), ['1only', 'shared']);

describe('Technician', () => {

    describe ('+ Positive', () => {

        it('should build', async () => {
            expect(new Technician()).to.not.throw;
        });

        describe('#read', () => {

            it('should read a single config value using the default interpreter.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.deep.equal(Buffer.from(VALUE_1));
            });

            it('should read a single config value using a custom interpreter.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value from a sync config source.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_SYNC);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value using a sync interpreter.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpretersSync.asText());
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value when multiple sources are present.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value when multiple sources are present and ignore those which cannot be interpreted.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(async entity => {
                    if(entity.source !== TEST_SOURCE_2) {
                        return undefined;
                    }
                    return entity.data.toString('utf8');
                });
                tech.addSource([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = await tech.read('shared');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

            it('should read a single config value when multiple sources are present and ignore those which an ignoreIf that evaluates to true.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource([TEST_SOURCE_BAD, {source: TEST_SOURCE_1, ignoreIf: () => true}, TEST_SOURCE_2]);

                // Test
                const result = await tech.read('shared');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

            it('should read the highest priority config value available when a key is present in multiple sources.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = await tech.read('shared');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

            it('should read a single config value from the cache without cacheRespectsPriority.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_1),
                    value: VALUE_1,
                    source: TEST_SOURCE_1,
                    cacheUntil: Infinity,
                    priority: 0
                });

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read from a higher-priority source instead of the cache with cacheRespectsPriority.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText(), {cacheRespectsPriority: true});
                tech.addSource(TEST_SOURCE_1, 99);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_1),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_1,
                    cacheUntil: Infinity,
                    priority: 0
                });

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should return a cached value instead of reading from a lower-priority source instead of the cache with cacheRespectsPriority.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText(), {cacheRespectsPriority: true});
                tech.addSource(TEST_SOURCE_1, -99);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_1),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_1,
                    cacheUntil: Infinity,
                    priority: 0
                });

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_BAD);
            });

            it('should read from source if a cached value is expired.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_1),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_1,
                    cacheUntil: -Infinity,
                    priority: 0
                });

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should cache forever by default if no cache config exists.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                await tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheUntil).to.equal(Infinity);
            });

            it('should cache a read value using the Technician global cache setting.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText(), {defaultCacheLength: 1000});
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                await tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should cache a read value using the source\'s cache length if it is defined.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource({source: TEST_SOURCE_1, priority: 0, cacheFor: 1000});

                // Read the value
                await tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should cache a read value using the interpreter\'s cacheFor return if defined.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(async entity => {
                    return {
                        value: entity.data.toString('utf8'),
                        cacheFor: 1000
                    };
                });
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                await tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should read a single config value from a nested Technician instance.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                const internalTech = new Technician();
                internalTech.addSource(TEST_SOURCE_1);
                tech.addSource(internalTech);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read the highest priority config value available for an alias with multiple backend keys.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.alias('alias', ['1only', '2only']);
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = await tech.read('alias');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

        }); // --- End #read

        describe('#require', () => {

            it('should read a single config value using the default interpreter and return it if it exists.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = await tech.require('1only');

                // Assertions
                expect(result).to.deep.equal(Buffer.from(VALUE_1));
            }); 

        });

        describe('#readAll', () => {

            it('should read config for all keys returned by list() of configured sources.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = await tech.readAll();

                // Assertions
                expect(result['1only']).to.deep.equal(Buffer.from(VALUE_1));
                expect(result['2only']).to.deep.equal(Buffer.from(VALUE_2));
                expect(result['shared']).to.deep.equal(Buffer.from(VALUE_2));
            }); 

        });

        describe('#list', () => {

            it('should list all known keys from all configured sources.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = await tech.list();

                // Assertions -- order is not necessarily guarenteed.
                expect(result).to.include('1only');
                expect(result).to.include('2only');
                expect(result).to.include('shared');
            });

            it('should list all known keys from all configured sources, including aliases.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.alias('alias', []);
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = await tech.list();

                // Assertions -- order is not necessarily guarenteed.
                expect(result).to.include('1only');
                expect(result).to.include('2only');
                expect(result).to.include('shared');
                expect(result).to.include('alias');
            }); 

        });

        describe('#alias', () => {

            it('should create an alias.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.alias('alias', ['key1', 'key2']);

                // Assertions
                expect((tech as any).aliases.get('alias')).to.deep.equal(['key1', 'key2']);
            });

        });

        describe('#describe', () => {

            it('should return all known config for a cached value.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Read the value
                await tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.key).to.equal('1only');
                expect(result?.data).to.deep.equal(Buffer.from(VALUE_1));
                expect(result?.value).to.equal(VALUE_1);
                expect(result?.source).to.equal(TEST_SOURCE_1);
                expect(result?.priority).to.equal(1);
                expect(result?.cacheFor).to.equal(1000);
                expect(result?.cacheUntil).to.be.approximately(Date.now() + 1000, 1000);
            });

        });

        describe('#export', () => {

            it('should return an object map of all known config values.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Read some values
                await tech.read('1only');
                await tech.read('2only');

                // Test
                const result = tech.export();

                // Assertions
                expect(result['1only']).to.equal(VALUE_1);
                expect(result['2only']).to.equal(VALUE_2);
                // Export should be unaware of unaccessed keys.
                expect(result['shared']).to.equal(undefined);
            });

        });

        describe('#addSource', () => {

            it('should add a config source with default priority.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_1);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
            });

            it('should add a config source with custom config.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).priority).to.equal(1);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);
            });

            it('should add a Technician instance as a config source.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                const internalTech = new Technician();
                tech.addSource(internalTech);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === internalTech).source).to.equal(internalTech);
            });

            it('should add an array of config sources.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                const internalTech = new Technician();
                tech.addSource([TEST_SOURCE_1, {source: TEST_SOURCE_2, priority: 2, cacheFor: 2000}, internalTech]);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_2).source).to.equal(TEST_SOURCE_2);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_2).priority).to.equal(2);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_2).cacheFor).to.equal(2000);


                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === internalTech).source).to.equal(internalTech);
            });


            it('should edit a config source, changing priority and cache config.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_1);
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).priority).to.equal(1);
                expect((tech as any).knownSources.find((x: KnownConfigSource) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);

                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_1).length).to.equal(1);
            });

        });

        describe('#deleteSource', () => {

            it('should delete a config source', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);
                tech.deleteSource(TEST_SOURCE_1);

                // Assertions
                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_1).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_2).length).to.equal(1);
            });

            it('should delete an array of config sources', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2, TEST_SOURCE_EMPTY]);
                tech.deleteSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Assertions
                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_1).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_2).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSource) => x.source === TEST_SOURCE_EMPTY).length).to.equal(1);
            });

        });

        describe('#clearCache', () => {

            it('should clear the cache', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_BAD),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_BAD,
                    cacheUntil: Infinity,
                    priority: 0
                });

                // Clear the cache
                tech.clearCache();

                // Assertions
                expect(await tech.read('1only')).to.equal(VALUE_1);
            });

            it('should clear a specific key from the cache', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician(DefaultInterpreters.asText());
                tech.addSource(TEST_SOURCE_1);

                // Mock a cache entry
                (tech as any).entityCache.set('1only', {
                    key: '1only',
                    data: Buffer.from(VALUE_BAD),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_BAD,
                    cacheUntil: Infinity,
                    priority: 0
                });
                (tech as any).entityCache.set('shared', {
                    key: 'shared',
                    data: Buffer.from(VALUE_BAD),
                    value: VALUE_BAD,
                    source: TEST_SOURCE_BAD,
                    cacheUntil: Infinity,
                    priority: 0
                });

                // Clear the cache
                tech.clearCache('1only');

                // Assertions
                expect(await tech.read('1only')).to.equal(VALUE_1);
                expect(await tech.read('shared')).to.equal(VALUE_BAD);
            });

        });

    });

    describe ('- Negative', () => {

        describe('#read', () => {

            it('should return undefined if a config value does not exist.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                const result = await tech.read('1only');

                // Assertions
                expect(result).to.equal(undefined);
            });

        });

        describe('#require', () => {

            it('should throw a ConfigNotFoundError if it a config value does not exist.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                try {
                    await tech.require('1only');
                }
                catch(err) {
                    expect(err).to.be.an.instanceOf(ConfigNotFoundError);
                    return;
                }
                throw new Error('No error was thrown.');
            }); 

        });

        describe('#readAll', () => {

            it('should return an empty object if no valid config values exist.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_EMPTY);

                // Test
                const result = await tech.readAll();

                // Assertions
                expect(result).to.deep.equal({});
            }); 

        });

        describe('#list', () => {

            it('should return an empty array if no config keys exist.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();

                // Test
                const result = await tech.list();

                // Assertions
                expect(result).to.deep.equal([]);
            });

        });

        describe('#describe', () => {

            it('should return undefined if a config value does not exist.', async () => {
                // Build and configure a Technician instance.
                const tech = new Technician();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result).to.equal(undefined);
            });

        });

    });

});