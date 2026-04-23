/**
 * Cross-Database Helper
 *
 * Provides application-level hydration for joining User data with
 * Medical records. Although both now live in the same PostgreSQL
 * database, this helper avoids Sequelize cross-model `include` JOINs
 * (which would require formal foreign key associations between PII
 * and Medical models). Instead it:
 *
 *   1. Query medical models to get records.
 *   2. Collect unique userId UUIDs.
 *   3. Batch-fetch the matching User rows from the PII models.
 *   4. Merge them in memory under a chosen alias.
 */

const { User } = require('../models');

/**
 * Hydrate an array of Sequelize model instances with User data.
 *
 * @param {Array}  records       - Array of Sequelize instances (medical models)
 * @param {string} userIdField   - The field name containing the user UUID (e.g. 'userId', 'grantedBy')
 * @param {string} alias         - Key name for the attached user object in the output (e.g. 'user', 'reviewer')
 * @param {Array}  attributes    - User attributes to fetch (e.g. ['id', 'firstName', 'lastName'])
 * @returns {Array} Plain objects with the user data attached under `alias`
 */
async function hydrateWithUsers(records, userIdField, alias, attributes = ['id', 'firstName', 'lastName', 'email']) {
  if (!records || records.length === 0) return [];

  // Collect unique non-null user IDs
  const ids = [...new Set(
    records
      .map(r => (r.toJSON ? r.toJSON() : r)[userIdField])
      .filter(Boolean)
  )];

  // Batch-fetch users
  let userMap = {};
  if (ids.length > 0) {
    const { Op } = require('sequelize');
    const users = await User.findAll({
      where: { id: { [Op.in]: ids } },
      attributes,
    });
    userMap = Object.fromEntries(users.map(u => [u.id, u.toJSON()]));
  }

  // Merge
  return records.map(r => {
    const plain = r.toJSON ? r.toJSON() : { ...r };
    plain[alias] = userMap[plain[userIdField]] || null;
    return plain;
  });
}

module.exports = { hydrateWithUsers };
