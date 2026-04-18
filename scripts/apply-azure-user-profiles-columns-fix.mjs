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

const patchSql = `
IF OBJECT_ID(N'dbo.user_profiles', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[user_profiles] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [userId] INT NOT NULL UNIQUE,
    [heightIn] INT NULL,
    [weightLbs] INT NULL,
    [ageYears] INT NULL,
    [fitnessGoal] NVARCHAR(32) NULL,
    [goalWeightLbs] INT NULL,
    [goalDate] BIGINT NULL,
    [dailyCalorieTarget] INT NULL,
    [dailyProteinTarget] INT NULL,
    [dailyCarbsTarget] INT NULL,
    [dailyFatTarget] INT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [updatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END

IF COL_LENGTH('dbo.user_profiles', 'userId') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [userId] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'heightIn') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [heightIn] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'weightLbs') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [weightLbs] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'ageYears') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [ageYears] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'fitnessGoal') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [fitnessGoal] NVARCHAR(32) NULL;

IF COL_LENGTH('dbo.user_profiles', 'goalWeightLbs') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [goalWeightLbs] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'goalDate') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [goalDate] BIGINT NULL;

IF COL_LENGTH('dbo.user_profiles', 'dailyCalorieTarget') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [dailyCalorieTarget] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'dailyProteinTarget') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [dailyProteinTarget] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'dailyCarbsTarget') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [dailyCarbsTarget] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'dailyFatTarget') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [dailyFatTarget] INT NULL;

IF COL_LENGTH('dbo.user_profiles', 'createdAt') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_user_profiles_createdAt] DEFAULT SYSUTCDATETIME();

IF COL_LENGTH('dbo.user_profiles', 'updatedAt') IS NULL
  ALTER TABLE [dbo].[user_profiles] ADD [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_user_profiles_updatedAt] DEFAULT SYSUTCDATETIME();

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_user_profiles_userId' AND object_id = OBJECT_ID('dbo.user_profiles')
)
BEGIN
  CREATE UNIQUE INDEX [UX_user_profiles_userId] ON [dbo].[user_profiles]([userId]) WHERE [userId] IS NOT NULL;
END
`;

const config = parseConnectionString(connectionString);
const pool = new sql.ConnectionPool(config);

try {
  await pool.connect();
  await pool.request().query(patchSql);
  const result = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='user_profiles'
    ORDER BY ORDINAL_POSITION
  `);
  console.log("USER_PROFILES_COLUMNS=" + result.recordset.map((r) => r.COLUMN_NAME).join(","));
  console.log("user_profiles schema patch applied successfully");
} finally {
  await pool.close();
}
