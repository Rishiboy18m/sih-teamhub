import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Upload, Download, Trash2, FileText, FileCode, Presentation, Folder, CheckCircle2, Image as ImageIcon, Box } from 'lucide-react';

export default function FilesView({ showToast }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('Documents');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isLeader = user?.role === 'leader';
  const categories = ['Research', 'PPT', 'Documents', 'Prototype', 'Code', 'Images', 'Final Submission'];

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/files');
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);

      const data = await apiFetch('/files/upload', {
        method: 'POST',
        body: formData
      });

      setFiles([data.file, ...files]);
      if (showToast) showToast(`File uploaded to ${selectedCategory} folder!`, 'success');
      setSelectedFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (fileId) => {
    const token = localStorage.getItem('sih_token');
    window.open(`/api/files/download/${fileId}?token=${token}`, '_blank');
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file permanently?')) return;

    try {
      await apiFetch(`/files/${fileId}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== fileId));
      if (showToast) showToast('File deleted successfully', 'info');
    } catch (err) {
      alert(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = activeFolder === 'All'
    ? files
    : files.filter(f => (f.category || '').toLowerCase() === activeFolder.toLowerCase());

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading project files...</div>;

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#37A3A3]" /> Upload File to Shared Project Repository
        </h3>

        {error && <div className="p-3 rounded-xl bg-[#FDF0EC] border border-[#F48B67] text-[#D86B47] text-xs font-bold">{error}</div>}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2B2523] mb-1">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs text-[#2B2523] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E4F7F7] file:text-[#37A3A3] hover:file:bg-[#58C4C4] hover:file:text-white bg-[#FFFDF7] p-1 rounded-xl border border-[#EADEC7]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2523] mb-1">Folder / Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs font-semibold text-[#2B2523]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-[#58C4C4] hover:bg-[#37A3A3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>

      {/* 7 Folder Category Tabs */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
          <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#F48B67]" /> Project Folders ({filteredFiles.length} files)
          </h3>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#EADEC7]">
          <button
            onClick={() => setActiveFolder('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFolder === 'All' ? 'bg-[#58C4C4] text-white shadow-sm' : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
            }`}
          >
            📂 All Folders ({files.length})
          </button>
          {categories.map(cat => {
            const count = files.filter(f => (f.category || '').toLowerCase() === cat.toLowerCase()).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveFolder(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFolder === cat ? 'bg-[#58C4C4] text-white shadow-sm' : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
                }`}
              >
                📁 {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Metadata Table */}
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-[#6B615C] border-2 border-dashed border-[#EADEC7] rounded-2xl text-xs italic">
            No files uploaded in folder "{activeFolder}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2B2523]">
              <thead className="bg-[#FFFDF7] text-[#6B615C] uppercase font-bold border-b border-[#EADEC7]">
                <tr>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Uploaded By</th>
                  <th className="p-3">File Size</th>
                  <th className="p-3">Upload Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADEC7]">
                {filteredFiles.map(file => (
                  <tr key={file.id} className="hover:bg-[#FFF9E8] transition-colors">
                    <td className="p-3 font-bold text-[#2B2523] truncate max-w-xs">{file.original_name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded bg-[#E4F7F7] text-[#37A3A3] font-bold border border-[#58C4C4]">
                        {file.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{file.uploader_name}</td>
                    <td className="p-3 font-mono">{formatFileSize(file.file_size)}</td>
                    <td className="p-3 font-mono">{new Date(file.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="px-3 py-1 bg-[#E4F7F7] text-[#37A3A3] rounded-lg font-bold inline-flex items-center gap-1 border border-[#58C4C4]"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      {(isLeader || file.uploaded_by_id === user?.id) && (
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="px-3 py-1 bg-[#FDF0EC] text-[#D86B47] rounded-lg font-bold inline-flex items-center gap-1 border border-[#F48B67]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
