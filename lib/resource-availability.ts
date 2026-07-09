import type { Appointment, Resource } from "@/types";

type AvailabilityState = "available" | "busy" | "unavailable";

export type ResourceSlotAvailability = {
  state: AvailabilityState;
  label: string;
  detail: string;
  freeAt?: string;
};

export function getResourceSlotAvailability({
  resource,
  appointments,
  date,
  time,
  duration,
  ignoreAppointmentId
}: {
  resource: Resource;
  appointments: Appointment[];
  date: string;
  time: string;
  duration: number;
  ignoreAppointmentId?: string;
}): ResourceSlotAvailability {
  if (resource.status === "maintenance") {
    return {
      state: "unavailable",
      label: "На обслуживании",
      detail: "Этот ресурс временно нельзя выбрать для записи."
    };
  }

  if (resource.status === "unavailable") {
    return {
      state: "unavailable",
      label: "Недоступен",
      detail: "Ресурс выключен из работы."
    };
  }

  const start = timeToMinutes(time);
  const end = start + Math.max(1, duration);
  const bookings = appointments
    .filter((appointment) =>
      appointment.resourceId === resource.id &&
      appointment.date === date &&
      appointment.id !== ignoreAppointmentId &&
      appointment.status !== "cancelled" &&
      appointment.status !== "noShow"
    )
    .map((appointment) => ({
      start: timeToMinutes(appointment.time),
      end: timeToMinutes(appointment.time) + appointment.duration
    }))
    .sort((first, second) => first.start - second.start);

  const overlaps = bookings.filter((booking) => booking.start < end && booking.end > start);
  if (overlaps.length) {
    const freeAt = minutesToTime(Math.max(...overlaps.map((booking) => booking.end)));
    return {
      state: "busy",
      label: `Занято до ${freeAt}`,
      detail: `На выбранное время есть пересечение. Можно выбрать время после ${freeAt}.`,
      freeAt
    };
  }

  const nextBooking = bookings.find((booking) => booking.start >= end);
  if (resource.status === "busy") {
    return {
      state: "busy",
      label: nextBooking ? `Помечен занят, следующая бронь ${minutesToTime(nextBooking.start)}` : "Помечен занят",
      detail: "Статус ресурса выставлен вручную. Проверьте карточку ресурса перед сохранением."
    };
  }

  return {
    state: "available",
    label: nextBooking ? `Свободно, следующая бронь ${minutesToTime(nextBooking.start)}` : "Свободно весь слот",
    detail: "На выбранное время пересечений нет."
  };
}

export function hasResourceSlotConflict(availability: ResourceSlotAvailability) {
  return availability.state === "busy" || availability.state === "unavailable";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const normalized = Math.max(0, value);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
