import { Meteor } from "meteor/meteor";
// import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";
import Comments from "../collections.js";

//
// define search filters as a schema so we can validate
// params supplied to the comments publication
//
const filters = new SimpleSchema({
  "author": {
    type: String,
    optional: true
  },
  "status": {
    type: String,
    allowedValues: ["new", "approved"],
    optional: true
  }
});

/**
 * comments for given object
 * @param {String} sourceId - id of object which has comments (Product or
 * Post etc).
 * @returns {Object} return comments cursor
 */
Meteor.publish("Comments", function (sourceId) {
  check(sourceId, String);
  // new SimpleSchema({
  //   sourceId: {type: String}
  // }).validate({ sourceId });
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }

  let selector = { "sourceId": sourceId };
  let fields = {};

  // admin/manager can see all comments, simple user only accepted
  if (! Roles.userIsInRole(this.userId, ["owner", "admin", "manageComments"],
      shopId)) {
    selector["workflow.status"] = "accepted";
    // exclude private data from publishing to non-admins
    fields = {userId: 0, email: 0, notify: 0};
  }
  return Comments.find(selector, {fields: fields, sort: {createdAt: -1}});
});

/**
 * all comments
 * @param {Object} commentsFilter
 * @returns {Object} return comments cursor
 */
Meteor.publish("AllComments", function (commentsFilter) {
  check(commentsFilter, Match.OneOf(undefined, filters));
  
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }
  
  let selector = { shopId: shopId };
  if(commentsFilter) {
    if(commentsFilter.author) {
      selector.author = commentsFilter.author;
    }
    if(commentsFilter.status) {
      selector["workflow.status"] = commentsFilter.status;
    }
  }
  // todo pagination?
  if (Roles.userIsInRole(this.userId, ["admin", "owner", "manageComments"],
      shopId)) {
    return Comments.find(selector, {sort: {createdAt: -1}});
  }
  return this.ready();
});
