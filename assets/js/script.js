/* assets/js/script.js - CLEANED FINAL VERSION FOR LATE INTEGRATION - NO PHASE 2 CODE */

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

// API URLs
const LOGIN_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/auth/login';
const ONBOARDING_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/af26ffa3-b636-46cf-9135-05fe0de71aac';
const PRESIGNER_API_URL = 'https://presigner.synqbrand.com/generate-presigned-url';
const MAIN_POST_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/ee3b3bd2-ae44-47ae-812d-c97a41a62731'; 
const APPROVE_MANUAL_POST_URL = 'https://ops.synqbrand.com/webhook/8596e58f-177e-4396-909a-cd4de4d5373c';
const R2_PUBLIC_BASE_URL = 'https://media.izmirarkadas.com';
const GET_PLATFORMS_URL = 'https://ops.synqbrand.com/webhook/e3b4673c-d346-4f09-a970-052526b6646e';
const GET_PENDING_POSTS_URL = 'https://ops.synqbrand.com/webhook/ac5496d2-7540-4db1-b7e1-a28c0e2320dc';
const PROCESS_APPROVAL_URL = 'https://ops.synqbrand.com/webhook/ef89b9df-469d-4329-9194-6805b12a6dc5';
const PUBLISH_APPROVED_POSTS_URL = 'https://ops.synqbrand.com/webhook/eb85bb8a-a1c4-4f0e-a50f-fc0c2afd64d0';
const GET_MANUAL_POST_BY_ID_URL = 'https://ops.synqbrand.com/webhook/e1b260ea-2f4f-4620-8098-c5e9d369258b/e1b260ea-2f4f-4620-8098-c5e9d369258b/';

// LATE ENTEGRASYON URL'LERİ
const LATE_GET_CONNECT_URL = 'https://ops.synqbrand.com/webhook/late-get-connect-url'; // Workflow A
const LATE_SAVE_DATA_URL = 'https://ops.synqbrand.com/webhook/late-save-connection-data'; // Workflow B
const LATE_GET_STATUS_URL = 'https://ops.synqbrand.com/webhook/late-get-status'; // Yeni Status Workflow'u

let state = { 
    loadingIntervalId: null, 
    pendingPosts: [], 
    modalDecisions: [], 
    selectedPosts: [],
    businessId: null, // NocoDB Business Profile ID'si (Bu kısmı manuel olarak düzelteceğiz)
    lateProfileId: null // Late'in verdiği Profil ID'si
};

// Element variables
const loginSection = document.getElementById('login-section'); const customerPanel = document.getElementById('customer-panel'); const postFormSection = document.getElementById('post-form-section'); const loginForm = document.getElementById('login-form'); const loginBtn = document.getElementById('login-btn'); const statusDiv = document.getElementById('status'); const welcomeMessage = document.getElementById('welcome-message'); const showFormBtn = document.getElementById('show-form-btn'); const postForm = document.getElementById('post-form'); const submitPostBtn = document.getElementById('submit-post-btn'); const postStatusDiv = document.getElementById('post-status'); const backToPanelBtn = document.getElementById('back-to-panel-btn'); const logoutBtn = document.getElementById('logout-btn'); const approvalPortalSection = document.getElementById('approval-portal-section'); const showApprovalPortalBtn = document.getElementById('show-approval-portal-btn'); const backToPanelFromApprovalBtn = document.getElementById('back-to-panel-from-approval-btn'); const approvalGalleryContainer = document.getElementById('approval-gallery-container'); const approvalModal = document.getElementById('approval-modal'); const modalTitle = document.getElementById('modal-title'); const modalCloseBtn = document.getElementById('modal-close-btn'); const modalVisual = document.getElementById('modal-visual'); const modalPlatforms = document.getElementById('modal-platforms');
const modalSaveBtn = document.getElementById('modal-save-btn'); const modalCancelBtn = document.getElementById('modal-cancel-btn'); const modalStatus = document.getElementById('modal-status');
const publishApprovedBtn = document.getElementById('publish-approved-btn'); const publishStatus = document.getElementById('publish-status');
const bulkActionsContainer = document.getElementById('bulk-actions-container'); const bulkSelectAll = document.getElementById('bulk-select-all'); const bulkApproveBtn = document.getElementById('bulk-approve-btn');
const onboardingSection = document.getElementById('onboarding-section');
const pendingActivationSection = document.getElementById('pending-activation-section');
const formContainer = document.getElementById('form-container');
const onboardingLogoutBtn = document.getElementById('onboarding-logout-btn');
const pendingLogoutBtn = document.getElementById('pending-logout-btn');
const showConnectPageBtn = document.getElementById('show-connect-page-btn'); 
const connectPageSection = document.getElementById('connect-page-section');   
const backToPanelFromConnectBtn = document.getElementById('back-to-panel-from-connect-btn');
const platformButtonsContainer = document.getElementById('platform-buttons-container');


const ICON_APPROVE = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ICON_REJECT = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

const getAuthHeaders = () => { const token = localStorage.getItem('jwtToken'); if (!token) return null; return { 'Authorization': `Bearer ${token}` }; };
const setStatus = (element, message, type = 'info') => { if(element) { element.className = type; element.innerHTML = message; }};
const handleLogout = () => { localStorage.removeItem('jwtToken'); localStorage.removeItem('username'); location.reload(); };

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Invalid JWT token:", e);
        return null;
    }
};

const loadAndInjectForm = async () => {
    if (formContainer.innerHTML.trim() !== "") return;
    try {
        const response = await fetch('onboarding-form.html');
        if (!response.ok) throw new Error('Could not load the form.');
        const formHtml = await response.text();
        formContainer.innerHTML = formHtml;
        const onboardingForm = formContainer.querySelector('#onboarding-form');
        if (onboardingForm) {
            onboardingForm.addEventListener('submit', handleOnboardingSubmit);
        }
    } catch (error) {
        formContainer.innerHTML = `<p class="error">Error loading the onboarding form. Please refresh the page.</p>`;
        console.error(error);
    }
};

const routeUserByRole = async (role, username) => {
    loginSection.style.display = 'none';
    customerPanel.style.display = 'none';
    onboardingSection.style.display = 'none';
    pendingActivationSection.style.display = 'none';
    postFormSection.style.display = 'none';
    approvalPortalSection.style.display = 'none';
    connectPageSection.style.display = 'none';

    if (role === 'customer') {
        const token = localStorage.getItem('jwtToken');
        const decodedToken = parseJwt(token);
        
        // GİRİŞ BAŞARILI OLDUĞUNDA, SADECE ROLÜ KONTROL EDİYORUZ.
        // Business ID'yi daha sonra ayrı bir endpoint ile çekeceğiz.
        
        welcomeMessage.textContent = `Welcome, ${username}!`;
        customerPanel.style.display = 'block';
        // fetchAndRenderPlatforms(); // Bağlantı kontrolü sonra yapılacak
    } else if (role === 'pending' || role === 'new_member') {
        await loadAndInjectForm(); 
        onboardingSection.style.display = 'block';
    } else if (role === 'pending_activation') {
        pendingActivationSection.style.display = 'block';
    } else if (role === 'admin') {
        loginSection.style.display = 'block';
        setStatus(statusDiv, 'Admin panel is not accessible from this interface.', 'error');
        handleLogout();
    } else {
        loginSection.style.display = 'block';
        setStatus(statusDiv, 'An error occurred with your user role. Please contact support.', 'error');
        handleLogout();
    }
};

const showApprovalPortal = () => { customerPanel.style.display = 'none'; approvalPortalSection.style.display = 'block'; publishApprovedBtn.disabled = true; publishStatus.innerHTML = ''; loadAndRenderApprovalGallery(); };
const showCustomerPanel = () => { approvalPortalSection.style.display = 'none'; postFormSection.style.display = 'none'; connectPageSection.style.display = 'none'; customerPanel.style.display = 'block'; };

// YENİ SAYFA GEÇİŞ FONKSİYONLARI
const showConnectPage = () => {
    customerPanel.style.display = 'none';
    postFormSection.style.display = 'none';
    approvalPortalSection.style.display = 'none';
    connectPageSection.style.display = 'block';
    // BAĞLANTI DURUMUNU YÜKLEME ÇAĞRISI BURAYA GELECEK
    renderConnectionStatus(); 
};

const hideConnectPage = () => {
    connectPageSection.style.display = 'none';
    customerPanel.style.display = 'block';
};


const loadAndRenderApprovalGallery = async () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const renderGallery = (posts) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const updateBulkActionsState = () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const handleBulkApprove = async () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const handleSaveChanges = async () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const checkAllDecisionsMade = (postId) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const openApprovalModal = (postId) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const closeApprovalModal = () => { approvalModal.classList.remove('active'); };
const handlePublishApproved = async () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };

const uppy = new Uppy({ debug:false, autoProceed:false, restrictions:{ maxFileSize:100*1024*1024, allowedFileTypes:['image/*','video/*'], minNumberOfFiles:1 } }); uppy.use(Dashboard, { inline:true, target:'#uppy-drag-drop-area', proudlyDisplayPoweredByUppy:false, theme:'light', height:300, hideUploadButton:true, allowMultipleUploadBatches:false }); uppy.use(AwsS3, { getUploadParameters: async (file) => { const response = await fetch(PRESIGNER_API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fileName:file.name, contentType:file.type}) }); const presignData = await response.json(); return { method:'PUT', url:presignData.uploadUrl, fields:{}, headers:{'Content-Type':file.type} }; } });

const handleLogin = async (event) => { event.preventDefault(); const username = document.getElementById("username").value; const password = document.getElementById("password").value; setStatus(statusDiv, "Logging in...", 'info'); loginBtn.disabled = true; try { const response = await fetch(LOGIN_WORKFLOW_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Login failed with status: ${response.status}`); } const data = await response.json(); const token = data.token; localStorage.setItem('jwtToken', token); const decodedToken = parseJwt(token); if (decodedToken && decodedToken.role) { localStorage.setItem('username', decodedToken.username); setStatus(statusDiv, "", "success"); await routeUserByRole(decodedToken.role, decodedToken.username); } else { throw new Error('Invalid token received from server.'); } } catch (error) { setStatus(statusDiv, error.message, "error"); } finally { loginBtn.disabled = false; } };
const handleOnboardingSubmit = async (event) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const handlePostSubmit = async (event) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };

// YENİ LATE BAĞLANTI FONKSİYONU (Platform adı alacak)
const initiateLateConnection = async (platform) => {
    // Bu fonksiyon, platform tuşuna basıldığında çağrılacak.
    if (!state.lateProfileId) { 
        alert('Error: Late Profile ID is missing. Please contact support or complete setup.');
        return;
    }

    const platformBtn = document.querySelector(`.platform-connect-btn[data-platform="${platform}"]`);
    if (platformBtn) {
        platformBtn.disabled = true;
        platformBtn.textContent = 'Generating Link...';
    }

    try {
        const response = await fetch(LATE_GET_CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                businessId: state.businessId, // NocoDB Business ID (şu an kullanılmayabilir ama gönderiyoruz)
                lateProfileId: state.lateProfileId, 
                platform: platform // Tıklanan platform
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Connection link generation failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const connectUrl = data.connectUrl;

        if (!connectUrl) {
            throw new Error('n8n returned successfully but no connection URL was found.');
        }

        const windowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=800,height=800";
        window.open(connectUrl, 'LateConnection', windowFeatures);

        if (platformBtn) {
            platformBtn.disabled = false;
            platformBtn.textContent = `Connecting ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`;
        }

    } catch (error) {
        alert(`Hesap bağlama akışı başlatılamadı: ${error.message}`);
        console.error('Late Connection Error:', error);
        if (platformBtn) {
            platformBtn.disabled = false;
            button.textContent = `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`; 
        }
    }
};

// YENİ DURUM KONTROL FONKSİYONU (Sizin istediğiniz gibi)
const renderConnectionStatus = async () => {
    document.querySelectorAll('.connection-status-text').forEach(el => {
        el.textContent = 'Checking...';
        el.className = 'connection-status-text';
    });
    
    const headers = getAuthHeaders(); 

    if (!headers) {
        document.getElementById('platform-buttons-container').innerHTML = '<p class="error">Error: Not logged in (JWT missing).</p>';
        return;
    }

    try {
        const response = await fetch(LATE_GET_STATUS_URL, { 
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status check failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json(); 

        // LATE_PROFILE_ID'yi state'e kaydet (Workflow A'da kullanmak için)
        state.lateProfileId = data.lateProfileId; 

        document.querySelectorAll('.platform-connect-btn').forEach(button => {
            const platform = button.dataset.platform;
            const statusTextEl = document.getElementById(`status-${platform}`);
            
            const platformStatus = data.platforms[platform];
            const isConnected = platformStatus && platformStatus.status === 'connected';

            if (isConnected) {
                button.classList.add('is-connected');
                statusTextEl.textContent = 'CONNECTED';
                statusTextEl.classList.add('connected');
                button.dataset.status = 'connected';
            } else {
                button.classList.remove('is-connected');
                statusTextEl.textContent = 'NOT CONNECTED';
                statusTextEl.classList.add('disconnected');
                button.dataset.status = 'disconnected';
            }
        });

    } catch (error) {
        console.error('Connection Status Render Error:', error);
        document.getElementById('platform-buttons-container').innerHTML = `<p class="error">Error loading connection status: ${error.message}</p>`;
    }
};


// Event Listeners
loginForm.addEventListener('submit', handleLogin);
postForm.addEventListener('submit', handlePostSubmit);
logoutBtn.addEventListener('click', handleLogout);
showFormBtn.addEventListener('click', () => { resetPostForm(); customerPanel.style.display = 'none'; postFormSection.style.display = 'block'; });
backToPanelBtn.addEventListener('click', () => { const isResultState = backToPanelBtn.textContent === 'Create Another Post'; if (isResultState) { resetPostForm(); } else { postFormSection.style.display = 'none'; customerPanel.style.display = 'block'; } });
showApprovalPortalBtn.addEventListener('click', showApprovalPortal);
backToPanelFromApprovalBtn.addEventListener('click', showCustomerPanel);
modalCloseBtn.addEventListener('click', closeApprovalModal);
approvalModal.addEventListener('click', (event) => { if (event.target === approvalModal) { closeApprovalModal(); } });
modalSaveBtn.addEventListener('click', handleSaveChanges);
modalCancelBtn.addEventListener('click', closeApprovalModal);
publishApprovedBtn.addEventListener('click', handlePublishApproved);
bulkSelectAll.addEventListener('change', () => { const isChecked = bulkSelectAll.checked; const actionableCheckboxes = approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox'); actionableCheckboxes.forEach(cb => { cb.checked = isChecked; const postId = parseInt(cb.dataset.postId); const isAlreadySelected = state.selectedPosts.includes(postId); if (isChecked && !isAlreadySelected) { state.selectedPosts.push(postId); } else if (!isChecked && isAlreadySelected) { state.selectedPosts = state.selectedPosts.filter(id => id !== postId); } }); updateBulkActionsState(); });
bulkApproveBtn.addEventListener('click', handleBulkApprove);


// YENİ SAYFA GEÇİŞLERİ VE BUTON DİNLEYİCİLERİ
showConnectPageBtn.addEventListener('click', showConnectPage);
backToPanelFromConnectBtn.addEventListener('click', hideConnectPage);

// Platform butonlarına tek bir dinleyici ekleme
platformButtonsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.platform-connect-btn');
    if (btn) {
        const platform = btn.dataset.platform; 
        initiateLateConnection(platform); 
    }
});


onboardingLogoutBtn.addEventListener('click', handleLogout);
pendingLogoutBtn.addEventListener('click', handleLogout);

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken.role) {
            await routeUserByRole(decodedToken.role, decodedToken.username);
        } else {
            handleLogout();
        }
    }
});
