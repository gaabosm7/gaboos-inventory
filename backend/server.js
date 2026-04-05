require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const ExcelJS = require('exceljs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- الربط بـ Supabase ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// اختبار الاتصال السحابي
pool.connect((err, client, release) => {
    if (err) return console.error('❌ فشل الاتصال بالسحاب:', err.stack);
    console.log('✅ متصل الآن بقاعدة بيانات Supabase (سيدني - أستراليا)');
    release();
});

// 1. جلب المنتجات
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query(`SELECT *, (expiry_date - CURRENT_DATE) as days_left FROM products ORDER BY expiry_date ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json(err.message); }
});

// 2. تصدير Excel
app.get('/api/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT name, expiry_date, (expiry_date - CURRENT_DATE) as days_left FROM products');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('جرد المخزن');
        worksheet.columns = [
            { header: 'اسم المنتج', key: 'name', width: 25 },
            { header: 'تاريخ الانتهاء', key: 'expiry_date', width: 20 },
            { header: 'الأيام المتبقية', key: 'days_left', width: 15 },
        ];
        result.rows.forEach(row => {
            worksheet.addRow({
                name: row.name,
                expiry_date: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : 'N/A',
                days_left: row.days_left
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) { res.status(500).send("خطأ في ملف الإكسل"); }
});

// 3. إضافة وتحديث وحذف
app.post('/api/products', async (req, res) => {
    const { name, prodDate, months, manualExpiry, mode, note } = req.body;
    let expiry = mode === 'calc' ? calculate(prodDate, months) : manualExpiry;
    await pool.query('INSERT INTO products (name, production_date, expiry_date, note) VALUES ($1, $2, $3, $4)', 
    [name, prodDate || null, expiry, note || 'دفعة عامة']);
    res.json({ success: true });
});

app.put('/api/products/:id', async (req, res) => {
    const { name, prodDate, months, manualExpiry, mode, note } = req.body;
    let expiry = mode === 'calc' ? calculate(prodDate, months) : manualExpiry;
    await pool.query('UPDATE products SET name=$1, production_date=$2, expiry_date=$3, note=$4 WHERE id=$5', 
    [name, prodDate || null, expiry, note, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// 4. النسخ الاحتياطي المحلي (ملاحظة: هذا يسحب من القاعدة المحلية كنسخة إضافية)
app.post('/api/backup', async (req, res) => {
    const { backupPath } = req.body;
    const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"`;
    const fileName = `expiry_db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const fullPath = path.join(backupPath, fileName);
    const cmd = `set PGPASSWORD=77177717m#&& ${pgDumpPath} -U postgres -h localhost expiry22_db > "${fullPath}"`;
    exec(cmd, (error) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, message: `تم النسخ المحلي بنجاح في: ${fullPath}` });
    });
});

function calculate(date, months) {
    let d = new Date(date);
    d.setMonth(d.getMonth() + parseInt(months));
    return d.toISOString().split('T')[0];
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 نظام جعبوس السحابي يعمل على المنفذ ${PORT}`));