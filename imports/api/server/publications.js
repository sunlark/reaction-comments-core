/* eslint-disable prefer-arrow-callback */

import { Meteor } from "meteor/meteor";
// import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";
import Comments from "../collections.js";

// todo order by newest first. newest may be somewhere nested

/**
 * comments for given object
 * @params {String} sourceId - id of object which has comments (Product or
 * Post etc).
 */
Meteor.publish("Comments", function (sourceId) {
  check(sourceId, String);
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }
  // todo get by filter - unread, new, accepted, rejected
  // todo pagination?
  return /*ReactionCore.Collections.*/Comments.find({
    "sourceId": sourceId,
    "workflow.status": "accepted"
  });
});

/**
 * all comments
 */

Meteor.publish("AllComments", function () {
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }
  // todo get by filter - unread, new, accepted, rejected
  // todo pagination?
  // todo all/ by source only - in one method?
  // global admin can get all accounts
  if (Roles.userIsInRole(this.userId, ["admin", "owner"], shopId)) {
    return /*ReactionCore.Collections.*/Comments.find({ shopId: shopId });
  }
  return this.ready();
});
