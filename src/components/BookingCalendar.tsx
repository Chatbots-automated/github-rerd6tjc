import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { Calendar, Clock, Loader2, User, Mail } from 'lucide-react';
import { cabins } from '../config/cabins';
import { TimeSlot, BookingFormData } from '../types/booking';
import { useAuth } from '../context/AuthContext';
import { createBooking, fetchAvailableTimeSlots } from '../services/bookingService';

export default function BookingCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCabin, setSelectedCabin] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const loadTimeSlots = async (cabinId: string, date: Date) => {
    try {
      setLoading(true);
      setError('');
      const slots = await fetchAvailableTimeSlots(cabinId, format(date, 'yyyy-MM-dd'));
      setTimeSlots(slots);
    } catch (err) {
      setError('Failed to load available time slots');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCabin) {
      loadTimeSlots(selectedCabin, selectedDate);
    } else {
      setTimeSlots([]);
    }
  }, [selectedCabin, selectedDate]);

  const handleCabinSelect = async (cabinId: string) => {
    setSelectedCabin(cabinId);
    setSelectedTime('');
  };

  const formatDateTimeForWebhook = (date: Date, timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const bookingDate = new Date(date);
    bookingDate.setHours(parseInt(hours, 10));
    bookingDate.setMinutes(parseInt(minutes, 10));
    bookingDate.setSeconds(0);
    
    // Format to YYYY-MM-DDTHH:mm:ss+02:00
    return bookingDate.toLocaleString('sv', { timeZone: 'Europe/Vilnius' })
      .replace(' ', 'T') + '+02:00';
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabin || !selectedTime || !fullName || !email) {
      setError('Prašome užpildyti visus laukus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData: BookingFormData = {
        cabin: selectedCabin,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
      };

      // Format date and time for webhook
      const formattedDateTime = formatDateTimeForWebhook(selectedDate, selectedTime);

      // Send data to webhook
      await fetch('https://hook.eu2.make.com/yw5ie28y0kmrkeafigpynd289dk6u1qh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          dateTime: formattedDateTime,
          timeZone: 'Europe/Vilnius',
          cabin: selectedCabin,
          cabinName: cabins.find(c => c.id === selectedCabin)?.name || '',
        }),
      });

      await createBooking({
        ...bookingData,
        userId: user?.uid || 'anonymous',
        userEmail: email,
        status: 'confirmed',
      });

      // Reset form
      setSelectedCabin('');
      setSelectedTime('');
      setTimeSlots([]);
      setFullName('');
      setEmail('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Įvyko klaida!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Cabin Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-elida-gold" />
            Select Cabin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cabins.map((cabin) => (
              <button
                key={cabin.id}
                onClick={() => handleCabinSelect(cabin.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedCabin === cabin.id
                    ? 'border-elida-gold bg-elida-gold/5'
                    : 'border-gray-200 hover:border-elida-gold/50'
                }`}
              >
                <h4 className="font-medium text-gray-900">{cabin.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{cabin.description}</p>
                <p className="text-sm font-medium text-elida-gold mt-2">
                  €{cabin.pricePerMinute}/min
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(new Date(), i);
              const isDisabled = isBefore(date, startOfToday());
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg text-center transition-all ${
                    format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                      ? 'bg-elida-gold text-white'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50 hover:bg-elida-gold/20'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {format(date, 'EEE')}
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {format(date, 'd')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-elida-gold" />
            Select Time
          </h3>
          {!selectedCabin ? (
            <p className="text-gray-500 text-center py-4">Please select a cabin first</p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-elida-gold animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? 'bg-elida-gold text-white'
                      : !slot.available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50 hover:bg-elida-gold/20'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contact Information Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-elida-gold" />
            Kontaktinė Informacija
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Vardas Pavardė *
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-elida-gold focus:border-transparent"
                placeholder="Jonas Jonaitis"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                El. Paštas *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-elida-gold focus:border-transparent"
                placeholder="jonas@pavyzdys.lt"
                required
              />
            </div>
          </div>
        </div>

        {/* Booking Button */}
        <button
          onClick={handleBooking}
          disabled={loading || !selectedCabin || !selectedTime || !fullName || !email}
          className="w-full py-4 bg-elida-gold text-white rounded-xl font-medium 
                   hover:bg-elida-accent transition-colors duration-300 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Patvirtinama Rezervacija...
            </div>
          ) : (
            'Patvirtinti Rezervaciją'
          )}
        </button>
      </div>
    </div>
  );
}