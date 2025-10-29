/* assets/js/script.js - FINAL & COMPLETE VERSION (With Functional Approval Button) */

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

// API URLs
const LOGIN_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/auth/login';
const PRESIGNER_API_URL = 'https://presigner.synqbrand.com/generate-presigned-url';
const MAIN_POST_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/ee3b3bd2-ae44-47ae-812d-c97a41a62731'; 
const APPROVE_MANUAL_POST_URL = 'https://ops.synqbrand.com/webhook/8596e58f-177e-4396-909a-cd4de4d5373c'; // GÜNCELLENDİ
const R2_PUBLIC_BASE_URL = 'https://media.izmirarkadas.com';
const GET_PLATFORMS_URL = 'https://ops.synqbrand.com/webhook/e3b4673c-d346-4f09-a970-052526b6646e';
const GET_PENDING_POSTS_URL = 'https://ops.synqbrand.com/webhook/ac5496d2-7540-4db1-b7e1-a28c0e2320dc';
const PROCESS_APPROVAL_URL = 'https://ops.synqbrand.com/webhook/ef89b9df-469d-4329-9194-6805b12a6dc5';
const PUBLISH_APPROVED_POSTS_URL = 'https://ops.synqbrand.com/webhook/eb85bb8a-a1c4-4f0e-a50f-fc0c2afd64d0';
const GET_MANUAL_POST_BY_ID_URL = 'https://ops.synqbrand.com/webhook/e1b260ea-2f4f-4620-8098-c5e9d369258b/e1b260ea-2f4f-4620-8098-c5e9d369258b/';

let state = { loadingIntervalId: null, pendingPosts: [], modalDecisions: [], selectedPosts: [] };

// Element variables
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

const loadAndRenderApprovalGallery = async () => {
    approvalGalleryContainer.innerHTML = `<p class="loading-text">Loading content...</p>`;
    bulkActionsContainer.style.display = 'none';
    const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; }
    try {
        const response = await fetch(GET_PENDING_POSTS_URL, { headers });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        const data = await response.json();
        renderGallery(data.posts);
    } catch (error) { console.error('Failed to load pending posts:', error); approvalGalleryContainer.innerHTML = `<p class="error loading-text">${error.message}</p>`; }
};

const renderGallery = (posts) => {
    approvalGalleryContainer.innerHTML = '';
    
    const currentDecidedIds = state.pendingPosts.filter(p => p.isDecided).map(p => p.postId);
    posts.forEach(p => {
        if (currentDecidedIds.includes(p.postId)) {
            p.isDecided = true;
        }
    });

    state.pendingPosts = posts;
    state.selectedPosts = [];

    if (!posts || posts.length === 0) {
        approvalGalleryContainer.innerHTML = `<p class="empty-text">There is no content awaiting your approval. Great job!</p>`;
        publishApprovedBtn.style.display = 'none';
        bulkActionsContainer.style.display = 'none';
        return;
    }

    const actionablePosts = posts.filter(post => !post.isDecided);
    if (actionablePosts.length > 0) {
        bulkActionsContainer.style.display = 'block';
        updateBulkActionsState();
    } else {
        bulkActionsContainer.style.display = 'none';
    }

    publishApprovedBtn.style.display = 'block';

    posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'post-list-item';
        item.dataset.postId = post.postId;

        if (post.isDecided) {
            item.classList.add('is-decided');
        }

        let badge = post.isDecided ? `<div class="post-list-item-status-badge">Ready for Publish</div>` : '';

        item.innerHTML = `
            ${!post.isDecided ?
            `<div class="checkbox-wrapper">
                <input type="checkbox" id="select-post-${post.postId}" data-post-id="${post.postId}" class="bulk-select-checkbox">
                <label for="select-post-${post.postId}" class="checkbox-label"><span class="checkbox-custom"></span></label>
            </div>` : '<div style="width: 34px;"></div>'}
            <div class="post-list-item-main">
                <img src="${post.mainVisualUrl}" alt="Visual for ${post.ideaText.substring(0, 30)}" class="post-list-item-visual">
                <div class="post-list-item-content">
                    ${badge}
                    <p class="post-list-item-label">POST TOPIC:</p>
                    <h4 class="post-list-item-title">${post.ideaText}</h4>
                </div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.closest('.checkbox-wrapper')) return;
            openApprovalModal(post.postId);
        });

        approvalGalleryContainer.appendChild(item);
    });

    approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const postId = parseInt(e.target.dataset.postId);
            if (e.target.checked) {
                if (!state.selectedPosts.includes(postId)) state.selectedPosts.push(postId);
            } else {
                state.selectedPosts = state.selectedPosts.filter(id => id !== postId);
            }
            updateBulkActionsState();
        });
    });
};

const updateBulkActionsState = () => {
    const actionableCheckboxes = approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox');
    if (state.selectedPosts.length > 0) {
        bulkApproveBtn.disabled = false;
        bulkApproveBtn.textContent = `Approve Selected (${state.selectedPosts.length})`;
    } else {
        bulkApproveBtn.disabled = true;
        bulkApproveBtn.textContent = 'Approve Selected';
    }
    bulkSelectAll.checked = actionableCheckboxes.length > 0 && state.selectedPosts.length === actionableCheckboxes.length;
};

const handleBulkApprove = async () => {
    const decisions = [];
    state.selectedPosts.forEach(postId => {
        const post = state.pendingPosts.find(p => p.postId === postId);
        if (post && post.platformDetails) {
            post.platformDetails.forEach(platform => {
                decisions.push({ postId: postId, platform: platform.platform, decision: 'approved' });
            });
        }
    });
    if (decisions.length === 0) return;

    bulkApproveBtn.disabled = true;
    bulkApproveBtn.textContent = 'Approving...';
    const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; }

    try {
        const response = await fetch(PROCESS_APPROVAL_URL, {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ decisions })
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save changes.'); }

        state.selectedPosts.forEach(postId => {
            const postInState = state.pendingPosts.find(p => p.postId === postId);
            if (postInState) postInState.isDecided = true;
        });

        renderGallery(state.pendingPosts);
        publishApprovedBtn.disabled = false;

    } catch (error) {
        console.error('Bulk approve error:', error);
        setStatus(publishStatus, `Error: ${error.message}`, 'error');
        bulkApproveBtn.disabled = false;
        updateBulkActionsState();
    }
};

const handleSaveChanges = async () => {
    const currentPostId = state.modalDecisions.length > 0 ? state.modalDecisions[0].postId : null;
    if (state.modalDecisions.length === 0) { closeApprovalModal(); return; }

    modalStatus.textContent = 'Saving...';
    modalStatus.className = 'modal-status-text';
    modalSaveBtn.disabled = true;
    modalCancelBtn.disabled = true;
    const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; }

    try {
        const response = await fetch(PROCESS_APPROVAL_URL, {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ decisions: state.modalDecisions })
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save changes.'); }

        modalStatus.textContent = 'Saved!';
        modalStatus.className = 'modal-status-text success';

        setTimeout(() => {
            closeApprovalModal();
            if (currentPostId) {
                const postInState = state.pendingPosts.find(p => p.postId === currentPostId);
                if (postInState) postInState.isDecided = true;
                renderGallery(state.pendingPosts);
            } else {
                loadAndRenderApprovalGallery();
            }
            publishApprovedBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Save changes error:', error);
        modalStatus.textContent = `Error: ${error.message}`;
        modalStatus.className = 'modal-status-text error';
        modalSaveBtn.disabled = false;
        modalCancelBtn.disabled = false;
    }
};

const checkAllDecisionsMade = (postId) => { const post = state.pendingPosts.find(p => p.postId === postId); if (!post) return; const totalPlatforms = post.platformDetails.length; const decidedPlatformsCount = state.modalDecisions.filter(d => d.postId === postId).length; if (totalPlatforms === decidedPlatformsCount) { modalSaveBtn.disabled = false; modalStatus.textContent = 'All decisions are made. Ready to save.'; modalStatus.className = 'modal-status-text success'; } else { modalSaveBtn.disabled = true; const remaining = totalPlatforms - decidedPlatformsCount; modalStatus.textContent = `${remaining} platform(s) still require a decision.`; modalStatus.className = 'modal-status-text'; } };
const openApprovalModal = (postId) => { const post = state.pendingPosts.find(p => p.postId === postId); if (!post) { console.error("Post not found!"); return; } state.modalDecisions = []; modalSaveBtn.disabled = true; modalCancelBtn.disabled = false; modalTitle.textContent = post.ideaText; modalVisual.src = post.mainVisualUrl; modalPlatforms.innerHTML = ''; post.platformDetails.forEach((platform, index) => { const item = document.createElement('div'); item.className = 'accordion-item'; if (index === 0) item.classList.add('active'); const isApproved = platform.status === 'Approved'; const isRejected = platform.status === 'Canceled'; const isDecided = isApproved || isRejected; item.innerHTML = `<div class="accordion-header"><span>${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</span></div><div class="accordion-content"><div class="content-section"><h5>Caption</h5><div class="content-text">${platform.caption}</div></div>${platform.hashtags ? `<div class="content-section"><h5>Hashtags</h5><div class="content-hashtags">${platform.hashtags}</div></div>` : ''}<div class="approval-buttons"><button class="btn-decision btn-reject ${isRejected ? 'rejected' : ''}" data-post-id="${postId}" data-platform="${platform.platform}" data-decision="canceled" ${isDecided ? '' : ''}>${ICON_REJECT} Reject</button><button class="btn-decision btn-approve ${isApproved ? 'approved' : ''}" data-post-id="${postId}" data-platform="${platform.platform}" data-decision="approved" ${isDecided ? '' : ''}>${ICON_APPROVE} Approve</button></div></div>`; modalPlatforms.appendChild(item); if (isDecided) { state.modalDecisions.push({ postId: postId, platform: platform.platform, decision: platform.status === 'Approved' ? 'approved' : 'canceled' }); } }); checkAllDecisionsMade(postId); modalPlatforms.querySelectorAll('.accordion-header').forEach(header => { header.addEventListener('click', () => { const activeItem = modalPlatforms.querySelector('.accordion-item.active'); const clickedItem = header.parentElement; if (activeItem && activeItem !== clickedItem) activeItem.classList.remove('active'); clickedItem.classList.toggle('active'); }); }); modalPlatforms.querySelectorAll('.btn-decision').forEach(button => { button.addEventListener('click', (e) => { const targetButton = e.currentTarget; const { postId, platform, decision } = targetButton.dataset; const parent = targetButton.parentElement; parent.querySelectorAll('.btn-decision').forEach(btn => btn.classList.remove('approved', 'rejected')); targetButton.classList.add(decision === 'approved' ? 'approved' : 'rejected'); const decisionData = { postId: parseInt(postId), platform, decision }; state.modalDecisions = state.modalDecisions.filter(d => !(d.postId === parseInt(postId) && d.platform === platform)); state.modalDecisions.push(decisionData); checkAllDecisionsMade(parseInt(postId)); }); }); approvalModal.classList.add('active'); };
const closeApprovalModal = () => { approvalModal.classList.remove('active'); };
const handlePublishApproved = async () => { publishStatus.innerHTML = `<div class="status-loading"><div class="spinner"></div><p>Publishing process initiated... This may take a moment.</p></div>`; publishApprovedBtn.disabled = true; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(PUBLISH_APPROVED_POSTS_URL, { method: 'POST', headers: headers }); const resultText = await response.text(); if (!response.ok) { try { const errorJson = JSON.parse(resultText); throw new Error(errorJson.message || 'An unknown error occurred.'); } catch(e) { throw new Error(resultText || `Request failed with status ${response.status}`); } } const result = JSON.parse(resultText); setStatus(publishStatus, result.message || 'Success!', 'success'); setTimeout(() => { publishStatus.innerHTML = ''; loadAndRenderApprovalGallery(); }, 4000); } catch (error) { console.error('Publishing error:', error); setStatus(publishStatus, error.message, 'error'); publishApprovedBtn.disabled = false; } };

const uppy = new Uppy({ debug:false, autoProceed:false, restrictions:{ maxFileSize:100*1024*1024, allowedFileTypes:['image/*','video/*'], minNumberOfFiles:1 } }); uppy.use(Dashboard, { inline:true, target:'#uppy-drag-drop-area', proudlyDisplayPoweredByUppy:false, theme:'light', height:300, hideUploadButton:true, allowMultipleUploadBatches:false }); uppy.use(AwsS3, { getUploadParameters: async (file) => { const response = await fetch(PRESIGNER_API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fileName:file.name, contentType:file.type}) }); const presignData = await response.json(); return { method:'PUT', url:presignData.uploadUrl, fields:{}, headers:{'Content-Type':file.type} }; } });

const handleLogin = async (event) => { event.preventDefault(); const username = document.getElementById("username").value; const password = document.getElementById("password").value; setStatus(statusDiv, "Logging in..."); loginBtn.disabled = true; try { const response = await fetch(LOGIN_WORKFLOW_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Login failed with status: ${response.status}`); } const data = await response.json(); localStorage.setItem('jwtToken', data.token); localStorage.setItem('username', data.username); await initializeUserPanel({ username: data.username }); } catch (error) { setStatus(statusDiv, error.message, "error"); } finally { loginBtn.disabled = false; } };

const initializeUserPanel = async (userData) => { if (!userData || !userData.username) { handleLogout(); return; } await fetchAndRenderPlatforms(); setStatus(statusDiv, "", "success"); showPanel(userData); };
const showPanel = (userData) => { loginSection.style.display = "none"; welcomeMessage.textContent = `Welcome, ${userData.username}!`; customerPanel.style.display = "block"; };

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
    postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing... Please wait a moment. A window will open shortly for you to review and approve your posts. </h4><p>${messages[messageIndex]}</p></div>`;
    if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);
    state.loadingIntervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        postStatusDiv.innerHTML = `<div class="status-block status-success"><h4>Processing... Please wait a moment. A window will open shortly for you to review and approve your posts.</h4><p>${messages[messageIndex]}</p></div>`;
    }, 4000);
    
    submitPostBtn.disabled = true;
    backToPanelBtn.disabled = true;

    try {
        const result = await uppy.upload();
        if (result.failed.length > 0) throw new Error(`Failed to upload: ${result.failed.map(f => f.name).join(', ')}`);
        
        const sortedFiles = uppy.getFiles();
        
        const sortedFileKeys = sortedFiles.map(file => {
             const successfulUpload = result.successful.find(s => s.id === file.id);
             return successfulUpload ? new URL(successfulUpload.uploadURL).pathname.substring(1) : null;
        }).filter(key => key !== null);

        const sortedFileUrls = sortedFileKeys.map(key => `${R2_PUBLIC_BASE_URL}/${key}`);
        
        const postData = {
            postTitle: document.getElementById('postTitle').value,
            postContent: document.getElementById('postContent').value,
            destinationLink: document.getElementById('destinationLink').value,
            fileKeys: sortedFileKeys,
            fileUrls: sortedFileUrls,
            submissionID: crypto.randomUUID(),
            selectedPlatforms: selectedPlatforms
        };
        
        const response = await fetch(MAIN_POST_WORKFLOW_URL, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned an error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        const newPostId = responseData.Id;
        
        if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);

        queueMicrotask(() => displayReviewInterface(newPostId));

    } catch (error) {
        if (state.loadingIntervalId) clearInterval(state.loadingIntervalId);
        const errorHtml = `<div class="status-block status-error"><h4>SUBMISSION FAILED!</h4><p>${error.message}</p></div>`;
        postStatusDiv.innerHTML = errorHtml;
        submitPostBtn.disabled = false;
        backToPanelBtn.disabled = false;
    }
};

const handleApproveAndPublish = async (postId) => {
    const approveBtn = document.getElementById('approve-and-publish-btn');
    const discardBtn = document.getElementById('discard-and-restart-btn');
    const reviewContainer = document.getElementById('manual-post-review-container');

    if (!approveBtn || !reviewContainer) return;

    approveBtn.disabled = true;
    if(discardBtn) discardBtn.disabled = true;
    approveBtn.innerHTML = '<div class="spinner-tiny"></div>Approving & Publishing...';
    
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
        handleLogout();
        return;
    }

    try {
        const response = await fetch(APPROVE_MANUAL_POST_URL, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: postId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Approval failed with status: ${response.status}`);
        }

        reviewContainer.innerHTML = `
            <div class="status-block status-success">
                <h4>SUCCESS!</h4>
                <p>Post #${postId} has been approved and sent to the publishing queue.</p>
                <p>Redirecting you to the main panel...</p>
            </div>`;
        
        setTimeout(() => {
            resetPostForm();
            showCustomerPanel();
        }, 2500);

    } catch (error) {
        console.error('Error approving post:', error);
        const errorHtml = `<div class="status-block status-error"><h4>APPROVAL FAILED!</h4><p>${error.message}</p></div>`;
        const footer = reviewContainer.querySelector('.review-footer-buttons');
        if (footer) {
             const existingError = reviewContainer.querySelector('.status-error');
             if (existingError) existingError.remove();
             footer.insertAdjacentHTML('beforebegin', errorHtml);
        }
        approveBtn.disabled = false;
        if(discardBtn) discardBtn.disabled = false;
        approveBtn.textContent = 'Looks Good, Publish It!';
    }
};

const displayReviewInterface = async (postId) => {
    postForm.style.display = 'none';
    postStatusDiv.innerHTML = `<p class="loading-text">Loading review interface for Post #${postId}...</p>`;

    const authHeaders = getAuthHeaders();
    try {
        let response = await fetch(`${GET_MANUAL_POST_BY_ID_URL}${postId}`, { method: 'GET', mode: 'cors', credentials: 'omit' });
        if (!response.ok) {
            console.warn(`Anonymous GET returned ${response.status}. Trying with auth header...`);
            if (authHeaders) {
                response = await fetch(`${GET_MANUAL_POST_BY_ID_URL}${postId}`, { method: 'GET', mode: 'cors', credentials: 'omit', headers: { ...authHeaders } });
            }
        }
        if (!response.ok) { throw new Error(`Failed to fetch post details. Server returned ${response.status}`); }

        const postData = await response.json();
        
        const platformDetailsArray = JSON.parse(postData.PlatformDetails);
        const postTitle = postData.PostIdeaTitle;
        const allMediaFilesArray = postData.AllMediaFiles ? JSON.parse(postData.AllMediaFiles) : [];

        let thumbnailsHtml = '';
        if (allMediaFilesArray.length > 0) {
            thumbnailsHtml += '<h4 class="review-section-title">Uploaded Media</h4><div class="thumbnails-container">';
            allMediaFilesArray.forEach(mediaFile => {
                const isMainVisual = mediaFile.url === postData.MainVisualUrl;
                const isVideo = /\.(mp4|mov|avi|webm)$/i.test(mediaFile.fileName);

                thumbnailsHtml += `<div class="thumbnail-item ${isMainVisual ? 'is-main' : ''}" title="${mediaFile.fileName}">`;
                if (isVideo) {
                    thumbnailsHtml += `
                        <div class="video-placeholder">
                            <svg width="24" height="24"><use xlink:href="#video-icon"></use></svg>
                        </div>
                    `;
                } else {
                    thumbnailsHtml += `<img src="${mediaFile.url}" alt="${mediaFile.fileName}">`;
                }
                thumbnailsHtml += `</div>`;
            });
            thumbnailsHtml += '</div>';
        }

        let platformsHtml = '';
        if (platformDetailsArray && platformDetailsArray.length > 0) {
            platformsHtml += '<h4 class="review-section-title">Generated Content</h4>';
            platformDetailsArray.forEach((platform, index) => {
                platformsHtml += `
                    <div class="accordion-item ${index === 0 ? 'active' : ''}">
                        <div class="accordion-header"><span>${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</span></div>
                        <div class="accordion-content">
                            <div class="content-section">
                                <h5>Caption</h5>
                                <div class="content-text">${platform.caption.replace(/\\n/g, '<br>')}</div>
                            </div>
                            ${platform.hashtags ? `
                            <div class="content-section">
                                <h5>Hashtags</h5>
                                <div class="content-hashtags">${platform.hashtags}</div>
                            </div>` : ''}
                        </div>
                    </div>`;
            });
        }

        const reviewHtml = `
            <div id="manual-post-review-container">
                <h3 class="modal-title">${postTitle}</h3>
                ${thumbnailsHtml}
                <div class="modal-text-content" style="padding: 1.5rem 0 2rem 0;">
                    <div id="review-platforms">${platformsHtml}</div>
                </div>
                <div class="review-footer-buttons">
                    <button id="approve-and-publish-btn" class="btn-primary">Looks Good, Publish It!</button>
                    <button id="discard-and-restart-btn" class="btn-secondary">Make Changes & Re-generate</button>
                </div>
            </div>`;
        
        postStatusDiv.innerHTML = reviewHtml;
        setupReviewAccordionListeners();

        document.getElementById('approve-and-publish-btn').addEventListener('click', () => handleApproveAndPublish(postId));
        
        document.getElementById('discard-and-restart-btn').addEventListener('click', () => {
            resetPostForm();
            postForm.style.display = 'block';
        });

    } catch (error) {
        console.error("Error displaying review interface:", error);
        postStatusDiv.innerHTML = `<div class="status-block status-error"><h4>Error</h4><p>${error.message}</p></div>`;
    }
};

const setupReviewAccordionListeners = () => {
    const container = document.getElementById('review-platforms');
    if (!container) return;

    container.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const activeItem = container.querySelector('.accordion-item.active');
            const clickedItem = header.parentElement;
            if (activeItem && activeItem !== clickedItem) {
                activeItem.classList.remove('active');
            }
            clickedItem.classList.toggle('active');
        });
    });
};

const resetPostForm = () => { 
    if (state.loadingIntervalId) { clearInterval(state.loadingIntervalId); state.loadingIntervalId = null; } 
    const reviewContainer = document.getElementById('manual-post-review-container');
    if (reviewContainer) {
        reviewContainer.remove();
    }
    
    postForm.style.display = 'block';
    postForm.reset(); 
    uppy.getFiles().forEach(file => uppy.removeFile(file.id)); 
    postStatusDiv.innerHTML = ''; 
    submitPostBtn.style.display = 'block'; 
    submitPostBtn.disabled = false; 
    backToPanelBtn.textContent = 'Back to Panel'; 
    backToPanelBtn.disabled = false; 
};

const fetchAndRenderPlatforms = async () => { const container = document.getElementById('platform-selection-container'); const selectAllCheckbox = document.getElementById('select-all-platforms'); container.innerHTML = '<p><em>Loading available platforms...</em></p>'; const headers = getAuthHeaders(); if (!headers) { handleLogout(); return; } try { const response = await fetch(GET_PLATFORMS_URL, { headers }); if (!response.ok) throw new Error(`Could not fetch platforms (status ${response.status}).`); const data = await response.json(); let platforms = data.platforms || []; if (!platforms.length) { container.innerHTML = '<p class="error">No platforms configured for this account.</p>'; selectAllCheckbox.disabled = true; return; } container.innerHTML = ''; platforms.forEach(platform => { const id = `platform-${platform}`; const wrapper = document.createElement('div'); wrapper.className = 'checkbox-wrapper'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = id; checkbox.name = 'platforms'; checkbox.value = platform; checkbox.checked = true; const label = document.createElement('label'); label.htmlFor = id; label.className = 'checkbox-label'; label.innerHTML = `<span class="checkbox-custom"></span><span class="checkbox-label-text">${platform}</span>`; wrapper.appendChild(checkbox); wrapper.appendChild(label); container.appendChild(wrapper); }); selectAllCheckbox.disabled = false; setupSelectAllLogic(); } catch (error) { console.error('Platform fetch error:', error); container.innerHTML = `<p class="error">${error.message || 'Failed to load platforms.'}</p>`; } };
const setupSelectAllLogic = () => { const selectAllCheckbox = document.getElementById('select-all-platforms'); const platformCheckboxes = document.querySelectorAll('input[name="platforms"]'); const syncSelectAllState = () => { const allChecked = Array.from(platformCheckboxes).every(cb => cb.checked); selectAllCheckbox.checked = allChecked; }; selectAllCheckbox.addEventListener('change', () => { platformCheckboxes.forEach(cb => { cb.checked = selectAllCheckbox.checked; }); }); platformCheckboxes.forEach(cb => { cb.addEventListener('change', syncSelectAllState); }); syncSelectAllState(); };

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
bulkSelectAll.addEventListener('change', () => {
    const isChecked = bulkSelectAll.checked;
    const actionableCheckboxes = approvalGalleryContainer.querySelectorAll('.bulk-select-checkbox');
    actionableCheckboxes.forEach(cb => {
        cb.checked = isChecked;
        const postId = parseInt(cb.dataset.postId);
        const isAlreadySelected = state.selectedPosts.includes(postId);
        if (isChecked && !isAlreadySelected) {
            state.selectedPosts.push(postId);
        } else if (!isChecked && isAlreadySelected) {
            state.selectedPosts = state.selectedPosts.filter(id => id !== postId);
        }
    });
    updateBulkActionsState();
});
bulkApproveBtn.addEventListener('click', handleBulkApprove);

window.addEventListener('DOMContentLoaded', () => { const token = localStorage.getItem('jwtToken'); const username = localStorage.getItem('username'); if (token && username) { initializeUserPanel({ username: username }); } });
