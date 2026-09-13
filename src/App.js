import React, { useState } from 'react';
const API_URL = "https://nandi.pythonanywhere.com";

function App() {
  const [halaman, setHalaman] = useState("beranda");
  const [sudahLogin, setSudahLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pesanLogin, setPesanLogin] = useState("");

  // === LINK GRUP WA ===
  const LINK_GRUP_WA = "https://chat.whatsapp.com/CbqmJzWdrHjDe1v5GypSi4?s=cl&p=i&mlu=4&ilr=4";

  // === DAFTAR TIM PENDAFTAR ===
  const [daftarTim, setDaftarTim] = useState([]);
  const [timTerbuka, setTimTerbuka] = useState(null);

  // === FORM PENDAFTARAN ===
  const [formTim, setFormTim] = useState({
    namaTim: "", namaKetua: "", waKetua: "", userIdKetua: "", serverIdKetua: "", nicknameKetua: "",
    pemain: [
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "", cadangan: true }
    ],
    buktiBayar: null, buktiBayarUrl: ""
  });
  const [langkahDaftar, setLangkahDaftar] = useState(1);
  const [pesanDaftar, setPesanDaftar] = useState("");
  const [suksesDaftar, setSuksesDaftar] = useState(false);

  // === CASHFLOW ===
  const [itemPemasukan, setItemPemasukan] = useState([{nama:"",rencana:0,realisasi:0}]);
  const [itemPengeluaran, setItemPengeluaran] = useState([{nama:"",rencana:0,realisasi:0}]);

  // === LOGIN PANITIA ===
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.sukses) {
      setSudahLogin(true);
      setHalaman("daftar-peserta");
    } else {
      setPesanLogin("❌ Username atau password salah!");
    }
  };

  // === HITUNG TOTAL CASHFLOW ===
  const hitungTotal = (daftar) => {
    let rencana = 0, realisasi = 0;
    daftar.forEach(i => {
      rencana += Number(i.rencana) || 0;
      realisasi += Number(i.realisasi) || 0;
    });
    return { rencana, realisasi, selisih: realisasi - rencana };
  };
  const totalPemasukan = hitungTotal(itemPemasukan);
  const totalPengeluaran = hitungTotal(itemPengeluaran);
  const saldo = {
    rencana: totalPemasukan.rencana - totalPengeluaran.rencana,
    realisasi: totalPemasukan.realisasi - totalPengeluaran.realisasi,
    selisih: (totalPemasukan.realisasi - totalPengeluaran.realisasi) - (totalPemasukan.rencana - totalPengeluaran.rencana)
  };

  // === TAMBAH/HAPUS ITEM CASHFLOW ===
  const tambahItem = (tipe) => {
    const arr = tipe==="pemasukan" ? [...itemPemasukan] : [...itemPengeluaran];
    arr.push({nama:"",rencana:0,realisasi:0});
    tipe==="pemasukan" ? setItemPemasukan(arr) : setItemPengeluaran(arr);
  };
  const hapusItem = (tipe, idx) => {
    const arr = tipe==="pemasukan" ? [...itemPemasukan] : [...itemPengeluaran];
    arr.splice(idx,1);
    tipe==="pemasukan" ? setItemPemasukan(arr) : setItemPengeluaran(arr);
  };
  const ubahItem = (tipe, idx, kolom, nilai) => {
    const arr = tipe==="pemasukan" ? [...itemPemasukan] : [...itemPengeluaran];
    arr[idx][kolom] = kolom==="nama" ? nilai : Number(nilai)||0;
    tipe==="pemasukan" ? setItemPemasukan(arr) : setItemPengeluaran(arr);
  };

  // === DOWNLOAD EXCEL ===
  const downloadExcel = () => {
    let csv = "Tipe,Uraian,Rencana,Realisasi,Selisih\n";
    itemPemasukan.forEach(i => {
      const sel = (Number(i.realisasi)||0) - (Number(i.rencana)||0);
      csv += `Pemasukan,"${i.nama}",${i.rencana},${i.realisasi},${sel}\n`;
    });
    csv += `TOTAL PEMASUKAN,,${totalPemasukan.rencana},${totalPemasukan.realisasi},${totalPemasukan.selisih}\n`;
    itemPengeluaran.forEach(i => {
      const sel = (Number(i.realisasi)||0) - (Number(i.rencana)||0);
      csv += `Pengeluaran,"${i.nama}",${i.rencana},${i.realisasi},${sel}\n`;
    });
    csv += `TOTAL PENGELOUARAN,,${totalPengeluaran.rencana},${totalPengeluaran.realisasi},${totalPengeluaran.selisih}\n`;
    csv += `SALDO AKHIR,,${saldo.rencana},${saldo.realisasi},${saldo.selisih}\n`;
    const blob = new Blob(["\uFEFF"+csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Cashflow_BCEDUFAIR_2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // === KIRIM PENDAFTARAN ===
  const kirimPendaftaran = async (e) => {
    e.preventDefault();
    if (!formTim.buktiBayar) {
      alert("⚠️ Silakan unggah bukti pembayaran terlebih dahulu!");
      return;
    }
    const pemainDenganUrl = formTim.pemain.map(p => ({
      ...p, ktmUrl: p.ktmFile ? URL.createObjectURL(p.ktmFile) : ""
    }));
    const buktiUrl = formTim.buktiBayar ? URL.createObjectURL(formTim.buktiBayar) : "";
    const timBaru = {
      id: Date.now(),
      namaTim: formTim.namaTim, namaKetua: formTim.namaKetua, waKetua: formTim.waKetua,
      userIdKetua: formTim.userIdKetua, serverIdKetua: formTim.serverIdKetua,
      nicknameKetua: formTim.nicknameKetua, pemain: pemainDenganUrl,
      jumlahPemain: formTim.pemain.filter((_,i)=>i<5).filter(p=>p.nama).length + (formTim.pemain[5].nama?1:0),
      buktiBayar: formTim.buktiBayar.name || "Sudah diunggah", buktiBayarUrl: buktiUrl
    };
    setDaftarTim(prev => [...prev, timBaru]);
    setPesanDaftar("✅ PENDAFTARAN BERHASIL! Terima kasih!");
    setSuksesDaftar(true);
    setFormTim({
      namaTim:"",namaKetua:"",waKetua:"",userIdKetua:"",serverIdKetua:"",nicknameKetua:"",
      pemain:[{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:""},{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:""},{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:""},{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:""},{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:""},{nama:"",nickname:"",wa:"",ktmFile:null,ktmUrl:"",cadangan:true}],
      buktiBayar:null, buktiBayarUrl:""
    });
  };
  const daftarTimBaruLagi = () => {
    setSuksesDaftar(false); setPesanDaftar(""); setLangkahDaftar(1);
  };

  return (
    <div style={{fontFamily:"system-ui, sans-serif", minHeight:"100vh", background:"linear-gradient(135deg, #1e3a8a, #3b82f6)", color:"#fff", position:"relative"}}>
      <style>{`
        * {box-sizing: border-box;}
        @media (max-width: 768px) {
          body, main {padding: 12px !important; font-size: 14px !important;}
          h1 {font-size: 1.5rem !important;}
          h2 {font-size: 1.2rem !important;}
          input, button, select, textarea {font-size: 16px !important; padding: 12px !important;}
          button {width: 100% !important; margin: 4px 0 !important;}
          table, div[style*="grid"] {display: block !important; overflow-x: auto !important;}
          nav > button {white-space: nowrap;}
          div[style*="flex-wrap"] {flex-direction: column !important; gap: 8px !important;}
        }
      `}</style>

      {/* === WATERMARK === */}
      <div style={{position:"fixed", bottom:"20px", right:"20px", opacity:0.12, fontSize:"1.2rem", fontWeight:"bold", pointerEvents:"none", zIndex:0, userSelect:"none"}}>
        HIMPUNAN MAHASISWA JURUSAN BROADCASTING — BC EDUFAIR 2026
      </div>

      {/* === HEADER === */}
      <div style={{background:"rgba(0,0,0,0.25)", padding:"1rem 1.2rem", borderBottom:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", position:"relative", zIndex:1}}>
        <div style={{display:"flex", gap:"0.8rem", alignItems:"center"}}>
          <img src="/logo-ueu.png" alt="Logo UEU" style={{width:50,height:50,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
          <img src="/logo-hmj.png" alt="Logo HMJ" style={{width:50,height:50,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
          <img src="/logo-bced.png" alt="Logo BCED" style={{width:50,height:50,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
        </div>
        <div style={{textAlign:"right"}}>
          <h3 style={{margin:"0 0 0.25rem 0", fontSize:"0.95rem"}}>HIMPUNAN MAHASISWA JURUSAN BROADCASTING</h3>
          <p style={{margin:"0.25rem 0 0 0", fontSize:"1rem", fontWeight:"bold", color:"#ffd700"}}>BC EDUFAIR 2026</p>
        </div>
      </div>

      {/* === NAVIGASI === */}
      <nav style={{background:"rgba(0,0,0,0.15)", padding:"0.6rem 1.2rem", display:"flex", gap:"0.5rem", flexWrap:"wrap", position:"relative", zIndex:1}}>
        {[
          {k:"beranda", l:"Beranda"},
          {k:"pendaftaran", l:"Daftar E-Sport"},
          ...(sudahLogin?[
            {k:"daftar-peserta", l:"📋 Peserta"},
            {k:"cashflow", l:"💰 Cashflow"}
          ]:[])
        ].map(m => (
          <button key={m.k} onClick={()=>{setHalaman(m.k); setLangkahDaftar(1); setPesanDaftar(""); setSuksesDaftar(false); setTimTerbuka(null);}} style={{
            padding:"0.5rem 0.8rem", border:"none", borderRadius:"6px", background: halaman===m.k?"rgba(255,255,255,0.25)":"transparent", color:"#fff", cursor:"pointer", fontSize:"0.9rem"
          }}>{m.l}</button>
        ))}
        {sudahLogin && <button onClick={()=>{setSudahLogin(false); setHalaman("beranda");}} style={{marginLeft:"auto", padding:"0.5rem 0.8rem", border:"none", borderRadius:"6px", background:"#dc2626", color:"#fff", cursor:"pointer"}}>Logout</button>}
        {!sudahLogin && halaman!=="login" && <button onClick={()=>setHalaman("login")} style={{marginLeft:"auto", padding:"0.5rem 0.8rem", border:"none", borderRadius:"6px", background:"#16a34a", color:"#fff", cursor:"pointer"}}>Login Panitia</button>}
      </nav>

      <main style={{padding:"2rem 1.2rem", maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1}}>
        {/* === BERANDA === */}
        {halaman==="beranda" && (
          <div style={{textAlign:"center", marginTop:"2rem"}}>
            <h1 style={{fontSize:"2.2rem", marginBottom:"1rem"}}>BC EDUFAIR 2026</h1>
            <p style={{fontSize:"1.2rem", opacity:0.9, maxWidth:700, margin:"0 auto 2.5rem", fontStyle:"italic"}}>✨ Broadcast Beyond Boundaries ✨</p>
            <button onClick={()=>setHalaman("pendaftaran")} style={{padding:"0.9rem 2rem", fontSize:"1rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", margin:"0.5rem"}}>🎮 Daftar E-Sport</button>
            {!sudahLogin && <button onClick={()=>setHalaman("login")} style={{padding:"0.9rem 2rem", fontSize:"1rem", background:"transparent", color:"#fff", border:"2px solid #fff", borderRadius:"8px", cursor:"pointer", margin:"0.5rem"}}>🔐 Masuk Panitia</button>}
          </div>
        )}

        {/* === LOGIN === */}
        {halaman==="login" && !sudahLogin && (
          <div style={{maxWidth:400, margin:"3rem auto", background:"rgba(255,255,255,0.1)", padding:"2rem", borderRadius:"12px"}}>
            <h2 style={{textAlign:"center", marginBottom:"1.5rem"}}>🔐 Login Panitia</h2>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:"1rem"}}>
                <label>Username</label>
                <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} required style={{width:"100%", padding:"0.6rem", borderRadius:"6px", border:"none", marginTop:"0.3rem"}} />
              </div>
              <div style={{marginBottom:"1rem"}}>
                <label>Password</label>
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{width:"100%", padding:"0.6rem", borderRadius:"6px", border:"none", marginTop:"0.3rem"}} />
              </div>
              {pesanLogin && <p style={{color:"#ffb6c1"}}>{pesanLogin}</p>}
              <button type="submit" style={{width:"100%", padding:"0.7rem", background:"#16a34a", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer"}}>Masuk</button>
            </form>
          </div>
        )}

        {/* === PENDAFTARAN === */}
        {halaman==="pendaftaran" && !suksesDaftar && (
          <div style={{maxWidth:700, margin:"0 auto", background:"rgba(255,255,255,0.08)", padding:"1.5rem", borderRadius:"12px"}}>
            <h2 style={{textAlign:"center", marginBottom:"1.5rem"}}>🎮 BC EDUFAIR 2026 — E-SPORT</h2>
            {pesanDaftar && <div style={{background:"rgba(22,163,74,0.2)", padding:"1rem", borderRadius:"8px", marginBottom:"1.5rem", textAlign:"center"}}>{pesanDaftar}</div>}
            
            {langkahDaftar===1 && (
              <div>
                <h3 style={{color:"#ffd700", marginBottom:"1rem"}}>LANGKAH 1 — DATA TIM & KETUA</h3>
                {[
                  ["Nama Tim *", "namaTim"],
                  ["Nama Ketua *", "namaKetua"],
                  ["Nomor WhatsApp Ketua *", "waKetua"],
                  ["User ID Ketua *", "userIdKetua"],
                  ["Server ID Ketua *", "serverIdKetua"],
                  ["Nickname In-Game Ketua *", "nicknameKetua"]
                ].map(([lbl, field]) => (
                  <div key={field} style={{marginBottom:"0.8rem"}}>
                    <label>{lbl}</label>
                    <input type="text" value={formTim[field]} onChange={(e)=>setFormTim({...formTim, [field]:e.target.value})} required style={{width:"100%", padding:"0.6rem", borderRadius:"6px", border:"none", marginTop:"0.3rem"}} />
                  </div>
                ))}
                <button onClick={()=>setLangkahDaftar(2)} style={{padding:"0.7rem 1.5rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer", width:"100%", marginTop:"0.5rem"}}>Lanjut → Data Anggota</button>
              </div>
            )}

            {langkahDaftar===2 && (
              <div>
                <h3 style={{color:"#ffd700", marginBottom:"1rem"}}>LANGKAH 2 — DATA PEMAIN</h3>
                <p style={{fontSize:"0.9rem", opacity:0.8, marginBottom:"1rem"}}>Pemain 1=Ketua, 1-5 Wajib, Pemain 6=Cadangan (Opsional)</p>
                {formTim.pemain.map((p, i) => (
                  <div key={i} style={{marginBottom:"1rem", padding:"1rem", background:p.cadangan?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.05)", borderRadius:"8px"}}>
                    <h4 style={{margin:"0 0 0.6rem 0", color:p.cadangan?"#ffd700":"#fff"}}>
                      {i===0 ? "👑 PEMAIN 1 (KETUA)" : p.cadangan ? "⭐ PEMAIN 6 (CADANGAN)" : `PEMAIN ${i+1}`}
                    </h4>
                    {[
                      ["Nama Lengkap"+(i<5?"*":""), "nama"],
                      ["Nickname / UID / SID"+(i<5?"*":""), "nickname"],
                      ["No. WhatsApp"+(i<5?"*":""), "wa"]
                    ].map(([lbl, f]) => (
                      <div key={f} style={{marginBottom:"0.5rem"}}>
                        <label style={{fontSize:"0.9rem"}}>{lbl}</label>
                        <input type="text" value={p[f]} onChange={(e)=>{
                          const arr = [...formTim.pemain]; arr[i][f]=e.target.value; setFormTim({...formTim, pemain:arr});
                        }} style={{width:"100%", padding:"0.5rem", borderRadius:"5px", border:"none", marginTop:"0.25rem"}} />
                      </div>
                    ))}
                    <div>
                      <label style={{fontSize:"0.9rem"}}>Foto KTP/KTM {i<5?"*":""}</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e)=>{
                        const arr = [...formTim.pemain]; arr[i].ktmFile = e.target.files[0]||null; setFormTim({...formTim, pemain:arr});
                      }} style={{marginTop:"0.25rem"}} />
                    </div>
                  </div>
                ))}
                <div style={{display:"flex", gap:"0.8rem", marginTop:"0.5rem"}}>
                  <button onClick={()=>setLangkahDaftar(1)} style={{padding:"0.7rem 1rem", background:"transparent", color:"#fff", border:"1px solid #fff", borderRadius:"6px", cursor:"pointer"}}>← Kembali</button>
                  <button onClick={()=>setLangkahDaftar(3)} style={{padding:"0.7rem 1.2rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer", flex:1}}>Lanjut → Pembayaran</button>
                </div>
              </div>
            )}

            {langkahDaftar===3 && (
              <div>
                <h3 style={{color:"#ffd700", marginBottom:"1rem"}}>LANGKAH 3 — PEMBAYARAN</h3>
                <div style={{background:"rgba(255,255,255,0.05)", padding:"1.2rem", borderRadius:"8px", marginBottom:"1rem"}}>
                  <h4 style={{margin:"0 0 0.8rem 0"}}>💳 Scan QRIS</h4>
                  <img src="/qris.jpg" alt="QRIS" style={{width:160, height:160, borderRadius:"8px", objectFit:"cover"}} />
                  <h4 style={{margin:"1rem 0 0.5rem 0"}}>🏦 SeaBank</h4>
                  <p style={{margin:"0.25rem 0"}}>No. Rekening: <strong>9019409468300</strong></p>
                  <p style={{margin:"0.25rem 0"}}>a.n. Muhammad Rusnadi</p>
                </div>
                <div style={{background:"rgba(22,163,74,0.2)", padding:"1rem", borderRadius:"8px", marginBottom:"1rem", textAlign:"center"}}>
                  <h4 style={{margin:"0 0 0.5rem 0"}}>💰 BIAYA PENDAFTARAN</h4>
                  <p style={{fontSize:"1.8rem", fontWeight:"bold", color:"#ffd700", margin:0}}>Rp 75.000,-</p>
                </div>
                <div style={{marginBottom:"1.2rem", padding:"1rem", background:"rgba(255,215,0,0.1)", borderRadius:"8px"}}>
                  <label style={{fontWeight:"bold"}}>📎 Unggah Bukti Bayar *</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e)=>setFormTim({...formTim, buktiBayar:e.target.files[0]||null})} required style={{marginTop:"0.5rem"}} />
                  {formTim.buktiBayar && <p style={{color:"#90ee90", margin:"0.5rem 0 0 0"}}>✅ Sudah dipilih: {formTim.buktiBayar.name}</p>}
                </div>
                <div style={{display:"flex", gap:"0.8rem"}}>
                  <button onClick={()=>setLangkahDaftar(2)} style={{padding:"0.7rem 1rem", background:"transparent", color:"#fff", border:"1px solid #fff", borderRadius:"6px", cursor:"pointer"}}>← Kembali</button>
                  <button onClick={kirimPendaftaran} style={{padding:"0.7rem 1.2rem", background:"#16a34a", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer", flex:1, fontWeight:"bold"}}>✅ KIRIM PENDAFTARAN</button>
                </div>
              </div>
            )}
          </div>
        )}

        {halaman==="pendaftaran" && suksesDaftar && (
          <div style={{maxWidth:600, margin:"2rem auto", background:"rgba(22,163,74,0.15)", padding:"2rem", borderRadius:"12px", textAlign:"center"}}>
            <div style={{fontSize:"4rem"}}>✅</div>
            <h2 style={{color:"#90ee90", margin:"1rem 0"}}>PENDAFTARAN BERHASIL!</h2>
            <p style={{marginBottom:"1.5rem"}}>Silakan masuk ke Grup WhatsApp untuk info lebih lanjut:</p>
            <a href={LINK_GRUP_WA} target="_blank" rel="noreferrer" style={{display:"inline-block", padding:"0.9rem 2rem", background:"#25D366", color:"#fff", borderRadius:"8px", fontSize:"1rem", fontWeight:"bold", textDecoration:"none", marginBottom:"1.5rem"}}>💬 MASUK GRUP WA</a>
            <p style={{fontSize:"0.85rem", opacity:0.8, wordBreak:"break-all"}}>{LINK_GRUP_WA}</p>
            <button onClick={daftarTimBaruLagi} style={{marginTop:"1rem", padding:"0.7rem 1.5rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer"}}>🎮 Daftar Tim Lainnya</button>
          </div>
        )}

        {/* === DAFTAR PESERTA === */}
        {sudahLogin && halaman==="daftar-peserta" && (
          <div>
            <h2 style={{textAlign:"center", marginBottom:"1.5rem"}}>📋 DAFTAR TIM PESERTA</h2>
            <p style={{textAlign:"center", marginBottom:"1.5rem"}}>Jumlah Tim: <strong style={{color:"#ffd700", fontSize:"1.2rem"}}>{daftarTim.length}</strong></p>
            {daftarTim.length === 0 ? (
              <div style={{textAlign:"center", padding:"3rem", opacity:0.7}}>
                <p style={{fontSize:"1.1rem"}}>Belum ada tim yang mendaftar.</p>
              </div>
            ) : daftarTim.map((tim, no) => (
              <div key={tim.id} style={{marginBottom:"1.2rem", background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"1rem"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.5rem"}}>
                  <h3 style={{margin:0, color:"#ffd700", fontSize:"1rem"}}>Tim {no+1}: {tim.namaTim}</h3>
                  <button onClick={()=>setTimTerbuka(timTerbuka?.id===tim.id?null:tim)} style={{padding:"0.4rem 0.8rem", background:"#3b82f6", color:"#fff", border:"none", borderRadius:"6px", cursor:"pointer", fontSize:"0.9rem"}}>
                    {timTerbuka?.id===tim.id ? "🔼 Tutup" : "🔍 Lihat Detail"}
                  </button>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"0.4rem", fontSize:"0.9rem"}}>
                  <div><strong>Ketua:</strong> {tim.namaKetua}</div>
                  <div><strong>No.WA:</strong> {tim.waKetua}</div>
                  <div><strong>Pemain:</strong> {tim.jumlahPemain}</div>
                  <div><strong>Bukti:</strong> {tim.buktiBayarUrl?<a href={tim.buktiBayarUrl} target="_blank" rel="noreferrer" style={{color:"#90ee90"}}>👁 Lihat</a>:tim.buktiBayar}</div>
                </div>
                {timTerbuka?.id===tim.id && (
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:"1rem", marginTop:"0.5rem"}}>
                    <h4 style={{margin:"0 0 0.6rem 0", color:"#90ee90", fontSize:"0.95rem"}}>📋 DATA ANGGOTA</h4>
                    {tim.pemain.map((p, i) => p.nama ? (
                      <div key={i} style={{marginBottom:"0.6rem", padding:"0.6rem", background:p.cadangan?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.05)", borderRadius:"6px", fontSize:"0.9rem"}}>
                        <strong style={{color:p.cadangan?"#ffd700":"#fff"}}>{i===0?"👑 Pemain 1":p.cadangan?"⭐ Pemain 6":"Pemain "+(i+1)}:</strong> {p.nama}
                        <div style={{marginTop:"0.25rem", opacity:0.85, fontSize:"0.85rem"}}>
                          {p.nickname&&<div>Nickname: {p.nickname}</div>}
                          {p.wa&&<div>No.WA: {p.wa}</div>}
                          {p.ktmUrl&&<div>Foto: <a href={p.ktmUrl} target="_blank" rel="noreferrer" style={{color:"#90ee90"}}>👁 Lihat</a></div>}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === CASHFLOW === */}
        {sudahLogin && halaman==="cashflow" && (
          <div>
            <h2 style={{textAlign:"center", marginBottom:"1.5rem"}}>💰 CASHFLOW ANGGARAN</h2>
            
            {/* PEMASUKAN */}
            <div style={{marginBottom:"1.5rem", background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"1rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.8rem"}}>
                <h3 style={{margin:0, color:"#90ee90", fontSize:"1rem"}}>➕ PEMASUKAN</h3>
                <button onClick={()=>tambahItem("pemasukan")} style={{padding:"0.4rem 0.7rem", background:"#16a34a", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer", fontSize:"0.9rem"}}>+ Tambah</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 40px", gap:"0.4rem", fontWeight:"bold", fontSize:"0.85rem", opacity:0.8, marginBottom:"0.4rem"}}>
                <span>Uraian</span><span style={{textAlign:"right"}}>Rencana</span><span style={{textAlign:"right"}}>Realisasi</span><span style={{textAlign:"right"}}>Selisih</span><span></span>
              </div>
              {itemPemasukan.map((i, idx) => (
                <div key={idx} style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 40px", gap:"0.4rem", alignItems:"center", marginBottom:"0.3rem"}}>
                  <input type="text" value={i.nama} onChange={(e)=>ubahItem("pemasukan",idx,"nama",e.target.value)} placeholder="Nama pemasukan..." style={{padding:"0.4rem", borderRadius:"4px", border:"none"}} />
                  <input type="number" value={i.rencana||""} onChange={(e)=>ubahItem("pemasukan",idx,"rencana",e.target.value)} placeholder="0" style={{padding:"0.4rem", borderRadius:"4px", border:"none", textAlign:"right"}} />
                  <input type="number" value={i.realisasi||""} onChange={(e)=>ubahItem("pemasukan",idx,"realisasi",e.target.value)} placeholder="0" style={{padding:"0.4rem", borderRadius:"4px", border:"none", textAlign:"right"}} />
                  <span style={{textAlign:"right", fontWeight:"bold", color: ((i.realisasi||0)-(i.rencana||0))>=0?"#90ee90":"#ffb6c1"}}>{((i.realisasi||0)-(i.rencana||0)).toLocaleString('id-ID')}</span>
                  <button onClick={()=>hapusItem("pemasukan",idx)} style={{background:"#dc2626", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer"}}>×</button>
                </div>
              ))}
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"0.4rem", marginTop:"0.6rem", paddingTop:"0.6rem", borderTop:"1px solid rgba(255,255,255,0.15)", fontWeight:"bold", fontSize:"0.9rem"}}>
                <span>TOTAL</span>
                <span style={{textAlign:"right"}}>{totalPemasukan.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{totalPemasukan.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:totalPemasukan.selisih>=0?"#90ee90":"#ffb6c1"}}>{totalPemasukan.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* PENGELUARAN */}
            <div style={{marginBottom:"1.5rem", background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"1rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.8rem"}}>
                <h3 style={{margin:0, color:"#ffb6c1", fontSize:"1rem"}}>➖ PENGELUARAN</h3>
                <button onClick={()=>tambahItem("pengeluaran")} style={{padding:"0.4rem 0.7rem", background:"#dc2626", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer", fontSize:"0.9rem"}}>+ Tambah</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 40px", gap:"0.4rem", fontWeight:"bold", fontSize:"0.85rem", opacity:0.8, marginBottom:"0.4rem"}}>
                <span>Uraian</span><span style={{textAlign:"right"}}>Rencana</span><span style={{textAlign:"right"}}>Realisasi</span><span style={{textAlign:"right"}}>Selisih</span><span></span>
              </div>
              {itemPengeluaran.map((i, idx) => (
                <div key={idx} style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 40px", gap:"0.4rem", alignItems:"center", marginBottom:"0.3rem"}}>
                  <input type="text" value={i.nama} onChange={(e)=>ubahItem("pengeluaran",idx,"nama",e.target.value)} placeholder="Nama pengeluaran..." style={{padding:"0.4rem", borderRadius:"4px", border:"none"}} />
                  <input type="number" value={i.rencana||""} onChange={(e)=>ubahItem("pengeluaran",idx,"rencana",e.target.value)} placeholder="0" style={{padding:"0.4rem", borderRadius:"4px", border:"none", textAlign:"right"}} />
                  <input type="number" value={i.realisasi||""} onChange={(e)=>ubahItem("pengeluaran",idx,"realisasi",e.target.value)} placeholder="0" style={{padding:"0.4rem", borderRadius:"4px", border:"none", textAlign:"right"}} />
                  <span style={{textAlign:"right", fontWeight:"bold", color: ((i.realisasi||0)-(i.rencana||0))>=0?"#90ee90":"#ffb6c1"}}>{((i.realisasi||0)-(i.rencana||0)).toLocaleString('id-ID')}</span>
                  <button onClick={()=>hapusItem("pengeluaran",idx)} style={{background:"#dc2626", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer"}}>×</button>
                </div>
              ))}
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"0.4rem", marginTop:"0.6rem", paddingTop:"0.6rem", borderTop:"1px solid rgba(255,255,255,0.15)", fontWeight:"bold", fontSize:"0.9rem"}}>
                <span>TOTAL</span>
                <span style={{textAlign:"right"}}>{totalPengeluaran.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{totalPengeluaran.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:totalPengeluaran.selisih>=0?"#90ee90":"#ffb6c1"}}>{totalPengeluaran.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* SALDO */}
            <div style={{background:"rgba(255,215,0,0.15)", borderRadius:"10px", padding:"1.2rem", border:"2px solid rgba(255,215,0,0.4)"}}>
              <h3 style={{textAlign:"center", margin:"0 0 0.8rem 0", color:"#ffd700", fontSize:"1rem"}}>📊 SALDO AKHIR</h3>
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"0.4rem", fontWeight:"bold", fontSize:"0.95rem"}}>
                <span>SALDO</span>
                <span style={{textAlign:"right"}}>{saldo.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{saldo.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:saldo.selisih>=0?"#90ee90":"#ffb6c1"}}>{saldo.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{marginTop:"1.5rem", textAlign:"center"}}>
              <button onClick={downloadExcel} style={{padding:"0.8rem 2rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"8px", fontSize:"1rem", fontWeight:"bold", cursor:"pointer"}}>📥 DOWNLOAD EXCEL</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;