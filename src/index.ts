import { RULE_NAME, noIndexedAccessPropRule } from "./rules/no-indexed-access-prop.js";

export const PACKAGE_NAME = "eslint-plugin-no-indexed-access-prop";

export const rules = {
  [RULE_NAME]: noIndexedAccessPropRule,
} as const;

const plugin = {
  meta: {
    name: PACKAGE_NAME,
  },
  rules,
};

export { RULE_NAME, noIndexedAccessPropRule };
export default plugin;