const jwt = require('jsonwebtoken');

function middleware(req, res, next) {
  const jwtSecretKey = req.app.get('jwtSecretKey');
  const jwtExpiresIn = req.app.get('jwtExpiresIn');

  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ err: { code: '401', message: 'not signin !' } });
  }
  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      req.app.get('logger').error(err);
      res.status(401).json(err);
    }
    else {
      req.user = decoded;
      delete req.user.iat;
      delete req.user.exp;
      delete req.user.password;

      const ntoken = jwt.sign(req.user, jwtSecretKey, { expiresIn: jwtExpiresIn || '1h' });
      res.set('x-access-token', ntoken);
      next();
    }
  });
}

module.exports = middleware;
