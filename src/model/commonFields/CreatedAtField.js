
const createdAtField = {
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
};

module.exports = createdAtField;
