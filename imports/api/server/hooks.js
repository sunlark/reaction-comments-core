import { ReactionCore } from "meteor/reactioncommerce:core";
import { approveComment } from "../methods";
import { notifyAboutReply } from "../helpers";

ReactionCore.MethodHooks.after("addComment", function (options) {
  ReactionCore.Log.debug("MethodHooks after addComment", options);
  // Default return value is the return value of previous call in method chain
  // or an empty object if there's no result yet.
  const _id = options.result;
  if (!options.error) {
    const comment = ReactionCore.Collections.Comments.findOne({ _id });

    // if moderation is Off, set status to approved
    const commentsSettings = ReactionCore.Collections.Packages.findOne({
      shopId: this.getShopId(),
      name: "reaction-comments-core"
    });
    if(!commentsSettings.settings.moderation.enabled) {
      approveComment.call(_id);
    }

    // if this comment is a reply (= has ancestors), notify about it those from
    // who are interested in
    const ancestors = comment.ancestors;
    if(ancestors.length > 0) notifyAboutReply(ancestors);
  }
  return _id;
});

