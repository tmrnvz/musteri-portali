/* assets/js/script.js - CLEANED BASE VERSION */

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

// LATE ENTEGRASYON URL'LERİ (ŞİMDİLİK DEVRE DIŞI BIRAKIYORUZ)
// const LATE_GET_CONNECT_URL = 'https://ops.synqbrand.com/webhook/late-get-connect-url'; 
// const LATE_SAVE_DATA_URL = 'https://ops.synqbrand.com/webhook/late-save-connection-data';
// const LATE_GET_STATUS_URL = 'https://ops.synqbrand.com/webhook/late-get-status'; 


let state = { loadingIntervalId: null, pendingPosts: [], modalDecisions: [], selectedPosts: [] }; // businessId ve lateProfileId eklenmedi

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

// FAZ 2 & LATE ELEMENTLER (ŞİMDİLİK HİÇBİR ŞEY EKLEMEYECEĞİZ)

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
    // connectPageSection.style.display = 'none'; // Bağlantı sayfasını şimdilik gizli tutuyoruz

    if (role === 'customer') {
        // Hata vermemesi için bu kısmı en basit haliyle bırakıyorum.
        welcomeMessage.textContent = `Welcome, ${username}!`;
        customerPanel.style.display = 'block';
        // fetchAndRenderPlatforms(); // Platformları çekmeyi şimdilik durdurduk
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
const showCustomerPanel = () => { approvalPortalSection.style.display = 'none'; postFormSection.style.display = 'none'; customerPanel.style.display = 'block'; };

// ... [ GALERİ VE POST İŞLEMLERİ BURADA OLACAK ] ... 
const loadAndRenderApprovalGallery = async () => { approvalGalleryContainer.innerHTML = `<p class="loading-text">Loading content...</p>`; bulkActionsContainer.style.display = 'none'; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(GET_PENDING_POSTS_URL, { headers }); if (!response.ok) throw new Error(`Server responded with status: ${response.status}`); const data = await response.json(); renderGallery(data.posts); } catch (error) { console.error('Failed to load pending posts:', error); approvalGalleryContainer.innerHTML = `<p class="error loading-text">${error.message}</p>`; } };
const renderGallery = (posts) => { approvalGalleryContainer.innerHTML = ''; const currentDecidedIds = state.pendingPosts.filter(p => p.isDecided).map(p => p.postId); posts.forEach(p => { if (currentDecidedIds.includes(p.postId)) { p.isDecided = true; } }); state.pendingPosts = posts; state.selectedPosts = []; if (!posts || posts.length === 0) { approvalGalleryContainer.innerHTML = `<p class="empty-text">There is no content awaiting your approval. Great job!</p>`; publishApprovedBtn.style.display = 'none'; bulkActionsContainer.style.display = 'none'; return; } const actionablePosts = posts.filter(post => !post.isDecided); if (actionablePosts.length > 0) { bulkActionsContainer.style.display = 'block'; updateBulkActionsState(); } else { bulkActionsContainer.style.display = 'none'; } publishApprovedBtn.style.display = 'block'; posts.forEach(post => { const item = document.createElement('div'); item.className = 'post-list-item'; item.dataset.postId = post.postId; if (post.isDecided) { item.classList.add('is-decided'); } let badge = ''; if (post.isDecided) { if (post.platformDetails.some(p => p.status === 'Approved')) { badge = `<div class="post-list-item-status-badge">Ready for Publish</div>`; } else if (post.platformDetails.every(p => p.status === 'Canceled')) { badge = `<div class="post-list-item-status-badge cancelled">Cancelled</div>`; } } item.innerHTML = ` ${!post.isDecided ? `<div class="checkbox-wrapper"> <input type="checkbox" id="select-post-${post.postId}" data-post-id="${post.postId}" class="bulk-select-checkbox"> <label for="select-post-${post.postId}" class="checkbox-label"><span class="checkbox-custom"></span></label> </div>` : '<div style="width: 34px;"></div>'} <div class="post-list-item-main"> <img src="${post.mainVisualUrl}" alt="Visual for ${post.ideaText.substring(0, 30)}" class="post-list-item-visual"> <div class="post-list-item-content"> ${badge} <p class="post-list-item-label">POST TOPIC:</p> <h4 class="post-list-item-title">${post.ideaText}</h4> </div> </div> `; item.addEventListener('click', (e) => { if (e.target.closest('.checkbox-wrapper')) return; openApprovalModal(post.postId); }); approvalGalleryContainer.appendChild(item); }); approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox').forEach(cb => { cb.addEventListener('change', (e) => { const postId = parseInt(e.target.dataset.postId); if (e.target.checked) { if (!state.selectedPosts.includes(postId)) state.selectedPosts.push(postId); } else { state.selectedPosts = state.selectedPosts.filter(id => id !== postId); } updateBulkActionsState(); }); }); };
const updateBulkActionsState = () => { const actionableCheckboxes = approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox'); if (state.selectedPosts.length > 0) { bulkApproveBtn.disabled = false; bulkApproveBtn.textContent = `Approve Selected (${state.selectedPosts.length})`; } else { bulkApproveBtn.disabled = true; bulkApproveBtn.textContent = 'Approve Selected'; } bulkSelectAll.checked = actionableCheckboxes.length > 0 && state.selectedPosts.length === actionableCheckboxes.length; };
const handleBulkApprove = async () => { const decisions = []; const actionablePostIds = state.pendingPosts.filter(p => !p.isDecided).map(p => p.postId); actionablePostIds.forEach(postId => { const post = state.pendingPosts.find(p => p.postId === postId); if (state.selectedPosts.includes(postId)) { if (post && post.platformDetails) { post.platformDetails.forEach(platform => { decisions.push({ postId: postId, platform: platform.platform, decision: 'approved' }); }); } } else { if (post && post.platformDetails) { post.platformDetails.forEach(platform => { decisions.push({ postId: postId, platform: platform.platform, decision: 'cancelled' }); }); } } }); if (decisions.length === 0) return; bulkApproveBtn.disabled = true; bulkApproveBtn.textContent = 'Processing Decisions...'; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(PROCESS_APPROVAL_URL, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save changes.'); } actionablePostIds.forEach(postId => { const postInState = state.pendingPosts.find(p => p.postId === postId); if (postInState) { postInState.isDecided = true; const wasApproved = state.selectedPosts.includes(postId); postInState.platformDetails.forEach(platform => { platform.status = wasApproved ? 'Approved' : 'Canceled'; }); } }); renderGallery(state.pendingPosts); publishApprovedBtn.disabled = false; } catch (error) { console.error('Bulk action error:', error); setStatus(publishStatus, `Error: ${error.message}`, 'error'); bulkApproveBtn.disabled = false; updateBulkActionsState(); } };
const handleSaveChanges = async () => { const currentPostId = state.modalDecisions.length > 0 ? state.modalDecisions[0].postId : null; if (state.modalDecisions.length === 0) { closeApprovalModal(); return; } modalStatus.textContent = 'Saving...'; modalStatus.className = 'modal-status-text'; modalSaveBtn.disabled = true; modalCancelBtn.disabled = true; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(PROCESS_APPROVAL_URL, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions: state.modalDecisions }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save changes.'); } modalStatus.textContent = 'Saved!'; modalStatus.className = 'modal-status-text success'; setTimeout(() => { closeApprovalModal(); if (currentPostId) { const postInState = state.pendingPosts.find(p => p.postId === currentPostId); if (postInState) { postInState.isDecided = true; state.modalDecisions.forEach(decision => { const platformDetail = postInState.platformDetails.find(p => p.platform === decision.platform); if(platformDetail) { platformDetail.status = decision.decision === 'approved' ? 'Approved' : 'Canceled'; } }); } renderGallery(state.pendingPosts); } else { loadAndRenderApprovalGallery(); } publishApprovedBtn.disabled = false; }, 1000); } catch (error) { console.error('Save changes error:', error); modalStatus.textContent = `Error: ${error.message}`; modalStatus.className = 'modal-status-text error'; modalSaveBtn.disabled = false; modalCancelBtn.disabled = false; } };
const checkAllDecisionsMade = (postId) => { const post = state.pendingPosts.find(p => p.postId === postId); if (!post) return; const totalPlatforms = post.platformDetails.length; const decidedPlatformsCount = state.modalDecisions.filter(d => d.postId === postId).length; if (totalPlatforms === decidedPlatformsCount) { modalSaveBtn.disabled = false; modalStatus.textContent = 'All decisions are made. Ready to save.'; modalStatus.className = 'modal-status-text success'; } else { modalSaveBtn.disabled = true; const remaining = totalPlatforms - decidedPlatformsCount; modalStatus.textContent = `${remaining} platform(s) still require a decision.`; modalStatus.className = 'modal-status-text'; } };
const openApprovalModal = (postId) => { const post = state.pendingPosts.find(p => p.postId === postId); if (!post) { console.error("Post not found!"); return; } state.modalDecisions = []; modalSaveBtn.disabled = true; modalCancelBtn.disabled = false; modalTitle.textContent = post.ideaText; modalVisual.src = post.mainVisualUrl; modalPlatforms.innerHTML = ''; post.platformDetails.forEach((platform, index) => { const item = document.createElement('div'); item.className = 'accordion-item'; if (index === 0) item.classList.add('active'); const isApproved = platform.status === 'Approved'; const isRejected = platform.status === 'Canceled'; const isDecided = isApproved || isRejected; item.innerHTML = `<div class="accordion-header"><span>${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</span></div><div class="accordion-content"><div class="content-section"><h5>Caption</h5><div class="content-text">${platform.caption}</div></div>${platform.hashtags ? `<div class="content-section"><h5>Hashtags</h5><div class="content-hashtags">${platform.hashtags}</div></div>` : ''}<div class="approval-buttons"><button class="btn-decision btn-reject ${isRejected ? 'rejected' : ''}" data-post-id="${postId}" data-platform="${platform.platform}" data-decision="canceled" ${isDecided ? '' : ''}>${ICON_REJECT} Reject</button><button class="btn-decision btn-approve ${isApproved ? 'approved' : ''}" data-post-id="${postId}" data-platform="${platform.platform}" data-decision="approved" ${isDecided ? '' : ''}>${ICON_APPROVE} Approve</button></div></div>`; modalPlatforms.appendChild(item); if (isDecided) { state.modalDecisions.push({ postId: postId, platform: platform.platform, decision: platform.status === 'Approved' ? 'approved' : 'canceled' }); } }); checkAllDecisionsMade(postId); modalPlatforms.querySelectorAll('.accordion-header').forEach(header => { header.addEventListener('click', () => { const activeItem = modalPlatforms.querySelector('.accordion-item.active'); const clickedItem = header.parentElement; if (activeItem && activeItem !== clickedItem) activeItem.classList.remove('active'); clickedItem.classList.toggle('active'); }); }); modalPlatforms.querySelectorAll('.btn-decision').forEach(button => { button.addEventListener('click', (e) => { const targetButton = e.currentTarget; const { postId, platform, decision } = targetButton.dataset; const parent = targetButton.parentElement; parent.querySelectorAll('.btn-decision').forEach(btn => btn.classList.remove('approved', 'rejected')); targetButton.classList.add(decision === 'approved' ? 'approved' : 'rejected'); const decisionData = { postId: parseInt(postId), platform, decision }; state.modalDecisions = state.modalDecisions.filter(d => !(d.postId === parseInt(postId) && d.platform === platform)); state.modalDecisions.push(decisionData); checkAllDecisionsMade(parseInt(postId)); }); }); approvalModal.classList.add('active'); };
const closeApprovalModal = () => { approvalModal.classList.remove('active'); };
const handlePublishApproved = async () => { publishStatus.innerHTML = `<div class="status-loading"><div class="spinner"></div><p>Publishing process initiated... This may take a moment.</p></div>`; publishApprovedBtn.disabled = true; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(PUBLISH_APPROVED_POSTS_URL, { method: 'POST', headers: headers }); const resultText = await response.text(); if (!response.ok) { try { const errorJson = JSON.parse(resultText); throw new Error(errorJson.message || 'An unknown error occurred.'); } catch(e) { throw new Error(resultText || `Request failed with status ${response.status}`); } } const result = JSON.parse(resultText); setStatus(publishStatus, result.message || 'Success!', 'success'); setTimeout(() => { publishStatus.innerHTML = ''; loadAndRenderApprovalGallery(); }, 4000); } catch (error) { console.error('Publishing error:', error); setStatus(publishStatus, error.message, 'error'); publishApprovedBtn.disabled = false; } };

const uppy = new Uppy({ debug:false, autoProceed:false, restrictions:{ maxFileSize:100*1024*1024, allowedFileTypes:['image/*','video/*'], minNumberOfFiles:1 } }); uppy.use(Dashboard, { inline:true, target:'#uppy-drag-drop-area', proudlyDisplayPoweredByUppy:false, theme:'light', height:300, hideUploadButton:true, allowMultipleUploadBatches:false }); uppy.use(AwsS3, { getUploadParameters: async (file) => { const response = await fetch(PRESIGNER_API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fileName:file.name, contentType:file.type}) }); const presignData = await response.json(); return { method:'PUT', url:presignData.uploadUrl, fields:{}, headers:{'Content-Type':file.type} }; } });

const handleLogin = async (event) => { event.preventDefault(); const username = document.getElementById("username").value; const password = document.getElementById("password").value; setStatus(statusDiv, "Logging in...", 'info'); loginBtn.disabled = true; try { const response = await fetch(LOGIN_WORKFLOW_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Login failed with status: ${response.status}`); } const data = await response.json(); const token = data.token; localStorage.setItem('jwtToken', token); const decodedToken = parseJwt(token); if (decodedToken && decodedToken.role) { localStorage.setItem('username', decodedToken.username); setStatus(statusDiv, "", "success"); await routeUserByRole(decodedToken.role, decodedToken.username); } else { throw new Error('Invalid token received from server.'); } } catch (error) { setStatus(statusDiv, error.message, "error"); } finally { loginBtn.disabled = false; } };
const handleOnboardingSubmit = async (event) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const handlePostSubmit = async (event) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };

// YENİ LATE BAĞLANTI FONKSİYONU (Platform adı alacak)
const initiateLateConnection = async (platform) => {
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
                businessId: state.businessId,
                lateProfileId: state.lateProfileId, 
                platform: platform
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
            platformBtn.textContent = `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`; 
        }
    }
};

// YENİ DURUM KONTROL FONKSİYONU
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
