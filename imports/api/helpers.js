/**
 * @summary subtracts array of ids from initial ids array
 * @param {Array} initialIds
 * @param {Array} idsToRemove
 * @returns {Array} ids without deleted
 */
export const excludeIds = (initialIds, idsToRemove) => {
  return initialIds.filter(function (pair) {
    return !idsToRemove.some(id => id === pair)
  });
};