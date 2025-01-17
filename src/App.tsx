import React, { useState } from 'react';
import { Calendar, Clock, Download, Mail, Repeat, Share2 } from 'lucide-react';
import { createEvents } from 'ics';
import { format, addMinutes, differenceInMinutes } from 'date-fns';

function App() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    duration: '60',
    recurrence: 'none',
    emails: '',
    useEndTime: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const calculateDuration = () => {
    const { date, time, endTime } = formData;
    if (!date || !time || !endTime) return 0;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return differenceInMinutes(endDateTime, startDateTime);
  };

  const handleGenerateICS = () => {
    const { date, time, title, description, duration, recurrence } = formData;
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const event = {
      start: [year, month, day, hours, minutes],
      duration: { minutes: parseInt(duration) },
      title,
      description,
      recurrenceRule: recurrence === 'none' ? undefined : `FREQ=${recurrence.toUpperCase()}`,
    };

    createEvents([event], (error, value) => {
      if (error) {
        console.log(error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plan-event.ics';
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleAddToGoogle = () => {
    const { date, time, title, description, duration, recurrence } = formData;
    const dateTimeStr = `${date}T${time}:00`;
    const endDateTime = addMinutes(new Date(dateTimeStr), parseInt(duration));

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('details', description);
    googleUrl.searchParams.append(
      'dates',
      `${dateTimeStr.replace(/[-:]/g, '')}/${format(endDateTime, "yyyyMMdd'T'HHmmss")}`
    );

    if (recurrence !== 'none') {
      googleUrl.searchParams.append('recur', `RRULE:FREQ=${recurrence.toUpperCase()}`);
    }

    window.open(googleUrl.toString(), '_blank');
  };

  const handleShareViaEmail = () => {
    const { date, time, duration, title, description, emails } = formData;
    const dateTimeStr = `${date}T${time}:00`;
    const endDateTime = addMinutes(new Date(dateTimeStr), parseInt(duration));

    const formattedDate = format(new Date(dateTimeStr), 'dd.MM.yyyy');
    const formattedStartTime = format(new Date(dateTimeStr), 'HH:mm');
    const formattedEndTime = format(endDateTime, 'HH:mm');

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `Zapraszam na wydarzenie:

${title}
Data: ${formattedDate}
Czas: ${formattedStartTime} - ${formattedEndTime}

${description}

Dodaj do swojego kalendarza klikając w załączony plik .ics`
    );

    const mailtoLink = `mailto:${emails}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Mam plan</h1>
          <div className="space-y-6">
            {/** Title Input **/}
            <InputField
              label="Tytuł wydarzenia"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Np. Spotkanie z przyjaciółmi"
            />
            {/** Description Input **/}
            <InputField
              label="Opis"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Dodatkowe informacje..."
              isTextArea
            />
            {/** Date and Time Inputs **/}
            <DateTimeFields formData={formData} handleChange={handleChange} calculateDuration={calculateDuration} />
            {/** Email Input **/}
            <InputField
              label="Adresy email (oddzielone przecinkami)"
              name="emails"
              value={formData.emails}
              onChange={handleChange}
              placeholder="jan@example.com, anna@example.com"
            />
            {/** Action Buttons **/}
            <div className="grid grid-cols-3 gap-4">
              <ActionButton label="Pobierz ICS" icon={<Download />} onClick={handleGenerateICS} />
              <ActionButton label="Google" icon={<Mail />} onClick={handleAddToGoogle} />
              <ActionButton label="Wyślij" icon={<Share2 />} onClick={handleShareViaEmail} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, isTextArea = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {isTextArea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function DateTimeFields({ formData, handleChange, calculateDuration }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <InputField
        label="Data"
        name="date"
        value={formData.date}
        onChange={handleChange}
        placeholder=""
      />
      <InputField
        label="Czas rozpoczęcia"
        name="time"
        value={formData.time}
        onChange={handleChange}
        placeholder=""
      />
      {formData.useEndTime && (
        <InputField
          label="Czas zakończenia"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

function ActionButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
