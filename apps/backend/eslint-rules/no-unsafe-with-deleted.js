/**
 * ESLint rule: no-unsafe-with-deleted
 *
 * Prevents direct use of `withDeleted: true` in TypeORM queries outside of
 * files that are explicitly allowed (admin services, soft-delete utility).
 *
 * Installation:
 *   1. Place this file in apps/backend/eslint-rules/
 *   2. Add to .eslintrc: { "rules": { "local/no-unsafe-with-deleted": "warn" } }
 *   3. Configure rulesdir: --rulesdir apps/backend/eslint-rules
 *
 * Allowed patterns:
 *   - Files matching *admin* or *soft-delete* in their path
 *   - SafeRepository's findIncludingDeleted/findOneIncludingDeleted
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow withDeleted: true outside admin context',
      category: 'Best Practices',
    },
    messages: {
      unsafeWithDeleted:
        'Avoid using `withDeleted: true` directly. Use SafeRepository.findIncludingDeleted() for admin-context queries, or move this logic to an admin service.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Allow admin services and soft-delete utility
    const allowedPatterns = [
      /admin/i,
      /soft-delete/i,
      /safe-repository/i,
      /\.spec\./i,
      /\.test\./i,
    ];

    if (allowedPatterns.some(pattern => pattern.test(filename))) {
      return {};
    }

    return {
      Property(node) {
        if (
          node.key &&
          node.key.name === 'withDeleted' &&
          node.value &&
          node.value.value === true
        ) {
          context.report({
            node,
            messageId: 'unsafeWithDeleted',
          });
        }
      },
    };
  },
};
