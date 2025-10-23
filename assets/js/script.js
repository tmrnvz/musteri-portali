// assets/js/script.js

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

// --- API URLs ---
const LOGIN_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/auth/login';
// ... diğer URL'ler ...

// --- State ---
let state = { /* ... */ };

// --- Element Variables ---
const loginSection = document.getElementById('login-section');
// ... diğer elementler ...
const allViews = document.querySelectorAll('.view'); // GÜNCELLENDİ: Router için

// --- Spinner Helper Functions ---
const showSpinner = (button) => {
    button.disabled = true;
    button.classList.add('btn-loading');
    const buttonText = button.querySelector('.btn-text');
    if(buttonText) buttonText.style.visibility = 'hidden';
    button.insertAdjacentHTML('beforeend', '<div class="spinner-inline"></div>');
};

const hideSpinner = (button) => {
    button.disabled = false;
    button.classList.remove('btn-loading');
    const spinner = button.querySelector('.spinner-inline');
    if (spinner) spinner.remove();
    const buttonText = button.querySelector('.btn-text');
    if(buttonText) buttonText.style.visibility = 'visible';
};


// --- Router ---
const navigateTo = (hash) => {
    window.location.hash = hash;
};

const router = () => {
    const hash = window.location.hash || '#login';
    allViews.forEach(view => view.style.display = 'none'); // Önce tümünü gizle

    const token = localStorage.getItem('jwtToken');
    if (!token && hash !== '#login') {
        navigateTo('#login');
        return;
    }

    switch (hash) {
        case '#panel':
            customerPanel.style.display = 'block';
            break;
        case '#approval':
            approvalPortalSection.style.display = 'block';
            loadAndRenderApprovalGallery();
            break;
        case '#create':
            postFormSection.style.display = 'block';
            resetPostForm();
            break;
        default: // #login ve diğerleri
            if (token) {
                navigateTo('#panel');
            } else {
                loginSection.style.display = 'block';
            }
            break;
    }
};

// --- Functions ---

const handleLogin = async (event) => {
    event.preventDefault();
    showSpinner(loginBtn); // GÜNCELLENDİ
    // ...
    try {
        // ... fetch logic ...
        navigateTo('#panel'); // GÜNCELLENDİ
    } catch (error) {
        // ...
    } finally {
        hideSpinner(loginBtn); // GÜNCELLENDİ
    }
};

const handleSaveChanges = async () => {
    // ...
    showSpinner(modalSaveBtn); // GÜNCELLENDİ
    try {
        // ... fetch logic ...
        // Başarılı olunca listeyi yeniden yükle
        loadAndRenderApprovalGallery();
    } catch (error) {
        // ...
    } finally {
        hideSpinner(modalSaveBtn); // GÜNCELLENDİ
        closeApprovalModal();
    }
};

const handleBulkApprove = async () => {
    // ...
    showSpinner(bulkApproveBtn); // GÜNCELLENDİ
    try {
        // ... fetch logic ...
        // Başarılı olunca listeyi yeniden yükle
        loadAndRenderApprovalGallery();
    } catch (error) {
        // ...
    } finally {
        hideSpinner(bulkApproveBtn); // GÜNCELLENDİ
    }
};

// ... Diğer fonksiyonlar (renderGallery, openModal vb.) aynı kalabilir ...
// Sadece sayfa geçişi yapan yerleri `navigateTo` kullanacak şekilde güncelleyeceğiz.

const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    navigateTo('#login');
};


// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', () => {
    // Sayfa ilk yüklendiğinde router'ı çalıştır
    const token = localStorage.getItem('jwtToken');
    if (token) {
        initializeUserPanel({ username: localStorage.getItem('username') });
        router(); // Router'ı çağır
    } else {
        router(); // Router'ı çağır
    }
});
window.addEventListener('hashchange', router); // URL hash'i değiştiğinde router'ı çalıştır

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// GÜNCELLENDİ: Butonlar artık sadece URL hash'ini değiştiriyor
showFormBtn.addEventListener('click', () => navigateTo('#create'));
showApprovalPortalBtn.addEventListener('click', () => navigateTo('#approval'));
backToPanelBtn.addEventListener('click', () => navigateTo('#panel'));
backToPanelFromApprovalBtn.addEventListener('click', () => navigateTo('#panel'));

// ... Diğer olay dinleyicileri (modal, uppy vb.) aynı kalabilir ...
modalSaveBtn.addEventListener('click', handleSaveChanges);
bulkApproveBtn.addEventListener('click', handleBulkApprove);

// ... Kalan tüm fonksiyonlar (initializeUserPanel, renderGallery vb.) ...
