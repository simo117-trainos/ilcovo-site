// ══════════════════════════════════════════════════════════════
//  IL COVO — Booking / Lead Handler
//  Frontend strutturato per il futuro Gestionale BOX CrossFit
// ══════════════════════════════════════════════════════════════

// ── CONTATTO WHATSAPP (fallback temporaneo) ──
// Inserire numero in formato internazionale, esempio 393331234567
const WHATSAPP_NUMBER = "393517585721";

// ── PROVIDER PRINCIPALI ──
const BOOKING_PROVIDER = "manual"; // futuro: "timp" | "internal"
const CRM_PROVIDER     = "none";   // futuro: "internal"
const PAYMENT_PROVIDER = "none";   // futuro: "stripe" | "satispay" | "nexi" | "timp"
const MAKE_TRIAL_WEBHOOK_URL = "https://hook.eu1.make.com/znm68bougpwyss6xhplni67o9wxi6l25";
const ROME_TIME_ZONE = "Europe/Rome";
const DAY_INDEXES = {
  domenica: 0,
  lunedi: 1,
  martedi: 2,
  mercoledi: 3,
  giovedi: 4,
  venerdi: 5,
  sabato: 6,
};
const DAY_KEYS = ["domenica", "lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"];

// ── INTEGRAZIONI ──
// Tutte le API key / segreti vanno gestiti lato backend, mai nel frontend.
const INTEGRATIONS = {
  timp: {
    enabled:    false,
    apiBaseUrl: "",
    // Questa funzione sarà collegata al sistema prenotazioni TIMP.
  },
  crm: {
    enabled:  false,
    endpoint: "",
    // Questa funzione sarà collegata al futuro Gestionale BOX CrossFit.
  },
  payments: {
    enabled:  false,
    provider: "",
    // Questa funzione sarà collegata al provider pagamenti.
  },
  trainos: {
    enabled:  false,
    endpoint: "",
    // Questa funzione sarà collegata a Trainos se scelto come gestionale.
  },
};

// ── ORARI CLASSI ──
// Aggiornare con il planning reale IL COVO.
// In futuro questi orari saranno caricati dinamicamente dal gestionale.
const TRIAL_CLASS_SCHEDULE = {
  crossfit: {
    lunedi: ["09:00", "12:45", "17:30", "18:30", "19:30"],
    mercoledi: ["09:00", "12:45", "17:30", "18:30", "19:30"],
    venerdi: ["09:00", "12:45", "17:30", "18:30", "19:30"],
  },
  hyrox: {
    martedi: ["07:15", "09:00", "12:45", "17:30", "18:30", "19:30"],
    giovedi: ["07:15", "09:00", "12:45", "17:30", "18:30", "19:30"],
  },
};

const GENERIC_AVAILABILITY = {
  mattina: "Mattina",
  pausa_pranzo: "Pausa pranzo",
  pomeriggio: "Pomeriggio",
  sera: "Sera",
  flessibile: "Sono flessibile",
};

const DAY_LABELS = {
  lunedi: "Lunedì",
  martedi: "Martedì",
  mercoledi: "Mercoledì",
  giovedi: "Giovedì",
  venerdi: "Venerdì",
  sabato: "Sabato",
};

// ══════════════════════════════════════════════════════════════
//  PAYLOAD BUILDER
//  Struttura dati pulita e pronta per qualsiasi provider futuro.
// ══════════════════════════════════════════════════════════════

function buildBookingPayload(formType, form) {
  const base = {
    source:         "website",
    page:           "prenota-prova.html",
    privacyConsent: !!form.querySelector('input[name="privacy"]')?.checked,
    createdAt:      new Date().toISOString(),
  };

  if (formType === "trial") {
    const classLabel = getVal(form, "preferred-class-label");
    return {
      ...base,
      type:                "trial",
      status:              "trial_request",
      trialType:           getRadio(form, "tipo-prova"),
      fullName:            getVal(form, "nome"),
      phone:               getVal(form, "whatsapp"),
      email:               getVal(form, "email"),
      level:               getRadio(form, "livello"),
      goal:                getRadio(form, "obiettivo"),
      preferredDiscipline: getVal(form, "preferred-discipline"),
      preferredDay:        getVal(form, "preferred-day"),
      preferredTime:       getVal(form, "preferred-time"),
      preferredClassLabel: classLabel,
      preferredClassId:    slugify(classLabel),
      availabilityPreference: getVal(form, "availability-preference"),
      preferredDate:       "",   // future: aggiungere date picker
      injuries:            getRadio(form, "infortuni"),
      notes:               getVal(form, "note"),
      acquisitionSource:   getRadio(form, "provenienza"),
    };
  }

  if (formType === "dropin") {
    return {
      ...base,
      type:          "dropin",
      status:        "dropin_request",
      fullName:      getVal(form, "nome"),
      phone:         getVal(form, "whatsapp"),
      email:         getVal(form, "email"),
      origin:        getVal(form, "provenienza"),
      experience:    getRadio(form, "esperienza"),
      preferredDate: getVal(form, "data"),
      preferredTime: getRadio(form, "fascia-oraria"),
      desiredClass:  getRadio(form, "tipo-classe"),
      people:        getVal(form, "persone"),
      notes:         getVal(form, "note"),
    };
  }

  return base;
}

function normalizeLeadDiscipline(value) {
  const disciplineMap = {
    "CrossFit": "crossfit",
    "HYROX": "HYROX",
    "Functional Fit": "functional_fit",
    "Drop-in": "Drop-in",
    "Altro": "Altro",
    "Consigliatemi voi": "Altro",
    "unsure": "Altro",
    "crossfit": "crossfit",
    "hyrox": "HYROX",
    "functional_fit": "functional_fit",
  };
  return disciplineMap[value] || "Altro";
}

function normalizeAcquisitionSourceForHubSpot(value) {
  const sourceMap = {
    "Instagram": "Instagram",
    "Google": "Ricerca Google",
    "Ricerca Google": "Ricerca Google",
    "Già cliente / conosco il box": "Già cliente / conosco il box",
    "Gia cliente / conosco il box": "Già cliente / conosco il box",
    "Evento": "Evento",
    "Evento / gara": "Evento",
    "Passaparola": "Passaparola",
    "Altro": "Altro",
  };
  return sourceMap[value] || "Altro";
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    nome: parts[0] || "",
    cognome: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function getRomeParts(date = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: ROME_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
}

function getRomeOffsetMinutes(date) {
  const parts = getRomeParts(date);
  const utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((utcTime - date.getTime()) / 60000);
}

function romeDateTimeToUtc(year, month, day, hour, minute) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const firstOffset = getRomeOffsetMinutes(utcGuess);
  const firstUtc = new Date(utcGuess.getTime() - firstOffset * 60000);
  const finalOffset = getRomeOffsetMinutes(firstUtc);
  return new Date(utcGuess.getTime() - finalOffset * 60000);
}

function formatRomeIso(date) {
  const parts = getRomeParts(date);
  const offset = getRomeOffsetMinutes(date);
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMinutes = String(absOffset % 60).padStart(2, "0");
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:00${sign}${offsetHours}:${offsetMinutes}`;
}

function getRomeTodayDate() {
  const now = getRomeParts();
  return new Date(Date.UTC(now.year, now.month - 1, now.day));
}

function formatCalendarDateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getCalendarDateParts(date) {
  const day = DAY_KEYS[date.getUTCDay()];
  const month = date.getUTCMonth() + 1;
  const dayOfMonth = date.getUTCDate();
  return {
    day,
    dayLabel: DAY_LABELS[day],
    dateKey: formatCalendarDateKey(date),
    shortDate: `${String(dayOfMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    fullDate: `${String(dayOfMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}/${date.getUTCFullYear()}`,
  };
}

function buildClassSlot(date, time) {
  const [hour, minute] = time.split(":").map(Number);
  const start = romeDateTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute);
  const end = new Date(start.getTime() + 60 * 60000);
  return {
    time,
    startIso: formatRomeIso(start),
    endIso: formatRomeIso(end),
    isFuture: start.getTime() > Date.now(),
  };
}

function getCalendarDisciplines(discipline) {
  if (discipline === "unsure") return ["crossfit", "hyrox"];
  return discipline ? [discipline] : [];
}

function getTrialCalendarOptions(discipline) {
  const today = getRomeTodayDate();
  const options = [];
  getCalendarDisciplines(discipline).forEach(calendarDiscipline => {
    for (let i = 0; i < 14; i += 1) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
      const dateParts = getCalendarDateParts(date);
      const times = TRIAL_CLASS_SCHEDULE[calendarDiscipline]?.[dateParts.day] || [];
      const slots = times.map(time => buildClassSlot(date, time)).filter(slot => slot.isFuture);
      if (!slots.length) continue;
      options.push({
        ...dateParts,
        discipline: calendarDiscipline,
        disciplineLabel: calendarDiscipline === "crossfit" ? "CrossFit" : "HYROX",
        slots,
      });
    }
  });
  return options.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.discipline.localeCompare(b.discipline));
}

function buildMakeTrialPayload(form) {
  const fullName = splitFullName(getVal(form, "nome"));
  const disciplineLabel = getRadio(form, "tipo-prova") || getVal(form, "preferred-discipline");
  const level = getRadio(form, "livello");
  const goal = getRadio(form, "obiettivo");
  const limitations = getRadio(form, "infortuni");
  const source = getRadio(form, "provenienza");
  const hubSpotSource = normalizeAcquisitionSourceForHubSpot(source);
  const notes = getVal(form, "note");
  const classLabel = getVal(form, "preferred-class-label");
  const calendarStart = getVal(form, "calendar-start");
  const calendarEnd = getVal(form, "calendar-end");
  const readableTrialDate = classLabel || "";
  const message = [
    `Prova richiesta: ${disciplineLabel || ""}`,
    `Livello: ${level || ""}`,
    `Obiettivo: ${goal || ""}`,
    `Data e ora prova: ${readableTrialDate}`,
    `Limitazioni: ${limitations || ""}`,
    `Note: ${notes}`,
    `Come ci ha trovato: ${source || ""}`,
  ].join("\n");

  return {
    firstname: fullName.nome,
    lastname: fullName.cognome,
    email: getVal(form, "email"),
    phone: getVal(form, "whatsapp"),
    interesse_principale: normalizeLeadDiscipline(disciplineLabel),
    livello_dichiarato: level,
    obiettivo: goal,
    data_e_ora_prova: calendarStart,
    calendar_start: calendarStart,
    calendar_end: calendarEnd,
    limitazioni: limitations,
    come_ci_ha_trovato: hubSpotSource,
    message,
    consenso_privacy: !!form.querySelector('input[name="privacy"]')?.checked,
    fonte_lead: "Sito IL COVO",
    stato_lead_covo: "Nuovo lead",
  };
}

function buildMakeDropinPayload(form) {
  const fullName = splitFullName(getVal(form, "nome"));
  const email = getVal(form, "email");
  const phone = getVal(form, "whatsapp");
  const origin = getVal(form, "provenienza");
  const experience = getRadio(form, "esperienza");
  const preferredDate = getVal(form, "data");
  const preferredTime = getRadio(form, "fascia-oraria");
  const desiredClass = getRadio(form, "tipo-classe");
  const notes = getVal(form, "note");
  const preferredSlot = [preferredDate, preferredTime, desiredClass].filter(Boolean).join(" · ");
  const message = [
    "Richiesta: Drop-in",
    `Nome: ${getVal(form, "nome")}`,
    `Telefono: ${phone}`,
    `Email: ${email}`,
    `Da dove vieni: ${origin}`,
    `Esperienza: ${experience}`,
    `Data preferita: ${preferredSlot}`,
    `Note: ${notes}`,
    "Fonte: Sito IL COVO",
  ].join("\n");

  return {
    firstname: fullName.nome,
    lastname: fullName.cognome,
    email,
    phone,
    interesse_principale: "Drop-in",
    livello_dichiarato: experience,
    obiettivo: "Drop-in",
    fascia_oraria_preferita: preferredSlot,
    data_e_ora_prova: "",
    limitazioni: notes,
    come_ci_ha_trovato: "Altro",
    message,
    consenso_privacy: !!form.querySelector('input[name="privacy"]')?.checked,
    fonte_lead: "Sito IL COVO",
    stato_lead_covo: "Nuovo lead",
    tipo_richiesta: "drop_in",
  };
}

async function submitMakeLead(payload) {
  const response = await fetch(MAKE_TRIAL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Make webhook error ${response.status}`);
  return response;
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT BOOKING
//  Questa funzione sarà collegata al sistema prenotazioni.
//  Priorità: TIMP → sistema interno → manuale
// ══════════════════════════════════════════════════════════════

async function submitBooking(payload) {

  // ── TIMP ──────────────────────────────────────────────────
  if (BOOKING_PROVIDER === "timp" && INTEGRATIONS.timp.enabled && INTEGRATIONS.timp.apiBaseUrl) {
    // TODO: implementare quando avremo credenziali e documentazione TIMP
    // Esempio struttura futura:
    // const res = await fetch(`${INTEGRATIONS.timp.apiBaseUrl}/bookings`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    // if (res.ok) return { status: "booked", provider: "timp" };
    console.info("[IL COVO] TIMP: configurato ma non ancora implementato.");
  }

  // ── SISTEMA INTERNO ───────────────────────────────────────
  if (BOOKING_PROVIDER === "internal") {
    // TODO: collegare al futuro Gestionale BOX CrossFit
    console.info("[IL COVO] Internal booking: non ancora implementato.");
  }

  // ── TRAINOS ──────────────────────────────────────────────
  if (INTEGRATIONS.trainos.enabled && INTEGRATIONS.trainos.endpoint) {
    // TODO: implementare integrazione Trainos
    console.info("[IL COVO] Trainos: configurato ma non ancora implementato.");
  }

  // ── FALLBACK ─────────────────────────────────────────────
  return { status: "manual_required", provider: "manual" };
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT TO CRM
//  Questa funzione sarà collegata al futuro Gestionale BOX CrossFit.
//  Fire-and-forget: non blocca il flusso prenotazione.
// ══════════════════════════════════════════════════════════════

async function submitToCRM(payload) {
  if (
    CRM_PROVIDER !== "internal" ||
    !INTEGRATIONS.crm.enabled   ||
    !INTEGRATIONS.crm.endpoint
  ) {
    return false; // nessun CRM configurato
  }
  try {
    const res = await fetch(INTEGRATIONS.crm.endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("CRM HTTP " + res.status);
    console.info("[IL COVO] Lead inviato al CRM:", payload.type);
    return true;
  } catch (err) {
    console.warn("[IL COVO] CRM non raggiungibile:", err.message);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT PAYMENT INTENT
//  Questa funzione sarà collegata al provider pagamenti.
//  Placeholder — non fa chiamate reali finché payments.enabled = false.
// ══════════════════════════════════════════════════════════════

async function submitPaymentIntent(payload) {
  if (!INTEGRATIONS.payments.enabled || !INTEGRATIONS.payments.provider) {
    // Nessun provider pagamenti configurato
    return { status: "skipped" };
  }

  // TODO: implementare in base al provider scelto
  // if (PAYMENT_PROVIDER === "stripe") { ... }
  // if (PAYMENT_PROVIDER === "satispay") { ... }
  // if (PAYMENT_PROVIDER === "nexi") { ... }
  // if (PAYMENT_PROVIDER === "timp") { ... }

  console.info("[IL COVO] Payment intent: provider configurato ma non implementato.");
  return { status: "pending" };
}

// ══════════════════════════════════════════════════════════════
//  FALLBACK CONTACT — WhatsApp (temporaneo)
//  Usato solo quando nessun provider è attivo.
//  Non deve essere il flusso principale comunicato all'utente.
// ══════════════════════════════════════════════════════════════

function fallbackContact(payload) {
  const msg = payload.type === "trial" ? buildWaMessageTrial(payload) : "";
  const url = buildWhatsAppUrl(msg);
  window.open(url, "_blank");
  return url;
}

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setDropinWhatsAppCta(form, successEl) {
  const whatsappNote = successEl.querySelector(".booking-success-wa");
  const whatsappButton = successEl.querySelector(".booking-success-wa-link");
  if (!whatsappNote || !whatsappButton) return;

  const fullName = getVal(form, "nome");
  const preferredDate = getVal(form, "data");
  const preferredTime = getRadio(form, "fascia-oraria");
  const desiredClass = getRadio(form, "tipo-classe");
  const preferredSlot = [preferredDate, preferredTime, desiredClass].filter(Boolean).join(" - ");
  const whatsappMessage = `Ciao IL COVO, sono ${fullName}.
Ho appena inviato una richiesta drop-in dal sito.
Sarei interessato a fare un drop-in il giorno/fascia: ${preferredSlot}.
Potete confermarmi disponibilita e orario?`;

  whatsappNote.textContent = "";
  whatsappButton.textContent = "Scrivi su WhatsApp";
  whatsappButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
  whatsappNote.appendChild(whatsappButton);
  whatsappNote.hidden = false;
}
function buildWaMessageTrial(p) {
  return (
`Ciao IL COVO, vorrei richiedere una prova gratuita.

Nome: ${p.fullName || "—"}
WhatsApp: ${p.phone || "—"}
Email: ${p.email || "—"}
Tipo prova: ${p.trialType || "—"}
Livello: ${p.level || "—"}
Obiettivo: ${p.goal || "—"}
Giorno scelto: ${p.preferredDay ? DAY_LABELS[p.preferredDay] : "—"}
Orario scelto: ${p.preferredTime || "—"}
Classe preferita: ${p.preferredClassLabel || "—"}
Fascia preferita: ${p.availabilityPreference ? GENERIC_AVAILABILITY[p.availabilityPreference] : "—"}
Infortuni / limitazioni: ${p.injuries || "—"}
Come vi ho trovato: ${p.acquisitionSource || "—"}
Note: ${p.notes || "—"}`
  );
}

// ══════════════════════════════════════════════════════════════
//  SUCCESS STATE
// ══════════════════════════════════════════════════════════════

function showSuccess(successEl, waUrl) {
  const section = successEl.closest(".booking-form-section");
  const formEl  = section.querySelector("form");
  if (formEl) formEl.hidden = true;
  successEl.hidden = false;

  const waNote = successEl.querySelector(".booking-success-wa");
  const waLink = successEl.querySelector(".booking-success-wa-link");
  if (waNote) waNote.hidden = !waUrl;
  if (waLink && waUrl) waLink.href = waUrl;

  setTimeout(() => successEl.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
}

// ══════════════════════════════════════════════════════════════
//  CARD SELECTION
// ══════════════════════════════════════════════════════════════

const bookingCards = document.querySelectorAll(".booking-card");

bookingCards.forEach(card => {
  card.addEventListener("click", () => selectCard(card, true));
  card.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const currentIndex = Array.from(bookingCards).indexOf(card);
    const nextCard = bookingCards[(currentIndex + direction + bookingCards.length) % bookingCards.length];
    selectCard(nextCard, true);
    nextCard.focus();
  });
});

function scrollToForm(section) {
  const header = document.getElementById("nav");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function selectCard(card, shouldScroll = false) {
  const type = card.dataset.type;
  bookingCards.forEach(c => {
    const isActive = c === card;
    c.classList.toggle("is-active", isActive);
    c.classList.toggle("is-inactive", !isActive);
    c.setAttribute("aria-selected", String(isActive));
    c.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll(".booking-form-section").forEach(s => { s.hidden = true; });
  const section = document.getElementById("form-" + type);
  if (!section) return;
  section.hidden = false;
  if (shouldScroll) setTimeout(() => scrollToForm(section), 60);
}

// ══════════════════════════════════════════════════════════════
//  SELETTORE CLASSE PROVA
// ══════════════════════════════════════════════════════════════

const trialForm = document.getElementById("booking-form-prova");
const tipoProvaInputs = trialForm.querySelectorAll('input[name="tipo-prova"]');
const classPicker = document.getElementById("booking-class-picker");
const classSummary = document.getElementById("booking-class-summary");
const classModify = document.getElementById("booking-class-modify");
const classField = document.getElementById("prova-orario-field");
const classError = document.getElementById("prova-orario-error");
const classDialogBackdrop = document.getElementById("trial-class-dialog");
const classDialog = classDialogBackdrop.querySelector(".booking-dialog");
const classDialogTitle = document.getElementById("trial-class-dialog-title");
const classDialogDesc = document.getElementById("trial-class-dialog-desc");
const classDialogOptions = document.getElementById("trial-class-dialog-options");
const classDialogClose = classDialogBackdrop.querySelector(".booking-dialog-close");
let selectedDialogDay = "";
let classDialogTrigger = null;

function getTrialDiscipline() {
  const selected = getRadio(trialForm, "tipo-prova");
  if (selected === "CrossFit") return "crossfit";
  if (selected === "HYROX") return "hyrox";
  if (selected === "Consigliatemi voi") return "unsure";
  return "";
}

function setHidden(name, value) {
  let input = trialForm.querySelector(`[name="${name}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    trialForm.appendChild(input);
  }
  if (input) input.value = value;
}

function clearTrialClassSelection() {
  ["preferred-discipline", "preferred-day", "preferred-time", "preferred-class-label", "calendar-start", "calendar-end", "availability-preference"]
    .forEach(name => setHidden(name, ""));
  selectedDialogDay = "";
  classSummary.textContent = "Scegli giorno e orario";
  classModify.hidden = true;
  classPicker.classList.remove("has-value");
}

function updateTrialClassSummary(summary) {
  classSummary.textContent = summary;
  classModify.hidden = false;
  classPicker.classList.add("has-value");
  classField.classList.remove("has-error");
}

function chooseClassSlot(option, slot) {
  const label = `${option.disciplineLabel} · ${option.dayLabel} ${option.fullDate} · ${slot.time}`;
  setHidden("preferred-discipline", option.discipline);
  setHidden("preferred-day", option.dateKey);
  setHidden("preferred-time", slot.time);
  setHidden("preferred-class-label", label);
  setHidden("calendar-start", slot.startIso);
  setHidden("calendar-end", slot.endIso);
  setHidden("availability-preference", "");
  selectedDialogDay = option.dateKey;
  updateTrialClassSummary(`${option.dayLabel.toUpperCase()} ${option.shortDate} · ${slot.time}`);
  closeClassDialog();
}

function chooseAvailability(value) {
  setHidden("preferred-discipline", "unsure");
  setHidden("preferred-day", "");
  setHidden("preferred-time", "");
  setHidden("preferred-class-label", "");
  setHidden("calendar-start", "");
  setHidden("calendar-end", "");
  setHidden("availability-preference", value);
  updateTrialClassSummary(GENERIC_AVAILABILITY[value].toUpperCase());
  closeClassDialog();
}

function renderClassTimes(option) {
  const selectedTime = getVal(trialForm, "preferred-time");
  if (!option) return "";
  return `<div class="booking-dialog-slots" aria-label="Scegli orario">${option.slots.map(slot => `
    <button type="button" aria-pressed="${selectedTime === slot.time && getVal(trialForm, "preferred-day") === option.dateKey}" class="booking-dialog-option${selectedTime === slot.time && getVal(trialForm, "preferred-day") === option.dateKey ? " is-selected" : ""}" data-time="${slot.time}">
      ${slot.time}
    </button>`).join("")}</div>`;
}

function renderClassDialog() {
  const discipline = getTrialDiscipline();
  classDialogTitle.textContent = "Scegli la tua classe";
  classDialogDesc.textContent = "Seleziona prima il giorno e poi l’orario che preferisci.";
  const options = getTrialCalendarOptions(discipline);
  const savedDay = getVal(trialForm, "preferred-day");
  selectedDialogDay = options.some(option => option.dateKey === selectedDialogDay) ? selectedDialogDay : savedDay || "";
  const selectedOption = options.find(option => option.dateKey === selectedDialogDay);
  classDialogOptions.innerHTML = `
    <div class="booking-dialog-days" role="tablist" aria-label="Scegli giorno">
      ${options.map(option => `<button type="button" role="tab" aria-selected="${option.dateKey === selectedDialogDay}" class="booking-dialog-day${option.dateKey === selectedDialogDay ? " is-selected" : ""}" data-day="${option.dateKey}" data-discipline="${option.discipline}">${option.dayLabel.toUpperCase()} ${option.shortDate}</button>`).join("")}
    </div>
    ${selectedOption ? renderClassTimes(selectedOption) : ""}`;
}

function openClassDialog() {
  const discipline = getTrialDiscipline();
  if (!discipline) {
    const disciplineField = tipoProvaInputs[0].closest(".booking-field");
    disciplineField.classList.add("has-error");
    tipoProvaInputs[0].focus();
    return;
  }
  classDialogTrigger = document.activeElement;
  renderClassDialog();
  classDialogBackdrop.hidden = false;
  document.body.classList.add("booking-dialog-open");
  classDialogClose.focus();
}

function closeClassDialog() {
  if (classDialogBackdrop.hidden) return;
  classDialogBackdrop.hidden = true;
  document.body.classList.remove("booking-dialog-open");
  if (classDialogTrigger) classDialogTrigger.focus();
}

classPicker.addEventListener("click", openClassDialog);
classDialogClose.addEventListener("click", closeClassDialog);
classDialogBackdrop.addEventListener("click", event => {
  if (event.target === classDialogBackdrop) closeClassDialog();
});
classDialogOptions.addEventListener("click", event => {
  const dayButton = event.target.closest("[data-day]");
  const timeButton = event.target.closest("[data-time]");
  const availabilityButton = event.target.closest("[data-availability]");
  if (dayButton) {
    selectedDialogDay = dayButton.dataset.day;
    renderClassDialog();
    classDialogOptions.querySelector(`[data-day="${selectedDialogDay}"]`)?.focus();
  } else if (timeButton) {
    const option = getTrialCalendarOptions(getTrialDiscipline()).find(item => item.dateKey === selectedDialogDay);
    const slot = option?.slots.find(item => item.time === timeButton.dataset.time);
    if (option && slot) chooseClassSlot(option, slot);
  } else if (availabilityButton) {
    chooseAvailability(availabilityButton.dataset.availability);
  }
});
document.addEventListener("keydown", event => {
  if (classDialogBackdrop.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeClassDialog();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = Array.from(classDialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

tipoProvaInputs.forEach(radio => {
  radio.addEventListener("change", () => {
    clearTrialClassSelection();
    setHidden("preferred-discipline", getTrialDiscipline());
    radio.closest(".booking-field").classList.remove("has-error");
  });
});

function applyBookingQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const discipline = params.get("discipline")?.toLowerCase();
  const cardType = type === "dropin" ? "dropin" : type === "trial" ? "prova" : null;

  if (discipline === "crossfit" || discipline === "hyrox") {
    const value = discipline === "crossfit" ? "CrossFit" : "HYROX";
    const radio = document.querySelector(`input[name="tipo-prova"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  if (cardType) {
    const card = document.querySelector(`.booking-card[data-type="${cardType}"]`);
    if (card) selectCard(card, true);
  }
}

applyBookingQueryParams();

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════

function getVal(form, name) {
  const el = form.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : "";
}
function getRadio(form, name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}
function slugify(str) {
  return (str || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ══════════════════════════════════════════════════════════════
//  VALIDATION
// ══════════════════════════════════════════════════════════════

function validateForm(form) {
  let valid = true;

  form.querySelectorAll('input[required]:not([type="checkbox"]):not([type="radio"]), textarea[required]').forEach(input => {
    const field = input.closest(".booking-field");
    if (!input.value.trim()) { field.classList.add("has-error"); valid = false; }
    else field.classList.remove("has-error");
  });

  form.querySelectorAll('.booking-radio-group[data-required="true"]').forEach(group => {
    const field    = group.closest(".booking-field");
    const hasValue = group.querySelectorAll("input:checked").length > 0;
    if (!hasValue) { field.classList.add("has-error"); valid = false; }
    else field.classList.remove("has-error");
  });

  const privacy = form.querySelector('input[name="privacy"]');
  if (privacy) {
    const field = privacy.closest(".booking-field");
    if (!privacy.checked) { field.classList.add("has-error"); valid = false; }
    else field.classList.remove("has-error");
  }

  if (form.id === "booking-form-prova") {
    const discipline = getTrialDiscipline();
    const hasClassSlot = !!getVal(form, "preferred-day") && !!getVal(form, "preferred-time");
    const hasValidPreference = !!discipline && hasClassSlot;
    classError.textContent = "Seleziona il giorno e l'orario della prova.";
    classField.classList.toggle("has-error", !hasValidPreference);
    if (!hasValidPreference) valid = false;
  }

  return valid;
}

function showFormError(form) {
  form.querySelector(".booking-form-error").hidden = false;
  const first = form.querySelector(".has-error");
  if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ══════════════════════════════════════════════════════════════
//  FORM SUBMIT — orchestrazione principale
// ══════════════════════════════════════════════════════════════

async function handleSubmit(formType, form) {
  if (!validateForm(form)) { showFormError(form); return; }
  const formError = form.querySelector(".booking-form-error");
  formError.hidden = true;

  const btn = form.querySelector("button[type=submit]");
  const originalButtonText = btn.textContent;
  btn.disabled    = true;
  btn.textContent = "Invio in corso…";

  const payload   = buildBookingPayload(formType, form);
  const successEl = form.closest(".booking-form-section").querySelector(".booking-success");

  // CRM in background — non blocca il flusso
  if (formType === "trial") {
    try {
      await submitMakeLead(buildMakeTrialPayload(form));
      window.ilCovoTrack?.("Lead", {
        content_name: "Prenotazione prova",
        content_category: getRadio(form, "tipo-prova") || "Prova"
      });
      const successText = successEl.querySelector(".booking-success-text");
      if (successText) successText.textContent = "Richiesta inviata. Ti contatteremo a breve.";
      showSuccess(successEl, null);
    } catch (err) {
      console.warn("[IL COVO] Invio Make fallito:", err.message);
      formError.textContent = "Errore nell’invio. Riprova tra poco o contattaci su WhatsApp.";
      formError.hidden = false;
      btn.disabled = false;
      btn.textContent = originalButtonText;
    }
    return;
  }

  if (formType === "dropin") {
    try {
      await submitMakeLead(buildMakeDropinPayload(form));
      const successText = successEl.querySelector(".booking-success-text");
      if (successText) successText.textContent = "Richiesta drop-in ricevuta. Scrivici su WhatsApp per concordare l\u2019orario.";
      showSuccess(successEl, null);
      setDropinWhatsAppCta(form, successEl);
    } catch (err) {
      console.warn("[IL COVO] Invio Drop-in Make fallito:", err.message);
      formError.textContent = "Errore nell’invio. Riprova tra poco o contattaci su WhatsApp.";
      formError.hidden = false;
      btn.disabled = false;
      btn.textContent = originalButtonText;
    }
    return;
  }

  submitToCRM(payload).catch(() => {});

  // Payment intent (placeholder — nessuna chiamata reale finché payments.enabled = false)
  await submitPaymentIntent(payload).catch(() => {});

  // Prova il booking provider configurato
  const result = await submitBooking(payload);

  if (result.status === "manual_required") {
    // Nessun provider attivo → fallback WhatsApp
    const waUrl = fallbackContact(payload);
    showSuccess(successEl, waUrl);
  } else {
    showSuccess(successEl, null);
  }
}

document.getElementById("booking-form-prova").addEventListener("submit", function(e) {
  e.preventDefault();
  handleSubmit("trial", this);
});

document.getElementById("booking-form-dropin").addEventListener("submit", function(e) {
  e.preventDefault();
  handleSubmit("dropin", this);
});
