/* assets/js/script.js - FINAL WORKING VERSION with Inline Editing */

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

// FAZ 2 URLs
const GET_BUSINESS_PROFILE_URL = 'https://ops.synqbrand.com/webhook/0dff236e-f2c4-40db-ad88-0fc59f3f779d';
const UPDATE_PROFILE_WORKFLOW_URL = 'https://ops.synqbrand.com/webhook/1f7ae02d-59b4-4eaf-95b8-712c1e47bfbe';

let state = { loadingIntervalId: null, pendingPosts: [], modalDecisions: [], selectedPosts: [] };
let currentProfile = {};

// Element Değişkenleri
const loginSection = document.getElementById('login-section'); const customerPanel = document.getElementById('customer-panel'); const postFormSection = document.getElementById('post-form-section'); const loginForm = document.getElementById('login-form'); const loginBtn = document.getElementById('login-btn'); const statusDiv = document.getElementById('status'); const welcomeMessage = document.getElementById('welcome-message'); const showFormBtn = document.getElementById('show-form-btn'); const postForm = document.getElementById('post-form'); const submitPostBtn = document.getElementById('submit-post-btn'); const postStatusDiv = document.getElementById('post-status'); const backToPanelBtn = document.getElementById('back-to-panel-btn'); const logoutBtn = document.getElementById('logout-btn'); const approvalPortalSection = document.getElementById('approval-portal-section'); const showApprovalPortalBtn = document.getElementById('show-approval-portal-btn'); const backToPanelFromApprovalBtn = document.getElementById('back-to-panel-from-approval-btn'); const approvalGalleryContainer = document.getElementById('approval-gallery-container'); const approvalModal = document.getElementById('approval-modal'); const modalTitle = document.getElementById('modal-title'); const modalCloseBtn = document.getElementById('modal-close-btn'); const modalVisual = document.getElementById('modal-visual'); const modalPlatforms = document.getElementById('modal-platforms'); const modalSaveBtn = document.getElementById('modal-save-btn'); const modalCancelBtn = document.getElementById('modal-cancel-btn'); const modalStatus = document.getElementById('modal-status'); const publishApprovedBtn = document.getElementById('publish-approved-btn'); const publishStatus = document.getElementById('publish-status'); const bulkActionsContainer = document.getElementById('bulk-actions-container'); const bulkSelectAll = document.getElementById('bulk-select-all'); const bulkApproveBtn = document.getElementById('bulk-approve-btn'); const onboardingSection = document.getElementById('onboarding-section'); const pendingActivationSection = document.getElementById('pending-activation-section'); const formContainer = document.getElementById('form-container'); const onboardingLogoutBtn = document.getElementById('onboarding-logout-btn'); const pendingLogoutBtn = document.getElementById('pending-logout-btn');
const editProfileBtn = document.getElementById('edit-profile-btn'); const editProfileSection = document.getElementById('edit-profile-section'); const profileViewContainer = document.getElementById('profile-view-container'); const saveAllChangesBtn = document.getElementById('save-all-changes-btn'); const profileStatusDiv = document.getElementById('profile-status'); const backToPanelFromEditBtn = document.getElementById('back-to-panel-from-edit-btn');

// Yardımcı Fonksiyonlar
const getAuthHeaders = () => { const token = localStorage.getItem('jwtToken'); if (!token) return null; return { 'Authorization': `Bearer ${token}` }; };
const setStatus = (element, message, type = 'info') => { if(element) { element.className = `status-${type}`; element.innerHTML = message; }};
const handleLogout = () => { localStorage.removeItem('jwtToken'); localStorage.removeItem('username'); location.reload(); };
const parseJwt = (token) => { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { console.error("Invalid JWT token:", e); return null; } };
function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

// Uppy.js Kurulumu
const uppyDashboardEl = document.getElementById('uppy-drag-drop-area');
if (uppyDashboardEl) {
    const uppy = new Uppy({ debug: false, autoProceed: false, restrictions: { maxFileSize: 100 * 1024 * 1024, allowedFileTypes: ['image/*', 'video/*'], minNumberOfFiles: 1 } });
    uppy.use(Dashboard, { inline: true, target: uppyDashboardEl, proudlyDisplayPoweredByUppy: false, theme: 'light', height: 300, hideUploadButton: true, allowMultipleUploadBatches: false });
    uppy.use(AwsS3, { getUploadParameters: async (file) => { const response = await fetch(PRESIGNER_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) }); const presignData = await response.json(); return { method: 'PUT', url: presignData.uploadUrl, fields: {}, headers: { 'Content-Type': file.type } }; } });
}

// --- ÇEKİRDEK UYGULAMA FONKSİYONLARI ---

const handleLogin = async (event) => { event.preventDefault(); setStatus(statusDiv, "Logging in...", 'info'); loginBtn.disabled = true; try { const response = await fetch(LOGIN_WORKFLOW_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: document.getElementById("username").value, password: document.getElementById("password").value }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Login failed`); } const data = await response.json(); localStorage.setItem('jwtToken', data.token); const decodedToken = parseJwt(data.token); if (decodedToken && decodedToken.role) { localStorage.setItem('username', decodedToken.username); await routeUserByRole(decodedToken.role, decodedToken.username); } else { throw new Error('Invalid token received.'); } } catch (error) { setStatus(statusDiv, error.message, "error"); } finally { loginBtn.disabled = false; } };
const routeUserByRole = async (role, username) => { [loginSection, customerPanel, onboardingSection, pendingActivationSection, postFormSection, approvalPortalSection, editProfileSection].forEach(s => { if(s) s.style.display = 'none' }); if (role === 'customer') { welcomeMessage.textContent = `Welcome, ${username}!`; customerPanel.style.display = 'block'; } else if (role === 'pending' || role === 'new_member') { await loadAndInjectOnboardingForm(); onboardingSection.style.display = 'block'; } else if (role === 'pending_activation') { pendingActivationSection.style.display = 'block'; } else { handleLogout(); } };
const loadAndInjectOnboardingForm = async () => { if (formContainer.innerHTML.trim() !== "") return; try { const response = await fetch('onboarding-form.html'); if (!response.ok) throw new Error('Could not load the onboarding form.'); formContainer.innerHTML = await response.text(); const onboardingForm = formContainer.querySelector('#onboarding-form'); if (onboardingForm) { onboardingForm.addEventListener('submit', handleOnboardingSubmit); } } catch (error) { formContainer.innerHTML = `<p class="error">${error.message}</p>`; } };
const handleOnboardingSubmit = async (event) => { /* Mevcut onboarding kodunuz burada */ };

// =========================================================================
// FAZ 2: INLINE PROFILE EDITING MİMARİSİ (DÜZELTİLMİŞ)
// =========================================================================

const fieldSchema = {
    BrandName: { label: 'Brand Name', type: 'text' },
    PrimaryLink: { label: 'Main Website URL', type: 'url' },
    OfferingsDescription: { label: 'Offerings Description', type: 'textarea' },
    TargetLanguage: { label: 'Target Language', type: 'text' },
    NotificationEmail: { label: 'Notification Email', type: 'email' },
    PlatformFocus: { label: 'Platform Focus', type: 'checkbox', options: ['Instagram', 'Facebook', 'Pinterest', 'Twitter', 'LinkedIn', 'GBP'] },
    Brand_Hashtag: { label: 'Main Brand Hashtag', type: 'text' },
    HashtagStrategy: { label: 'Hashtag Strategy', type: 'textarea' },
    InstagramHookIdeas: { label: 'Instagram Hook Ideas', type: 'textarea' },
    Brand_Specific_UGC_Hashtag: { label: 'UGC Hashtag', type: 'text' },
    UGC_CallToAction: { label: 'UGC Call to Action', type: 'text' },
    Master_Image_Style_Guidelines: { label: 'Master Image Style Guidelines', type: 'textarea' },
    TargetPersona: { label: 'Detailed Target Persona', type: 'textarea' },
    TargetAudience: { label: 'Target Audience', type: 'textarea' },
    TargetPainPoint: { label: 'Audience\'s Goal or Challenge', type: 'textarea' },
    BrandVoice: { label: 'Brand Voice', type: 'radio', options: [ "Warm, friendly, and authentic tone...", "Clear, confident, and professional tone...", "Playful, witty, and creative tone...", "Inspirational and uplifting tone...", "Sophisticated and calm tone...", "Concise, modern, and straightforward tone..." ] },
    ContentPillars: { label: 'Content Pillars', type: 'textarea' },
    RecurringThemes: { label: 'Recurring Themes / Content Series', type: 'textarea' },
    CallToActionExamples: { label: 'Call to Action Examples', type: 'textarea' },
    SpecialInstructions: { label: 'Special Instructions', type: 'textarea' },
    NegativeKeywords: { label: 'Banned Words/Topics', type: 'textarea' },
    WordPressBaseURL: { label: 'WordPress Base URL', type: 'url' },
    InternalLinkPool: { label: 'Internal Link Pool', type: 'textarea' },
    YouTubeVideoPool: { label: 'YouTube Video Pool', type: 'textarea' },
    SEO_Keywords: { label: 'Primary SEO Keywords', type: 'textarea' },
    Blog_Additional_Keywords: { label: 'Additional Blog Keywords', type: 'textarea' },
    EvergreenContentTopics: { label: 'Evergreen Topics', type: 'textarea' },
    Blog_Default_Point_Of_View: { label: 'Blog Writing Perspective', type: 'select', options: ['2nd Person (You/Your)', '1st Person (I/We)'] },
    Blog_Default_Article_Size: { label: 'Preferred Article Length', type: 'select', options: ['Small (300-500 words)', 'Medium (500-800 words)', 'Long (800-1200 words)', 'Very Long (1200-1500 words)'] }
};

const showEditProfile = async () => {
    customerPanel.style.display = 'none';
    editProfileSection.style.display = 'block';
    profileViewContainer.innerHTML = `<p class="loading-text">Loading your profile...</p>`;
    setStatus(profileStatusDiv, '', 'info');

    try {
        const headers = getAuthHeaders();
        if (!headers) { handleLogout(); return; }
        const response = await fetch(GET_BUSINESS_PROFILE_URL, { headers });
        if (!response.ok) throw new Error('Could not fetch profile data.');

        const dataArray = await response.json();
        currentProfile = dataArray[0] || {};
        renderProfileView(currentProfile);
    } catch (error) {
        profileViewContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
};

const hideEditProfile = () => { editProfileSection.style.display = 'none'; customerPanel.style.display = 'block'; profileViewContainer.innerHTML = ''; };

function renderProfileView(data) {
    profileViewContainer.innerHTML = '';
    for (const key in fieldSchema) {
        if (Object.hasOwnProperty.call(fieldSchema, key)) {
            const schema = fieldSchema[key];
            const value = data[key] || ''; // Düzeltme: null/undefined ise boş string olsun
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'profile-field';
            fieldDiv.dataset.key = key;

            let valueHtml = value ? escapeHtml(value) : '<em style="color:#888;">Not set</em>';
            if (schema.type === 'checkbox' && value) {
                valueHtml = value.split(',').map(v => `<span class="badge">${escapeHtml(v.trim())}</span>`).join(' ');
            }
            
            fieldDiv.innerHTML = `
                <div class="field-label">${schema.label}</div>
                <div class="value-container">
                    <span class="field-value">${valueHtml}</span>
                </div>
                <div class="action-container">
                    <button class="edit-toggle-btn btn-secondary btn-sm">Edit</button>
                </div>
            `;
            profileViewContainer.appendChild(fieldDiv);
        }
    }
    profileViewContainer.querySelectorAll('.edit-toggle-btn').forEach(btn => btn.addEventListener('click', handleEditToggle));
}

function handleEditToggle(event) {
    const button = event.target;
    const fieldDiv = button.closest('.profile-field');
    const key = fieldDiv.dataset.key;
    const valueContainer = fieldDiv.querySelector('.value-container');
    const schema = fieldSchema[key];
    const currentValue = currentProfile[key] || ''; // Düzeltme

    if (button.textContent === 'Edit') {
        button.textContent = 'Save';
        button.classList.add('save-mode');
        
        let inputHtml = '';
        switch (schema.type) {
            case 'textarea': inputHtml = `<textarea class="field-textarea">${currentValue}</textarea>`; break;
            case 'select':
                inputHtml = `<select class="field-input">`;
                schema.options.forEach(opt => { inputHtml += `<option value="${escapeHtml(opt)}" ${opt === currentValue ? 'selected' : ''}>${escapeHtml(opt)}</option>`; });
                inputHtml += `</select>`; break;
            case 'radio':
                inputHtml = `<div class="radio-group">`;
                schema.options.forEach(opt => {
                    const simpleLabel = escapeHtml(opt.split('.')[0]); // BrandVoice için basitleştirme
                    inputHtml += `<label title="${escapeHtml(opt)}"><input type="radio" name="${key}" value="${escapeHtml(opt)}" ${opt === currentValue ? 'checked' : ''}> ${simpleLabel}</label><br>`;
                });
                inputHtml += `</div>`; break;
            case 'checkbox':
                const selectedValues = currentValue.split(',').map(v => v.trim());
                inputHtml = `<div class="checkbox-group">`;
                schema.options.forEach(opt => { inputHtml += `<label><input type="checkbox" value="${escapeHtml(opt)}" ${selectedValues.includes(opt) ? 'checked' : ''}> ${escapeHtml(opt)}</label>`; });
                inputHtml += `</div>`; break;
            default: inputHtml = `<input type="${schema.type}" class="field-input" value="${currentValue}">`; break;
        }
        valueContainer.innerHTML = inputHtml;
    } else { // Save'e tıklandığında
        button.textContent = 'Edit';
        button.classList.remove('save-mode');
        
        let newValue;
        switch (schema.type) {
            case 'checkbox':
                const checkedBoxes = valueContainer.querySelectorAll('input:checked');
                newValue = Array.from(checkedBoxes).map(cb => cb.value).join(','); break;
            case 'radio':
                const checkedRadio = valueContainer.querySelector('input:checked');
                newValue = checkedRadio ? checkedRadio.value : currentValue; break;
            default:
                const input = valueContainer.querySelector('input, textarea, select');
                newValue = input.value; break;
        }
        currentProfile[key] = newValue;
        
        let valueHtml = newValue ? escapeHtml(newValue) : '<em style="color:#888;">Not set</em>';
        if (schema.type === 'checkbox' && newValue) {
            valueHtml = newValue.split(',').map(v => `<span class="badge">${escapeHtml(v.trim())}</span>`).join(' ');
        }
        valueContainer.innerHTML = `<span class="field-value">${valueHtml}</span>`;
    }
}

async function handleSaveAllChanges() {
    setStatus(profileStatusDiv, 'Saving all changes...', 'info');
    saveAllChangesBtn.disabled = true;
    try {
        const headers = getAuthHeaders();
        if (!headers) throw new Error('Authentication error.');
        const response = await fetch(UPDATE_PROFILE_WORKFLOW_URL, {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(currentProfile)
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save profile.'); }
        setStatus(profileStatusDiv, 'Profile saved successfully!', 'success');
        setTimeout(() => setStatus(profileStatusDiv, '', 'info'), 3000);
    } catch (error) {
        setStatus(profileStatusDiv, `Error: ${error.message}`, 'error');
    } finally {
        saveAllChangesBtn.disabled = false;
    }
}

// --- EVENT LISTENERS ---
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
if(onboardingLogoutBtn) onboardingLogoutBtn.addEventListener('click', handleLogout);
if(pendingLogoutBtn) pendingLogoutBtn.addEventListener('click', handleLogout);
if(showFormBtn) showFormBtn.addEventListener('click', () => { customerPanel.style.display = 'none'; postFormSection.style.display = 'block'; });
if(showApprovalPortalBtn) showApprovalPortalBtn.addEventListener('click', () => { customerPanel.style.display = 'none'; approvalPortalSection.style.display = 'block'; });
if(backToPanelFromApprovalBtn) backToPanelFromApprovalBtn.addEventListener('click', () => { approvalPortalSection.style.display = 'none'; customerPanel.style.display = 'block'; });

editProfileBtn.addEventListener('click', showEditProfile);
backToPanelFromEditBtn.addEventListener('click', hideEditProfile);
saveAllChangesBtn.addEventListener('click', handleSaveAllChanges);

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
