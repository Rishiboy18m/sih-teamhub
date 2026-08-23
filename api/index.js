module.exports = async (req, res) => {
  try {
    const app = require('../server/index');
    return app(req, res);
  } catch (err) {
    console.error('Vercel serverless error:', err);
    return res.status(500).json({
      error: 'Vercel Serverless Invocation Error',
      message: err.message,
      stack: err.stack
    });
  }
};
