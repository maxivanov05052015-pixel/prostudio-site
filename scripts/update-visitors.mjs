// Обновляет visitors.json данными из Яндекс.Метрики (счётчик 113954543).
// Запускается GitHub Actions по расписанию; METRIKA_TOKEN берётся из секретов.
import { writeFileSync } from "node:fs";

const T = process.env.METRIKA_TOKEN;
const ID = 113954543;
const h = { Authorization: "OAuth " + T };

const d = new Date();
const today = d.toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";
const get = (u) => fetch(u, { headers: h }).then(r => r.json());

(async () => {
  const sDay = await get(
    `https://api-metrika.yandex.net/stat/v1/data?id=${ID}&metrics=ym%3As%3Avisits%2Cym%3As%3Ausers&date1=${today}&date2=${today}&timezone=Europe/Moscow`
  );
  const sMonth = await get(
    `https://api-metrika.yandex.net/stat/v1/data?id=${ID}&metrics=ym%3As%3Avisits%2Cym%3As%3Ausers&date1=${monthStart}&date2=${today}&timezone=Europe/Moscow`
  );
  const out = {
    updated: new Date().toISOString(),
    day: { visits: Math.round(sDay.totals?.[0] ?? 0), users: Math.round(sDay.totals?.[1] ?? 0) },
    month: { visits: Math.round(sMonth.totals?.[0] ?? 0), users: Math.round(sMonth.totals?.[1] ?? 0) },
  };
  writeFileSync("visitors.json", JSON.stringify(out, null, 2) + "\n");
  console.log("visitors.json:", JSON.stringify(out));
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
