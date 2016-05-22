import { Meteor, Email } from "meteor/meteor";
import { ReactionCore } from "meteor/reactioncommerce:core";
import { approveComments } from "../methods";
import Comments from "../collections.js";
// import { _ } from "meteor/underscore";
import { mergeUniq } from "../helpers";
import i18next from "i18next";

/**
 * sendCommentReply
 * @description Send bunch of notification emails sorted by shopId
 * @summary send email notification about reply to provided addresses
 * @param {Object} emails
 * @return {Undefined}
 */
const sendCommentReply = emails => {
  Object.keys(emails).forEach(shopId => {
    const shop = ReactionCore.Collections.Shops.findOne(shopId);
    if (!shop.emails[0].address) {
      shop.emails[0].address = "no-reply@reactioncommerce.com";
      ReactionCore.Log.warn("No shop email configured. Using no-reply to send mail");
    }
    // todo SSR.compileTemplate
    // TODO how do we know which language we should use for email?
    try {
      Email.send({
        to: emails[shopId],
        from: `${shop.name} <${shop.emails[0].address}>`,
        subject: i18next.t("comments.email.replyToYourComment", {
          ns: "reaction-comments-core",
          shopName: shop.name
        }),
        // subject: `Reply to your comment on ${shop.name}`,
        // todo html instead of text
        // todo i18n
        text: i18next.t("replyNotificationEmail.body")
      });
    } catch (error) {
      throw new Meteor.Error(403, "Unable to send comment reply notification email.",
        error);
    } finally {
      ReactionCore.Log.info(`Trying to send comment reply notification mail to ${
        emails[shopId]}`);
    }
  });
};

/**
 * @summary checks the list of comment"s ancestors to know if some of them
 * wants to know about new replies. Sends the email notification to all of them.
 * @param {Array} ancestorsIds - list of comment"s ancestors
 * @fires `sendCommentReply`
 * @return {Undefined}
 */
const notifyAboutReply = ancestorsIds => {
  const emails = {};
  // get each comment in ancestors chain and check if his author want to
  // know about replies
  ancestorsIds.forEach((id) => {
    let email;
    // for anonymous user we keep his email within comment document
    const comment = /*ReactionCore.Collections.*/Comments.findOne(id);
    if (typeof comment.email === "undefined") {
      const user = ReactionCore.Collections.Accounts.findOne(comment.userId);
      // double check. anonymous users aren't welcome here. Also, if author was
      // anonymous - his account could be deleted. I suppose, this check could
      // always be false
      if (!user || user && !user.emails || !user.emails.length) {
        return;
      }
      email = user.emails[0].address;
    } else {
      email = comment.email;
    }

    // we need to split emails by `shopId`. In dashboard admin could approve
    // several comments from different shops at one time.
    if (!emails[comment.shopId]) {
      emails[comment.shopId] = [];
      emails[comment.shopId].push(email);
    } else {
      emails[comment.shopId].push(email);
    }
  });

  sendCommentReply(emails);
};

ReactionCore.MethodHooks.after("addComment", function (options) {
  if (options.error) {
    ReactionCore.Log.warn("error adding comment", options.error.reason);
    return options.error;
  }

  let res = null;
  const _id = options.result;
  ReactionCore.Log.info("New comment added:", _id);

  // if comment created by admin/manager, approve it immediately...
  if (ReactionCore.hasPermission("manageComments")) {
    res = approveComments.call({ ids: [_id] });
  } else {
    // ...else check: if moderation is Off, set status to approved too
    const commentsSettings = ReactionCore.Collections.Packages.findOne({
      shopId: ReactionCore.getShopId(),
      name: "reaction-comments-core"
    });
    if(!commentsSettings.settings.moderation.enabled) {
      res = approveComments.call({ ids: [_id] });
    }
  }

  return { _id, res };
});

/**
 * ReactionCore.MethodHooks.after.approveComments
 * @description It could be situations when we need to send notification to
 * user about reply, but reply become visible only after approval. In this place
 * we look for all ancestors which need to be notified and fire `notifyAboutReply`
 * function on them.
 */
ReactionCore.MethodHooks.after("approveComments", function (options) {
  if (options.error) {
    ReactionCore.Log.warn("error approving comment(s)", options.error.reason);
    return options.error;
  }
  const { ids } = options.arguments[0];
  let toNotifyIds = [];
  ids.forEach(_id => {
    ReactionCore.Log.info(`comment ${_id} approved`);

    const comment = Comments.findOne(_id);
    // if this comment is a reply (= has ancestors), notify about it those
    // from them who are interested in
    if (comment.ancestors.length) {
      // todo test this
      // toNotifyIds = _.union(toNotifyIds, comment.ancestors);
      toNotifyIds = mergeUniq(toNotifyIds, comment.ancestors);
    }
  });
  // const comment = Comments.findOne({ _id });
  // ReactionCore.Log.info(`comment(s) ${_id} approved`);

  // const ancestors = comment.ancestors;
  if(toNotifyIds.length) {
    notifyAboutReply(toNotifyIds);
  }

  return options.result;
});

ReactionCore.MethodHooks.after("updateCommentsConfiguration", function (options) {
  if (options.error) {
    ReactionCore.Log.warn("Error changing comments moderation", options.error.reason);
    return options.error;
  }

  return options.result;
});
