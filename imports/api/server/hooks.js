import { Meteor, Email } from "meteor/meteor";
import { ReactionCore } from "meteor/reactioncommerce:core";
import { approveComments } from "../methods";
import Comments from "../collections.js";
// import { _ } from "meteor/underscore";
import { mergeUniq } from "../helpers";
// import i18next from "i18next";

/**
 * @summary send email notification about reply to provided addresses
 * @param {Array} emails
 */
const sendCommentReply = emails => {
  const shop = ReactionCore.Collections.Shops.findOne(order.shopId);
  if (!shop.emails[0].address) {
    shop.emails[0].address = "no-reply@reactioncommerce.com";
    ReactionCore.Log.warn("No shop email configured. Using no-reply to send " +
      "mail");
  }
  // todo SSR.compileTemplate
  try {
    return Email.send({
      to: emails,
      from: `${shop.name} <${shop.emails[0].address}>`,
      subject: `Reply to your comment on ${shop.name}`,
      // todo html instead of text
      // todo i18n
      text: i18next.t("replyNotificationEmail.body")
    });
  } catch (error) {
    throw new Meteor.Error(403, "Unable to send comment reply notification" +
      " email.", error);
  } finally {
    ReactionCore.Log.info(`Trying to send comment reply notification mail to 
      ${emails}`);
  }
};

/**
 * @summary checks the list of comment"s ancestors to know if some of them
 * wants to know about new replies. Sends the email notification to all of them.
 * @param {Array} ancestorsIds - list of comment"s ancestors
 */
const notifyAboutReply = ancestorsIds => {
  const emails = [];
  // get each comment in ancestors chain and check if his author want to
  // know about replies
  ancestorsIds.forEach((id) => {
    const { userId, notify } = /*ReactionCore.Collections.*/Comments.findOne(
      id
    );
    if(notify) {
      const user = ReactionCore.Collections.Accounts.findOne(userId);
      // anonymous users arent welcome here
      if (!user.emails || !user.emails.length > 0) {
        return;
      }

      emails.push(user.emails[0].address);
    }
  });

  if(emails.length) sendCommentReply(emails);
};

ReactionCore.MethodHooks.after("addComment", function (options) {
  if (options.error) {
    ReactionCore.Log.warn("error adding comment", options.error.reason);
    return options.error;
  }

  const _id = options.result;
  ReactionCore.Log.info("New comment added:", _id);

  // if comment created by admin/manager, approve it immediately...
  if (ReactionCore.hasPermission("manageComments")) {
    approveComments.call({ ids: [_id] });
  } else {
    // ...else check: if moderation is Off, set status to approved too
    const commentsSettings = ReactionCore.Collections.Packages.findOne({
      shopId: this.getShopId(),
      name: "reaction-comments-core"
    });
    if(!commentsSettings.settings.moderation.enabled) {
      approveComments.call({ ids: [_id] });
    }
  }

  return _id;
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
      debugger;
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
