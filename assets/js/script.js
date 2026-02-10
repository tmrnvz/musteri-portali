/* assets/js/script.js - FINAL LATE POLLING INTEGRATION - Late vs Late Versiyon */

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

// FAZ 2 - URL'LER
const GET_BUSINESS_PROFILE_URL = 'https://ops.synqbrand.com/webhook/0dff236e-f2c4-40db-ad88-0fc59f3f779d';
const UPDATE_PROFILE_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/1f7ae02d-59b4-4eaf-95b8-712c1e47bfbe';

// LATE ENTEGRASYON URL'LERİ (Workflow A, B ve C'nin Adresleri)
const LATE_GET_CONNECT_URL = 'https://ops.synqbrand.com/webhook/late-get-connect-url'; // Workflow A (Gidiş)
const LATE_SAVE_DATA_URL = 'https://ops.synqbrand.com/webhook/late-save-connection-data'; // Workflow B (Geliş - Manuel Sync)
const LATE_GET_STATUS_URL = 'https://ops.synqbrand.com/webhook/late-get-status'; // Workflow Durum Kontrolü (UI Durum Yenileme için tutuluyor)
const LATE_POLLING_URL = 'https://ops.synqbrand.com/webhook/late-check-accounts'; // Workflow C (Polling - BAŞARI KONTROLÜ İÇİN KULLANILACAK)


// Polling State (Yeni değişkenler)
let latePopupRef = null;
let latePollingInterval = null;


let state = { 
    loadingIntervalId: null, 
    pendingPosts: [], 
    modalDecisions: [], 
    selectedPosts: [],
    businessId: null, // NocoDB Business Profile ID'si (Girişten sonra ayarlanacak)
    lateProfileId: null // Late'in verdiği Profil ID'si (Status Çekmeden sonra ayarlanacak)
};

// Element variables (Aynı kalıyor)
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
//const syncLateDataBtn = document.getElementById('sync-late-data-btn');


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
        
        if (decodedToken && decodedToken.userId) { 
            state.businessId = decodedToken.userId; 
        }

        welcomeMessage.textContent = `Welcome, ${username}!`;
        customerPanel.style.display = 'block';
        fetchAndRenderPlatforms();
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
        setStatus(statusDiv, 'An error occurred with your user role. Please contact contact support.', 'error');
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
    renderConnectionStatus(); // YENİ: Durum Kontrolü Çağrısı
};

const hideConnectPage = () => {
    connectPageSection.style.display = 'none';
    customerPanel.style.display = 'block';
};

// ... [ GALERİ VE POST İŞLEMLERİ AYNI KALIYOR ] ... 
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
const handleOnboardingSubmit = async (event) => { event.preventDefault(); const onboardingForm = event.target; const onboardingStatus = onboardingForm.querySelector('#onboarding-status'); const submitBtn = onboardingForm.querySelector('#submit-onboarding-btn'); setStatus(onboardingStatus, 'Submitting your information...', 'info'); submitBtn.disabled = true; const authHeaders = getAuthHeaders(); if (!authHeaders) { handleLogout(); return; } try { const formData = new FormData(onboardingForm); const jsonData = {}; for (const [key, value] of formData.entries()) { if (key !== 'PlatformFocus') { jsonData[key] = value; } } const platformFocusCheckboxes = onboardingForm.querySelectorAll('input[name="PlatformFocus"]:checked'); const platformFocusValues = Array.from(platformFocusCheckboxes).map(cb => cb.value); jsonData.PlatformFocus = platformFocusValues; let platformUsernamesText = ""; platformFocusValues.forEach(platform => { const safeId = platform.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-'); const inputId = `pf-${safeId}-user`; const userInput = document.getElementById(inputId); if (userInput && userInput.value) { platformUsernamesText += `${platform}: ${userInput.value}\n`; } else { platformUsernamesText += `${platform}: (Not provided)\n`; } }); jsonData.PlatformUsernamesForEmail = platformUsernamesText.trim(); const response = await fetch(ONBOARDING_WORKFLOW_URL, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(jsonData), }); if (!response.ok) { let errorData; try { errorData = await response.json(); } catch (e) { throw new Error(`Submission failed with status: ${response.status}`); } throw new Error(errorData.message || 'Submission failed due to a server error.'); } onboardingSection.style.display = 'none'; pendingActivationSection.style.display = 'block'; } catch (error) { setStatus(onboardingStatus, `Error: ${error.message}`, 'error'); submitBtn.disabled = false; } };
const handlePostSubmit = async (event) => { event.preventDefault(); const authHeaders = getAuthHeaders(); if (!authHeaders) { handleLogout(); return; } const files = uppy.getFiles(); if (files.length === 0) { postStatusDiv.innerHTML = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>Please select at least one media file.</p></div>`; return; } const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value); if (selectedPlatforms.length === 0) { postStatusDiv.innerHTML = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>Please select at least one platform to post to.</p></div>`; return; } const messages = ["Processing...", "Uploading media files...", "AI is generating content...", "Finalizing..."]; let messageIndex = 0; postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing... Please wait a moment. A window will open shortly for you to review and approve your posts. </h4><p>${messages[messageIndex]}</p></div>`; if (state.loadingIntervalId) clearInterval(state.loadingIntervalId); state.loadingIntervalId = setInterval(() => { messageIndex = (messageIndex + 1) % messages.length; postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing... Please wait a moment. A window will open shortly for you to review and approve your posts.</h4><p>${messages[messageIndex]}</p></div>`; }, 4000); submitPostBtn.disabled = true; backToPanelBtn.disabled = true; try { const result = await uppy.upload(); if (result.failed.length > 0) throw new Error(`Failed to upload: ${result.failed.map(f => f.name).join(', ')}`); const sortedFiles = uppy.getFiles(); const sortedFileKeys = sortedFiles.map(file => { const successfulUpload = result.successful.find(s => s.id === file.id); return successfulUpload ? new URL(successfulUpload.uploadURL).pathname.substring(1) : null; }).filter(key => key !== null); const sortedFileUrls = sortedFileKeys.map(key => `${R2_PUBLIC_BASE_URL}/${key}`); const postData = { postTitle: document.getElementById('postTitle').value, postContent: document.getElementById('postContent').value, destinationLink: document.getElementById('destinationLink').value, fileKeys: sortedFileKeys, fileUrls: sortedFileUrls, submissionID: crypto.randomUUID(), selectedPlatforms: selectedPlatforms }; const response = await fetch(MAIN_POST_WORKFLOW_URL, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(postData) }); if (!response.ok) { const errorText = await response.text(); throw new Error(`Server returned an error: ${response.status} - ${errorText}`); } const responseData = await response.json(); const newPostId = responseData.Id; if (state.loadingIntervalId) clearInterval(state.loadingIntervalId); queueMicrotask(() => displayReviewInterface(newPostId)); } catch (error) { if (state.loadingIntervalId) clearInterval(state.loadingIntervalId); const errorHtml = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>${error.message}</p></div>`; postStatusDiv.innerHTML = errorHtml; submitBtn.disabled = false; backToPanelBtn.disabled = false; } };
const handleApproveAndPublish = async (postId) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const displayReviewInterface = async (postId) => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const setupReviewAccordionListeners = () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const resetPostForm = () => { /* ... KODUNUZU BURAYA EKLEYİN ... */ };
const fetchAndRenderPlatforms = async () => { const container = document.getElementById('platform-selection-container'); const selectAllCheckbox = document.getElementById('select-all-platforms'); container.innerHTML = '<p><em>Loading available platforms...</em></p>'; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(GET_PLATFORMS_URL, { headers }); if (!response.ok) throw new Error(`Could not fetch platforms (status ${response.status}).`); const data = await response.json(); let platforms = data.platforms || []; if (!platforms.length) { container.innerHTML = '<p class="error">No platforms configured for this account.</p>'; selectAllCheckbox.disabled = true; return; } container.innerHTML = ''; platforms.forEach(platform => { const id = `platform-${platform}`; const wrapper = document.createElement('div'); wrapper.className = 'checkbox-wrapper'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = id; checkbox.name = 'platforms'; checkbox.value = platform; checkbox.checked = true; const label = document.createElement('label'); label.htmlFor = id; label.className = 'checkbox-label'; label.innerHTML = `<span class="checkbox-custom"></span><span class="checkbox-label-text">${platform}</span>`; wrapper.appendChild(checkbox); wrapper.appendChild(label); container.appendChild(wrapper); }); selectAllCheckbox.disabled = false; setupSelectAllLogic(); } catch (error) { console.error('Platform fetch error:', error); container.innerHTML = `<p class="error">${error.message || 'Failed to load platforms.'}</p>`; } };
const setupSelectAllLogic = () => { const selectAllCheckbox = document.getElementById('select-all-platforms'); const platformCheckboxes = document.querySelectorAll('input[name="platforms"]'); const syncSelectAllState = () => { const allChecked = Array.from(platformCheckboxes).every(cb => cb.checked); selectAllCheckbox.checked = allChecked; }; selectAllCheckbox.addEventListener('change', () => { platformCheckboxes.forEach(cb => { cb.checked = selectAllCheckbox.checked; }); }); platformCheckboxes.forEach(cb => { cb.addEventListener('change', syncSelectAllState); }); syncSelectAllState(); };


// *** LATE BAĞLANTI FONKSİYONLARI ***

// Polling Helper Functions START //
const getLateStatusSnapshot = async () => {
    const headers = getAuthHeaders(); 
    if (!headers) throw new Error("JWT missing for status check.");

    const response = await fetch(LATE_POLLING_URL, { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({ lateProfileId: state.lateProfileId }) 
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Polling check failed: ${errorText}`);
    }
    
    const responseText = await response.text();
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return { body: responseText }; 
    }
};

/**
 * LATE VS LATE POLLING MEKANİZMASI
 * @param {Array} initialAccountIds - İşlem başlamadan hemen önce Late'ten alınan ID listesi
 */
const startLatePolling = async (initialAccountIds) => {
    if (latePollingInterval) clearInterval(latePollingInterval);

    const POLL_INTERVAL = 3000; 
    const TIMEOUT = 5 * 60 * 1000; 
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        latePollingInterval = setInterval(async () => {
            if (latePopupRef && latePopupRef.closed) {
                clearInterval(latePollingInterval);
                reject(new Error("Popup closed manually."));
                return;
            }

            if (Date.now() - startTime > TIMEOUT) {
                clearInterval(latePollingInterval);
                if (latePopupRef && !latePopupRef.closed) latePopupRef.close();
                reject(new Error("Connection timed out. Please try again."));
                return;
            }

            try {
                const currentFullResponse = await getLateStatusSnapshot();
                
                let current;
                if (typeof currentFullResponse === 'object' && currentFullResponse.accounts) {
                    current = currentFullResponse; 
                } else {
                    try {
                         current = JSON.parse(currentFullResponse.body || currentFullResponse);
                    } catch(e) {
                        current = currentFullResponse;
                    }
                }
                
                const currentAccounts = current.accounts || []; 
                const currentAccountIds = currentAccounts.map(account => account._id || account.id);

                // LATE VS LATE KARŞILAŞTIRMASI: 
                // Late'in kendi güncel listesinde, başlangıç listesinde olmayan bir ID var mı?
                const newAccountFound = currentAccountIds.some(id => id && !initialAccountIds.includes(id));
                
                if (newAccountFound) {
                    clearInterval(latePollingInterval);
                    if (latePopupRef && !latePopupRef.closed) {
                        latePopupRef.close(); 
                    }
                    resolve(true); 
                    return;
                }
            } catch (err) {
                console.error('Late polling error:', err);
                clearInterval(latePollingInterval);
                reject(err);
            }
        }, POLL_INTERVAL);
    });
};

// Polling Helper Functions END //

const initiateLateConnection = async (platform) => {
    if (!state.lateProfileId) { 
        alert('Error: Late Profile ID is missing.');
        return;
    }
    
    const platformBtn = document.querySelector(`.platform-connect-btn[data-platform="${platform}"]`);
    // Orijinal HTML yapısını (ikon + metin + span) en başta yedekleyelim
    const originalHTML = platformBtn.innerHTML;

    if (platformBtn) {
        platformBtn.disabled = true;
        // İSTEDİĞİN DEĞİŞİKLİK: "Setup" ifadesi
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        platformBtn.textContent = `${platformName} Setup...`; 
    }
    
    try {
        const initialLateData = await getLateStatusSnapshot();
        const initialAccountIds = (initialLateData.accounts || []).map(a => a._id || a.id);

        const response = await fetch(LATE_GET_CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: state.businessId, platform: platform })
        });
        const data = await response.json();
        
        latePopupRef = window.open(data.connectEndpoint, 'LateAuth', 'width=800,height=800');
        
        if (!latePopupRef) throw new Error("Popup engellendi!");

        // POLLING (Düzgün çalışan kapanma mekanizması)
        await startLatePolling(initialAccountIds); 

        // BAŞARI: Otomatik Kayıt
        await saveLateConnectionData(); 
        
        alert(`Success: ${platform.toUpperCase()} connected!`);

    } catch (error) {
        console.error('Late Connection Error:', error);
        alert(`Hata: ${error.message}`);
        // Hata olursa butonu o anki orijinal haline geri döndür
        if (platformBtn) platformBtn.innerHTML = originalHTML;
    } finally {
        if (latePollingInterval) clearInterval(latePollingInterval);
        latePollingInterval = null;
        latePopupRef = null;
        
        // KRİTİK DOKUNUŞ: 
        // Önce butonun HTML yapısını (içindeki span'ları) geri yükle, 
        // sonra NocoDB'den güncel statüyü çek.
        if (platformBtn) {
            platformBtn.innerHTML = originalHTML;
            platformBtn.disabled = false;
        }
        await renderConnectionStatus(); 
    }
};

const renderConnectionStatus = async () => {
    document.querySelectorAll('.connection-status-text').forEach(el => {
        el.textContent = 'Checking...';
        el.className = 'connection-status-text';
    });
    
    const headers = getAuthHeaders(); 
    if (!headers) return;

    try {
        const response = await fetch(LATE_GET_STATUS_URL, { method: 'GET', headers: headers });
        if (!response.ok) throw new Error(`Status check failed`);
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

    } catch (error) { console.error(error); }
};


// *** VERİ KAYDETME FONKSİYONU ***
const saveLateConnectionData = async () => {
    syncLateDataBtn.disabled = true;
    syncLateDataBtn.textContent = 'Syncing Data...';
    const headers = getAuthHeaders();
    if (!headers) { handleLogout(); return; }

    try {
        const response = await fetch(LATE_SAVE_DATA_URL, { method: 'POST', headers: headers });
        if (!response.ok) throw new Error(`Data save failed`);
        syncLateDataBtn.textContent = 'Sync Successful!';
        syncLateDataBtn.classList.add('btn-success');
        renderConnectionStatus(); 
    } catch (error) {
        console.error(error);
        syncLateDataBtn.textContent = 'Save Failed';
        syncLateDataBtn.disabled = false;
    }
};


// Event Listeners (Aynı kalıyor)
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
//syncLateDataBtn.addEventListener('click', saveLateConnectionData);
showConnectPageBtn.addEventListener('click', showConnectPage);
backToPanelFromConnectBtn.addEventListener('click', hideConnectPage);
platformButtonsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.platform-connect-btn');
    if (btn) initiateLateConnection(btn.dataset.platform);
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
