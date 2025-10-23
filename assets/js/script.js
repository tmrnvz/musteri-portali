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
const publishApprovedBtn = document.getElementById('publish-approved-btn');
const submitPostBtn = document.getElementById('submit-post-btn');
// ... other elements
const approvalGalleryContainer = document.getElementById('approval-gallery-container');
const bulkActionsContainer = document.getElementById('bulk-actions-container');
const bulkSelectAll = document.getElementById('bulk-select-all');
const publishStatus = document.getElementById('publish-status');
const approvalModal = document.getElementById('approval-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');


// --- Helper Functions ---

const showSpinner = (button) => {
    if (!button) return;
    button.disabled = true;
    button.classList.add('btn-loading');
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
};

const setStatus = (element, message, type = 'info') => {
    if (element) {
        element.className = type;
        element.innerHTML = message;
    }
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    return { 'Authorization': `Bearer ${token}` };
};


// --- View Management (Simple Display Toggle) ---

function showLoginView() {
    loginSection.style.display = 'block';
    customerPanel.style.display = 'none';
    postFormSection.style.display = 'none';
    approvalPortalSection.style.display = 'none';
}

function showPanelView(userData) {
    if (userData && userData.username) {
        welcomeMessage.textContent = `Welcome, ${userData.username}!`;
    }
    loginSection.style.display = 'none';
    customerPanel.style.display = 'block';
    postFormSection.style.display = 'none';
    approvalPortalSection.style.display = 'none';
}

function showApprovalView() {
    loginSection.style.display = 'none';
    customerPanel.style.display = 'none';
    postFormSection.style.display = 'none';
    approvalPortalSection.style.display = 'block';
    loadAndRenderApprovalGallery();
}

function showCreatePostView() {
    resetPostForm();
    loginSection.style.display = 'none';
    customerPanel.style.display = 'none';
    postFormSection.style.display = 'block';
    approvalPortalSection.style.display = 'none';
}

// --- Core Functions ---

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
    } catch (error) {
        setStatus(statusDiv, error.message, "error");
    } finally {
        hideSpinner(loginBtn);
    }
};

const initializeUserPanel = async (userData) => {
    if (!userData || !userData.username) {
        handleLogout();
        return;
    }
    await fetchAndRenderPlatforms();
    setStatus(statusDiv, "", "success");
    showPanelView(userData);
};

const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    state.pendingPosts = [];
    showLoginView();
};

// ... (Buradan itibaren bir önceki çalışan kodunuzun fonksiyonlarını kopyalıyoruz)
// Sadece spinner'ları ekleyeceğiz.

// Tüm fonksiyonlarınız buraya gelecek...
// Örnek:
const loadAndRenderApprovalGallery = async () => { /* ... kod ... */ };
const renderGallery = (posts) => { /* ... kod ... */ };
const updateBulkActionsState = () => { /* ... kod ... */ };

const handleBulkApprove = async () => {
    showSpinner(bulkApproveBtn);
    // ... (eski kodunuz)
    try {
        // ...
    } catch (error) {
        // ...
    } finally {
        hideSpinner(bulkApproveBtn);
    }
};

const handleSaveChanges = async () => {
    showSpinner(modalSaveBtn);
    // ... (eski kodunuz)
    try {
        // ...
    } catch (error) {
        // ...
    } finally {
        hideSpinner(modalSaveBtn);
    }
};

const handlePublishApproved = async () => {
    showSpinner(publishApprovedBtn);
    // ... (eski kodunuz)
    try {
        // ...
    } catch (error) {
        // ...
    } finally {
        hideSpinner(publishApprovedBtn);
    }
};

// ... Diğer tüm fonksiyonları buraya yapıştırın.

// --- Event Listeners ---

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
showFormBtn.addEventListener('click', showCreatePostView);
showApprovalPortalBtn.addEventListener('click', showApprovalView);
backToPanelBtn.addEventListener('click', () => showPanelView({ username: localStorage.getItem('username') }));
backToPanelFromApprovalBtn.addEventListener('click', () => showPanelView({ username: localStorage.getItem('username') }));
// ... (Diğer tüm event listener'larınız)

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('username');
    if (token && username) {
        initializeUserPanel({ username: username });
    } else {
        showLoginView();
    }
});
