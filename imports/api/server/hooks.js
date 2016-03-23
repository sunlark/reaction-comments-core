import { Meteor, Email } from "meteor/meteor";
import { ReactionCore } from "meteor/reactioncommerce:core";
import { approveComments } from "../methods";
import Comments from "../collections.js";
import i18next from "i18next";

/**
 * @summary send email notification about reply to provided addresses
 * @param {Array} emails
 */
const sendCommentReply = (emails) => {
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
const notifyAboutReply = (ancestorsIds) => {
  const emails = [];
  // get each comment in ancestors chain and check if his author want to
  // know about replies
  ancestorsIds.forEach((id) => {
    const { userId, notifyReply } = /*ReactionCore.Collections.*/Comments.findOne(
      id
    );
    if(notifyReply) {
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
  ReactionCore.Log.debug("MethodHooks after addComment", options);

  if (options.error) {
    return;
  }

  const _id = options.result;

  // if comment created by admin/manager, approve it immediately...
  if (ReactionCore.hasPermission("manageComments")) {
    approveComments.call([_id]);
  } else {
    //...else check: if moderation is Off, set status to approved too
    const commentsSettings = ReactionCore.Collections.Packages.findOne({
      shopId: this.getShopId(),
      name: "reaction-comments-core"
    });
    if(!commentsSettings.settings.moderation.enabled) {
      approveComments.call([_id]);
    }
  }

  return _id;
});

ReactionCore.MethodHooks.after("approveComments", function (options) {
  
  if (options.error) {
    ReactionCore.Log.warn("error while approveComment ", options.error);
    return;
  }

  const _id = options.arguments[0];
  const comment = Comments.findOne({ _id });
  ReactionCore.Log.info(`comment ${_id} approved`);

  // if this comment is a reply (= has ancestors), notify about it those
  // from them who are interested in
  const ancestors = comment.ancestors;
  if(ancestors.length > 0) notifyAboutReply(ancestors);

  return options.result;
});
