// ============ заполняем сайт из конфига ============
document.getElementById("brandName").textContent = CONFIG.brand;
document.querySelector(".brandFooter").textContent = CONFIG.brand;
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("contactTg").textContent = CONFIG.contactTg;
document.getElementById("contactLink").href =
  "https://t.me/" + CONFIG.contactTg.replace("@", "");
document.getElementById("botTg").textContent = "@" + CONFIG.botTg;
document.getElementById("botLink").href = "https://t.me/" + CONFIG.botTg;

// Яндекс.Метрика (подключается, если в config.js заполнен metrikaId)
if (CONFIG.metrikaId) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = 1 * new Date();
  window.ym(CONFIG.metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  const noscript = document.createElement("noscript");
  const img = document.createElement("img");
  img.src = "https://mc.yandex.ru/watch/" + CONFIG.metrikaId;
  img.alt = "";
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}

// клик по работе — к форме с выбранной услугой
document.querySelectorAll(".work").forEach(w => {
  w.addEventListener("click", () => {
    if (w.dataset.service) select.value = w.dataset.service;
    document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  });
});

// карточки услуг
const grid = document.getElementById("servicesGrid");
CONFIG.services.forEach(s => {
  const card = document.createElement("div");
  card.className = "service";
  card.innerHTML = `<h3>${s.name}</h3>
    <span class="service__price">${s.price}</span>
    <span class="service__time">${s.time}</span>`;
  card.addEventListener("click", () => {
    select.value = s.id;
    document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  });
  grid.appendChild(card);
});

// выпадающий список услуг
const select = document.getElementById("serviceSelect");
CONFIG.services.forEach(s => {
  const opt = document.createElement("option");
  opt.value = s.id;
  opt.textContent = `${s.name} — ${s.price}`;
  select.appendChild(opt);
});

// ============ отправка заявки ============
const form = document.getElementById("orderForm");
const status = document.getElementById("formStatus");
const FORM_ENDPOINT = "https://maxveta-prostudio.netlify.app/.netlify/functions/send-order";
const btn = document.getElementById("submitBtn");

function showStatus(text, ok) {
  status.hidden = false;
  status.textContent = text;
  status.className = "form__status " + (ok ? "form__status--ok" : "form__status--err");
}

function orderText(data) {
  return `🔔 Новая заявка с сайта ${CONFIG.brand}\n\n` +
    `👤 Имя: ${data.name}\n` +
    `📞 Контакт: ${data.contact}\n` +
    `🛠 Услуга: ${data.serviceName}\n` +
    `⏰ Срок: ${data.deadline}\n` +
    `💰 Бюджет: ${data.budget || "не указан"}\n\n` +
    `📝 Задача:\n${data.details}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);
  const serviceName =
    CONFIG.services.find(s => s.id === fd.get("service"))?.name || fd.get("service");
  const data = {
    name: fd.get("name").trim(),
    contact: fd.get("contact").trim(),
    service: fd.get("service"),
    serviceName,
    details: fd.get("details").trim(),
    deadline: fd.get("deadline"),
    budget: fd.get("budget"),
    date: new Date().toLocaleString("ru-RU"),
  };

  btn.disabled = true;
  btn.textContent = "Отправляем…";
  status.hidden = true;

  try {
    // Заказ отправляется на серверную функцию — она доставит его в Telegram.
    // ВАЖНО: без заголовка Content-Type — тогда браузер не делает CORS-preflight,
    // и заявка уходит даже с другого домена (сервер всё равно парсит JSON).
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) throw new Error(out.error || res.status);
    showStatus("✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.", true);
    form.reset();
  } catch (err) {
    console.error(err);
    showStatus("⚠️ Не удалось отправить заявку автоматически. Напишите нам напрямую в Telegram: @" +
      CONFIG.botTg + " — мы сразу ответим.", false);
  }

  btn.disabled = false;
  btn.textContent = "Отправить заявку";
});
