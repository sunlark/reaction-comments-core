/* eslint-disable prefer-arrow-callback */

import { Meteor } from "meteor/meteor";
import { ReactionCore } from "meteor/reactioncommerce:core";
import Comments from "../collections.js";

/**
 * comments for given object
 * @params {String} sourceId - id of object which has comments (Product or
 * Post etc).
 */
Meteor.publish("Comments", function (sourceId) {
  check(sourceId, String);
  const shopId = ReactionCore.getShopId();
  if (! shopId) {
    return this.ready();
  }

  let selector = { "sourceId": sourceId };
  let fields = {};

  // admin/manager can see all comments, simple user only accepted
  if (! Roles.userIsInRole(this.userId, ["owner", "admin", "manageComments"],
      shopId)) {
    selector["workflow.status"] = "accepted";
    // exclude private data from publishing to non-admins
    fields = {userId: 0, email: 0, notifyReply: 0};
  }
  return Comments.find(selector, {fields: fields, sort: {createdAt: -1}});
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
  if (Roles.userIsInRole(this.userId, ["admin", "owner", "manageComments"],
      shopId)) {
    return Comments.find({ shopId: shopId }, {sort: {createdAt: -1}});
  }
  return this.ready();
});
