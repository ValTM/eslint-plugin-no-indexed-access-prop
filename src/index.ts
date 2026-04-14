import { RULE_NAME, noIndexedAccessPropRule } from "./rules/no-indexed-access-prop.js";

export const PACKAGE_NAME = "eslint-plugin-no-indexed-access-prop";
export const PACKAGE_VERSION = "0.1.0";

export const rules = {
  [RULE_NAME]: noIndexedAccessPropRule,
} as const;

const plugin = {
  meta: {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  },
  rules,
};

export { RULE_NAME, noIndexedAccessPropRule };
export default plugin;