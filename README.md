# Technician

[![npm version](https://img.shields.io/npm/v/technician.svg)](https://www.npmjs.com/package/technician) [![npm downloads](https://img.shields.io/npm/dt/technician)](https://www.npmjs.com/package/technician) [![npm license](https://img.shields.io/npm/l/technician.svg)](https://www.npmjs.com/package/technician)

[![dependencies](https://img.shields.io/david/carriejv/technician.svg)](https://david-dm.org/carriejv/technician) [![Build Status](https://github.com/carriejv/technician/workflows/ci-build/badge.svg?branch=master)](https://github.com/carriejv/technician/actions?query=workflow%3Aci-build) [![GitKraken](https://img.shields.io/badge/<3-GitKraken-green.svg)](https://www.gitkraken.com/invite/om4Du5zG)

Technician provides a central service to manage everything related to your application's config.

Technician is built to allow for robust and complex config management. With Technician, you can:

* Combine config from a variety of sources like environment variables and config files.
* Automatically cache the results of all your config reads.
* Override config from one source (ie, a file) with another (ie, an environment variable) -- with different cache policies for each. Great for debugging in production!
* Create reusable parsers and validators for complex config.
* Define TypeScript types for your config.

To view full documentation, download this package and run `npm run docs`.

## Installation

`npm i technician`

`npm i @technician/your-source-here`

Technician is compatible with Node 10 LTS and up. Some sources may have different compatability requirements.

## Usage Examples

### The Basics
```ts
import {Technician, Interpret} from 'technician';
import {EnvConfigSource} from '@technician/env-config-source';

// Create an instance of Technician and a config source.
// Your interpreter function determines the typing of your results.
const technician = new Technician(Interpret.asText('utf8'));
const envSource = new EnvConfigSource();

// Add the source to Technician. Now, all of its values can be accessed.
technician.addSource(envSource);
const value = await technician.read('MY_ENV_VAR');

// TypeScript will automatically infer value's type!
value.substring(0, 1); 

// Require a value, throwing a ConfigNotFoundError if it does not exist.
const importantValue = await technician.require('MY_IMPORTANT_VAR');

// ... or just read everything at once.
const everything = await technician.readAll();
// {MY_ENV_VAR: 'something', MY_IMPORTANT_VAR: 'something-else', ...}
```

### Combine Multiple Sources Into One
```ts
import {Technician, Interpret} from 'technician';
import {EnvConfigSource} from '@technician/env-config-source';
import {FSConfigSource} from '@technician/fs-config-source';

// By default, all values are returned as Buffers if no Interpreter is set.
const technician = new Technician();
const envSource = new EnvConfigSource();
const filesystemSource = new FSConfigSource('~/.ssh/*');

// Add the sources.
technician.addSource([envSource, filesystemSource]);

// Create an alias to link related config.
// The default keys used are defined by each config source.
technician.alias('rsa_pubkey', ['RSA_PUB_KEY', 'id_rsa.pub']);

// Get the value from either source.
const value = await technician.read('rsa_pubkey');
// ... or just from one, if you want.
const valueFromFS = await technician.read('id_rsa.pub');
```

### Override Config On The Fly
```ts
import {Technician, Interpret} from 'technician';
import {EnvConfigSource} from '@technician/env-config-source';
import {FSConfigSource} from '@technician/fs-config-source';

const technician = new Technician(Interpret.asBuffer(), {
    // Higher priority sources are checked, even if a value is cached.
    cacheRespectsPriority: true,
    // Set a default cache length. By default, the cache lasts forever.
    defaultCacheLength: 1000 * 60 * 60;
});
const envSource = new EnvConfigSource();
const filesystemSource = new FSConfigSource('/etc/ssl/certs');

// Sources with higher priority will be used over those with lower priority.
// By default, sources have a priority of 0 and cache forever.
technician.addSource([
    {
        source: envSource,
        priority: 1,
        cacheFor: -1 // Disable caching for envSource
    },
    filesystemSource // Just use the default config for FS.
]);

// Create an alias that links both config sources to a single key.
technician.alias('ssl_cert', ['SSL_CERT', 'mysite.crt']);

// This alias will return the filesystem value and cache it for an hour --
// unless SSL_CERT is set, which overrides it and disables caching.
const value = await technician.read('ssl_cert');
```

## Config Sources

Config sources are the heart of Technician. Technician is built to be fully modular, and provides no functionality out of the box unless at least one config source is installed and configured.

Official Technician config sources can be found in the [@technician](https://www.npmjs.com/org/technician) org on NPM. Common starter sources are listed below:

* `EnvConfigSource` - Reads environment variables into Technician.

    [![EnvConfigSource](https://img.shields.io/npm/v/@technician/env-config-source?label=@technician/env-config-source)](https://www.npmjs.com/package/@technician/env-config-source)

* `FSConfigSource` - Reads directories of config files. Also works with Docker & Kubernetes secrets.

    [![FSConfigSource](https://img.shields.io/npm/v/@technician/fs-config-source?label=@technician/fs-config-source)](https://www.npmjs.com/package/@technician/fs-config-source)

* `JSONConfigSource` - Reads JSON strings or files as a key: value config map. Can also be extended a base config source for any source that reads from an internal JSON map.

    [![JSONConfigSource](https://img.shields.io/npm/v/@technician/json-config-source?label=@technician/json-config-source)](https://www.npmjs.com/package/@technician/json-config-source)


Technician instances can also be used as ConfigSources for other instances of Technician in complex setups.

Technician is designed to be easily extensible -- build your own source by implementing the `ConfigSource` interface, extend an existing config source, or use community-made sources!

## Interpreting Config Data

By default, all Technician returns any key with valid data as a Buffer. Keys that do not exist are returned as undefined. Technician uses `interpreter` functions to parse these Buffers into the type(s) you want to use in your code.

The return type of your interpreter determines the return type of your `read()` and related functions. Each Technician instance has only one interpreter; you can choose between a single interpreter with complex typing, or multiple Technician instances with narrowly defined typing.

### Narrow Typing
```ts
const techStrings = new Technician(Interpret.asText());
techStrings.addSource(someStringSource);
const stringValue = techStrings.read('string-key');
// Typescript knows exactly what this value is.
typeof stringValue === 'string'

const techNumbers = new Technician(Interpret.asNumber());
techNumbers.addSource(someNumbersource);
const numberValue = techNumbers.read('number-key');
// ... and this one, because you read it from a different instance.
typeof numberValue === 'number'
```

### Broad Typing
```ts
const technician = new Technician(async configData: Promise<number | string> => {
    if(configData.key === 'number-key' || configData.source === someNumberSource) {
        return await Interpet.asNumber();
    }
    return await Interpret.asText();
});
technician.addSource(someStringSource);
technician.addSource(someNumberSource);

const stringValue = techStrings.read('string-key');
const numberValue = techNumbers.read('number-key');

// You can read both keys from one Technician instance,
// ... but it's up to you to handle the type variance.
typeof stringValue === 'number' | 'string'
typeof numberValue === 'number' | 'string'
```

If using vanilla Javascript instead of Typescript, a single broad interpreter is almost always the best option provided your downstream code can handle the (potentially) variable data types for config values since type checking is irrelevant.

## Default Interpreters

Technician provides a package of basic interpreters as `Interpret`. This contains

* `asBuffer()`
    - Returns only the raw data Buffer stored internally.
* `asText('utf8' | 'ascii' | ...)`
    - Returns a string value from the internal Buffer using the specified encoding.
* `asBool()`
    - Returns a boolean value. Buffers not containg exactly `0x00` or `0x01` are ignored.
* `asNumber('int32' | 'uint32' | 'float' | ...)`
    - Interprets the Buffer as a numeric value. By default, uses 32-bit signed ints and `os.endianness()`.
    - Assumes the Buffer contains only the number. Reads from offset 0 and ignores trailing data.
    - Number types use the naming conventions of [Node's Buffer type](https://nodejs.org/api/buffer.html#buffer_buf_readbigint64be_offset) `readX` functions, with `X` in all lowercase being the id used by Technician.
    - Number data type may be passed in full with endianness `uint32le` or as only `uint32` to preserve the use of OS-native endianness.
* `asBigInt('bigint64' | 'biguint64' | ...)`
    - asNumber, but bigger.
* `asJSON('utf8' | 'ascii' | ...)`
    - `JSON.parse()`s the config values. Invalid JSON is ignored.
* `asTextOrJSON('utf8' | 'ascii' | ...)`
    - Returns a JSON object or array if the value is valid JSON, else a plaintext string.

Interpreters can also be used to perform whatever tasks are necessary to produce the desired usable config value, including deserialization, decryption of secrets, etc. Interpreters can also be used to validate data; an interpreter that returns `undefined` in a specific case will cause the underlying data source to be ignored.

To implement your own interpreter, use the `Interpreter<T>` typing.

### Example
```ts
const technician = new Technician(async configData => {
    // Interpret based on key
    if(configData.key !== 'THE_ONLY_VALID_KEY') {
        return undefined;
    }
    // ... or source
    if(configData.source !== envSource) {
        return undefined;
    }
    // Finally, do something with the data.
    return new MyCustomType(configData.data);
});

// ...

await technician.read('THE_ONLY_VALID_KEY') instanceof MyCustomType === true
```

Interpreters can also be used to set per-item cache policy. This cache setting will override any default on Technician or the individual source. 
```ts
const technician = new Technician(async configData => {
    return {
        value: new MyCustomType(configData.data),
        cacheFor: 1000
    };
});
```

If you intend to return an object with the properties `cacheFor` and `value` from an interpreter, it must be wrapped in the object above (or it will be read as an attempt to set an actual cache policy).

## Utility Functions

### List

`technician.list()` returns a list of all available keys, including aliases.

### Describe

`technician.describe(key)` can be used to return all information on a previously-read key for debugging, including its cache state and raw pre-interpretation buffer.

### Export

`technician.export()` returns all known config as a `{key: value}` object. Export, unlike `readAll()`, does not read new config -- it provides a method to look at the exact state of Technician based on prior reads.

### ClearCache

`technician.clearCache()` will wipe the entire cache. `technician.clearCache(key)` can also be used to delete only a specific entry.

### Editing Existing Sources

If you want to change the priority or cache policy of a previously set source, you can simply pass it back in to `addSource()` with the new config. You can also `deleteSource()` to remove it completely.

Sources are managed by reference. The exact `ConfigSource` passed in at creation should be passed in to edit or delete it.

## Synchronous Options

`TechnicianSync` is provided by this package for use with synchronous code. `TechnicianSync` can only use synchronous sources (`ConfigSourceSync`) and interpreters (`InterpreterSync`). This is not the recommended approach to using Technician, but is provided for compatability with purely sync code.

`TechnicianSync` cannot share data with `Technician`, or vice-versa. A single config source may, however, implement both `ConfigSource` and `ConfigSourceSync` to provide methods of accessing config data to both variants of Technician.

`TechnicianSync`'s API is otherwise identical to `Technician`.

## Contributions

Contributions and pull requests are always welcome. Please be sure your code passes all existing tests and linting.

Pull requests with full code coverage are strongly encouraged.

Technician is built to be modular and extensible. Feel free to publish your own config sources and/or interpreters!

## License

[Apache-2.0](https://github.com/carriejv/technician/blob/master/LICENSE)