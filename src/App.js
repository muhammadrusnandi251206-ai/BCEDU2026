import React, { useState } from 'react';

const API_URL = "http://127.0.0.1:5000";

function App() {
  const [halaman, setHalaman] = useState("beranda");
  const [sudahLogin, setSudahLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pesanLogin, setPesanLogin] = useState("");

  // === LINK GRUP WA — SUDAH KAMU ISI ===
  const LINK_GRUP_WA = "https://chat.whatsapp.com/CbqmJzWdrHjDe1v5GypSi4?s=cl&p=i&mlu=4&ilr=4";

  // === DAFTAR TIM PENDAFTAR ===
  const [daftarTim, setDaftarTim] = useState([]);
  const [timTerbuka, setTimTerbuka] = useState(null);

  // === FORM PENDAFTARAN ===
  const [formTim, setFormTim] = useState({
    namaTim: "",
    namaKetua: "",
    waKetua: "",
    userIdKetua: "",
    serverIdKetua: "",
    nicknameKetua: "",
    pemain: [
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "" },
      { nama: "", nickname: "", wa: "", ktmFile: null, ktmUrl: "", cadangan: true }
    ],
    buktiBayar: null,
    buktiBayarUrl: ""
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

  // === DOWNLOAD EXCEL CASHFLOW ===
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

  // === KIRIM PENDAFTARAN & SIMPAN KE DAFTAR PANITIA ===
  const kirimPendaftaran = async (e) => {
    e.preventDefault();
    if (!formTim.buktiBayar) {
      alert("⚠️ Silakan unggah bukti pembayaran terlebih dahulu!");
      return;
    }

    // Buat URL sementara untuk file yang diunggah
    const pemainDenganUrl = formTim.pemain.map(p => ({
      ...p,
      ktmUrl: p.ktmFile ? URL.createObjectURL(p.ktmFile) : ""
    }));
    const buktiUrl = formTim.buktiBayar ? URL.createObjectURL(formTim.buktiBayar) : "";

    const timBaru = {
      id: Date.now(),
      namaTim: formTim.namaTim,
      namaKetua: formTim.namaKetua,
      waKetua: formTim.waKetua,
      userIdKetua: formTim.userIdKetua,
      serverIdKetua: formTim.serverIdKetua,
      nicknameKetua: formTim.nicknameKetua,
      pemain: pemainDenganUrl,
      jumlahPemain: formTim.pemain.filter((_,i)=>i<5).filter(p=>p.nama).length + (formTim.pemain[5].nama?1:0),
      buktiBayar: formTim.buktiBayar.name || "Sudah diunggah",
      buktiBayarUrl: buktiUrl
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
    setSuksesDaftar(false);
    setPesanDaftar("");
    setLangkahDaftar(1);
  };

  return (
    <div style={{fontFamily:"sans-serif", minHeight:"100vh", background:"linear-gradient(135deg, #1e3a8a, #3b82f6)", color:"#fff"}}>
      {/* === HEADER === */}
      <div style={{background:"rgba(0,0,0,0.25)", padding:"1rem 2rem", borderBottom:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem"}}>
        <div style={{display:"flex", gap:"1.5rem", alignItems:"center"}}>
          <img src="/logo-ueu.png" alt="Logo UEU" style={{width:60,height:60,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
          <img src="/logo-hmj.png" alt="Logo HMJ" style={{width:60,height:60,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
          <img src="/logo-bced.png" alt="Logo BCED" style={{width:60,height:60,objectFit:"contain",background:"#fff",borderRadius:"8px",padding:"4px"}} />
        </div>
        <div style={{textAlign:"right"}}>
          <h3 style={{margin:"0 0 0.25rem 0", fontSize:"1rem"}}>UNIVERSITAS ESA UNGGUL</h3>
          <p style={{margin:0, fontSize:"0.85rem", opacity:0.85}}>FAKULTAS ILMU KOMUNIKASI — PROGRAM STUDI BROADCASTING</p>
          <p style={{margin:"0.25rem 0 0 0", fontSize:"0.9rem", fontWeight:"bold", color:"#ffd700"}}>BCEDUFAIR 2026</p>
        </div>
      </div>

      {/* === NAVIGASI === */}
      <nav style={{background:"rgba(0,0,0,0.15)", padding:"0.6rem 2rem", display:"flex", gap:"0.8rem", flexWrap:"wrap"}}>
        {[
          {k:"beranda", l:"Beranda"},
          {k:"pendaftaran", l:"Pendaftaran E-Sport"},
          ...(sudahLogin?[
            {k:"daftar-peserta", l:"📋 Daftar Peserta"},
            {k:"cashflow", l:"💰 Cashflow Anggaran"}
          ]:[])
        ].map(m => (
          <button key={m.k} onClick={()=>{setHalaman(m.k); setLangkahDaftar(1); setPesanDaftar(""); setSuksesDaftar(false); setTimTerbuka(null);}} style={{
            padding:"0.5rem 1rem", border:"none", borderRadius:"6px", background: halaman===m.k?"rgba(255,255,255,0.25)":"transparent", color:"#fff", cursor:"pointer", fontSize:"0.95rem"
          }}>{m.l}</button>
        ))}
        {sudahLogin && <button onClick={()=>{setSudahLogin(false); setHalaman("beranda");}} style={{marginLeft:"auto", padding:"0.5rem 1rem", border:"none", borderRadius:"6px", background:"#dc2626", color:"#fff", cursor:"pointer"}}>Logout</button>}
        {!sudahLogin && halaman!=="login" && <button onClick={()=>setHalaman("login")} style={{marginLeft:"auto", padding:"0.5rem 1rem", border:"none", borderRadius:"6px", background:"#16a34a", color:"#fff", cursor:"pointer"}}>Login Panitia</button>}
      </nav>

      <main style={{padding:"2rem", maxWidth:1100, margin:"0 auto"}}>

        {/* === BERANDA === */}
        {halaman==="beranda" && (
          <div style={{textAlign:"center", marginTop:"2rem"}}>
            <h1 style={{fontSize:"2.5rem", marginBottom:"1rem"}}>Selamat Datang di BCEDUFAIR 2026</h1>
            <p style={{fontSize:"1.1rem", opacity:0.9, maxWidth:700, margin:"0 auto 2rem"}}>Sistem Informasi Pengelolaan Kegiatan & Anggaran</p>
            <button onClick={()=>setHalaman("pendaftaran")} style={{padding:"0.9rem 2rem", fontSize:"1rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", marginRight:"1rem"}}>🎮 Daftar E-Sport</button>
            {!sudahLogin && <button onClick={()=>setHalaman("login")} style={{padding:"0.9rem 2rem", fontSize:"1rem", background:"transparent", color:"#fff", border:"2px solid #fff", borderRadius:"8px", cursor:"pointer"}}>🔐 Masuk Panitia</button>}
          </div>
        )}

        {/* === LOGIN PANITIA === */}
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

        {/* === PENDAFTARAN E-SPORT === */}
        {halaman==="pendaftaran" && !suksesDaftar && (
          <div style={{maxWidth:700, margin:"0 auto", background:"rgba(255,255,255,0.08)", padding:"2rem", borderRadius:"12px"}}>
            <h2 style={{textAlign:"center", marginBottom:"1.5rem"}}>🎮 BC EDUFAIR 2026 — E-SPORT</h2>
            {pesanDaftar && <div style={{background:"rgba(22,163,74,0.2)", padding:"1rem", borderRadius:"8px", marginBottom:"1.5rem", textAlign:"center", fontSize:"1.05rem"}}>{pesanDaftar}</div>}

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
                <p style={{fontSize:"0.9rem", opacity:0.8, marginBottom:"1rem"}}>Pemain 1 = Ketua Tim, Pemain 1-5 Wajib, Pemain 6 = Cadangan (Boleh dikosongkan)</p>
                {formTim.pemain.map((p, i) => (
                  <div key={i} style={{marginBottom:"1.2rem", padding:"1rem", background:p.cadangan?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.05)", borderRadius:"8px"}}>
                    <h4 style={{margin:"0 0 0.6rem 0", color:p.cadangan?"#ffd700":"#fff"}}>
                      {i===0 ? "👑 PEMAIN 1 (KETUA)" : p.cadangan ? "⭐ PEMAIN 6 (CADANGAN — Opsional)" : `PEMAIN ${i+1}`}
                    </h4>
                    {[
                      ["Nama Lengkap" + (i<5?" *":""), "nama"],
                      ["Nickname / User ID / Server ID" + (i<5?" *":""), "nickname"],
                      ["Nomor WhatsApp" + (i<5?" *":""), "wa"]
                    ].map(([lbl, f]) => (
                      <div key={f} style={{marginBottom:"0.5rem"}}>
                        <label style={{fontSize:"0.9rem"}}>{lbl}</label>
                        <input type="text" value={p[f]} onChange={(e)=>{
                          const arr = [...formTim.pemain]; arr[i][f]=e.target.value; setFormTim({...formTim, pemain:arr});
                        }} style={{width:"100%", padding:"0.5rem", borderRadius:"5px", border:"none", marginTop:"0.25rem"}} />
                      </div>
                    ))}
                    <div style={{marginBottom:"0.3rem"}}>
                      <label style={{fontSize:"0.9rem"}}>Foto KTP / KTM {i<5?"*":""}</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e)=>{
                        const arr = [...formTim.pemain]; arr[i].ktmFile = e.target.files[0]||null; setFormTim({...formTim, pemain:arr});
                      }} style={{marginTop:"0.25rem"}} />
                    </div>
                  </div>
                ))}
                <div style={{display:"flex", gap:"1rem", marginTop:"0.5rem"}}>
                  <button onClick={()=>setLangkahDaftar(1)} style={{padding:"0.7rem 1.2rem", background:"transparent", color:"#fff", border:"1px solid #fff", borderRadius:"6px", cursor:"pointer"}}>← Kembali</button>
                  <button onClick={()=>setLangkahDaftar(3)} style={{padding:"0.7rem 1.5rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer", flex:1}}>Lanjut → Pembayaran</button>
                </div>
              </div>
            )}

            {langkahDaftar===3 && (
              <div>
                <h3 style={{color:"#ffd700", marginBottom:"1rem"}}>LANGKAH 3 — PEMBAYARAN</h3>
                <div style={{background:"rgba(255,255,255,0.05)", padding:"1.2rem", borderRadius:"8px", marginBottom:"1rem"}}>
                  <h4 style={{margin:"0 0 0.8rem 0"}}>💳 Scan QRIS</h4>
                  <img src="/qris.jpg" alt="QRIS Pembayaran" style={{width:180, height:180, borderRadius:"8px", objectFit:"cover", marginBottom:"0.5rem"}} />
                  <h4 style={{margin:"1rem 0 0.5rem 0"}}>🏦 Transfer Bank — SeaBank</h4>
                  <p style={{margin:"0.25rem 0", fontSize:"0.95rem"}}>Nomor Rekening: <strong> 9019409468300 </strong></p>
                  <p style={{margin:"0.25rem 0", fontSize:"0.95rem"}}>a.n. Muhammad Rusnadi</p>
                </div>
                <div style={{background:"rgba(22,163,74,0.2)", padding:"1rem", borderRadius:"8px", marginBottom:"1rem", textAlign:"center"}}>
                  <h4 style={{margin:"0 0 0.5rem 0"}}>💰 BIAYA PENDAFTARAN</h4>
                  <p style={{fontSize:"1.8rem", fontWeight:"bold", color:"#ffd700", margin:0}}>Rp 75.000,-</p>
                </div>
                <div style={{marginBottom:"1.2rem", padding:"1rem", background:"rgba(255,215,0,0.1)", borderRadius:"8px"}}>
                  <label style={{fontWeight:"bold"}}>📎 Unggah Bukti Pembayaran * <span style={{color:"#ff6"}}>(WAJIB diisi sebelum klik Kirim!)</span></label>
                  <input type="file" accept="image/*,.pdf" onChange={(e)=>setFormTim({...formTim, buktiBayar:e.target.files[0]||null})} required style={{marginTop:"0.5rem"}} />
                  {formTim.buktiBayar && <p style={{color:"#90ee90", margin:"0.5rem 0 0 0"}}>✅ Sudah dipilih: {formTim.buktiBayar.name}</p>}
                </div>
                <div style={{display:"flex", gap:"1rem", marginTop:"0.5rem"}}>
                  <button onClick={()=>setLangkahDaftar(2)} style={{padding:"0.7rem 1.2rem", background:"transparent", color:"#fff", border:"1px solid #fff", borderRadius:"6px", cursor:"pointer"}}>← Kembali</button>
                  <button onClick={kirimPendaftaran} style={{padding:"0.7rem 1.5rem", background:"#16a34a", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer", flex:1, fontWeight:"bold"}}>✅ KIRIM PENDAFTARAN</button>
                </div>
              </div>
            )}
          </div>
        )}

        {halaman==="pendaftaran" && suksesDaftar && (
          <div style={{maxWidth:600, margin:"2rem auto", background:"rgba(22,163,74,0.15)", padding:"2.5rem", borderRadius:"12px", textAlign:"center"}}>
            <div style={{fontSize:"4rem"}}>✅</div>
            <h2 style={{color:"#90ee90", margin:"1rem 0"}}>PENDAFTARAN BERHASIL!</h2>
            <p style={{fontSize:"1.05rem", marginBottom:"1.5rem"}}>Selamat! Pendaftaran tim kamu sudah kami terima.<br/>Silakan masuk ke Grup WhatsApp untuk informasi lebih lanjut:</p>
            <a href={LINK_GRUP_WA} target="_blank" rel="noreferrer" style={{display:"inline-block", padding:"0.9rem 2rem", background:"#25D366", color:"#fff", borderRadius:"8px", fontSize:"1.05rem", fontWeight:"bold", textDecoration:"none", marginBottom:"1.5rem"}}>💬 MASUK GRUP WHATSAPP PESERTA</a>
            <p style={{fontSize:"0.9rem", opacity:0.8}}>atau salin link: <code style={{background:"rgba(0,0,0,0.2)", padding:"0.3rem 0.6rem", borderRadius:"4px", fontSize:"0.85rem"}}>{LINK_GRUP_WA}</code></p>
            <button onClick={daftarTimBaruLagi} style={{marginTop:"1.5rem", padding:"0.7rem 1.5rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"6px", fontSize:"1rem", cursor:"pointer"}}>🎮 Daftar Tim Lainnya</button>
          </div>
        )}

        {/* === DAFTAR PESERTA LENGKAP === */}
        {sudahLogin && halaman==="daftar-peserta" && (
          <div>
            <h2 style={{textAlign:"center", marginBottom:"2rem", fontSize:"1.8rem"}}>📋 DAFTAR TIM PESERTA BCEDUFAIR 2026</h2>
            <p style={{textAlign:"center", marginBottom:"1.5rem", fontSize:"1.05rem"}}>Jumlah Tim Terdaftar: <strong style={{color:"#ffd700", fontSize:"1.2rem"}}>{daftarTim.length}</strong></p>

            {daftarTim.length === 0 ? (
              <div style={{textAlign:"center", padding:"3rem", opacity:0.7}}>
                <p style={{fontSize:"1.2rem"}}>Belum ada tim yang mendaftar.</p>
                <p>Data pendaftaran akan muncul disini setelah ada yang mendaftar.</p>
              </div>
            ) : (
              <div>
                {daftarTim.map((tim, no) => (
                  <div key={tim.id} style={{marginBottom:"1.5rem", background:"rgba(255,255,255,0.08)", borderRadius:"12px", padding:"1.2rem"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.8rem"}}>
                      <h3 style={{margin:0, color:"#ffd700"}}>Tim {no+1}: {tim.namaTim}</h3>
                      <button onClick={()=>setTimTerbuka(timTerbuka?.id===tim.id?null:tim)} style={{padding:"0.4rem 1rem", background:"#3b82f6", color:"#fff", border:"none", borderRadius:"6px", cursor:"pointer"}}>
                        {timTerbuka?.id===tim.id ? "🔼 Tutup Detail" : "🔍 Lihat Detail Pemain"}
                      </button>
                    </div>
                    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.5rem", marginBottom:"0.8rem"}}>
                      <div><strong>Ketua:</strong> {tim.namaKetua}</div>
                      <div><strong>No. WA:</strong> {tim.waKetua}</div>
                      <div><strong>Jumlah Pemain:</strong> {tim.jumlahPemain}</div>
                      <div><strong>Bukti Bayar:</strong> {tim.buktiBayarUrl?<a href={tim.buktiBayarUrl} target="_blank" rel="noreferrer" style={{color:"#90ee90"}}>👁 Lihat</a>:tim.buktiBayar}</div>
                    </div>

                    {timTerbuka?.id===tim.id && (
                      <div style={{borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:"1rem"}}>
                        <h4 style={{margin:"0 0 0.8rem 0", color:"#90ee90"}}>📋 DATA ANGGOTA TIM</h4>
                        {tim.pemain.map((p, i) => (
                          p.nama ? (
                            <div key={i} style={{marginBottom:"0.8rem", padding:"0.8rem", background:p.cadangan?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.05)", borderRadius:"8px"}}>
                              <h5 style={{margin:"0 0 0.5rem 0", color:p.cadangan?"#ffd700":"#fff"}}>
                                {i===0 ? "👑 PEMAIN 1 (KETUA)" : p.cadangan ? "⭐ PEMAIN 6 (CADANGAN)" : `PEMAIN ${i+1}`}
                              </h5>
                              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"0.4rem", fontSize:"0.92rem"}}>
                                <div><strong>Nama Lengkap:</strong> {p.nama}</div>
                                <div><strong>Nickname/UID/SID:</strong> {p.nickname||"-"}</div>
                                <div><strong>No. WhatsApp:</strong> {p.wa||"-"}</div>
                                <div><strong>Foto KTM/KTP:</strong> {p.ktmUrl?<a href={p.ktmUrl} target="_blank" rel="noreferrer" style={{color:"#90ee90"}}>👁 Klik Lihat Foto</a>:"Tidak diunggah"}</div>
                              </div>
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === CASHFLOW ANGGARAN === */}
        {sudahLogin && halaman==="cashflow" && (
          <div>
            <h2 style={{textAlign:"center", marginBottom:"2rem", fontSize:"1.8rem"}}>💰 CASHFLOW ANGGARAN</h2>

            <div style={{marginBottom:"2rem", background:"rgba(255,255,255,0.08)", borderRadius:"12px", padding:"1.2rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
                <h3 style={{margin:0, color:"#90ee90"}}>➕ PEMASUKAN</h3>
                <button onClick={()=>tambahItem("pemasukan")} style={{padding:"0.4rem 0.8rem", background:"#16a34a", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer"}}>+ Tambah</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr 0.5fr", gap:"0.5rem", fontWeight:"bold", fontSize:"0.9rem", opacity:0.8, marginBottom:"0.5rem"}}>
                <span>Uraian</span><span style={{textAlign:"right"}}>Rencana (Rp)</span><span style={{textAlign:"right"}}>Realisasi (Rp)</span><span style={{textAlign:"right"}}>Selisih</span><span></span>
              </div>
              {itemPemasukan.map((i, idx) => (
                <div key={idx} style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr 0.5fr", gap:"0.5rem", alignItems:"center", marginBottom:"0.4rem"}}>
                  <input type="text" value={i.nama} onChange={(e)=>ubahItem("pemasukan",idx,"nama",e.target.value)} placeholder="Nama pemasukan..." style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none"}} />
                  <input type="number" value={i.rencana||""} onChange={(e)=>ubahItem("pemasukan",idx,"rencana",e.target.value)} placeholder="0" style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none", textAlign:"right"}} />
                  <input type="number" value={i.realisasi||""} onChange={(e)=>ubahItem("pemasukan",idx,"realisasi",e.target.value)} placeholder="0" style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none", textAlign:"right"}} />
                  <span style={{textAlign:"right", fontWeight:"bold", color: ((i.realisasi||0)-(i.rencana||0))>=0?"#90ee90":"#ffb6c1"}}>{((i.realisasi||0)-(i.rencana||0)).toLocaleString('id-ID')}</span>
                  <button onClick={()=>hapusItem("pemasukan",idx)} style={{background:"#dc2626", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:"0.8rem"}}>×</button>
                </div>
              ))}
              <div style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr", gap:"0.5rem", marginTop:"0.8rem", paddingTop:"0.8rem", borderTop:"1px solid rgba(255,255,255,0.15)", fontWeight:"bold"}}>
                <span>TOTAL PEMASUKAN</span>
                <span style={{textAlign:"right"}}>{totalPemasukan.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{totalPemasukan.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:totalPemasukan.selisih>=0?"#90ee90":"#ffb6c1"}}>{totalPemasukan.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{marginBottom:"2rem", background:"rgba(255,255,255,0.08)", borderRadius:"12px", padding:"1.2rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
                <h3 style={{margin:0, color:"#ffb6c1"}}>➖ PENGELUARAN</h3>
                <button onClick={()=>tambahItem("pengeluaran")} style={{padding:"0.4rem 0.8rem", background:"#dc2626", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer"}}>+ Tambah</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr 0.5fr", gap:"0.5rem", fontWeight:"bold", fontSize:"0.9rem", opacity:0.8, marginBottom:"0.5rem"}}>
                <span>Uraian</span><span style={{textAlign:"right"}}>Rencana (Rp)</span><span style={{textAlign:"right"}}>Realisasi (Rp)</span><span style={{textAlign:"right"}}>Selisih</span><span></span>
              </div>
              {itemPengeluaran.map((i, idx) => (
                <div key={idx} style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr 0.5fr", gap:"0.5rem", alignItems:"center", marginBottom:"0.4rem"}}>
                  <input type="text" value={i.nama} onChange={(e)=>ubahItem("pengeluaran",idx,"nama",e.target.value)} placeholder="Nama pengeluaran..." style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none"}} />
                  <input type="number" value={i.rencana||""} onChange={(e)=>ubahItem("pengeluaran",idx,"rencana",e.target.value)} placeholder="0" style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none", textAlign:"right"}} />
                  <input type="number" value={i.realisasi||""} onChange={(e)=>ubahItem("pengeluaran",idx,"realisasi",e.target.value)} placeholder="0" style={{padding:"0.4rem 0.5rem", borderRadius:"5px", border:"none", textAlign:"right"}} />
                  <span style={{textAlign:"right", fontWeight:"bold", color: ((i.realisasi||0)-(i.rencana||0))>=0?"#90ee90":"#ffb6c1"}}>{((i.realisasi||0)-(i.rencana||0)).toLocaleString('id-ID')}</span>
                  <button onClick={()=>hapusItem("pengeluaran",idx)} style={{background:"#dc2626", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:"0.8rem"}}>×</button>
                </div>
              ))}
              <div style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr", gap:"0.5rem", marginTop:"0.8rem", paddingTop:"0.8rem", borderTop:"1px solid rgba(255,255,255,0.15)", fontWeight:"bold"}}>
                <span>TOTAL PENGELUARAN</span>
                <span style={{textAlign:"right"}}>{totalPengeluaran.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{totalPengeluaran.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:totalPengeluaran.selisih>=0?"#90ee90":"#ffb6c1"}}>{totalPengeluaran.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{background:"rgba(255,215,0,0.15)", borderRadius:"12px", padding:"1.5rem", border:"2px solid rgba(255,215,0,0.4)"}}>
              <h3 style={{textAlign:"center", margin:"0 0 1rem 0", color:"#ffd700"}}>📊 SALDO AKHIR</h3>
              <div style={{display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr", gap:"0.5rem", fontWeight:"bold", fontSize:"1.05rem"}}>
                <span>SALDO</span>
                <span style={{textAlign:"right"}}>{saldo.rencana.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right"}}>{saldo.realisasi.toLocaleString('id-ID')}</span>
                <span style={{textAlign:"right", color:saldo.selisih>=0?"#90ee90":"#ffb6c1"}}>{saldo.selisih.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{marginTop:"2rem", textAlign:"center"}}>
              <button onClick={downloadExcel} style={{padding:"0.9rem 2rem", background:"#f97316", color:"#fff", border:"none", borderRadius:"8px", fontSize:"1.05rem", fontWeight:"bold", cursor:"pointer"}}>📥 DOWNLOAD EXCEL</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;