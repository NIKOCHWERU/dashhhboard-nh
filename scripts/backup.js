const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

// Read and parse .env manually
const envPath = path.join(__dirname, "../.env");
let databaseUrl = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_URL=["']?(.+?)["']?$/m);
  if (match) {
    databaseUrl = match[1];
  }
}

if (!databaseUrl) {
  console.error("Error: DATABASE_URL not found in .env");
  process.exit(1);
}

// Parse MySQL Connection String
// format: mysql://username:password@host:port/database
try {
  const dbUrlObj = new URL(databaseUrl);
  const username = dbUrlObj.username;
  const password = decodeURIComponent(dbUrlObj.password);
  const host = dbUrlObj.hostname || "localhost";
  const port = dbUrlObj.port || "3306";
  const database = dbUrlObj.pathname.replace(/^\//, "");

  if (!username || !database) {
    throw new Error("Invalid connection credentials");
  }

  // Define backup paths
  const backupsDir = path.join(__dirname, "../backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-"); // format YYYY-MM-DD_HH-MM-SS

  const baseFilename = `db_backup_${timestamp}.sql`;
  const sqlFilePath = path.join(backupsDir, baseFilename);
  const gzipFilePath = `${sqlFilePath}.gz`;

  console.log(`Starting backup for database: ${database}...`);

  // Run mysqldump securely with MYSQL_PWD
  const cmd = `mysqldump -u ${username} -h ${host} -P ${port} ${database} > "${sqlFilePath}"`;
  execSync(cmd, {
    env: {
      ...process.env,
      MYSQL_PWD: password
    }
  });

  if (!fs.existsSync(sqlFilePath) || fs.statSync(sqlFilePath).size === 0) {
    throw new Error("SQL dump file is empty or was not created");
  }

  // Gzip the file
  console.log("Compressing dump file...");
  execSync(`gzip "${sqlFilePath}"`);

  if (!fs.existsSync(gzipFilePath)) {
    throw new Error("Gzip compression failed");
  }

  const fileSizeMB = (fs.statSync(gzipFilePath).size / (1024 * 1024)).toFixed(2);
  console.log(`Backup completed successfully: ${path.basename(gzipFilePath)} (${fileSizeMB} MB)`);

  // Prune backups older than the last 30
  const files = fs.readdirSync(backupsDir)
    .filter(file => file.startsWith("db_backup_") && file.endsWith(".sql.gz"))
    .map(file => ({
      name: file,
      path: path.join(backupsDir, file),
      time: fs.statSync(path.join(backupsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Newest first

  if (files.length > 30) {
    console.log("Pruning old backups...");
    const toDelete = files.slice(30);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`Deleted old backup: ${file.name}`);
    });
  }

  // Log activity in the database
  const prisma = new PrismaClient();
  prisma.activityLog.create({
    data: {
      action: "BACKUP",
      target: "DATABASE",
      details: `Backup otomatis berhasil dibuat: ${path.basename(gzipFilePath)} (${fileSizeMB} MB)`
    }
  }).then(() => {
    console.log("Logged success to Database Activity Log.");
    prisma.$disconnect();
  }).catch((err) => {
    console.error("Failed to log activity to database:", err);
    prisma.$disconnect();
  });

} catch (error) {
  console.error("Database backup failed:", error.message);
  
  // Log failure
  const prisma = new PrismaClient();
  prisma.activityLog.create({
    data: {
      action: "BACKUP",
      target: "DATABASE",
      details: `Backup gagal: ${error.message}`
    }
  }).finally(() => {
    prisma.$disconnect();
    process.exit(1);
  });
}
