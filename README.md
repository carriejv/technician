# Technician

[![npm version](https://img.shields.io/npm/v/technician.svg)](https://www.npmjs.com/package/technician) [![npm downloads](https://img.shields.io/npm/dt/technician)](https://www.npmjs.com/package/technician) [![npm license](https://img.shields.io/npm/l/technician.svg)](https://www.npmjs.com/package/technician)

[![dependencies](https://img.shields.io/david/carriejv/technician.svg)](https://david-dm.org/carriejv/technician) [![Build Status](https://github.com/carriejv/technician/workflows/ci-build/badge.svg?branch=master)](https://github.com/carriejv/technician/actions?query=workflow%3Aci-build) [![GitKraken](https://img.shields.io/badge/<3-GitKraken-green.svg)](https://www.gitkraken.com/invite/om4Du5zG)

Technician provides a central service to manage everything related to your application's config.

Technician is built to allow for robust and complex config management with no runtime dependencies. With Technician, you can:

* Combine config from a variety of sources like environment variables, config files, databases, and CLI arguments.
* Easily set up switchable config environments for testing, production, etc.
* Automatically cache the results of all your config reads.
* Set up the ability to easily override config post-deploy.
* Create reusable parsers and validators for complex config.
* Define TypeScript types for your config.

To view full documentation, download this package and run `npm run docs`.

## Installation

`npm i technician`

`npm i @technician/source-foo`

Technician is compatible with Node 10 LTS and up. Some sources may have different compatability requirements.

## Basic Usage

### Adding a source and reading from it.
```ts
import { Technician } from 'technician';
import { EnvConfigSource } from '@technician/source-env';

// Create a Technician config manager.
// Technician can access any values visible to its config source(s).
const technician = new Technician(new EnvConfigSource());
const value = await technician.read('MY_ENV_VAR');

// Possible value types are inferred based on the config sources available.
typeof value === 'string'; 

// You can also require a value, throwing a ConfigNotFoundError if it does not exist.
const importantValue = await technician.require('MY_IMPORTANT_VAR');
// ... or just read everything at once.
const everything = await technician.readAll();
// everything = {MY_ENV_VAR: 'something', MY_IMPORTANT_VAR: 'something-else', ...}
```

### Using middleware to parse complex config
```ts
import { Interpret, Technician, Uplevel } from 'technician';
import { FSConfigSource } from '@technician/source-fs'

const technician = new Technician(
    // Middleware is described in depth below.
    // This combination converts raw file buffers to JSON, and then moves the keys from config.json
    //    up a level to be directly readable by Technician.
    Uplevel.only('config.json').on(Interpret.buffer.asJSON(new FSConfigSource('/opt/myapp/config')))
);

await technician.read('json-key');
```

### Merging

Technician can be configured to merge structured data like objects and arrays. If enabled, merged results will be returned from all highest-priority config sources that return the correct data type. When merging objects, the first source to return a particular property gets precedence.

```ts
const configSource1 = new ManualConfigSource({
    obj: {
        key: 'value',
        deeply: {
            merged: true
        }
    },
    arr: [1, 2, 3]
});
const configSource2 = new ManualConfigSource({
    obj: {
        key: 'other-value',
        only2: 'only2',
        deeply: {
            yay: 'technician'
        }
    },
    arr: [4, 5, 6]
});
const technician = new Technician([configSource1, configSource2], {
    mergeArrays: true,
    mergeObjects: true
})

const arr = await technician.read('arr');
// [1, 2, 3, 4, 5, 6]

const obj = await technician.read('obj');
//  {
//      key: 'value',
//      only2: 'only2',
//      deeply: {
//          merged: true,
//          yay: 'technician'
//      }
//  }
```

## Synchronous Usage

Technician provides `readSync()`, `requireSync()`, `readAllSync()`, and `listSync()` for use with synchronous code. These functions will only search synchronously-accessible config sources, so they may not have the same level of visibility as their async counterparts.

A single `ConfigSource` can implement both `read()` and `readSync()`, etc. to support both access methods. If only sync access is supported, async reads will default to using it.

## Config Sources

Config sources are the heart of Technician. Technician is built to be fully modular, and provides little functionality out of the box unless at least one config source is installed and configured.

Official Technician config sources can be found in the [@technician](https://www.npmjs.com/org/technician) org on NPM. Official modules (sources and otherwise) will share the same major version as the compatible version of Technician. Common starter sources are listed below:

* `ManualConfigSource` - Reads manually `set()` values. Provided directly `technician`.

* `EnvConfigSource` - Reads environment variables into Technician.

    [![EnvConfigSource](https://img.shields.io/npm/v/@technician/source-env?label=@technician/source-env)](https://www.npmjs.com/package/@technician/source-env)

* `FSConfigSource` - Reads files from a given directory. Works with Docker & Kubernetes secrets.

    [![FSConfigSource](https://img.shields.io/npm/v/@technician/source-fs?label=@technician/source-fs)](https://www.npmjs.com/package/@technician/source-fs)

Technician instances can also be used as ConfigSources for other instances of Technician in complex setups.

Technician is designed to be easily extensible. You can build your own source by extending the `ConfigSource` base class and overriding its `read`, `readSync`, `list`, and `listSync` functions. You can also override `readAll` and `readAllSync` to provide behavior other than the default of reading all keys provided by `list()`.

## Config Environments

Config environments can be created a number of ways in Technician. One of the easiest is to use the `ignoreIf` option on a source or pass in a whitelist of sources to filter the results returned by `read()`, etc. You can also use middleware sources to define more complex environment and override behavior.

By default, the first source to return a valid value wins if multiple sources return values for the same key. You can also set a `priority` on a source. Higher priority sources will always win over a lower priority source. Default priority is `0`.

```ts
const technician = new Technician([
    {source: new FSConfigSource('./test-config'), ignoreIf: () => process.env.NODE_ENV === 'production'},
    {source: new FSConfigSource('./prod-config')},
    {source: new FSConfigSource('./important-directory'), priority: 1}
]);
const value = await technician.read('client_secret');
```

```ts
const technician = new Technician([
    testSource,
    prodSource
]);
const value = await technician.read('client_secret', [testSource]);
```

You can also set sources at runtime to, for example, override config during testing.
```ts
import { ManualConfigSource } from 'technician';
import { myTechnicianInstance } from '../some-module';

const testConfig = new ManualConfigSource({
    client_secret: 'foo'
});

before(() => {
    myTechnicianInstance.setSource({source: testConfig, priority: 999});
});

after(() => {
    myTechnicianInstance.unsetSource(testConfig)
});
```

## Middleware Sources

A middleware source is a `ConfigSource` that wraps a lower-level source and transforms its outputs.

Technician provides four middleware sources out of the box, `Aliaser`, `Interpreter`, `Mapper`, and `Upleveler`.

### Aliases

Aliases can be used to make an individual config value easier to access, or to create a single key that is shared between multiple sources.

Aliases can be built directly as an `Aliaser` instance or using the `Alias` semantic API:
```ts
import { Aliaser } from 'technician';
const aliasedSource = new Aliaser(myConfigSource, {alias: 'my-default-key'});
```
```ts
import { Alias } from 'technician';
const aliasedSource = Alias.set('alias').to('my-default-key').on(myConfigSource);
// ...or
const lotsOfAliases = Alias.set({lots: 'of', aliases: 'here'}).on(myConfigSource);
```

Aliases can be used in combination with the `priority` option to set up config override behavior.
```ts
import { Alias, Technician, Uplevel } from 'technician';
import { EnvConfigSource } from '@technician/source-env';
import { FSConfigSource } from '@technician/source-file';

const technician = new Technician([
    {source: Alias.set('client-secret').to('CLIENT_SECRET').on(new EnvConfigSource()), priority: 1, cacheFor: -1},
    Alias.set('client-secret').to('client_secret.txt').on(new FSConfigSource('/run/secrets'))
]);
```

With the setup above, reading `client-secret` would return the secret mounted at `/run/secrets` unless the environment variable `CLIENT_SECRET` was set, at which point it would begin returning that value without caching it.

By default, sources have a `priority` of `0` and cache forever. To disable caching, set a negative `cacheFor`.

`Aliaser` allows access via both the alias and the original key by default. This passthrough behavior is configurable by passing `'full'`, `'partial'`, or `'none'` to the constructor or ending an `Alias` call with `withPassthrough()`, `withPartialPassthrough()`, or `withoutPassthrough()`.

Partial passthrough blocks access to aliased keys by their unaliased name. No passthrough prevents data from being returned by anything other than explicitly set aliases.

### Interpreter

Interpreters allow raw values to be deserialized, validated, or otherwise transformed. This work is done prior to caching, meaning expensive work will not be unnecessarily repeated.

Interpreters can be built directly or via the `Interpret` API:
```ts
import { Interpreter } from 'technician';
const interpretedSource = new Interpreter(someBufferSource, configItem => configItem.value?.toString('utf8'));
```
```ts
import { Interpret } from 'technician';
const interpretedSource = Interpret.buffer.asString(someBufferSource, 'utf8');
```

The type returned by the Interpreter function is seen as the "true" type of the source by Technician and will adjust the typing of reads appropriately. If an interpreter returns undefined in a particular case, Technician ignores this value as though it were nonexistant in the root source.

By default, interpreter functions are synchronous to maintain compatbility with both async and sync read operations. However, if desired, you can pass in an object containing both an async and sync variant of the interpreter function to the `Interpreter` constructor. If no sync variant is provided, the source will be treated as async-only and ignored by synchronous reads.
```ts
const interpretedSource = new Interpreter(someBufferSource, {
    async: async configItem => {
        await somethingAsync();
        return configItem.value?.toString('utf8');
    }
    sync: configItem => configItem.value?.toString('utf8')
)};
```

The `Interpret` package provides several common conversions for both `string` and `Buffer` data, the two raw types returned most commonly by sources. `Interpret` may also be extended by external interpreter packages.

* `asBuffer()`
    - Returns a Buffer containing the contents of a string.
* `asString('utf8' | 'ascii' | ...)`
    - Returns a string value from a Buffer.
* `asBool()`
    - Returns a boolean value.
    - <0x00> and 'false' = false, <0x01> and 'true' = true.
    - Any other values are undefined.
* `asNumber('int32' | 'uint32' | 'float' | ...)`
    - For Buffers, reads from offset 0 and ignores trailing data.
        - By default, uses 32-bit signed ints and `os.endianness()`.
        - Number types use the naming conventions of [Node's Buffer type](https://nodejs.org/api/buffer.html#buffer_buf_readbigint64be_offset) `readX` functions, with `X` in all lowercase being the id used by Technician.
        - Number data type may be passed in full with endianness `uint32le` or as only `uint32` to preserve the use of OS-native endianness.
    - For Strings, uses `parseFloat()`.
* `asBigInt('bigint64' | 'biguint64' | ...)`
    - asNumber, but bigger.
* `asJSON('utf8' | 'ascii' | ...)`
    - `JSON.parse()`s values. Invalid JSON is undefined.
* `asStringOrJSON('utf8' | 'ascii' | ...)`
    - Returns a JSON object or array if the value is valid JSON, else a plaintext string.

### Mapper

Mappers are Alisers that use a mapping function to dynamically build aliases rather than having a static mapping.

Mappers can be built directly as an `Mappers` instance or using the `Map` semantic API:
```ts
import { Mapper } from 'technician';
const mappedSource = new Mapper(myConfigSource, (configKey: string) => path.parse(name));
```
```ts
import { Map } from 'technician';
const mappedSource = Map.from((configKey: string) => path.parse(name)).on(myConfigSource);
```

Mappers can also be used to filter results from a config source. If the mapper returns undefined for a given key, that key is filtered from config results.
```ts
import { Mapper } from 'technician';
const mappedSource = new Mapper(myConfigSource, (configKey: string) => configKey.includes('use_this') ? configKey : undefined);
```

### Upleveler

Uplevelers take a config source that returns `{key: value}` objects and return those keys and values directly to Technician, effectively "moving them up a level." Uplevelers can be used to take structured data out of a single key and convert it into several keys that are easier to use.

```ts
// ... without Upleveler
await Technician.read('config.json') // {key: 'value', something: 'else'}
// ... with Upleveler
await Technician.read('key') // 'value'
await Technician.read('something') // 'else'
```

You can choose to uplevel all keys on a source or only a specific set of keys. The first read from the base source to set a value for a particular key wins.

Uplevelers can be constructed directly or via `Uplevel`.
```ts
import { Upleveler } from 'technician';
const upleveledSource = new Upleveler(someJSONSource);
// ... or
const upleveledSource = new Upleveler(someJSONSource, ['only-this.json']);
```
```ts
import { Uplevel } from 'technician';
const upleveledSource = Uplevel.all().on(someJSONSource);
// ... or
const upleveledSource = Uplevel.only('only-this.json').on(someJSONSource);
```

The Upleveler has its own short-lived internal cache, which helps to reduce the cost of repeatedly accessing the same key on the base source. Values returned through an Upleveler may not immediately reflect changes in the base source.

To disable this behavior, you can pass a negative cache length to the constructor or use `Uplevel.all().withoutCache()`. You can also pass a custom cache length in ms (`withCache()` via `Uplevel`).

## Utility Functions

### List

`technician.list()` or `technician.listSync()` returns a list of all available keys, including aliases.

### Describe

`technician.describe(key)` can be used to return cached information on a previously-read key. This also includes its cache priority, 

### Export

`technician.export()` returns all known config as a `{key: value}` object. Export, unlike `readAll()`, does not read new config -- it provides a method to look at the exact state of Technician based on prior reads.

### ClearCache

`technician.clearCache()` will wipe the entire cache. `technician.clearCache(key)` can also be used to delete only a specific entry.

### Editing Existing Sources

If you want to change the priority or cache policy of a previously set source, you can simply pass it back in to `setSource()` with the new config. You can also `unsetSource()` to remove it completely.

Sources are managed by reference. The exact `ConfigSource` passed in at creation should be passed in to edit or delete it. For these purposes, a source and the same source wrapped in middleware are also different.

## Contributions

Contributions and pull requests are always welcome. Please be sure your code passes all existing tests and linting.

Pull requests with full code coverage are strongly encouraged.

Technician is built to be modular and easily extensible. If you're building a config source, middleware, or other extension it should be published as its own package rather than incorporated into Technician.

## License

[Apache-2.0](https://github.com/carriejv/technician/blob/master/LICENSE)