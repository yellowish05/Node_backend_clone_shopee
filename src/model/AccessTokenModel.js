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
    required: true,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  secret: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: false,
  },
  fingerprint: {
    type: String,
    required: false,
  },
});

module.exports = new model('AccessToken', schema);
