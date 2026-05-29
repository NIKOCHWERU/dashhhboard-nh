# Dokumen Panduan & Integrasi Fitur Baru (HRM & Dashboard)

Saya telah sukses merancang dan menerapkan seluruh permintaan fitur baru dengan kualitas premium, visual yang mewah, serta kehandalan fungsionalitas yang terintegrasi secara dinamis ke database MySQL dan Google Drive.

---

## 1. Modul "Daftar Karyawan" (HRM)

Modul **Daftar Karyawan** (`/hrm/karyawan`) telah selesai dibuat sebagai halaman manajemen kepegawaian yang sangat lengkap dan professional.

### 🌟 Fitur Unggulan:
- **Tab Pemilih Perusahaan (PT Selector)**: Di bagian atas halaman terdapat deretan tab dinamis berisi seluruh perusahaan (PT) yang saat ini terdaftar di kontrak Retainer Anda. Mengklik salah satu PT (misal: *PT A*) langsung menyaring tabel untuk menampilkan daftar karyawan dari PT tersebut secara instan.
- **Tabel 17 Kolom Komprehensif**: Menampilkan seluruh data referensi wajib:
  `NO | NAMA | NIK | NO HP | EMAIL | POSISI | DIVISI | JABATAN | ATASAN LANGSUNG | STATUS (PROBATION/PKWT/PKWTT) | TANGGAL MASUK | TANGGAL KELUAR | MASA KONTRAK | LOKASI KERJA | STATUS AKTIF | BPJS KESEHATAN | BPJS KETENAGAKERJAAN`
- **Pendaftaran Karyawan Baru & Edit Form**: Dilengkapi modal form lengkap dengan validasi dan antarmuka berkas digital terstruktur.
- **Tidy Detail View Modal**: Modal ringkasan data kepegawaian yang sangat rapi untuk melihat profil lengkap karyawan dalam satu klik tanpa mengacaukan halaman utama.

### 📂 Sistem Berkas Google Drive Terintegrasi:
Formulir pendaftaran mendukung pengunggahan berkas secara simultan langsung ke folder Google Drive perusahaan terkait:
1. **KTP**
2. **CV / Resume**
3. **Kontrak Kerja (PKWT/PKWTT)**
4. **BPJS Kesehatan**
5. **BPJS Ketenagakerjaan**
6. **SIM (Opsional)**

Sistem secara cerdas mendeteksi PT yang dipilih, mencocokkannya dengan ID Folder Google Drive klien di database, lalu secara otomatis mengunggah berkas-berkas tersebut ke subfolder khusus bernama **"Data Karyawan"** di dalam folder Google Drive milik PT tersebut. Jika PT belum memiliki folder, sistem otomatis menyimpannya di folder cadangan umum **"Dokumen Karyawan Umum"** sehingga arsip Anda tetap aman dan teratur.

---

## 2. Aksi Global "Lihat Detail" di Semua Tabel

Untuk seluruh tabel secara global di dashboard, saya telah menambahkan tombol **"Detail"** (atau link interaktif) yang memicu tampilan modal rincian data secara rapi, berkelas, dan modern.

### Halaman yang Telah Diperbarui:
1. **Retainer** (`/retainer`): Setiap kartu kontrak kini memiliki tombol **"Detail"** yang menampilkan rincian nama klien, kategori pekerjaan (HRM, Legal, Pajak), nominal kontrak terformat rupiah, jangka waktu, dan PIC.
2. **Perorangan** (`/perorangan`): Mengganti tombol placeholder `LIHAT DETAIL` dengan modal interaktif yang menguraikan rincian perkara klien individu secara terstruktur.
3. **Skala Prioritas** (`/skala-prioritas`): Mengubah kartu daftar tugas prioritas agar dapat diklik untuk menampilkan rincian tugas, tingkat urgensi (Level 1 - 5), batas deadline, dan status penyelesaian.
4. **Daftar Retainer HRM** (`/hrm/retainer`): Menambahkan tombol aksi **"Detail"** pada baris tabel untuk meninjau rincian nilai kontrak jangka panjang.
5. **Data Pelamar HRM** (`/hrm/pelamar`): Menambahkan tombol aksi **"Detail"** untuk melihat biografi pelamar, tahapan seleksi saat ini, PIC HRD, dan catatan kualifikasi.

---

## 3. Sinkronisasi Dashboard HRM

Filter pemilihan PT (Perusahaan) pada **Summary Dashboard HRM** (`/hrm`) sekarang telah tersinkronisasi 100% secara dinamis dengan database.

### Pembaruan Sinkronisasi:
- **Daftar Dropdown Dinamis**: Dropdown select di bagian kanan atas tidak lagi menggunakan data hardcoded, melainkan otomatis memuat daftar seluruh PT yang terdaftar dari database kontrak retainer Anda.
- **Kalkulasi Metrik Real-time**: Memilih salah satu PT akan langsung memicu reload data statistik, memperbarui total karyawan aktif, total resign, rata-rata KPI, sum gaji payroll, serta grafik distribusi KPI ApexCharts secara instan untuk PT tersebut.

---

## 🛠️ File-File yang Diperbarui:
1. **Sidebar Menu**: [AppSidebar.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/layout/AppSidebar.tsx) (Menambahkan menu "Daftar Karyawan" di kategori HRM).
2. **Karyawan API Route**: [route.ts](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/api/karyawan/route.ts) (Mengembangkan endpoint penanganan berkas multi-upload dan database).
3. **Halaman Karyawan**: [page.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/(admin)/hrm/karyawan/page.tsx) (Halaman manajemen karyawan premium baru).
4. **Dashboard HRM Component**: [DashboardHRM.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/components/hrm/DashboardHRM.tsx) (Sinkronisasi PT dropdown dinamis).
5. **Daftar Retainer Component**: [DaftarRetainer.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/components/hrm/DaftarRetainer.tsx) (Tombol & modal detail retainer).
6. **Data Pelamar Component**: [DataPelamar.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/components/hrm/DataPelamar.tsx) (Tombol & modal detail kandidat pelamar).
7. **Halaman Project Retainer**: [page.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/(admin)/retainer/page.tsx) (Tombol & modal detail proyek retainer).
8. **Halaman Perorangan**: [page.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/(admin)/perorangan/page.tsx) (Fungsionalitas modal detail kasus perorangan).
9. **Halaman Skala Prioritas**: [page.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/(admin)/skala-prioritas/page.tsx) (Fungsionalitas modal detail tugas prioritas).
