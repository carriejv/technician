import rewiremock from 'rewiremock';
rewiremock.overrideEntryPoint(module);

import { expect } from 'chai';
import { DefaultInterpreters } from '../src';

describe('DefaultInterpreters', () => {

    const secret = {name: 'secret', data: Buffer.from('a random secret string')};
    const jsonSecret = {name: 'secret', data: Buffer.from('{"a": "random", "secret": "string"}')};

    describe ('+ Positive', () => {

        describe('#asBuffer', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asBuffer()).to.not.throw;
            });
    
            it('should return the raw data buffer as the interpreted value', async () => {
                expect(DefaultInterpreters.asBuffer()(secret)).to.equal(secret.data);
            });
        });

        describe('#asText', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asText()).to.not.throw;
            });
    
            it('should return a string as the interpreted value', async () => {
                expect(DefaultInterpreters.asText('utf8')(secret)).to.equal('a random secret string');
            });
        });

        describe('#asJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(DefaultInterpreters.asJSON('utf8')(jsonSecret)).to.deep.equal({a: 'random', secret: 'string'});
            });
        });

        describe('#asTextOrJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asTextOrJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value when the secret contains valid json', async () => {
                expect(DefaultInterpreters.asTextOrJSON('utf8')(jsonSecret)).to.deep.equal({a: 'random', secret: 'string'});
            });

            it('should return a string as the interpreted value when the secret does not contain valid json', async () => {
                expect(DefaultInterpreters.asTextOrJSON('utf8')(secret)).to.deep.equal('a random secret string');
            });
        });

    });

    describe ('- Negative', () => {

        describe('#asBuffer', () => {
            it('should return undefined if the secret data is undefined', async () => {
                expect(DefaultInterpreters.asBuffer()({name: 'secret'})).to.equal(undefined);
            });
        });

        describe('#asText', () => {
            it('should return undefined if the secret data is undefined', async () => {
                expect(DefaultInterpreters.asText()({name: 'secret'})).to.equal(undefined);
            });
        });

        describe('#asJSON', () => {
            it('should return undefined if the secret data is undefined', async () => {
                expect(DefaultInterpreters.asJSON()({name: 'secret'})).to.equal(undefined);
            });
            it('should return undefined if the secret data is not valid json', async () => {
                expect(DefaultInterpreters.asJSON()(secret)).to.equal(undefined);
            });
        });

        describe('#asTextOrJSON', () => {
            it('should return undefined if the secret data is undefined', async () => {
                expect(DefaultInterpreters.asTextOrJSON()({name: 'secret'})).to.equal(undefined);
            });
        });

    });

});