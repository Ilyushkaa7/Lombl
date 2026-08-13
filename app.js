const routeLengths = [7, 10, 14, 21, 30];
const featuredDays = new Set([21, 22, 23, 24, 30]);

const elements = {
  routeButtons: document.querySelector("#routeButtons"),
  routeHint: document.querySelector("#routeHint"),
  missions: document.querySelector("#missions"),
  missionDialog: document.querySelector("#missionDialog"),
  missionDetail: document.querySelector("#missionDetail"),
  photoDialog: document.querySelector("#photoDialog")
};

let program;
let activeRoute = 30;

function loadProgram() {
  const data = window.PROGRAM_DATA;

  if (!data) {
    throw new Error("Файл программы не загрузился");
  }
  program = {
    routes: data.routes,
    missions: data.missions.map(([day, title, type, summary, skill, details = {}]) => ({
      day,
      title,
      type,
      summary,
      skill,
      details: {
        ...data.details,
        ...details,
        result: (details.result || data.details.result).replace("{skill}", skill)
      }
    }))
  };
  createRouteButtons();
  renderRouteButtons();
  renderMissions();
}

function createRouteButtons() {
  routeLengths.forEach((length) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${length} дней`;
    button.addEventListener("click", () => selectRoute(length));
    elements.routeButtons.append(button);
  });
}

function selectRoute(length) {
  activeRoute = length;
  renderRouteButtons();
  renderMissions();
}

function renderRouteButtons() {
  [...elements.routeButtons.children].forEach((button, index) => {
    button.classList.toggle("active", routeLengths[index] === activeRoute);
  });

  const count = program.routes[String(activeRoute)].length;
  elements.routeHint.textContent = `Маршрут на ${activeRoute} дней: ${count} завершённых миссий с финалом.`;
}

function renderMissions() {
  const route = program.routes[String(activeRoute)];
  const visibleMissions = program.missions.filter((mission) => route.includes(mission.day));

  elements.missions.innerHTML = visibleMissions.length
    ? visibleMissions.map(createMissionCard).join("")
    : "<p>Миссий по этому фильтру не найдено.</p>";

  document.querySelectorAll(".mission").forEach((card) => {
    const open = () => openMission(Number(card.dataset.day));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open();
    });
  });
}

function createMissionCard(mission) {
  const featuredClass = featuredDays.has(mission.day) ? "featured" : "";
  const number = String(mission.day).padStart(2, "0");

  return `
    <article class="mission ${featuredClass}" data-day="${mission.day}" tabindex="0">
      <div class="top">
        <span class="number">Миссия ${number}</span>
        <span class="tag">${mission.type}</span>
      </div>
      <h3>${mission.title}</h3>
      <p>${mission.summary}</p>
    </article>`;
}

function openMission(day) {
  const mission = program.missions.find((item) => item.day === day);
  const detail = mission.details;

  elements.missionDetail.innerHTML = `
    <p class="eyebrow">Миссия ${String(day).padStart(2, "0")} · ${mission.type}</p>
    <h2>${mission.title}</h2>
    <p>${mission.summary}</p>
    <h3>Результат занятия</h3>
    <p>${detail.result}</p>
    <h3>Подготовка преподавателя накануне</h3>
    ${makeList(detail.preparation)}
    <h3>Сценарий занятия</h3>
    ${makeList(detail.schedule, "ol")}
    <h3>Расширение занятия</h3>
    <p>${detail.extension}</p>
    <h3>Если техника не работает</h3>
    <p>${detail.fallback}</p>`;

  elements.missionDialog.showModal();
}

function makeList(items, tag = "ul") {
  return `<${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
}

function setupDialogs() {
  document.querySelector("#missionDialog .close").addEventListener("click", () => elements.missionDialog.close());
  document.querySelector("#photoDialog .close").addEventListener("click", () => elements.photoDialog.close());

  [elements.missionDialog, elements.photoDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  document.querySelectorAll(".photo-strip button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.photoDialog.querySelector("img").src = button.dataset.image;
      elements.photoDialog.showModal();
    });
  });
}

setupDialogs();

try {
  loadProgram();
} catch (error) {
  console.error(error);
  elements.missions.innerHTML = "<p>Программа не загрузилась. Обновите страницу.</p>";
}
