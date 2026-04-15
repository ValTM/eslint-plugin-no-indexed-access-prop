import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);

test('CommonJS consumers can require the plugin package', () => {
  const plugin = require('..');

  assert.ok(plugin);
  assert.ok(plugin.rules);
  assert.ok(plugin.rules['no-indexed-access-prop']);
});

test('CommonJS consumers can require the rule subpath', () => {
  const ruleModule = require('eslint-plugin-no-indexed-access-prop/rules/no-indexed-access-prop');

  assert.equal(ruleModule.RULE_NAME, 'no-indexed-access-prop');
  assert.ok(ruleModule.noIndexedAccessPropRule);
});
