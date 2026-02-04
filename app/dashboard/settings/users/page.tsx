'use client';

import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useCabangStore } from '@/stores/useCabangStore';

export default function UsersPage() {
  const {
    users,
    loading,
    formData,
    editingUserId,
    showModal,
    fetchUsers,
    setFormData,
    setEditingUser,
    resetForm,
    createUser,
    updateUser,
    deleteUser,
    setShowModal,
  } = useUserStore();

  const { cabangs, fetchCabangs } = useCabangStore();

  useEffect(() => {
    fetchUsers();
    fetchCabangs();
  }, [fetchUsers, fetchCabangs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    
    if (editingUserId) {
      // Update existing user - only include password if filled
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        cabangId: formData.cabangId || null,
        hasMultiCabangAccess: formData.role !== 'KASIR' ? formData.hasMultiCabangAccess : false,
      };
      
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      success = await updateUser(editingUserId, updateData);
      if (success) alert('User berhasil diupdate!');
    } else {
      const createData = {
        ...formData,
        cabangId: formData.cabangId || null,
        hasMultiCabangAccess: formData.role !== 'KASIR' ? formData.hasMultiCabangAccess : false,
      };
      success = await createUser(createData as any);
      if (success) alert('User berhasil ditambahkan!');
    }
    
    if (success) {
      setShowModal(false);
    } else {
      alert(`Gagal ${editingUserId ? 'update' : 'menambah'} user`);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Yakin ingin menghapus user ${user.name}?`)) return;
    
    const success = await deleteUser(user.id);
    if (success) {
      alert('User berhasil dihapus!');
    } else {
      alert('Gagal menghapus user');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Breadcrumb + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <a href="/dashboard/settings" className="hover:text-gray-900 dark:hover:text-white transition">Settings</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">Users</span>
        </nav>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Users Table/Cards */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Cabang
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'OWNER'
                          ? 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
                          : user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          : user.role === 'MANAGER'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.hasMultiCabangAccess ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-white dark:bg-amber-200 dark:text-gray-800">
                        Semua Cabang
                      </span>
                    ) : user.cabang?.name ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {user.cabang.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Role</p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                    user.role === 'OWNER'
                      ? 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      : user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      : user.role === 'MANAGER'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                    user.isActive
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cabang</p>
                {user.hasMultiCabangAccess ? (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Semua
                  </span>
                ) : (
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {user.cabang?.name || '-'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Dibuat</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
              {editingUserId ? 'Edit User' : 'Tambah User Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUserId}
                  value={formData.email}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                {editingUserId && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email tidak bisa diubah</p>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password {editingUserId && '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) => setFormData({ password: e.target.value })}
                  autoComplete="new-password"
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={editingUserId ? '••••••••' : ''}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ role: e.target.value as any })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="KASIR">KASIR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>

              {/* Akses Cabang - untuk non-KASIR */}
              {formData.role !== 'KASIR' && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Akses Cabang
                  </label>
                  
                  {/* Toggle Akses Semua Cabang */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Akses Semua Cabang</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        User dapat mengakses semua cabang yang ada
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = !formData.hasMultiCabangAccess;
                        setFormData({ 
                          hasMultiCabangAccess: newValue,
                          cabangId: newValue ? '' : formData.cabangId 
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.hasMultiCabangAccess ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.hasMultiCabangAccess ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pilih Cabang Tertentu - hanya jika tidak akses semua */}
                  {!formData.hasMultiCabangAccess && (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Atau pilih cabang tertentu:
                      </label>
                      <select
                        value={formData.cabangId}
                        onChange={(e) => setFormData({ cabangId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">-- Tidak ada (default) --</option>
                        {cabangs.map((cabang) => (
                          <option key={cabang.id} value={cabang.id}>
                            {cabang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Cabang untuk KASIR - wajib pilih 1 */}
              {formData.role === 'KASIR' && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cabang <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.cabangId}
                    onChange={(e) => setFormData({ cabangId: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {cabangs.map((cabang) => (
                      <option key={cabang.id} value={cabang.id}>
                        {cabang.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    KASIR hanya bisa mengakses 1 cabang
                  </p>
                </div>
              )}

              <div className="flex gap-2 md:gap-3 pt-3 md:pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 md:py-2.5 text-sm md:text-base bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-base bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
