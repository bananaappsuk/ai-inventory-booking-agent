import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { useNavigate } from "react-router-dom";
import { calendarApi } from "../../api/calendar.api";
import type { Session } from "../../types";

function toEventInput(b: {
  id: string;
  title: string;
  eventDate: string;
  session: Session;
  status: string;
  ownerName: string;
}): EventInput {
  return {
    id: b.id,
    title: `${b.title} (${b.session}) - ${b.ownerName}`,
    start: b.eventDate,
    allDay: true,
    classNames: [`status-${b.status}`]
  };
}

export function BookingCalendar({ editable }: { editable: boolean }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const sessionByEventId = useRef<Map<string, Session>>(new Map());

  const fetchEvents = useCallback(
    async (fetchInfo: { startStr: string; endStr: string }, successCallback: (events: EventInput[]) => void) => {
      const bookings = await calendarApi.list(fetchInfo.startStr, fetchInfo.endStr);
      bookings.forEach((b) => sessionByEventId.current.set(b.id, b.session));
      successCallback(bookings.map(toEventInput));
    },
    []
  );

  async function handleEventDrop(info: EventDropArg) {
    const newDate = info.event.startStr.slice(0, 10);
    const session = sessionByEventId.current.get(info.event.id) ?? "AM";
    try {
      await calendarApi.move(info.event.id, newDate, session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule booking");
      info.revert();
    }
  }

  function handleEventClick(info: EventClickArg) {
    navigate(`/bookings/${info.event.id}`);
  }

  return (
    <div className="booking-calendar">
      {error && <p className="error-text">{error}</p>}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={editable}
        events={fetchEvents}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  );
}
