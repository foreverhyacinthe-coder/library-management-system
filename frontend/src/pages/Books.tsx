import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, BookOpen, Edit2, Trash2, Eye, X, Loader2,
  Filter, BookMarked, Hash, Globe, Building2
} from 'lucide-react';
import { getBooks, createBook, updateBook, deleteBook } from '../api/booksApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import type { Book } from '../types';

const GENRES = ['Fiction','Non-Fiction','Science','History','Biography','Technology','Children','Mystery','Romance','Other'];

const emptyForm = (): Partial<Book> => ({
  title: '', author: '', isbn: '', genre: 'Fiction',
  description: '', totalCopies: 1, publishedYear: undefined,
  publisher: '', language: 'English',
});

export default function Books() {
  const { canManage } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();

  const [books, setBooks]       = useState<Book[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState(params.get('search') ?? '');
  const [genre, setGenre]       = useState('');
  const [avail, setAvail]       = useState(false);

  const [viewBook, setViewBook]   = useState<Book | null>(null);
  const [editBook, setEditBook]   = useState<Book | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [delBook, setDelBook]     = useState<Book | null>(null);
  const [form, setForm]           = useState<Partial<Book>>(emptyForm());
  const [saving, setSaving]       = useState(false);

  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooks({ search, genre, available: avail || undefined, page, limit: LIMIT });
      setBooks(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch { showToast('error', 'Failed to load books.'); }
    finally { setLoading(false); }
  }, [search, genre, avail, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.get('search')) setSearch(params.get('search')!); }, [params]);

  const openEdit = (b: Book) => { setForm({ ...b }); setEditBook(b); };
  const openAdd  = () => { setForm(emptyForm()); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.title || !form.author || !form.isbn) {
      showToast('error', 'Title, author and ISBN are required.'); return;
    }
    setSaving(true);
    try {
      if (editBook) {
        await updateBook(editBook._id, form);
        showToast('success', 'Book updated.');
        setEditBook(null);
      } else {
        await createBook(form);
        showToast('success', 'Book added to catalogue.');
        setShowAdd(false);
      }
      load();
    } catch (e: unknown) {
      showToast('error', (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delBook) return;
    try {
      await deleteBook(delBook._id);
      showToast('success', 'Book removed.');
      setDelBook(null);
      load();
    } catch { showToast('error', 'Delete failed.'); }
  };

  const pages = Math.ceil(total / LIMIT);

  const BookForm = () => (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: '0 16px' }}>
        <div className="form-group" style={{ gridColumn:'span 2' }}>
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title ?? ''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Book title" />
        </div>
        <div className="form-group">
          <label className="form-label">Author *</label>
          <input className="form-input" value={form.author ?? ''} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="Author name" />
        </div>
        <div className="form-group">
          <label className="form-label">ISBN *</label>
          <input className="form-input" value={form.isbn ?? ''} onChange={e=>setForm(f=>({...f,isbn:e.target.value}))} placeholder="978-..." />
        </div>
        <div className="form-group">
          <label className="form-label">Genre</label>
          <select className="form-select" value={form.genre ?? 'Fiction'} onChange={e=>setForm(f=>({...f,genre:e.target.value}))}>
            {GENRES.map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Total Copies</label>
          <input className="form-input" type="number" min={1} value={form.totalCopies ?? 1} onChange={e=>setForm(f=>({...f,totalCopies:+e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Published Year</label>
          <input className="form-input" type="number" value={form.publishedYear ?? ''} onChange={e=>setForm(f=>({...f,publishedYear:+e.target.value}))} placeholder="e.g. 2020" />
        </div>
        <div className="form-group">
          <label className="form-label">Publisher</label>
          <input className="form-input" value={form.publisher ?? ''} onChange={e=>setForm(f=>({...f,publisher:e.target.value}))} placeholder="Publisher name" />
        </div>
        <div className="form-group" style={{ gridColumn:'span 2' }}>
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description ?? ''} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description…" />
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Catalogue</h1>
          <p className="page-subtitle">{total} book{total !== 1 ? 's' : ''} in the collection</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Book
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-search">
          <Search size={15} />
          <input
            type="text" placeholder="Search by title, author, ISBN…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={genre} onChange={e=>{ setGenre(e.target.value); setPage(1); }}>
          <option value="">All Genres</option>
          {GENRES.map(g=><option key={g}>{g}</option>)}
        </select>
        <button
          className={`btn btn-sm ${avail ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setAvail(a=>!a); setPage(1); }}
        >
          <Filter size={14} /> {avail ? 'Available Only ✓' : 'Available Only'}
        </button>
        {(search || genre || avail) && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setGenre(''); setAvail(false); setPage(1); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading
          ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, gap:10, color:'var(--text-muted)' }}>
              <Loader2 size={20} style={{ animation:'spin 0.9s linear infinite' }} /> Loading…
            </div>
          : books.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h3>No books found</h3>
                <p>Try adjusting your search or filters.</p>
                {canManage && <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add First Book</button>}
              </div>
            : <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>ISBN</th>
                    <th>Copies</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b._id} style={{ cursor:'pointer' }} onClick={() => setViewBook(b)}>
                      <td>
                        <span style={{ fontWeight:600 }}>{b.title}</span>
                        {b.publishedYear && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{b.publishedYear}</div>}
                      </td>
                      <td style={{ color:'var(--text-secondary)' }}>{b.author}</td>
                      <td><span className="badge badge-blue">{b.genre}</span></td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.82rem', color:'var(--text-muted)' }}>{b.isbn}</td>
                      <td style={{ textAlign:'center' }}>{b.totalCopies}</td>
                      <td>
                        <span className={`badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {b.availableCopies > 0 ? `${b.availableCopies} available` : 'All issued'}
                        </span>
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" title="View" onClick={()=>setViewBook(b)}><Eye size={15} /></button>
                          {canManage && <>
                            <button className="btn btn-icon btn-ghost btn-sm" title="Edit" onClick={()=>openEdit(b)}><Edit2 size={15} /></button>
                            <button className="btn btn-icon btn-ghost btn-sm" title="Delete" style={{ color:'var(--danger)' }} onClick={()=>setDelBook(b)}><Trash2 size={15} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
        {!loading && pages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
                <button key={p} className={`page-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal open={!!viewBook} onClose={()=>setViewBook(null)} title="Book Details" size="lg"
        footer={<>
          {canManage && <button className="btn btn-secondary" onClick={()=>{ openEdit(viewBook!); setViewBook(null); }}><Edit2 size={15} /> Edit</button>}
          <button className="btn btn-primary" onClick={()=>setViewBook(null)}>Close</button>
        </>}
      >
        {viewBook && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px 32px' }}>
            {[
              { icon:<BookOpen size={15}/>, label:'Title',     value: viewBook.title },
              { icon:<BookMarked size={15}/>, label:'Author',  value: viewBook.author },
              { icon:<Hash size={15}/>,      label:'ISBN',     value: viewBook.isbn },
              { icon:<Filter size={15}/>,    label:'Genre',    value: viewBook.genre },
              { icon:<Building2 size={15}/>, label:'Publisher',value: viewBook.publisher || '—' },
              { icon:<Globe size={15}/>,     label:'Language', value: viewBook.language || 'English' },
            ].map(f=>(
              <div key={f.label}>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                  {f.icon} {f.label}
                </div>
                <div style={{ fontSize:'0.95rem', fontWeight:500 }}>{f.value}</div>
              </div>
            ))}
            <div style={{ gridColumn:'span 2' }}>
              <div style={{ display:'flex', gap:24 }}>
                <div style={{ textAlign:'center', flex:1, background:'var(--blue-50)', borderRadius:'var(--r)', padding:'12px 16px' }}>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--blue)' }}>{viewBook.totalCopies}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Total Copies</div>
                </div>
                <div style={{ textAlign:'center', flex:1, background: viewBook.availableCopies>0?'var(--teal-50)':'var(--danger-bg)', borderRadius:'var(--r)', padding:'12px 16px' }}>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, color: viewBook.availableCopies>0?'var(--teal)':'var(--danger)' }}>{viewBook.availableCopies}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Available</div>
                </div>
              </div>
            </div>
            {viewBook.description && (
              <div style={{ gridColumn:'span 2' }}>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, marginBottom:4 }}>Description</div>
                <p style={{ fontSize:'0.9rem', lineHeight:1.65, color:'var(--text-secondary)' }}>{viewBook.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={showAdd || !!editBook}
        onClose={() => { setShowAdd(false); setEditBook(null); }}
        title={editBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditBook(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : editBook ? 'Save Changes' : 'Add Book'}
          </button>
        </>}
      >
        <BookForm />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delBook} onClose={()=>setDelBook(null)} title="Remove Book" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>setDelBook(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Remove Book</button>
        </>}
      >
        <p>Are you sure you want to remove <strong>{delBook?.title}</strong> from the catalogue? This action cannot be undone.</p>
      </Modal>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.spin{animation:spin 0.9s linear infinite;}`}</style>
    </div>
  );
}
