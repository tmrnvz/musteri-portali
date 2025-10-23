// assets/js/script.js

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

// --- API URLs ---
const LOGIN_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/auth/login';
const PRESIGNER_API_URL = 'https://presigner.synqbrand.com/generate-presigned-url';
const MAIN_POST_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/70c27eca-bdc5-46bb-897b-13c3cd27bb8d';
const STATUS_CHECK_BASE_URL = 'https://ops.synqbrand.com/webhook/b21a7415-3fd1-41a4-905f-4718a2205852/check-status/';
const R2_PUBLIC_BASE_URL = 'https://media.izmirarkadas.com';
const GET_PLATFORMS_URL = 'https://ops.synqbrand.com/webhook/e3b4673c-d346-4f09-a970-052526b6646e';
const GET_PENDING_POSTS_URL = 'https://ops.synqbrand.com/webhook/ac5496d2-7540-4db1-b7e1-a28c0e2320dc';
const PROCESS_APPROVAL_URL = 'https://ops.synqbrand.com/webhook/ef89b9df-469d-4329-9194-6805b12a6dc5';
const PUBLISH_APPROVED_POSTS_URL = 'https://ops.synqbrand.com/webhook/eb85bb8a-a1c4-4f0e-a50f-fc0c2afd64d0';

// --- State ---
let state = { loadingIntervalId: null, pendingPosts: [], modalDecisions: [], selectedPosts: [] };

// --- Element Variables ---
const loginSection = document.getElementById('login-section');
const customerPanel = document.getElementById('customer-panel');
const postFormSection = document.getElementById('post-form-section');
const approvalPortalSection = document.getElementById('approval-portal-section');
const allViews = document.querySelectorAll('.view');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const statusDiv = document.getElementById('status');
const welcomeMessage = document.getElementById('welcome-message');
const showFormBtn = document.getElementById('show-form-btn');
const showApprovalPortalBtn = document.getElementById('show-approval-portal-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToPanelBtn = document.getElementById('back-to-panel-btn');
const backToPanelFromApprovalBtn = document.getElementById('back-to-panel-from-approval-btn');
const modalSaveBtn = document.getElementById('modal-save-btn');
const bulkApproveBtn = document.getElementById('bulk-approve-btn');
// ... Diğer elementler ...

// --- Helper Functions ---
const showSpinner = (button) => {
    if (!button) return;
    button.disabled = true;
    button.classList.add('btn-loading');
    const buttonText = button.querySelector('.btn-text');
    if (buttonText) buttonText.style.visibility = 'hidden';
    if (!button.querySelector('.spinner-inline')) {
        button.insertAdjacentHTML('beforeend', '<div class="spinner-inline"></div>');
    }
};

const hideSpinner = (button) => {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('btn-loading');
    const spinner = button.querySelector('.spinner-inline');
    if (spinner) spinner.remove();
    const buttonText = button.querySelector('.btn-text');
    if (buttonText) buttonText.style.visibility = 'visible';
};

// --- Router ---
const navigateTo = (hash) => {
    if (window.location.hash === hash) {
        router();
    } else {
        window.location.hash = hash;
    }
};

const router = () => {
    const hash = window.location.hash || '#login';
    allViews.forEach(view => view.style.display = 'none');

    const token = localStorage.getItem('jwtToken');
    if (!token && hash !== '#login') {
        navigateTo('#login');
        return;
    }

    let targetView;
    switch (hash) {
        case '#panel':
            targetView = customerPanel;
            break;
        case '#approval':
            targetView = approvalPortalSection;
            loadAndRenderApprovalGallery();
            break;
        case '#create':
            targetView = postFormSection;
            resetPostForm();
            break;
        default: // #login ve diğerleri
            if (token) {
                // Eğer kullanıcı giriş yapmışsa ve geçersiz bir URL'deyse panele yönlendir
                targetView = customerPanel;
                if (window.location.hash !== '#panel') navigateTo('#panel');
            } else {
                targetView = loginSection;
            }
            break;
    }

    if (targetView) {
        targetView.style.display = 'block';
    }
};

// --- Core Functions ---
// ... Buraya diğer tüm fonksiyonlarınız (handleLogin, renderGallery vb.) gelecek...
// Örnek olarak handleLogin'i güncelleyelim
const handleLogin = async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    setStatus(statusDiv, "Logging in...");
    showSpinner(loginBtn);
    try {
        const response = await fetch(LOGIN_WORKFLOW_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Login failed with status: ${response.status}`);
        }
        const data = await response.json();
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('username', data.username);
        await initializeUserPanel({ username: data.username });
        navigateTo('#panel');
    } catch (error) {
        setStatus(statusDiv, error.message, "error");
    } finally {
        hideSpinner(loginBtn);
    }
};

const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    // State'i temizle
    state.pendingPosts = [];
    navigateTo('#login');
};

const handleSaveChanges = async () => {
    const currentPostId = state.modalDecisions.length > 0 ? state.modalDecisions[0].postId : null;
    if (state.modalDecisions.length === 0) {
        closeApprovalModal();
        return;
    }

    const modalSaveBtn = document.getElementById('modal-save-btn');
    showSpinner(modalSaveBtn);
    // ... (eski handleSaveChanges kodunuzun geri kalanı)
};


// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', router);

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

showFormBtn.addEventListener('click', () => navigateTo('#create'));
showApprovalPortalBtn.addEventListener('click', () => navigateTo('#approval'));
backToPanelBtn.addEventListener('click', () => navigateTo('#panel'));
backToPanelFromApprovalBtn.addEventListener('click', () => navigateTo('#panel'));

// ... (Diğer tüm kodlarınız ve fonksiyonlarınız aşağıda devam etmeli)
// handleSaveChanges, handleBulkApprove gibi fonksiyonların içine showSpinner/hideSpinner eklemeyi unutmayın.

// ÖNEMLİ: Buradan aşağısını kendi çalışan script.js dosyanızdan kopyalayın,
// sadece handleLogin, handleLogout ve event listener'ları yukarıdaki gibi güncelleyin.
// Aşağısı bir önceki cevaptaki tam kodla aynıdır.

const { uppy, Dashboard, AwsS3 } = window.Uppy; // Global Uppy'yi kullan
// ... (geri kalan tüm fonksiyonlarınız)
