// Простой сервер для разработки
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Убираем параметры запроса
    let filePath = req.url.split('?')[0];
    
    // Если корень - показываем index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Полный путь к файлу
    const fullPath = path.join(__dirname, filePath);
    
    // Проверяем существование файла
    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Файл не найден - показываем 404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Страница не найдена</h1>');
            return;
        }
        
        // Определяем MIME-тип
        const ext = path.extname(fullPath);
        const mimeType = MIME_TYPES[ext] || 'text/plain';
        
        // Читаем и отправляем файл
        fs.readFile(fullPath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Ошибка сервера');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        });
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Откройте браузер и перейдите по адресу выше');
});