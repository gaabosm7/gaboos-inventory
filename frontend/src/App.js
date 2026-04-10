import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { 
  Bell, Package, FileText, Settings, Trash2, Edit3, Search, 
  CheckCircle, AlertTriangle, XCircle, Share2, Download, Database, Layers, Folder, User, Hash
} from 'lucide-react';

// تذكر تغيير هذا الرابط عند الاختبار المحلي إلى http://localhost:5000/api/products
const API_URL = "https://gaboos-api.onrender.com/api/products";
// غير هذا السطر مؤقتاً للاختبار
//const API_URL = "http://localhost:5000/api/products";

export default function App() {

const shareAsPDF = async () => {
  const element = document.querySelector('.report-preview-container'); // الجزء الذي سيتحول لـ PDF
  const opt = {
    margin: 10,
    filename: `Gaboos_Report_${new Date().toLocaleDateString()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    // 1. توليد ملف PDF كـ Blob (بيانات ثنائية)
    const pdfBlob = await html2pdf().set(opt).from(element).outputBlob();
    
    // 2. إنشاء ملف من الـ Blob للمشاركة
    const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

    // 3. التحقق من دعم المتصفح للمشاركة (يعمل في الجوال)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'تقرير المخزن',
        text: 'إليك تقرير جرد المخزن من نظام جعبوس'
      });
    } else {
      // إذا كان المتصفح لا يدعم المشاركة (مثل الكمبيوتر)، سيقوم بتحميله فقط
      html2pdf().set(opt).from(element).save();
      alert("تم تحميل التقرير، يمكنك إرساله يدوياً عبر الواتساب");
    }
  } catch (error) {
    console.error("خطأ في توليد PDF:", error);
    alert("حدث خطأ أثناء محاولة المشاركة");
  }
};

  const [tab, setTab] = useState('dash');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [mode, setMode] = useState('calc');
  const [form, setForm] = useState({ 
    name: '', prodDate: '', months: '', manualExpiry: '', note: '', quantity: '', backupPath: '', reportFilter: 'all' 
  });

  const fetchProducts = () => axios.get(API_URL).then(r => setProducts(r.data)).catch(e => console.error(e));
  useEffect(() => { fetchProducts(); }, []);

  const saveProduct = async () => {
    if (!form.name) return alert("الاسم مطلوب");
    try {
      const payload = { ...form, mode, quantity: parseInt(form.quantity) || 0 };
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        setEditId(null);
      } else {
        await axios.post(API_URL, payload);
      }
      setForm({ ...form, name: '', prodDate: '', months: '', manualExpiry: '', note: '', quantity: '' });
      fetchProducts();
      alert("تم الحفظ بنجاح ✅");
    } catch (e) { alert("خطأ ❌"); }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ 
      ...form, 
      name: p.name, 
      prodDate: p.production_date?.split('T')[0] || '', 
      manualExpiry: p.expiry_date.split('T')[0],
      note: p.note || '',
      quantity: p.quantity || 0
    });
    setMode(p.production_date ? 'calc' : 'manual');
    setTab('manage');
  };

  const getFilteredProducts = () => {
    const filter = form.reportFilter || 'all';
    if (filter === 'critical') return products.filter(p => p.days_left > 0 && p.days_left <= 60);
    if (filter === 'expired') return products.filter(p => p.days_left <= 0);
    if (filter === 'both') return products.filter(p => p.days_left <= 90);
    return products;
  };

  const getReportTitle = () => {
    const filter = form.reportFilter || 'all';
    if (filter === 'critical') return "المنتجات الحرجة (أقل من شهرين)";
    if (filter === 'expired') return "المنتجات المنتهية الصلاحية";
    if (filter === 'both') return "المنتجات المنتهية والحرجة";
    return "جرد المخزن العام";
  };

  return (
    <div className="app-container">
      {(tab === 'dash' || tab === 'manage') && (
        <header>
          <div className="search-box">
            <Search size={18} color="#888" />
            <input placeholder="بحث عن منتج  ..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </header>
      )}

      <main style={{ paddingBottom: '20px' }}>
        {tab === 'dash' && (
          <>
            <div className="stats-grid">
              <div className="stat-card red"><XCircle /> <span>{products.filter(p => p.days_left <= 0).length}</span><small>منتهي</small></div>
             <div className="stat-card yellow">
  <AlertTriangle /> 
  <span>{products.filter(p => p.days_left > 0 && p.days_left <= 90).length}</span>
  <small>قريب (3 أشهر)</small>
</div>
              <div className="stat-card green"><CheckCircle /> <span>{products.filter(p => p.days_left > 60).length}</span><small>سليم</small></div>
            </div>
            {products.filter(p => p.name.includes(search) || p.note?.includes(search)).map(p => (
              <div key={p.id} className={`card ${getStyle(p.days_left)}`}>
                <div>
                  <div style={{fontWeight:'bold'}}>{p.name}</div>
                  <div style={{fontSize:'12px', color:'#2563eb', fontWeight:'bold', marginTop:'4px'}}>الكمية: {p.quantity || 0}</div>
                  <div style={{fontSize:'11px', color:'#666', marginTop:'4px'}}><Layers size={10}/> {p.note || 'دفعة عامة'}</div>
                  <div style={{fontSize:'10px', opacity:0.7}}>ينتهي: {p.expiry_date.split('T')[0]}</div>
                </div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:'22px', fontWeight:'bold'}}>{p.days_left}</div>
                  <div style={{fontSize:'10px'}}>يوم متبقي</div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'manage' && (
          <div className="view-panel">
            <h3 style={{marginTop:0, color:'#2563eb'}}>{editId ? "تعديل الدفعة" : "إضافة دفعة جديدة"}</h3>
            <div className="toggle-box">
              <button className={mode === 'calc' ? 'active' : ''} onClick={() => setMode('calc')}>حساب آلي</button>
              <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>تاريخ مباشر</button>
            </div>
            <input className="input-style" placeholder="اسم الصنف" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            
            <div style={{display:'flex', gap:'10px'}}>
               <input type="number" className="input-style" placeholder="الكمية" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
               <input className="input-style" placeholder="رقم الدفعة / ملاحظة" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            </div>

            {mode === 'calc' ? (
              <div style={{display:'flex', gap:'10px'}}>
                <input type="date" className="input-style" value={form.prodDate} onChange={e => setForm({...form, prodDate: e.target.value})} />
                <input type="number" className="input-style" placeholder="شهور" value={form.months} onChange={e => setForm({...form, months: e.target.value})} />
              </div>
            ) : (
              <input type="date" className="input-style" value={form.manualExpiry} onChange={e => setForm({...form, manualExpiry: e.target.value})} />
            )}
            <button className="btn-primary" onClick={saveProduct}>{editId ? "تحديث الدفعة" : "حفظ في المخزن"}</button>
            
            <h4 style={{marginTop:'30px', color:'#64748b'}}>التحكم بالسجلات:</h4>
            {products.filter(p => p.name.includes(search)).map(p => (
              <div key={p.id} className="summary-item">
                <span>{p.name} <small style={{color:'#999'}}>({p.note})</small></span>
                <div style={{display:'flex', gap:'15px'}}>
                  <Edit3 size={18} color="#2563eb" style={{cursor:'pointer'}} onClick={() => startEdit(p)} />
                  <Trash2 size={18} color="#ef4444" style={{cursor:'pointer'}} onClick={() => {if(window.confirm("حذف؟")) axios.delete(`${API_URL}/${p.id}`).then(fetchProducts)}} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'report' && (
          <div className="view-panel">
            {/* قسم التقارير كما هو مع إضافة عمود الكمية في الجدول */}
            <div className="panel-title no-print">
              <FileText size={40} color="#2563eb" />
              <h3>مركز التقارير والجرد</h3>
            </div>
            <div className="filter-section no-print" style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px'}}>تخصيص بيانات التقرير:</label>
              <select className="input-style" value={form.reportFilter} onChange={(e) => setForm({...form, reportFilter: e.target.value})}>
                <option value="all">كل المخزن</option>
                <option value="critical">المنتجات الحرجة</option>
                <option value="expired">المنتهية فقط</option>
                <option value="both">المنتهية والحرجة</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-print">
              <button className="btn-primary" style={{background: '#6366f1'}} onClick={() => window.print()}><Download size={18}/> طباعة أو PDF</button>
              <button className="btn-primary" style={{background: '#25d366'}} onClick={shareAsPDF}>
  <Share2 size={18}/> مشاركة التقرير PDF عبر WhatsApp
</button>
            </div>
            <div className="report-preview-container" style={{marginTop: '25px'}}>
              <div className="print-header">
                <h1>متجر عمر اليماني للجملة</h1>
                <h2>تقرير: {getReportTitle()}</h2>
                <p>تاريخ الإصدار: {new Date().toLocaleDateString('ar-YE')}</p>
              </div>
              <table className="print-table">
                <thead>
                  <tr><th>اسم الصنف</th><th>الكمية</th><th>الملاحظة</th><th>الانتهاء</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {getFilteredProducts().map(p => (
                    <tr key={p.id} className={p.days_left <= 0 ? 'print-status-red' : p.days_left <= 60 ? 'print-status-yellow' : ''}>
                      <td>{p.name}</td>
                      <td>{p.quantity}</td>
                      <td>{p.note || 'عام'}</td>
                      <td>{p.expiry_date.split('T')[0]}</td>
                      <td>{p.days_left <= 0 ? 'منتهي' : p.days_left <= 60 ? 'تنبيه' : 'سليم'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="print-footer">تصميم وتطوير المهندس: محمد جعبوس</div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="view-panel">
            <div className="panel-title">
              <Settings size={40} color="#64748b" />
              <h3>إعدادات النظام</h3>
            </div>
            <div className="settings-list">
              <div className="setting-row">
                <Folder size={20} />
                <div style={{width:'100%'}}>
                  <strong>مسار النسخة الاحتياطية</strong>
                  <input className="input-style" style={{marginTop:'10px', fontSize:'12px'}} placeholder="D:\Backups" value={form.backupPath} onChange={e => setForm({...form, backupPath: e.target.value})} />
                </div>
              </div>
              <div className="setting-row">
                <Database size={20} />
                <div><strong>قاعدة البيانات</strong><p>PostgreSQL: متصلة (expiry_db)</p></div>
              </div>
              <div className="setting-row">
                <User size={20} color="#2563eb" />
                <div><strong>المطور المسؤول</strong><p>محمد جعبوس</p></div>
              </div>
              <button className="btn-primary btn-backup-outline" onClick={async () => {
                  if (!form.backupPath) return alert("يرجى كتابة المسار أولاً");
                  try {
                    // نستخدم localhost هنا لأن النسخ الاحتياطي يعمل فقط عند تشغيل السيرفر محلياً على جهازك
                    const res = await axios.post('http://localhost:5000/api/backup', { backupPath: form.backupPath });
                    alert(res.data.message); 
                  } catch (e) { alert("فشل النسخ الاحتياطي (تأكد من تشغيل السيرفر محلياً)"); }
                }}>بدء النسخ الاحتياطي الآن</button>
              
              <div style={{marginTop:'40px', textAlign:'center', borderTop:'1px solid #f1f5f9', paddingTop:'15px'}}>
                <p style={{fontSize:'12px', color:'#64748b', margin:0}}>جميع الحقوق محفوظة © 2026</p>
                <p style={{fontSize:'14px', fontWeight:'bold', color:'#2563eb', margin:'5px 0'}}>تصميم وتطوير: محمد جعبوس</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="nav-bar no-print">
        <button onClick={() => setTab('dash')} className={tab === 'dash' ? 'active' : ''}><Bell /> المراقبة</button>
        <button onClick={() => setTab('manage')} className={tab === 'manage' ? 'active' : ''}><Package /> الإدارة</button>
        <button onClick={() => setTab('report')} className={tab === 'report' ? 'active' : ''}><FileText /> التقارير</button>
        <button onClick={() => setTab('settings')} className={tab === 'settings' ? 'active' : ''}><Settings /> الإعدادات</button>
      </nav>
    </div>
  );
}

const getStyle = (d) => {
  if (d <= 0) return 'status-red';      // منتهي
  if (d <= 30) return 'status-orange';  // خطر جداً (شهر)
  if (d <= 90) return 'status-yellow';  // تنبيه (3 أشهر)
  return 'status-green';                // سليم

};