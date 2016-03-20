import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Comments } from './comments.js';
import { excludeIds } from './helpers.js';

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
    return "required"; // todo i18n?
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
 * approveComments
 * @summary mark a comment as approved
 * @params {Array} ids - ids of comments to be approved
 * @type {ValidatedMethod}
 * @return {*} update result
 */
export const approveComments = new ValidatedMethod({
  name: "approveComments",
  validate: new SimpleSchema({
    ids: { type: [SimpleSchema.RegEx.Id] }
  }).validator(),
  run({ ids }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return ReactionCore.Collections.Comments.update(
      {_id: {$in: ids}},
      {
        $set: {
          "workflow.status": "approved"
        }
      },
      {multi: true});
  }
});

/**
 * removeComments
 * @summary deletes a comments. Nested comments, if any, are moved up to one
 * level
 * @type {ValidatedMethod}
 * @params {Array} ids - ids of comments to delete
 * @return {Number} returns number of deleted comments
 */
export const removeComments = new ValidatedMethod({
  name: "removeComments",
  validate: new SimpleSchema({
    ids: { type: [SimpleSchema.RegEx.Id] }
  }).validator(),
  run({ ids }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // if there are nested comments inside marked to delete, we move them one
    // level up by excluding being deleted id(s) from ancestors array
    const nestedComments = ReactionCore.Collections.Comments.find({
      ancestors: {
        $in: [ids]
      }
    }).fetch();
    nestedComments.forEach(comment => {
      const ancestors = excludeIds(comment.ancestors, ids);
      ReactionCore.Collections.Comments.update(comment._id, {
        $set: {
          ancestors: ancestors
        }
      });
    });

    return ReactionCore.Collections.Comments.delete({_id: {$in: [ids]}});
  }
});