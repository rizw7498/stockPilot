import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { UserPlus, Shield, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatusPill from '../../components/ui/StatusPill';

export default function Team() {
  const { user } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchMembersAndRoles = async () => {
    try {
      setLoading(true);
      const [memRes, rolesRes] = await Promise.all([
        api.get('/organizations/members'),
        api.get('/roles'),
      ]);

      if (memRes.success) setMembers(memRes.data);
      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) setSelectedRoleId(rolesRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndRoles();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setInviting(true);
    try {
      await api.post('/organizations/invite', {
        email: email.trim(),
        name: name.trim(),
        roleId: selectedRoleId,
      });
      toast.success(`Invitation sent to ${email}!`);
      setModalOpen(false);
      setEmail('');
      setName('');
      fetchMembersAndRoles();
    } catch (err) {
      toast.error(err.message || 'Invitation failed');
    } finally {
      setInviting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Team Member',
      render: (_, row) => {
        const initials = (row.userId?.name || row.email || 'U')
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[11px]">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-slate-100">
                {row.userId?.name || 'Pending Invite'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {row.userId?.email || row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (_, row) => (
        <span className="mono-chip text-blue-400 font-bold">
          {row.roleId?.name || row.role || 'Member'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Membership Status',
      align: 'center',
      render: (status) => <StatusPill status={status || 'ACTIVE'} />,
    },
    {
      key: 'createdAt',
      header: 'Member Since',
      align: 'right',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Team & Organization Access
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">
              {members.length} Members
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Manage organization staff memberships and assign dynamic custom roles.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={UserPlus}
          onClick={() => setModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={members}
        loading={loading}
        emptyTitle="No team members found"
        emptyDescription="Invite team members to collaborate inside this organization workspace."
      />

      {/* Invite Member Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title="Invite Team Member"
        subtitle="Send an invitation link with pre-assigned role permissions"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleInvite}
              loading={inviting}
            >
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Sarah Jenkins"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Work Email"
            type="email"
            required
            placeholder="sarah@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Select
            label="Permission Role"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} {r.isSystem ? '(System)' : '(Custom)'}
              </option>
            ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
