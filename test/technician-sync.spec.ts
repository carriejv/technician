import { expect } from 'chai';
import { ConfigNotFoundError, DefaultInterpretersSync, TechnicianSync } from '../src';
import { KnownConfigSourceSync } from '../src/types/source-types';
import { TestSource } from './resources/test-source';

const VALUE_1 = 'value1';
const VALUE_2 = 'value2';
const VALUE_BAD = 'nope-not-this';
const TEST_SOURCE_1 = new TestSource(Buffer.from(VALUE_1), ['1only', 'shared']);
const TEST_SOURCE_2 = new TestSource(Buffer.from(VALUE_2), ['2only', 'shared']);
const TEST_SOURCE_BAD = new TestSource(undefined, ['1only', '2only', 'shared']);
const TEST_SOURCE_EMPTY = new TestSource(undefined, []);

describe('TechnicianSync', () => {

    describe ('+ Positive', () => {

        it('should build', () => {
            expect(new TechnicianSync()).to.not.throw;
        });

        describe('#read', () => {

            it('should read a single config value using the default interpreter.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = tech.read('1only');

                // Assertions
                expect(result).to.deep.equal(Buffer.from(VALUE_1));
            });

            it('should read a single config value using a custom interpreter.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value when multiple sources are present.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read a single config value when multiple sources are present and ignore those which cannot be interpreted.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(entity => {
                    if(entity.source !== TEST_SOURCE_2) {
                        return undefined;
                    }
                    return entity.data.toString('utf8');
                });
                tech.addSource([TEST_SOURCE_BAD, TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = tech.read('shared');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

            it('should read the highest priority config value available when a key is present in multiple sources.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = tech.read('shared');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

            it('should read a single config value from the cache without cacheRespectsPriority.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
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
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read from a higher-priority source instead of the cache with cacheRespectsPriority.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText(), {cacheRespectsPriority: true});
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
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should return a cached value instead of reading from a lower-priority source instead of the cache with cacheRespectsPriority.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText(), {cacheRespectsPriority: true});
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
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_BAD);
            });

            it('should read from source if a cached value is expired.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
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
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should cache forever by default if no cache config exists.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheUntil).to.equal(Infinity);
            });

            it('should cache a read value using the TechnicianSync global cache setting.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText(), {defaultCacheLength: 1000});
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should cache a read value using the source\'s cache length if it is defined.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource({source: TEST_SOURCE_1, priority: 0, cacheFor: 1000});

                // Read the value
                tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should cache a read value using the interpreter\'s cacheFor return if defined.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(entity => {
                    return {
                        value: entity.data.toString('utf8'),
                        cacheFor: 1000
                    };
                });
                tech.addSource(TEST_SOURCE_1);

                // Read the value
                tech.read('1only');

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result?.cacheFor).to.equal(1000);
            });

            it('should read a single config value from a nested TechnicianSync instance.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                const internalTech = new TechnicianSync();
                internalTech.addSource(TEST_SOURCE_1);
                tech.addSource(internalTech);

                // Test
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(VALUE_1);
            });

            it('should read the highest priority config value available for an alias with multiple backend keys.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.alias('alias', ['1only', '2only']);
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = tech.read('alias');

                // Assertions
                expect(result).to.equal(VALUE_2);
            });

        }); // --- End #read

        describe('#require', () => {

            it('should read a single config value using the default interpreter and return it if it exists.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_1);

                // Test
                const result = tech.require('1only');

                // Assertions
                expect(result).to.deep.equal(Buffer.from(VALUE_1));
            }); 

        });

        describe('#readAll', () => {

            it('should read config for all keys returned by list() of configured sources.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Test
                const result = tech.readAll();

                // Assertions
                expect(result['1only']).to.deep.equal(Buffer.from(VALUE_1));
                expect(result['2only']).to.deep.equal(Buffer.from(VALUE_2));
                expect(result['shared']).to.deep.equal(Buffer.from(VALUE_2));
            }); 

        });

        describe('#list', () => {

            it('should list all known keys from all configured sources.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = tech.list();

                // Assertions -- order is not necessarily guarenteed.
                expect(result).to.include('1only');
                expect(result).to.include('2only');
                expect(result).to.include('shared');
            });

            it('should list all known keys from all configured sources, including aliases.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.alias('alias', []);
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Test
                const result = tech.list();

                // Assertions -- order is not necessarily guarenteed.
                expect(result).to.include('1only');
                expect(result).to.include('2only');
                expect(result).to.include('shared');
                expect(result).to.include('alias');
            }); 

        });

        describe('#alias', () => {

            it('should create an alias.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.alias('alias', ['key1', 'key2']);

                // Assertions
                expect((tech as any).aliases.get('alias')).to.deep.equal(['key1', 'key2']);
            });

        });

        describe('#describe', () => {

            it('should return all known config for a cached value.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Read the value
                tech.read('1only');

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
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
                tech.addSource([{source: TEST_SOURCE_1, priority: 1}, {source: TEST_SOURCE_2, priority: 2}]);

                // Read some values
                tech.read('1only');
                tech.read('2only');

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

            it('should add a config source with default priority.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_1);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).priority).to.equal(0);
            });

            it('should add a config source with custom config.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).priority).to.equal(1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);
            });

            it('should add a TechnicianSync instance as a config source.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                const internalTech = new TechnicianSync();
                tech.addSource(internalTech);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === internalTech).source).to.equal(internalTech);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === internalTech).priority).to.equal(0);
            });

            it('should add an array of config sources.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                const internalTech = new TechnicianSync();
                tech.addSource([TEST_SOURCE_1, {source: TEST_SOURCE_2, priority: 2, cacheFor: 2000}, internalTech]);

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).priority).to.equal(0);

                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_2).source).to.equal(TEST_SOURCE_2);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_2).priority).to.equal(2);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_2).cacheFor).to.equal(2000);


                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === internalTech).source).to.equal(internalTech);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === internalTech).priority).to.equal(0);
            });


            it('should edit a config source, changing priority and cache config.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_1);
                tech.addSource({source: TEST_SOURCE_1, priority: 1, cacheFor: 1000});

                // Assertions
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).source).to.equal(TEST_SOURCE_1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).priority).to.equal(1);
                expect((tech as any).knownSources.find((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).cacheFor).to.equal(1000);

                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).length).to.equal(1);
            });

        });

        describe('#deleteSource', () => {

            it('should delete a config source', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2]);
                tech.deleteSource(TEST_SOURCE_1);

                // Assertions
                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_2).length).to.equal(1);
            });

            it('should delete an array of config sources', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource([TEST_SOURCE_1, TEST_SOURCE_2, TEST_SOURCE_EMPTY]);
                tech.deleteSource([TEST_SOURCE_1, TEST_SOURCE_2]);

                // Assertions
                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_1).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_2).length).to.equal(0);
                expect((tech as any).knownSources.filter((x: KnownConfigSourceSync) => x.source === TEST_SOURCE_EMPTY).length).to.equal(1);
            });

        });

        describe('#clearCache', () => {

            it('should clear the cache', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
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
                expect(tech.read('1only')).to.equal(VALUE_1);
            });

            it('should clear a specific key from the cache', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync(DefaultInterpretersSync.asText());
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
                expect(tech.read('1only')).to.equal(VALUE_1);
                expect(tech.read('shared')).to.equal(VALUE_BAD);
            });

        });

    });

    describe ('- Negative', () => {

        describe('#read', () => {

            it('should return undefined if a config value does not exist.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                const result = tech.read('1only');

                // Assertions
                expect(result).to.equal(undefined);
            });

        });

        describe('#require', () => {

            it('should throw a ConfigNotFoundError if it a config value does not exist.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                try {
                    tech.require('1only');
                }
                catch(err) {
                    expect(err).to.be.an.instanceOf(ConfigNotFoundError);
                    return;
                }
                throw new Error('No error was thrown.');
            }); 

        });

        describe('#readAll', () => {

            it('should return an empty object if no valid config values exist.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_EMPTY);

                // Test
                const result = tech.readAll();

                // Assertions
                expect(result).to.deep.equal({});
            }); 

        });

        describe('#list', () => {

            it('should return an empty array if no config keys exist.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();

                // Test
                const result = tech.list();

                // Assertions
                expect(result).to.deep.equal([]);
            });

        });

        describe('#describe', () => {

            it('should return undefined if a config value does not exist.', () => {
                // Build and configure a TechnicianSync instance.
                const tech = new TechnicianSync();
                tech.addSource(TEST_SOURCE_BAD);

                // Test
                const result = tech.describe('1only');

                // Assertions
                expect(result).to.equal(undefined);
            });

        });

    });

});