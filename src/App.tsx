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

/* 
  Dwujęzyczny słownik. 
  Dodatkowe klucze: tryb ciemny/jasny (darkMode,lightMode), 
  importCsvLabel, importCsvInfo, attachLabel, attachmentInfo, rruleGraphic itd.
*/
const translations = {
  pl: {
    switchLang: 'EN',
    darkMode: 'Tryb ciemny',
    lightMode: 'Tryb jasny',
    title: 'Tytuł wydarzenia',
    location: 'Lokalizacja',
    description: 'Opis',
    date: 'Data',
    startTime: 'Godzina rozpoczęcia',
    setEndTime: 'Ustaw czas zakończenia',
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
    planName: 'Mam plan (rozbudowana wersja)',
    currentTime: 'Aktualny czas',
    todaysDate: 'Dzisiejsza data',
    eventOutsideHours: 'Spotkanie jest poza godzinami dostępności (godziny pracy).',
    importCsvLabel: 'Import z pliku CSV',
    importCsvInfo: 'W każdej linii musi być email. Reszta zostanie zignorowana.',
    attachLabel: 'Załącznik (URL)',
    attachPlaceholder: 'Np. https://example.com/file.pdf',
    attachmentInfo: 'Dodaj link do pliku, który ma być dołączony w ICS.',
    addAttachment: 'Dodaj do listy',
    rruleGraphic: 'Graficzna konfiguracja RRULE',
    freq: 'Częstotliwość (FREQ)',
    interval: 'INTERVAL (co ile)',
    daysOfWeek: 'Dni tygodnia (BYDAY)',
    until: 'Data końcowa (UNTIL)',
    generateRrule: 'Generuj RRULE',
    meetingClassLabel: 'Spotkanie: publiczne/prywatne',
    public: 'Publiczne',
    private: 'Prywatne'
  },
  en: {
    switchLang: 'PL',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    title: 'Event Title',
    location: 'Location',
    description: 'Description',
    date: 'Date',
    startTime: 'Start time',
    setEndTime: 'Set end time',
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
    planName: 'I have a plan (extended)',
    currentTime: 'Current time',
    todaysDate: 'Today’s date',
    eventOutsideHours: 'Meeting is outside working hours.',
    importCsvLabel: 'Import from CSV file',
    importCsvInfo: 'Each line must contain an email. Anything else is ignored.',
    attachLabel: 'Attachment (URL)',
    attachPlaceholder: 'e.g. https://example.com/file.pdf',
    attachmentInfo: 'Add a link to the file to attach in ICS.',
    addAttachment: 'Add to list',
    rruleGraphic: 'Graphical RRULE setup',
    freq: 'Frequency (FREQ)',
    interval: 'INTERVAL (every N)',
    daysOfWeek: 'Days of week (BYDAY)',
    until: 'End date (UNTIL)',
    generateRrule: 'Generate RRULE',
    meetingClassLabel: 'Meeting: public/private',
    public: 'Public',
    private: 'Private'
  }
};

// Prosta walidacja e-mail:
function isValidEmail(str) {
  return /.+@.+\..+/.test(str.trim());
}

// Oblicz offset strefy tz względem lokalnego
function getTimezoneOffsetInHours(tz) {
  const dt = new Date();
  const localMillis = dt.getTime();
  const tzString = dt.toLocaleString('en-US', { timeZone: tz });
  const tzMillis = Date.parse(tzString);
  return (localMillis - tzMillis) / 3600000;
}

// Kalendarz
function SingleMonthCalendar({ language }) {
  const [displayDate, setDisplayDate] = useState(new Date());

  const handlePrev = () => setDisplayDate((prev) => subMonths(prev, 1));
  const handleNext = () => setDisplayDate((prev) => addMonths(prev, 1));

  const monthName = format(displayDate, 'LLLL yyyy');
  const startOfM = startOfMonth(displayDate);
  const endOfM = endOfMonth(displayDate);
  const startDisplay = startOfWeek(startOfM, { weekStartsOn: 1 });
  const endDisplay = endOfWeek(endOfM, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: startDisplay, end: endDisplay });

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

// Główny komponent
export default function App() {
  // Tryb ciemny
  const [darkMode, setDarkMode] = useState(false);

  // Język
  const [language, setLanguage] = useState('pl');
  const t = (key) => translations[language][key];

  // Pola formularza
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none');

  // Strefa czasowa
  const [timeZone, setTimeZone] = useState('Europe/Warsaw');
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localOffset = getTimezoneOffsetInHours(localTz);
  const selectedOffset = getTimezoneOffsetInHours(timeZone);
  const diff = selectedOffset - localOffset;
  const diffDisplay = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} h`;

  // Uczestnicy
  const [contacts, setContacts] = useState('');

  // Zaawansowane
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [advancedRRule, setAdvancedRRule] = useState(''); // RRULE tekstowy
  const [notificationTime, setNotificationTime] = useState('5');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [ignoreWorkHours, setIgnoreWorkHours] = useState(false);
  const [useEndTime, setUseEndTime] = useState(false);

  // Nowy stan: public/private
  const [meetingClass, setMeetingClass] = useState('public'); // domyślnie public

  // Attachments
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Błędy
  const [errors, setErrors] = useState([]);

  // Bieżący czas (wyświetlanie)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Powiadomienia
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // import CSV
  function handleImportCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (!text) return;
      const lines = text.split('\n');
      const validEmails = [];
      for (const line of lines) {
        const candidate = line.trim();
        if (isValidEmail(candidate)) {
          validEmails.push(candidate);
        }
      }
      let existing = contacts.trim();
      if (existing) existing += ', ';
      existing += validEmails.join(', ');
      setContacts(existing);
      alert(
        language === 'pl'
          ? `Zaimportowano ${validEmails.length} adresów e-mail z pliku CSV.`
          : `Imported ${validEmails.length} email addresses from CSV file.`
      );
    };
    reader.readAsText(file);
  }

  // Walidacja
  function validateData() {
    const newErrors = [];

    if (!title.trim()) {
      newErrors.push(language === 'pl' ? 'Tytuł nie może być pusty.' : 'Title cannot be empty.');
    }
    if (!date) {
      newErrors.push(language === 'pl' ? 'Data nie może być pusta.' : 'Date cannot be empty.');
    }
    if (!time) {
      newErrors.push(
        language === 'pl' ? 'Godzina rozpoczęcia nie może być pusta.' : 'Start time cannot be empty.'
      );
    }

    // Czy data/godzina nie jest w przeszłości
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
        newErrors.push(
          language === 'pl'
            ? 'Spotkanie jest poza godzinami dostępności (godziny pracy).'
            : 'Meeting is outside working hours.'
        );
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

  // parseContacts -> emails, attendees
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
        emailsArr.push(c);
        attendeesArr.push({ name: '', email: c });
      }
    });

    return { emails: emailsArr, attendees: attendeesArr };
  }

  // notyfikacja
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
    const notificationTimeMs = startDateTime.getTime() - notificationTime * 60 * 1000;
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

  // ICS
  function handleGenerateICS() {
    if (!validateData()) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = differenceInMinutes(
        new Date(`${date}T${endTime}`),
        new Date(`${date}T${time}`)
      );
    }

    const { attendees } = parseContacts();

    // alarm
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

    // attachments
    const attachObj = attachments.map((url) => ({ uri: url }));

    // ICS property "CLASS" => PRIVATE/PUBLIC
    const icsClass = meetingClass === 'private' ? 'PRIVATE' : 'PUBLIC';

    // RRULE
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
      attachments: attachObj,
      recurrenceRule: rrule,
      startOutputType: 'local',
      class: icsClass // PUBLIC/PRIVATE
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

  // Google
  function handleAddToGoogle() {
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = differenceInMinutes(
        new Date(`${date}T${endTime}`),
        new Date(`${date}T${time}`)
      );
    }
    const endDateTime = new Date(dateTimeStr);
    endDateTime.setMinutes(endDateTime.getMinutes() + eventDuration);

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);

    // ewentualnie dopisanie [PRIVATE] w opisie, bo google link nie ma parametru
    let googleDetails = description;
    if (meetingClass === 'private') {
      googleDetails = `[PRIVATE] ${googleDetails}`;
    }

    googleUrl.searchParams.append('details', googleDetails);
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

  // Mailto
  function handleShareViaEmail() {
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration, 10);
    if (useEndTime && endTime) {
      eventDuration = differenceInMinutes(
        new Date(`${date}T${endTime}`),
        new Date(`${date}T${time}`)
      );
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
        (language === 'pl' ? 'Data' : 'Date') + `: ${formattedDate}\n` +
        (language === 'pl' ? 'Czas' : 'Time') + `: ${formattedStartTime} - ${formattedEndTime}\n` +
        (location
          ? (language === 'pl' ? `Miejsce: ` : `Location: `) + location + '\n'
          : '') +
        `\n${description}\n\n` +
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

  // GRAFICZNA KONFIGURACJA RRULE
  const [gFreq, setGFreq] = useState('WEEKLY');
  const [gInterval, setGInterval] = useState('1');
  const [gByDays, setGByDays] = useState(['MO']);
  const [gUntil, setGUntil] = useState('');

  const handleDayToggle = (day) => {
    if (gByDays.includes(day)) {
      setGByDays((prev) => prev.filter((d) => d !== day));
    } else {
      setGByDays((prev) => [...prev, day]);
    }
  };

  function generateRruleFromGraphics() {
    let rruleString = `FREQ=${gFreq.toUpperCase()};INTERVAL=${gInterval}`;
    if (gByDays.length > 0 && gFreq.toUpperCase() !== 'DAILY') {
      rruleString += `;BYDAY=${gByDays.join(',')}`;
    }
    if (gUntil) {
      // uproszczony format: YYYYMMDD
      const dt = gUntil.replace(/-/g, '');
      rruleString += `;UNTIL=${dt}T235959Z`;
    }
    setAdvancedRRule(rruleString);
  }

  function addAttachment() {
    if (!attachmentUrl.trim()) return;
    setAttachments((prev) => [...prev, attachmentUrl.trim()]);
    setAttachmentUrl('');
  }

  // RENDER
  return (
    <div
      className={
        darkMode
          ? 'bg-gray-900 text-gray-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8'
          : 'bg-gradient-to-br from-purple-100 to-indigo-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8'
      }
    >
      <div
        className="max-w-md mx-auto rounded-xl shadow-lg overflow-hidden"
        style={{ backgroundColor: darkMode ? '#333' : '#fff' }}
      >
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            {/* Przycisk zmiany języka */}
            <button
              onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
              className={
                darkMode
                  ? 'px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600'
                  : 'px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            >
              {translations[language].switchLang}
            </button>

            {/* Tryb ciemny/jasny */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={
                darkMode
                  ? 'px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600'
                  : 'px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            >
              {darkMode ? t('lightMode') : t('darkMode')}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-center mb-8">{t('planName')}</h1>

          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              <ul className="list-disc list-inside">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {/* Tytuł */}
            <div>
              <label className="block text-sm font-medium">{t('title')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder={
                  language === 'pl'
                    ? 'Np. Spotkanie z przyjaciółmi'
                    : 'e.g. Meeting with friends'
                }
              />
            </div>

            {/* Lokalizacja */}
            <div>
              <label className="block text-sm font-medium">{t('location')}</label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 p-2"
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
              <label className="block text-sm font-medium">{t('description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                rows={3}
                placeholder={
                  language === 'pl'
                    ? 'Dodatkowe informacje...'
                    : 'Additional info...'
                }
              />
            </div>

            {/* Data + godzina */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t('date')}</label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">{t('startTime')}</label>
                <div className="mt-1 relative">
                  <Clock className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 p-2"
                  />
                </div>
              </div>
            </div>

            {/* Czas zakończenia / Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium mb-2">
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
                      className="block w-full pl-10 rounded-md border-gray-300 p-2"
                    />
                  </div>
                ) : (
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 p-2"
                  >
                    <option value="15">15 {language === 'pl' ? 'minut' : 'minutes'}</option>
                    <option value="30">30 {language === 'pl' ? 'minut' : 'minutes'}</option>
                    <option value="45">45 {language === 'pl' ? 'minut' : 'minutes'}</option>
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

              {/* Powtarzanie proste */}
              <div>
                <label className="block text-sm font-medium">{t('simpleRepeat')}</label>
                <div className="mt-1 relative">
                  <Repeat className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 p-2"
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

            {/* Strefa czasowa */}
            <div>
              <label className="block text-sm font-medium">{t('timeZone')}</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
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
              <p className="text-sm mt-1">
                {t('timeDiff')}: <strong>{diffDisplay}</strong>
              </p>
            </div>

            {/* Kontakty */}
            <div>
              <label className="block text-sm font-medium">{t('contacts')}</label>
              <div className="mt-1 relative">
                <Users className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 p-2"
                  placeholder={
                    language === 'pl'
                      ? 'Np. "Jan jan@example.com, anna@example.com"'
                      : 'e.g. "John john@example.com, anna@example.com"'
                  }
                />
              </div>
            </div>

            {/* Zaawansowane */}
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
                <div className="space-y-4 pl-2">
                  {/* Publiczne/prywatne */}
                  <div>
                    <label className="block text-sm font-medium">
                      {t('meetingClassLabel')}
                    </label>
                    <div className="mt-1 flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="meetingClass"
                          value="public"
                          checked={meetingClass === 'public'}
                          onChange={() => setMeetingClass('public')}
                          className="mr-2"
                        />
                        {t('public')}
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="meetingClass"
                          value="private"
                          checked={meetingClass === 'private'}
                          onChange={() => setMeetingClass('private')}
                          className="mr-2"
                        />
                        {t('private')}
                      </label>
                    </div>
                  </div>

                  {/* RRULE tekstowy */}
                  <div>
                    <label className="block text-sm font-medium">{t('advancedRule')}</label>
                    <input
                      type="text"
                      value={advancedRRule}
                      onChange={(e) => setAdvancedRRule(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 p-2"
                      placeholder={
                        language === 'pl'
                          ? 'Np. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"'
                          : 'e.g. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"'
                      }
                    />
                  </div>

                  {/* Graficzna RRULE */}
                  <RruleGraphic
                    language={language}
                    setAdvancedRRule={setAdvancedRRule}
                  />

                  {/* Powiadomienie */}
                  <div>
                    <label className="block text-sm font-medium">{t('reminder')}</label>
                    <input
                      type="number"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 p-2"
                      min="1"
                    />
                  </div>

                  {/* Godziny pracy */}
                  <div className="flex space-x-2 items-center">
                    <div>
                      <label className="block text-sm font-medium">{t('workHoursStart')}</label>
                      <input
                        type="time"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                        className="block w-full rounded-md border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">{t('workHoursEnd')}</label>
                      <input
                        type="time"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                        className="block w-full rounded-md border-gray-300 p-2"
                      />
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={ignoreWorkHours}
                      onChange={(e) => setIgnoreWorkHours(e.target.checked)}
                      className="mr-2 rounded border-gray-300"
                    />
                    {t('ignoreWorkHours')}
                  </label>

                  {/* Import CSV */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">
                      {t('importCsvLabel')}
                    </label>
                    <p className="text-sm text-gray-500 mb-2">{t('importCsvInfo')}</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="block w-full text-sm text-gray-700
                        file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200"
                    />
                  </div>

                  {/* Załącznik */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">
                      {t('attachLabel')}
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('attachmentInfo')}
                    </p>
                    <input
                      type="text"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder={t('attachPlaceholder')}
                      className="block w-full mb-2 rounded-md border-gray-300 p-2"
                    />
                    <button
                      onClick={() => {
                        if (!attachmentUrl.trim()) return;
                        setAttachments((prev) => [...prev, attachmentUrl.trim()]);
                        setAttachmentUrl('');
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      {t('addAttachment')}
                    </button>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {attachments.map((att, index) => (
                        <li key={index}>{att}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Przyciski akcji */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={handleGenerateICS}
                className="flex items-center justify-center px-4 py-2 
                  border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-5 w-5 mr-2" />
                {t('downloadICS')}
              </button>

              <button
                onClick={handleAddToGoogle}
                className="flex items-center justify-center px-4 py-2 
                  border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-red-600 hover:bg-red-700"
              >
                <Mail className="h-5 w-5 mr-2" />
                {t('google')}
              </button>

              <button
                onClick={handleShareViaEmail}
                className="flex items-center justify-center px-4 py-2 
                  border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-green-600 hover:bg-green-700"
              >
                <Share2 className="h-5 w-5 mr-2" />
                {t('send')}
              </button>
            </div>
          </div>

          {/* Kalendarz + czas */}
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

// Komponent do graficznej konfiguracji RRULE (możesz go przenieść do innego pliku)
function RruleGraphic({ language, setAdvancedRRule }) {
  const [gFreq, setGFreq] = useState('WEEKLY');
  const [gInterval, setGInterval] = useState('1');
  const [gByDays, setGByDays] = useState(['MO']);
  const [gUntil, setGUntil] = useState('');

  const daysList = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  const handleDayToggle = (day) => {
    if (gByDays.includes(day)) {
      setGByDays((prev) => prev.filter((d) => d !== day));
    } else {
      setGByDays((prev) => [...prev, day]);
    }
  };

  function generateRrule() {
    let rruleString = `FREQ=${gFreq.toUpperCase()};INTERVAL=${gInterval}`;
    if (gByDays.length > 0 && gFreq.toUpperCase() !== 'DAILY') {
      rruleString += `;BYDAY=${gByDays.join(',')}`;
    }
    if (gUntil) {
      const dt = gUntil.replace(/-/g, '');
      rruleString += `;UNTIL=${dt}T235959Z`;
    }
    setAdvancedRRule(rruleString);
  }

  return (
    <div className="p-2 border rounded">
      <p className="font-semibold mb-2">
        {language === 'pl' ? 'Graficzna konfiguracja RRULE' : 'Graphical RRULE setup'}
      </p>
      {/* FREQ */}
      <label className="block text-sm font-medium mb-1">
        {language === 'pl' ? 'Częstotliwość (FREQ)' : 'Frequency (FREQ)'}
      </label>
      <select
        onChange={(e) => setGFreq(e.target.value)}
        className="mb-2 block w-full p-1 rounded border"
      >
        <option value="DAILY">{language === 'pl' ? 'Codziennie' : 'Daily'}</option>
        <option value="WEEKLY">{language === 'pl' ? 'Co tydzień' : 'Weekly'}</option>
        <option value="MONTHLY">{language === 'pl' ? 'Co miesiąc' : 'Monthly'}</option>
        <option value="YEARLY">{language === 'pl' ? 'Co rok' : 'Yearly'}</option>
      </select>

      {/* INTERVAL */}
      <label className="block text-sm font-medium mb-1">
        {language === 'pl' ? 'INTERVAL (co ile)' : 'INTERVAL (every N)'}
      </label>
      <input
        type="number"
        defaultValue={1}
        onChange={(e) => setGInterval(e.target.value)}
        className="mb-2 block w-full p-1 rounded border"
      />

      {/* BYDAY (tylko sensowne przy WEEKLY, ale zostawiamy) */}
      <label className="block text-sm font-medium mb-1">
        {language === 'pl' ? 'Dni tygodnia (BYDAY)' : 'Days of week (BYDAY)'}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {daysList.map((day) => (
          <label key={day} className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-1"
              checked={gByDays.includes(day)}
              onChange={() => handleDayToggle(day)}
            />
            {day}
          </label>
        ))}
      </div>

      {/* UNTIL */}
      <label className="block text-sm font-medium mb-1">
        {language === 'pl' ? 'Data końcowa (UNTIL)' : 'End date (UNTIL)'}
      </label>
      <input
        type="date"
        onChange={(e) => setGUntil(e.target.value)}
        className="mb-2 block w-full p-1 rounded border"
      />

      <button
        type="button"
        onClick={generateRrule}
        className="px-3 py-1 bg-indigo-600 text-white rounded"
      >
        {language === 'pl' ? 'Generuj RRULE' : 'Generate RRULE'}
      </button>
    </div>
  );
}
