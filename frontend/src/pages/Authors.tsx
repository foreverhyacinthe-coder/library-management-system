import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, BookOpen, X, Loader2 } from 'lucide-react';
import { getBooks } from '../api/booksApi';
import type { Book } from '../types';

interface AuthorEntry {
  name: string;
  books: Book[];
  genres: string[];
}

export default function Authors() {
  const [books, setBooks]       = useState<Book[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooks({ limit: 200 });
      setBooks(res.data.data ?? []);
    } catch {/* */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by author
  const authorMap: Record<string, Book[]> = {};
  books.forEach(b => {
    if (!authorMap[b.author]) authorMap[b.author] = [];
    authorMap[b.author].push(b);
  });

  const authors: AuthorEntry[] = Object.entries(authorMap)
    .map(([name, bks]) => ({
      name,
      books: bks,
      genres: [...new Set(bks.map(b => b.genre))],
    }))
    .sort((a, b) => b.books.length - a.books.length);

  const filtered = authors.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Authors</h1>
          <p className="page-subtitle">{authors.length} author{authors.length !== 1 ? 's' : ''} in the catalogue</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-search">
          <Search size={15} />
          <input type="text" placeholder="Search authors…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {search && (
          <button className="btn btn-sm btn-ghost" onClick={()=>setSearch('')}><X size={14} /> Clear</button>
        )}
      </div>

      {loading
        ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:64, gap:10, color:'var(--text-muted)' }}>
            <Loader2 size={20} style={{ animation:'spin 0.9s linear infinite' }} /> Loading…
          </div>
        : filtered.length === 0
          ? <div className="empty-state">
              <div className="empty-state-icon"><UserCheck size={28}/></div>
              <h3>No authors found</h3>
              <p>Add books to build your author catalogue.</p>
            </div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
              {filtered.map(a => (
                <div key={a.name} className="card" style={{ transition:'box-shadow 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.boxShadow='var(--shadow-md)')}
                  onMouseLeave={e=>(e.currentTarget.style.boxShadow='')}
                >
                  <div className="card-body">
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      {/* Avatar */}
                      <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'linear-gradient(135deg,var(--navy) 0%,var(--blue) 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1rem',fontWeight:700,flexShrink:0 }}>
                        {a.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                            <BookOpen size={12} /> {a.books.length} book{a.books.length !== 1 ? 's' : ''}
                          </span>
                          {a.genres.slice(0,2).map(g=>(
                            <span key={g} className="badge badge-blue" style={{ fontSize:'0.7rem', padding:'1px 7px' }}>{g}</span>
                          ))}
                          {a.genres.length > 2 && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>+{a.genres.length-2}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Expandable book list */}
                    <div style={{ marginTop:14 }}>
                      <button
                        onClick={()=>setExpanded(expanded===a.name ? null : a.name)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', color:'var(--blue)', fontWeight:600, padding:0, display:'flex', alignItems:'center', gap:4 }}
                      >
                        {expanded===a.name ? '▲ Hide' : '▼ View'} books
                      </button>

                      {expanded===a.name && (
                        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                          {a.books.map(bk=>(
                            <div key={bk._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface)', borderRadius:'var(--r)', fontSize:'0.85rem' }}>
                              <BookOpen size={13} style={{ color:'var(--blue)', flexShrink:0 }} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bk.title}</div>
                              </div>
                              <span className={`badge ${bk.availableCopies>0?'badge-teal':'badge-danger'}`} style={{ fontSize:'0.7rem' }}>
                                {bk.availableCopies}/{bk.totalCopies}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
