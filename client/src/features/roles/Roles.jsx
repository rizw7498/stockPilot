import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Lock,
  ShieldAlert,
  X,
  Search,
} from 'lucide-react';

export default function Roles() {
  const { user } = useAuth();
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({ modules: {}, allPermissions: [] });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchRolesAndCatalog = async () => {
    try {
      setLoading(true);
      const [rolesRes, catRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions-catalog'),
      ]);

      if (rolesRes.success) setRoles(rolesRes.data);
      if (catRes.success) setCatalog(catRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndCatalog();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setModalOpen(true);
  };

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const toggleModulePermissions = (moduleName) => {
    const modulePerms = catalog.modules[moduleName] || [];
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((p) => !modulePerms.includes(p)));
    } else {
      const merged = Array.from(new Set([...selectedPermissions, ...modulePerms]));
      setSelectedPermissions(merged);
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error('Select at least one permission for this role');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole._id}`, {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        toast.success(`Role "${roleName}" updated successfully!`);
      } else {
        await api.post('/roles', {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        toast.success(`Role "${roleName}" created successfully!`);
      }
      setModalOpen(false);
      fetchRolesAndCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem && !user?.isSuperAdmin) {
      toast.error('System roles cannot be deleted');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/roles/${role._id}`);
      toast.success(`Role "${role.name}" removed successfully`);
      fetchRolesAndCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Roles & Permissions
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              Dynamic RBAC
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create custom granular roles with fine-grained access control across modules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Dynamic Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map((r) => (
          <div
            key={r._id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{r.name}</h3>
                </div>
                {r.isSystem ? (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> System
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Custom
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mb-4">
                Granted <span className="font-bold text-slate-800">{r.permissions?.length || 0}</span> permission keys.
              </div>

              {/* Permission pill tags */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                {r.permissions?.slice(0, 8).map((perm, pIdx) => (
                  <span
                    key={pIdx}
                    className="text-[10px] font-medium bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md"
                  >
                    {perm}
                  </span>
                ))}
                {(r.permissions?.length || 0) > 8 && (
                  <span className="text-[10px] font-bold text-blue-600 px-1 py-0.5">
                    +{r.permissions.length - 8} more...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => openEditModal(r)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Configure
              </button>

              {!r.isSystem && (
                <button
                  onClick={() => handleDeleteRole(r)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Dynamic Custom Role'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign granular functional permissions to this role.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRole} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    disabled={editingRole?.isSystem && !user?.isSuperAdmin}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Regional Warehouse Auditor"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-700 tracking-wider block">
                      Permissions Matrix ({selectedPermissions.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPermissions(
                          selectedPermissions.length === catalog.allPermissions.length
                            ? []
                            : [...catalog.allPermissions]
                        )
                      }
                      className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedPermissions.length === catalog.allPermissions.length
                        ? 'Deselect All'
                        : 'Select All Permissions'}
                    </button>
                  </div>

                  {/* Modules Accordion */}
                  <div className="space-y-4">
                    {Object.entries(catalog.modules).map(([moduleName, perms]) => {
                      const allModuleSelected = perms.every((p) => selectedPermissions.includes(p));
                      const someModuleSelected =
                        perms.some((p) => selectedPermissions.includes(p)) && !allModuleSelected;

                      return (
                        <div
                          key={moduleName}
                          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              {moduleName} Module
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleModulePermissions(moduleName)}
                              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            >
                              {allModuleSelected ? 'Uncheck Group' : 'Check All Group'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map((perm) => {
                              const isChecked = selectedPermissions.includes(perm);
                              return (
                                <button
                                  type="button"
                                  key={perm}
                                  onClick={() => togglePermission(perm)}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer border ${
                                    isChecked
                                      ? 'bg-blue-50 text-blue-900 border-blue-200 font-semibold'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/80'
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate">{perm}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? 'Saving Role...' : 'Save Role Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
