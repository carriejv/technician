import { expect } from 'chai';
import { ConfigSource } from '../../src';

const VALUE = 'VALUE';

describe('ConfigSource', () => {

    it('should build', async () => {
        expect(new ConfigSource()).to.not.throw;
    });

    describe('#read', () => {

        it('should exist and return undefined.', async () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();

            // Test
            const result = await cs.read('key');

            // Assertions
            expect(result).to.equal(undefined);
        });

        it('should call readSync if defined.', async () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();
            (cs as any).readSync = () => VALUE;

            // Test
            const result = await cs.read('key');

            // Assertions
            expect(result).to.equal(VALUE);
        });

    });

    describe('#readAll', () => {

        it('should read all keys returned by list(), returning a {key: value} object.', async () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();
            (cs as any).read = async () => 'value';
            (cs as any).list = async () => ['key'];

            // Test
            const result = await cs.readAll();

            // Assertions
            expect(result).to.deep.equal({key: 'value'});
        });

    });

    describe('#list', () => {

        it('should exist and return an empty array.', async () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();

            // Test
            const result = await cs.list();

            // Assertions
            expect(result).to.deep.equal([]);
        });

        it('should call listSync if defined.', async () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();
            (cs as any).listSync = () => [VALUE];

            // Test
            const result = await cs.list();

            // Assertions
            expect(result).to.deep.equal([VALUE]);
        });

    });

    describe('#readSync', () => {

        it('should exist and return undefined.', () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();

            // Test
            const result = cs.readSync('key');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAllSync', () => {

        it('should read all keys returned by listSync(), returning a {key: value} object.', () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();
            (cs as any).readSync = () => 'value';
            (cs as any).listSync = () => ['key'];

            // Test
            const result = cs.readAllSync();

            // Assertions
            expect(result).to.deep.equal({key: 'value'});
        });

    });

    describe('#listSync', () => {

        it('should exist and return an empty array.', () => {
            // Build and configure a ConfigSource
            const cs = new ConfigSource();

            // Test
            const result = cs.listSync();

            // Assertions
            expect(result).to.deep.equal([]);
        });

    });

});
