const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const TOKEN_FILE_PATH = path.join(__dirname, "src/data/gdrive-token.json");

async function main() {
  const args = process.argv.slice(2);
  const token = args[0];

  if (!token) {
    console.error("Error: Silakan masukkan Refresh Token baru.");
    console.error("Contoh: node update-gdrive-token.js 1//04kk-UdeUjl-MCgYIARAAGA...");
    process.exit(1);
  }

  const cleanToken = token.trim();
  console.log("Memulai proses update Refresh Token...");

  // 1. Update/Simpan ke database
  try {
    const systemUserId = "system_company_gdrive";
    
    // Pastikan user sistem ada
    await prisma.user.upsert({
      where: { id: systemUserId },
      update: {},
      create: {
        id: systemUserId,
        name: "Company Google Drive",
        email: "company-gdrive@narasumberhukum.online",
        role: "admin",
      },
    });

    // Simpan/Update token di tabel Account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "company_gdrive",
          providerAccountId: "company_gdrive_account",
        },
      },
      update: {
        refresh_token: cleanToken,
      },
      create: {
        userId: systemUserId,
        type: "oauth",
        provider: "company_gdrive",
        providerAccountId: "company_gdrive_account",
        refresh_token: cleanToken,
      },
    });

    console.log("✔ Sukses menyimpan token baru ke Database.");
  } catch (dbErr) {
    console.warn("⚠ Peringatan: Gagal menyimpan ke Database (mungkin tabel belum dibuat/di-sync):", dbErr.message);
    console.warn("Melanjutkan penyimpanan ke file konfigurasi lokal...");
  }

  // 2. Simpan ke fallback file JSON
  try {
    const dir = path.dirname(TOKEN_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      TOKEN_FILE_PATH,
      JSON.stringify({ refreshToken: cleanToken }, null, 2),
      "utf8"
    );
    console.log(`✔ Sukses menyimpan token baru ke file lokal: ${TOKEN_FILE_PATH}`);
  } catch (fileErr) {
    console.error("❌ Gagal menulis file token lokal:", fileErr);
  }

  console.log("\nProses selesai. Google Drive sekarang sudah terhubung dengan token baru.");
}

main()
  .catch((e) => {
    console.error("❌ Error saat menyimpan token:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
