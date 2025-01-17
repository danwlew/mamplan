import React, { useState } from 'react';
import { Calendar, Clock, Download, Mail, Repeat, Share2 } from 'lucide-react';
import { createEvents } from 'ics';
import { format, addMinutes, differenceInMinutes } from 'date-fns';

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [recurrence, setRecurrence] = useState('none');
  const [emails, setEmails] = useState('');
  const [useEndTime, setUseEndTime] = useState(false);

  const calculateDuration = () => {
    if (!date || !time || !endTime) return 0;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return differenceInMinutes(endDateTime, startDateTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
    if (date && time && e.target.value) {
      const durationMinutes = calculateDuration();
      setDuration(durationMinutes.toString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    if (useEndTime && date && endTime) {
      const durationMinutes = calculateDuration();
      setDuration(durationMinutes.toString());
    }
  };

  const handleGenerateICS = () => {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const event = {
      start: [year, month, day, hours, minutes],
      duration: { minutes: parseInt(duration) },
      title: title,
      description: description,
      recurrenceRule: recurrence === 'none' ? undefined : `FREQ=${recurrence.toUpperCase()}`
    };

    createEvents([event], (error: Error | undefined, value: string) => {
      if (error) {
        console.log(error);
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
    const dateTimeStr = `${date}T${time}:00`;
    const endDateTime = new Date(dateTimeStr);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('details', description);
    googleUrl.searchParams.append('dates', 
      `${dateTimeStr.replace(/[-:]/g, '')}/${format(endDateTime, "yyyyMMdd'T'HHmmss")}`
    );
    
    if (recurrence !== 'none') {
      googleUrl.searchParams.append('recur', `RRULE:FREQ=${recurrence.toUpperCase()}`);
    }

    window.open(googleUrl.toString(), '_blank');
  };

  const handleShareViaEmail = () => {
    const dateTimeStr = `${date}T${time}:00`;
    const endDateTime = addMinutes(new Date(dateTimeStr), parseInt(duration));
    
    const formattedDate = format(new Date(dateTimeStr), 'dd.MM.yyyy');
    const formattedStartTime = format(new Date(dateTimeStr), 'HH:mm');
    const formattedEndTime = format(endDateTime, 'HH:mm');
    
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `Zapraszam na wydarzenie:\n\n` +
      `${title}\n` +
      `Data: ${formattedDate}\n` +
      `Czas: ${formattedStartTime} - ${formattedEndTime}\n\n` +
      `${description}\n\n` +
      `Dodaj do swojego kalendarza klikając w załączony plik .ics`
    );
    
    const mailtoLink = `mailto:${emails}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Mam plan
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tytuł wydarzenia
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder="Np. Spotkanie z przyjaciółmi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Opis
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                rows={3}
                placeholder="Dodatkowe informacje..."
              />
            </div>

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
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                    onChange={handleTimeChange}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>
            </div>

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
                      onChange={handleEndTimeChange}
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                ) : (
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                  Powtarzanie
                </label>
                <div className="mt-1 relative">
                  <Repeat className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adresy email (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder="jan@example.com, anna@example.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleGenerateICS}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Pobierz ICS
              </button>

              <button
                onClick={handleAddToGoogle}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Mail className="h-5 w-5 mr-2" />
                Google
              </button>

              <button
                onClick={handleShareViaEmail}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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