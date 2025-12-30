// Основной класс приложения
class BarbershopApp {
    constructor() {
        this.currentUser = null;
        this.selectedService = null;
        this.selectedMaster = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentScreen = 'loading';
        
        this.init();
    }

    // Инициализация приложения
    async init() {
        try {
            // Инициализируем Telegram WebApp
            this.initTelegramWebApp();
            
            // Инициализируем базу данных
            await db.ready();
            
            // Добавляем тестовые данные (если их еще нет)
            await this.checkAndSeedData();
            
            // Показываем главное меню
            this.showMainMenu();
            
            // Обновляем информацию о пользователе
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }

    // Инициализация Telegram WebApp
    initTelegramWebApp() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            // Расширяем приложение на весь экран
            Telegram.WebApp.expand();
            
            // Получаем данные пользователя
            this.currentUser = Telegram.WebApp.initDataUnsafe.user || {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Гость',
                username: 'guest'
            };
            
            // Устанавливаем цветовую схему
            Telegram.WebApp.setHeaderColor('#667eea');
            Telegram.WebApp.setBackgroundColor('#667eea');
            
            console.log('Telegram WebApp инициализирован:', this.currentUser);
        } else {
            // Режим разработки (без Telegram)
            this.currentUser = {
                id: 1,
                first_name: 'Тестовый',
                last_name: 'Пользователь',
                username: 'test_user'
            };
            console.log('Режим разработки (без Telegram)');
        }
    }

    // Проверка и добавление тестовых данных
    async checkAndSeedData() {
        try {
            const services = await db.getServices();
            if (services.length === 0) {
                await db.seedData();
                console.log('Тестовые данные добавлены');
            }
        } catch (error) {
            console.error('Ошибка при добавлении тестовых данных:', error);
        }
    }

    // Обновление информации о пользователе
    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement && this.currentUser) {
            userInfoElement.innerHTML = `
                <span>👤 ${this.currentUser.first_name} ${this.currentUser.last_name || ''}</span>
                ${this.currentUser.username ? `<span>@${this.currentUser.username}</span>` : ''}
            `;
        }
    }

    // Переключение экранов
    showScreen(screenId) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показываем нужный экран
        const screenElement = document.getElementById(screenId);
        if (screenElement) {
            screenElement.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    // Главное меню
    showMainMenu() {
        this.showScreen('mainMenu');
    }

    // Показать услуги
    async showServices() {
        try {
            const services = await db.getServices();
            this.renderServices(services);
            this.showScreen('servicesScreen');
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
            this.showError('Не удалось загрузить услуги');
        }
    }

    // Рендер списка услуг
    renderServices(services) {
        const servicesList = document.getElementById('servicesList');
        if (!servicesList) return;
        
        servicesList.innerHTML = '';
        
        services.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'list-item';
            serviceElement.innerHTML = `
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">${service.price} ₽</span>
                    <button class="select-btn" data-id="${service.id}">
                        Выбрать
                    </button>
                </div>
            `;
            
            servicesList.appendChild(serviceElement);
        });
        
        // Добавляем обработчики событий
        document.querySelectorAll('.select-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const serviceId = parseInt(e.target.dataset.id);
                this.selectService(serviceId, services);
            });
        });
    }

    // Выбор услуги
    selectService(serviceId, services) {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            this.selectedService = service;
            this.showMasters();
        }
    }

    // Показать мастеров
    async showMasters() {
        try {
            const masters = await db.getMasters();
            this.renderMasters(masters);
            this.showScreen('mastersScreen');
        } catch (error) {
            console.error('Ошибка загрузки мастеров:', error);
            this.showError('Не удалось загрузить мастеров');
        }
    }

    // Рендер списка мастеров
    renderMasters(masters) {
        const mastersList = document.getElementById('mastersList');
        if (!mastersList) return;
        
        mastersList.innerHTML = '';
        
        masters.forEach(master => {
            const masterElement = document.createElement('div');
            masterElement.className = 'list-item';
            masterElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 2rem;">${master.image}</span>
                    <div>
                        <h3>${master.name}</h3>
                        <p>${master.specialty} • ${master.experience}</p>
                        <p>⭐ Рейтинг: ${master.rating}</p>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <button class="select-btn" data-id="${master.id}">
                        Выбрать
                    </button>
                </div>
            `;
            
            mastersList.appendChild(masterElement);
        });
        
        // Добавляем обработчики событий
        document.querySelectorAll('.select-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const masterId = parseInt(e.target.dataset.id);
                this.selectMaster(masterId, masters);
            });
        });
    }

    // Выбор мастера
    selectMaster(masterId, masters) {
        const master = masters.find(m => m.id === masterId);
        if (master) {
            this.selectedMaster = master;
            this.showTimeSelection();
        }
    }

    // Показать выбор времени
    async showTimeSelection() {
        if (!this.selectedService || !this.selectedMaster) {
            this.showError('Не выбрана услуга или мастер');
            return;
        }
        
        this.selectedDate = new Date();
        await this.renderTimeSlots();
        this.showScreen('timeScreen');
        this.setupDateNavigation();
    }

    // Настройка навигации по датам
    setupDateNavigation() {
        const prevDayBtn = document.getElementById('prevDay');
        const nextDayBtn = document.getElementById('nextDay');
        const currentDateElem = document.getElementById('currentDate');
        
        if (!prevDayBtn || !nextDayBtn || !currentDateElem) return;
        
        const updateDateDisplay = () => {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            currentDateElem.textContent = this.selectedDate.toLocaleDateString('ru-RU', options);
        };
        
        prevDayBtn.onclick = () => {
            this.selectedDate.setDate(this.selectedDate.getDate() - 1);
            updateDateDisplay();
            this.renderTimeSlots();
        };
        
        nextDayBtn.onclick = () => {
            this.selectedDate.setDate(this.selectedDate.getDate() + 1);
            updateDateDisplay();
            this.renderTimeSlots();
        };
        
        updateDateDisplay();
    }

    // Рендер временных слотов
    async renderTimeSlots() {
        if (!this.selectedService || !this.selectedMaster || !this.selectedDate) return;
        
        const timeSlotsElement = document.getElementById('timeSlots');
        if (!timeSlotsElement) return;
        
        timeSlotsElement.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';
        
        try {
            const dateStr = this.selectedDate.toISOString().split('T')[0];
            const slots = await db.getAvailableTimeSlots(
                dateStr,
                this.selectedMaster.id,
                this.selectedService.id
            );
            
            timeSlotsElement.innerHTML = '';
            
            slots.forEach(slot => {
                const slotElement = document.createElement('button');
                slotElement.className = `time-slot ${slot.isAvailable ? '' : 'unavailable'}`;
                slotElement.textContent = slot.time;
                slotElement.disabled = !slot.isAvailable;
                
                if (slot.isAvailable) {
                    slotElement.onclick = () => {
                        document.querySelectorAll('.time-slot').forEach(s => {
                            s.classList.remove('selected');
                        });
                        slotElement.classList.add('selected');
                        this.selectedTime = slot.time;
                        setTimeout(() => this.showConfirmation(), 300);
                    };
                }
                
                timeSlotsElement.appendChild(slotElement);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки времени:', error);
            timeSlotsElement.innerHTML = '<p style="color: #666; text-align: center;">Не удалось загрузить доступное время</p>';
        }
    }

    // Показать подтверждение записи
    showConfirmation() {
        if (!this.selectedService || !this.selectedMaster || !this.selectedDate || !this.selectedTime) {
            this.showError('Не все данные выбраны');
            return;
        }
        
        const detailsElement = document.getElementById('appointmentDetails');
        if (!detailsElement) return;
        
        const dateStr = this.selectedDate.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        detailsElement.innerHTML = `
            <div class="detail-item">
                <span class="label">Услуга:</span>
                <span class="value">${this.selectedService.name}</span>
            </div>
            <div class="detail-item">
                <span class="label">Мастер:</span>
                <span class="value">${this.selectedMaster.name}</span>
            </div>
            <div class="detail-item">
                <span class="label">Дата:</span>
                <span class="value">${dateStr}</span>
            </div>
            <div class="detail-item">
                <span class="label">Время:</span>
                <span class="value">${this.selectedTime}</span>
            </div>
            <div class="detail-item">
                <span class="label">Длительность:</span>
                <span class="value">${this.selectedService.duration} мин</span>
            </div>
            <div class="detail-item">
                <span class="label">Стоимость:</span>
                <span class="value" style="color: #667eea; font-weight: bold;">${this.selectedService.price} ₽</span>
            </div>
        `;
        
        this.showScreen('confirmScreen');
    }

    // Подтверждение записи
    async confirmAppointment() {
        if (!this.currentUser || !this.selectedService || !this.selectedMaster || !this.selectedDate || !this.selectedTime) {
            this.showError('Не все данные заполнены');
            return;
        }
        
        try {
            const appointment = {
                userId: this.currentUser.id,
                serviceId: this.selectedService.id,
                serviceName: this.selectedService.name,
                masterId: this.selectedMaster.id,
                masterName: this.selectedMaster.name,
                date: this.selectedDate.toISOString().split('T')[0],
                time: this.selectedTime,
                price: this.selectedService.price,
                status: 'confirmed'
            };
            
            await db.addAppointment(appointment);
            
            this.showSuccess('Запись успешно создана!');
            
            // Очищаем выбранные значения
            this.selectedService = null;
            this.selectedMaster = null;
            this.selectedDate = null;
            this.selectedTime = null;
            
            // Возвращаемся в главное меню через 2 секунды
            setTimeout(() => this.showMainMenu(), 2000);
            
        } catch (error) {
            console.error('Ошибка создания записи:', error);
            this.showError('Не удалось создать запись');
        }
    }

    // Показать мои записи
    async showMyAppointments() {
        if (!this.currentUser) {
            this.showError('Пользователь не определен');
            return;
        }
        
        try {
            const appointments = await db.getUserAppointments(this.currentUser.id);
            this.renderAppointments(appointments);
            this.showScreen('appointmentsScreen');
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
            this.showError('Не удалось загрузить записи');
        }
    }

    // Рендер списка записей
    renderAppointments(appointments) {
        const appointmentsList = document.getElementById('appointmentsList');
        if (!appointmentsList) return;
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="list-item" style="text-align: center; color: #666;">
                    <p>У вас пока нет записей</p>
                </div>
            `;
            return;
        }
        
        appointmentsList.innerHTML = '';
        
        appointments.forEach(appointment => {
            const date = new Date(appointment.date);
            const dateStr = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long'
            });
            
            const appointmentElement = document.createElement('div');
            appointmentElement.className = 'list-item';
            appointmentElement.innerHTML = `
                <h3>${appointment.serviceName}</h3>
                <p>Мастер: ${appointment.masterName}</p>
                <p>📅 ${dateStr} в ${appointment.time}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="color: #667eea; font-weight: bold;">${appointment.price} ₽</span>
                    <span style="padding: 4px 12px; background: #e8f5e9; color: #2e7d32; border-radius: 12px; font-size: 0.8rem;">
                        ${appointment.status}
                    </span>
                </div>
                ${this.canCancelAppointment(appointment) ? `
                    <div style="margin-top: 10px;">
                        <button class="cancel-btn" data-id="${appointment.id}" style="background: #ffebee; color: #c62828; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                            Отменить
                        </button>
                    </div>
                ` : ''}
            `;
            
            appointmentsList.appendChild(appointmentElement);
        });
        
        // Добавляем обработчики для кнопок отмены
        document.querySelectorAll('.cancel-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const appointmentId = parseInt(e.target.dataset.id);
                if (confirm('Вы уверены, что хотите отменить запись?')) {
                    try {
                        await db.cancelAppointment(appointmentId);
                        this.showSuccess('Запись отменена');
                        setTimeout(() => this.showMyAppointments(), 1000);
                    } catch (error) {
                        console.error('Ошибка отмены записи:', error);
                        this.showError('Не удалось отменить запись');
                    }
                }
            });
        });
    }

    // Проверка возможности отмены записи
    canCancelAppointment(appointment) {
        const appointmentDate = new Date(appointment.date);
        const now = new Date();
        const hoursDiff = (appointmentDate - now) / (1000 * 60 * 60);
        return hoursDiff > 2; // Можно отменить за 2 часа до записи
    }

    // Показать профиль
    async showProfile() {
        if (!this.currentUser) {
            this.showError('Пользователь не определен');
            return;
        }
        
        try {
            let profile = await db.getProfile(this.currentUser.id);
            
            if (!profile) {
                profile = {
                    name: this.currentUser.first_name + ' ' + (this.currentUser.last_name || ''),
                    phone: '',
                    email: ''
                };
            }
            
            this.renderProfile(profile);
            this.showScreen('profileScreen');
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            this.showError('Не удалось загрузить профиль');
        }
    }

    // Рендер профиля
    renderProfile(profile) {
        const profileElement = document.getElementById('profileInfo');
        if (!profileElement) return;
        
        profileElement.innerHTML = `
            <div class="profile-field">
                <label>Имя:</label>
                <input type="text" id="profileName" value="${profile.name || ''}" placeholder="Введите ваше имя">
            </div>
            <div class="profile-field">
                <label>Телефон:</label>
                <input type="tel" id="profilePhone" value="${profile.phone || ''}" placeholder="+7 (999) 999-99-99">
            </div>
            <div class="profile-field">
                <label>Email:</label>
                <input type="email" id="profileEmail" value="${profile.email || ''}" placeholder="email@example.com">
            </div>
            <button class="confirm-btn" onclick="app.saveProfile()" style="margin-top: 20px;">
                Сохранить профиль
            </button>
        `;
    }

    // Сохранение профиля
    async saveProfile() {
        if (!this.currentUser) return;
        
        const name = document.getElementById('profileName').value;
        const phone = document.getElementById('profilePhone').value;
        const email = document.getElementById('profileEmail').value;
        
        if (!name.trim()) {
            this.showError('Введите имя');
            return;
        }
        
        try {
            await db.saveProfile(this.currentUser.id, { name, phone, email });
            this.showSuccess('Профиль сохранен');
            setTimeout(() => this.showMainMenu(), 1500);
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            this.showError('Не удалось сохранить профиль');
        }
    }

    // Открытие поддержки
    openSupport() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.openTelegramLink('https://t.me/your_support_bot');
        } else {
            alert('Для связи с поддержкой напишите нам в Telegram: @your_support_bot');
        }
    }

    // Показать уведомление об успехе
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Показать уведомление об ошибке
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        document.querySelectorAll('.notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Создаем глобальный экземпляр приложения
let app;

// Инициализация приложения после загрузки страницы
window.onload = () => {
    app = new BarbershopApp();
    
    // Делаем методы доступными глобально для обработчиков onclick в HTML
    window.showServices = () => app.showServices();
    window.showMyAppointments = () => app.showMyAppointments();
    window.showMasters = () => app.showMasters();
    window.showProfile = () => app.showProfile();
    window.showMainMenu = () => app.showMainMenu();
    window.showTimeSelection = () => app.showTimeSelection();
    window.showConfirmation = () => app.showConfirmation();
    window.confirmAppointment = () => app.confirmAppointment();
    window.openSupport = () => app.openSupport();
    window.saveProfile = () => app.saveProfile();
};