import { expect } from 'chai';
import { ConfigNotFoundError } from '../src';

describe('ConfigNotFoundError', () => {

    it('should build', async () => {
        expect(new ConfigNotFoundError('message')).to.not.throw;
    });

    it('should be an instance of Error', async () => {
        expect(new ConfigNotFoundError('message')).to.be.instanceof(Error);
    });

});