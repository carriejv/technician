import { expect } from 'chai';
import { ManualConfigSource } from '../../src';

const VALUE = 'VALUE';
const OTHER_VALUE = 'OTHER_VALUE';

describe('ManualConfigSource', () => {

    it('should build', async () => {
        expect(new ManualConfigSource()).to.not.throw;
    });

    describe('#readSync', () => {

        it('should read a single config value.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource({key: VALUE});

            // Test
            const result = mcs.readSync('key');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should return undefined for an unset key.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource({key: VALUE});

            // Test
            const result = mcs.readSync('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAllSync', () => {

        it('should read all config values.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource({key: VALUE, otherKey: OTHER_VALUE});

            // Test
            const result = mcs.readAllSync();

            // Assertions
            expect(result.key).to.equal(VALUE);
            expect(result.otherKey).to.equal(OTHER_VALUE);
        }); 

    });

    describe('#listSync', () => {

        it('should list all set config keys.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource({key: VALUE, otherKey: OTHER_VALUE});

            // Test
            const result = mcs.listSync();

            // Assertions
            expect(result).to.include('key');
            expect(result).to.include('otherKey');
        }); 

    });

    describe('#set', () => {

        it('should set a single config value.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource<string>({});
            mcs.set('key', VALUE);

            // Test
            const result = mcs.readSync('key');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should set multiple config values.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource<string>({});
            mcs.set({key: VALUE, otherKey: OTHER_VALUE});

            // Test
            const result = mcs.readAllSync();

            // Assertions
            expect(result.key).to.equal(VALUE);
            expect(result.otherKey).to.equal(OTHER_VALUE);
        }); 

    });

    describe('#unset', () => {

        it('should unset a single config value.', () => {
            // Build and configure a ManualConfigSource
            const mcs = new ManualConfigSource({key: VALUE});
            mcs.unset('key');

            // Test
            const result = mcs.readSync('key');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

});