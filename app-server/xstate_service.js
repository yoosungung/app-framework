const { Machine, interpret, State } = require('xstate');
const db = require('./db');
const logger = require('./winston');

const machines = new Map();
const interprets = new Map();

async function getMachineDB(_id) {
  const sql = 'SELECT fields FROM sys_xmachine WHERE id = ? AND active = true';
  const params = [_id];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      if (rows.length > 0 && rows[0].fields) {
        return rows[0].fields;
      }
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    logger.error(err);
  }
}

async function getMachine(_id) {
  if (!machines.has(_id)) {
    const xoption = await getMachineDB(_id);
    xoption.id = _id;
    const mchn = Machine(xoption);
    machines.set(_id, mchn);
  }
  return machines.get(_id);
}

async function getStateDB(_id) {
  const sql = 'SELECT machineid, fields FROM sys_xstate WHERE id = ?';
  const params = [_id];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      if (rows.length > 0 && rows[0].fields) {
        return { machineid: rows[0].machineid, state: rows[0].fields };
      }
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    logger.error(err);
  }
}

async function newStateDB(_id, _state) {
  const sql = 'INSERT INTO sys_xstate (machineid, fields) VALUES (?, ?)';
  const params = [_id, JSON.stringify(_state)];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      return rows.insertId;
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    logger.error(err);
  }
}

async function setStateDB(_id, _state) {
  const sql = 'UPDATE sys_xstate SET fields = ? WHERE id = ?';
  const params = [JSON.stringify(_state), _id];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      return rows.affectedRows;
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    logger.error(err);
  }
}

async function getService(_id) {
  if (!interprets.has(_id)) {
    const { machineid, state } = await getStateDB(_id);
    const pstate = State.create(state);
    const mshn = await getMachine(machineid);
    const rstate = mshn.resolveState(pstate);
    const service = interpret(mshn).start(rstate);
    service.onTransition((s) => setStateDB(_id, s));

    interprets.set(_id, service);
  }
  return interprets.get(_id);
}

async function start(_id, _content) {
  const mchn = await getMachine(_id);
  if (mchn) {
    const service = interpret(mchn);
    const sid = await newStateDB(_id, mchn.initialState);
    interprets.set(sid, service);
    service.onTransition((s) => setStateDB(sid, s));
    service.start(_content);
    const ste = service.state;
    ste.dbid = sid;
    return ste;
  }
}

async function event(_id, _event, _content) {
  const service = await getService(_id);
  if (service) {
    service.send(_event, _content);

    return service.state;
  }
}

function remove(_id) {
  machines.delete(_id);
}

module.exports.remove = remove;
module.exports.start = start;
module.exports.event = event;

async function test() {
  const ste1 = await start('3');
  console.log(ste1);
  const ste2 = await start('3');
  console.log(ste2);
  await event(ste2.dbid, 'eventsomething', { test: 1 });
  console.log(ste1);
  console.log(ste2);
  await event(ste1.dbid, 'eventsomething', { test: 1 });
  console.log(ste1);
  console.log(ste2);
}

if (require.main === module) {
  test();
}
