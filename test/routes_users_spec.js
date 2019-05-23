// test/routes_users_spec.js
/* globals describe afterEach it beforeEach */

/* ================================= SETUP ================================= */

process.env.NODE_ENV = "testing";

const chai = require("chai");
const { db, TABLES } = require("../app/config/knex");
const { assert } = chai;
const chaiHttp = require("chai-http");
const { suite, test } = require("mocha");
const app = require("../server");
const utils = require("../app/utils");

const name = `firstname ${utils.randomText()}`;
const name2 = `firstname2 ${utils.randomText()}`;
const email = "fakeemail@test.com";
const avatar_url = "http://example.com/avatar.png";

const updatedName = `updatedFirstName ${utils.randomText()}`;
const updatedAvatar_url = "http://example.com/updated-avatr.png";
const updatedEmail = "updatedEmail@email.com";
const google_id = "1234";
const google_token = "5678";

let id;
let id2;

/* ================================= TESTS ================================= */

chai.use(chaiHttp);

suite("routes : user", function() {
  suite("POST /api/user/", function() {
    test("creates and returns new user", function(done) {
      chai
        .request(app)
        .post("/api/user/")
        .send({ name, email, avatar_url, google_id, google_token })
        .end(function(err, res) {
          userId = res.body.id;
          assert.equal(res.status, 200);
          assert.isNull(err);
          done();
        });
    });
    test("returns an error if request body is malformed", function(done) {
      chai
        .request(app)
        .post("/api/user/")
        .send({ username: "user" })
        .end(function(err, res) {
          assert.equal(res.status, 500);
          assert.equal(res.type, "application/json");
          assert.isNotNull(res.body.message);
          done();
        });
    });
  });

  suite("GET /api/user/:id", function() {
    test("gets one user by id", function(done) {
      chai
        .request(app)
        .get(`/api/user/${userId}`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isNull(err);
          assert.property(res.body, "id");
          assert.property(res.body, "created_at");
          assert.property(res.body, "updated_at");
          assert.property(res.body, "email");
          assert.property(res.body, "name");
          assert.property(res.body, "avatar_url");
          assert.property(res.body, "google_id");
          assert.property(res.body, "google_token");
          done();
        });
    });
    test("returns error if user id missing or malformed", function(done) {
      chai
        .request(app)
        .get("/api/user/123456789")
        .end(function(err, res) {
          assert.equal(res.status, 404);
          assert.equal(res.type, "application/json");
          assert.isNotNull(res.body.message);
          done();
        });
    });
  });

  suite("PUT /api/user/:id", function() {
    test("updates a user", function(done) {
      const updates = {
        email: updatedEmail,
        name: updatedName,
        avatar_url: updatedAvatar_url
      };
      chai
        .request(app)
        .put(`/api/user/${userId}`)
        .send({ updates })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isNull(err);
          assert.property(res.body[0], "id");
          assert.property(res.body[0], "created_at");
          assert.property(res.body[0], "updated_at");
          assert.property(res.body[0], "email");
          assert.property(res.body[0], "name");
          assert.property(res.body[0], "google_id");
          assert.property(res.body[0], "google_token");
          done();
        });
    });
    test("returns error if user id missing or malformed", function(done) {
      const updates = {
        email: updatedEmail,
        name: updatedName,
        avatar_url: updatedAvatar_url
      };
      chai
        .request(app)
        .put("/api/user/123456789")
        .send({ updates })
        .end(function(err, res) {
          assert.equal(res.status, 500);
          assert.equal(res.type, "application/json");
          assert.isNotNull(res.body.message);
          done();
        });
    });
    test("returns error if updates missing or malformed", function(done) {
      chai
        .request(app)
        .put(`/api/user/${userId}`)
        .send({ name: undefined })
        .end(function(err, res) {
          assert.equal(res.status, 404);
          assert.equal(res.type, "application/json");
          assert.isNotNull(res.body.message);
          done();
        });
    });
  });

  suite("DELETE", function() {
    test("delete a user", function(done) {
      chai
        .request(app)
        .delete(`/api/user/${userId}`)
        .end(function(err, res) {
          assert.equal(res.body.message, "User deleted successfully");
          assert.isNull(err);
          done();
        });
    });
    test("returns error if user id missing or malformed", function(done) {
      chai
        .request(app)
        .delete("/api/user/123456789")
        .end(function(err, res) {
          assert.equal(res.status, 404);
          assert.equal(res.type, "application/json");
          assert.isNotNull(res.body.message);
          done();
        });
    });
  });
});
