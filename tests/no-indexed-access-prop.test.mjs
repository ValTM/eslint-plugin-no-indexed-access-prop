import { after, describe, it } from "node:test";

import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";

import { RULE_NAME, noIndexedAccessPropRule } from "../dist/rules/no-indexed-access-prop.js";

RuleTester.afterAll = after;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

ruleTester.run(RULE_NAME, noIndexedAccessPropRule, {
  valid: [
    "type UserId = string;",
    {
      code: "type Value<T, K extends keyof T> = T[K];",
      options: [{ mode: "literal-only" }],
    },
    {
      code: "type Value<T, K extends keyof T> = T[K];",
      options: [{ mode: "all", allowGenericIndex: true }],
    },
    {
      code: "type UserId = User['id'];",
      options: [{ mode: "configured-only", properties: ["name"] }],
    },
    {
      code: "type UserKey = User['id' | 'name'];",
      options: [{ mode: "literal-only", allowUnionLiteralIndex: true }],
    },
    {
      code: "type UserKey = User['id' | 'name'];",
      options: [{ mode: "configured-only", properties: ["id", "name"], allowUnionLiteralIndex: true }],
    },
  ],
  invalid: [
    {
      code: "type UserId = User['id'];",
      errors: [{ messageId: "unexpectedIndexedAccess", suggestions: null }],
      output: null,
    },
    {
      code: "type Value<T, K extends keyof T> = T[K];",
      errors: [{ messageId: "unexpectedIndexedAccess", suggestions: null }],
      output: null,
    },
    {
      code: "type UserId = { id: string }['id'];",
      errors: [
        {
          messageId: "unexpectedIndexedAccess",
          suggestions: [
            {
              messageId: "replaceWithInlinePropertyType",
              output: "type UserId = string;",
            },
          ],
        },
      ],
      output: null,
    },
    {
      code: "type UserValue = { id: string; active: boolean }['id' | 'active'];",
      errors: [
        {
          messageId: "unexpectedIndexedAccess",
          suggestions: [
            {
              messageId: "replaceWithInlinePropertyTypeUnion",
              output: "type UserValue = (string) | (boolean);",
            },
          ],
        },
      ],
      output: null,
    },
    {
      code: "type UserId = User['id'];",
      options: [{ mode: "all", allowGenericIndex: true }],
      errors: [{ messageId: "unexpectedIndexedAccess", suggestions: null }],
      output: null,
    },
    {
      code: "type UserId = User['id'];",
      options: [{ mode: "literal-only" }],
      errors: [{ messageId: "unexpectedIndexedAccess", suggestions: null }],
      output: null,
    },
    {
      code: "type UserKey = User['id' | 'name'];",
      options: [{ mode: "literal-only" }],
      errors: [{ messageId: "unexpectedIndexedAccess", suggestions: null }],
      output: null,
    },
    {
      code: "type UserId = User['id'];",
      options: [{ mode: "configured-only", properties: ["id"] }],
      errors: [
        {
          messageId: "unexpectedPropertyIndexedAccess",
          data: { properties: "'id'" },
          suggestions: null,
        },
      ],
      output: null,
    },
    {
      code: "type UserKey = User['id' | 'name'];",
      options: [{ mode: "configured-only", properties: ["id", "name"] }],
      errors: [
        {
          messageId: "unexpectedPropertyIndexedAccess",
          data: { properties: "'id', 'name'" },
          suggestions: null,
        },
      ],
      output: null,
    },
    {
      code: "type UserId = { id: string }['id'];",
      options: [{ mode: "configured-only", properties: ["id"] }],
      errors: [
        {
          messageId: "unexpectedPropertyIndexedAccess",
          data: { properties: "'id'" },
          suggestions: [
            {
              messageId: "replaceWithInlinePropertyType",
              output: "type UserId = string;",
            },
          ],
        },
      ],
      output: null,
    },
  ],
});