"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check } from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  position?: string;
}

interface PicSelectProps {
  label?: string;
  users: UserItem[];
  selectedValues: string[]; // List of selected names or emails
  onChange: (selected: string[]) => void;
  placeholder?: string;
  valueKey?: "name" | "email"; // Whether selectedValues stores name or email
}

// Function to generate professional background gradient based on name hash
const getAvatarBg = (name: string) => {
  const colors = [
    "from-blue-500 to-indigo-600 text-white",
    "from-emerald-500 to-teal-600 text-white",
    "from-purple-500 to-indigo-600 text-white",
    "from-rose-500 to-pink-600 text-white",
    "from-amber-500 to-orange-600 text-white",
    "from-violet-500 to-purple-600 text-white",
    "from-cyan-500 to-blue-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function PicSelect({
  label,
  users = [],
  selectedValues = [],
  onChange,
  placeholder = "Pilih Karyawan PIC...",
  valueKey = "name",
}: PicSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query) || false;
    const emailMatch = u.email?.toLowerCase().includes(query) || false;
    const posMatch = u.position?.toLowerCase().includes(query) || false;
    return nameMatch || emailMatch || posMatch;
  });

  const toggleSelect = (user: UserItem) => {
    const identifier = user[valueKey] || user.name || "";
    if (!identifier) return;

    let nextSelected: string[];
    if (selectedValues.includes(identifier)) {
      nextSelected = selectedValues.filter((val) => val !== identifier);
    } else {
      nextSelected = [...selectedValues, identifier];
    }
    onChange(nextSelected);
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((item) => item !== val));
  };

  // Find user details by selected value
  const getSelectedUsers = () => {
    return selectedValues
      .map((val) => {
        return users.find((u) => (u[valueKey] || u.name) === val);
      })
      .filter(Boolean) as UserItem[];
  };

  const selectedUsers = getSelectedUsers();

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Select Field / Badge Wrapper */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[44px] px-3 py-2 border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1a1d27] hover:border-brand-500/60 dark:hover:border-brand-500/50 rounded-xl cursor-pointer transition-all flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-brand-500/20"
      >
        {selectedUsers.length === 0 ? (
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1">
            {placeholder}
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedUsers.map((user) => {
              const name = user.name || "";
              const identifier = user[valueKey] || name;
              const hasImage = !!user.image;

              return (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 text-[10px] font-bold uppercase tracking-wide shadow-sm"
                >
                  {hasImage ? (
                    <img
                      src={user.image!}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-4.5 h-4.5 rounded-full object-cover border border-brand-200/50 dark:border-brand-550/20"
                    />
                  ) : (
                    <span
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[7px] font-black bg-gradient-to-br ${getAvatarBg(
                        name
                      )}`}
                    >
                      {getInitials(name)}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">{name}</span>
                  <button
                    type="button"
                    onClick={(e) => removeValue(identifier, e)}
                    className="hover:bg-brand-500/20 p-0.5 rounded-full text-brand-400 hover:text-brand-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[999] left-0 right-0 mt-1.5 bg-white dark:bg-[#0f1118] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden p-3 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1a1d27] text-gray-700 dark:text-white outline-none focus:border-brand-500 text-xs font-semibold rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-650"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List options */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto no-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">
                Tidak ada karyawan ditemukan
              </div>
            ) : (
              filteredUsers.map((user) => {
                const name = user.name || "No Name";
                const identifier = user[valueKey] || name;
                const isSelected = selectedValues.includes(identifier);
                const hasImage = !!user.image;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleSelect(user)}
                    className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors rounded-xl gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {hasImage ? (
                        <img
                          src={user.image!}
                          alt={name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black bg-gradient-to-br ${getAvatarBg(
                            name
                          )}`}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wide truncate">
                          {name}
                        </h4>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold truncate">
                          {user.position || user.email || "-"}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex-shrink-0 w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
