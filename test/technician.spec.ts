import { expect } from 'chai';
import { Technician } from '../src';

describe('Technician', () => {

    describe ('+ Positive', () => {

        it('should build', async () => {
            expect(new Technician()).to.not.throw;
        });

    });

    describe ('- Negative', () => {

        return;
        
    });

});