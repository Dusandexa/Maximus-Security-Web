/* forms.js (standalone) */
/* Config-driven form renderer + validation + reCAPTCHA + AJAX submit
   - Works with multiple forms per page
   - Does nothing if no forms found
   - Uses jQuery Validate if present, otherwise fallback validation
*/

/* ==========================
   CONFIG
   ========================== */

const MS_FORM_CONFIGS = {
  // Video nadzor / kamere
  kamere: {
    formKey: "video-nadzor",
    subject: "Upit za ponudu — Video nadzor (kamere)",
    endpoint: "/php/send-offer.php",
    fields: [
      { name: "obuka", label: "Želim obuku za video nadzor", type: "checkbox", value: "Da", col: "col-12 pt-20" },

      { name: "ime", label: "Ime", type: "text", required: true, placeholder: "Vaše ime", col: "col-md-6 pt-20" },
      { name: "prezime", label: "Prezime", type: "text", placeholder: "Vaše prezime", col: "col-md-6 pt-20" },

      { name: "email", label: "Email adresa", type: "email", required: true, placeholder: "npr. ime@domen.com", col: "col-md-6 pt-20" },
      { name: "telefon", label: "Broj telefona", type: "tel", required: true, placeholder: "npr. +381 6x xxx xxxx", col: "col-md-6 pt-20" },

      { name: "tipProstora", label: "Tip prostora", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["Stan", "Kuća", "Poslovni prostor", "Drugo"] },

      { name: "vrstaUsluge", label: "Vrsta usluge", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["Kompletna ugradnja", "Samo oprema", "Servis", "Održavanje", "Ne znam / treba preporuka"] },

      { name: "brojKamera", label: "Broj kamera", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["1-2", "3-4", "4-8", "8+"] },

      { name: "napomena", label: "Napomena", type: "textarea", placeholder: "Dodatne informacije", col: "col-12 pt-20", rows: 4 }
    ]
  },

  // Alarmni sistemi
  alarm: {
    formKey: "alarmni-sistemi",
    subject: "Upit za ponudu — Alarmni sistemi",
    endpoint: "/php/send-offer.php",
    fields: [
      { name: "ime", label: "Ime", type: "text", required: true, placeholder: "Vaše ime", col: "col-md-6 pt-20" },
      { name: "prezime", label: "Prezime", type: "text", placeholder: "Vaše prezime", col: "col-md-6 pt-20" },

      { name: "email", label: "Email adresa", type: "email", required: true, placeholder: "npr. ime@domen.com", col: "col-md-6 pt-20" },
      { name: "telefon", label: "Broj telefona", type: "tel", required: true, placeholder: "npr. +381 6x xxx xxxx", col: "col-md-6 pt-20" },

      { name: "tipProstora", label: "Tip prostora", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["Stan", "Kuća", "Poslovni prostor", "Drugo"] },

      { name: "vrstaUsluge", label: "Vrsta usluge", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["Kompletna ugradnja", "Samo oprema", "Servis", "Održavanje", "Ne znam / treba preporuka"] },

      { name: "napomena", label: "Napomena", type: "textarea", placeholder: "Dodatne informacije", col: "col-12 pt-20", rows: 4 }
    ]
  },

  // Iznajmljivanje metal detektorskih vrata
  metal: {
    formKey: "iznajmljivanje-metal-detektorska-vrata",
    subject: "Upit za ponudu — Iznajmljivanje metal detektorskih vrata",
    endpoint: "/php/send-offer.php",
    fields: [
      { name: "ime", label: "Ime", type: "text", required: true, placeholder: "Vaše ime", col: "col-md-6 pt-20" },
      { name: "prezime", label: "Prezime", type: "text", placeholder: "Vaše prezime", col: "col-md-6 pt-20" },

      { name: "email", label: "Email adresa", type: "email", required: true, placeholder: "npr. ime@domen.com", col: "col-md-6 pt-20" },
      { name: "telefon", label: "Broj telefona", type: "tel", required: true, placeholder: "npr. +381 6x xxx xxxx", col: "col-md-6 pt-20" },

      { name: "brojVrata", label: "Broj vrata", type: "select", required: true, col: "col-md-6 pt-20",
        options: ["1","2","3","4","5","6","7","8","9","10","Više od 10"] },

      { name: "vrstaDogadjaja", label: "Vrsta događaja", type: "select", required: true, col: "col-md-6 pt-20",
        options: [
          "Koncerti i muzički događaji",
          "Sportske manifestacije",
          "Festivali i sajmovi",
          "Konferencije i poslovni eventi",
          "Noćni klubovi i proslave",
          "Škole i univerziteti",
          "Sudovi i državne institucije",
          "Drugo"
        ] },

      { name: "napomena", label: "Napomena", type: "textarea", placeholder: "Dodatne informacije", col: "col-12 pt-20", rows: 4 }
    ]
  }
};

// OPTIONAL: URL fallback if you ever forget data-ms-form on a page
function ms_guessKeyFromUrl() {
  const p = (window.location.pathname || "").toLowerCase();
  if (p.includes("kamere-za-video-nadzor")) return "kamere";
  if (p.includes("alarmni-sistemi")) return "alarm";
  if (p.includes("iznajmljivanje-metal-detektorska-vrata")) return "metal";
  return null;
}


/* ==========================
   HELPERS
   ========================== */

function ms_escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ms_isRecaptchaReady() {
  return typeof window.grecaptcha !== "undefined" && typeof window.grecaptcha.getResponse === "function";
}

function ms_isPhoneLoose(v) {
  return /^[0-9+\s\/\-()]{6,}$/.test(String(v || "").trim());
}

function ms_findFieldsHost(formEl) {
  // Only render into a dedicated container
  let host = formEl.querySelector("[data-ms-fields]");
  if (host) return host;

  // Create it safely (so we never overwrite existing button/captcha markup)
  host = document.createElement("div");
  host.className = "row g-3";
  host.setAttribute("data-ms-fields", "");
  formEl.prepend(host);

  return host;
}

function ms_getCaptchaEl(formEl) {
  return formEl.querySelector("[data-ms-captcha]") || formEl.querySelector(".g-recaptcha");
}

function ms_getCaptchaErrorEl(formEl) {
  return formEl.querySelector("[data-ms-captcha-error]") || formEl.querySelector("#captchaError");
}

function ms_getSubmitButton(formEl) {
  return formEl.querySelector('button[type="submit"], input[type="submit"]');
}


/* ==========================
   RENDER
   ========================== */

function ms_renderFormInto(formEl, config) {
  const host = ms_findFieldsHost(formEl);

  const parts = [];
  for (const f of config.fields || []) {
    const colClass = f.col || "col-12 pt-20";
    const id = f.id || `${config.formKey || "form"}_${f.name}`;

    const requiredMark = f.required ? ' <span class="text-danger">*</span>' : "";
    const inputClass = ms_escapeHtml(f.inputClass || "form-control form-control-lg rounded-3");
    const selectClass = ms_escapeHtml(f.selectClass || "form-select form-select-lg rounded-3");

    if (f.type === "checkbox") {
      parts.push(`
        <div class="${ms_escapeHtml(colClass)}">
          <div class="form-check">
            <input class="form-check-input" id="${ms_escapeHtml(id)}" name="${ms_escapeHtml(f.name)}" type="checkbox" value="${ms_escapeHtml(f.value ?? "Da")}">
            <label class="form-check-label" for="${ms_escapeHtml(id)}">${ms_escapeHtml(f.label)}</label>
          </div>
        </div>
      `);
      continue;
    }

    if (f.type === "select") {
      const opts = (f.options || []).map((o) => {
        const text = typeof o === "string" ? o : (o.text ?? o.value ?? "");
        const value = typeof o === "string" ? o : (o.value ?? o.text ?? "");
        return `<option value="${ms_escapeHtml(value)}">${ms_escapeHtml(text)}</option>`;
      }).join("");

      parts.push(`
        <div class="${ms_escapeHtml(colClass)}">
          <label class="form-label" for="${ms_escapeHtml(id)}"><strong>${ms_escapeHtml(f.label)}</strong>${requiredMark}</label>
          <select class="${selectClass}" id="${ms_escapeHtml(id)}" name="${ms_escapeHtml(f.name)}">
            ${opts}
          </select>
          <div class="invalid-feedback"></div>
        </div>
      `);
      continue;
    }

    if (f.type === "textarea") {
      parts.push(`
        <div class="${ms_escapeHtml(colClass)}">
          <label class="form-label" for="${ms_escapeHtml(id)}"><strong>${ms_escapeHtml(f.label)}</strong>${requiredMark}</label>
          <textarea class="${inputClass}" id="${ms_escapeHtml(id)}" name="${ms_escapeHtml(f.name)}" rows="${ms_escapeHtml(f.rows ?? 4)}" placeholder="${ms_escapeHtml(f.placeholder ?? "")}"></textarea>
          <div class="invalid-feedback"></div>
        </div>
      `);
      continue;
    }

    // Default input
    parts.push(`
      <div class="${ms_escapeHtml(colClass)}">
        <label class="form-label" for="${ms_escapeHtml(id)}"><strong>${ms_escapeHtml(f.label)}</strong>${requiredMark}</label>
        <input type="${ms_escapeHtml(f.type || "text")}" class="${inputClass}" id="${ms_escapeHtml(id)}" name="${ms_escapeHtml(f.name)}" placeholder="${ms_escapeHtml(f.placeholder ?? "")}">
        <div class="invalid-feedback"></div>
      </div>
    `);
  }

  host.innerHTML = parts.join("\n");

  // Store meta on form for submit
  formEl.dataset.msFormKey = config.formKey || "";
  formEl.dataset.msSubject = config.subject || "";
  formEl.dataset.msEndpoint = config.endpoint || "";
}


/* ==========================
   VALIDATION + SUBMIT
   ========================== */

function ms_setupJqueryValidate(formEl, config) {
  if (!window.jQuery || !window.jQuery.validator) return false;

  const $form = window.jQuery(formEl);

  // Destroy previous validator if any (important for pages with partial reloads)
  try { $form.validate().destroy(); } catch (_) {}

  // Add phone method once
  if (!window.jQuery.validator.methods.msPhoneLoose) {
    window.jQuery.validator.addMethod(
      "msPhoneLoose",
      function (value) { return ms_isPhoneLoose(value); },
      "Unesite važeći broj telefona."
    );
  }

  // Build rules/messages from config
  const rules = {};
  const messages = {};

  for (const f of config.fields || []) {
    if (!f.name) continue;
    if (f.type === "checkbox") continue;

    const r = {};
    const m = {};

    if (f.required) {
      r.required = true;
      m.required = "Ovo polje je obavezno.";
    }
    if (f.type === "email") {
      r.email = true;
      m.email = "Unesite ispravnu email adresu.";
    }
    if (f.name === "telefon") {
      r.msPhoneLoose = true;
    }
    if (f.name === "ime") {
      r.minlength = 2;
      m.minlength = "Unesite najmanje 2 karaktera.";
    }

    rules[f.name] = r;
    messages[f.name] = m;
  }

  $form.validate({
    errorElement: "div",
    errorClass: "error-text",
    focusInvalid: false,
    rules,
    messages,

    highlight: function (element) {
      window.jQuery(element).addClass("is-invalid").removeClass("is-valid");
      const $fb = window.jQuery(element).closest("div").find(".invalid-feedback").first();
      if ($fb.length) $fb.show();
    },
    unhighlight: function (element) {
      window.jQuery(element).removeClass("is-invalid").addClass("is-valid");
      const $fb = window.jQuery(element).closest("div").find(".invalid-feedback").first();
      if ($fb.length) $fb.hide().text("");
    },
    errorPlacement: function (error, element) {
      const $el = window.jQuery(element);
      const $fb = $el.closest("div").find(".invalid-feedback").first();
      if ($fb.length) {
        $fb.html(error.text()).show();
      } else {
        error.insertAfter(element);
      }
    },

    submitHandler: async function (nativeForm) {
      await ms_submitForm(nativeForm, config);
      return false;
    }
  });

  return true;
}

function ms_fallbackValidate(formEl, config) {
  let ok = true;

  // Clear old errors
  formEl.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));

  for (const f of config.fields || []) {
    if (!f.required) continue;
    if (f.type === "checkbox") continue;

    const el = formEl.querySelector(`[name="${CSS.escape(f.name)}"]`);
    if (!el) continue;

    const val = String(el.value || "").trim();
    if (!val) {
      ok = false;
      el.classList.add("is-invalid");
    }
  }

  const tel = formEl.querySelector('[name="telefon"]');
  if (tel && tel.value && !ms_isPhoneLoose(tel.value)) {
    ok = false;
    tel.classList.add("is-invalid");
  }

  const email = formEl.querySelector('[name="email"]');
  if (email && email.value) {
    const v = String(email.value).trim();
    // lightweight email check
    if (!/^\S+@\S+\.\S+$/.test(v)) {
      ok = false;
      email.classList.add("is-invalid");
    }
  }

  return ok;
}

async function ms_submitForm(formEl, config) {
  const endpoint = formEl.dataset.msEndpoint || config.endpoint;
  const subject = formEl.dataset.msSubject || config.subject;
  const formKey = formEl.dataset.msFormKey || config.formKey;

  // reCAPTCHA (optional, but if present -> required)
  const captchaEl = ms_getCaptchaEl(formEl);
  const captchaErrEl = ms_getCaptchaErrorEl(formEl);

  if (captchaErrEl) {
    captchaErrEl.style.display = "none";
    captchaErrEl.textContent = "";
  }

  let captchaResponse = "";
  if (captchaEl) {
    if (!ms_isRecaptchaReady()) {
      alert("reCAPTCHA nije učitana. Proverite da li je Google script dodat na stranicu.");
      return;
    }
    // NOTE: This uses the "global" response for classic checkbox. If you later use multiple widgets,
    // this still works in most cases. If you need per-form widget IDs, we can upgrade it.
    captchaResponse = window.grecaptcha.getResponse();
    if (!captchaResponse) {
      if (captchaErrEl) {
        captchaErrEl.textContent = "Molimo potvrdite reCAPTCHA.";
        captchaErrEl.style.display = "block";
      } else {
        alert("Molimo potvrdite reCAPTCHA.");
      }
      return;
    }
  }

  const btn = ms_getSubmitButton(formEl);
  const oldBtnHtml = btn ? (btn.tagName === "INPUT" ? btn.value : btn.innerHTML) : "";
  if (btn) {
    btn.disabled = true;
    if (btn.tagName === "INPUT") btn.value = "Šaljem...";
    else btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Šaljem...`;
  }

  try {
    const fd = new FormData(formEl);
    fd.append("formKey", formKey || "");
    fd.append("subject", subject || "");

    if (captchaEl) {
      fd.append("g-recaptcha-response", captchaResponse);
    }

    const res = await fetch(endpoint, { method: "POST", body: fd });

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let payload;
    if (ct.includes("application/json")) {
      payload = await res.json();
    } else {
      const text = await res.text();
      payload = { ok: res.ok, message: text };
    }

    if (!res.ok || payload?.ok === false) {
      const msg = payload?.message || "Došlo je do greške. Pokušajte ponovo.";
      alert(msg);
      return;
    }

    alert(payload?.message || "Hvala! Vaš zahtev je uspešno poslat.");
    formEl.reset();

    if (captchaEl && ms_isRecaptchaReady()) {
      window.grecaptcha.reset();
    }

    // Reset UI validity
    formEl.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
      el.classList.remove("is-valid", "is-invalid");
    });

  } catch (err) {
    console.error(err);
    alert("Došlo je do greške u slanju. Proverite internet konekciju i pokušajte ponovo.");
  } finally {
    if (btn) {
      btn.disabled = false;
      if (btn.tagName === "INPUT") btn.value = oldBtnHtml;
      else btn.innerHTML = oldBtnHtml;
    }
  }
}

function ms_attachFallbackSubmit(formEl, config) {
  // Prevent multiple listeners
  if (formEl.dataset.msBound === "1") return;
  formEl.dataset.msBound = "1";

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ok = ms_fallbackValidate(formEl, config);
    if (!ok) return;

    await ms_submitForm(formEl, config);
  });
}


/* ==========================
   BOOTSTRAP
   ========================== */

function ms_initForms() {
  // Primary: all forms that declare which config they want
  const forms = Array.from(document.querySelectorAll("form[data-ms-form]"));

  // DISABLED: Optional fallback to prevent auto-hijacking existing forms
  // if (forms.length === 0) {
  //   const maybe = document.querySelector("form#offerForm");
  //   const guessed = ms_guessKeyFromUrl();
  //   if (maybe && guessed && MS_FORM_CONFIGS[guessed]) {
  //     maybe.setAttribute("data-ms-form", guessed);
  //     forms.push(maybe);
  //   }
  // }

  // If still none -> do nothing
  if (forms.length === 0) return;

  for (const formEl of forms) {
    const key = formEl.getAttribute("data-ms-form");
    const cfg = MS_FORM_CONFIGS[key];

    if (!cfg) {
      // Unknown config key => skip safely
      continue;
    }

    // Render fields
    ms_renderFormInto(formEl, cfg);

    // Setup validation + submit
    const hasJqValidate = ms_setupJqueryValidate(formEl, cfg);
    if (!hasJqValidate) {
      ms_attachFallbackSubmit(formEl, cfg);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ms_initForms);
} else {
  ms_initForms();
}
