import { expect } from 'chai';
import { DefaultInterpreters, Technician } from '../src';

describe('DefaultInterpreters', () => {

    const rawString = {key: 'string', data: Buffer.from('a string'), source: new Technician()};
    const rawJSON = {key: 'json', data: Buffer.from('{"this": "is", "some": "json"}'), source: new Technician()};

    describe ('+ Positive', () => {

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

        describe('#asJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpreters.asJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(await DefaultInterpreters.asJSON('utf8')(rawJSON)).to.deep.equal({this: 'is', some: 'json'});
            });
        });

    });

    describe('- Negative', () => {

        describe('#asJSON', () => {

            it('should return undefined if the data is invalid JSON', async () => {
                expect(await DefaultInterpreters.asJSON('utf8')(rawString)).to.equal(undefined);
            });

        });

    });

});