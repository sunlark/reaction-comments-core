/**
 * @summary subtracts array of ids from initial ids array
 * @param {Array} initialIds
 * @param {Array} idsToRemove
 * @returns {Array} ids without deleted
 */
export const excludeIds = (initialIds, idsToRemove) => {
  return initialIds.filter(function (pair) {
    return !idsToRemove.some(id => id === pair);
  });
};

/**
 * mergeUniq
 * @summary Merge two arrays keeping only unique values
 * @param a1
 * @param a2
 * @see: http://stackoverflow.com/a/32108976
 * @return {*}
 */
export const mergeUniq = (a1, a2) => {
  const len1 = a1.length;
  for (let x = 0; x < a2.length; x++) {
    let found = false;
    for (let y = 0; y < len1; y++) {
      if (a2[x] === a1[y]) {
        found = true;
        break;
      }
    }
    if (!found) {
      a1.push(a2.splice(x--, 1)[0]);
    }
  }
  return a1;
};
