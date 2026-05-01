// ============ БАЗА ДАННЫХ ============
let db;
const DB_NAME = 'CatHotelDB';
const DB_VERSION = 11;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'email' });
            }
            if (!db.objectStoreNames.contains('bookings')) {
                const bookingStore = db.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
                bookingStore.createIndex('userEmail', 'userEmail');
            }
            if (!db.objectStoreNames.contains('reviews')) {
                const reviewStore = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
                reviewStore.createIndex('userEmail', 'userEmail');
            }
            if (!db.objectStoreNames.contains('gallery')) {
                db.createObjectStore('gallery', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('currentSession')) {
                db.createObjectStore('currentSession', { keyPath: 'id' });
            }
        };
    });
}

// ============ ПРЕДУСТАНОВЛЕННЫЕ ПОЛЬЗОВАТЕЛИ ============
async function initDefaultUsers() {
    await openDB();
    const tx = db.transaction('users', 'readonly');
    const adminExists = await new Promise(resolve => {
        const req = tx.objectStore('users').get('admin@murr.ru');
        req.onsuccess = () => resolve(req.result);
    });
    if (!adminExists) {
        const writeTx = db.transaction('users', 'readwrite');
        writeTx.objectStore('users').add({
            email: 'admin@murr.ru',
            password: 'admin123',
            name: 'Администратор',
            phone: '+7 (999) 000-00-01',
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        writeTx.objectStore('users').add({
            email: 'manager@murr.ru',
            password: 'manager123',
            name: 'Менеджер',
            phone: '+7 (999) 000-00-02',
            role: 'manager',
            createdAt: new Date().toISOString()
        });
        await new Promise(resolve => writeTx.oncomplete = resolve);
    }
}

// ============ АВТОРИЗАЦИЯ ============
async function registerUser(email, password, name, phone) {
    await openDB();
    const normalizedEmail = email.trim().toLowerCase();
    const tx = db.transaction('users', 'readonly');
    const existing = await new Promise(resolve => {
        const req = tx.objectStore('users').get(normalizedEmail);
        req.onsuccess = () => resolve(req.result);
    });
    if (existing) throw new Error('Пользователь уже существует');
    const writeTx = db.transaction('users', 'readwrite');
    writeTx.objectStore('users').add({
        email: normalizedEmail,
        password: password,
        name: name.trim(),
        phone: phone.trim(),
        role: 'user',
        createdAt: new Date().toISOString()
    });
    await new Promise(resolve => writeTx.oncomplete = resolve);
    return true;
}

async function loginUser(email, password) {
    await openDB();
    const normalizedEmail = email.trim().toLowerCase();
    const tx = db.transaction('users', 'readonly');
    const user = await new Promise(resolve => {
        const req = tx.objectStore('users').get(normalizedEmail);
        req.onsuccess = () => resolve(req.result);
    });
    if (!user) throw new Error('Пользователь не найден');
    if (user.password !== password) throw new Error('Неверный пароль');
    const sessionTx = db.transaction('currentSession', 'readwrite');
    sessionTx.objectStore('currentSession').put({
        id: 'current',
        user: {
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role
        }
    });
    return user;
}

async function getCurrentUser() {
    await openDB();
    const tx = db.transaction('currentSession', 'readonly');
    const session = await new Promise(resolve => {
        const req = tx.objectStore('currentSession').get('current');
        req.onsuccess = () => resolve(req.result);
    });
    return session?.user || null;
}

async function logoutUser() {
    await openDB();
    const tx = db.transaction('currentSession', 'readwrite');
    tx.objectStore('currentSession').delete('current');
}

async function updateProfile(name, phone) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    await openDB();
    const tx = db.transaction('users', 'readwrite');
    const fullUser = await new Promise(resolve => {
        const req = tx.objectStore('users').get(user.email);
        req.onsuccess = () => resolve(req.result);
    });
    fullUser.name = name.trim();
    fullUser.phone = phone.trim();
    tx.objectStore('users').put(fullUser);
    const sessionTx = db.transaction('currentSession', 'readwrite');
    sessionTx.objectStore('currentSession').put({
        id: 'current',
        user: { email: fullUser.email, name: fullUser.name, phone: fullUser.phone, role: fullUser.role }
    });
}

// ============ БРОНИРОВАНИЯ ============
async function saveBooking(booking) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Войдите в аккаунт');
    await openDB();
    const newBooking = {
        ...booking,
        userEmail: user.email,
        userName: user.name,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    const tx = db.transaction('bookings', 'readwrite');
    return new Promise((resolve, reject) => {
        const req = tx.objectStore('bookings').add(newBooking);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getMyBookings() {
    const user = await getCurrentUser();
    if (!user) return [];
    await openDB();
    const tx = db.transaction('bookings', 'readonly');
    const all = await new Promise(resolve => {
        const req = tx.objectStore('bookings').getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
    return all.filter(b => b.userEmail === user.email);
}

async function getAllBookings() {
    await openDB();
    const tx = db.transaction('bookings', 'readonly');
    return new Promise(resolve => {
        const req = tx.objectStore('bookings').getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
}

async function deleteBooking(bookingId) {
    await openDB();
    const tx = db.transaction('bookings', 'readwrite');
    return new Promise(resolve => {
        const req = tx.objectStore('bookings').delete(bookingId);
        req.onsuccess = () => resolve(true);
    });
}

// ============ ОТЗЫВЫ (ИСПРАВЛЕНО) ============
async function addReview(rating, comment) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Войдите в аккаунт');
    await openDB();
    const newReview = {
        userEmail: user.email,
        userName: user.name,
        rating: parseInt(rating),
        comment: comment.trim(),
        date: new Date().toISOString()
    };
    const tx = db.transaction('reviews', 'readwrite');
    return new Promise((resolve, reject) => {
        const req = tx.objectStore('reviews').add(newReview);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllReviews() {
    await openDB();
    const tx = db.transaction('reviews', 'readonly');
    return new Promise((resolve) => {
        const req = tx.objectStore('reviews').getAll();
        req.onsuccess = () => {
            const reviews = req.result || [];
            reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(reviews);
        };
        req.onerror = () => resolve([]);
    });
}

async function deleteReview(reviewId) {
    await openDB();
    const tx = db.transaction('reviews', 'readwrite');
    return new Promise((resolve, reject) => {
        const req = tx.objectStore('reviews').delete(reviewId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

// ============ ГАЛЕРЕЯ (ЧЕРЕЗ LOCALSTORAGE ДЛЯ НАДЁЖНОСТИ) ============
const GALLERY_STORAGE_KEY = 'cat_hotel_gallery';
const DEFAULT_GALLERY_PHOTOS = [
    { id: 'default1', url: "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=300&h=250&fit=crop", name: "Пушистик", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default2', url: "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=300&h=250&fit=crop", name: "Рыжик", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default3', url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=250&fit=crop", name: "Снежок", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default4', url: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&h=250&fit=crop", name: "Мурка", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default5', url: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=250&fit=crop", name: "Барсик", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default6', url: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=300&h=250&fit=crop", name: "Симба", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default7', url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=250&fit=crop", name: "Маркиз", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default8', url: "https://images.unsplash.com/photo-1568152950566-c1bf43f4ab28?w=300&h=250&fit=crop", name: "Луна", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default9', url: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=300&h=250&fit=crop", name: "Матильда", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() },
    { id: 'default10', url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=300&h=250&fit=crop", name: "Леопольд", ownerEmail: "system", ownerName: "Система", date: new Date().toISOString() }
];

function loadGalleryFromStorage() {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_PHOTOS));
    return [...DEFAULT_GALLERY_PHOTOS];
}

function saveGalleryToStorage(photos) {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(photos));
}

async function addGalleryPhoto(url, name) {
    const user = await getCurrentUser();
    const ownerEmail = user ? user.email : 'anonymous';
    const ownerName = user ? user.name : 'Гость';
    const photos = loadGalleryFromStorage();
    const newPhoto = {
        id: Date.now() + '_' + Math.random(),
        url, name, ownerEmail, ownerName,
        date: new Date().toISOString()
    };
    photos.unshift(newPhoto);
    saveGalleryToStorage(photos);
}

async function deleteGalleryPhoto(photoId) {
    const user = await getCurrentUser();
    const photos = loadGalleryFromStorage();
    const photo = photos.find(p => p.id == photoId);
    if (!photo) throw new Error('Фото не найдено');
    if (!user) throw new Error('Войдите в аккаунт');
    const canDelete = (user.role === 'admin' || user.role === 'manager' || photo.ownerEmail === user.email);
    if (!canDelete) throw new Error('Нет прав на удаление');
    const newPhotos = photos.filter(p => p.id != photoId);
    saveGalleryToStorage(newPhotos);
}

async function loadGalleryPhotos() {
    return loadGalleryFromStorage();
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ============
function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: ${isError ? '#c0392b' : '#2c1810'};
        color: ${isError ? 'white' : '#ffb347'};
        padding: 12px 24px; border-radius: 50px; z-index: 2000;
        animation: slideUp 0.3s ease; font-weight: bold;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============ UI АВТОРИЗАЦИИ ============
async function updateAuthUI() {
    const user = await getCurrentUser();
    const container = document.getElementById('authContainer');
    if (!container) return;
    if (user) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: #ffb347;">🐱 ${user.name} (${user.role === 'admin' ? 'Админ' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'})</span>
                <button onclick="handleLogout()" style="background:#8b3e0a; color:white; border:none; padding:0.5rem 1rem; border-radius:30px; cursor:pointer;">Выйти</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button onclick="openAuthModal('login')" class="auth-btn">Вход</button>
            <button onclick="openAuthModal('register')" class="auth-btn">Регистрация</button>
        `;
    }
}

window.handleLogout = async function() {
    await logoutUser();
    showToast('Вы вышли');
    updateAuthUI();
    if (window.location.pathname.includes('profile.html')) location.href = 'index.html';
    else location.reload();
};

// ============ МОДАЛЬНОЕ ОКНО ============
window.openAuthModal = function(type) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    document.getElementById('modalTitle').innerText = type === 'login' ? 'Вход' : 'Регистрация';
    document.getElementById('modalLoginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('modalRegisterForm').style.display = type === 'register' ? 'block' : 'none';
    modal.style.display = 'flex';
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
};

window.doModalLogin = async function() {
    const email = document.getElementById('modalLoginEmail').value;
    const password = document.getElementById('modalLoginPassword').value;
    if (!email || !password) return showToast('Заполните поля', true);
    try {
        await loginUser(email, password);
        showToast('Добро пожаловать!');
        closeAuthModal();
        updateAuthUI();
        if (window.location.pathname.includes('profile.html')) location.reload();
        else if (window.location.pathname.includes('reviews.html')) location.reload();
        else if (window.location.pathname.includes('index.html')) location.reload();
    } catch(e) { showToast(e.message, true); }
};

window.doModalRegister = async function() {
    const name = document.getElementById('modalRegName').value;
    const email = document.getElementById('modalRegEmail').value;
    const phone = document.getElementById('modalRegPhone').value;
    const password = document.getElementById('modalRegPassword').value;
    if (!name || !email || !phone || !password) return showToast('Заполните все поля', true);
    try {
        await registerUser(email, password, name, phone);
        showToast('Регистрация успешна! Теперь войдите');
        openAuthModal('login');
    } catch(e) { showToast(e.message, true); }
};

// ============ БУРГЕР ============
function initBurger() {
    const burger = document.querySelector('.burger');
    const navMenu = document.querySelector('.nav-menu');
    if (burger && navMenu) {
        burger.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
}

// ============ СТИЛЬ ДЛЯ ТОСТОВ ============
const style = document.createElement('style');
style.textContent = `@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}`;
document.head.appendChild(style);

// ============ ИНИЦИАЛИЗАЦИЯ ============
initDefaultUsers().then(() => {
    updateAuthUI();
    initBurger();
});

// Экспорт для других страниц
window.getCurrentUser = getCurrentUser;
window.saveBooking = saveBooking;
window.getMyBookings = getMyBookings;
window.getAllBookings = getAllBookings;
window.deleteBooking = deleteBooking;
window.addReview = addReview;
window.getAllReviews = getAllReviews;
window.deleteReview = deleteReview;
window.updateProfile = updateProfile;
window.loadGalleryPhotos = loadGalleryPhotos;
window.addGalleryPhoto = addGalleryPhoto;
window.deleteGalleryPhoto = deleteGalleryPhoto;
window.showToast = showToast;