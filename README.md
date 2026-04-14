# eslint-plugin-no-indexed-access-prop

ESLint- and Oxlint-compatible rule for forbidding TypeScript indexed access types such as `User['id']` or `T[K]`.

The package exports one rule:

- `no-indexed-access-prop`

## What it flags

Examples reported by default:

```ts
type UserId = User['id'];
type Value<T, K extends keyof T> = T[K];
type UserValue = User['id' | 'name'];
```

The rule can also be configured more narrowly:

- block all indexed access types
- block only literal property access such as `T['id']`
- block only selected literal property names such as `['id', 'name']`

## Suggestions

The rule provides safe editor suggestions when the replacement can be derived from local syntax alone.

Example:

```ts
type UserId = { id: string }['id'];
```

Suggested replacement:

```ts
type UserId = string;
```

Suggestions are intentionally not emitted for cases that would require cross-file or type-aware resolution, such as:

```ts
type UserId = User['id'];
type Value<T, K extends keyof T> = T[K];
```

## Installation

### ESLint

```bash
npm install --save-dev eslint eslint-plugin-no-indexed-access-prop
```

### Oxlint

```bash
npm install --save-dev oxlint eslint-plugin-no-indexed-access-prop
```

## Usage

### ESLint flat config

```js
import noIndexedAccessProp from 'eslint-plugin-no-indexed-access-prop';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      noIndexedAccessProp,
    },
    rules: {
      'noIndexedAccessProp/no-indexed-access-prop': 'error',
    },
  },
];
```

### Oxlint

Using an explicit alias keeps the rule name stable and short:

```json
{
  "jsPlugins": [
    {
      "name": "no-indexed-access-prop",
      "specifier": "eslint-plugin-no-indexed-access-prop"
    }
  ],
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": "error"
  }
}
```

## Options

The rule accepts a single options object.

### `mode`

Controls which indexed access forms are reported.

- `"all"` (default): report every indexed access type
- `"literal-only"`: report only string-literal access such as `T['id']` or `T['id' | 'name']`
- `"configured-only"`: report only configured literal property names

### `allowGenericIndex`

Only meaningful in `mode: "all"`.

When `true`, generic or non-literal indexed access such as `T[K]` is allowed, while literal property access is still reported.

### `allowUnionLiteralIndex`

When `true`, union-literal access such as `T['id' | 'name']` is allowed.

This exemption applies in every mode.

### `properties`

Required when `mode: "configured-only"`.

Specifies the blocked literal property names.

## Configuration examples

### Block everything

```json
{
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": "error"
  }
}
```

### Block only literal property access

```json
{
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": [
      "error",
      { "mode": "literal-only" }
    ]
  }
}
```

### Block only selected properties

```json
{
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": [
      "error",
      { "mode": "configured-only", "properties": ["id", "name"] }
    ]
  }
}
```

### Allow `T[K]` but still block literal property access

```json
{
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": [
      "error",
      { "mode": "all", "allowGenericIndex": true }
    ]
  }
}
```

### Allow union-literal access

```json
{
  "rules": {
    "no-indexed-access-prop/no-indexed-access-prop": [
      "error",
      { "mode": "literal-only", "allowUnionLiteralIndex": true }
    ]
  }
}
```

## Option migration

Older examples may show this shape:

```json
{ "properties": ["id"] }
```

That shape has been replaced. Use:

```json
{ "mode": "configured-only", "properties": ["id"] }
```

## Development

```bash
npm install
npm test
```

## Publishing notes

Before publishing to npm, verify at least the following:

1. `package.json` has the final package name and version
2. any desired registry metadata such as `repository`, `bugs`, `homepage`, and `license` is set
3. `npm test` passes
4. `npm pack --dry-run` contains only the intended artifacts

### First publish from a personal npm account

npm trusted publishing cannot be the first publish for a brand new package. The package must already exist on npm before a trusted publisher can be attached to it.

This repository includes scripts that isolate the bootstrap publish from your global npm login by using a repo-local user config file, `.npmrc.publish`, via npm's `--userconfig` support.

Bootstrap flow:

```bash
npm run publish:login
npm run publish:whoami
npm test
npm run publish:bootstrap:dry-run
npm run publish:bootstrap
```

What this does:

- `publish:login` logs into the public npm registry using `./.npmrc.publish` instead of your global `~/.npmrc`
- `publish:whoami` confirms the active npm identity from that local config
- `publish:bootstrap` performs the one-time initial publish from your personal account

The `.npmrc.publish` file is gitignored and can be deleted after the first publish if you do not want to keep the local credentials around.

### Trusted publishing with GitHub Actions

After the first publish succeeds, configure npm trusted publishing for future releases:

1. Open the package settings on npmjs.com
2. Open the `Trusted Publisher` section
3. Choose `GitHub Actions`
4. Configure:
   - Organization or user: `ValTM`
   - Repository: `eslint-plugin-no-indexed-access-prop`
   - Workflow filename: `publish.yml`

After that, future releases can be published from GitHub Actions without a long-lived npm token.

Trusted publishing references:

- https://docs.npmjs.com/trusted-publishers
- https://docs.npmjs.com/generating-provenance-statements
- https://docs.npmjs.com/cli/v11/commands/npm-trust
- https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
