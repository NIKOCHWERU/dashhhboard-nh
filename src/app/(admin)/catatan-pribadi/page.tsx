'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ActiveTab = 'calon' | 'klien' | 'interaksi';
type InteraksiSubTab = 'konten' | 'si';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: string;
  dir: SortDir;
}

interface CalonKlien {
  id: string;
  tanggal: string;
  namaProspek: string;
  potensiPekerjaan: string;
  domisili: string;
  email: string;
  mediaSosial: string;
  telephone: string;
  kategoriManit: string;
  kegiatanDilakukan: string;
  tantangan: string;
  informasiPenting: string;
  keterangan: string;
  catatan: string;
}

interface Klien {
  id: string;
  namaKlien: string;
  sumber: string;
  nomorInvoice: string;
  jenisPekerjaan: string;
  telephone: string;
  statusPembayaran: string;
  posisiProgres: string;
  statusPekerjaan: string;
  informasiLain: string;
  pencairan: string;
  keterangan: string;
  catatan: string;
}

interface KontenInteraksi {
  id: string;
  tanggal: string;
  topik: string;
  judul: string;
  pembahasan: string;
  asalMateri: string;
  isiKonten: string;
  targetAudien: string;
  tipe: string;
  statusPengerjaan: string;
  kataKunci: string;
  bentukKonten: string;
  saluranDistribusi: string;
  catatan: string;
  keteranganPublis: string;
}

interface SuratIntroduksi {
  id: string;
  klienId: string;
  namaKlien?: string;
  keterangan: string;
  webViewLink?: string;
  fileName?: string;
}

// ─── EMPTY FORM FACTORIES ─────────────────────────────────────────────────────

const emptyCalonKlien = (): Omit<CalonKlien, 'id'> => ({
  tanggal: '',
  namaProspek: '',
  potensiPekerjaan: '',
  domisili: '',
  email: '',
  mediaSosial: '',
  telephone: '',
  kategoriManit: '',
  kegiatanDilakukan: '',
  tantangan: '',
  informasiPenting: '',
  keterangan: '',
  catatan: '',
});

const emptyKlien = (): Omit<Klien, 'id'> => ({
  namaKlien: '',
  sumber: '',
  nomorInvoice: '',
  jenisPekerjaan: '',
  telephone: '',
  statusPembayaran: '',
  posisiProgres: '',
  statusPekerjaan: '',
  informasiLain: '',
  pencairan: '',
  keterangan: '',
  catatan: '',
});

const emptyKonten = (): Omit<KontenInteraksi, 'id'> => ({
  tanggal: '',
  topik: '',
  judul: '',
  pembahasan: '',
  asalMateri: '',
  isiKonten: '',
  targetAudien: '',
  tipe: '',
  statusPengerjaan: '',
  kataKunci: '',
  bentukKonten: '',
  saluranDistribusi: '',
  catatan: '',
  keteranganPublis: '',
});

const emptySI = (): { klienId: string; keterangan: string; file?: File | null } => ({
  klienId: '',
  keterangan: '',
  file: null,
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sortData<T>(data: T[], sort: SortState): T[] {
  if (!sort.key) return data;
  return [...data].sort((a: any, b: any) => {
    const av = a[sort.key] ?? '';
    const bv = b[sort.key] ?? '';
    const cmp = String(av).localeCompare(String(bv), 'id', { numeric: true });
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  if (sort.key !== col)
    return <span className="ml-1 text-gray-400 opacity-40">↕</span>;
  return (
    <span className="ml-1 text-brand-500">
      {sort.dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
      <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
      <table className="min-w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

const thClass =
  'px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.03] cursor-pointer select-none whitespace-nowrap border-b border-gray-100 dark:border-white/[0.05]';

function Th({
  col, sort, onSort, children, className = '',
}: {
  col: string;
  sort: SortState;
  onSort: (c: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`${thClass} ${className}`} onClick={() => onSort(col)}>
      <span className="inline-flex items-center">
        {children}
        <SortIcon col={col} sort={sort} />
      </span>
    </th>
  );
}

const tdClass = 'px-3 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[180px] truncate align-top';

function TdSticky({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`sticky left-0 z-10 px-3 py-2.5 text-gray-700 dark:text-gray-300 font-medium bg-inherit ${className}`}>
      {children}
    </td>
  );
}

function rowBg(i: number) {
  return i % 2 === 0
    ? 'bg-white dark:bg-white/[0.02]'
    : 'bg-gray-50/50 dark:bg-white/[0.01]';
}

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
      title="Hapus"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

// ─── MODAL SHELL ──────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  onSubmit,
  children,
  loading,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[fadeInUp_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 className="text-base font-bold text-gray-800 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────

const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1';
const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors';
const textareaClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none';
const selectClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors';

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

// ─── ADD BUTTON ───────────────────────────────────────────────────────────────

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DaftarCalonKlienPage() {
  const { data: session } = useSession();

  // ── Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('calon');
  const [interaksiSubTab, setInteraksiSubTab] = useState<InteraksiSubTab>('konten');

  // ── Data
  const [calonData, setCalonData] = useState<CalonKlien[]>([]);
  const [klienData, setKlienData] = useState<Klien[]>([]);
  const [kontenData, setKontenData] = useState<KontenInteraksi[]>([]);
  const [siData, setSiData] = useState<SuratIntroduksi[]>([]);

  // ── Loading
  const [loadingCalon, setLoadingCalon] = useState(false);
  const [loadingKlien, setLoadingKlien] = useState(false);
  const [loadingKonten, setLoadingKonten] = useState(false);
  const [loadingSI, setLoadingSI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Sort
  const [sortCalon, setSortCalon] = useState<SortState>({ key: '', dir: 'asc' });
  const [sortKlien, setSortKlien] = useState<SortState>({ key: '', dir: 'asc' });
  const [sortKonten, setSortKonten] = useState<SortState>({ key: '', dir: 'asc' });
  const [sortSI, setSortSI] = useState<SortState>({ key: '', dir: 'asc' });

  // ── Modal
  type ModalMode = 'add' | 'edit' | null;
  type ModalType = 'calon' | 'klien' | 'konten' | 'si' | null;

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // ── Form state
  const [formCalon, setFormCalon] = useState(emptyCalonKlien());
  const [formKlien, setFormKlien] = useState(emptyKlien());
  const [formKonten, setFormKonten] = useState(emptyKonten());
  const [formSI, setFormSI] = useState(emptySI());
  const [kategoriManitOther, setKategoriManitOther] = useState(false);
  const [klienSearch, setKlienSearch] = useState('');
  const [klienDropdownOpen, setKlienDropdownOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fetch
  const fetchCalon = useCallback(async () => {
    setLoadingCalon(true);
    try {
      const res = await fetch('/api/calon-klien');
      if (res.ok) setCalonData(await res.json());
    } catch { /* silent */ }
    setLoadingCalon(false);
  }, []);

  const fetchKlien = useCallback(async () => {
    setLoadingKlien(true);
    try {
      const res = await fetch('/api/klien');
      if (res.ok) setKlienData(await res.json());
    } catch { /* silent */ }
    setLoadingKlien(false);
  }, []);

  const fetchKonten = useCallback(async () => {
    setLoadingKonten(true);
    try {
      const res = await fetch('/api/konten-interaksi');
      if (res.ok) setKontenData(await res.json());
    } catch { /* silent */ }
    setLoadingKonten(false);
  }, []);

  const fetchSI = useCallback(async () => {
    setLoadingSI(true);
    try {
      const res = await fetch('/api/surat-introduksi');
      if (res.ok) setSiData(await res.json());
    } catch { /* silent */ }
    setLoadingSI(false);
  }, []);

  useEffect(() => {
    fetchCalon();
    fetchKlien();
    fetchKonten();
    fetchSI();
  }, [fetchCalon, fetchKlien, fetchKonten, fetchSI]);

  // ── Sort handlers
  const handleSort = (
    key: string,
    current: SortState,
    setter: React.Dispatch<React.SetStateAction<SortState>>
  ) => {
    setter(
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  // ── Modal open helpers
  const openAdd = (type: ModalType) => {
    setModalType(type);
    setModalMode('add');
    setEditId(null);
    if (type === 'calon') { setFormCalon(emptyCalonKlien()); setKategoriManitOther(false); }
    if (type === 'klien') setFormKlien(emptyKlien());
    if (type === 'konten') setFormKonten(emptyKonten());
    if (type === 'si') { setFormSI(emptySI()); setKlienSearch(''); }
  };

  const openEdit = (type: ModalType, item: any) => {
    setModalType(type);
    setModalMode('edit');
    setEditId(item.id);
    if (type === 'calon') {
      setFormCalon({ ...item });
      const preset = ['A', 'B', 'C', 'D', 'E'];
      setKategoriManitOther(!preset.includes(item.kategoriManit));
    }
    if (type === 'klien') setFormKlien({ ...item });
    if (type === 'konten') setFormKonten({ ...item });
    if (type === 'si') {
      setFormSI({ klienId: item.klienId, keterangan: item.keterangan, file: null });
      const kl = klienData.find(k => k.id === item.klienId);
      setKlienSearch(kl?.namaKlien ?? '');
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setModalType(null);
    setEditId(null);
  };

  // ── Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (modalType === 'calon') {
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? '/api/calon-klien' : `/api/calon-klien?id=${editId}`;
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formCalon),
        });
        if (res.ok) { closeModal(); fetchCalon(); }
      }

      if (modalType === 'klien') {
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? '/api/klien' : `/api/klien?id=${editId}`;
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formKlien),
        });
        if (res.ok) { closeModal(); fetchKlien(); }
      }

      if (modalType === 'konten') {
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? '/api/konten-interaksi' : `/api/konten-interaksi?id=${editId}`;
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formKonten),
        });
        if (res.ok) { closeModal(); fetchKonten(); }
      }

      if (modalType === 'si') {
        if (modalMode === 'add') {
          const fd = new FormData();
          fd.append('klienId', formSI.klienId);
          fd.append('keterangan', formSI.keterangan);
          if (formSI.file) fd.append('file', formSI.file);
          fd.append('createdBy', (session?.user as any)?.id ?? '');
          const res = await fetch('/api/surat-introduksi', { method: 'POST', body: fd });
          if (res.ok) { closeModal(); fetchSI(); }
        } else {
          const res = await fetch(`/api/surat-introduksi?id=${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ klienId: formSI.klienId, keterangan: formSI.keterangan }),
          });
          if (res.ok) { closeModal(); fetchSI(); }
        }
      }
    } catch { /* silent */ }
    setSubmitting(false);
  };

  // ── Delete
  const handleDelete = async (type: ModalType, id: string) => {
    const labels: Record<string, string> = {
      calon: 'calon klien',
      klien: 'klien',
      konten: 'konten interaksi',
      si: 'surat introduksi',
    };
    if (!confirm(`Hapus ${labels[type!] ?? 'data'} ini? Tindakan ini tidak dapat dibatalkan.`)) return;
    const endpoints: Record<string, string> = {
      calon: '/api/calon-klien',
      klien: '/api/klien',
      konten: '/api/konten-interaksi',
      si: '/api/surat-introduksi',
    };
    const url = `${endpoints[type!]}?id=${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      if (type === 'calon') fetchCalon();
      if (type === 'klien') fetchKlien();
      if (type === 'konten') fetchKonten();
      if (type === 'si') fetchSI();
    }
  };

  // ── Sorted data
  const sortedCalon = sortData(calonData, sortCalon);
  const sortedKlien = sortData(klienData, sortKlien);
  const sortedKonten = sortData(kontenData, sortKonten);
  const sortedSI = sortData(siData, sortSI);

  // ─── CALON KLIEN FORM ───────────────────────────────────────────────────────
  const CalonForm = (
    <div className="space-y-4">
      <FormGrid>
        <FormField label="Tanggal">
          <input type="date" className={inputClass} value={formCalon.tanggal}
            onChange={e => setFormCalon(p => ({ ...p, tanggal: e.target.value }))} />
        </FormField>
        <FormField label="Nama Prospek">
          <input type="text" className={inputClass} placeholder="Nama lengkap prospek"
            value={formCalon.namaProspek}
            onChange={e => setFormCalon(p => ({ ...p, namaProspek: e.target.value }))} />
        </FormField>
        <FormField label="Potensi Pekerjaan / Perkara">
          <input type="text" className={inputClass} placeholder="Deskripsi potensi"
            value={formCalon.potensiPekerjaan}
            onChange={e => setFormCalon(p => ({ ...p, potensiPekerjaan: e.target.value }))} />
        </FormField>
        <FormField label="Domisili">
          <input type="text" className={inputClass} placeholder="Kota/Provinsi"
            value={formCalon.domisili}
            onChange={e => setFormCalon(p => ({ ...p, domisili: e.target.value }))} />
        </FormField>
        <FormField label="Email">
          <input type="email" className={inputClass} placeholder="email@domain.com"
            value={formCalon.email}
            onChange={e => setFormCalon(p => ({ ...p, email: e.target.value }))} />
        </FormField>
        <FormField label="Media Sosial">
          <input type="text" className={inputClass} placeholder="@handle / URL"
            value={formCalon.mediaSosial}
            onChange={e => setFormCalon(p => ({ ...p, mediaSosial: e.target.value }))} />
        </FormField>
        <FormField label="Telephone">
          <input type="tel" className={inputClass} placeholder="08xx-xxxx-xxxx"
            value={formCalon.telephone}
            onChange={e => setFormCalon(p => ({ ...p, telephone: e.target.value }))} />
        </FormField>
        <FormField label="Kategori MANIT (HOT A-E)">
          <select
            className={selectClass}
            value={kategoriManitOther ? '__other__' : formCalon.kategoriManit}
            onChange={e => {
              if (e.target.value === '__other__') {
                setKategoriManitOther(true);
                setFormCalon(p => ({ ...p, kategoriManit: '' }));
              } else {
                setKategoriManitOther(false);
                setFormCalon(p => ({ ...p, kategoriManit: e.target.value }));
              }
            }}
          >
            <option value="">-- Pilih Kategori --</option>
            {['A', 'B', 'C', 'D', 'E'].map(v => (
              <option key={v} value={v}>HOT {v}</option>
            ))}
            <option value="__other__">Lainnya (input manual)</option>
          </select>
          {kategoriManitOther && (
            <input type="text" className={`${inputClass} mt-2`} placeholder="Masukkan kategori manual"
              value={formCalon.kategoriManit}
              onChange={e => setFormCalon(p => ({ ...p, kategoriManit: e.target.value }))} />
          )}
        </FormField>
      </FormGrid>
      <FormField label="Kegiatan yang Sudah Dilakukan">
        <textarea rows={3} className={textareaClass} placeholder="Deskripsi kegiatan..."
          value={formCalon.kegiatanDilakukan}
          onChange={e => setFormCalon(p => ({ ...p, kegiatanDilakukan: e.target.value }))} />
      </FormField>
      <FormField label="Tantangan / Hambatan">
        <textarea rows={3} className={textareaClass} placeholder="Tantangan atau hambatan..."
          value={formCalon.tantangan}
          onChange={e => setFormCalon(p => ({ ...p, tantangan: e.target.value }))} />
      </FormField>
      <FormField label="Informasi Penting">
        <textarea rows={3} className={textareaClass} placeholder="Informasi penting..."
          value={formCalon.informasiPenting}
          onChange={e => setFormCalon(p => ({ ...p, informasiPenting: e.target.value }))} />
      </FormField>
      <FormGrid>
        <FormField label="Keterangan">
          <textarea rows={3} className={textareaClass} placeholder="Keterangan tambahan..."
            value={formCalon.keterangan}
            onChange={e => setFormCalon(p => ({ ...p, keterangan: e.target.value }))} />
        </FormField>
        <FormField label="Catatan">
          <textarea rows={3} className={textareaClass} placeholder="Catatan..."
            value={formCalon.catatan}
            onChange={e => setFormCalon(p => ({ ...p, catatan: e.target.value }))} />
        </FormField>
      </FormGrid>
    </div>
  );

  // ─── KLIEN FORM ─────────────────────────────────────────────────────────────
  const KlienForm = (
    <div className="space-y-4">
      <FormGrid>
        <FormField label="Nama Klien">
          <input type="text" className={inputClass} placeholder="Nama klien"
            value={formKlien.namaKlien}
            onChange={e => setFormKlien(p => ({ ...p, namaKlien: e.target.value }))} />
        </FormField>
        <FormField label="Sumber">
          <input type="text" className={inputClass} placeholder="Sumber referral"
            value={formKlien.sumber}
            onChange={e => setFormKlien(p => ({ ...p, sumber: e.target.value }))} />
        </FormField>
        <FormField label="Nomor Invoice">
          <input type="text" className={inputClass} placeholder="INV-XXXX"
            value={formKlien.nomorInvoice}
            onChange={e => setFormKlien(p => ({ ...p, nomorInvoice: e.target.value }))} />
        </FormField>
        <FormField label="Jenis Pekerjaan / Perkara">
          <input type="text" className={inputClass} placeholder="Jenis pekerjaan"
            value={formKlien.jenisPekerjaan}
            onChange={e => setFormKlien(p => ({ ...p, jenisPekerjaan: e.target.value }))} />
        </FormField>
        <FormField label="Telephone">
          <input type="tel" className={inputClass} placeholder="08xx-xxxx-xxxx"
            value={formKlien.telephone}
            onChange={e => setFormKlien(p => ({ ...p, telephone: e.target.value }))} />
        </FormField>
        <FormField label="Status Pembayaran">
          <input type="text" className={inputClass} placeholder="Lunas / Cicilan / Belum"
            value={formKlien.statusPembayaran}
            onChange={e => setFormKlien(p => ({ ...p, statusPembayaran: e.target.value }))} />
        </FormField>
        <FormField label="Posisi / Tindakan / Progres">
          <input type="text" className={inputClass} placeholder="Status progres"
            value={formKlien.posisiProgres}
            onChange={e => setFormKlien(p => ({ ...p, posisiProgres: e.target.value }))} />
        </FormField>
        <FormField label="Status Pekerjaan">
          <input type="text" className={inputClass} placeholder="Aktif / Selesai / dll"
            value={formKlien.statusPekerjaan}
            onChange={e => setFormKlien(p => ({ ...p, statusPekerjaan: e.target.value }))} />
        </FormField>
        <FormField label="Pencairan">
          <input type="text" className={inputClass} placeholder="Info pencairan"
            value={formKlien.pencairan}
            onChange={e => setFormKlien(p => ({ ...p, pencairan: e.target.value }))} />
        </FormField>
      </FormGrid>
      <FormField label="Informasi Lain">
        <textarea rows={3} className={textareaClass} placeholder="Informasi tambahan..."
          value={formKlien.informasiLain}
          onChange={e => setFormKlien(p => ({ ...p, informasiLain: e.target.value }))} />
      </FormField>
      <FormGrid>
        <FormField label="Keterangan">
          <textarea rows={3} className={textareaClass} placeholder="Keterangan..."
            value={formKlien.keterangan}
            onChange={e => setFormKlien(p => ({ ...p, keterangan: e.target.value }))} />
        </FormField>
        <FormField label="Catatan">
          <textarea rows={3} className={textareaClass} placeholder="Catatan..."
            value={formKlien.catatan}
            onChange={e => setFormKlien(p => ({ ...p, catatan: e.target.value }))} />
        </FormField>
      </FormGrid>
    </div>
  );

  // ─── KONTEN FORM ────────────────────────────────────────────────────────────
  const KontenForm = (
    <div className="space-y-4">
      <FormGrid>
        <FormField label="Tanggal">
          <input type="date" className={inputClass} value={formKonten.tanggal}
            onChange={e => setFormKonten(p => ({ ...p, tanggal: e.target.value }))} />
        </FormField>
        <FormField label="Topik">
          <input type="text" className={inputClass} placeholder="Topik konten"
            value={formKonten.topik}
            onChange={e => setFormKonten(p => ({ ...p, topik: e.target.value }))} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Judul">
            <input type="text" className={inputClass} placeholder="Judul konten"
              value={formKonten.judul}
              onChange={e => setFormKonten(p => ({ ...p, judul: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Tipe">
          <select className={selectClass} value={formKonten.tipe}
            onChange={e => setFormKonten(p => ({ ...p, tipe: e.target.value }))}>
            <option value="">-- Pilih Tipe --</option>
            {['SOFTSELLING', 'HARDSELLING', 'INFORMASI', 'INSPIRASI', 'TIPS/TRIK', 'STORY', 'PERINGATAN HARI'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status Pengerjaan">
          <select className={selectClass} value={formKonten.statusPengerjaan}
            onChange={e => setFormKonten(p => ({ ...p, statusPengerjaan: e.target.value }))}>
            <option value="">-- Pilih Status --</option>
            {['Antrian', 'Proses', 'Selesai', 'Publish'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Asal Materi">
          <input type="text" className={inputClass} placeholder="Sumber materi"
            value={formKonten.asalMateri}
            onChange={e => setFormKonten(p => ({ ...p, asalMateri: e.target.value }))} />
        </FormField>
        <FormField label="Target Audien">
          <input type="text" className={inputClass} placeholder="Target audien"
            value={formKonten.targetAudien}
            onChange={e => setFormKonten(p => ({ ...p, targetAudien: e.target.value }))} />
        </FormField>
        <FormField label="Kata Kunci">
          <input type="text" className={inputClass} placeholder="Kata kunci SEO"
            value={formKonten.kataKunci}
            onChange={e => setFormKonten(p => ({ ...p, kataKunci: e.target.value }))} />
        </FormField>
        <FormField label="Bentuk Konten">
          <input type="text" className={inputClass} placeholder="Video / Artikel / dll"
            value={formKonten.bentukKonten}
            onChange={e => setFormKonten(p => ({ ...p, bentukKonten: e.target.value }))} />
        </FormField>
        <FormField label="Saluran Distribusi">
          <input type="text" className={inputClass} placeholder="Instagram / YouTube / dll"
            value={formKonten.saluranDistribusi}
            onChange={e => setFormKonten(p => ({ ...p, saluranDistribusi: e.target.value }))} />
        </FormField>
      </FormGrid>
      <FormField label="Pembahasan">
        <textarea rows={3} className={textareaClass} placeholder="Isi pembahasan..."
          value={formKonten.pembahasan}
          onChange={e => setFormKonten(p => ({ ...p, pembahasan: e.target.value }))} />
      </FormField>
      <FormField label="Isi Konten">
        <textarea rows={4} className={textareaClass} placeholder="Isi konten lengkap..."
          value={formKonten.isiKonten}
          onChange={e => setFormKonten(p => ({ ...p, isiKonten: e.target.value }))} />
      </FormField>
      <FormGrid>
        <FormField label="Catatan">
          <textarea rows={3} className={textareaClass} placeholder="Catatan..."
            value={formKonten.catatan}
            onChange={e => setFormKonten(p => ({ ...p, catatan: e.target.value }))} />
        </FormField>
        <FormField label="Keterangan Publikasi">
          <textarea rows={3} className={textareaClass} placeholder="Keterangan publikasi..."
            value={formKonten.keteranganPublis}
            onChange={e => setFormKonten(p => ({ ...p, keteranganPublis: e.target.value }))} />
        </FormField>
      </FormGrid>
    </div>
  );

  // ─── SURAT INTRODUKSI FORM ──────────────────────────────────────────────────
  const filteredKlien = klienData.filter(k =>
    k.namaKlien.toLowerCase().includes(klienSearch.toLowerCase())
  );

  const SIForm = (
    <div className="space-y-4">
      <FormField label="Nama Klien">
        <div className="relative">
          <input
            type="text"
            className={inputClass}
            placeholder="Cari nama klien..."
            value={klienSearch}
            onChange={e => { setKlienSearch(e.target.value); setKlienDropdownOpen(true); }}
            onFocus={() => setKlienDropdownOpen(true)}
            onBlur={() => setTimeout(() => setKlienDropdownOpen(false), 200)}
          />
          {klienDropdownOpen && filteredKlien.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/[0.1] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredKlien.map(k => (
                <button
                  key={k.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  onMouseDown={() => {
                    setFormSI(p => ({ ...p, klienId: k.id }));
                    setKlienSearch(k.namaKlien);
                    setKlienDropdownOpen(false);
                  }}
                >
                  {k.namaKlien}
                </button>
              ))}
            </div>
          )}
        </div>
      </FormField>
      <FormField label="Keterangan">
        <textarea rows={3} className={textareaClass} placeholder="Keterangan surat..."
          value={formSI.keterangan}
          onChange={e => setFormSI(p => ({ ...p, keterangan: e.target.value }))} />
      </FormField>
      {modalMode === 'add' && (
        <FormField label="File (PDF / Dokumen)">
          <input
            ref={fileRef}
            type="file"
            className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-500/10 dark:file:text-brand-400 hover:file:bg-brand-100 transition-colors"
            onChange={e => setFormSI(p => ({ ...p, file: e.target.files?.[0] ?? null }))}
          />
        </FormField>
      )}
    </div>
  );

  // ─── BADGE HELPER ────────────────────────────────────────────────────────────
  const StatusBadge = ({ value }: { value: string }) => {
    const colors: Record<string, string> = {
      'Publish': 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      'Selesai': 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      'Proses': 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      'Antrian': 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colors[value] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'}`}>
        {value || '—'}
      </span>
    );
  };

  const KategoriManitBadge = ({ value }: { value: string }) => {
    const colors: Record<string, string> = {
      A: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      B: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      C: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      D: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
      E: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${colors[value] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'}`}>
        {value || '—'}
      </span>
    );
  };

  // ─── PANEL HEADER (tabs + button) ───────────────────────────────────────────
  const renderPanelHeader = () => {
    const tabs = [
      { key: 'calon' as ActiveTab, label: 'Calon Klien' },
      { key: 'klien' as ActiveTab, label: 'Klien' },
      { key: 'interaksi' as ActiveTab, label: 'Interaksi Klien' },
    ];

    const addLabels: Record<string, string> = {
      calon: 'Tambah Calon Klien',
      klien: 'Tambah Klien',
      interaksi: interaksiSubTab === 'konten' ? 'Tambah Konten' : 'Tambah Surat',
    };

    const handleAdd = () => {
      if (activeTab === 'calon') openAdd('calon');
      else if (activeTab === 'klien') openAdd('klien');
      else if (interaksiSubTab === 'konten') openAdd('konten');
      else openAdd('si');
    };

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Add Button */}
        <AddButton onClick={handleAdd} label={addLabels[activeTab]} />
      </div>
    );
  };

  // ─── TABLES ─────────────────────────────────────────────────────────────────

  const CalonTable = () => {
    if (loadingCalon) return <Spinner />;
    const cols = [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'namaProspek', label: 'Nama Prospek' },
      { key: 'potensiPekerjaan', label: 'Potensi Pekerjaan/Perkara' },
      { key: 'domisili', label: 'Domisili' },
      { key: 'email', label: 'Email' },
      { key: 'mediaSosial', label: 'Media Sosial' },
      { key: 'telephone', label: 'Telephone' },
      { key: 'kategoriManit', label: 'Kategori MANIT' },
      { key: 'kegiatanDilakukan', label: 'Kegiatan Dilakukan' },
      { key: 'tantangan', label: 'Tantangan/Hambatan' },
      { key: 'informasiPenting', label: 'Informasi Penting' },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'catatan', label: 'Catatan' },
    ];
    return (
      <TableWrapper>
        <thead>
          <tr>
            <th className={`${thClass} sticky left-0 z-20 w-10`} onClick={() => handleSort('id', sortCalon, setSortCalon)}>
              <span className="inline-flex items-center">NO <SortIcon col="id" sort={sortCalon} /></span>
            </th>
            {cols.map(c => (
              <Th key={c.key} col={c.key} sort={sortCalon} onSort={k => handleSort(k, sortCalon, setSortCalon)}>
                {c.label}
              </Th>
            ))}
            <th className={thClass}>AKSI</th>
          </tr>
        </thead>
        <tbody>
          {sortedCalon.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 2}>
                <EmptyState message="Belum ada data calon klien" />
              </td>
            </tr>
          ) : (
            sortedCalon.map((row, i) => (
            <tr key={row.id} className={`${rowBg(i)} hover:bg-brand-50/40 dark:hover:bg-brand-500/[0.04] transition-colors`}>
              <TdSticky className={rowBg(i)}>{i + 1}</TdSticky>
              <td className={tdClass}>{row.tanggal || '—'}</td>
              <td className={`${tdClass} font-semibold text-gray-800 dark:text-white`}>{row.namaProspek || '—'}</td>
              <td className={tdClass}>{row.potensiPekerjaan || '—'}</td>
              <td className={tdClass}>{row.domisili || '—'}</td>
              <td className={tdClass}>{row.email || '—'}</td>
              <td className={tdClass}>{row.mediaSosial || '—'}</td>
              <td className={tdClass}>{row.telephone || '—'}</td>
              <td className={`${tdClass}`}><KategoriManitBadge value={row.kategoriManit} /></td>
              <td className={`${tdClass} max-w-[200px]`}>{row.kegiatanDilakukan || '—'}</td>
              <td className={tdClass}>{row.tantangan || '—'}</td>
              <td className={tdClass}>{row.informasiPenting || '—'}</td>
              <td className={tdClass}>{row.keterangan || '—'}</td>
              <td className={tdClass}>{row.catatan || '—'}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <EditBtn onClick={() => openEdit('calon', row)} />
                  <DeleteBtn onClick={() => handleDelete('calon', row.id)} />
                </div>
              </td>
            </tr>
          )))}
        </tbody>
      </TableWrapper>
    );
  };

  const KlienTable = () => {
    if (loadingKlien) return <Spinner />;
    const cols = [
      { key: 'namaKlien', label: 'Nama Klien' },
      { key: 'sumber', label: 'Sumber' },
      { key: 'nomorInvoice', label: 'Nomor Invoice' },
      { key: 'jenisPekerjaan', label: 'Jenis Pekerjaan/Perkara' },
      { key: 'telephone', label: 'Telephone' },
      { key: 'statusPembayaran', label: 'Status Pembayaran' },
      { key: 'posisiProgres', label: 'Posisi/Tindakan/Progres' },
      { key: 'statusPekerjaan', label: 'Status Pekerjaan' },
      { key: 'informasiLain', label: 'Informasi Lain' },
      { key: 'pencairan', label: 'Pencairan' },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'catatan', label: 'Catatan' },
    ];
    return (
      <TableWrapper>
        <thead>
          <tr>
            <th className={`${thClass} sticky left-0 z-20 w-10`}>NO</th>
            {cols.map(c => (
              <Th key={c.key} col={c.key} sort={sortKlien} onSort={k => handleSort(k, sortKlien, setSortKlien)}>
                {c.label}
              </Th>
            ))}
            <th className={thClass}>AKSI</th>
          </tr>
        </thead>
        <tbody>
          {sortedKlien.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 2}>
                <EmptyState message="Belum ada data klien" />
              </td>
            </tr>
          ) : (
            sortedKlien.map((row, i) => (
            <tr key={row.id} className={`${rowBg(i)} hover:bg-brand-50/40 dark:hover:bg-brand-500/[0.04] transition-colors`}>
              <TdSticky className={rowBg(i)}>{i + 1}</TdSticky>
              <td className={`${tdClass} font-semibold text-gray-800 dark:text-white`}>{row.namaKlien || '—'}</td>
              <td className={tdClass}>{row.sumber || '—'}</td>
              <td className={tdClass}>{row.nomorInvoice || '—'}</td>
              <td className={tdClass}>{row.jenisPekerjaan || '—'}</td>
              <td className={tdClass}>{row.telephone || '—'}</td>
              <td className={tdClass}>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  row.statusPembayaran?.toLowerCase().includes('lunas')
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                }`}>
                  {row.statusPembayaran || '—'}
                </span>
              </td>
              <td className={tdClass}>{row.posisiProgres || '—'}</td>
              <td className={tdClass}>{row.statusPekerjaan || '—'}</td>
              <td className={tdClass}>{row.informasiLain || '—'}</td>
              <td className={tdClass}>{row.pencairan || '—'}</td>
              <td className={tdClass}>{row.keterangan || '—'}</td>
              <td className={tdClass}>{row.catatan || '—'}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <EditBtn onClick={() => openEdit('klien', row)} />
                  <DeleteBtn onClick={() => handleDelete('klien', row.id)} />
                </div>
              </td>
            </tr>
          )))}
        </tbody>
      </TableWrapper>
    );
  };

  const KontenTable = () => {
    if (loadingKonten) return <Spinner />;
    const cols = [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'topik', label: 'Topik' },
      { key: 'judul', label: 'Judul' },
      { key: 'pembahasan', label: 'Pembahasan' },
      { key: 'asalMateri', label: 'Asal Materi' },
      { key: 'isiKonten', label: 'Isi Konten' },
      { key: 'targetAudien', label: 'Target Audien' },
      { key: 'tipe', label: 'Tipe' },
      { key: 'statusPengerjaan', label: 'Status Pengerjaan' },
      { key: 'kataKunci', label: 'Kata Kunci' },
      { key: 'bentukKonten', label: 'Bentuk Konten' },
      { key: 'saluranDistribusi', label: 'Saluran Distribusi' },
      { key: 'catatan', label: 'Catatan' },
      { key: 'keteranganPublis', label: 'Keterangan Publikasi' },
    ];
    return (
      <TableWrapper>
        <thead>
          <tr>
            <th className={`${thClass} sticky left-0 z-20 w-10`}>NO</th>
            {cols.map(c => (
              <Th key={c.key} col={c.key} sort={sortKonten} onSort={k => handleSort(k, sortKonten, setSortKonten)}>
                {c.label}
              </Th>
            ))}
            <th className={thClass}>AKSI</th>
          </tr>
        </thead>
        <tbody>
          {sortedKonten.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 2}>
                <EmptyState message="Belum ada data konten interaksi" />
              </td>
            </tr>
          ) : (
            sortedKonten.map((row, i) => (
            <tr key={row.id} className={`${rowBg(i)} hover:bg-brand-50/40 dark:hover:bg-brand-500/[0.04] transition-colors`}>
              <TdSticky className={rowBg(i)}>{i + 1}</TdSticky>
              <td className={tdClass}>{row.tanggal || '—'}</td>
              <td className={`${tdClass} font-semibold text-gray-800 dark:text-white`}>{row.topik || '—'}</td>
              <td className={tdClass}>{row.judul || '—'}</td>
              <td className={tdClass}>{row.pembahasan || '—'}</td>
              <td className={tdClass}>{row.asalMateri || '—'}</td>
              <td className={tdClass}>{row.isiKonten || '—'}</td>
              <td className={tdClass}>{row.targetAudien || '—'}</td>
              <td className={tdClass}>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                  {row.tipe || '—'}
                </span>
              </td>
              <td className={tdClass}><StatusBadge value={row.statusPengerjaan} /></td>
              <td className={tdClass}>{row.kataKunci || '—'}</td>
              <td className={tdClass}>{row.bentukKonten || '—'}</td>
              <td className={tdClass}>{row.saluranDistribusi || '—'}</td>
              <td className={tdClass}>{row.catatan || '—'}</td>
              <td className={tdClass}>{row.keteranganPublis || '—'}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <EditBtn onClick={() => openEdit('konten', row)} />
                  <DeleteBtn onClick={() => handleDelete('konten', row.id)} />
                </div>
              </td>
            </tr>
          )))}
        </tbody>
      </TableWrapper>
    );
  };

  const SITable = () => {
    if (loadingSI) return <Spinner />;
    return (
      <TableWrapper>
        <thead>
          <tr>
            <th className={`${thClass} sticky left-0 z-20 w-10`}>NO</th>
            <Th col="namaKlien" sort={sortSI} onSort={k => handleSort(k, sortSI, setSortSI)}>Nama Klien</Th>
            <Th col="keterangan" sort={sortSI} onSort={k => handleSort(k, sortSI, setSortSI)}>Keterangan</Th>
            <th className={thClass}>File</th>
            <th className={thClass}>AKSI</th>
          </tr>
        </thead>
        <tbody>
          {sortedSI.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message="Belum ada data surat introduksi" />
              </td>
            </tr>
          ) : (
            sortedSI.map((row, i) => {
            const kl = klienData.find(k => k.id === row.klienId);
            return (
              <tr key={row.id} className={`${rowBg(i)} hover:bg-brand-50/40 dark:hover:bg-brand-500/[0.04] transition-colors`}>
                <TdSticky className={rowBg(i)}>{i + 1}</TdSticky>
                <td className={`${tdClass} font-semibold text-gray-800 dark:text-white`}>
                  {row.namaKlien ?? kl?.namaKlien ?? '—'}
                </td>
                <td className={tdClass}>{row.keterangan || '—'}</td>
                <td className="px-3 py-2.5">
                  {row.webViewLink ? (
                    <a
                      href={row.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Lihat File
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Tidak ada file</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <EditBtn onClick={() => openEdit('si', row)} />
                    <DeleteBtn onClick={() => handleDelete('si', row.id)} />
                  </div>
                </td>
              </tr>
            );
          }))}
        </tbody>
      </TableWrapper>
    );
  };

  // ─── INTERAKSI SUBTABS ───────────────────────────────────────────────────────
  const InteraksiContent = () => (
    <div>
      {/* Sub-tabs underline style */}
      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-white/[0.06] mb-5">
        {[
          { key: 'konten' as InteraksiSubTab, label: 'Konten Interaksi' },
          { key: 'si' as InteraksiSubTab, label: 'Surat Introduksi' },
        ].map(sub => (
          <button
            key={sub.key}
            onClick={() => setInteraksiSubTab(sub.key)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              interaksiSubTab === sub.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>
      {interaksiSubTab === 'konten' ? <KontenTable /> : <SITable />}
    </div>
  );

  // ─── MODAL CONTENT ──────────────────────────────────────────────────────────
  const modalIsOpen = modalMode !== null;
  const modalTitles: Record<string, string> = {
    calon: `${modalMode === 'add' ? 'Tambah' : 'Edit'} Calon Klien`,
    klien: `${modalMode === 'add' ? 'Tambah' : 'Edit'} Klien`,
    konten: `${modalMode === 'add' ? 'Tambah' : 'Edit'} Konten Interaksi`,
    si: `${modalMode === 'add' ? 'Tambah' : 'Edit'} Surat Introduksi`,
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c11]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3 font-medium uppercase tracking-wider">
            <span>CRM</span>
            <span>›</span>
            <span className="text-brand-600">Daftar Calon Klien</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Daftar Calon Klien
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola calon klien, klien aktif, dan interaksi konten NH Law Firm
          </p>
        </div>

        {/* ── Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Calon Klien"
            value={calonData.length}
            color="bg-brand-50 dark:bg-brand-500/10"
            icon={
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Klien"
            value={klienData.length}
            color="bg-brand-50 dark:bg-brand-500/10"
            icon={
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Total Interaksi"
            value={kontenData.length + siData.length}
            color="bg-brand-50 dark:bg-brand-500/10"
            icon={
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
        </div>

        {/* ── Main Panel */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
          {renderPanelHeader()}

          {/* ── Table Content */}
          {activeTab === 'calon' && <CalonTable />}
          {activeTab === 'klien' && <KlienTable />}
          {activeTab === 'interaksi' && <InteraksiContent />}
        </div>

      </div>

      {/* ── Modal */}
      {modalIsOpen && modalType && (
        <Modal
          title={modalTitles[modalType]}
          onClose={closeModal}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          {modalType === 'calon' && CalonForm}
          {modalType === 'klien' && KlienForm}
          {modalType === 'konten' && KontenForm}
          {modalType === 'si' && SIForm}
        </Modal>
      )}

      {/* ── Keyframe animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
