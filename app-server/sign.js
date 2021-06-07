const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const config = require('./svr.config.json');

const router = express.Router();
const mail = nodemailer.createTransport(config.mail);

router.post('/up', async (req, res) => {
  const jwtSecretKey = req.app.get('jwtSecretKey');
  const db = req.app.get('db');

  const data = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const keys = db.getTableKey('user', 'system');
      const keysql = `${keys.join(' = ? and ')} = ? `;
      const selparams = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const k of keys) {
        selparams.push(data[k]);
      }

      const [rows] = await conntion.query(
        `select 1 from ${db.getTableName('user', 'system')} where ${keysql} limit 1`,
        selparams
      );
      if (rows.length === 0) {
        try {
          const vaildToken = await jwt.sign(
            {
              id: data.id,
              password: data.password
            },
            jwtSecretKey,
            { expiresIn: '1 days' }
          );
          mail.sendMail(
            {
              from: `noreply@${config.app.ip}`,
              to: data.email,
              subject: '사용자 이메일 검증',
              text: `${config.app.name} 시스템에 사용자 등록을 하셨습니다.\n`
                + `이메일 주소: ${data.email}에 대해 아래의 링크 URL을 눌러 검증 해주세요\n\n`
                + `검증 링크: http://${config.app.ip}:${config.app.port}/api/sign/valid/${vaildToken}\n`
                + '감사합니다.'
            },
            (err, info) => {
              if (err) {
                req.app.get('logger').error(err);
              }
              else {
                req.app.get('logger').info(info);
              }
            }
          );

          const flds = [];
          const paramsql = [];
          const instparams = [];
          // eslint-disable-next-line no-restricted-syntax
          for (const f of db.getTableField('user', 'system')) {
            if (data[f]) {
              flds.push(f);
              instparams.push(data[f]);
              paramsql.push('?');
            }
          }
          const ires = await conntion.query(
            `insert into ${db.getTableName('user', 'system')} (${flds.join(',')}) values (${paramsql.join(',')})`,
            instparams
          );
          res.json(JSON.stringify(ires));
        }
        catch (err) {
          if (err) {
            req.app.get('logger').error('sign/up', data, err);
            res.status(500).json(JSON.stringify(err));
          }
        }
      }
      else {
        res.status(400).json(JSON.stringify({ err: { code: '', message: 'user alread register !' } }));
      }
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'internal error !' } }));
  }
});

router.get('/vaild/:token', async (req, res) => {
  const jwtSecretKey = req.app.get('jwtSecretKey');
  const db = req.app.get('db');

  try {
    const decoded = await jwt.verify(req.selparams.token, jwtSecretKey);
    try {
      const conntion = await db.pool.getConnection(async (conn) => conn);
      try {
        const ures = await conntion.query(
          `update ${db.getTableNMame('user', 'system')} set active = true where id = ? and password = ?`,
          [decoded.id, decoded.password]
        );
        res.json(ures);
      }
      finally {
        if (conntion) {
          conntion.release();
        }
      }
    }
    catch (err) {
      req.app.get('logger').error(err);
      res.status(500).json(JSON.stringify({ err: { code: '', message: 'internal error !' } }));
    }
  }
  catch (err) {
    req.app.get('logger').error(err);
    res.status(400).json(JSON.stringify({ err: { code: '', message: 'expired key !' } }));
  }
});

router.post('/in', async (req, res) => {
  const jwtSecretKey = req.app.get('jwtSecretKey');
  const jwtExpiresIn = req.app.get('jwtExpiresIn');
  const db = req.app.get('db');

  const data = req.body;
  try {
    const inputpasswd = data.password;
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(
        `select * from ${db.getTableName('user', 'system')} where id = ? and active = true limit 1`,
        [data.id]
      );
      if (rows.length === 0) {
        res.status(400).json(JSON.stringify({ err: { code: '', message: 'id or password wrong !' } }));
      }
      else {
        // eslint-disable-next-line no-restricted-syntax
        for (const k of Object.keys(rows[0])) {
          data[k] = rows[0][k];
        }
        const rescomp = await bcrypt.compare(inputpasswd, data.password);
        if (!rescomp) {
          res.status(400).json(JSON.stringify({ err: { code: '', message: 'id or password wrong !' } }));
        }
        else {
          delete data.password;

          const token = await jwt.sign(
            data,
            jwtSecretKey,
            { expiresIn: jwtExpiresIn || '30m' }
          );
          res.set('x-access-token', token);
          res.json(JSON.stringify({ signin: 'ok', data }));
        }
      }
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'internal error !' } }));
  }
});

module.exports = router;
