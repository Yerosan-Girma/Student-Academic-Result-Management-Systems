const fs = require('fs');

function isMeaningfulStatement(statement) {
  return statement
    .split(/\r?\n/)
    .some((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('#');
    });
}

function splitMysqlScript(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer = [];

  for (const line of sql.split(/\r?\n/)) {
    const delimiterMatch = line.match(/^\s*DELIMITER\s+(.+?)\s*$/i);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1];
      continue;
    }

    buffer.push(line);
    const current = buffer.join('\n').trimEnd();

    if (current.endsWith(delimiter)) {
      const statement = current.slice(0, -delimiter.length).trim();
      if (isMeaningfulStatement(statement)) {
        statements.push(statement);
      }
      buffer = [];
    }
  }

  const tail = buffer.join('\n').trim();
  if (isMeaningfulStatement(tail)) {
    statements.push(tail);
  }

  return statements;
}

async function runSqlScript(connection, filePath, { log = false } = {}) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitMysqlScript(sql);

  for (const [index, statement] of statements.entries()) {
    await connection.query(statement);

    if (log) {
      const preview = statement.replace(/\s+/g, ' ').trim().slice(0, 70);
      console.log(`Executed ${index + 1}/${statements.length}: ${preview}`);
    }
  }

  return statements.length;
}

module.exports = {
  splitMysqlScript,
  runSqlScript
};
