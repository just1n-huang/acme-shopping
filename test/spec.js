const { expect } = require("chai");
const { syncAndSeed, User } = require("../server/db");
const jwt = require("jsonwebtoken");

describe("The Login process", () => {
  let seed;
  beforeEach(async () => {
    seed = await syncAndSeed();
  });

  describe("password storage", () => {
    it("password is hashed", () => {
      expect(seed.users.moe.password).not.to.equal("123");
    });
    it("doesnt get rehashed when a user updates", async () => {
      const { moe } = seed.users;
      const password = moe.password;
      moe.username = "MOE";
      await moe.save();
      expect(password).to.equal(moe.password);
    });
  });

  describe("with correct credentials", () => {
    it("returns a jwt token", async () => {
      const token = await User.authenticate({
        username: "lucy",
        password: "123",
      });
      const { id } = jwt.verify(token, process.env.JWT);
      expect(seed.users.lucy.id).to.equal(id);
    });
  });
  describe("token exchange", () => {
    describe("with a valid token", () => {
      it("can be exchanged for the user", async () => {
        const token = jwt.sign({ id: seed.users.larry.id }, process.env.JWT);
        const larry = await User.findByToken(token);
        expect(larry.username).to.equal("larry");
      });
      describe("with no user", () => {
        it("will throw an error", async () => {
          const token = jwt.sign({ id: seed.users.larry.id }, process.env.JWT);
          await seed.users.larry.destroy();
          try {
            const larry = await User.findByToken(token);
            throw "noooooo";
          } catch (ex) {
            expect(ex.status).to.equal(401);
          }
        });
      });
    });
    describe("with a invalid token", () => {
      it("cannot be exchanged for the user", async () => {
        const token = jwt.sign(
          { id: seed.users.larry.id },
          process.env.JWT + "!"
        );
        try {
          const larry = await User.findByToken(token);
          throw "noooooo";
        } catch (ex) {
          expect(ex.status).to.equal(401);
        }
      });
    });
  });
});
