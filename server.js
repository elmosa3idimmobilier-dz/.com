const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// تخزين البيانات في ملفات JSON (بديل مؤقت لقاعدة البيانات)
const DATA_DIR = './data';
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');

// تأكد من وجود المجلد والملفات
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]');
}

if (!fs.existsSync(PROPERTIES_FILE)) {
    fs.writeFileSync(PROPERTIES_FILE, '[]');
}

// إعداد multer لرفع الصور
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
// حفظ الرسائل
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;
    
    const newMessage = {
        id: Date.now(),
        name,
        email,
        phone,
        message,
        date: new Date().toLocaleString('ar-SA'),
        read: false
    };

    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    messages.push(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
});

// الحصول على الرسائل
app.get('/api/messages', (req, res) => {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    res.json(messages);
});

// إضافة عقار جديد مع صورة
app.post('/api/properties', upload.single('image'), (req, res) => {
    const { title, description, price, type, area, location, rooms, floor } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : '';

    const newProperty = {
        id: Date.now(),
        title,
        description,
        price: parseInt(price),
        type,
        area,
        location,
        rooms: rooms ? parseInt(rooms) : null,
        floor: floor ? parseInt(floor) : null,
        image,
        date: new Date().toLocaleString('ar-SA'),
        featured: false
    };

    const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE));
    properties.push(newProperty);
    fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(properties, null, 2));

    res.json({ success: true, property: newProperty });
});

// الحصول على العقارات
app.get('/api/properties', (req, res) => {
    const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE));
    res.json(properties);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
