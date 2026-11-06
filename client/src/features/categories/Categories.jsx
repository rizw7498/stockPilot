import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { Layers, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/categories', {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(`Category "${name}" created!`);
      setModalOpen(false);
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (cat) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete._id}`);
      toast.success('Category removed');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      render: (catName) => (
        <span className="font-semibold text-slate-100">{catName}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (desc) => (
        <span className="text-xs text-slate-400">{desc || 'No description provided'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          onClick={() => confirmDelete(row)}
          className="text-slate-400 hover:text-rose-400"
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Product Categories
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Organize catalog inventory into groups for structured filtering and reporting.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyTitle="No categories found"
        emptyDescription="Create your first catalog category to start organizing items."
        className="flex-1"
      />

      {/* Add Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title="Add Product Category"
        subtitle="Logical classification for catalog items"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={submitting}
            >
              Save Category
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Consumer Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Description"
            placeholder="e.g. Peripherals, cables, and smart office accessories"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? Assigned products will become unassigned.`}
      />
    </div>
  );
}
