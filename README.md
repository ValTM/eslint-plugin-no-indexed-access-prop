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

### Trusted publishing with GitHub Actions

This repository includes a publish workflow intended for npm trusted publishing via OIDC, so no long-lived npm token is required in CI.

Manual npm setup is still required once per package:

1. Open the package settings on npmjs.com
2. Open the `Trusted Publisher` section
3. Choose `GitHub Actions`
4. Configure:
   - Organization or user: `ValTM`
   - Repository: `eslint-plugin-no-indexed-access-prop`
   - Workflow filename: `publish.yml`

Trusted publishing references:

- https://docs.npmjs.com/trusted-publishers
- https://docs.npmjs.com/generating-provenance-statements
- https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
