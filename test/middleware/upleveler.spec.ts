import { expect } from 'chai';
import { Upleveler, ManualConfigSource } from '../../src';

const VALUE_1 = 'VALUE_1';
const VALUE_2 = 'VALUE_2';
const VALUE_OTHER = 'VALUE_OTHER';
const TEST_SOURCE = new ManualConfigSource({
    key: {
        key1: VALUE_1,
        key2: VALUE_2
    },
    otherKey: {
        key1: VALUE_OTHER,
        other: VALUE_OTHER
    }
});

describe('Upleveler', () => {

    it('should build', async () => {
        expect(new Upleveler(TEST_SOURCE)).to.not.throw;
    });

    describe('#read', () => {

        it('should read a single config value from an object returned by the base source.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = await upleveler.read('key1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should read a value from the internal cache during a burst read.', async () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key']);

            // Test
            const result = await upleveler.read('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = await upleveler.read('key1');
            expect(result2).to.equal(VALUE_1);
        });

        it('should read only from specified base source keys, ignoring others.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE, ['key']);

            // Test
            const result = await upleveler.read('key1');
            const otherResult = await upleveler.read('other');

            // Assertions
            expect(result).to.equal(VALUE_1);
            expect(otherResult).to.equal(undefined);
        });

        it('should use a custom internal cache length.', async () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], -1);

            // Test
            const result = await upleveler.read('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = await upleveler.read('key1');
            expect(result2).to.equal(VALUE_2);
        });

        it('should set permanent internal caching for internalCacheLength = 0.', async () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], 0);

            // Test
            const result = await upleveler.read('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = await upleveler.read('key1');
            expect(result2).to.equal(VALUE_1);
        });

        it('should return undefined for unknown keys.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = await upleveler.read('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

        it('should return undefined for an unknown upleveled key.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE, ['nope']);

            // Test
            const result = await upleveler.read('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAll', () => {

        it('should read all available values.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = await upleveler.readAll();

            // Assertions
            expect(result.key1).to.equal(VALUE_1);
            expect(result.key2).to.equal(VALUE_2);
            expect(result.other).to.equal(VALUE_OTHER);
        });

    });

    describe('#list', () => {

        it('should list all keys from the objects returned by the base source.', async () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = await upleveler.list();

            // Assertions
            expect(result).to.include('key1');
            expect(result).to.include('key2');
            expect(result).to.include('other');
        });

        it('should return cached keys during burst reads.', async () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource<any>({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], 0);

            // Test
            const result = await upleveler.list();
            expect(result).to.include('key1');

            changingSource.set('key', {key2: VALUE_1});
            const result2 = await upleveler.list();
            expect(result2).to.include('key1');
        });


    });

    describe('#readSync', () => {

        it('should read a single config value from an object returned by the base source.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = upleveler.readSync('key1');

            // Assertions
            expect(result).to.equal(VALUE_1);
        });

        it('should read a value from the internal cache during a burst read.', () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key']);

            // Test
            const result = upleveler.readSync('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = upleveler.readSync('key1');
            expect(result2).to.equal(VALUE_1);
        });

        it('should read only from specified base source keys, ignoring others.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE, ['key']);

            // Test
            const result = upleveler.readSync('key1');
            const otherResult = upleveler.readSync('other');

            // Assertions
            expect(result).to.equal(VALUE_1);
            expect(otherResult).to.equal(undefined);
        });

        it('should use a custom internal cache length.', () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], -1);

            // Test
            const result = upleveler.readSync('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = upleveler.readSync('key1');
            expect(result2).to.equal(VALUE_2);
        });

        it('should set permanent internal caching for internalCacheLength = 0.', () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], 0);

            // Test
            const result = upleveler.readSync('key1');
            expect(result).to.equal(VALUE_1);

            changingSource.set('key', {key1: VALUE_2});
            const result2 = upleveler.readSync('key1');
            expect(result2).to.equal(VALUE_1);
        });

        it('should return undefined for unknown keys.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = upleveler.readSync('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

        it('should return undefined for an unknown upleveled key.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE, ['nope']);

            // Test
            const result = upleveler.readSync('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAllSync', () => {

        it('should read all available values.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = upleveler.readAllSync();

            // Assertions
            expect(result.key1).to.equal(VALUE_1);
            expect(result.key2).to.equal(VALUE_2);
            expect(result.other).to.equal(VALUE_OTHER);
        });

    });

    describe('#listSync', () => {

        it('should list all keys from the objects returned by the base source.', () => {
            // Build and configure an Upleveler
            const upleveler = new Upleveler(TEST_SOURCE);

            // Test
            const result = upleveler.listSync();

            // Assertions
            expect(result).to.include('key1');
            expect(result).to.include('key2');
            expect(result).to.include('other');
        });

        it('should return cached keys during burst reads.', () => {
            // Build and configure an Upleveler
            const changingSource = new ManualConfigSource<any>({
                key: {
                    key1: VALUE_1
                }
            });
            const upleveler = new Upleveler(changingSource, ['key'], 0);

            // Test
            const result = upleveler.listSync();
            expect(result).to.include('key1');

            changingSource.set('key', {key2: VALUE_1});
            const result2 = upleveler.listSync();
            expect(result2).to.include('key1');
        });

    });

});
