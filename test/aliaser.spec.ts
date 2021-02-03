import { expect } from 'chai';
import { Aliaser, ManualConfigSource } from '../src';

const VALUE = 'VALUE';
const TEST_SOURCE = new ManualConfigSource({
    key: VALUE,
    noalias: VALUE
});

describe('Aliaser', () => {

    it('should build', async () => {
        expect(new Aliaser(TEST_SOURCE, {alias: 'key'})).to.not.throw;
    });

    describe('#read', () => {

        it('should read a single config value by alias.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'});

            // Test
            const result = await aliaser.read('alias');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should read config values by alias and source keys with full passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = await aliaser.read('alias');
            const resultKey = await aliaser.read('key');
            const resultNoAlias = await aliaser.read('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(VALUE);
            expect(resultNoAlias).to.equal(VALUE);
        });

        it('should read config values by alias when aliased, otherwise by source keys with partial passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = await aliaser.read('alias');
            const resultKey = await aliaser.read('key');
            const resultNoAlias = await aliaser.read('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(undefined);
            expect(resultNoAlias).to.equal(VALUE);
        });


        it('should read only aliased config values with no passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = await aliaser.read('alias');
            const resultKey = await aliaser.read('key');
            const resultNoAlias = await aliaser.read('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(undefined);
            expect(resultNoAlias).to.equal(undefined);
        });

        it('should return undefined for unknown keys and aliases.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'});

            // Test
            const result = await aliaser.read('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAll', () => {

        it('should read all config values by alias and source keys with full passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = await aliaser.readAll();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(VALUE);
            expect(result.noalias).to.equal(VALUE);
        });

        it('should read all config values by alias when aliased, otherwise by source keys with partial passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = await aliaser.readAll();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(undefined);
            expect(result.noalias).to.equal(VALUE);
        });


        it('should read only aliased config values with no passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = await aliaser.readAll();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(undefined);
            expect(result.noalias).to.equal(undefined);
        });  

    });

    describe('#list', () => {

        it('should list all source and alias keys with full passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = await aliaser.list();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.include('key');
            expect(result).to.include('noalias');
        });

        it('should list all source keys not masked by an alias and all aliases with partial passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = await aliaser.list();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.not.include('key');
            expect(result).to.include('noalias');
        });

        it('should list all aliases with no passthrough.', async () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = await aliaser.list();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.not.include('key');
            expect(result).to.not.include('noalias');
        });

    });

    describe('#readSync', () => {

        it('should read a single config value by alias.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'});

            // Test
            const result = aliaser.readSync('alias');

            // Assertions
            expect(result).to.equal(VALUE);
        });

        it('should read config values by alias and source keys with full passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = aliaser.readSync('alias');
            const resultKey = aliaser.readSync('key');
            const resultNoAlias = aliaser.readSync('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(VALUE);
            expect(resultNoAlias).to.equal(VALUE);
        });

        it('should read config values by alias when aliased, otherwise by source keys with partial passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = aliaser.readSync('alias');
            const resultKey = aliaser.readSync('key');
            const resultNoAlias = aliaser.readSync('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(undefined);
            expect(resultNoAlias).to.equal(VALUE);
        });


        it('should read only aliased config values with no passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = aliaser.readSync('alias');
            const resultKey = aliaser.readSync('key');
            const resultNoAlias = aliaser.readSync('noalias');

            // Assertions
            expect(result).to.equal(VALUE);
            expect(resultKey).to.equal(undefined);
            expect(resultNoAlias).to.equal(undefined);
        });

        it('should return undefined for unknown keys and aliases.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'});

            // Test
            const result = aliaser.readSync('nope');

            // Assertions
            expect(result).to.equal(undefined);
        });

    });

    describe('#readAllSync', () => {

        it('should read all config values by alias and source keys with full passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = aliaser.readAllSync();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(VALUE);
            expect(result.noalias).to.equal(VALUE);
        });

        it('should read all config values by alias when aliased, otherwise by source keys with partial passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = aliaser.readAllSync();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(undefined);
            expect(result.noalias).to.equal(VALUE);
        });


        it('should read only aliased config values with no passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = aliaser.readAllSync();

            // Assertions
            expect(result.alias).to.equal(VALUE);
            expect(result.key).to.equal(undefined);
            expect(result.noalias).to.equal(undefined);
        });  

    });

    describe('#listSync', () => {

        it('should list all source and alias keys with full passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'full');

            // Test
            const result = aliaser.listSync();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.include('key');
            expect(result).to.include('noalias');
        });

        it('should list all source keys not masked by an alias and all aliases with partial passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'partial');

            // Test
            const result = aliaser.listSync();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.not.include('key');
            expect(result).to.include('noalias');
        });

        it('should list all aliases with no passthrough.', () => {
            // Build and configure an Aliaser
            const aliaser = new Aliaser(TEST_SOURCE, {alias: 'key'}, 'none');

            // Test
            const result = aliaser.listSync();

            // Assertions
            expect(result).to.include('alias');
            expect(result).to.not.include('key');
            expect(result).to.not.include('noalias');
        });

    });

});