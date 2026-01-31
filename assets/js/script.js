/* assets/js/script.js - FINAL (EDIT PROFILE REMOVED CLEANLY) */

import { Uppy, Dashboard, AwsS3 } from "https://releases.transloadit.com/uppy/v3.3.1/uppy.min.mjs";

/* ================= API URLS ================= */
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
const GET_MANUAL_POST_BY_ID_URL = 'https://ops.synqbrand.com/webhook/e1b260ea-2f4f-4620-8098-c5e9d369258b/';

/* ================= STATE ================= */
let state = {
  loadingIntervalId: null,
  pendingPosts: [],
  modalDecisions: [],
  selectedPosts: []
};

/* ================= ELEMENTS ================= */
const loginSection = document.getElementById('login-section');
const customerPanel = document.getElementById('customer-panel');
const postFormSection = document.getElementById('post-form-section');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const statusDiv = document.getElementById('status');
const welcomeMessage = document.getElementById('welcome-message');
const showFormBtn = document.getElementById('show-form-btn');
const postForm = document.getElementById('post-form');
const submitPostBtn = document.getElementById('submit-post-btn');
const postStatusDiv = document.getElementById('post-status');
const backToPanelBtn = document.getElementById('back-to-panel-btn');
const logoutBtn = document.getElementById('logout-btn');

const approvalPortalSection = document.getElementById('approval-portal-section');
const showApprovalPortalBtn = document.getElementById('show-approval-portal-btn');
const backToPanelFromApprovalBtn = document.getElementById('back-to-panel-from-approval-btn');
const approvalGalleryContainer = document.getElementById('approval-gallery-container');
const approvalModal = document.getElementById('approval-modal');
const modalTitle = document.getElementById('modal-title');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalVisual = document.getElementById('modal-visual');
const modalPlatforms = document.getElementById('modal-platforms');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalStatus = document.getElementById('modal-status');

const publishApprovedBtn = document.getElementById('publish-approved-btn');
const publishStatus = document.getElementById('publish-status');
const bulkActionsContainer = document.getElementById('bulk-actions-container');
const bulkSelectAll = document.getElementById('bulk-select-all');
const bulkApproveBtn = document.getElementById('bulk-approve-btn');

const onboardingSection = document.getElementById('onboarding-section');
const pendingActivationSection = document.getElementById('pending-activation-section');
const formContainer = document.getElementById('form-container');
const onboardingLogoutBtn = document.getElementById('onboarding-logout-btn');
const pendingLogoutBtn = document.getElementById('pending-logout-btn');

/* ================= HELPERS ================= */
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

const setStatus = (el, msg, type = 'info') => {
  if (!el) return;
  el.className = type;
  el.innerHTML = msg;
};

const handleLogout = () => {
  localStorage.clear();
  location.reload();
};

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

/* ================= ROUTING ================= */
const routeUserByRole = async (role, username) => {
  loginSection.style.display = 'none';
  customerPanel.style.display = 'none';
  onboardingSection.style.display = 'none';
  pendingActivationSection.style.display = 'none';
  postFormSection.style.display = 'none';
  approvalPortalSection.style.display = 'none';

  if (role === 'customer') {
    welcomeMessage.textContent = `Welcome, ${username}!`;
    customerPanel.style.display = 'block';
    fetchAndRenderPlatforms();
  } else if (role === 'pending' || role === 'new_member') {
    await loadAndInjectForm();
    onboardingSection.style.display = 'block';
  } else if (role === 'pending_activation') {
    pendingActivationSection.style.display = 'block';
  } else {
    handleLogout();
  }
};

const showCustomerPanel = () => {
  approvalPortalSection.style.display = 'none';
  postFormSection.style.display = 'none';
  customerPanel.style.display = 'block';
};

/* ================= LOGIN ================= */
const handleLogin = async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  setStatus(statusDiv, 'Logging in...');
  try {
    const res = await fetch(LOGIN_WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('jwtToken', data.token);
    const decoded = parseJwt(data.token);
    await routeUserByRole(decoded.role, decoded.username);
  } catch (err) {
    setStatus(statusDiv, err.message, 'error');
  } finally {
    loginBtn.disabled = false;
  }
};

/* ================= EVENT LISTENERS ================= */
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
onboardingLogoutBtn.addEventListener('click', handleLogout);
pendingLogoutBtn.addEventListener('click', handleLogout);
showApprovalPortalBtn.addEventListener('click', () => {
  customerPanel.style.display = 'none';
  approvalPortalSection.style.display = 'block';
  loadAndRenderApprovalGallery();
});
backToPanelFromApprovalBtn.addEventListener('click', showCustomerPanel);

window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;
  const decoded = parseJwt(token);
  if (decoded?.role) {
    await routeUserByRole(decoded.role, decoded.username);
  } else {
    handleLogout();
  }
});
