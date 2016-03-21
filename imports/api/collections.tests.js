import { Meteor } from "meteor/meteor";

import { Comments } from "./collections";
import { mocha } from 'avital:mocha';

if(Meteor.isServer) {
  require("./server/publications.js");

  describe("comments", () => {
    it("should throw 403 error by non admin", function (done) {
      console.log("done");
    });
  });

  // todo
}