const { Schema, model } = require("mongoose");

const contactSchema = Schema({
  name: String,
  email: String,
  phone: Number,
});

const Contact = model("contact", contactSchema);

module.exports = Contact;
