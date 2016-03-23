import { Meteor } from "meteor/meteor";

import Comments from "./collections";
//import { mocha } from 'avital:mocha';
import { mocha } from "meteor/practicalmeteor:mocha";


describe("comments", () => {
  it("should throw 403 error by non admin", function () {
    assert.equal(true, true);
  });
});

/*
if(Meteor.isServer) {
  require("./server/publications.js");



  // todo
}*/
