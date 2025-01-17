import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Mail,
  Repeat,
  Share2,
  MapPin,
  Users
} from 'lucide-react';
import { createEvents } from 'ics';
import {
  format,
  addMinutes,
  differenceInMinutes,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isToday
} from 'date-fns';

const translations = {
  pl: {
    switchLang: 'EN',
    title: 'Tytuł wydarzenia',
    location: 'Lokalizacja',
    description: 'Opis',
    date: 'Data',
    startTime: 'Godzina rozpoczęcia',
    setEndTime: 'Ustaw czas zakończenia',
    duration: 'Czas trwania',
    simpleRepeat: 'Powtarzanie (proste)',
    none: 'Nie powtarzaj',
    daily: 'Codziennie',
    weekly: 'Co tydzień',
    monthly: 'Co miesiąc',
    yearly: 'Co rok',
    weekend: 'Weekend (sob., niedz.)',
    workdays: 'Dni robocze (pon.-pt.)',
    timeZone: 'Strefa czasowa',
    timeDiff: 'Różnica czasu (względem systemu)',
    contacts: 'Uczestnicy i adresy email (oddzielone przecinkami)',
    advanced: 'Zaawansowane',
    advancedRule: 'Zaawansowana reguła (RRULE)',
    reminder: 'Powiadomienie przed wydarzeniem (minuty)',
    workHoursStart: 'Godz. pracy od',
    workHoursEnd: 'Godz. pracy do',
    ignoreWorkHours: 'Ignoruj godziny pracy',
    outOfOffice: 'Spotkanie jest poza godzinami dostępności (godziny pracy).',
    downloadICS: 'Pobierz ICS',
    google: 'Google',
    send: 'Wyślij',
    planName: 'Mam plan (z obsługą PL/ENG)',
    currentTime: 'Aktualny czas',
    todaysDate: 'Dzisiejsza data',
    eventOutsideHours: 'Spotkanie jest poza godzinami dostępności (godziny pracy).'
  },
  en: {
    switchLang: 'PL',
    title: 'Event Title',
    location: 'Location',
    description: 'Description',
    date: 'Date',
    startTime: 'Start time',
    setEndTime: 'Set end time',
    duration: 'Duration',
    simpleRepeat: 'Simple repetition',
    none: 'Do not repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    weekend: 'Weekend (Sat, Sun)',
    workdays: 'Workdays (Mon-Fri)',
    timeZone: 'Time Zone',
    timeDiff: 'Time difference (vs system)',
    contacts: 'Participants and emails (comma separated)',
    advanced: 'Advanced',
    advancedRule: 'Advanced Rule (RRULE)',
    reminder: 'Reminder before event (minutes)',
    workHoursStart: 'Work start',
    workHoursEnd: 'Work end',
    ignoreWorkHours: 'Ignore working hours',
    outOfOffice: 'Meeting is outside working hours.',
    downloadICS: 'Download ICS',
    google: 'Google',
    send: 'Send',
    planName: 'I have a plan (PL/ENG toggle)',
    currentTime: 'Current time',
    todaysDate: 'Today’s date',
    eventOutsideHours: 'Meeting is outside working hours.'
  }
};

/** 
 * Oblicza offset strefy tz względem czasu lokalnego 
 */
function getTimezoneOffsetInHours(tz) {
  const dt = new Date();
  const localMillis = dt.getTime();
  const tzString = dt.toLocaleString('en-US', { timeZone: tz });
  const tzMillis = Date.parse(tzString);
  return (localMillis - tzMillis) / 3600000;
}

/** Kalendarz 1-miesięczny z przyciskami "Poprzedni/Następny" */
function SingleMonthCalendar({ language }) {
  const [displayDate, setDisplayDate] = useState(new Date());

  const handlePrev = () => {
    setDisplayDate((prev) => subMonths(prev, 1));
  };
  const handleNext = () => {
    setDisplayDate((prev) => addMonths(prev, 1));
  };

  // Nazwa miesiąca np. "styczeń 2025" / "January 2025"
  const monthName = format(displayDate, 'LLLL yyyy');

  const startOfM = startOfMonth(displayDate);
  const endOfM = endOfMonth(displayDate);
  const startDisplay = startOfWeek(startOfM, { weekStartsOn: 1 });
  const endDisplay = endOfWeek(endOfM, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: startDisplay, end: endDisplay });

  // Dni tygodnia: PL vs. EN
  const dayNames =
    language === 'pl'
      ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={handlePrev}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          {language === 'pl' ? 'Poprzedni' : 'Previous'}
        </button>
        <h3 className="text-center font-semibold">{monthName}</h3>
        <button
          onClick={handleNext}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          {language === 'pl' ? 'Następny' : 'Next'}
        </button>
      </div>

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
          {Array.from({ length: Math.ceil(allDays.length / 7) }).map((_, weekIndex) => {
            const weekDays = allDays.slice(weekIndex * 7, (weekIndex + 1) * 7);

            return (
              <tr key={weekIndex}>
                {weekDays.map((day) => {
                  const isCurrentMonth = day.getMonth() === displayDate.getMonth();
                  const highlightToday = isToday(day);

                  return (
                    <td
                      key={day.toISOString()}
                      className={`
                        p-1 border text-center
                        ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-800'}
                        ${highlightToday ? 'bg-yellow-200 font-semibold' : ''}
                      `}
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

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function App() {
  const [language, setLanguage] = useState('pl');
  const t = (key) => translations[language][key];

  // Stany
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(''); // Opis

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none');

  // Strefa czasowa + różnica
  const [timeZone, setTimeZone] = useState('Europe/Warsaw');
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localOffset = getTimezoneOffsetInHours(localTz);
  const selectedOffset = getTimezoneOffsetInHours(timeZone);
  const diff = selectedOffset - localOffset;
  const diffDisplay = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} h`;

  const [contacts, setContacts] = useState('');

  // Zaawansowane
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [advancedRRule, setAdvancedRRule] = useState('');
  const [notificationTime, setNotificationTime] = useState('5');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [ignoreWorkHours, setIgnoreWorkHours] = useState(false);

  const [useEndTime, setUseEndTime] = useState(false);

  const [errors, setErrors] = useState([]);

  // Bieżący czas (dla wyświetlenia)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Notyfikacje
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function calculateDuration() {
    if (!date || !time || !endTime) return 0;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return differenceInMinutes(endDateTime, startDateTime);
  }

  function validateData() {
    const newErrors = [];

    if (!title.trim()) {
      newErrors.push(
        language === 'pl' ? 'Tytuł nie może być pusty.' : 'Title cannot be empty.'
      );
    }
    if (!date) {
      newErrors.push(
        language === 'pl' ? 'Data nie może być pusta.' : 'Date cannot be empty.'
      );
    }
    if (!time) {
      newErrors.push(
        language === 'pl'
          ? 'Godzina rozpoczęcia nie może być pusta.'
          : 'Start time cannot be empty.'
      );
    }

    // Sprawdzenie, czy nie w przeszłości
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      if (isBefore(startDateTime, new Date())) {
        newErrors.push(
          language === 'pl'
            ? 'Data/godzina nie może być w przeszłości.'
            : 'Date/time cannot be in the past.'
        );
      }
    }

    // Godziny pracy
    if (isAdvanced && !ignoreWorkHours && time) {
      const eventStartMin = parseTimeToMinutes(time);
      const workStartMin = parseTimeToMinutes(workStart);
      const workEndMin = parseTimeToMinutes(workEnd);

      if (eventStartMin < workStartMin || eventStartMin >= workEndMin) {
        newErrors.push(t('outOfOffice'));
      }
    }

    // E-maile
    if (contacts.trim()) {
      const contactList = contacts.split(',').map((c) => c.trim());
      contactList.forEach((c) => {
        if (!c.includes('@')) {
          newErrors.push(
            language === 'pl'
              ? `Niepoprawny format w polu uczestników/adresów: "${c}"`
              : `Invalid participant/email format: "${c}"`
          );
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  function parseContacts() {
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
        // fallback
        emailsArr.push(c);
        attendeesArr.push({ name: '', email: c });
      }
    });

    return { emails: emailsArr, attendees: attendeesArr };
  }

  function scheduleNotification() {
    if (Notification.permission !== 'granted') {
      alert(
        language === 'pl'
          ? 'Proszę włączyć powiadomienia w przeglądarce (lub je odblokować).'
          : 'Please enable notifications in your browser.'
      );
      return;
    }

    const startDateTime = new Date(`${date}T${time}`);
    const notificationTimeMs =
      startDateTime.getTime() - notificationTime * 60 * 1000;
    const currentTimeMs = new Date().getTime();

    if (notificationTimeMs > currentTimeMs) {
      const delay = notificationTimeMs - currentTimeMs;
      setTimeout(() => {
        new Notification(
          language === 'pl' ? 'Przypomnienie o wydarzeniu' : 'Event reminder',
          {
            body: `${title}`
          }
        );
      }, delay);
    } else {
      alert(
        language === 'pl'
          ? 'Ustawiona godzina powiadomienia już minęła.'
          : 'Reminder time has already passed.'
      );
    }
  }

  // Generowanie ICS (z opisem i lokalizacją)
  function handleGenerateICS() {
    if (!validateData()) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }

    const { attendees } = parseContacts();

    // ALARM - jeżeli isAdvanced
    const alarms = isAdvanced
      ? [
          {
            action: 'display',
            description:
              language === 'pl'
                ? `Powiadomienie o wydarzeniu: ${title}`
                : `Event reminder: ${title}`,
            trigger: { minutes: parseInt(notificationTime, 10), before: true }
          }
        ]
      : [];

    // Proste lub zaawansowane RRULE
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

    // Tworzymy obiekt wydarzenia
    const event = {
      start: [year, month, day, hours, minutes],
      duration: { minutes: eventDuration },
      title,
      description, // <-- tutaj opis trafia do ICS
      location,    // <-- lokalizacja też
      attendees,   // <-- uczestnicy
      alarms,
      recurrenceRule: rrule,
      startOutputType: 'local'
    };

    createEvents([event], (error, value) => {
      if (error) {
        console.log(error);
        alert(error.message);
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

  // Dodawanie do Google
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
    googleUrl.searchParams.append('details', description); // <-- opis
    if (location) {
      googleUrl.searchParams.append('location', location);
    }
    googleUrl.searchParams.append('ctz', timeZone);

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

  // Wysyłanie mailto (opis w treści)
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
      alert(
        language === 'pl'
          ? 'Brak poprawnych adresów email w polu uczestników/adresów do wysłania.'
          : 'No valid email addresses in the participants field.'
      );
      return;
    }

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      (language === 'pl'
        ? 'Zapraszam na wydarzenie:\n\n'
        : 'I invite you to the event:\n\n') +
        `${title}\n` +
        (language === 'pl' ? 'Data' : 'Date') +
        `: ${formattedDate}\n` +
        (language === 'pl' ? 'Czas' : 'Time') +
        `: ${formattedStartTime} - ${formattedEndTime}\n` +
        (location
          ? (language === 'pl' ? `Miejsce: ` : `Location: `) + location + '\n'
          : '') +
        `\n${description}\n\n` + // <-- tu dołączamy opis
        (language === 'pl'
          ? 'Dodaj do swojego kalendarza klikając w załączony plik .ics'
          : 'Add to your calendar by clicking the attached .ics file')
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
          {/* Guzik przełączania języka */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {translations[language].switchLang}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            {t('planName')}
          </h1>

          {/* Błędy walidacji */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              <ul className="list-disc list-inside">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Formularz */}
          <div className="space-y-6">
            {/* Tytuł wydarzenia */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder={
                  language === 'pl'
                    ? 'Np. Spotkanie z przyjaciółmi'
                    : 'e.g. Meeting with friends'
                }
              />
            </div>

            {/* Lokalizacja */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('location')}
              </label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder={
                    language === 'pl'
                      ? 'Np. Adres / link do spotkania'
                      : 'e.g. Address / meeting link'
                  }
                />
              </div>
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                rows={3}
                placeholder={
                  language === 'pl'
                    ? 'Dodatkowe informacje...'
                    : 'Additional info...'
                }
              />
            </div>

            {/* Data + godzina startu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('date')}
                </label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('startTime')}
                </label>
                <div className="mt-1 relative">
                  <Clock className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                  {t('setEndTime')}
                </label>
                {useEndTime ? (
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                ) : (
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  >
                    <option value="15">
                      15 {language === 'pl' ? 'minut' : 'minutes'}
                    </option>
                    <option value="30">
                      30 {language === 'pl' ? 'minut' : 'minutes'}
                    </option>
                    <option value="45">
                      45 {language === 'pl' ? 'minut' : 'minutes'}
                    </option>
                    <option value="60">
                      {language === 'pl' ? '1 godzina' : '1 hour'}
                    </option>
                    <option value="90">
                      {language === 'pl' ? '1.5 godziny' : '1.5 hours'}
                    </option>
                    <option value="120">
                      {language === 'pl' ? '2 godziny' : '2 hours'}
                    </option>
                    <option value="180">
                      {language === 'pl' ? '3 godziny' : '3 hours'}
                    </option>
                    <option value="240">
                      {language === 'pl' ? '4 godziny' : '4 hours'}
                    </option>
                    <option value="300">
                      {language === 'pl' ? '5 godzin' : '5 hours'}
                    </option>
                    <option value="360">
                      {language === 'pl' ? '6 godzin' : '6 hours'}
                    </option>
                    <option value="420">
                      {language === 'pl' ? '7 godzin' : '7 hours'}
                    </option>
                    <option value="480">
                      {language === 'pl' ? '8 godzin' : '8 hours'}
                    </option>
                  </select>
                )}
              </div>

              {/* Proste powtarzanie */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('simpleRepeat')}
                </label>
                <div className="mt-1 relative">
                  <Repeat className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  >
                    <option value="none">{t('none')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="weekly">{t('weekly')}</option>
                    <option value="monthly">{t('monthly')}</option>
                    <option value="yearly">{t('yearly')}</option>
                    <option value="weekend">{t('weekend')}</option>
                    <option value="workdays">{t('workdays')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Strefa czasowa + różnica */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('timeZone')}
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="Europe/Warsaw">Europe/Warsaw</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/Kiev">Europe/Kiev</option>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {t('timeDiff')}: <strong>{diffDisplay}</strong>
              </p>
            </div>

            {/* Uczestnicy (contacts) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('contacts')}
              </label>
              <div className="mt-1 relative">
                <Users className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder={
                    language === 'pl'
                      ? 'Np. "Jan jan@example.com, anna@example.com"'
                      : 'e.g. "John john@example.com, anna@example.com"'
                  }
                />
              </div>
            </div>

            {/* ZAawansowane */}
            <div className="border-t pt-4 mt-4">
              <label className="inline-flex items-center mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdvanced}
                  onChange={(e) => setIsAdvanced(e.target.checked)}
                  className="mr-2 rounded border-gray-300"
                />
                {t('advanced')}
              </label>

              {isAdvanced && (
                <div className="space-y-4">
                  {/* Zaawansowana reguła RRULE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('advancedRule')}
                    </label>
                    <input
                      type="text"
                      value={advancedRRule}
                      onChange={(e) => setAdvancedRRule(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      placeholder={
                        language === 'pl'
                          ? 'Np. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"'
                          : 'e.g. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"'
                      }
                    />
                  </div>

                  {/* Przypomnienie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('reminder')}
                    </label>
                    <input
                      type="number"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      min="1"
                    />
                  </div>

                  {/* Godziny pracy */}
                  <div className="flex space-x-2 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('workHoursStart')}
                      </label>
                      <input
                        type="time"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('workHoursEnd')}
                      </label>
                      <input
                        type="time"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      />
                    </div>
                  </div>

                  {/* Ignoruj godziny pracy */}
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ignoreWorkHours}
                      onChange={(e) => setIgnoreWorkHours(e.target.checked)}
                      className="mr-2 rounded border-gray-300"
                    />
                    {t('ignoreWorkHours')}
                  </label>
                </div>
              )}
            </div>

            {/* Przyciski akcji (ICS, Google, mailto) */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={handleGenerateICS}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-5 w-5 mr-2" />
                {t('downloadICS')}
              </button>

              <button
                onClick={handleAddToGoogle}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Mail className="h-5 w-5 mr-2" />
                {t('google')}
              </button>

              <button
                onClick={handleShareViaEmail}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Share2 className="h-5 w-5 mr-2" />
                {t('send')}
              </button>
            </div>
          </div>

          {/* Kalendarz + aktualny czas */}
          <SingleMonthCalendar language={language} />
          <div className="text-center mt-6">
            <p className="text-lg font-semibold">
              {t('currentTime')}: {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-sm">
              {t('todaysDate')}: {format(currentTime, 'dd.MM.yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
