from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from io import BytesIO
import openpyxl

app = Flask(__name__)

# ⚠️ Kunci rahasia
app.secret_key = 'bcdu2026_rahasia_kunci_123'

# ✅ Izinkan akses dari frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# === DATA PENYIMPANAN SEMENTARA ===
rab_data = []
pendaftar_data = []
cashflow_data = {}

# === HALAMAN UTAMA ===
@app.route('/')
def index():
    return {"pesan": "Server BCEDU 2026 Berjalan!", "status": "aktif"}

# === CEK LOGIN ===
@app.route('/api/cek-login', methods=['GET'])
def cek_login():
    return {"sudah_login": session.get('sudah_login', False)}

# === LOGIN ===
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
    if username == 'admin' and password == 'bcdu2026':
        session['sudah_login'] = True
        return {"sukses": True, "pesan": "Login berhasil!"}
    return {"sukses": False, "pesan": "Username atau password salah!"}, 401

# === LOGOUT ===
@app.route('/api/logout', methods=['GET'])
def logout():
    session.clear()
    return {"sukses": True}

# === SIMPAN RAB ===
@app.route('/api/simpan-rab', methods=['POST'])
def simpan_rab():
    if not session.get('sudah_login'):
        return {"pesan": "Harap login dulu!"}, 401
    global rab_data
    data = request.json
    rab_data = data.get('daftar', [])
    return {"sukses": True, "jumlah": len(rab_data)}

# === AMBIL RAB ===
@app.route('/api/ambil-rab', methods=['GET'])
def ambil_rab():
    return {"daftar": rab_data}

# === SIMPAN CASHFLOW ===
@app.route('/api/simpan-cashflow', methods=['POST'])
def simpan_cashflow():
    if not session.get('sudah_login'):
        return {"pesan": "Harap login dulu!"}, 401
    global cashflow_data
    data = request.json
    cashflow_data = data.get('daftar', {})
    return {"sukses": True}

# === AMBIL CASHFLOW ===
@app.route('/api/ambil-cashflow', methods=['GET'])
def ambil_cashflow():
    return {"daftar": cashflow_data}

# === FUNGSI BANTUAN UBAH NAMA ===
def ubah_nama(kata):
    hasil = ""
    for huruf in kata:
        if huruf.isupper() and hasil != "":
            hasil += " " + huruf
        else:
            hasil += huruf
    return hasil.title()

# === EXPORT CASHFLOW KE EXCEL ===
@app.route('/api/export-cashflow', methods=['GET'])
def export_cashflow():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Cashflow Anggaran"
    
    ws.append(["BCEDUFAIR 2026 — CASHFLOW ANGGARAN"])
    ws.merge_cells('A1:D1')
    ws.append(["URAIAN", "RENCANA (Rp)", "REALISASI (Rp)", "SELISIH (Rp)"])
    
    def tulis_baris(uraian, rencana, realisasi):
        selisih = realisasi - rencana
        ws.append([uraian, rencana, realisasi, selisih])
    
    p = cashflow_data.get('pemasukan', {})
    tulis_baris("1. RENCANA PEMASUKAN", 0, 0)
    for k, v in p.items():
        nama = ubah_nama(k)
        tulis_baris("   - " + nama, v.get('rencana', 0), v.get('realisasi', 0))
    
    pengeluaran = [
        ("2. PENGELOUARAN UNIVERSITAS", cashflow_data.get('pengeluaranUniv', {})),
        ("3. PENGELOUARAN LOMBA MOBILE LEGEND", cashflow_data.get('pengeluaranLombaML', {})),
        ("4. PENGELOUARAN KESEKRETARIATAN", cashflow_data.get('pengeluaranSekre', {})),
        ("5. PENGELOUARAN KULIAH TAMU", cashflow_data.get('pengeluaranKuliahTamu', {})),
        ("6. PENGELOUARAN DANA BAZAR", cashflow_data.get('pengeluaranBazar', {})),
        ("7. PENGELOUARAN MINI GAMES", cashflow_data.get('pengeluaranMiniGames', {})),
    ]
    
    total_p_r = sum(v.get('rencana', 0) for v in p.values())
    total_p_rl = sum(v.get('realisasi', 0) for v in p.values())
    
    total_peng_r = 0
    total_peng_rl = 0
    
    for judul, obj in pengeluaran:
        tulis_baris(judul, 0, 0)
        for k, v in obj.items():
            nama = ubah_nama(k)
            r = v.get('rencana', 0)
            rl = v.get('realisasi', 0)
            tulis_baris("   - " + nama, r, rl)
            total_peng_r += r
            total_peng_rl += rl
    
    tulis_baris("TOTAL PEMASUKAN", total_p_r, total_p_rl)
    tulis_baris("TOTAL PENGELOUARAN", total_peng_r, total_peng_rl)
    tulis_baris("SALDO AKHIR", total_p_r - total_peng_r, total_p_rl - total_peng_rl)
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    res = make_response(output.getvalue())
    res.headers["Content-Disposition"] = "attachment; filename=Cashflow_Anggaran_BCEDUFAIR2026.xlsx"
    res.headers["Content-type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return res

# === TAMBAH PENDAFTARAN ===
@app.route('/api/daftar', methods=['POST'])
def daftar():
    baru = {
        "id": len(pendaftar_data) + 1,
        "jenis_acara": request.form.get('jenis'),
        "nama": request.form.get('nama'),
        "kontak": request.form.get('kontak'),
        "institusi": request.form.get('institusi', ''),
        "keterangan": request.form.get('keterangan', ''),
        "status": "Terdaftar" if request.form.get('jenis') == 'seminar' else "Menunggu"
    }
    pendaftar_data.append(baru)
    return {"sukses": True, "data": baru}

# === AMBIL SEMUA PENDAFTAR ===
@app.route('/api/pendaftar', methods=['GET'])
def lihat_pendaftar():
    if not session.get('sudah_login'):
        return {"pesan": "Harap login dulu!"}, 401
    return {"daftar": pendaftar_data}

# === UBAH STATUS PENDAFTAR ===
@app.route('/api/ubah-status', methods=['POST'])
def ubah_status():
    if not session.get('sudah_login'):
        return {"pesan": "Harap login dulu!"}, 401
    data = request.json
    id_target = data.get('id')
    status_baru = data.get('status')
    
    for p in pendaftar_data:
        if p['id'] == id_target:
            p['status'] = status_baru
            return {"sukses": True}
    return {"sukses": False, "pesan": "Tidak ditemukan"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)