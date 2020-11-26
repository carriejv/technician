# Technician

[![npm version](https://img.shields.io/npm/v/technician.svg)](https://www.npmjs.com/package/technician) [![npm downloads](https://img.shields.io/npm/dt/technician)](https://www.npmjs.com/package/technician) [![npm license](https://img.shields.io/npm/l/technician.svg)](https://www.npmjs.com/package/technician)


[![dependencies](https://img.shields.io/david/carriejv/technician.svg)](https://david-dm.org/carriejv/technician) [![Build Status](https://img.shields.io/travis/carriejv/technician.svg)](https://travis-ci.org/carriejv/technician) [![GitKraken](https://img.shields.io/badge/<3-GitKraken-green.svg)](https://www.gitkraken.com/invite/om4Du5zG)

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
import {Technician, DefaultInterpreters} from 'technician';
import {EnvConfigSource} from '@technician/env-config-source';

// Create an instance of Technician and a config source.
// Your interpreter function determines the typing of your results.
const technician = new Technician(DefaultInterpreters.asText('utf8'));
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
import {Technician, DefaultInterpreters} from 'technician';
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
import {Technician, DefaultInterpreters} from 'technician';
import {EnvConfigSource} from '@technician/env-config-source';
import {FSConfigSource} from '@technician/fs-config-source';

const technician = new Technician(DefaultInterperters.asBuffer(), {
    // Higher priority sources are checked, even if a value is cached.
    cacheRespectsPriority: true,
    // Set a default cache length. By default, the cache lasts forever.
    defaultCacheLength: 1000 * 60 * 60;
});
const envSource = new EnvConfigSource();
const filesystemSource = new FSConfigSource('~/.ssh/*');

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

technician.alias('rsa_pubkey', ['RSA_PUB_KEY', 'id_rsa.pub']);

// Now, this will return the filesystem value and cache it forever --
// unless RSA_PUB_KEY is set, overriding it and disabling caching.
const value = await technician.read('rsa_pubkey');
```

## Config Sources

Config sources are the heart of Technician. Technician is built to be fully modular, and provides no functionality out of the box unless at least one config source is installed and configured.

Technician has two official sources, \[Link to FS and Env\]. Technician instances can also be used as ConfigSources for other instances of Technician in complex setups.

However, Technician is designed to be easily extensible -- build your own source by implementing the `ConfigSource` interface, extend an existing config source, or use community-made sources!

## Interpreters

By default, all Technician returns any key with valid data as a Buffer. Keys that do not exist are returned as undefined. The return type of your interpreter determines the return type of your `read()` and related functions. Each Technician instance has only one interpreter; you can choose between a single interpreter with complex typing, or multiple Technician instances with narrowly defined typing.

Technician provides a package of `DefaultInterpreters`, which contains `asBuffer()`, `asText('encoding')`, and `asJSON('encoding')`.

However, interpreters can be used to perform any number of complex tasks, including deserialization, decryption of secrets, etc. Interpreters can also be used to validate data; an interpreter that returns `undefined` in a specific case will cause the underlying data source to be ignored.

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

## Utility Functions

### ClearCache

`technician.clearCache()` will wipe the entire cache. `technician.clearCache(key)` can also be used to delete only a specific entry.

### List

`technician.list()` returns a list of all available keys, including aliases.

### Describe

`technician.describe(key)` can be used to return all information on a previously-read key for debugging, including its cache state and raw pre-interpretation buffer.

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