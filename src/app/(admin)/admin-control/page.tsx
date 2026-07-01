"use client";
import React, { useState, useEffect } from "react";
import { Search, RotateCw, ShieldAlert, FileText, CheckCircle2, UserCheck, ToggleLeft, ToggleRight } from "lucide-react";

interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

interface UserPermissions {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  canCreateAgenda: boolean;
  canManageHRM: boolean;
  canManageRetainer: boolean;
  canManagePerorangan: boolean;
  canAccessPekerjaan: boolean;
  canAccessDokumentasi: boolean;
  canAccessPengumuman: boolean;
  canAccessArsip: boolean;
  canAccessTenagaKerja: boolean;
  canManageLegal: boolean;
}

export default function AdminControlPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "permissions" | "backup">("logs");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [backupSubmitting, setBackupSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "logs") {
        const res = await fetch("/api/admin/activities");
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else if (activeTab === "permissions") {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === "backup") {
        const res = await fetch("/api/admin/backup");
        if (!res.ok) throw new Error("Failed to fetch backups");
        const data = await res.json();
        setBackups(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setBackupSubmitting(true);
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger backup");
      alert("Backup database berhasil dibuat!");
      // Reload backups list
      const reloadRes = await fetch("/api/admin/backup");
      if (reloadRes.ok) {
        setBackups(await reloadRes.json());
      }
    } catch (err: any) {
      alert("Gagal membuat backup: " + err.message);
    } finally {
      setBackupSubmitting(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus backup "${filename}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/backup?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete backup");
      alert("Backup database berhasil dihapus!");
      setBackups(prev => prev.filter(b => b.filename !== filename));
    } catch (err: any) {
      alert("Gagal menghapus backup: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin melakukan restore database dari file "${filename}"? Tindakan ini akan menimpa seluruh data saat ini.`)) return;
    try {
      setBackupSubmitting(true);
      const res = await fetch(`/api/admin/backup?filename=${encodeURIComponent(filename)}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore database");
      alert("Database berhasil di-restore/di-import!");
    } catch (err: any) {
      alert("Gagal melakukan restore: " + err.message);
    } finally {
      setBackupSubmitting(false);
    }
  };

  const handleUploadImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin mengunggah dan mengimport file "${file.name}" ke database? Tindakan ini akan menimpa seluruh data saat ini.`)) {
      e.target.value = "";
      return;
    }

    try {
      setBackupSubmitting(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/backup", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import database file");
      
      alert("Database berhasil di-import dari file SQL yang diunggah!");
      
      // Reload backups list
      const reloadRes = await fetch("/api/admin/backup");
      if (reloadRes.ok) {
        setBackups(await reloadRes.json());
      }
    } catch (err: any) {
      alert("Gagal melakukan import file SQL: " + err.message);
    } finally {
      setBackupSubmitting(false);
      e.target.value = "";
    }
  };

  const handleToggle = (userId: string, field: keyof UserPermissions) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, [field]: !u[field] };
        }
        return u;
      })
    );
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  };

  const saveUserPermissions = async (user: UserPermissions) => {
    try {
      setSavingUser(user.id);
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          role: user.role,
          canCreateAgenda: user.canCreateAgenda,
          canManageHRM: user.canManageHRM,
          canManageRetainer: user.canManageRetainer,
          canManagePerorangan: user.canManagePerorangan,
          canAccessPekerjaan: user.canAccessPekerjaan,
          canAccessDokumentasi: user.canAccessDokumentasi,
          canAccessPengumuman: user.canAccessPengumuman,
          canAccessArsip: user.canAccessArsip,
          canAccessTenagaKerja: user.canAccessTenagaKerja,
          canManageLegal: user.canManageLegal,
        }),
      });

      if (!res.ok) throw new Error("Failed to update user permissions");
      alert("Izin pengguna berhasil diperbarui!");
    } catch (err) {
      alert("Gagal memperbarui izin.");
    } finally {
      setSavingUser(null);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-550/20";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-550/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-550/20";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-550/20";
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      (log.userName && log.userName.toLowerCase().includes(query)) ||
      log.action.toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query)
    );
  });

  // Reusable component for the custom switch toggle
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-0 select-none ${
          checked ? "bg-brand-500" : "bg-gray-250 dark:bg-gray-800"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 md:px-3">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-wider">
            Manajemen Akses & Monitoring
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pantau log aktivitas CRUD seluruh sistem secara real-time dan kelola hak akses tenaga kerja secara terpusat.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-850 rounded-xl w-fit">
        <button
          onClick={() => {
            setActiveTab("logs");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
            activeTab === "logs"
              ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
              : "text-gray-550 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Log Aktivitas
        </button>
        <button
          onClick={() => {
            setActiveTab("permissions");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
            activeTab === "permissions"
              ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
              : "text-gray-550 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Kontrol Akses
        </button>
        <button
          onClick={() => {
            setActiveTab("backup");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
            activeTab === "backup"
              ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
              : "text-gray-550 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Backup Database
        </button>
      </div>

      {activeTab === "logs" ? (
        // ACTIVITY LOGS VIEW
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari log berdasarkan user, aksi, atau detail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-gray-800 dark:text-gray-200"
              />
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-850 hover:border-brand-500/35 transition-all rounded-xl uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-24 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Log...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20 text-xs text-gray-400 font-bold uppercase tracking-wider italic">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/20 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Waktu & Tanggal</th>
                      <th className="p-4">Pengguna (User)</th>
                      <th className="p-4">Aksi</th>
                      <th className="p-4">Modul Target</th>
                      <th className="p-4 pr-6">Rincian Perubahan (Details)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.003] even:bg-gray-50/15 dark:even:bg-white/[0.001] transition-colors">
                        <td className="p-4 pl-6 font-semibold whitespace-nowrap text-gray-450 dark:text-gray-500">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-black text-gray-900 dark:text-white whitespace-nowrap">
                          {log.userName || "System / Guest"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-black uppercase text-[10px] text-brand-500 whitespace-nowrap">
                          {log.target}
                        </td>
                        <td className="p-4 pr-6 font-semibold text-gray-650 dark:text-gray-400 min-w-[250px] leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "permissions" ? (
        // ACCESS PERMISSIONS VIEW
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Pengguna...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-400 font-bold uppercase tracking-wider italic">
              Tidak ada data tenaga kerja ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/20 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Nama & Email Tenaga Kerja</th>
                    <th className="p-4">Role Utama</th>
                    <th className="p-4 text-center whitespace-nowrap">Atur Jadwal</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses HRM</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Retainer</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Perorangan</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Pekerjaan</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Dokumentasi</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Pengumuman</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Arsip</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Tim</th>
                    <th className="p-4 text-center whitespace-nowrap">Akses Legal</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.003] even:bg-gray-50/15 dark:even:bg-white/[0.001] transition-colors">
                      {/* Name and email */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || ""}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black flex items-center justify-center text-[10px] uppercase border border-brand-500/20">
                              {(user.name || "U").substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{user.name || "No Name"}</h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{user.email || "-"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role selection */}
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-gray-800 dark:text-gray-200 cursor-pointer"
                        >
                          <option value="user">USER (Staf)</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>

                      {/* canCreateAgenda Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canCreateAgenda}
                            onChange={() => handleToggle(user.id, "canCreateAgenda")}
                          />
                        </div>
                      </td>

                      {/* canManageHRM Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canManageHRM}
                            onChange={() => handleToggle(user.id, "canManageHRM")}
                          />
                        </div>
                      </td>

                      {/* canManageRetainer Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canManageRetainer}
                            onChange={() => handleToggle(user.id, "canManageRetainer")}
                          />
                        </div>
                      </td>

                      {/* canManagePerorangan Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canManagePerorangan}
                            onChange={() => handleToggle(user.id, "canManagePerorangan")}
                          />
                        </div>
                      </td>

                      {/* canAccessPekerjaan Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canAccessPekerjaan}
                            onChange={() => handleToggle(user.id, "canAccessPekerjaan")}
                          />
                        </div>
                      </td>

                      {/* canAccessDokumentasi Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canAccessDokumentasi}
                            onChange={() => handleToggle(user.id, "canAccessDokumentasi")}
                          />
                        </div>
                      </td>

                      {/* canAccessPengumuman Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canAccessPengumuman}
                            onChange={() => handleToggle(user.id, "canAccessPengumuman")}
                          />
                        </div>
                      </td>

                      {/* canAccessArsip Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canAccessArsip}
                            onChange={() => handleToggle(user.id, "canAccessArsip")}
                          />
                        </div>
                      </td>

                      {/* canAccessTenagaKerja Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canAccessTenagaKerja}
                            onChange={() => handleToggle(user.id, "canAccessTenagaKerja")}
                          />
                        </div>
                      </td>

                      {/* canManageLegal Toggle Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center h-full">
                          <ToggleSwitch
                            checked={user.canManageLegal}
                            onChange={() => handleToggle(user.id, "canManageLegal")}
                          />
                        </div>
                      </td>

                      {/* Save Button */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          disabled={savingUser === user.id}
                          onClick={() => saveUserPermissions(user)}
                          className={`px-4 py-2 bg-brand-500 text-white text-[10px] font-black uppercase rounded-xl tracking-widest hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm shadow-brand-500/10 ${
                            savingUser === user.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {savingUser === user.id ? "Simpan..." : "Simpan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // DATABASE BACKUP VIEW
        <div className="space-y-6">
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Pengaturan Backup Database Otomatis
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Sistem secara otomatis dikonfigurasi untuk melakukan pencadangan database secara berkala. Semua berkas backup disimpan dalam format MySQL Dump terkompresi (.sql.gz).
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Backup Otomatis Terjadwal: AKTIF (Harian, Jam 00:00)</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                Untuk mendaftarkan scheduler otomatis di server Linux (cron), jalankan perintah berikut pada terminal server menggunakan user yang bersangkutan:
              </p>
              <div className="p-3 bg-gray-900 text-gray-200 font-mono text-[9px] rounded-lg overflow-x-auto select-all leading-normal border border-gray-950">
                crontab -e
                <br />
                0 0 * * * /usr/bin/node /home/niko/Desktop/Kantor/Aplikasi/NH/Dashboard/scripts/backup.js &gt;&gt; /home/niko/Desktop/Kantor/Aplikasi/NH/Dashboard/backups/backup.log 2&gt;&amp;1
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6 gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-955 dark:text-white uppercase tracking-wider">Pencadangan & Pemulihan</h4>
                <p className="text-[10px] text-gray-400 font-semibold">Buat backup baru, atau unggah file SQL/SQL.GZ untuk di-import langsung.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Upload & Import */}
                <label className="px-4 py-2 border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 text-gray-600 dark:text-gray-400 hover:text-brand-500 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2">
                  <span>Unggah & Import SQL</span>
                  <input
                    type="file"
                    accept=".sql,.gz"
                    onChange={handleUploadImport}
                    className="hidden"
                    disabled={backupSubmitting}
                  />
                </label>
                
                {/* Backup Now */}
                <button
                  onClick={handleTriggerBackup}
                  disabled={backupSubmitting}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${backupSubmitting ? "animate-spin" : ""}`} />
                  {backupSubmitting ? "Memproses..." : "Backup Sekarang"}
                </button>
              </div>
            </div>
          </div>

          {/* BACKUP HISTORY LIST */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/20">
              <h3 className="text-xs font-black text-gray-955 dark:text-white uppercase tracking-wider">
                Daftar Riwayat Cadangan (Backup History)
              </h3>
            </div>

            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Berkas Backup...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400 font-bold uppercase tracking-wider italic">
                Belum ada berkas backup database yang tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-855/10 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Waktu Pembuatan</th>
                      <th className="p-4">Nama Berkas (Filename)</th>
                      <th className="p-4">Ukuran File</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    {backups.map((b) => (
                      <tr key={b.filename} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.003] transition-colors">
                        <td className="p-4 pl-6 font-semibold text-gray-450 dark:text-gray-550">
                          {new Date(b.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-bold text-gray-900 dark:text-white font-mono text-[11px]">
                          {b.filename}
                        </td>
                        <td className="p-4 font-semibold text-brand-500">
                          {b.sizeMB} MB
                        </td>
                        <td className="p-4 pr-6 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleRestoreBackup(b.filename)}
                            disabled={backupSubmitting}
                            className="inline-flex items-center px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            Restore
                          </button>
                          <a
                            href={`/api/admin/backup?filename=${encodeURIComponent(b.filename)}`}
                            download
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          >
                            Unduh
                          </a>
                          <button
                            onClick={() => handleDeleteBackup(b.filename)}
                            disabled={backupSubmitting}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-455 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
