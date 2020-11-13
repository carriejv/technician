import rewiremock from 'rewiremock';
rewiremock.overrideEntryPoint(module);

import { expect } from 'chai';
import { DSSReader } from '../src';

describe('DSSReader', () => {

    const expectedBufferUTF8 = Buffer.from('This is some UTF8.', 'utf8');
    const expectedBufferJSON = Buffer.from('{"this": "is", "valid": "json"}', 'utf8');
    const expectedBufferHex = Buffer.from('5468697320697320736f6d65204865782e203d50', 'utf8');

    describe ('+ Positive', () => {

        it('should build', async () => {
            expect(new DSSReader()).to.not.throw;
        });

        describe('#readSecret', () => {
            it('should read a secret using the default interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = await reader.readSecret('text');
    
                expect(result.name).to.equal('text');
                expect(result.data).to.deep.equal(expectedBufferUTF8);
                expect(result.secret).to.deep.equal(expectedBufferUTF8);
            });
    
            it('should read a secret using a custom interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = await reader.readSecret('text', s => s.data?.toString('utf8'));
    
                expect(result.name).to.equal('text');
                expect(result.data).to.deep.equal(expectedBufferUTF8);
                expect(result.secret).to.equal('This is some UTF8.');
            });
        });

        describe('#readSecretSync', () => {
            it('should read a secret using the default interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = reader.readSecretSync('text');

                expect(result.name).to.equal('text');
                expect(result.data).to.deep.equal(expectedBufferUTF8);
                expect(result.secret).to.deep.equal(expectedBufferUTF8);
            });

            it('should read a secret using a custom interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = reader.readSecretSync('text', s => s.data?.toString('utf8'));

                expect(result.name).to.equal('text');
                expect(result.data).to.deep.equal(expectedBufferUTF8);
                expect(result.secret).to.equal('This is some UTF8.');
            });
        });

        describe('#readSecrets', () => {
            it('should read secrets using the default interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = await reader.readSecrets();
    
                expect(result.text.name).to.equal('text');
                expect(result.text.data).to.deep.equal(expectedBufferUTF8);
                expect(result.text.secret).to.deep.equal(expectedBufferUTF8);

                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.deep.equal(expectedBufferHex);

                expect(result.json.name).to.equal('json');
                expect(result.json.data).to.deep.equal(expectedBufferJSON);
                expect(result.json.secret).to.deep.equal(expectedBufferJSON);  
            });
    
            it('should read secrets using a custom interpreter, ignoring non-matching secrets', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = await reader.readSecrets({
                    interpreter: s => {
                        const dataBuf = s.data?.toString('utf8');
                        if(!dataBuf) return undefined;
                        return Buffer.from(dataBuf, 'hex').toString('utf8');
                    },
                    predicate: s => s.name === 'hex'
                });
    
                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.equal('This is some Hex. =P');

                expect(Object.keys(result).length).to.equal(1);
            });

            it('should read secrets using a custom interpreter set, ignoring non-matching secrets', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = await reader.readSecrets([{
                    interpreter: s => {
                        const dataBuf = s.data?.toString('utf8');
                        if(!dataBuf) return undefined;
                        return Buffer.from(dataBuf, 'hex').toString('utf8');
                    },
                    predicate: s => s.name === 'hex'
                },
                {
                    interpreter: s => s.data?.toString('utf8')
                }]);
    
                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.equal('This is some Hex. =P');

                expect(result.text.name).to.equal('text');
                expect(result.text.data).to.deep.equal(expectedBufferUTF8);
                expect(result.text.secret).to.deep.equal('This is some UTF8.');

                expect(result.json.name).to.equal('json');
                expect(result.json.data).to.deep.equal(expectedBufferJSON);
                expect(result.json.secret).to.deep.equal('{"this": "is", "valid": "json"}'); 

                expect(Object.keys(result).length).to.equal(3);
            });
        });

        describe('#readSecretsSync', () => {
            it('should read secrets using the default interpreter', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = reader.readSecretsSync();
    
                expect(result.text.name).to.equal('text');
                expect(result.text.data).to.deep.equal(expectedBufferUTF8);
                expect(result.text.secret).to.deep.equal(expectedBufferUTF8);

                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.deep.equal(expectedBufferHex);

                expect(result.json.name).to.equal('json');
                expect(result.json.data).to.deep.equal(expectedBufferJSON);
                expect(result.json.secret).to.deep.equal(expectedBufferJSON);  
            });
    
            it('should read secrets using a custom interpreter, ignoring non-matching secrets', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = reader.readSecretsSync({
                    interpreter: s => {
                        const dataBuf = s.data?.toString('utf8');
                        if(!dataBuf) return undefined;
                        return Buffer.from(dataBuf, 'hex').toString('utf8');
                    },
                    predicate: s => s.name === 'hex'
                });
    
                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.equal('This is some Hex. =P');

                expect(Object.keys(result).length).to.equal(1);
            });

            it('should read secrets using a custom interpreter set, ignoring non-matching secrets', async () => {
                const reader = new DSSReader('./test/test-secrets');
                const result = reader.readSecretsSync([{
                    interpreter: s => {
                        const dataBuf = s.data?.toString('utf8');
                        if(!dataBuf) return undefined;
                        return Buffer.from(dataBuf, 'hex').toString('utf8');
                    },
                    predicate: s => s.name === 'hex'
                },
                {
                    interpreter: s => s.data?.toString('utf8')
                }]);
    
                expect(result.hex.name).to.equal('hex');
                expect(result.hex.data).to.deep.equal(expectedBufferHex);
                expect(result.hex.secret).to.equal('This is some Hex. =P');

                expect(result.text.name).to.equal('text');
                expect(result.text.data).to.deep.equal(expectedBufferUTF8);
                expect(result.text.secret).to.deep.equal('This is some UTF8.');

                expect(result.json.name).to.equal('json');
                expect(result.json.data).to.deep.equal(expectedBufferJSON);
                expect(result.json.secret).to.deep.equal('{"this": "is", "valid": "json"}'); 

                expect(Object.keys(result).length).to.equal(3);
            });
        });

    });

    describe ('- Negative', () => {

        it('should silently ignore missing secrets and return undefined as their value', async () => {
            const reader = new DSSReader('./test/test-secrets');
            const result = await reader.readSecret('nope');
            expect(result.secret).to.equal(undefined);
        });

        it('should silently ignore missing secrets and return undefined as their value (using sync file access)', async () => {
            const reader = new DSSReader('./test/test-secrets');
            const result = reader.readSecretSync('nope');
            expect(result.secret).to.equal(undefined);
        });

        it('should throw non-ENOENT filesystem errors', async () => {
            const stubbed = rewiremock.proxy(() => require('../src/reader/secret-reader'), {
                'fs': { promises: { readFile: async () => { throw new Error('パターン青'); }}}
            });
            const reader = new stubbed.DSSReader('./test/test-secrets');
            try {
                await reader.readSecret('nope');
            }
            catch(err) {
                expect(err).to.match(/パターン青/);
                return;
            }
            throw new Error('No error was thrown.');
        });

        it('should throw non-ENOENT filesystem errors (using sync file access)', async () => {
            const stubbed = rewiremock.proxy(() => require('../src/reader/secret-reader'), {
                'fs': {readFileSync: () => { throw new Error('パターン青'); }}
            });
            const reader = new stubbed.DSSReader('./test/test-secrets');
            try {
                reader.readSecretSync('nope');
            }
            catch(err) {
                expect(err).to.match(/パターン青/);
                return;
            }
            throw new Error('No error was thrown.');
        });

    });

});