import sql from "mssql";

function parseConnectionString(connectionString) {
  const config = {
    authentication: {
      type: "default",
      options: {
        userName: "",
        password: "",
      },
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 30000,
    },
  };

  for (const part of connectionString.split(";").filter(Boolean)) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;

    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();

    if (key === "server") {
      const serverPart = value.replace(/^tcp:/i, "");
      const [host, port] = serverPart.split(",");
      config.server = host;
      if (port) config.port = parseInt(port, 10);
      continue;
    }

    if (key === "initial catalog") {
      config.database = value;
      continue;
    }

    if (key === "user id") {
      config.authentication.options.userName = value;
      continue;
    }

    if (key === "password") {
      config.authentication.options.password = value;
      continue;
    }

    if (key === "encrypt") {
      config.options.encrypt = value.toLowerCase() === "true";
      continue;
    }

    if (key === "trustservercertificate") {
      config.options.trustServerCertificate = value.toLowerCase() === "true";
      continue;
    }

    if (key === "connection timeout" || key === "connect timeout") {
      const timeoutSeconds = parseInt(value, 10);
      if (!Number.isNaN(timeoutSeconds) && timeoutSeconds > 0) {
        config.options.connectTimeout = timeoutSeconds * 1000;
      }
    }
  }

  return config;
}

const connectionString = process.env.TMP_AZ_SQL_CONN;
if (!connectionString) {
  console.error("TMP_AZ_SQL_CONN environment variable is not set");
  process.exit(1);
}

const config = parseConnectionString(connectionString);
const pool = new sql.ConnectionPool(config);

const sqlPatch = `
IF COL_LENGTH('dbo.users', 'passwordHash') IS NULL
BEGIN
  ALTER TABLE [dbo].[users]
  ADD [passwordHash] NVARCHAR(255) NULL;
END
`;

try {
  await pool.connect();
  await pool.request().query(sqlPatch);

  const check = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('passwordHash', 'email', 'username')
    ORDER BY COLUMN_NAME
  `);

  console.log("AUTH_COLUMNS=" + check.recordset.map((r) => r.COLUMN_NAME).join(","));
  console.log("Schema patch applied successfully");
} finally {
  await pool.close();
}
