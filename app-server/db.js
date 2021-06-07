/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable array-callback-return */
/* eslint-disable eqeqeq */
const mysql = require('mysql2/promise');
const svrconfig = require('./svr.config.json');
const logger = require('./winston');

var tabledefine = [];
try {
  tabledefine = require('./app.config.json');
}
catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

const pool = mysql.createPool(svrconfig.mysql);

function getGroupType() {
  if (tabledefine && tabledefine.length > 0) {
    const grptbl = tabledefine.find((tab) => (tab.type == 'system' && tab.value == 'group'));
    if (grptbl) {
      const grpcol = grptbl.fields.find((col) => (col.value == 'grp'));
      if (grpcol && grpcol.summary) {
        return grpcol.summary;
      }
    }
  }
  return 'varchar(32)';
}

function getUserType() {
  if (tabledefine && tabledefine.length > 0) {
    const usertbl = tabledefine.find((tab) => (tab.type == 'system' && tab.value == 'user'));
    if (usertbl) {
      const idcol = usertbl.fields.find((col) => (col.value == 'id'));
      if (idcol && idcol.summary) {
        return idcol.summary;
      }
    }
  }
  return 'varchar(32)';
}

function createMysqlDdl() {
  if (tabledefine && tabledefine.length > 0) {
    const grptype = getGroupType();
    const usertype = getUserType();

    const ddl = tabledefine.map((obj) => {
      let idxddl = '';
      let tabddl = ` DROP TABLE IF EXISTS ${obj.table};`;
      tabddl = `${tabddl} CREATE TABLE IF NOT EXISTS ${obj.table} (`;
      if (obj.type === 'master') {
        tabddl = `${tabddl} id INT NOT NULL AUTO_INCREMENT, grp ${grptype} NOT NULL, editby ${usertype} NOT NULL, editat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, fields JSON NOT NULL, `;
        obj.fields.map((col) => {
          if (col.summary) {
            tabddl = `${tabddl} ${col.value} ${col.summary} GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(fields, '$.${col.value}'))) STORED, `;
            idxddl = `${idxddl} CREATE INDEX idx_${obj.value}_${col.value} ON ${obj.table} (${col.value} ${col.type == 'date' ? 'DESC' : 'ASC'}); `;
          }
        });
        tabddl = `${tabddl} PRIMARY KEY (id)) ENGINE = InnoDB; `;
        idxddl = `${idxddl} CREATE INDEX idx_${obj.value}_mst ON ${obj.table} (grp ASC, editat DESC); `;
      }
      else if (obj.type === 'child') {
        tabddl = `${tabddl} id INT NOT NULL AUTO_INCREMENT, parent_id INT NOT NULL, parent_object VARCHAR(32) NOT NULL, editby ${usertype} NOT NULL, editat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, fields JSON NOT NULL, `;
        obj.fields.map((col) => {
          if (col.summary) {
            tabddl = `${tabddl} ${col.value} ${col.summary} GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(fields, '$.${col.value}'))) STORED, `;
            idxddl = `${idxddl} CREATE INDEX idx_${obj.value}_${col.value} ON ${obj.table} (${col.value} ${col.type == 'date' ? 'DESC' : 'ASC'}); `;
          }
        });
        tabddl = `${tabddl} PRIMARY KEY (id)) ENGINE = InnoDB;`;
        idxddl = `${idxddl} CREATE INDEX idx_${obj.value}_chd ON ${obj.table} (parent_id ASC, parent_object ASC); `;
      }
      else if (obj.type === 'reference') {
        tabddl = `${tabddl} id INT NOT NULL AUTO_INCREMENT, from_id INT NOT NULL, from_object VARCHAR(32) NOT NULL, editby ${usertype} NOT NULL, editat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, fields JSON NOT NULL, `;
        obj.fields.map((col) => {
          if (col.summary) {
            tabddl = `${tabddl} ${col.value} ${col.summary} GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(fields, '$.${col.value}'))) STORED, `;
            idxddl = `${idxddl} CREATE INDEX idx_${obj.value}_${col.value} ON ${obj.table} (${col.value} ${col.type == 'date' ? 'DESC' : 'ASC'}); `;
          }
        });
        tabddl = `${tabddl} PRIMARY KEY (id, from_id, from_object)) ENGINE = InnoDB;`;
      }
      else if (obj.type === 'system') {
        const keys = [];
        obj.fields.map((col) => {
          tabddl = `${tabddl} ${col.value} ${col.summary} ${(col.key || col.default) ? 'NOT NULL' : 'NULL'}${col.default ? ` DEFAULT ${col.default}` : ''},`;
          if (col.key) {
            keys.push(col.value);
          }
        });
        tabddl += ` PRIMARY KEY (${keys.join(',')})) ENGINE = InnoDB;`;
      }
      return `${tabddl}\n${idxddl}`;
    });

    return ddl.join('\n');
  }
  return '';
}

function createXstateDdl() {
  const usertype = getUserType();
  const grptype = getGroupType();

  const ddl = `DROP TABLE IF EXISTS sys_xmachine; 
  CREATE TABLE IF NOT EXISTS sys_xmachine (
    id INT NOT NULL AUTO_INCREMENT,
    grp ${grptype} NOT NULL,
    fullname varchar(128) NOT NULL,
    active BOOL NOT NULL DEFAULT true,
    editby ${usertype} NOT NULL,
    editat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fields JSON NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE = InnoDB;
  CREATE INDEX idx_xmachine_editby ON sys_xmachine (editby ASC);
  CREATE INDEX idx_xmachine_editat ON sys_xmachine (editat DESC);
  DROP TABLE IF EXISTS sys_xstate; 
  CREATE TABLE IF NOT EXISTS sys_xstate (
    id INT NOT NULL AUTO_INCREMENT,
    machineid INT NOT NULL,
    done BOOL GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(fields, '$.done'))) STORED, 
    startat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    editat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fields JSON NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE = InnoDB;
  CREATE INDEX idx_interpret_machineid ON sys_xstate (machineid DESC);;
  CREATE INDEX idx_interpret_startat ON sys_xstate (startat DESC);;
  CREATE INDEX idx_interpret_editat ON sys_xstate (editat DESC);`;

  return ddl;
}

async function createMysqlTable() {
  logger.info(createXstateDdl());
  const ddl = `${createMysqlDdl() + createXstateDdl()}commit`;
  logger.info(ddl);
  const sqls = ddl.split(';');
  try {
    const conntion = await pool.getConnection(async (conn) => conn);
    try {
      for (const sql of sqls) {
        logger.info(`SQL:${sql}`);
        if (sql.trim() !== '') {
          const [rows, fields] = await conntion.query(sql);
          logger.info(`RESULT: ${[rows, fields]}`);
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
    logger.error(err);
  }
}

const tables = new Map();
function getTableName(obj, typ) {
  const k = `${obj}::${typ}`;
  if (!tables.has(k)) {
    const tab = tabledefine.find((tbl) => {
      if (typ) {
        return (tbl.value == obj) && (tbl.type == typ);
      }
      return (tbl.value == obj) && ((tbl.type == 'master') || (tbl.type == 'system'));
    });
    if (tab) {
      tables.set(k, tab.table);
    }
    else {
      switch (typ) {
        case 'system':
          tables.set(k, `sys_${obj}`);
          break;
        case 'reference':
          tables.set(k, `ref_${obj}`);
          break;
        case 'child':
          tables.set(k, `chd_${obj}`);
          break;
        default:
          tables.set(k, `mst_${obj}`);
          break;
      }
    }
  }
  return tables.get(k);
}

const keys = new Map();
function getTableKey(obj, typ) {
  const k = `${obj}::${typ}`;
  if (!keys.has(k)) {
    const key = [];
    const tab = tabledefine.find((tbl) => (tbl.value == obj) && (tbl.type == typ));
    if (tab) {
      for (const col of tab.fields) {
        if (col.key) {
          key.push(col.value);
        }
      }
    }
    keys.set(k, key);
  }
  return keys.get(k);
}

const fields = new Map();
function getTableField(obj, typ) {
  const k = `${obj}::${typ}`;
  if (!fields.has(k)) {
    const field = [];
    const tab = tabledefine.find((tbl) => (tbl.value == obj) && (tbl.type == typ));
    if (tab) {
      for (const col of tab.fields) {
        field.push(col.value);
      }
    }
    fields.set(k, field);
  }
  return fields.get(k);
}

const summarys = new Map();
function getTableSummary(obj, typ) {
  const k = `${obj}::${typ}`;
  if (!summarys.has(k)) {
    const field = [];
    const tab = tabledefine.find((tbl) => (tbl.value == obj) && (tbl.type == typ));
    if (tab) {
      if (typ == 'master') {
        field.push('id', 'grp', 'editby', 'editat');
      }
      else if (typ == 'child') {
        field.push('id', 'parent_object', 'parent_id', 'editby', 'editat');
      }
      else if (typ == 'reference') {
        field.push('id', 'from_object', 'from_id', 'editby', 'editat');
      }
      for (const col of tab.fields) {
        if (col.summary) {
          field.push(col.value);
        }
      }
    }
    summarys.set(k, field);
  }
  return summarys.get(k);
}

const visibilitys = new Map();
function getVisiblity(obj, typ) {
  const k = `${obj}::${typ}`;
  if (!visibilitys.has(k)) {
    const tab = tabledefine.find((tbl) => (tbl.value == obj) && ((tbl.type == 'master') || (tbl.type == 'system')));
    if (tab && tab.visiblity) {
      visibilitys.set(`${obj}::read`, tab.visiblity.read || 'group');
      visibilitys.set(`${obj}::write`, tab.visiblity.write || 'owner');
    }
    else {
      visibilitys.set(`${obj}::read`, 'group');
      visibilitys.set(`${obj}::write`, 'owner');
    }
  }
  return visibilitys.get(k);
}

async function getVisibleSql(obj, typ, id, grp, visible) {
  let visibility = visible;
  if (!visibility) {
    visibility = getVisiblity(obj, typ);
  }

  if (visibility == 'owner') {
    return ` (editby = '${id}') `;
  }
  if (visibility == 'group') {
    return ` (editby = '${id}' OR grp = '${grp}') `;
  }
  if (visibility == 'subgroup') {
    return ` (editby = '${id}' OR grp IN ('${grp}')) `;
  }
  return ' (true) ';
}

module.exports.pool = pool;
module.exports.getTableName = getTableName;
module.exports.getTableKey = getTableKey;
module.exports.getTableField = getTableField;
module.exports.getTableSummary = getTableSummary;
module.exports.getVisibleSql = getVisibleSql;
module.exports.createMysqlTable = createMysqlTable;

if (require.main === module) {
  createMysqlTable();
}
