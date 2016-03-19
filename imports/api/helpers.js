// todo names of args & func
/**
 * @todo
 * @param ancestorsIds
 * @param idToRemove
 * @returns {Array.<T>|*}
 */
export const removeFromAncestors = (ancestorsIds, idToRemove) => {
  return ancestorsIds.filter(function (pair) {
    return pair !== idToRemove;
  });
};

/**
 * @todo
 * @param ancestorsIds
 */
export const notifyAboutReply = (ancestorsIds) => {
  // todo filter with notifyReplyOnly
  // todo find emails
  // todo
};