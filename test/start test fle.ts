/* eslint-disable */
import { expect } from 'chai';
import { ConfigNotFoundError, ManualConfigSource, Technician } from '../src';

describe('Aliaser', () => {

    describe ('+ Positive', () => {

        it('should build', async () => {
            expect(new Technician()).to.not.throw;
        });

        describe('#read', () => {

            it('should read a single config value.', async () => {
                
            });

        });
    });

    describe ('- Negative', () => {

        describe('#read', () => {

            it('should return undefined if a config value does not exist.', async () => {
                
            });

        });

    });

});