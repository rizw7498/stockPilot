import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Search,
  Check,
  CheckSquare,
  Square,
  ShieldAlert,
  Copy,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Skeleton from '../../components/ui/Skeleton';
import Tooltip from '../../components/ui/Tooltip';

export default function Roles() {
  const { user } = useAuth();
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({ modules: {}, allPermissions: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRolesAndCatalog = async () => {
    try {
      setLoading(true);
      const [rolesRes, catRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions-catalog'),
      ]);

      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(rolesRes.data[0]._id);
        }
      }
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

  const selectedRole = roles.find((r) => r._id === selectedRoleId) || roles[0];
  const totalCatalogPerms = catalog.allPermissions?.length || 46;

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

  const handleDuplicate = (role) => {
    setEditingRole(null);
    setRoleName(`${role.name} (Copy)`);
    setSelectedPermissions([...(role.permissions || [])]);
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
        const res = await api.post('/roles', {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        toast.success(`Role "${roleName}" created successfully!`);
        if (res.data?._id) setSelectedRoleId(res.data._id);
      }
      setModalOpen(false);
      fetchRolesAndCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/roles/${roleToDelete._id}`);
      toast.success(`Role "${roleToDelete.name}" removed successfully`);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      fetchRolesAndCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="220px" height="28px" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="64px" />
            ))}
          </div>
          <div className="md:col-span-8">
            <Skeleton height="380px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Roles & Permissions
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">Dynamic RBAC</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Configure dynamic roles, module capabilities, and tenant-scoped security policies.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={openCreateModal}
        >
          Create Role
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            Available Roles ({roles.length})
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole?._id === r._id;
              const permCount = r.permissions?.length || 0;

              return (
                <div
                  key={r._id}
                  onClick={() => setSelectedRoleId(r._id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'glass-2 border-blue-500/50 bg-blue-500/[0.08] shadow-sm'
                      : 'glass-3 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                        r.isSystem
                          ? 'bg-slate-800 border-white/10 text-slate-400'
                          : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                      }`}
                    >
                      {r.isSystem ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-100 truncate">
                          {r.name}
                        </span>
                        {r.isSystem && (
                          <span className="mono-chip text-[9px] text-slate-400">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {permCount} / {totalCatalogPerms} capabilities
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected
                        ? 'text-blue-400 translate-x-0.5'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Role Detail Panel & Matrix (8 cols) */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <GlassCard
              title={
                <div className="flex items-center gap-2.5">
                  <span>{selectedRole.name}</span>
                  {selectedRole.isSystem ? (
                    <span className="mono-chip text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> System Managed
                    </span>
                  ) : (
                    <span className="mono-chip text-[10px] text-emerald-400">
                      Custom Tenant Role
                    </span>
                  )}
                </div>
              }
              subtitle="Assigned permissions and functional operational limits"
              headerAction={
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Copy}
                    onClick={() => handleDuplicate(selectedRole)}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => openEditModal(selectedRole)}
                  >
                    Configure
                  </Button>
                  {!selectedRole.isSystem && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => confirmDeleteRole(selectedRole)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              }
              padding="p-6"
            >
              {/* Coverage Ring & Summary */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl glass-3 border border-white/5 mb-6">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Permission Coverage
                  </div>
                  <div className="text-[26px] font-semibold text-slate-100 font-mono tracking-tight mt-0.5">
                    {selectedRole.permissions?.length || 0}{' '}
                    <span className="text-slate-500 text-sm">/ {totalCatalogPerms}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex-1 max-w-xs space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Coverage Rate</span>
                    <span>
                      {Math.round(
                        ((selectedRole.permissions?.length || 0) / (totalCatalogPerms || 1)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((selectedRole.permissions?.length || 0) / (totalCatalogPerms || 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Module Capabilities Matrix breakdown */}
              <div className="space-y-4">
                <div className="text-[12px] font-semibold text-slate-200">
                  Assigned Module Matrix
                </div>

                <div className="space-y-3">
                  {Object.entries(catalog.modules || {}).map(([moduleName, perms]) => {
                    const assignedInModule = perms.filter((p) =>
                      selectedRole.permissions?.includes(p)
                    );
                    const isAll = assignedInModule.length === perms.length && perms.length > 0;
                    const isNone = assignedInModule.length === 0;

                    return (
                      <div
                        key={moduleName}
                        className="p-3.5 rounded-lg border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-[140px]">
                          <div className="text-[12px] font-semibold text-slate-200 capitalize">
                            {moduleName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {assignedInModule.length} of {perms.length} active
                          </div>
                        </div>

                        {/* Pills of assigned permissions */}
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {isNone ? (
                            <span className="text-[11px] text-slate-500 italic">
                              No permissions granted in this domain
                            </span>
                          ) : (
                            perms.map((p) => {
                              const active = selectedRole.permissions?.includes(p);
                              return (
                                <span
                                  key={p}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                                    active
                                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                      : 'bg-white/[0.02] text-slate-600 border-white/5 line-through opacity-40'
                                  }`}
                                >
                                  {p.split(':')[1] || p}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="glass-2 rounded-xl p-12 text-center text-slate-400">
              Select a role to inspect its permissions.
            </div>
          )}
        </div>
      </div>

      {/* Role Create / Edit Modal (Max-w-4xl Matrix Editor) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-4xl"
        title={editingRole ? `Configure Role: ${editingRole.name}` : 'Create Dynamic Role'}
        subtitle="Grant granular read, write, execution, and admin capabilities"
        footer={
          <>
            <div className="text-xs text-slate-400 font-mono mr-auto">
              Selected: {selectedPermissions.length} / {totalCatalogPerms}
            </div>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveRole}
              loading={saving}
            >
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role Name"
              required
              placeholder="e.g. Inventory Supervisor, Billing Clerk"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={editingRole?.isSystem && !user?.isSuperAdmin}
            />

            <Input
              label="Search Permissions"
              icon={Search}
              placeholder="Filter by keyword (e.g. read, delete, stock)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Module Permission Matrix */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {Object.entries(catalog.modules || {}).map(([moduleName, perms]) => {
              const filteredPerms = perms.filter(
                (p) =>
                  !searchFilter.trim() ||
                  p.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  moduleName.toLowerCase().includes(searchFilter.toLowerCase())
              );

              if (filteredPerms.length === 0) return null;

              const allModuleSelected = perms.every((p) => selectedPermissions.includes(p));
              const someModuleSelected =
                perms.some((p) => selectedPermissions.includes(p)) && !allModuleSelected;

              return (
                <div
                  key={moduleName}
                  className="p-4 rounded-xl glass-3 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-100 capitalize">
                        {moduleName} Module
                      </span>
                      <span className="mono-chip text-[10px] text-slate-400">
                        {perms.length} actions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModulePermissions(moduleName)}
                      className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {allModuleSelected ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>Deselect all</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-500" />
                          <span>Select all</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredPerms.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm);
                      return (
                        <div
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-200 font-medium'
                              : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
                          />
                          <span className="font-mono text-[11px] truncate" title={perm}>
                            {perm}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteRole}
        loading={deleting}
        title="Delete Dynamic Role"
        message={`Are you sure you want to permanently remove the role "${roleToDelete?.name}"? Any users assigned to this role must be reassigned.`}
      />
    </div>
  );
}
