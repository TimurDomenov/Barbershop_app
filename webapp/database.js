// Класс для работы с базой данных
class BarbershopDB {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Используем IndexedDB для хранения данных в браузере
                const request = indexedDB.open('BarbershopDB', 1);
                
                request.onerror = (event) => {
                    console.error('Ошибка открытия БД:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('База данных успешно открыта');
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Создаем хранилище для услуг
                    if (!db.objectStoreNames.contains('services')) {
                        const servicesStore = db.createObjectStore('services', { keyPath: 'id', autoIncrement: true });
                        servicesStore.createIndex('name', 'name', { unique: false });
                        servicesStore.createIndex('price', 'price', { unique: false });
                    }
                    
                    // Создаем хранилище для мастеров
                    if (!db.objectStoreNames.contains('masters')) {
                        const mastersStore = db.createObjectStore('masters', { keyPath: 'id', autoIncrement: true });
                        mastersStore.createIndex('name', 'name', { unique: false });
                        mastersStore.createIndex('rating', 'rating', { unique: false });
                    }
                    
                    // Создаем хранилище для записей
                    if (!db.objectStoreNames.contains('appointments')) {
                        const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
                        appointmentsStore.createIndex('userId', 'userId', { unique: false });
                        appointmentsStore.createIndex('date', 'date', { unique: false });
                        appointmentsStore.createIndex('masterId', 'masterId', { unique: false });
                    }
                    
                    // Создаем хранилище для профилей пользователей
                    if (!db.objectStoreNames.contains('profiles')) {
                        const profilesStore = db.createObjectStore('profiles', { keyPath: 'userId' });
                        profilesStore.createIndex('phone', 'phone', { unique: false });
                        profilesStore.createIndex('name', 'name', { unique: false });
                    }
                    
                    console.log('Структура БД создана');
                };
            } catch (error) {
                console.error('Ошибка инициализации БД:', error);
                reject(error);
            }
        });
    }

    // Обещаем, что БД инициализирована
    async ready() {
        return this.initPromise;
    }

    // Добавление тестовых данных
    async seedData() {
        await this.ready();
        
        const transaction = this.db.transaction(['services', 'masters'], 'readwrite');
        
        // Добавляем услуги
        const services = [
            { name: 'Мужская стрижка', description: 'Классическая мужская стрижка', price: 1000, duration: 60 },
            { name: 'Детская стрижка', description: 'Стрижка для детей', price: 800, duration: 45 },
            { name: 'Стрижка машинкой', description: 'Стрижка одной насадкой', price: 600, duration: 30 },
            { name: 'Стрижка + Борода', description: 'Комплексная услуга', price: 1500, duration: 90 },
            { name: 'Королевское бритьё', description: 'Бритьё опасной бритвой', price: 1200, duration: 60 },
            { name: 'Укладка', description: 'Укладка волос', price: 500, duration: 20 }
        ];
        
        const servicesStore = transaction.objectStore('services');
        services.forEach(service => {
            servicesStore.add(service);
        });
        
        // Добавляем мастеров
        const masters = [
            { name: 'Алексей Петров', specialty: 'Барбер', experience: '5 лет', rating: 4.9, image: '👨‍🎨' },
            { name: 'Иван Сидоров', specialty: 'Стилист', experience: '7 лет', rating: 4.8, image: '✂️' },
            { name: 'Михаил Иванов', specialty: 'Барбер', experience: '3 года', rating: 4.7, image: '🧔' },
            { name: 'Дмитрий Смирнов', specialty: 'Мастер универсал', experience: '8 лет', rating: 5.0, image: '🌟' }
        ];
        
        const mastersStore = transaction.objectStore('masters');
        masters.forEach(master => {
            mastersStore.add(master);
        });
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('Тестовые данные добавлены');
                resolve();
            };
            
            transaction.onerror = (event) => {
                console.error('Ошибка добавления данных:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Получение всех услуг
    async getServices() {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['services'], 'readonly');
            const store = transaction.objectStore('services');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Получение всех мастеров
    async getMasters() {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['masters'], 'readonly');
            const store = transaction.objectStore('masters');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Получение записей пользователя
    async getUserAppointments(userId) {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['appointments'], 'readonly');
            const store = transaction.objectStore('appointments');
            const index = store.index('userId');
            const request = index.getAll(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Добавление новой записи
    async addAppointment(appointment) {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['appointments'], 'readwrite');
            const store = transaction.objectStore('appointments');
            
            // Добавляем дату создания
            appointment.createdAt = new Date().toISOString();
            
            const request = store.add(appointment);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Отмена записи
    async cancelAppointment(appointmentId) {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['appointments'], 'readwrite');
            const store = transaction.objectStore('appointments');
            
            const request = store.delete(appointmentId);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Сохранение профиля пользователя
    async saveProfile(userId, profileData) {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readwrite');
            const store = transaction.objectStore('profiles');
            
            // Добавляем/обновляем профиль
            const profile = { userId, ...profileData };
            const request = store.put(profile);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Получение профиля пользователя
    async getProfile(userId) {
        await this.ready();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readonly');
            const store = transaction.objectStore('profiles');
            const request = store.get(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Получение свободных временных слотов
    async getAvailableTimeSlots(date, masterId, serviceId) {
        await this.ready();
        
        // Здесь должна быть логика проверки занятых слотов
        // Для примера генерируем временные слоты
        
        const slots = [];
        const startHour = 9; // Начинаем в 9:00
        const endHour = 21;  // Заканчиваем в 21:00
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) { // Слоты каждые 30 минут
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isAvailable = Math.random() > 0.3; // 70% слотов свободны
                
                slots.push({
                    time,
                    isAvailable,
                    isSelected: false
                });
            }
        }
        
        return slots;
    }
}

// Создаем глобальный экземпляр БД
const db = new BarbershopDB();