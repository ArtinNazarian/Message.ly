const express = require("express");
const router = new express.Router();
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user.username;

    const message = Message.get(id);
    if (
      currentUser === message.from_user.username ||
      currentUser === message.to_user.username
    ) {
      return res.json({ message: message });
    }
    throw new ExpressError("You are not allowed to view this message", 404);
  } catch (e) {
    next(e);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const { to_username, body } = req.body;
    const message = await Message.create({
      from_username: req.user.username,
      to_username: to_username,
      body: body,
    });
    const send = await Message.send(message);
    return res.json({ message: message });
  } catch (err) {
    return next(err);
  }
});
/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user.username;
    const toMsg = Message.get(id);
    if (currentUser !== toMsg.to_user.username) {
      throw new ExpressError(`Cannot set message to read. 
      The message is not inteded for the logged in user`);
    }
    const message = await Message.markRead(id);
    return res.json({ message: message });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
