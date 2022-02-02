const express = require("express");
const CreateError = require("http-errors");
const { User, schemas } = require("../../models/user");
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      throw new CreateError(
        400,
        "Ошибка от Joi или другой библиотеки валидации"
      );
    }
    const [email, password] = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new CreateError(409, "Email in use");
    }
    const result = await User.create(req.body);
    res.status(201).json({
      user: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
