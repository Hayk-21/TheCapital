import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BookingsTable } from "@/components/admin/BookingsTable";

export const metadata: Metadata = { title: "Заявки — The Capital" };

export default async function BookingsPage() {
  const bookings = await db.booking.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return (
    <>
      <h1 className="adm-title">Заявки на бронь</h1>
      <p className="adm-sub">
        Приходят с формы на странице «Контакты». Показаны последние 200.
      </p>

      {bookings.length === 0 ? (
        <div className="adm-card">
          <span className="adm-hint">Заявок пока нет.</span>
        </div>
      ) : (
        <BookingsTable
          bookings={bookings.map((b) => ({
            id: b.id,
            name: b.name,
            phone: b.phone,
            date: b.date,
            time: b.time,
            guests: b.guests,
            seating: b.seating,
            note: b.note,
            lang: b.lang,
            status: b.status,
            adminNote: b.adminNote,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      )}
    </>
  );
}
