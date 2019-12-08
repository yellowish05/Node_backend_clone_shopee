module.exports = (req, res) => {
  const data = req.body;
  res.status(200).send({ status: 'need implement wire card', data });
};
