# eslint-plugin-no-indexed-access-prop

ESLint- and Oxlint-compatible rule for forbidding TypeScript indexed access types such as `User['id']` or `T[K]`.

GPT-5.4, for reasons known only to its silicon soul, tends to get a little overexcited about indexed property access. This rule exists to curb that enthusiasm just enough to keep your types readable and your contracts honest.

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

## Release automation helpers

This repository includes release scripts for bumping versions, tagging the current version, and creating a GitHub Release for the current version tag.

Version bump helpers use `npm version`, so they update `package.json` and `package-lock.json`, create a release commit, and create the matching git tag automatically.

```bash
npm run release:bump:patch
npm run release:bump:minor
npm run release:bump:major
```

Non-destructive previews are also available:

```bash
npm run release:bump:patch:dry-run
npm run release:bump:minor:dry-run
npm run release:bump:major:dry-run
```

If you already have the desired version committed and only need the matching tag, use:

```bash
npm run release:tag-current
```

That command is idempotent: if `v<current package.json version>` already exists, it does nothing. It also refuses to create a new tag from a dirty working tree, so you do not accidentally tag the wrong commit.

To create a GitHub Release for the current version tag with generated notes, use:

```bash
npm run release:github-current
```

A dry-run preview is also available:

```bash
npm run release:github-current:dry-run
```

That command is also idempotent: if a GitHub Release for `v<current package.json version>` already exists, it does nothing. It requires the matching tag to already exist on `origin`.

When you're ready to publish the release commit and tags, push them explicitly, then create the GitHub Release:

```bash
git push
git push --tags
npm run release:github-current
```