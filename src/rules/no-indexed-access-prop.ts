import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "no-indexed-access-prop";

export type NoIndexedAccessPropOptions =
  | {
      readonly mode?: "all";
      readonly allowGenericIndex?: boolean;
      readonly allowUnionLiteralIndex?: boolean;
    }
  | {
      readonly mode: "literal-only";
      readonly allowUnionLiteralIndex?: boolean;
    }
  | {
      readonly mode: "configured-only";
      readonly properties: readonly string[];
      readonly allowUnionLiteralIndex?: boolean;
    };

type Options = [NoIndexedAccessPropOptions];
type MessageIds =
  | "replaceWithInlinePropertyType"
  | "replaceWithInlinePropertyTypeUnion"
  | "unexpectedIndexedAccess"
  | "unexpectedPropertyIndexedAccess";

type LiteralIndexKind = "single-literal" | "union-literal";

interface LiteralIndexAccess {
  readonly kind: LiteralIndexKind;
  readonly propertyNames: readonly string[];
}

const createRule = ESLintUtils.RuleCreator.withoutDocs;

function getMode(options: NoIndexedAccessPropOptions): NoIndexedAccessPropOptions["mode"] | "all" {
  return options.mode ?? "all";
}

function getConfiguredProperties(options: NoIndexedAccessPropOptions): ReadonlySet<string> | null {
  if (options.mode !== "configured-only") {
    return null;
  }

  return new Set(options.properties);
}

function getStringLiteralPropertyName(indexType: TSESTree.TypeNode): string | null {
  if (indexType.type !== "TSLiteralType") {
    return null;
  }

  const literal = indexType.literal;

  if (literal.type === "Literal" && typeof literal.value === "string") {
    return literal.value;
  }

  return null;
}

function getLiteralIndexAccess(indexType: TSESTree.TypeNode): LiteralIndexAccess | null {
  const propertyName = getStringLiteralPropertyName(indexType);

  if (propertyName != null) {
    return {
      kind: "single-literal",
      propertyNames: [propertyName],
    };
  }

  if (indexType.type !== "TSUnionType") {
    return null;
  }

  const propertyNames: string[] = [];

  for (const member of indexType.types) {
    const memberPropertyName = getStringLiteralPropertyName(member);

    if (memberPropertyName == null) {
      return null;
    }

    propertyNames.push(memberPropertyName);
  }

  return {
    kind: "union-literal",
    propertyNames: [...new Set(propertyNames)],
  };
}

function getPropertySignatureName(member: TSESTree.TSPropertySignature): string | null {
  if (member.computed || member.optional) {
    return null;
  }

  if (member.key.type === "Identifier") {
    return member.key.name;
  }

  if (member.key.type === "Literal" && typeof member.key.value === "string") {
    return member.key.value;
  }

  return null;
}

function getInlinePropertyTypeText(
  objectType: TSESTree.TSTypeLiteral,
  propertyName: string,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string | null {
  for (const member of objectType.members) {
    if (member.type !== "TSPropertySignature") {
      continue;
    }

    if (getPropertySignatureName(member) !== propertyName) {
      continue;
    }

    if (member.typeAnnotation == null) {
      return null;
    }

    return sourceCode.getText(member.typeAnnotation.typeAnnotation);
  }

  return null;
}

function getSuggestion(
  node: TSESTree.TSIndexedAccessType,
  sourceCode: Readonly<TSESLint.SourceCode>,
): { messageId: MessageIds; replacementText: string } | null {
  const objectType = node.objectType;
  const literalIndexAccess = getLiteralIndexAccess(node.indexType);

  if (objectType.type !== "TSTypeLiteral" || literalIndexAccess == null) {
    return null;
  }

  const propertyTypeTexts: string[] = [];

  for (const propertyName of literalIndexAccess.propertyNames) {
    const propertyTypeText = getInlinePropertyTypeText(objectType, propertyName, sourceCode);

    if (propertyTypeText == null) {
      return null;
    }

    propertyTypeTexts.push(propertyTypeText);
  }

  if (propertyTypeTexts.length === 1) {
    return {
      messageId: "replaceWithInlinePropertyType",
      replacementText: propertyTypeTexts[0],
    };
  }

  return {
    messageId: "replaceWithInlinePropertyTypeUnion",
    replacementText: propertyTypeTexts.map((propertyTypeText) => `(${propertyTypeText})`).join(" | "),
  };
}

function getReportDescriptor(
  options: NoIndexedAccessPropOptions,
  configuredProperties: ReadonlySet<string> | null,
  literalIndexAccess: LiteralIndexAccess | null,
): { messageId: MessageIds; data?: { properties: string } } | null {
  if (literalIndexAccess?.kind === "union-literal" && options.allowUnionLiteralIndex) {
    return null;
  }

  switch (getMode(options)) {
    case "literal-only":
      if (literalIndexAccess == null) {
        return null;
      }

      return {
        messageId: "unexpectedIndexedAccess",
      };
    case "configured-only": {
      if (literalIndexAccess == null || configuredProperties == null) {
        return null;
      }

      const matchedProperties = literalIndexAccess.propertyNames.filter((property) =>
        configuredProperties.has(property),
      );

      if (matchedProperties.length === 0) {
        return null;
      }

      return {
        messageId: "unexpectedPropertyIndexedAccess",
        data: {
          properties: matchedProperties.map((property) => `'${property}'`).join(", "),
        },
      };
    }
    case "all":
      if (literalIndexAccess == null && "allowGenericIndex" in options && options.allowGenericIndex) {
        return null;
      }

      return {
        messageId: "unexpectedIndexedAccess",
      };
  }
  return null;
}


export const noIndexedAccessPropRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description:
        "Disallow TypeScript indexed access types using an explicit enforcement mode and optional exemptions.",
    },
    schema: [
      {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string", enum: ["all"] },
              allowGenericIndex: { type: "boolean" },
              allowUnionLiteralIndex: { type: "boolean" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string", enum: ["literal-only"] },
              allowUnionLiteralIndex: { type: "boolean" },
            },
            required: ["mode"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string", enum: ["configured-only"] },
              properties: {
                type: "array",
                items: {
                  type: "string",
                },
                minItems: 1,
                uniqueItems: true,
              },
              allowUnionLiteralIndex: { type: "boolean" },
            },
            required: ["mode", "properties"],
          },
        ],
      },
    ],
    messages: {
      replaceWithInlinePropertyType: "Replace this indexed access with the inline property type.",
      replaceWithInlinePropertyTypeUnion:
        "Replace this indexed access with the corresponding inline property type union.",
      unexpectedIndexedAccess:
        "Do not use TypeScript indexed access types. Prefer a named alias or a direct property declaration.",
      unexpectedPropertyIndexedAccess:
        "Do not use TypeScript indexed access types for blocked properties: {{ properties }}.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const configuredProperties = getConfiguredProperties(options);

    return {
      TSIndexedAccessType(node: TSESTree.TSIndexedAccessType) {
        const literalIndexAccess = getLiteralIndexAccess(node.indexType);
        const suggestion = getSuggestion(node, context.sourceCode);
        const reportDescriptor = getReportDescriptor(
          options,
          configuredProperties,
          literalIndexAccess,
        );

        if (reportDescriptor == null) {
          return;
        }

        context.report({
          node,
          ...reportDescriptor,
          suggest:
            suggestion == null
              ? undefined
              : [
                  {
                    messageId: suggestion.messageId,
                    fix(fixer) {
                      return fixer.replaceText(node, suggestion.replacementText);
                    },
                  },
                ],
        });
      },
    };
  },
});