const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

let testUserToken;

describe("Users Routes Test", () => {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY);

    let u2 = await User.register({
      username: "test2",
      password: "password123",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550041",
    });

    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "I hoping you are having fun",
    });
  });
  describe("GET /users", () => {
    test("Get all users", async () => {
      let response = await request(app).get("/users").send({
        _token: testUserToken,
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        users: [
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550041",
          },
        ],
      });
    });
  });

  describe("GET /users/:username", () => {
    test("GET specific user", async () => {
      let res = await request(app)
        .get(`/users/test1`)
        .send({ _token: testUserToken });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
          join_at: expect.any(String),
          last_login_at: expect.anything(),
        },
      });
    });
  });

  describe("GET /users/:username/to", () => {
    test("GET to messages", async () => {
      let res = await request(app)
        .get("/users/test1/to")
        .send({ _token: testUserToken });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        messages: [
          {
            id: expect.any(Number),
            body: "I hoping you are having fun",
            read_at: null,
            sendt_at: expect.any(String),
            from_user: {
              username: "test1",
              first_name: "Test1",
              last_name: "Testy1",
              phone: "+14155550041",
            },
          },
        ],
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});
