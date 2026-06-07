'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Download,
  ExternalLink,
  Eye,
  X,
  Sparkles
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileUrl: string | null;
  content: string | null;
  subject: string;
  batch: string;
  uploadedAt: string;
}

export default function StudentMaterials() {
  const [batchName, setBatchName] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // In-app reader modal
  const [viewerMaterial, setViewerMaterial] = useState<Material | null>(null);
  // null = checking, true = file reachable, false = missing (404)
  const [fileAvailable, setFileAvailable] = useState<boolean | null>(null);

  const fileExt = (url: string | null) => ((url || '').split('?')[0].split('.').pop() || '').toLowerCase();
  const isPdf = (url: string | null) => fileExt(url) === 'pdf';
  const isImage = (url: string | null) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExt(url));
  const isViewable = (url: string | null) => !!url && url.startsWith('/') && (isPdf(url) || isImage(url));

  useEffect(() => {
    const load = async () => {
      try {
        const [matRes, meRes] = await Promise.all([
          fetch('/api/materials'),
          fetch('/api/auth/me')
        ]);

        if (matRes.ok) {
          const data = await matRes.json();
          setMaterials(data);
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.student) {
            setBatchName(meData.user.student.batch || '');
          }
        }
      } catch (e) {
        console.error('Failed to load materials:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Verify the file actually exists before embedding it (avoids showing a raw 404 page).
  // Written notes have inline content, so no file check is needed.
  useEffect(() => {
    if (!viewerMaterial) {
      setFileAvailable(null);
      return;
    }
    if (viewerMaterial.content) {
      setFileAvailable(true);
      return;
    }
    let cancelled = false;
    setFileAvailable(null);
    fetch(viewerMaterial.fileUrl || '', { method: 'HEAD' })
      .then((res) => { if (!cancelled) setFileAvailable(res.ok); })
      .catch(() => { if (!cancelled) setFileAvailable(false); });
    return () => { cancelled = true; };
  }, [viewerMaterial]);

  const handleDownload = (material: Material) => {
    // Written note → download as a self-contained HTML file.
    if (material.content) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${material.title}</title>` +
        `<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;color:#1e293b}h1{color:#4338ca}blockquote{border-left:3px solid #6366f1;padding-left:14px;color:#475569;font-style:italic}</style>` +
        `</head><body><h1>${material.title}</h1>${material.content}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title || 'note'}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    if (material.fileUrl && material.fileUrl.startsWith('/')) {
      const a = document.createElement('a');
      a.href = material.fileUrl;
      a.download = material.title || material.fileUrl.split('/').pop() || 'resource';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert(`This resource has no downloadable file attached.`);
    }
  };

  const handleOpen = (material: Material) => {
    if (material.content || isViewable(material.fileUrl)) {
      setViewerMaterial(material);
    } else if (material.fileUrl && material.fileUrl.startsWith('/')) {
      // Not previewable inline (e.g. .doc) — open in a new tab instead.
      window.open(material.fileUrl, '_blank');
    } else {
      alert(`This resource has no readable file attached yet.`);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Notes': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Homework': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Lobby Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-card rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Resource vault</h3>
          <p className="text-[11px] text-slate-400">View and download textbooks, assignments, and notes distributed to {batchName || 'your batch'}.</p>
        </div>

        <div className="relative w-48">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-200 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Materials List grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-900 rounded-3xl p-6 glass-card bg-slate-950/20">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-xs font-semibold text-slate-400 font-mono">No resources cataloged yet.</h4>
          </div>
        ) : (
          filteredMaterials.map((m) => (
            <div
              key={m.id}
              onClick={() => handleOpen(m)}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 hover:border-indigo-500/40 transition-all cursor-pointer group"
            >
              <div className="flex gap-4 items-start">
                <div className={`p-2.5 rounded-xl border shrink-0 ${getTypeColor(m.fileType)}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                    {m.subject} // {m.fileType}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{m.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">{m.description || 'No description available.'}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500 uppercase">
                <span>Uploaded: {new Date(m.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpen(m); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-bold transition-all cursor-pointer text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(m); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold transition-all cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-app Reader Modal */}
      {viewerMaterial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#04060d]/80 backdrop-blur-md"
          onClick={() => setViewerMaterial(null)}
        >
          <div
            className="w-full max-w-4xl h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-indigo-500/15 bg-gradient-to-tr from-slate-950 via-[#0a0d17] to-slate-950 shadow-2xl shadow-indigo-900/30 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow accents */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-900/70 bg-[#070a12]/80 backdrop-blur-md relative z-10">
              <div className="flex gap-3 items-start min-w-0">
                <div className={`p-2.5 rounded-xl border shrink-0 ${getTypeColor(viewerMaterial.fileType)}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Study Reader</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{viewerMaterial.title}</h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{viewerMaterial.subject} // {viewerMaterial.fileType}</span>
                </div>
              </div>
              <button
                onClick={() => setViewerMaterial(null)}
                className="shrink-0 p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                aria-label="Close reader"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewer body */}
            <div className="flex-1 min-h-0 p-3 sm:p-4 relative z-10">
              {fileAvailable === null ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-950/40 border border-slate-900">
                  <div className="w-9 h-9 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
                  <p className="text-[11px] text-slate-500 font-mono">Loading reader...</p>
                </div>
              ) : viewerMaterial.content ? (
                <div className="w-full h-full overflow-y-auto rounded-xl bg-slate-950/40 border border-slate-900 p-5 sm:p-7">
                  <div
                    className="rte-prose text-sm text-slate-200 leading-relaxed max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewerMaterial.content }}
                  />
                </div>
              ) : fileAvailable === false ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 p-6">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-300">Resource not available yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    The file for this resource hasn't been uploaded to the vault. Please check back later or contact your tutor.
                  </p>
                </div>
              ) : isImage(viewerMaterial.fileUrl) ? (
                <div className="w-full h-full overflow-auto rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewerMaterial.fileUrl || ''} alt={viewerMaterial.title} className="max-w-full max-h-full object-contain" />
                </div>
              ) : isPdf(viewerMaterial.fileUrl) ? (
                <iframe
                  src={viewerMaterial.fileUrl || ''}
                  title={viewerMaterial.title}
                  className="w-full h-full rounded-xl bg-white border border-slate-900"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 p-6">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    This file type can't be previewed in the reader. Use the buttons below to open or download it.
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-3 sm:p-4 border-t border-slate-900/70 bg-[#070a12]/80 backdrop-blur-md flex items-center justify-between gap-3 relative z-10">
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block leading-relaxed">
                Read at your own pace — no time limit here. 📚
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {viewerMaterial.fileUrl && (
                  <button
                    onClick={() => window.open(viewerMaterial.fileUrl as string, '_blank')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Tab</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(viewerMaterial)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
