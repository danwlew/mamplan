import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Download, Mail, Repeat, Share2, MapPin, Users 
} from 'lucide-react';
import { createEvents } from 'ics';
import { 
  format, addMinutes, differenceInMinutes, isBefore, 
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isToday 
} from 'date-fns';

// Jeżeli chcesz polskie nazwy miesięcy i dni tygodnia, odkomentuj i użyj locale: pl
// import { pl } from 'date-fns/locale';

function MonthCalendar({ date }) {
  /**
   * Komponent wyświetlający pojedynczy mini-kalendarz
   * dla przekazanego "date" (Date z dowolnego dnia w miesiącu).
   */
  // Nazwa miesiąca np. "styczeń 2025" (domyślnie po angielsku).
  // Aby mieć polskie nazwy, dodaj { locale: pl } w drugim parametrze:
  // const monthName = format(date, "LLLL yyyy", { locale: pl });
  const monthName = format(date, "LLLL yyyy"); 

  // Wyznaczamy pierwszy i ostatni dzień miesiąca.
  const startOfM = startOfMonth(date);
  const endOfM = endOfMonth(date);

  // Aby zacząć od poniedziałku jako pierwszy dzień tygodnia, ustawiamy weekStartsOn: 1
  const startDisplay = startOfWeek(startOfM, { weekStartsOn: 1 });
  const endDisplay = endOfWeek(endOfM, { weekStartsOn: 1 });

  // Generujemy tablicę wszystkich dni od startDisplay do endDisplay:
  const days = eachDayOfInterval({ start: startDisplay, end: endDisplay });

  // Nazwy dni tygodnia (pn-nd). Możesz zmienić styl/pisownię.
  const dayNames = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

  return (
    <div className="p-2">
      <h3 className="text-center font-semibold mb-2">
        {monthName}
      </h3>
      <table className="border-collapse w-full text-xs">
        <thead>
          <tr>
            {dayNames.map((d) => (
              <th key={d} className="p-1 border text-center font-medium bg-gray-100">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Tworzymy wiersze tygodniowe po 7 dni. */}
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
            const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
            return (
              <tr key={weekIndex}>
                {weekDays.map((day) => {
                  // Czy dany day należy do "głównego" miesiąca (a nie do "szarych" dni poprzedniego/nast. miesiąca)
                  const isCurrentMonth = (day.getMonth() === date.getMonth());
                  // Podświetlamy "dzisiaj" (tylko jeśli jest w tym miesiącu)
                  const highlightToday = isToday(day);

                  return (
                    <td
                      key={day.toISOString()}
                      className={
                        `p-1 border text-center 
                        ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-800'}
                        ${highlightToday ? 'bg-yellow-200 font-semibold' : ''}`
                      }
                    >
                      {format(day, 'd')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ThreeMonthCalendar() {
  /**
   * Komponent wyświetlający 3 miesiące:
   * - Poprzedni
   * - Bieżący (z perspektywy "dzisiaj")
   * - Następny
   */
  const now = new Date();
  const prevMonth = subMonths(now, 1);
  const currMonth = now; // bieżący miesiąc
  const nextMonth = addMonths(now, 1);

  return (
    <div className="flex flex-col md:flex-row justify-around items-start md:items-stretch">
      <MonthCalendar date={prevMonth} />
      <MonthCalendar date={currMonth} />
      <MonthCalendar date={nextMonth} />
    </div>
  );
}

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none');
  const [location, setLocation] = useState('');
  const [timeZone, setTimeZone] = useState('Europe/Warsaw');
  const [contacts, setContacts] = useState('');

  // Zaawansowane
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [advancedRRule, setAdvancedRRule] = useState('');
  const [notificationTime, setNotificationTime] = useState('5');

  const [useEndTime, setUseEndTime] = useState(false);
  const [errors, setErrors] = useState([]);

  // Stan do wyświetlania aktualnego czasu i daty
  const [currentTime, setCurrentTime] = useState(new Date());

  // Odświeżamy "currentTime" raz na 60 sekund (lub co sekundę, jeśli wolisz).
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- Funkcje pomocnicze do planowania wydarzenia --- //

  function calculateDuration() {
    if (!date || !time || !endTime) return 0;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return differenceInMinutes(endDateTime, startDateTime);
  }

  function validateData() {
    const newErrors = [];

    if (!title.trim()) {
      newErrors.push('Tytuł nie może być pusty.');
    }
    if (!date) {
      newErrors.push('Data nie może być pusta.');
    }
    if (!time) {
      newErrors.push('Godzina rozpoczęcia nie może być pusta.');
    }

    // Sprawdź, czy początek nie jest w przeszłości
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      if (isBefore(startDateTime, new Date())) {
        newErrors.push('Data/godzina nie może być w przeszłości.');
      }
    }

    // Proste sprawdzenie e-maili w polu contacts
    if (contacts.trim()) {
      const contactList = contacts.split(',').map((c) => c.trim());
      contactList.forEach((c) => {
        if (!c.includes('@')) {
          newErrors.push(`Niepoprawny format w polu uczestników/adresów: "${c}"`);
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  function parseContacts() {
    // Zwracamy obiekt: { emails: string[], attendees: Attendee[] }
    const emailsArr = [];
    const attendeesArr = [];

    if (!contacts.trim()) {
      return { emails: emailsArr, attendees: attendeesArr };
    }

    const contactList = contacts.split(',').map((c) => c.trim());
    contactList.forEach((c) => {
      const parts = c.split(' ');
      const maybeEmail = parts[parts.length - 1];
      if (maybeEmail.includes('@')) {
        const email = maybeEmail;
        const name = parts.slice(0, parts.length - 1).join(' ');
        emailsArr.push(email);
        attendeesArr.push({ name: name || '', email });
      } else {
        // fallback — w razie gdyby ktoś podał tylko email
        emailsArr.push(c);
        attendeesArr.push({ name: '', email: c });
      }
    });

    return { emails: emailsArr, attendees: attendeesArr };
  }

  function scheduleNotification() {
    if (Notification.permission !== 'granted') {
      alert('Proszę włączyć powiadomienia w przeglądarce (lub je odblokować).');
      return;
    }

    const startDateTime = new Date(`${date}T${time}`);
    const notificationTimeMs = startDateTime.getTime() - notificationTime * 60 * 1000;
    const currentTimeMs = new Date().getTime();

    if (notificationTimeMs > currentTimeMs) {
      const delay = notificationTimeMs - currentTimeMs;
      setTimeout(() => {
        new Notification('Przypomnienie o wydarzeniu', {
          body: `Zbliża się wydarzenie: ${title}`,
        });
      }, delay);
    } else {
      alert('Ustawiona godzina powiadomienia już minęła.');
    }
  }

  function handleGenerateICS() {
    if (!validateData()) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }

    // Parsowanie kontaktów
    const { attendees } = parseContacts();

    // ALARM (VALARM) – tylko jeśli isAdvanced
    const alarms = isAdvanced
      ? [
          {
            action: 'display',
            description: `Powiadomienie o wydarzeniu: ${title}`,
            trigger: { minutes: parseInt(notificationTime, 10), before: true },
          },
        ]
      : [];

    // Ustalenie RRULE
    let rrule;
    if (isAdvanced && advancedRRule.trim()) {
      rrule = advancedRRule.trim();
    } else {
      switch (recurrence) {
        case 'daily':
          rrule = 'FREQ=DAILY';
          break;
        case 'weekly':
          rrule = 'FREQ=WEEKLY';
          break;
        case 'monthly':
          rrule = 'FREQ=MONTHLY';
          break;
        case 'yearly':
          rrule = 'FREQ=YEARLY';
          break;
        case 'weekend':
          rrule = 'FREQ=WEEKLY;BYDAY=SA,SU';
          break;
        case 'workdays':
          rrule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
          break;
        default:
          rrule = undefined;
      }
    }

    const event = {
      start: [year, month, day, hours, minutes],
      duration: { minutes: eventDuration },
      title,
      description,
      location,
      attendees,
      alarms,
      recurrenceRule: rrule,
      startOutputType: 'local',
    };

    createEvents([event], (error, value) => {
      if (error) {
        console.log(error);
        alert('Błąd przy generowaniu ICS: ' + error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plan-event.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  function handleAddToGoogle() {
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }
    const endDateTime = new Date(dateTimeStr);
    endDateTime.setMinutes(endDateTime.getMinutes() + eventDuration);

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('details', description);

    if (location) {
      googleUrl.searchParams.append('location', location);
    }
    googleUrl.searchParams.append('ctz', timeZone);

    // Format dat
    const startStr = dateTimeStr.replace(/[-:]/g, '');
    const endStr = format(endDateTime, "yyyyMMdd'T'HHmmss");
    googleUrl.searchParams.append('dates', `${startStr}/${endStr}`);

    let rrule = '';
    if (isAdvanced && advancedRRule.trim()) {
      rrule = `RRULE:${advancedRRule.trim()}`;
    } else {
      switch (recurrence) {
        case 'daily':
          rrule = 'RRULE:FREQ=DAILY';
          break;
        case 'weekly':
          rrule = 'RRULE:FREQ=WEEKLY';
          break;
        case 'monthly':
          rrule = 'RRULE:FREQ=MONTHLY';
          break;
        case 'yearly':
          rrule = 'RRULE:FREQ=YEARLY';
          break;
        case 'weekend':
          rrule = 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU';
          break;
        case 'workdays':
          rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
          break;
        default:
          rrule = '';
      }
    }
    if (rrule) {
      googleUrl.searchParams.append('recur', rrule);
    }

    const { emails } = parseContacts();
    emails.forEach((email) => {
      googleUrl.searchParams.append('add', email);
    });

    window.open(googleUrl.toString(), '_blank');
  }

  function handleShareViaEmail() {
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }
    const endDateTime = addMinutes(new Date(dateTimeStr), eventDuration);

    const formattedDate = format(new Date(dateTimeStr), 'dd.MM.yyyy');
    const formattedStartTime = format(new Date(dateTimeStr), 'HH:mm');
    const formattedEndTime = format(endDateTime, 'HH:mm');

    const { emails } = parseContacts();
    if (!emails.length) {
      alert('Brak poprawnych adresów email w polu uczestników/adresów do wysłania.');
      return;
    }

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `Zapraszam na wydarzenie:\n\n` +
      `${title}\n` +
      `Data: ${formattedDate}\n` +
      `Czas: ${formattedStartTime} - ${formattedEndTime}\n` +
      (location ? `Miejsce: ${location}\n` : '') +
      `\n${description}\n\n` +
      `Dodaj do swojego kalendarza klikając w załączony plik .ics`
    );

    const mailto = `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    if (isAdvanced) {
      scheduleNotification();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Mam plan
          </h1>

          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              <ul className="list-disc list-inside">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* --- Formularz --- */}
          <div className="space-y-6">
            {/* Tytuł wydarzenia */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tytuł wydarzenia
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder="Np. Spotkanie z przyjaciółmi"
              />
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Opis
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                rows={3}
                placeholder="Dodatkowe informacje..."
              />
            </div>

            {/* Data + godzina rozpoczęcia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data
                </label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                      focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Godzina rozpoczęcia
                </label>
                <div className="mt-1 relative">
                  <Clock className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                      focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>
            </div>

            {/* Czas zakończenia lub Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={useEndTime}
                    onChange={(e) => setUseEndTime(e.target.checked)}
                    className="mr-2 rounded border-gray-300"
                  />
                  Ustaw czas zakończenia
                </label>
                {useEndTime ? (
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                        focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                ) : (
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                      focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  >
                    <option value="15">15 minut</option>
                    <option value="30">30 minut</option>
                    <option value="45">45 minut</option>
                    <option value="60">1 godzina</option>
                    <option value="90">1.5 godziny</option>
                    <option value="120">2 godziny</option>
                    <option value="180">3 godziny</option>
                    <option value="240">4 godziny</option>
                    <option value="300">5 godzin</option>
                    <option value="360">6 godzin</option>
                    <option value="420">7 godzin</option>
                    <option value="480">8 godzin</option>
                  </select>
                )}
              </div>

              {/* Proste powtarzanie */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Powtarzanie (proste)
                </label>
                <div className="mt-1 relative">
                  <Repeat className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                      focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  >
                    <option value="none">Nie powtarzaj</option>
                    <option value="daily">Codziennie</option>
                    <option value="weekly">Co tydzień</option>
                    <option value="monthly">Co miesiąc</option>
                    <option value="yearly">Co rok</option>
                    <option value="weekend">Weekend (sob., niedz.)</option>
                    <option value="workdays">Dni robocze (pon.-pt.)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lokalizacja */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lokalizacja
              </label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                    focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="Np. Adres / link do spotkania"
                />
              </div>
            </div>

            {/* Strefa czasowa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Strefa czasowa
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="Europe/Warsaw">Europe/Warsaw (Warszawa)</option>
                <option value="Europe/London">Europe/London (Londyn)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Los Angeles)</option>
                <option value="Europe/Kiev">Europe/Kiev (Kijów)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (Chiny)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (Indie)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (Nowy Jork)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (Tokio)</option>
              </select>
            </div>

            {/* Uczestnicy i adresy email w jednym polu */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uczestnicy i adresy email (oddzielone przecinkami)
              </label>
              <div className="mt-1 relative">
                <Users className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm 
                    focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder='Np. "Jan jan@example.com, anna@example.com"'
                />
              </div>
            </div>

            {/* Pole "Zaawansowane" */}
            <div className="border-t pt-4 mt-4">
              <label className="inline-flex items-center mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdvanced}
                  onChange={(e) => setIsAdvanced(e.target.checked)}
                  className="mr-2 rounded border-gray-300"
                />
                Zaawansowane
              </label>

              {isAdvanced && (
                <div className="space-y-4">
                  {/* Zaawansowana reguła RRULE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Zaawansowana reguła (RRULE)
                    </label>
                    <input
                      type="text"
                      value={advancedRRule}
                      onChange={(e) => setAdvancedRRule(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 
                        shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      placeholder='Np. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"'
                    />
                  </div>

                  {/* Powiadomienie przed wydarzeniem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Powiadomienie przed wydarzeniem (minuty)
                    </label>
                    <input
                      type="number"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 
                        shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* --- Przyciski --- */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={handleGenerateICS}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Pobierz ICS
              </button>

              <button
                onClick={handleAddToGoogle}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-red-600 hover:bg-red-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Mail className="h-5 w-5 mr-2" />
                Google
              </button>

              <button
                onClick={handleShareViaEmail}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-green-600 hover:bg-green-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Wyślij
              </button>
            </div>
          </div>

          {/* --- Kalendarz 3-miesięczny poniżej przycisków --- */}
          <div className="mt-8">
            <ThreeMonthCalendar />
          </div>

          {/* --- Aktualna godzina i data --- */}
          <div className="text-center mt-6">
            <p className="text-lg font-semibold">
              Aktualny czas: {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-sm">
              Dzisiejsza data: {format(currentTime, 'dd.MM.yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
