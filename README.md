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

`npm i @technician/source/some-source`

Technician is compatible with Node 10 LTS and up. Some sources may have different compatability requirements.

## Basic Usage

### The Basics
```ts
import {Technician} from 'technician';
import {EnvConfigSource} from '@technician/source/env';

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

## Synchronous Usage

Technician provides `readSync()`, `requireSync()`, `readAllSync()`, and `listSync()` for use with synchronous code. These functions will only search synchronously-accessible config sources, so they may have the same level of visibility as their async counterparts.

A single `ConfigSource` can implement both `read()` and `readSync()`, etc. to support both access methods. If only sync access is supported, async reads will default to using it.

## Config Sources

Config sources are the heart of Technician. Technician is built to be fully modular, and provides little  functionality out of the box unless at least one config source is installed and configured.

Official Technician config sources can be found in the [@technician](https://www.npmjs.com/org/technician) org on NPM. Official modules (sources and otherwise) will share the same major version as the compatible version of Technician. Common starter sources are listed below:

* `ManualConfigSource` - Reads manually `set()` values. Provided directly `technician`.

* `EnvConfigSource` - Reads environment variables into Technician.

    [![EnvConfigSource](https://img.shields.io/npm/v/@technician/source/env?label=@technician/source/env)](https://www.npmjs.com/package/@technician/source/env)

* `FileConfigSource` - Reads a file as a key: value config map.

    [![JSONConfigSource](https://img.shields.io/npm/v/@technician/source/file?label=@technician/source/file)](https://www.npmjs.com/package/@technician/source/file)

* `FSConfigSource` - Reads directories of config files. Works with Docker & Kubernetes secrets.

    [![FSConfigSource](https://img.shields.io/npm/v/@technician/source/fs?label=@technician/source/fs)](https://www.npmjs.com/package/@technician/source/fs)

Technician instances can also be used as ConfigSources for other instances of Technician in complex setups.

Technician is designed to be easily extensible -- build your own source by extending the `ConfigSource` base class, extend an existing config source, or use community-made sources.

## Config Environments

Config environments can be created a number of ways in Technician. One of the easiest is to use the `ignoreIf` option on a source. You can also use middleware sources to define more complex environment and override behavior.

By default, the first source to return a valid value wins if multiple sources return values for the same key. You can also set a `priority` on a source. Higher priority sources will always win over a lower priority source. Default priority is `0`.

```ts
import {Technician} from 'technician';
import {FileConfigSource} from '@technician/source/file';

const technician = new Technician([
    {source: new FileConfigSource('.testconfig'), ignoreIf: () => process.env.NODE_ENV === 'production'},
    {source: new FileConfigSource('.prodconfig')},
    {source: new FileConfigSource('.overrideEverything'), priority: 1}
]);
const value = await technician.read('client_secret');
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

Technician provides two middleware sources out of the box, `Aliaser` and `Interpreter`.

### Aliases

Aliases can be used to make an individual config value easier to access, or to create a single key that is shared between multiple sources.

Aliases can be built directly as an `Aliaser` instance or using the `Alias` semantic API:
```ts
import {Aliaser} from 'technician';
const aliasedSource = new Aliaser(myConfigSource, {alias: 'my-default-key'});
```
```ts
import {Alias} from 'technician';
const aliasedSource = Alias.set('alias').to('my-default-key').on(myConfigSource);
// ...or
const lotsOfAliases = Alias.set({lots: 'of', aliases: 'here'}).on(myConfigSource);
```

Aliases can be used in combination with the `priority` option to set up config override behavior.
```ts
import {Alias, Technician} from 'technician';
import {EnvConfigSource} from '@technician/source/env';
import {FileConfigSource} from '@technician/source/file';

const technician = new Technician([
    {source: Alias.set('client-secret').to('CLIENT_SECRET').on(new EnvConfigSource()), priority: 1, cacheFor: -1},
    Alias.set('client-secret').to('client_secret').on(new FileConfigSource('.myapprc'))
]);
```

With the setup above, Technician would return values from `.myapprc` unless the environment variable `CLIENT_SECRET` was set, at which point it would begin returning that value without caching it.

By default, sources have a `priority` of `0` and cache forever. To disable caching, set a negative `cacheFor`.

`Aliaser` allows access via both the alias and the original key by default. This passthrough behavior is configurable by passing `'full'`, `'partial'`, or `'none'` to the constructor or ending an `Alias` call with `withPassthrough()`, `withPartialPassthrough()`, or `withoutPassthrough()`.

Partial passthrough allows access only to keys which are unaliased. No passthrough prevents data from being returned by anything other than explicitly set aliases.

### Interpreter

Interpreters allow raw values to be deserialized, validated, or otherwise transformed. This work is done prior to caching, meaning expensive work will not be unnecessarily repeated.

Interpreters can be built directly or via the `Interpret` API:
```ts
import {Interpreter} from 'technician';
const interpretedSource = new Interpreter(someBufferSource, configItem => configItem.value?.toString('utf8'));
```
```ts
import {Interpreter} from 'technician';
const interpretedSource = Interpret.buffer.asString(someBufferSource, 'utf8');
```

The type returned by the Interpreter function is seen as the "true" type of the source by Technician, and will adjust the typing of reads appropriately. If an interpreter returns undefined in a particular case, Technician ignores this value as though it were nonexistant in the root source.

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

Technician is built to be modular and extensible. Feel free to publish your own config sources and/or interpreters!

## License

[Apache-2.0](https://github.com/carriejv/technician/blob/master/LICENSE)