import { DateTime } from "luxon";

const ZONE = "Europe/Warsaw";

export type Quarter = { start: DateTime; end: DateTime; label: string };

// Межі календарного кварталу, у якому лежить дата d (час Вроцлава).
function bounds(d: DateTime): Quarter {
  const q = Math.floor((d.month - 1) / 3); // 0..3
  const start = DateTime.fromObject({ year: d.year, month: q * 3 + 1, day: 1 }, { zone: ZONE }).startOf(
    "day",
  );
  return { start, end: start.plus({ months: 3 }), label: `Q${q + 1} ${d.year}` };
}

// Поточний квартал (сезон = календарний квартал).
export function currentQuarter(): Quarter {
  return bounds(DateTime.now().setZone(ZONE));
}

// Попередній (щойно завершений) квартал.
export function prevQuarter(): Quarter {
  return bounds(currentQuarter().start.minus({ days: 1 }));
}
