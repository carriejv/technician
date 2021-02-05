import { expect } from 'chai';
import { Interpreter, ManualConfigSource } from '../../src';

const VALUE = 'VALUE';
const VALUE_BUF = Buffer.from(VALUE);
const OTHER_VALUE = 'OTHER_VALUE';
const OTHER_VALUE_BUF = Buffer.from(OTHER_VALUE);
const TEST_SOURCE = new ManualConfigSource({
    key: VALUE,
    otherKey: OTHER_VALUE
});

describe('Interpreter', () => {

    it('should build', async () => {
        expect(new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value))).to.not.throw;
    });

    describe('#read', () => {

        it('should read a single config value and pass it through the interpreter function.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = await interpreter.read('key');

            // Assertions
            expect(result).to.deep.equal(VALUE_BUF);
        });

        it('should read a single config value and pass it through the async interpreter function if it is explicitly defined.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: e => e.value && Buffer.from(e.value), sync: () => null});

            // Test
            const result = await interpreter.read('key');

            // Assertions
            expect(result).to.deep.equal(VALUE_BUF);
        });

        it('should read a single config value and pass it through the sync interpreter function is no async one is defined.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {sync: e => e.value && Buffer.from(e.value)});

            // Test
            const result = await interpreter.read('key');

            // Assertions
            expect(result).to.deep.equal(VALUE_BUF);
        });

        it('should return undefined if async interpretation is explicitly unset', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));
            delete (interpreter as any).interpreterFunction.async;

            // Test
            const result = await interpreter.read('key');

            // Assertions
            expect(result).to.deep.equal(undefined);
        });

    });

    describe('#readAll', () => {

        it('should read all config values, passing them through the interpreter function.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = await interpreter.readAll();

            // Assertions
            expect(result.key).to.deep.equal(VALUE_BUF);
            expect(result.otherKey).to.deep.equal(OTHER_VALUE_BUF);
        });

        it('should read all config values, passing them through the async interpreter function if it is explicitly defined.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: e => e.value && Buffer.from(e.value), sync: () => null});

            // Test
            const result = await interpreter.readAll();

            // Assertions
            expect(result.key).to.deep.equal(VALUE_BUF);
            expect(result.otherKey).to.deep.equal(OTHER_VALUE_BUF);
        });

        it('should read all config values, passing them through the sync interpreter function is no async one is defined.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {sync: e => e.value && Buffer.from(e.value)});

            // Test
            const result = await interpreter.readAll();

            // Assertions
            expect(result.key).to.deep.equal(VALUE_BUF);
            expect(result.otherKey).to.deep.equal(OTHER_VALUE_BUF);
        });

        it('should return undefined values if async interpretation is explicitly unset.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));
            delete (interpreter as any).interpreterFunction.async;

            // Test
            const result = await interpreter.readAll();

            // Assertions
            expect(result.key).to.deep.equal(undefined);
            expect(result.otherKey).to.deep.equal(undefined);
        });


    });

    describe('#list', () => {

        it('should list all keys from the underlying source.', async () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = await interpreter.list();

            // Assertions
            expect(result).to.include('key');
            expect(result).to.include('otherKey');
        });

    });

    describe('#readSync', () => {

        it('should read a single config value and pass it through the interpreter function.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = interpreter.readSync('key');

            // Assertions
            expect(result).to.deep.equal(VALUE_BUF);
        });

        it('should read a single config value and pass it through the sync interpreter function if it is explicitly defined.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: () => null, sync: e => e.value && Buffer.from(e.value)});

            // Test
            const result = interpreter.readSync('key');

            // Assertions
            expect(result).to.deep.equal(VALUE_BUF);
        });

        it('should return undefined if only an explicitly defined async interpreter exists.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: e => e.value && Buffer.from(e.value)});

            // Test
            const result = interpreter.readSync('key');

            // Assertions
            expect(result).to.deep.equal(undefined);
        });

    });

    describe('#readAllSync', () => {

        it('should read all config values, passing them through the interpreter function.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = interpreter.readAllSync();

            // Assertions
            expect(result.key).to.deep.equal(VALUE_BUF);
            expect(result.otherKey).to.deep.equal(OTHER_VALUE_BUF);
        });

        it('should read all config values, passing them through the sync interpreter function if it is explicitly defined.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: () => null, sync: e => e.value && Buffer.from(e.value)});

            // Test
            const result = interpreter.readAllSync();

            // Assertions
            expect(result.key).to.deep.equal(VALUE_BUF);
            expect(result.otherKey).to.deep.equal(OTHER_VALUE_BUF);
        });

        it('should return undefined values if only an explicitly defined async interpreter exists.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, {async: e => e.value && Buffer.from(e.value)});

            // Test
            const result = interpreter.readAllSync();

            // Assertions
            expect(result.key).to.deep.equal(undefined);
            expect(result.otherKey).to.deep.equal(undefined);
        });

    });

    describe('#listSync', () => {

        it('should list all keys from the underlying source.', () => {
            // Build and configure an Interpreter
            const interpreter = new Interpreter(TEST_SOURCE, e => e.value && Buffer.from(e.value));

            // Test
            const result = interpreter.listSync();

            // Assertions
            expect(result).to.include('key');
            expect(result).to.include('otherKey');
        });

    });

});
