import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8qju9uR_bPUWft5s37bs0UKTh_XanMz4",
  authDomain: "tutor-unis.firebaseapp.com",
  projectId: "tutor-unis",
  storageBucket: "tutor-unis.firebasestorage.app",
  messagingSenderId: "986622809570",
  appId: "1:986622809570:web:9efb1eb8c38dbb9409d5bb",
};

const REGISTER_URL =
  "https://us-central1-tutor-unis.cloudfunctions.net/registerNewUser";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

auth.languageCode = "es";
await setPersistence(auth, browserLocalPersistence);

// ============================================================
// DOM helpers
// ============================================================

const $ = (id) => document.getElementById(id);

function showOverlay() {
  if ($("login-overlay")) $("login-overlay").style.display = "flex";
  if ($("main-content")) $("main-content").style.visibility = "hidden";
  if ($("sidebar")) $("sidebar").style.visibility = "hidden";
}

function hideOverlay() {
  if ($("login-overlay")) $("login-overlay").style.display = "none";
  if ($("main-content")) $("main-content").style.visibility = "visible";
  if ($("sidebar")) $("sidebar").style.visibility = "visible";
}

function showScreen(name) {
  document.querySelectorAll(".login-screen").forEach((s) => {
    s.style.display = "none";
  });
  const target = $("screen-" + name);
  if (target) target.style.display = "flex";
  document.querySelectorAll(".login-error").forEach((e) => {
    e.textContent = "";
    e.style.display = "none";
  });
  document.querySelectorAll(".login-loading").forEach((l) => {
    l.style.display = "none";
  });
}

function showError(elId, msg) {
  const el = $(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function setLoading(formScope, loading) {
  const submitBtn = $(formScope + "-submit");
  const loaderEl = $(formScope + "-loading");
  if (submitBtn) submitBtn.disabled = loading;
  if (loaderEl) loaderEl.style.display = loading ? "flex" : "none";
  document.querySelectorAll(`#screen-${formScope} input`).forEach((i) => {
    i.disabled = loading;
  });
  document.querySelectorAll(`#screen-${formScope} button`).forEach((b) => {
    if (b.type !== "submit") b.disabled = loading;
  });
}

// ============================================================
// Auth state listener (single source of truth)
// ============================================================

let isProcessing = false;
let verifyPollInterval = null;

function startVerifyPolling() {
  if (verifyPollInterval) return; // ya activo
  // Polleo cada 5s para detectar cuando el usuario hace click en el enlace del email
  // sin necesidad de que vuelva manualmente a pulsar "Ya he verificado, comprobar".
  verifyPollInterval = setInterval(async () => {
    if (!auth.currentUser) {
      stopVerifyPolling();
      return;
    }
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        stopVerifyPolling();
        await recordSessionSilently();
        hideOverlay();
      }
    } catch (err) {
      // Fallo de red puntual, seguimos polleando
    }
  }, 5000);
}

function stopVerifyPolling() {
  if (verifyPollInterval) {
    clearInterval(verifyPollInterval);
    verifyPollInterval = null;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (isProcessing) return;

  if (!user) {
    stopVerifyPolling();
    showOverlay();
    showScreen("login");
    return;
  }

  if (!user.emailVerified) {
    showOverlay();
    if ($("verify-email-display")) {
      $("verify-email-display").textContent = user.email || "";
    }
    showScreen("verify");
    // Iniciar polleo automático en background para detectar verificación sin click manual
    startVerifyPolling();
    return;
  }

  stopVerifyPolling();
  hideOverlay();
  await recordSessionSilently();
  window.dispatchEvent(new CustomEvent("authReady", {detail: {user}}));
});

// ============================================================
// Core flows
// ============================================================

async function loginOrRegister(email, password) {
  try {
    isProcessing = true;
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      isProcessing = false;
      if ($("verify-email-display")) {
        $("verify-email-display").textContent = cred.user.email || email;
      }
      showScreen("verify");
      return {status: "needs_verification"};
    }

    isProcessing = false;
    await recordSessionSilently();
    hideOverlay();
    return {status: "logged_in"};
  } catch (err) {
    isProcessing = false;
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential"
    ) {
      return await tryNewRegistration(email, password);
    }
    if (err.code === "auth/wrong-password") {
      return {status: "error", message: "Contraseña incorrecta."};
    }
    if (err.code === "auth/too-many-requests") {
      return {
        status: "error",
        message: "Demasiados intentos. Espera unos minutos.",
      };
    }
    if (err.code === "auth/invalid-email") {
      return {status: "error", message: "Formato de correo no válido."};
    }
    console.error("Login error:", err);
    return {status: "error", message: "Error inesperado: " + err.code};
  }
}

async function tryNewRegistration(email, password) {
  let res;
  try {
    res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email, password}),
    });
  } catch (err) {
    return {
      status: "error",
      message: "Error de red contactando al servidor.",
    };
  }

  if (res.status === 201) {
    try {
      isProcessing = true;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user, {
        url: window.location.origin,
        handleCodeInApp: false,
      });
      isProcessing = false;
      if ($("verify-email-display")) {
        $("verify-email-display").textContent = cred.user.email || email;
      }
      showScreen("verify");
      return {status: "verification_sent"};
    } catch (err) {
      isProcessing = false;
      console.error("Post-register sign-in failed:", err);
      return {
        status: "error",
        message: "Cuenta creada pero error enviando verificación. Reintenta.",
      };
    }
  }

  const json = await res.json().catch(() => ({}));
  switch (json.error) {
    case "not_a_client":
      return {
        status: "error",
        message:
          "Este correo no consta como cliente de Medicarama. " +
          "Si crees que es un error, contacta con secretaría.",
      };
    case "capacity_reached":
      return {
        status: "error",
        message: "Servidores saturados. Inténtalo más tarde.",
      };
    case "weak_password":
      return {
        status: "error",
        message: "La contraseña debe tener al menos 6 caracteres.",
      };
    case "email_already_exists":
      return {
        status: "error",
        message: "Esta cuenta ya existe. Verifica la contraseña.",
      };
    default:
      return {
        status: "error",
        message: "Error inesperado (" + res.status + ").",
      };
  }
}

async function resendVerification() {
  if (!auth.currentUser) {
    return {status: "error", message: "No hay sesión activa."};
  }
  try {
    await sendEmailVerification(auth.currentUser, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
    return {status: "sent"};
  } catch (err) {
    if (err.code === "auth/too-many-requests") {
      return {
        status: "error",
        message: "Demasiados envíos. Espera unos minutos.",
      };
    }
    return {status: "error", message: "No se pudo reenviar."};
  }
}

async function checkVerification() {
  if (!auth.currentUser) {
    return {status: "error", message: "No hay sesión activa."};
  }
  try {
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      await recordSessionSilently();
      hideOverlay();
      return {status: "verified"};
    }
    return {
      status: "not_yet",
      message: "Aún no detectamos la verificación. Pulsa el enlace del email.",
    };
  } catch (err) {
    return {status: "error", message: "No se pudo comprobar."};
  }
}

async function sendReset(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
    return {status: "sent"};
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return {status: "sent"};
    }
    if (err.code === "auth/invalid-email") {
      return {status: "error", message: "Formato de correo no válido."};
    }
    if (err.code === "auth/too-many-requests") {
      return {
        status: "error",
        message: "Demasiados envíos. Espera unos minutos.",
      };
    }
    return {status: "error", message: "Error: " + err.code};
  }
}

async function recordSessionSilently() {
  try {
    await httpsCallable(functions, "recordActiveSession")();
  } catch (err) {
    console.warn("recordActiveSession failed (non-blocking):", err);
  }
}

async function getCurrentToken() {
  if (!auth.currentUser) return null;
  if (!auth.currentUser.emailVerified) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.error("getIdToken failed:", err);
    return null;
  }
}

async function logout() {
  if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
  try {
    localStorage.removeItem("medicarama_history");
  } catch (e) {
    // ignore
  }
  await signOut(auth);
  window.location.reload();
}

window.tutorAuth = {
  getCurrentToken,
  logout,
  getCurrentUser: () => auth.currentUser,
};

// ============================================================
// UI wiring
// ============================================================

function attachHandlers() {
  const loginForm = $("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("login-email").value.trim();
      const password = $("login-password").value;

      if (!email || !password) {
        showError("login-error", "Rellena correo y contraseña.");
        return;
      }
      if (password.length < 6) {
        showError(
            "login-error",
            "La contraseña debe tener al menos 6 caracteres.",
        );
        return;
      }

      setLoading("login", true);
      const result = await loginOrRegister(email, password);
      setLoading("login", false);

      if (result.status === "error") {
        showError("login-error", result.message);
      }
    });
  }

  const ICON_EYE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>' +
    '<circle cx="12" cy="12" r="3"/></svg>';
  const ICON_EYE_OFF =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>' +
    '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>' +
    '<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>' +
    '<line x1="2" x2="22" y1="2" y2="22"/></svg>';
  const togglePwd = $("toggle-password");
  if (togglePwd) {
    togglePwd.addEventListener("click", () => {
      const input = $("login-password");
      if (!input) return;
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      togglePwd.innerHTML = hidden ? ICON_EYE_OFF : ICON_EYE;
      togglePwd.setAttribute(
          "aria-label",
          hidden ? "Ocultar contraseña" : "Mostrar contraseña",
      );
    });
  }

  const linkForgot = $("link-forgot");
  if (linkForgot) {
    linkForgot.addEventListener("click", () => {
      const emailFromLogin = $("login-email") ? $("login-email").value : "";
      if ($("forgot-email")) $("forgot-email").value = emailFromLogin;
      showScreen("forgot");
    });
  }

  const btnBackToLogin1 = $("btn-back-to-login-1");
  if (btnBackToLogin1) {
    btnBackToLogin1.addEventListener("click", async () => {
      await signOut(auth);
    });
  }

  const btnResend = $("btn-resend");
  if (btnResend) {
    btnResend.addEventListener("click", async () => {
      setLoading("verify", true);
      const result = await resendVerification();
      setLoading("verify", false);
      if (result.status === "error") {
        showError("verify-error", result.message);
      } else {
        showError("verify-error", "✓ Email reenviado.");
        $("verify-error").style.color = "#16a34a";
      }
    });
  }

  const btnCheck = $("btn-check-verification");
  if (btnCheck) {
    btnCheck.addEventListener("click", async () => {
      setLoading("verify", true);
      const result = await checkVerification();
      setLoading("verify", false);
      if (result.status === "not_yet") {
        showError("verify-error", result.message);
      } else if (result.status === "error") {
        showError("verify-error", result.message);
      }
    });
  }

  const forgotForm = $("forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("forgot-email").value.trim();
      if (!email) {
        showError("forgot-error", "Introduce un correo.");
        return;
      }

      setLoading("forgot", true);
      const result = await sendReset(email);
      setLoading("forgot", false);

      if (result.status === "error") {
        showError("forgot-error", result.message);
      } else {
        showError(
            "forgot-error",
            "✓ Si el correo existe, recibirás un enlace en breve.",
        );
        $("forgot-error").style.color = "#16a34a";
      }
    });
  }

  const btnBackToLogin2 = $("btn-back-to-login-2");
  if (btnBackToLogin2) {
    btnBackToLogin2.addEventListener("click", () => {
      showScreen("login");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachHandlers);
} else {
  attachHandlers();
}
