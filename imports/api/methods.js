import { Meteor } from "meteor/meteor";
import { ValidatedMethod } from "meteor/mdg:validated-method";
import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";
import { Roles } from "meteor/alanning:roles";
import Comments from "./collections";
import { excludeIds } from "./helpers";

// anonymous users must provide name & email to leave a comment
const fieldRequiredIfAnonymous = () => {
  const shopId = ReactionCore.getShopId();
  const user = ReactionCore.Collections.Accounts.findOne({
    userId: Meteor.userId()
  });
  if(Roles.userIsInRole(user, "anonymous", shopId) && !this.value) {
    return "required"; // todo i18n?
  }
};

const commentValues = new SimpleSchema({
  sourceId: { type: String },
  // userId: { type: String },
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
  content: { type: Object },
  notify: { type: Boolean }
});

/**
 * addComment
 * @summary creates a comment
 * @type {ValidatedMethod}
 * @param {Object} values - comment object
 * @returns {String} id of created comment
 */
export const addComment = new ValidatedMethod({
  name: "addComment",
  validate: new SimpleSchema({
    values: { type: commentValues }
  }).validator(),
  run({ values }) {
    debugger;
    // todo what to do with files?

    // we do need to save author name, but it hasn"t introduced in Accounts
    // yet... so todo add denormalized name from profile later
    /*const shopId = ReactionCore.getShopId();

    const account = ReactionCore.Collections.Accounts.findOne({
      userId: Meteor.userId()
    });
    if(!Roles.userIsInRole(account, "anonymous", shopId)) {
    }*/
    const userId = Meteor.userId();
    if (userId) {
      values.userId = userId;
    }

    const parentId = values.parentId;
    if(parentId) {
      // get parent ancestors to build ancestors array
      const { ancestors } = /*ReactionCore.Collections.*/Comments.findOne(
        parentId
      );
      Array.isArray(ancestors) && ancestors.push(parentId);
      values.ancestors = ancestors;
    }

    // todo ejson for all fields? or safe it somehow else?

    // values.parentId field should be cleaned by SimpleSchema, so here
    // we can don"t touch it
    return /*ReactionCore.Collections.*/Comments.insert(values);
  }
});

/**
 * updateComment
 * @summary updates author name and/or content of comment
 * @type {ValidatedMethod}
 * @returns {*} update result //todo
 */
export const updateComment = new ValidatedMethod({
  name: "updateComment",
  validate: new SimpleSchema({
    _id: { type: SimpleSchema.RegEx.Id },
    author: { type: String, optional: true },
    content: { type: Object, optional: true }
  }).validator(),
  run({ _id, author, content }) {
    if (!ReactionCore.hasPermission("manageComments")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // todo ejson

    return /*ReactionCore.Collections.*/Comments.update(_id, {
      $set: {
        author,
        content
      }
    });
  }
});

/**
 * approveComments
 * @summary mark a comment as approved
 * @param {Array} ids - ids of comments to be approved
 * @type {ValidatedMethod}
 * @returns {*} update result
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

    return /*ReactionCore.Collections.*/Comments.update(
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
      throw new Meteor.Error(403, "Access Denied");
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
      throw new Meteor.Error(403, "Access Denied");
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
