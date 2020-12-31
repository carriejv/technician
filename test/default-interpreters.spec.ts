import mockery from 'mockery';
mockery.registerMock('os', { endianness: () => 'LE' });
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import { expect } from 'chai';
import { DefaultInterpreters, Interpret } from '../src';
import { SupportedBigIntEncoding, SupportedNumberEncoding } from '../src/types/util-types';

describe('DefaultInterpreters', () => {

    const rawString = { key: 'string', data: Buffer.from('a string'), source: undefined as any };
    const rawJSON = { key: 'json', data: Buffer.from('{"this": "is", "some": "json"}'), source: undefined as any };
    const rawBoolTrue = { key: 'bool', data: Buffer.from([1]), source: undefined as any };
    const rawBoolFalse = { key: 'bool', data: Buffer.from([0]), source: undefined as any };

    after(async () => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe ('+ Positive', () => {

        describe('Interpret',  () => {

            it('should be exported as InterpretSync in addition to DefaultInterpretersSync', () => {
                expect(Interpret).to.deep.equal(DefaultInterpreters);
            });

        });

        describe('#asBuffer', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asBuffer()).to.not.throw;
            });
    
            it('should return the raw data buffer as the interpreted value', async () => {
                expect(await DefaultInterpreters.asBuffer()(rawString)).to.equal(rawString.data);
            });
        });

        describe('#asText', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asText()).to.not.throw;
            });
    
            it('should return a string as the interpreted value', async () => {
                expect(await DefaultInterpreters.asText('utf8')(rawString)).to.equal('a string');
            });
        });

        describe('#asBool', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asBool()).to.not.throw;
            });
    
            it('should return a true for a Buffer containing exactly <0x01>', async () => {
                expect(await DefaultInterpreters.asBool()(rawBoolTrue)).to.equal(true);
            });

            it('should return a false for a Buffer containing exactly <0x00>', async () => {
                expect(await DefaultInterpreters.asBool()(rawBoolFalse)).to.equal(false);
            });
        });

        describe('#asNumber', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asNumber()).to.not.throw;
            });
    
            it('should return a number using default encoding', async () => {
                const buf = Buffer.alloc(4, 0);
                buf.writeInt32LE(41);
                const rawNum = { key: 'num', data: buf, source: undefined as any };

                expect(await DefaultInterpreters.asNumber()(rawNum)).to.equal(41);
            });

            for(const numEncoding of ['int8', 'uint8', 'int16le', 'int16be', 'uint16le', 'uint16be', 'int32le', 'int32be', 'uint32le', 'uint32be', 'floatle', 'floatbe']) {
                it(`should return a [${numEncoding}] number`, async () => {
                    const buf = Buffer.alloc(4, 0);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${numEncoding}`)!](41);
                    const rawNum = { key: 'num', data: buf, source: undefined as any };

                    expect(await DefaultInterpreters.asNumber(numEncoding as SupportedNumberEncoding)(rawNum)).to.equal(41);
                    if(!numEncoding.includes('uint')) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${numEncoding}`)!](-41);
                        expect(await DefaultInterpreters.asNumber(numEncoding as SupportedNumberEncoding)(rawNum)).to.equal(-41);
                    }
                });
            }

            for(const numEncoding of ['doublele', 'doublebe']) {
                it(`should return a [${numEncoding}] number`, async () => {
                    const buf = Buffer.alloc(8, 0);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${numEncoding}`)!](41);
                    const rawNum = { key: 'num', data: buf, source: undefined as any };

                    expect(await DefaultInterpreters.asNumber(numEncoding as SupportedNumberEncoding)(rawNum)).to.equal(41);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${numEncoding}`)!](-41);
                    expect(await DefaultInterpreters.asNumber(numEncoding as SupportedNumberEncoding)(rawNum)).to.equal(-41);
                });
            }

        });

        describe('#asBigInt', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asBigInt()).to.not.throw;
            });
    
            it('should return a number using default encoding', async () => {
                const buf = Buffer.alloc(8, 0);
                buf.writeBigInt64LE(BigInt(41));
                const rawBigInt = { key: 'num', data: buf, source: undefined as any };

                expect(await DefaultInterpreters.asBigInt()(rawBigInt)).to.equal(BigInt(41));
            });

            for(const bigIntEncoding of ['bigint64le', 'bigint64be', 'biguint64le', 'biguint64be']) {
                it(`should return a [${bigIntEncoding}] bigint`, async () => {
                    const buf = Buffer.alloc(8, 0);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${bigIntEncoding}`)!](BigInt(41));
                    const rawBigInt = { key: 'bigint', data: buf, source: undefined as any };

                    expect(await DefaultInterpreters.asBigInt(bigIntEncoding as SupportedBigIntEncoding)(rawBigInt)).to.equal(BigInt(41));
                    if(!bigIntEncoding.includes('uint')) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        (buf as any)[Object.getOwnPropertyNames(Object.getPrototypeOf(buf)).find(e => e.toLowerCase() === `write${bigIntEncoding}`)!](BigInt(-41));
                        expect(await DefaultInterpreters.asBigInt(bigIntEncoding as SupportedBigIntEncoding)(rawBigInt)).to.equal(BigInt(-41));
                    }
                });
            }

        });

        describe('#asJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(await DefaultInterpreters.asJSON('utf8')(rawJSON)).to.deep.equal({this: 'is', some: 'json'});
            });
        });

        describe('#asTextOrJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asTextOrJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(await DefaultInterpreters.asTextOrJSON('utf8')(rawJSON)).to.deep.equal({this: 'is', some: 'json'});
            });

            it('should return a string if the value is not valid JSON', async () => {
                expect(await DefaultInterpreters.asTextOrJSON('utf8')(rawString)).to.deep.equal('a string');
            });
        });

    });

    describe('- Negative', () => {

        describe('#asBool', () => {

            it('should return undefined if the data is not equal to <0x00> or <0x01>', async () => {
                expect(await DefaultInterpreters.asBool()(rawString)).to.equal(undefined);
            });

        });

        describe('#asNumber', () => {

            it('should throw a TypeError if an unknown number type is used.', async () => {
                try {
                    await DefaultInterpreters.asNumber('uint420blazeit' as any)(rawString);
                }
                catch(err) {
                    expect(err).to.be.an.instanceOf(TypeError);
                    return;
                }
                throw new Error('No error was thrown.');
            });

        });

        describe('#asBigInt', () => {

            it('should throw a TypeError if an unknown number type is used.', async () => {
                try {
                    await DefaultInterpreters.asBigInt('uint420blazeit' as any)(rawString);
                }
                catch(err) {
                    expect(err).to.be.an.instanceOf(TypeError);
                    return;
                }
                throw new Error('No error was thrown.');
            });

        });

        describe('#asJSON', () => {

            it('should return undefined if the data is invalid JSON', async () => {
                expect(await DefaultInterpreters.asJSON('utf8')(rawString)).to.equal(undefined);
            });

        });

    });

});