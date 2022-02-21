const express = require("express");
const router = express.Router();
const CreateError = require("http-errors");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");

const { User, schemas } = require("../../models/user");
const { authenticate, upload } = require("../../middlewares");
const createError = require("http-errors");
const sendMail = require("../../helpers/sendMail");

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).send();
});

router.patch("/updatesubscription", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.update.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { _id } = req.user;
    const { subscription } = req.body;
    await User.findByIdAndUpdate(_id, { subscription });
    res.json({
      user: {
        subscription: req.body.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    const { _id } = req.user;
    const { path: tempUpload, filename } = req.file;
    try {
      await Jimp.read(tempUpload)
        .then((image) => {
          return image.resize(250, 250).write(tempUpload);
        })
        .catch((error) => {
          console.error(error);
        });

      const [extention] = filename.split(".").reverse();
      const newFileName = `${_id}.${extention}`;
      const resultUpload = path.join(avatarsDir, newFileName);
      await fs.rename(tempUpload, resultUpload);
      const avatarURL = path.join("avatars", newFileName);
      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({
        avatarURL,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw createError(404);
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });
    res.json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { error } = schemas.validate(req.body);
    if (error) {
      throw createError(400, "missing required field email");
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      throw CreateError(400, "Verification has already been passed");
    }
    const mail = {
      to: email,
      subject: "Подтвеждение email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/${user.verificationToken}'>Нажмите чтобы подтвердить свой email</a>`,
    };
    sendMail(mail);
    res.json({
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
