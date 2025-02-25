import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Booking, TimeSlot, BookedTimeSlot } from '../types/booking';

const WEBHOOK_URLS = {
  'standing-1': 'https://hook.eu2.make.com/33lxkyn65qmjhcoq1fufr3ydq13uunqw',
  'lying-1': 'https://hook.eu2.make.com/qj2cbsdad1hkswdrt3ckkct3p7bmjsfw',
  'lying-2': 'https://hook.eu2.make.com/dqapvqe5ipg9gupvi44pdoac4llfxv1v'
};

const BUSINESS_HOURS = {
  1: { start: 9, end: 20 }, // Monday
  2: { start: 9, end: 20 }, // Tuesday
  3: { start: 9, end: 20 }, // Wednesday
  4: { start: 9, end: 20 }, // Thursday
  5: { start: 9, end: 20 }, // Friday
  6: { start: 9, end: 16 }, // Saturday
  0: { start: 9, end: 14 }  // Sunday
};

export const fetchAvailableTimeSlots = async (cabinId: string, date: string): Promise<TimeSlot[]> => {
  try {
    const webhookUrl = WEBHOOK_URLS[cabinId as keyof typeof WEBHOOK_URLS];
    if (!webhookUrl) {
      throw new Error('Invalid cabin ID');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch time slots');
    }

    const data = await response.json();
    
    // Extract booked times for the specific date
    const selectedDate = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
    const bookedTimes = data.items?.reduce((acc: string[], event: { start: { dateTime: string } }) => {
      const eventDate = new Date(event.start.dateTime);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      
      // Only include times for the selected date
      if (eventDateStr === selectedDate) {
        acc.push(eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }));
      }
      return acc;
    }, []) || [];

    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date(date).getDay();
    const { start, end } = BUSINESS_HOURS[dayOfWeek as keyof typeof BUSINESS_HOURS];

    // Generate all possible time slots for the day based on business hours
    const timeSlots: TimeSlot[] = [];
    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time slot is booked for the specific date
        const isBooked = bookedTimes.includes(time);

        timeSlots.push({
          time,
          available: !isBooked
        });
      }
    }

    return timeSlots;
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date().toISOString();

    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: now,
      updatedAt: now,
      status: 'confirmed',
    });

    const webhookUrl = WEBHOOK_URLS[bookingData.cabin as keyof typeof WEBHOOK_URLS];
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_booking',
          booking: {
            ...bookingData,
            id: bookingRef.id,
          },
        }),
      });
    }

    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string, cabinId: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    const webhookUrl = WEBHOOK_URLS[cabinId as keyof typeof WEBHOOK_URLS];
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cancel_booking',
          bookingId,
        }),
      });
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};