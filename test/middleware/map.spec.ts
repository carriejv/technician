import { expect } from 'chai';
import { Map, Mapper, ManualConfigSource } from '../../src';

const VALUE = 'VALUE'
const TEST_SOURCE = new ManualConfigSource({
    zzz_key: VALUE,
});
const TEST_MAP_FUNC = (key: string) => key.replaceAll('zzz_', '')

describe('Map', () => {

    describe('#from', () => {

        it('should build an Map using from().on() syntax.', async () => {
            const result = Map.from(TEST_MAP_FUNC).on(TEST_SOURCE)

            expect(result).to.be.instanceOf(Mapper);
            expect(await result.read('key')).to.equal(VALUE);
        });

    });

});
