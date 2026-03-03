/**
 * Cross-Database Helper
 *
 * Since PII data (User) and Medical data (Medication, Prescription, etc.)
 * live in separate SQLite databases, Sequelize `include` / JOINs cannot
 * cross the boundary. This helper provides application-level hydration:
 *
 *   1. Query medical DB to get records.
 *   2. Collect unique userId UUIDs.
 *   3. Batch-fetch the matching User rows from the PII DB.
 *   4. Merge them in memory under a chosen alias.
 */

const { User } = require('../models');

/**
 * Hydrate an array of Sequelize model instances with User data.
 *
 * @param {Array}  records       - Array of Sequelize instances (medical DB)
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

  // Batch-fetch users from the PII database
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
