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
63: 9. **Halaman Skala Prioritas**: [page.tsx](file:///c:/Users/NIKO/Desktop/React/Dashboard-Next-JS/src/app/(admin)/skala-prioritas/page.tsx) (Fungsionalitas modal detail tugas prioritas).
64: 
65: ---
66: 
67: ## 4. Pembaruan Hari Libur Kalender 2026 & Perbaikan Animasi Anime.js
68: 
69: Saya telah melakukan sinkronisasi serta visualisasi Hari Libur Nasional Indonesia Tahun 2026 di seluruh komponen kalender, serta merombak integrasi Anime.js agar sesuai dengan standar modular versi terbaru (v4.5.0).
70: 
71: ### 📅 Hari Libur Nasional & Sinkronisasi Kalender:
72: - **Daftar Hari Libur 2026 Resmi**: Memastikan 17 hari libur nasional 2026 (seperti Tahun Baru Masehi, Isra Mi'raj, Imlek, Hari Suci Nyepi, Idul Fitri, Wafat & Kebangkitan Yesus Kristus, Hari Buruh, Kenaikan Yesus Kristus, Idul Adha, Waisak, Hari Lahir Pancasila, Tahun Baru Islam, Proklamasi Kemerdekaan, Maulid Nabi, dan Natal) terdaftar dengan benar.
73: - **Integrasi Kalender Utama (`/calendar`)**: 
74:   - Hari libur kini di-inject ke dalam event list kalender utama secara otomatis.
75:   - Ditampilkan dengan warna aksen merah lembut (`border-rose-500 bg-rose-50`) di grid bulanan/mingguan agar terlihat jelas.
76:   - Membuka modal detail hari libur dalam format read-only (tombol Edit & Hapus disembunyikan secara otomatis) dengan detail cakupan "Semua Karyawan" dan badge kategori "Hari Libur Nasional".
77: - **Visualisasi YearView**: Seluruh tanggal hari libur nasional dan hari Minggu pada tampilan grid mini setahun (`YearView`) sekarang diwarnai merah (`text-rose-500 bg-rose-500/5`), seragam dengan mini-calendar di dashboard utama.
78: - **Penyaringan Pintar**: Hari libur akan tetap muncul di kalender bagi seluruh akun tanpa terpengaruh oleh filter status PIC, admin, atau preferensi visualisasi agenda kerja personal.
79: 
80: ### ⚡ Perbaikan Compiling & Animasi (Anime.js v4.5.0):
81: - **Named Exports**: Menyesuaikan [useAnime.ts](file:///home/niko/Desktop/Kantor/Aplikasi/NH/Dashboard/src/hooks/useAnime.ts) dengan standard ES Modules animejs v4.5.0 (`import { animate, stagger } from "animejs"`).
82: - **Perubahan Parameter**: Memperbaiki pemanggilan fungsi agar sesuai dengan signatur v4 `animate(targets, parameters)`.
83: - **TypeScript & Build Clean**: Kode Next.js berhasil dikompilasi (build) dan di-lint dengan sukses 100% tanpa kendala tipe atau modul missing.
84: 
