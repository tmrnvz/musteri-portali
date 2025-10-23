/* assets/js/script.js - NIHAI TEŞHİS VE ÇÖZÜM KODU */

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

// API URLs
const LOGIN_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/auth/login';
const PRESIGNER_API_URL = 'https://presigner.synqbrand.com/generate-presigned-url';
const MAIN_POST_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/107e2a2a-7446-4ebb-9a28-0095ac50ae9b';
const R2_PUBLIC_BASE_URL = 'https://media.izmirarkadas.com';
const GET_PLATFORMS_URL = 'https://ops.synqbrand.com/webhook/e3b4673c-d346-4f09-a970-052526b6646e';
const GET_PENDING_POSTS_URL = 'https://ops.synqbrand.com/webhook/ac5496d2-7540-4db1-b7e1-a28c0e2320dc';
const PROCESS_APPROVAL_URL = 'https://ops.synqbrand.com/webhook/ef89b9df-469d-4329-9194-6805b12a6dc5';
const PUBLISH_APPROVED_POSTS_URL = 'https://ops.synqbrand.com/webhook/eb85bb8a-a1c4-4f0e-a50f-fc0c2afd64d0';

// ... (Bu kısımdaki diğer fonksiyonlar ve değişken tanımları aynı, o yüzden buraya eklemiyorum,
// sadece handlePostSubmit fonksiyonunu değiştiriyoruz. Lütfen geri kalan her şeyin aynı kaldığından emin ol)
// YUKARIDAKİ KISIMLAR DEĞİŞMEDİ...

// Element variables... (Bu kısım da değişmedi)
const loginSection = document.getElementById('login-section'); const customerPanel = document.getElementById('customer-panel'); const postFormSection = document.getElementById('post-form-section'); const loginForm = document.getElementById('login-form'); const loginBtn = document.getElementById('login-btn'); const statusDiv = document.getElementById('status'); const welcomeMessage = document.getElementById('welcome-message'); const showFormBtn = document.getElementById('show-form-btn'); const postForm = document.getElementById('post-form'); const submitPostBtn = document.getElementById('submit-post-btn'); const postStatusDiv = document.getElementById('post-status'); const backToPanelBtn = document.getElementById('back-to-panel-btn'); const logoutBtn = document.getElementById('logout-btn'); const approvalPortalSection = document.getElementById('approval-portal-section'); const showApprovalPortalBtn = document.getElementById('show-approval-portal-btn'); const backToPanelFromApprovalBtn = document.getElementById('back-to-panel-from-approval-btn'); const approvalGalleryContainer = document.getElementById('approval-gallery-container'); const approvalModal = document.getElementById('approval-modal'); const modalTitle = document.getElementById('modal-title'); const modalCloseBtn = document.getElementById('modal-close-btn'); const modalVisual = document.getElementById('modal-visual'); const modalPlatforms = document.getElementById('modal-platforms');
const modalSaveBtn = document.getElementById('modal-save-btn'); const modalCancelBtn = document.getElementById('modal-cancel-btn'); const modalStatus = document.getElementById('modal-status');
const publishApprovedBtn = document.getElementById('publish-approved-btn'); const publishStatus = document.getElementById('publish-status');
const bulkActionsContainer = document.getElementById('bulk-actions-container'); const bulkSelectAll = document.getElementById('bulk-select-all'); const bulkApproveBtn = document.getElementById('bulk-approve-btn');

const ICON_APPROVE = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ICON_REJECT = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

const getAuthHeaders = () => { const token = localStorage.getItem('jwtToken'); if (!token) return null; return { 'Authorization': `Bearer ${token}` }; };
const setStatus = (element, message, type = 'info') => { element.className = type; element.innerHTML = message; };
const handleLogout = () => { localStorage.removeItem('jwtToken'); localStorage.removeItem('username'); location.reload(); };

const showApprovalPortal = () => { customerPanel.style.display = 'none'; approvalPortalSection.style.display = 'block'; publishApprovedBtn.disabled = true; publishStatus.innerHTML = ''; loadAndRenderApprovalGallery(); };
const showCustomerPanel = () => { approvalPortalSection.style.display = 'none'; postFormSection.style.display = 'none'; customerPanel.style.display = 'block'; };

const loadAndRenderApprovalGallery = async () => { /* ... Değişmedi ... */ };
const renderGallery = (posts) => { /* ... Değişmedi ... */ };
const updateBulkActionsState = () => { /* ... Değişmedi ... */ };
const handleBulkApprove = async () => { /* ... Değişmedi ... */ };
const handleSaveChanges = async () => { /* ... Değişmedi ... */ };
const checkAllDecisionsMade = (postId) => { /* ... Değişmedi ... */ };
const openApprovalModal = (postId) => { /* ... Değişmedi ... */ };
const closeApprovalModal = () => { /* ... Değişmedi ... */ };
const handlePublishApproved = async () => { /* ... Değişmedi ... */ };

const uppy = new Uppy({ debug:false, autoProceed:false, restrictions:{ maxFileSize:100*1024*1024, allowedFileTypes:['image/*','video/*'], minNumberOfFiles:1 } }); uppy.use(Dashboard, { inline:true, target:'#uppy-drag-drop-area', proudlyDisplayPoweredByUppy:false, theme:'light', height:300, hideUploadButton:true }); uppy.use(AwsS3, { getUploadParameters: async (file) => { const response = await fetch(PRESIGNER_API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fileName:file.name, contentType:file.type}) }); const presignData = await response.json(); return { method:'PUT', url:presignData.uploadUrl, fields:{}, headers:{'Content-Type':file.type} }; } });
const handleLogin = async (event) => { /* ... Değişmedi ... */ };
const initializeUserPanel = async (userData) => { /* ... Değişmedi ... */ };
const showPanel = (userData) => { /* ... Değişmedi ... */ };

// =========================================================================
// === SADECE BU FONKSIYON GÜNCELLENDİ, DAHA DETAYLI HATA AYIKLAMA ILE ===
// =========================================================================
const handlePostSubmit = async (event) => {
    event.preventDefault();
    const authHeaders = getAuthHeaders();
    if (!authHeaders) { handleLogout(); return; }
    const files = uppy.getFiles();
    if (files.length === 0) {
        postStatusDiv.innerHTML = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>Please select at least one media file.</p></div>`;
        return;
    }
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value);
    if (selectedPlatforms.length === 0) {
        postStatusDiv.innerHTML = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>Please select at least one platform to post to.</p></div>`;
        return;
    }
    
    const messages = ["Processing...", "Uploading media files...", "AI is generating content...", "Finalizing..."];
    let messageIndex = 0;
    postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing...</h4><p>${messages[messageIndex]}</p></div>`;
    if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);
    state.loadingIntervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing...</h4><p>${messages[messageIndex]}</p></div>`;
    }, 4000);
    
    submitPostBtn.disabled = true;
    backToPanelBtn.disabled = true;

    try {
        const result = await uppy.upload();
        if (result.failed.length > 0) throw new Error(`Failed to upload: ${result.failed.map(f => f.name).join(', ')}`);
        
        const uploadedFileKeys = result.successful.map(file => new URL(file.uploadURL).pathname.substring(1));
        
        const postData = {
            postTitle: document.getElementById('postTitle').value,
            postContent: document.getElementById('postContent').value,
            destinationLink: document.getElementById('destinationLink').value,
            fileKeys: uploadedFileKeys,
            fileUrls: uploadedFileKeys.map(key => `${R2_PUBLIC_BASE_URL}/${key}`),
            submissionID: crypto.randomUUID(),
            selectedPlatforms: selectedPlatforms
        };
        
        const response = await fetch(MAIN_POST_WORKFLOW_URL, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        // === YENİ TEŞHİS ADIMLARI ===
        console.log("Adım 1: Ham response objesi alındı.", response);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned an error: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log("Adım 2: Response ham metin olarak okundu:", responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log("Adım 3: Metin başarıyla JSON olarak ayrıştırıldı (parse edildi):", responseData);
        } catch (parseError) {
            console.error("KRİTİK HATA: Sunucudan gelen cevap JSON formatında değil!", parseError);
            throw new Error("Sunucudan geçersiz bir formatta cevap alındı. Lütfen konsolu kontrol edin.");
        }
        
        const newPostId = responseData && responseData[0] ? responseData[0].Id : undefined;
        console.log("Adım 4: ID değeri çekildi. Sonuç:", newPostId);
        // === TEŞHİS ADIMLARI SONU ===
        
        if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);

        const successHtml = `<div class="status-block status-success">
                               <h4>Content is Ready for Approval!</h4>
                               <p>Your post has been processed and is waiting for your review. New Post ID: <strong>${newPostId || 'N/A'}</strong></p>
                             </div>`;
        postStatusDiv.innerHTML = successHtml;
        submitPostBtn.style.display = 'none';
        backToPanelBtn.textContent = 'Create Another Post';
        backToPanelBtn.disabled = false;

    } catch (error) {
        if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);
        const errorHtml = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>${error.message}</p></div>`;
        postStatusDiv.innerHTML = errorHtml;
        submitPostBtn.disabled = false;
        backToPanelBtn.disabled = false;
    }
};

// ... (Geri kalan tüm fonksiyonlar değişmedi)
const resetPostForm = () => { /* ... Değişmedi ... */ };
const fetchAndRenderPlatforms = async () => { /* ... Değişmedi ... */ };
const setupSelectAllLogic = () => { /* ... Değişmedi ... */ };

// Event Listeners (Değişmedi)
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
bulkSelectAll.addEventListener('change', () => { /* ... Değişmedi ... */ });
bulkApproveBtn.addEventListener('click', handleBulkApprove);

window.addEventListener('DOMContentLoaded', () => { const token = localStorage.getItem('jwtToken'); const username = localStorage.getItem('username'); if (token && username) { initializeUserPanel({ username: username }); } });
