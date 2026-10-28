import { useCallback, useEffect, useState } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const genres = ['Action','Comedy','Drama','Horror','Sci-Fi','Romance','Thriller'];
const platforms = ['Netflix','Prime Video','Hotstar','Theatre','Other'];
const statuses = ['To Watch','Watching','Watched'];
const empty = {title:'',genre:'Action',releaseYear:new Date().getFullYear(),runtime:120,platform:'Netflix',priority:3};
async function request(path, options={}) {
  const r = await fetch(`${API}${path}`, {headers:{'Content-Type':'application/json'}, ...options});
  const body = await r.json();
  if (!r.ok || !body.success) throw new Error(body.message || 'Request failed');
  return body.data;
}
function App(){
  const [movies,setMovies]=useState([]),[stats,setStats]=useState(null),[page,setPage]=useState(1),[pages,setPages]=useState(1);
  const [statusFilter,setStatusFilter]=useState(''),[genreFilter,setGenreFilter]=useState(''),[search,setSearch]=useState('');
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const [ratingTarget,setRatingTarget]=useState(null),[rating,setRating]=useState(8),[nextMovie,setNextMovie]=useState(null),[loading,setLoading]=useState(false);
  const load = useCallback(async()=>{
    setLoading(true); setError('');
    try {
      const q=new URLSearchParams({page:String(page)});
      if(statusFilter)q.set('status',statusFilter); if(genreFilter)q.set('genre',genreFilter); if(search.trim())q.set('search',search.trim());
      const [list,s]=await Promise.all([request(`/movies?${q}`),request('/stats')]);
      setMovies(list.movies);setPages(Math.max(1,list.totalPages));setStats(s);
    } catch(e){setError(e.message)} finally{setLoading(false)}
  },[page,statusFilter,genreFilter,search]);
  useEffect(()=>{load()},[load]);
  const refresh=async()=>{await load(); try{setStats(await request('/stats'))}catch{}};
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{
    e.preventDefault();setError('');setNotice('');
    const year=Number(form.releaseYear), runtime=Number(form.runtime), priority=Number(form.priority);
    if(!form.title.trim()){setError('Title is required.');return}
    if(year<1950||year>new Date().getFullYear()){setError(`Release year must be between 1950 and ${new Date().getFullYear()}.`);return}
    if(runtime<30||runtime>300){setError('Runtime must be between 30 and 300 minutes.');return}
    if(priority<1||priority>5){setError('Priority must be from 1 to 5.');return}
    try{
      if(editing) await request(`/movies/${editing._id}`,{method:'PUT',body:JSON.stringify({...form,runtime,priority})});
      else await request('/movies',{method:'POST',body:JSON.stringify({...form,releaseYear:year,runtime,priority})});
      setNotice(editing?'Movie updated.':'Movie added.');setForm(empty);setEditing(null);setPage(1);await refresh();
    }catch(e){setError(e.message)}
  };
  const edit=m=>{setEditing(m);setForm({title:m.title,genre:m.genre,releaseYear:m.releaseYear,runtime:m.runtime,platform:m.platform,priority:m.priority});window.scrollTo({top:0,behavior:'smooth'})};
  const changeStatus=async(m,status)=>{
    let body={status};
    if(status==='Watched'){const value=window.prompt('Enter rating from 1 to 10:','8');if(value===null)return;body.rating=Number(value);if(!Number.isInteger(body.rating)||body.rating<1||body.rating>10){setError('Rating must be an integer from 1 to 10.');return}}
    try{await request(`/movies/${m._id}/status`,{method:'PATCH',body:JSON.stringify(body)});setNotice('Status updated.');await refresh()}catch(e){setError(e.message)}
  };
  const changeRating=async()=>{try{await request(`/movies/${ratingTarget._id}/rating`,{method:'PATCH',body:JSON.stringify({rating:Number(rating)})});setRatingTarget(null);setNotice('Rating updated.');await refresh()}catch(e){setError(e.message)}};
  const remove=async m=>{if(!window.confirm(`Delete "${m.title}"?`))return;try{await request(`/movies/${m._id}`,{method:'DELETE'});setNotice('Movie deleted.');await refresh()}catch(e){setError(e.message)}};
  const watchNext=async()=>{setError('');try{setNextMovie(await request('/movies/watch-next'))}catch(e){setNextMovie(null);setError(e.message)}};
  return <main className="shell">
    <header className="hero"><div><div className="eyebrow">YOUR PERSONAL CINEMA</div><h1>Cine<span>Track</span></h1><p>Every story worth watching, all in one place.</p></div><button className="next-btn" onClick={watchNext}>✦ What should I watch next?</button></header>
    {error&&<div className="alert error">{error}<button onClick={()=>setError('')}>×</button></div>}{notice&&<div className="alert success">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    {nextMovie&&<section className="next-card"><div><small>YOUR NEXT PICK</small><h2>{nextMovie.title}</h2><p>{nextMovie.genre} · {nextMovie.runtime} min · Priority {nextMovie.priority}/5</p><code>{nextMovie.movieCode}</code></div><button className="ghost" onClick={()=>setNextMovie(null)}>Dismiss</button></section>}
    <section className="stats-grid">
      <Stat label="To Watch" value={stats?.statusCounts?.['To Watch']??'—'} icon="◷" color="purple"/>
      <Stat label="Watching" value={stats?.statusCounts?.Watching??'—'} icon="▶" color="blue"/>
      <Stat label="Watched" value={stats?.statusCounts?.Watched??'—'} icon="✓" color="green"/>
      <Stat label="Hours watched" value={stats?stats.totalHoursWatched+'h':'—'} icon="◴" color="orange"/>
      <Stat label="Average rating" value={stats?.averageRating??'—'} icon="★" color="yellow"/>
      <Stat label="Top watched genre" value={stats?.topWatchedGenre?.genre??'—'} icon="✦" color="pink"/>
    </section>
    <section className="layout">
      <aside className="panel form-panel"><div className="section-heading"><div><small>{editing?'UPDATE DETAILS':'BUILD YOUR LIST'}</small><h2>{editing?'Edit movie':'Add a movie'}</h2></div><span className="plus">{editing?'✎':'＋'}</span></div>
        <form onSubmit={submit}>
          <label>Movie title<input required value={form.title} onChange={e=>update('title',e.target.value)} placeholder="e.g. Interstellar"/></label>
          <div className="two"><label>Genre<select value={form.genre} onChange={e=>update('genre',e.target.value)}>{genres.map(x=><option key={x}>{x}</option>)}</select></label><label>Release year<input type="number" min="1950" max={new Date().getFullYear()} disabled={!!editing} value={form.releaseYear} onChange={e=>update('releaseYear',e.target.value)} required/></label></div>
          <div className="two"><label>Runtime (min)<input type="number" min="30" max="300" value={form.runtime} onChange={e=>update('runtime',e.target.value)} required/></label><label>Priority <b className="inline-value">{form.priority}/5</b><input type="range" min="1" max="5" value={form.priority} onChange={e=>update('priority',e.target.value)}/></label></div>
          <label>Streaming platform<select value={form.platform} onChange={e=>update('platform',e.target.value)}>{platforms.map(x=><option key={x}>{x}</option>)}</select></label>
          <button className="primary submit" type="submit">{editing?'Save changes':'＋ Add to watchlist'}</button>
          {editing&&<button className="cancel" type="button" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel editing</button>}
        </form>
        <div className="tip">✦ <span>Set a priority to make sure your must-watch movies rise to the top.</span></div>
      </aside>
      <section className="movies-area"><div className="section-heading list-heading"><div><small>THE COLLECTION</small><h2>Your watchlist</h2></div><span className="count">{stats?Object.values(stats.statusCounts).reduce((a,b)=>a+b,0):0} titles</span></div>
        <div className="filters"><input aria-label="Search title" placeholder="⌕  Search movies..." value={search} onChange={e=>{setPage(1);setSearch(e.target.value)}}/><select value={statusFilter} onChange={e=>{setPage(1);setStatusFilter(e.target.value)}}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><select value={genreFilter} onChange={e=>{setPage(1);setGenreFilter(e.target.value)}}><option value="">All genres</option>{genres.map(g=><option key={g}>{g}</option>)}</select></div>
        {loading?<div className="empty">Loading your collection…</div>:movies.length===0?<div className="empty"><div>🎬</div><h3>No movies found</h3><p>Add a movie or adjust your filters.</p></div>:<div className="movie-grid">{movies.map(m=><article className="movie-card" key={m._id}><div className={`poster ${m.genre.toLowerCase().replace(/[^a-z]/g,'')}`}><span>{m.genre.toUpperCase()}</span><strong>{m.title.split(' ').map(w=>w[0]).join('').slice(0,3)}</strong><small>{m.releaseYear}</small></div><div className="movie-body"><div className="card-top"><code>{m.movieCode}</code><span className={`badge ${m.status.toLowerCase().replace(' ','-')}`}>{m.status}</span></div><h3>{m.title}</h3><p className="meta">{m.genre} · {m.runtime} min</p><div className="card-foot"><span className="priority">✦ {m.priority}/5</span><span className="rating">{m.rating?`★ ${m.rating}/10`:'Not rated'}</span></div>
          <div className="card-actions"><select aria-label={`Change status for ${m.title}`} value={m.status} disabled={m.status==='Watched'} onChange={e=>changeStatus(m,e.target.value)}>{[m.status,...(m.status==='To Watch'?['Watching','Watched']:m.status==='Watching'?['Watched','To Watch']:[])].filter((x,i,a)=>a.indexOf(x)===i).map(s=><option key={s}>{s}</option>)}</select><button title="Edit movie" onClick={()=>edit(m)}>✎</button><button title="Delete movie" disabled={m.status==='Watching'} onClick={()=>remove(m)}>⌫</button>{m.status==='Watched'&&<button title="Edit rating" onClick={()=>{setRatingTarget(m);setRating(m.rating||8)}}>★</button>}</div>
        </div></article>)}</div>}
        <div className="pagination"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Previous</button><span>Page {page} of {pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next →</button></div>
      </section>
    </section>
    {ratingTarget&&<div className="modal-backdrop"><div className="modal"><h2>Update rating</h2><p>{ratingTarget.title}</p><label>Rating (1–10)<input type="number" min="1" max="10" value={rating} onChange={e=>setRating(e.target.value)}/></label><div className="modal-actions"><button className="cancel" onClick={()=>setRatingTarget(null)}>Cancel</button><button className="primary" onClick={changeRating}>Save rating</button></div></div></div>}
    <footer>MADE FOR MOVIE LOVERS <span>·</span> CINE TRACK</footer>
  </main>;
}
function Stat({label,value,icon,color}){return <div className="stat"><div className={`stat-icon ${color}`}>{icon}</div><div><small>{label}</small><strong>{value}</strong></div></div>}
export default App;
