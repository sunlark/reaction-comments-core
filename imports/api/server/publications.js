import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { ReactionCore } from "meteor/reactioncommerce:core";
import { Comments } from '../comments.js'; // todo import on ReactionCore here?

// todo order by newest first. newest may be somewhere nested

/**
 * comments for given object
 * @params {String} sourceId - id of object which has comments (Product or
 * Post etc).
 */
Meteor.publish("Comments", function(sourceId, shopId) {
  check(sourceId, Match.OneOf(String, null));
  // todo check shopId
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }

  // todo get by filter - unread, new, accepted, rejected
  // todo pagination?
  // todo all/ by source only - in one method?
  // global admin can get all accounts
  return Comments.find({
    shopId: shopId,
    sourceId: sourceId,
    "workflow.status": "accepted"
  });
});

/**
 * all comments
 */

Meteor.publish("AllComments", function(shopId) {
  check(sourceId, Match.OneOf(String, null));
  // todo check shopId
  const shopId = ReactionCore.getShopId();
  if (!shopId) {
    return this.ready();
  }

  // todo get by filter - unread, new, accepted, rejected
  // todo pagination?
  // todo all/ by source only - in one method?
  // global admin can get all accounts
  if (Roles.userIsInRole(this.userId, ["admin", "owner"], shopId)) {
    return Comments.find({
      shopId: shopId
    });
  }

});


