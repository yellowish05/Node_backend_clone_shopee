const { Schema, model } = require('mongoose');

const schema = new Schema({
  id: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'ID is not correct!'],
    index: { unique: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: false,
    index: true,
  },
  password: {
    type: String,
    required: false,
  },
  roles: {
    type: [String],
  },
  isApprovedEmail: {
    type: Boolean,
    default: false,
  },
});

module.exports = new model('User', schema);
