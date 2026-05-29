"use client";
import React, { useState, useEffect } from "react";

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
}

export default function AdminControlPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "permissions">("logs");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      } else {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "DELETE":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Admin Control & Monitoring</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pantau log aktivitas CRUD seluruh sistem secara real-time dan kelola hak akses karyawan secara terpusat.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-stroke dark:border-strokedark">
        <button
          onClick={() => {
            setActiveTab("logs");
            setSearchQuery("");
          }}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all ${
            activeTab === "logs"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
          }`}
        >
          📝 Log Aktivitas Sistem
        </button>
        <button
          onClick={() => {
            setActiveTab("permissions");
            setSearchQuery("");
          }}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all ${
            activeTab === "permissions"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
          }`}
        >
          🔐 Kontrol Akses Karyawan
        </button>
      </div>

      {activeTab === "logs" ? (
        // ACTIVITY LOGS VIEW
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Cari log berdasarkan user, aksi, atau detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-semibold rounded-none w-full max-w-md focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={fetchData}
              className="px-3 py-2 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-none uppercase"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400 italic">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Waktu & Tanggal</th>
                      <th className="p-4">Pengguna (User)</th>
                      <th className="p-4">Aksi</th>
                      <th className="p-4">Modul Target</th>
                      <th className="p-4 pr-6">Rincian Perubahan (Details)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark text-xs text-gray-700 dark:text-gray-300">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="p-4 pl-6 font-semibold whitespace-nowrap text-gray-500">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-bold text-black dark:text-white whitespace-nowrap">
                          {log.userName || "System / Guest"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black border uppercase tracking-wider ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold uppercase text-[10px] text-brand-500 whitespace-nowrap">
                          {log.target}
                        </td>
                        <td className="p-4 pr-6 font-medium text-gray-600 dark:text-gray-400 min-w-[250px]">
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
      ) : (
        // ACCESS PERMISSIONS VIEW
        <div className="border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-400 italic">
              Tidak ada data karyawan ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Nama & Email Karyawan</th>
                    <th className="p-4">Role Utama</th>
                    <th className="p-4 text-center">Atur Jadwal</th>
                    <th className="p-4 text-center">Akses HRM</th>
                    <th className="p-4 text-center">Akses Retainer</th>
                    <th className="p-4 text-center">Akses Perorangan</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark text-xs text-gray-700 dark:text-gray-300">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      {/* Name and email */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt={user.name || ""} className="w-8 h-8 rounded-none object-cover border border-stroke" />
                          ) : (
                            <div className="w-8 h-8 rounded-none bg-brand-50 text-brand-500 font-bold flex items-center justify-center text-[10px] uppercase">
                              {(user.name || "U").substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-black dark:text-white line-clamp-1">{user.name || "No Name"}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{user.email || "-"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role selection */}
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-bold uppercase rounded-none focus:outline-none focus:border-brand-500"
                        >
                          <option value="user">USER (Staf)</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>

                      {/* canCreateAgenda Toggle */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={user.canCreateAgenda}
                          onChange={() => handleToggle(user.id, "canCreateAgenda")}
                          className="w-4 h-4 text-brand-500 border-stroke rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                        />
                      </td>

                      {/* canManageHRM Toggle */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={user.canManageHRM}
                          onChange={() => handleToggle(user.id, "canManageHRM")}
                          className="w-4 h-4 text-brand-500 border-stroke rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                        />
                      </td>

                      {/* canManageRetainer Toggle */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={user.canManageRetainer}
                          onChange={() => handleToggle(user.id, "canManageRetainer")}
                          className="w-4 h-4 text-brand-500 border-stroke rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                        />
                      </td>

                      {/* canManagePerorangan Toggle */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={user.canManagePerorangan}
                          onChange={() => handleToggle(user.id, "canManagePerorangan")}
                          className="w-4 h-4 text-brand-500 border-stroke rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                        />
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          disabled={savingUser === user.id}
                          onClick={() => saveUserPermissions(user)}
                          className={`px-3 py-1 bg-brand-500 text-white text-[10px] font-black uppercase rounded-none tracking-wider hover:bg-brand-600 transition-colors shadow-sm ${
                            savingUser === user.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {savingUser === user.id ? "Menyimpan..." : "Simpan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
