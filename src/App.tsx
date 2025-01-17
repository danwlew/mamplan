import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Mail, Repeat, Share2, MapPin, Users } from 'lucide-react';
import { createEvents } from 'ics';
import { format, addMinutes, differenceInMinutes, isBefore } from 'date-fns';

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none'); // nadal istnieje proste powtarzanie
  const [advancedRRule, setAdvancedRRule] = useState(''); // nowe pole na zaawansowany RRULE
  const [emails, setEmails] = useState('');
  const [useEndTime, setUseEndTime] = useState(false);
  const [notificationTime, setNotificationTime] = useState('5');

  // Nowe pola:
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState(''); // np. "Jan jan@example.com, Anna anna@example.com"
  const [timeZone, setTimeZone] = useState('Europe/Warsaw'); // domyślnie

  // Proste zarządzanie błędami (walidacja):
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Pomocnicze funkcje:

  const calculateDuration = () => {
    if (!date || !time || !endTime) return 0;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return differenceInMinutes(endDateTime, startDateTime);
  };

  const scheduleNotification = () => {
    if (Notification.permission !== 'granted') {
      alert('Proszę włączyć powiadomienia w przeglądarce.');
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
  };

  // Funkcja walidująca wszystkie dane:
  const validateData = () => {
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

    // Sprawdzenie, czy data/godzina nie jest w przeszłości:
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      if (isBefore(startDateTime, new Date())) {
        newErrors.push('Data i godzina nie mogą być w przeszłości.');
      }
    }

    // Uczestnicy — prosta walidacja e-mail
    if (participants) {
      const parsedParticipants = participants.split(',').map((p) => p.trim());
      parsedParticipants.forEach((part) => {
        // Oczekujemy formatu "Jan jan@example.com"
        // Podział np. po spacji / inny
        // Bardziej zaawansowane parsowanie do dopracowania w docelowej implementacji
        const parts = part.split(' ');
        if (parts.length < 2 || !parts[parts.length - 1].includes('@')) {
          newErrors.push(`Niepoprawny format uczestnika: "${part}"`);
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleGenerateICS = () => {
    // Najpierw walidacja
    if (!validateData()) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    let eventDuration = parseInt(duration);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }

    // Generowanie tablicy ALARMÓW
    const alarms = [
      {
        action: 'display',
        description: `Powiadomienie o wydarzeniu: ${title}`,
        trigger: { minutes: parseInt(notificationTime), before: true },
      },
    ];

    // Parsujemy uczestników do formatu [{ name: '', email: '' }, ...]
    let attendees = [];
    if (participants.trim()) {
      // "Jan jan@example.com, Anna anna@example.com"
      attendees = participants.split(',').map((p) => {
        const part = p.trim().split(' ');
        // Zakładamy, że ostatni "wyraz" to e-mail
        const email = part[part.length - 1];
        const name = part.slice(0, part.length - 1).join(' ');
        return { name, email };
      });
    }

    // Ustalenie reguły powtarzania
    // Jeśli jest advancedRRule, korzystamy z niego wprost
    // w przeciwnym wypadku prosty "FREQ=DAILY/WEEKLY..." itp.
    let rrule = undefined;
    if (advancedRRule.trim()) {
      rrule = advancedRRule.trim();
    } else if (recurrence !== 'none') {
      rrule = `FREQ=${recurrence.toUpperCase()}`;
    }

    const event = {
      start: [year, month, day, hours, minutes],
      duration: { minutes: eventDuration },
      title,
      description,
      location,    // nowość
      startOutputType: 'local', // sygnalizujemy, że dane są w lokalnej strefie
      // Niektóre wersje biblioteki ics wspierają parametr tz i VTIMEZONE, ale bywa to bardziej złożone
      alarms,
      attendees,
      recurrenceRule: rrule,
      // Możesz też rozważyć klucz "productId" czy "uid", np. productId: "//MamPlan//" 
      // aby ICS miał unikalne ID produktu
    };

    createEvents([event], (error, value) => {
      if (error) {
        console.log(error);
        alert('Błąd przy generowaniu ICS: ' + error.message);
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
  };

  const handleAddToGoogle = () => {
    // Najpierw walidacja
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }
    const endDateTime = new Date(dateTimeStr);
    endDateTime.setMinutes(endDateTime.getMinutes() + eventDuration);

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('details', description);

    // Lokalizacja w Google:
    if (location) {
      googleUrl.searchParams.append('location', location);
    }

    // Niestety, Google używa własnych powiadomień i nie ma oficjalnego parametru do niestandardowego przypomnienia w linku.
    // Parametr strefy czasowej (ctz):
    googleUrl.searchParams.append('ctz', timeZone);

    // Format dat: YYYYMMDDTHHmmss
    const startStr = dateTimeStr.replace(/[-:]/g, '');
    const endStr = format(endDateTime, "yyyyMMdd'T'HHmmss");
    googleUrl.searchParams.append('dates', `${startStr}/${endStr}`);

    // Zaawansowana reguła RRULE
    let rrule = '';
    if (advancedRRule.trim()) {
      rrule = `RRULE:${advancedRRule.trim()}`;
    } else if (recurrence !== 'none') {
      rrule = `RRULE:FREQ=${recurrence.toUpperCase()}`;
    }
    if (rrule) {
      googleUrl.searchParams.append('recur', rrule);
    }

    // Dodawanie uczestników
    // Nie ma 100% oficjalnego parametru "attendees" w Google Calendar Link API,
    // ale można użyć `add` kilkukrotnie (czasem działa, zależy od interpretacji Google):
    // np. &add=jan@example.com&add=anna@example.com
    if (participants.trim()) {
      const parsedParticipants = participants.split(',').map((p) => p.trim().split(' ').pop());
      parsedParticipants.forEach((email) => {
        googleUrl.searchParams.append('add', email);
      });
    }

    window.open(googleUrl.toString(), '_blank');
  };

  const handleShareViaEmail = () => {
    // Walidacja
    if (!validateData()) return;

    const dateTimeStr = `${date}T${time}:00`;
    let eventDuration = parseInt(duration);
    if (useEndTime && endTime) {
      eventDuration = calculateDuration();
    }
    const endDateTime = addMinutes(new Date(dateTimeStr), eventDuration);

    const formattedDate = format(new Date(dateTimeStr), 'dd.MM.yyyy');
    const formattedStartTime = format(new Date(dateTimeStr), 'HH:mm');
    const formattedEndTime = format(endDateTime, 'HH:mm');

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

    // Możesz uwzględnić uczestników, np. dodać w treści maila, 
    // ale tutaj używamy tylko "emails" z formularza
    if (!emails.trim()) {
      alert('Nie podano adresów email do wysłania.');
      return;
    }

    const mailtoLink = `mailto:${emails}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    // Planowe powiadomienie w przeglądarce
    scheduleNotification();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Mam plan (rozszerzona wersja)
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

          <div className="space-y-6">
            {/* Tytuł */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tytuł wydarzenia
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 
                  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                className="mt-1 block w-full rounded-md border-gray-300 
                  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                rows={3}
                placeholder="Dodatkowe informacje..."
              />
            </div>

            {/* Data i czas rozpoczęcia */}
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
                    className="block w-full pl-10 rounded-md border-gray-300 
                      shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                    className="block w-full pl-10 rounded-md border-gray-300 
                      shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                      className="block w-full pl-10 rounded-md border-gray-300 
                        shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                ) : (
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 
                      shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Powtarzanie (proste)
                </label>
                <div className="mt-1 relative">
                  <Repeat className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 
                      shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  >
                    <option value="none">Nie powtarzaj</option>
                    <option value="daily">Codziennie</option>
                    <option value="weekly">Co tydzień</option>
                    <option value="monthly">Co miesiąc</option>
                    <option value="yearly">Co rok</option>
                  </select>
                </div>
              </div>
            </div>

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
              <p className="text-xs text-gray-500 mt-1">
                Pozostaw puste, jeśli wolisz użyć opcji powyżej.  
                Jeśli wypełnisz, nadpisze proste powtarzanie.
              </p>
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
                  className="block w-full pl-10 rounded-md border-gray-300 
                    shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="Np. Adres / link do spotkania online"
                />
              </div>
            </div>

            {/* Uczestnicy */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uczestnicy (Imię i email)
              </label>
              <div className="mt-1 relative">
                <Users className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="block w-full pl-10 rounded-md border-gray-300 
                    shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder='Np. "Jan jan@example.com, Anna anna@example.com"'
                />
              </div>
            </div>

            {/* Adresy email (do wysyłania mailto) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adresy email do wysłania (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 
                  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder="jan@example.com, anna@example.com"
              />
            </div>

            {/* Strefa czasowa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Strefa czasowa (dla Google Calendar)
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 
                  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="Europe/Warsaw">Europe/Warsaw</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                {/* Możesz dodać kolejne popularne strefy / albo wczytać dynamicznie z biblioteki */}
              </select>
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

            {/* Przyciski akcji */}
            <div className="grid grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  );
}

export default App;
