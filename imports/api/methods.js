import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Comments } from './comments.js';
import { removeFromAncestors } from './helpers.js';

const commentValues = new SimpleSchema({
  sourceId: { type: String },
  userId: { type: String },
  author: {
    type: String,
    optional: true,
    custom: fieldRequiredIfAnonymous
  },
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email,
    custom: fieldRequiredIfAnonymous
  },
  parentId: { type: String, optional: true },
  body: { type: String },
  notifyReply: { type: Boolean }
});

// anonymous users must provide name & email to leave a comment
const fieldRequiredIfAnonymous = () => {
  const shopId = ReactionCore.getShopId();
  const user = ReactionCore.Collections.Accounts.findOne({
    userId: Meteor.userId()
  });
  if(Roles.userIsInRole(user, "anonymous", shopId) && !this.value)
    return "required";
};

/**
 * addComment
 * @summary creates a comment
 * @type {ValidatedMethod}
 * @params {Object} values - comment object
 * @return {String} id of created comment
 */
export const addComment = new ValidatedMethod({
  name: "addComment",
  validate: new SimpleSchema({
    values: commentValues
  }).validator(),
  run({ values }) {
    // todo what to do with files?

    // we do need to save author name, but it hasn't introduced in Accounts
    // yet... so todo add denormalized name from profile later
    /*const shopId = ReactionCore.getShopId();

    const account = ReactionCore.Collections.Accounts.findOne({
      userId: Meteor.userId()
    });
    if(!Roles.userIsInRole(account, "anonymous", shopId)) {
    }*/

    const parentId = values.parentId;
    if(parentId) {
      // get parent ancestors to build ancestors array
      const { ancestors } = ReactionCore.Collections.Comments.findOne(
        parentId
      );
      Array.isArray(ancestors) && ancestors.push(parentId);
      values.ancestors = ancestors;
    }

    // todo ejson for all fields? or safe it somehow else?

    // values.parentId field should be cleaned by SimpleSchema, so here
    // we can don't touch it
    return ReactionCore.Collections.Comments.insert(values);
  }
});

/**
 * updateComment
 * @summary updates author name and/or body of comment
 * @type {ValidatedMethod}
 * @return {*} update result //todo
 */
export const updateComment = new ValidatedMethod({
  name: "updateComment",
  validate: new SimpleSchema({
    _id: { type: SimpleSchema.RegEx.Id },
    author: { type: String, optional: true },
    body: { type: String, optional: true }
  }).validator(),
  run({ _id, author, body }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // todo ejson

    return ReactionCore.Collections.Comments.update(_id, {
      $set: {
        author: author,
        body: body
      }
    });
  }
});

/**
 * approveComment
 * @summary mark a comment as approved
 * @type {ValidatedMethod}
 * @return {*} update result //todo
 */
export const approveComment = new ValidatedMethod({
  name: "approveComment",
  validate: new SimpleSchema({
    _id: { type: SimpleSchema.RegEx.Id }
  }).validator(),
  run({ _id }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return ReactionCore.Collections.Comments.update(_id, {
      $set: {
        "workflow.status": "approved"
      }
    });
  }
});

/**
 * deleteComment
 * @summary deletes a comment. Nested comments, if any, are moved up to one
 * level
 * @type {ValidatedMethod}
 * @return {Number} returns number of deleted comments
 */
export const deleteComment = new ValidatedMethod({
  name: "deleteComment",
  validate: new SimpleSchema({
    _id: { type: SimpleSchema.RegEx.Id }
  }).validator(),
  run({ _id }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // if there are nested comments inside this one, we move them one level
    // up by excluding current _id from ancestors array
    const nestedComments = ReactionCore.Collections.Comments.find({
      ancestors: {
        $in: [_id]
      }
    }).fetch();
    nestedComments.forEach(comment => {
      const ancestors = removeFromAncestors(comment.ancestors, _id);
      ReactionCore.Collections.Comments.update(comment._id, {
        $set: {
          ancestors: ancestors
        }
      });
    });

    return ReactionCore.Collections.Comments.delete(_id);
  }
});
