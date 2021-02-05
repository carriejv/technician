import { expect } from 'chai';
import { Uplevel, Upleveler, ManualConfigSource } from '../../src';

const VALUE = 'VALUE'
const OTHER_VALUE = 'OTHER_VALUE';
const TEST_SOURCE = new ManualConfigSource({
    key: {
        subKey: VALUE
    },
    otherKey: {
        subOtherKey: OTHER_VALUE
    }
});

describe('Uplevel', () => {

    describe('#only', () => {

        it('should build an Upleveler configured to only read a single base key.', async () => {
            const result = Uplevel.only('key').on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Upleveler);
            expect(await result.read('subKey')).to.equal(VALUE);
            expect(await result.read('subOtherKey')).to.equal(undefined);
        });

        it('should build an Upleveler configured to only read an array of base keys.', async () => {
            const result = Uplevel.only(['key', 'otherKey']).on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Upleveler);
            expect(await result.read('subKey')).to.equal(VALUE);
            expect(await result.read('subOtherKey')).to.equal(OTHER_VALUE);
        });

    });

    describe('#all', () => {

        it('should build an Upleveler configured to only read all base keys.', async () => {
            const result = Uplevel.all().on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Upleveler);
            expect(await result.read('subKey')).to.equal(VALUE);
            expect(await result.read('subOtherKey')).to.equal(OTHER_VALUE);
        });

    });

    describe('#withCache', () => {

        it('should set a custom cache length on the Upleveler.', async () => {
            const result = Uplevel.all().withCache(1000).on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Upleveler);
            expect((result as any).internalCacheLength).to.equal(1000);
        });

    });

    describe('#withoutCache', () => {

        it('should disable caching on the Upleveler.', async () => {
            const result = Uplevel.all().withoutCache().on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Upleveler);
            expect((result as any).internalCacheLength).to.be.lessThan(0);
        });
    });

});
