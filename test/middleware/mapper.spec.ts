import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Mapper, ManualConfigSource } from '../../src';

const VALUE = 'VALUE'
const TEST_SOURCE = new ManualConfigSource({
    zzz_key: VALUE,
    zzz_key2: VALUE,
});
const TEST_MAP_FUNC = (key: string) => key.replaceAll('zzz_', '')
const chaiSpy = use(spies);

describe('Mapper', () => {

    it('should build', async () => {
        expect(new Mapper(TEST_SOURCE, TEST_MAP_FUNC)).to.not.throw;
    });

    describe('#read', () => {

        it('should read a single config value using the mapping function.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = await mapper.read('key');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should read using a key it has already mapped.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);
            const spy = chaiSpy.spy.on(mapper, 'rebuildKeyMap');

            // Test
            const result = await mapper.read('key');
            const result2 = await mapper.read('key');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(result2).to.equal(VALUE);
            expect(spy).to.have.been.called.once;
        });

        it('should return undefined if the key is not found.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = await mapper.read('doesnt-exist');

            // Assertions
            expect(result).to.be.undefined;
        });

        it('should return undefined if the mapping function returns undefined for a key.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, (key: string) => key === 'zzz_key' ? TEST_MAP_FUNC(key) : undefined);

            // Test
            const result = await mapper.read('key');
            const result2 = await mapper.read('key2');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(result2).to.be.undefined;
        });

    });

    describe('#readAll', () => {

        it('should read all config values using the mapper.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = await mapper.readAll();

            // Assertions
            expect(result.key).to.equal(VALUE);
            expect(result.key2).to.equal(VALUE);
        });

    });

    describe('#list', () => {

        it('should list all mapped keys.', async () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = await mapper.list();

            // Assertions
            expect(result).to.include('key');
            expect(result).to.include('key2');
        });

    });

    describe('#readSync', () => {

        it('should read a single config value using the mapping function.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = mapper.readSync('key');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should read using a key it has already mapped.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);
            const spy = chaiSpy.spy.on(mapper, 'rebuildKeyMapSync');

            // Test
            const result = mapper.readSync('key');
            const result2 = mapper.readSync('key');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(result2).to.equal(VALUE);
            expect(spy).to.have.been.called.once;
        });

        it('should return undefined if the key is not found.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = mapper.readSync('doesnt-exist');

            // Assertions
            expect(result).to.be.undefined;
        });

        it('should return undefined if the mapping function returns undefined for a key.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, (key: string) => key === 'zzz_key' ? TEST_MAP_FUNC(key) : undefined);

            // Test
            const result = mapper.readSync('key');
            const result2 = mapper.readSync('key2');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(result2).to.be.undefined;
        });

    });

    describe('#readAllSync', () => {

        it('should read all config values using the mapper.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = mapper.readAllSync();

            // Assertions
            expect(result.key).to.equal(VALUE);
            expect(result.key2).to.equal(VALUE);
        }); 

    });

    describe('#listSync', () => {

        it('should list all mapped keys.', () => {
            // Build and configure an Mapper
            const mapper = new Mapper(TEST_SOURCE, TEST_MAP_FUNC);

            // Test
            const result = mapper.listSync();

            // Assertions
            expect(result).to.include('key');
            expect(result).to.include('key2');
        });

    });

});
