import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";

// todo labels. i18n for labels??
// todo should schema be global?
// export default Comments = new SimpleSchema({
ReactionCore.Schemas.Comments = new SimpleSchema({
  _id: {
    type: String
  },
  ancestors: {
    type: [String],
    defaultValue: []
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: ReactionCore.shopIdAutoValue,
    label: "Comment shopId"
  },
  sourceId: {
    type: String,
    index: 1 // todo check indexes
  },
  userId: {
    type: String
  },
  name: {
    type: String,
    label: "Name",
    optional: true // FIXME make reaction account name field required
  },
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      }
    },
    denyUpdate: true // todo check no update
  },
  updatedAt: {
    type: Date,
    autoValue: function () {
      if (this.isUpdate) {
        return {
          $set: new Date
        };
      }
    },
    optional: true
  },
  content: {
    type: Object,
    blackbox: true
  },
  workflow: {
    type: ReactionCore.Schemas.Workflow
  },
  notify: {
    type: Boolean,
    defaultValue: false
    // it is `false` by default, because we could decide to not give user an ability
    // to choose notify or not if this is "reply", for example. If you want to
    // display such selector with initial state = `true`, then you should set it
    // manually before display within UI
  }
});
