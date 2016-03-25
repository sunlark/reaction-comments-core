import { Meteor } from "meteor/meteor";
import { ValidatedMethod } from "meteor/mdg:validated-method";
import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";
import { Roles } from "meteor/alanning:roles";
import Comments from "./collections";
import { excludeIds } from "./helpers";

// anonymous users must provide name & email to leave a comment
function fieldRequiredIfAnonymous() {
  const shopId = ReactionCore.getShopId();
  if (Roles.userIsInRole(this.userId, "anonymous", shopId) && !this.value) {
    return "required";
  }
}

const commentValues = new SimpleSchema({
  sourceId: { type: String },
  name: {
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
  content: { type: Object, blackbox: true },
  notify: { type: Boolean }
});

/**
 * addComment
 * @summary creates a comment
 * @type {ValidatedMethod}
 * @param {Object} values - comment object
 * @fires `hook` after.method which could approve new comment and modify return
 * result to Object with approval result
 * @returns {String} _id of created comment
 */
export const addComment = new ValidatedMethod({
  name: "addComment",
  validate: new SimpleSchema({
    values: { type: commentValues }
  }).validator(),
  run({ values }) {
    const shopId = ReactionCore.getShopId();
    const userId = Meteor.userId();
    if (!shopId || !userId) {
      throw new Meteor.Error("addComment.not-found", "ShopId or UserId not found");
    }

    // we are taking anonymous user name from UI from, but for registered users
    // we not display form and taking name from `Accounts`
    const account = ReactionCore.Collections.Accounts.findOne({
      userId: userId
    });
    if (!Roles.userIsInRole(userId, "anonymous", shopId)) {
      if (account.emails && account.emails.length) {
        values.email = account.emails[0].address;
      }
      if (account.profile.name) {
        values.name = account.profile.name;
      }
    }
    values.userId = userId;

    const parentId = values.parentId;
    if (parentId) {
      // get parent ancestors to build ancestors array
      const { ancestors } = Comments.findOne(parentId);
      Array.isArray(ancestors) && ancestors.push(parentId);
      values.ancestors = ancestors;
    }

    // todo ejson for all fields? or safe it somehow else?

    // values.parentId field should be cleaned by SimpleSchema, so here
    // we can don"t touch it
    return Comments.insert(values);
  }
});

/**
 * approveComments
 * @summary mark a comment as approved
 * @param {Array} ids - ids of comments to be approved
 * @type {ValidatedMethod}
 * @returns {Number} update result
 */
export const approveComments = new ValidatedMethod({
  name: "approveComments",
  validate: new SimpleSchema({
    ids: { type: [SimpleSchema.RegEx.Id] }
  }).validator(),
  run({ ids }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error("approveComments.access-denied", "Access Denied");
    }

    return Comments.update({
      _id: { $in: ids }
    }, {
      $set: {
        "workflow.status": "approved"
      }
    }, {
      multi: true
    });
  }
});

/**
 * removeComments
 * @summary deletes a comments. Nested comments, if any, are moved up to one
 * level
 * @type {ValidatedMethod}
 * @param {Array} ids - ids of comments to delete
 * @returns {Number} returns number of deleted comments
 */
export const removeComments = new ValidatedMethod({
  name: "removeComments",
  validate: new SimpleSchema({
    ids: { type: [SimpleSchema.RegEx.Id] }
  }).validator(),
  run({ ids }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error("removeComments.access-denied", "Access Denied");
    }

    // if there are nested comments inside marked to delete, we move them one
    // level up by excluding being deleted id(s) from ancestors array
    const nestedComments = /*ReactionCore.Collections.*/Comments.find({
      ancestors: {
        $in: [ids]
      }
    });
    nestedComments.forEach(comment => {
      const ancestors = excludeIds(comment.ancestors, ids);
      /*ReactionCore.Collections.*/Comments.update(comment._id, {
        $set: {
          ancestors: ancestors
        }
      });
    });

    return /*ReactionCore.Collections.*/Comments.remove({_id: {$in: ids}});
  }
});

/**
 * updateComment
 * @summary updates content of comment
 * @type {ValidatedMethod}
 * @param {String} _id - comment _id
 * @param {Object} content - object with comment content
 * @returns {Number} update result
 */
export const updateComment = new ValidatedMethod({
  name: "updateComment",
  validate: new SimpleSchema({
    _id: { type: SimpleSchema.RegEx.Id },
    content: { type: Object, blackbox: true }
  }).validator(),
  run({ _id, content }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error("updateComment.access-denied", "Access Denied");
    }
    // todo ejson

    return /*ReactionCore.Collections.*/Comments.update(_id, {
      $set: {
        content
      }
    });
  }
});

/**
 * updateCommentsConfiguration
 * @summary toggle comments `moderation` setting
 * @param {Boolean} enabled - new state of comments `moderation` setting
 * @param {String} shopId - used for multi-shop
 * @returns {Number} `Packages` collection update result
 */
export const updateCommentsConfiguration = new ValidatedMethod({
  name: "updateCommentsConfiguration",
  validate: new SimpleSchema({
    enabled: { type: Boolean },
    shopId: { type: String }
  }).validator(),
  run({ enabled, shopId }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error("updateCommentsConfiguration.access-denied", "Access Denied");
    }
    return ReactionCore.Collections.Packages.update({
      name: "reaction-comments-core",
      shopId: shopId
    }, {
      $set: {
        "settings.moderation.enabled": enabled
      }
    });
  }
});
