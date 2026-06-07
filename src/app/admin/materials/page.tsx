'use client';

import React, { useState, useEffect } from 'react';
import { StudyMaterial } from '@prisma/client';
import {
  BookOpen,
  UploadCloud,
  FileText,
  BookOpenCheck,
  Trash2,
  Search,
  Plus,
  Sparkles,
  FileCheck,
  PenLine
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function StudyMaterialsUpload() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<string>('PDF');
  const [subject, setSubject] = useState('Physics');
  const [batch, setBatch] = useState('Alpha Batch');
  const [fileUrl, setFileUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Resource source mode: attach a file/link, or write a note in the editor
  const [mode, setMode] = useState<'upload' | 'write'>('upload');
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(0); // bump to reset the editor

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (e) {
      console.error('Failed to load study materials:', e);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setUploading(true);

    let finalUrl: string | null = null;
    let finalContent: string | null = null;

    if (mode === 'write') {
      // Strip tags to check there's actual text, not just empty markup.
      const plain = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (!plain) {
        alert('Please write some content before publishing.');
        setUploading(false);
        return;
      }
      finalContent = content;
    } else {
      finalUrl = fileUrl || null;
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalUrl = uploadData.url;
          } else {
            alert('File upload to storage vault failed.');
            setUploading(false);
            return;
          }
        } catch (err) {
          console.error('File upload failed:', err);
          alert('File upload error.');
          setUploading(false);
          return;
        }
      }

      if (!finalUrl) {
        alert('Please select a file or paste a link.');
        setUploading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          fileType,
          fileUrl: finalUrl,
          content: finalContent,
          subject,
          batch
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setFileUrl('');
        setFile(null);
        setContent('');
        setEditorKey((k) => k + 1);
        fetchMaterials();
        alert('Resource successfully cataloged.');
      } else {
        alert('Failed to publish resource reference');
      }
    } catch (err) {
      console.error('Error publishing resource:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this resource file?')) {
      try {
        const res = await fetch(`/api/materials?id=${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchMaterials();
        } else {
          alert('Failed to delete material');
        }
      } catch (err) {
        console.error('Error deleting material:', err);
      }
    }
  };

  const getTypeColor = (type: StudyMaterial['fileType']) => {
    switch (type) {
      case 'PDF': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Notes': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Homework': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'; // Assignment
    }
  };

  // Filter list
  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Upload and File Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Upload Form Block (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <h3 className="text-md font-bold text-slate-200">Catalog Resource</h3>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs text-slate-300">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electromagnetic Waves formulas"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Brief description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include topics covered..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Resource Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="PDF">PDF Sheet</option>
                  <option value="Notes">Revision Notes</option>
                  <option value="Homework">Homework</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Target Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
              >
                <option value="Alpha Batch">Alpha Batch</option>
                <option value="Beta Batch">Beta Batch</option>
                <option value="Gamma Batch">Gamma Batch</option>
              </select>
            </div>

            {/* Source mode toggle */}
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Resource Source</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-900">
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    mode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('write'); setFile(null); setFileUrl(''); setFileType('Notes'); }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    mode === 'write'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write Note</span>
                </button>
              </div>
            </div>

            {mode === 'upload' ? (
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Upload File</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setFileUrl('');
                        setTitle(e.target.files[0].name.split('.')[0].replace(/_/g, ' '));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/15 file:text-indigo-300 file:text-xs file:font-bold file:cursor-pointer"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />

                  {file ? (
                    <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      Selected: {file.name}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      PDF or image — this is the file students will read &amp; download.
                    </p>
                  )}

                  <div className="pt-1">
                    <label className="block text-[9px] uppercase font-mono text-slate-600 mb-1">Or paste an external link (optional)</label>
                    <input
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://example.com/notes.pdf"
                      disabled={!!file}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Write Content</label>
                <RichTextEditor
                  key={editorKey}
                  onChange={setContent}
                  placeholder="Write your notes, formulas, or lesson summary here..."
                />
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">
                  Students will read this directly in the Study Hub. Use the toolbar for headings, lists, and links.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Publishing...' : mode === 'write' ? 'Publish Note' : 'Upload & Publish Material'}
            </button>
          </form>
        </div>

        {/* Catalog Table Block (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-md font-bold text-slate-200">Vault Resource Catalog</h3>
              </div>
              
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-900 text-[10px] text-slate-200 focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredMaterials.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono text-center py-12">No files currently cataloged in this subject.</p>
              ) : (
                filteredMaterials.map((m) => (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-900/60 hover:border-indigo-500/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl ${getTypeColor(m.fileType)}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{m.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{m.description || 'No description provided.'}</p>
                        
                        <div className="flex gap-4 mt-2 text-[9px] font-mono text-slate-500 font-bold uppercase">
                          <span>Sub: {m.subject}</span>
                          <span>Batch: {m.batch}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-600">
                        {new Date(m.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-500/25 transition-all duration-200"
                        title="Purge resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
