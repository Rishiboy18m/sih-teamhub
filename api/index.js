module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ status: 'ok', service: 'SIH TeamHub API', timestamp: new Date().toISOString() }));
};
