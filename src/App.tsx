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

function getTimezoneOffsetInHours(tz) {
  const dt = new Date();
  const localMillis = dt.getTime();
  const tzString = dt.toLocaleString('en-US', { timeZone: tz });
  const tzMillis = Date.parse(tzString);
  return (localMillis - tzMillis) / 3600000;
}

// Minimalny translator (PL/EN) - w uproszczonej formie
const translations = {
  pl: {
    switchLang: 'EN',
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
    downloadICS: 'Pobierz ICS',
    google: 'Google',
    send: 'Wyślij',
    importCsvLabel: 'Import z pliku CSV',
    importCsvInfo: 'W każdej linii musi być email. Reszta zostanie zignorowana.',
    planName: 'Mam plan'
  },
  en: {
    switchLang: 'PL',
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
    downloadICS: 'Download ICS',
    google: 'Google',
    send: 'Send',
    importCsvLabel: 'Import from CSV file',
    importCsvInfo: 'Each line must contain an email. Anything else is ignored.',
    planName: 'I have a plan'
  }
};

// Prosty helper do sprawdzania e-mail
function isValidEmail(str) {
  // Bardzo prosty regex. W realnej aplikacji często i tak
  // używa się zewnętrznych bibliotek do walidacji email.
  return /.+@.+\..+/.test(str.trim());
}

function SingleMonthCalendar({ language }) {
  const [displayDate, setDisplayDate] = useState(new Date());

  const handlePrev = () => {
    setDisplayDate((prev) => subMonths(prev, 1));
  };
  const handleNext = () => {
    setDisplayDate((prev) => addMonths(prev, 1));
  };

  const monthName = format(displayDate, 'LLLL yyyy');

  // Proste przełączanie dni tygodnia
  const dayNames = language === 'pl'
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const startOfM = startOfMonth(displayDate);
  const endOfM = endOfMonth(displayDate);
  const startDisplay = startOfWeek(startOfM, { weekStartsOn: 1 });
  const endDisplay = endOfWeek(endOfM, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: startDisplay, end: endDisplay });

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={handlePrev}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          {language === 'pl' ? 'Poprzedni' : 'Previous'}
        </button>
        <h3 className="text-center font-semibold">
          {monthName}
        </h3>
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
                  const isCurrentMonth = (day.getMonth() === displayDate.getMonth());
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

// Prosta funkcja parseTime
function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function App() {
  const [language, setLanguage] = useState('pl');
  const t = (key) => translations[language][key];

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none');

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

  // Aktualny czas
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
      newErrors.push(language === 'pl'
        ? 'Tytuł nie może być pusty.'
        : 'Title cannot be empty.'
      );
    }
    if (!date) {
      newErrors.push(language === 'pl'
        ? 'Data nie może być pusta.'
        : 'Date cannot be empty.'
      );
    }
    if (!time) {
      newErrors.push(language === 'pl'
        ? 'Godzina rozpoczęcia nie może być pusta.'
        : 'Start time cannot be empty.'
      );
    }

    // sprawdzanie w przeszłości
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      if (isBefore(startDateTime, new Date())) {
        newErrors.push(language === 'pl'
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
        newErrors.push(language === 'pl'
          ? 'Spotkanie jest poza godzinami dostępności (godziny pracy).'
          : 'Meeting is outside working hours.'
        );
      }
    }

    // Walidacja e-mail
    if (contacts.trim()) {
      const contactList = contacts.split(',').map((c) => c.trim());
      contactList.forEach((c) => {
        if (!c.includes('@')) {
          newErrors.push(language === 'pl'
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
      alert(language === 'pl'
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
        new Notification(language === 'pl'
          ? 'Przypomnienie o wydarzeniu'
          : 'Event reminder',
        {
          body: `${title}`
        });
      }, delay);
    } else {
      alert(language === 'pl'
        ? 'Ustawiona godzina powiadomienia już minęła.'
        : 'Reminder time has already passed.'
      );
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

    const { attendees } = parseContacts();
    const alarms = isAdvanced
      ? [
          {
            action: 'display',
            description: language === 'pl'
              ? `Powiadomienie: ${title}`
              : `Event reminder: ${title}`,
            trigger: { minutes: parseInt(notificationTime, 10), before: true },
          },
        ]
      : [];

    let rrule;
    if (isAdvanced && advancedRRule.trim()) {
      rrule = advancedRRule.trim();
    } else {
      switch (recurrence) {
        case 'daily':
          rrule = 'FREQ=DAILY'; break;
        case 'weekly':
          rrule = 'FREQ=WEEKLY'; break;
        case 'monthly':
          rrule = 'FREQ=MONTHLY'; break;
        case 'yearly':
          rrule = 'FREQ=YEARLY'; break;
        case 'weekend':
          rrule = 'FREQ=WEEKLY;BYDAY=SA,SU'; break;
        case 'workdays':
          rrule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'; break;
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

    const startStr = dateTimeStr.replace(/[-:]/g, '');
    const endStr = format(endDateTime, "yyyyMMdd'T'HHmmss");
    googleUrl.searchParams.append('dates', `${startStr}/${endStr}`);

    let rrule = '';
    if (isAdvanced && advancedRRule.trim()) {
      rrule = `RRULE:${advancedRRule.trim()}`;
    } else {
      switch (recurrence) {
        case 'daily':
          rrule = 'RRULE:FREQ=DAILY'; break;
        case 'weekly':
          rrule = 'RRULE:FREQ=WEEKLY'; break;
        case 'monthly':
          rrule = 'RRULE:FREQ=MONTHLY'; break;
        case 'yearly':
          rrule = 'RRULE:FREQ=YEARLY'; break;
        case 'weekend':
          rrule = 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU'; break;
        case 'workdays':
          rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'; break;
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
      alert(language === 'pl'
        ? 'Brak poprawnych adresów email.'
        : 'No valid email addresses.'
      );
      return;
    }

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      (language === 'pl' 
        ? 'Zapraszam na wydarzenie:\n\n' 
        : 'I invite you to the event:\n\n'
      ) +
      `${title}\n` +
      (language === 'pl' ? 'Data' : 'Date') + `: ${formattedDate}\n` +
      (language === 'pl' ? 'Czas' : 'Time') + `: ${formattedStartTime} - ${formattedEndTime}\n` +
      (location ? (language === 'pl' ? `Miejsce: ` : `Location: `) + location + '\n' : '') +
      `\n${description}\n\n` +
      (language === 'pl'
        ? 'Dodaj do swojego kalendarza klikając w załączony plik .ics'
        : 'Add to your calendar by clicking the attached .ics file'
      )
    );

    const mailto = `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    if (isAdvanced) {
      scheduleNotification();
    }
  }

  // NOWA FUNKCJA: import CSV
  // 1. Pobieramy plik z <input type="file">
  // 2. Wczytujemy go FileReaderem i parsujemy linie
  // 3. Dla każdej linii sprawdzamy czy isValidEmail
  // 4. Dopisujemy do `contacts` (po przecinku)
  function handleImportCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) return;
      const lines = text.split('\n');
      const validEmails = [];
      for (const line of lines) {
        const candidate = line.trim();
        if (isValidEmail(candidate)) {
          validEmails.push(candidate);
        }
      }
      // Dodajemy do existing contacts
      // Jeżeli w polu contacts jest coś, dopisujemy ", <email>"
      let existing = contacts.trim();
      if (existing) existing += ', ';
      // Łączymy validEmails z przecinkiem
      existing += validEmails.join(', ');
      setContacts(existing);
      alert(language === 'pl'
        ? `Zaimportowano ${validEmails.length} adresów e-mail z pliku CSV.`
        : `Imported ${validEmails.length} email addresses from CSV file.`
      );
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">

          {/* Przycisk zmiany języka */}
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
            {/* Tytuł, Lokalizacja, Opis, Data, itd. */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 
                  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              />
            </div>
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
                  className="block w-full pl-10 rounded-md border-gray-300 
                    shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
            </div>
            {/* ... Pozostałe pola (opis, data, czas, strefa czasowa, itp.) ... */}

            {/* Uczestnicy */}
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
                  className="block w-full pl-10 rounded-md border-gray-300 
                    shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                <div className="space-y-4">
                  {/* Reguła RRULE, Powiadomienie, Godziny pracy, etc. */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('importCsvLabel')}
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('importCsvInfo')}
                    </p>
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

                  {/* ... pozostałe pola zaawansowane (advancedRRule, workStart, workEnd, etc.) ... */}
                </div>
              )}
            </div>

            {/* Przyciski akcji */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={handleGenerateICS}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-5 w-5 mr-2" />
                {t('downloadICS')}
              </button>

              <button
                onClick={handleAddToGoogle}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-red-600 hover:bg-red-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Mail className="h-5 w-5 mr-2" />
                {t('google')}
              </button>

              <button
                onClick={handleShareViaEmail}
                className="flex items-center justify-center px-4 py-2 border 
                  border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-green-600 hover:bg-green-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
              {language === 'pl' ? 'Aktualny czas:' : 'Current time:'} {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-sm">
              {language === 'pl' ? 'Dzisiejsza data:' : 'Today’s date:'} {format(currentTime, 'dd.MM.yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
