
const uuidField = {
  _id: {
    type: String,
    lowercase: true,
    match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'ID is not correct!'],
  },
};

module.exports = uuidField;
