import mockery from 'mockery';
mockery.registerMock('os', { endianness: () => 'LE' });
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import { expect } from 'chai';
import { Interpret, Interpreter, ManualConfigSource, SupportedBigIntEncoding, SupportedNumberEncoding } from '../../src';

describe('Interpret', () => {

    after(async () => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('#buffer', () => {

        describe('#asString', () => {

            const VALUE = Buffer.from('VALUE');
            const EXPECTED = 'VALUE'

            it('should build an Interpreter for converting Buffer -> String.', async () => {
                const result = Interpret.buffer.asString(new ManualConfigSource({key: VALUE}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(EXPECTED);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.buffer.asString(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });

        describe('#asBool', () => {

            it('should build an Interpreter for converting Buffer -> Bool (false).', async () => {
                const result = Interpret.buffer.asBool(new ManualConfigSource({key: Buffer.from([0x00])}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(false);
            });

            it('should build an Interpreter for converting Buffer -> Bool (true).', async () => {
                const result = Interpret.buffer.asBool(new ManualConfigSource({key: Buffer.from([0x01])}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(true);
            });
            
            it('should build an Interpreter that returns undefined if passed a Buffer containg anything other than <0x00> or <0x01>.', async () => {
                const result = Interpret.buffer.asBool(new ManualConfigSource({key: Buffer.from([0x02])}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(undefined);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.buffer.asBool(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });

        describe('#asNumber', () => {

            it('should build an Interpreter for converting Buffer -> Number.', async () => {
                const buf = Buffer.alloc(4, 0);
                buf.writeInt32LE(41);
                const result = Interpret.buffer.asNumber(new ManualConfigSource({key: buf}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(41);
            });

            for(const encoding of ['int8', 'uint8', 'int16le', 'int16be', 'uint16le', 'uint16be', 'int32le', 'int32be', 'uint32le', 'uint32be', 'floatle', 'floatbe', 'doublele', 'doublebe'] as SupportedNumberEncoding[]) {
                it(`should build an Interpreter for converting Buffer -> Number using [${encoding}] encoding.`, async () => {
                    const buf = Buffer.alloc(8, 0);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${encoding}`)!](41);
                    const result = Interpret.buffer.asNumber(new ManualConfigSource({key: buf}), encoding);

                    expect(result).to.be.instanceOf(Interpreter);
                    expect(await result.read('key')).to.equal(41);
                });

                it(`should build an Interpreter that returns undefined if passed undefined using [${encoding}] encoding.`, async () => {
                    const result = Interpret.buffer.asNumber(new ManualConfigSource(), encoding);
        
                    expect(result).to.be.instanceOf(Interpreter);
                    expect(await result.read('nope')).to.equal(undefined);
                });
            }

            it('should return an Interpreter that throws a TypeError if passed an invalid encoding scheme.', async () => {
                try {
                    const result = Interpret.buffer.asNumber(new ManualConfigSource(), 'donkeyballs' as any);
                    await result.read('key');
                }
                catch(err) {
                    expect(err).to.be.instanceOf(TypeError);
                    return;
                }
                throw new Error('No error was thrown.');
            });

        });

        describe('#asBigInt', () => {

            it('should build an Interpreter for converting Buffer -> BigInt.', async () => {
                const buf = Buffer.alloc(8, 0);
                buf.writeBigInt64LE(BigInt(41));
                const result = Interpret.buffer.asBigInt(new ManualConfigSource({key: buf}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(BigInt(41));
            });

            for(const encoding of ['bigint64le', 'bigint64be', 'biguint64le', 'biguint64be'] as SupportedBigIntEncoding[]) {
                it(`should build an Interpreter for converting Buffer -> BigInt using [${encoding}] encoding.`, async () => {
                    const buf = Buffer.alloc(8, 0);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${encoding}`)!](BigInt(41));
                    const result = Interpret.buffer.asBigInt(new ManualConfigSource({key: buf}), encoding);

                    expect(result).to.be.instanceOf(Interpreter);
                    expect(await result.read('key')).to.equal(BigInt(41));
                });

                it(`should build an Interpreter that returns undefined if passed undefined using [${encoding}] encoding.`, async () => {
                    const result = Interpret.buffer.asBigInt(new ManualConfigSource(), encoding);
        
                    expect(result).to.be.instanceOf(Interpreter);
                    expect(await result.read('nope')).to.equal(undefined);
                });
            }

            it('should return an Interpreter that throws a TypeError if passed an invalid encoding scheme.', async () => {
                try {
                    const result = Interpret.buffer.asBigInt(new ManualConfigSource(), 'donkeyballs' as any);
                    await result.read('key');
                }
                catch(err) {
                    expect(err).to.be.instanceOf(TypeError);
                    return;
                }
                throw new Error('No error was thrown.');
            });

        });

        describe('#asJSON', () => {

            const VALUE = Buffer.from('{"key": "value"}');
            const VALUE_NOTJSON = Buffer.from('VALUE');
            const EXPECTED = {key: 'value'};

            it('should build an Interpreter for converting Buffer -> JSON.', async () => {
                const result = Interpret.buffer.asJSON(new ManualConfigSource({key: VALUE}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.deep.equal(EXPECTED);
            });

            it('should build an Interpreter that returns undefined if passed invalid JSON.', async () => {
                const result = Interpret.buffer.asJSON(new ManualConfigSource({key: VALUE_NOTJSON}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(undefined);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.buffer.asJSON(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });

        describe('#asStringOrJSON', () => {

            const VALUE = Buffer.from('{"key": "value"}');
            const VALUE_NOTJSON = Buffer.from('VALUE');
            const EXPECTED = {key: 'value'};
            const EXPECTED_NOTJSON = 'VALUE'

            it('should build an Interpreter for converting Buffer -> JSON.', async () => {
                const result = Interpret.buffer.asStringOrJSON(new ManualConfigSource({key: VALUE}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.deep.equal(EXPECTED);
            });

            it('should build an Interpreter that returns a plaintext string if passed invalid JSON.', async () => {
                const result = Interpret.buffer.asStringOrJSON(new ManualConfigSource({key: VALUE_NOTJSON}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(EXPECTED_NOTJSON);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.buffer.asStringOrJSON(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });
    
    }); // -- end #buffer

    describe('#string', () => {

        describe('#asBuffer', () => {

            const VALUE = 'VALUE';
            const EXPECTED = Buffer.from('VALUE');

            it('should build an Interpreter for converting String -> Buffer.', async () => {
                const result = Interpret.string.asBuffer(new ManualConfigSource({key: VALUE}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.deep.equal(EXPECTED);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.string.asBuffer(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });

        describe('#asBool', () => {

            it('should build an Interpreter for converting String -> Bool (false).', async () => {
                const result = Interpret.string.asBool(new ManualConfigSource({key: 'false'}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(false);
            });

            it('should build an Interpreter for converting String -> Bool (true).', async () => {
                const result = Interpret.string.asBool(new ManualConfigSource({key: 'true'}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(true);
            });
            
            it('should build an Interpreter that returns undefined if passed a String containg anything other than \'true\' or \'false\'.', async () => {
                const result = Interpret.string.asBool(new ManualConfigSource({key: 'donkeyballs'}));
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('key')).to.equal(undefined);
            });

            it('should build an Interpreter that returns undefined if passed undefined.', async () => {
                const result = Interpret.string.asBool(new ManualConfigSource());
    
                expect(result).to.be.instanceOf(Interpreter);
                expect(await result.read('nope')).to.equal(undefined);
            });

        });

    });

    describe('#asNumber', () => {

        const VALUE = '5';
        const EXPECTED = 5;

        it('should build an Interpreter for converting String -> Number.', async () => {
            const result = Interpret.string.asNumber(new ManualConfigSource({key: VALUE}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.equal(EXPECTED);
        });

        it('should build an Interpreter that returns NaN for invalid strings.', async () => {
            const result = Interpret.string.asNumber(new ManualConfigSource({key: 'donkeyballs'}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.deep.equal(NaN);
        });

        it('should build an Interpreter that returns undefined if passed undefined.', async () => {
            const result = Interpret.string.asNumber(new ManualConfigSource());

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('nope')).to.equal(undefined);
        });

    });

    describe('#asBigInt', () => {

        const VALUE = '5';
        const EXPECTED = BigInt(5);

        it('should build an Interpreter for converting String -> BigInt.', async () => {
            const result = Interpret.string.asBigInt(new ManualConfigSource({key: VALUE}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.deep.equal(EXPECTED);
        });

        it('should build an Interpreter that throws a syntax error for invalid strings.', async () => {
            try {
                const result = Interpret.string.asBigInt(new ManualConfigSource({key: 'donkeyballs'}));
                await result.read('key');
            }
            catch(err) {
                expect(err).to.be.instanceOf(SyntaxError);
                return;
            }
            throw new Error('No error was thrown.');
        });

        it('should build an Interpreter that returns undefined if passed undefined.', async () => {
            const result = Interpret.string.asBigInt(new ManualConfigSource());

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('nope')).to.equal(undefined);
        });

    });

    describe('#asJSON', () => {

        const VALUE = '{"key": "value"}';
        const VALUE_NOTJSON = 'VALUE';
        const EXPECTED = {key: 'value'};

        it('should build an Interpreter for converting String -> JSON.', async () => {
            const result = Interpret.string.asJSON(new ManualConfigSource({key: VALUE}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.deep.equal(EXPECTED);
        });

        it('should build an Interpreter that returns undefined if passed invalid JSON.', async () => {
            const result = Interpret.string.asJSON(new ManualConfigSource({key: VALUE_NOTJSON}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.equal(undefined);
        });

        it('should build an Interpreter that returns undefined if passed undefined.', async () => {
            const result = Interpret.string.asJSON(new ManualConfigSource());

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('nope')).to.equal(undefined);
        });

    });

    describe('#asStringOrJSON', () => {

        const VALUE = '{"key": "value"}';
        const VALUE_NOTJSON = 'VALUE';
        const EXPECTED = {key: 'value'};
        const EXPECTED_NOTJSON = 'VALUE'

        it('should build an Interpreter for converting String -> JSON.', async () => {
            const result = Interpret.string.asStringOrJSON(new ManualConfigSource({key: VALUE}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.deep.equal(EXPECTED);
        });

        it('should build an Interpreter that returns the plaintext string if passed invalid JSON.', async () => {
            const result = Interpret.string.asStringOrJSON(new ManualConfigSource({key: VALUE_NOTJSON}));

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('key')).to.equal(EXPECTED_NOTJSON);
        });

        it('should build an Interpreter that returns undefined if passed undefined.', async () => {
            const result = Interpret.string.asStringOrJSON(new ManualConfigSource());

            expect(result).to.be.instanceOf(Interpreter);
            expect(await result.read('nope')).to.equal(undefined);
        });

    });

});
