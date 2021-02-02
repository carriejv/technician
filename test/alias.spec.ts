import { expect } from 'chai';
import { Alias, Aliaser, ManualConfigSource } from '../src';

const VALUE = 'VALUE'
const OTHER_VALUE = 'OTHER_VALUE';
const OTHER_OTHER_VALUE = 'OTHER_OTHER_VALUE';
const TEST_SOURCE = new ManualConfigSource({
    key: VALUE,
    otherKey: OTHER_VALUE,
    otherOtherKey: OTHER_OTHER_VALUE
});

describe('Alias', () => {

    describe('#set', () => {

        it('should build an Aliaser using set().to().on() syntax.', async () => {
            const result = Alias.set('alias').to('key').on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
        });

        it('should build an Aliaser using set().on() syntax with an object map.', async () => {
            const result = Alias.set({alias: 'key'}).on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
        });

        it('should allow chained sets.', async () => {
            const result = Alias.set('alias').to('key').set('otherAlias').to('otherKey').set({otherOtherAlias: 'otherOtherKey'}).on(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
            expect(await result.read('otherAlias')).to.equal(OTHER_VALUE);
            expect(await result.read('otherOtherAlias')).to.equal(OTHER_OTHER_VALUE);
        });

    });

    describe('#withPassthrough', () => {

        it('should build an Aliaser with full passthrough.', async () => {
            const result = Alias.set('alias').to('key').withPassthrough(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
            expect(await result.read('key')).to.equal(VALUE);
            expect(await result.read('otherKey')).to.equal(OTHER_VALUE);
        });

    });

    describe('#withPartialPassthrough', () => {

        it('should build an Aliaser with partial passthrough.', async () => {
            const result = Alias.set('alias').to('key').withPartialPassthrough(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
            expect(await result.read('key')).to.equal(undefined);
            expect(await result.read('otherKey')).to.equal(OTHER_VALUE);
        });

    });

    describe('#withoutPassthrough', () => {

        it('should build an Aliaser with no passthrough.', async () => {
            const result = Alias.set('alias').to('key').withoutPassthrough(TEST_SOURCE);

            expect(result).to.be.instanceOf(Aliaser);
            expect(await result.read('alias')).to.equal(VALUE);
            expect(await result.read('key')).to.equal(undefined);
            expect(await result.read('otherKey')).to.equal(undefined);
        });

    });

});
