import { expect } from 'chai';
import { DefaultInterpretersSync, Technician } from '../src';

describe('DefaultInterpretersSync', () => {

    const rawString = {key: 'string', data: Buffer.from('a string'), source: new Technician()};
    const rawJSON = {key: 'json', data: Buffer.from('{"this": "is", "some": "json"}'), source: new Technician()};

    describe ('+ Positive', () => {

        describe('#asBuffer', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpretersSync.asBuffer()).to.not.throw;
            });
    
            it('should return the raw data buffer as the interpreted value', async () => {
                expect(DefaultInterpretersSync.asBuffer()(rawString)).to.equal(rawString.data);
            });
        });

        describe('#asText', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpretersSync.asText()).to.not.throw;
            });
    
            it('should return a string as the interpreted value', async () => {
                expect(DefaultInterpretersSync.asText('utf8')(rawString)).to.equal('a string');
            });
        });

        describe('#asJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpretersSync.asJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(DefaultInterpretersSync.asJSON('utf8')(rawJSON)).to.deep.equal({this: 'is', some: 'json'});
            });
        });

        describe('#asTextOrJSON', () => {
            it('should return an interpreter', async () => {
                expect(DefaultInterpretersSync.asTextOrJSON()).to.not.throw;
            });
    
            it('should return a json object as the interpreted value', async () => {
                expect(await DefaultInterpretersSync.asTextOrJSON('utf8')(rawJSON)).to.deep.equal({this: 'is', some: 'json'});
            });

            it('should return a string if the value is not valid JSON', async () => {
                expect(await DefaultInterpretersSync.asTextOrJSON('utf8')(rawString)).to.deep.equal('a string');
            });
        });

    });

    describe('- Negative', () => {

        describe('#asJSON', () => {

            it('should return undefined if the data is invalid JSON', async () => {
                expect(DefaultInterpretersSync.asJSON('utf8')(rawString)).to.equal(undefined);
            });

        });

    });

});