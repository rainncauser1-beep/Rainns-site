-- Cal.com booking config per client.
-- cal_event_type_id: the numeric Cal.com event-type ID for this client's
--   "estimate" booking (set up by Rainn in the Koemori Cal.com account).
--   When present, the AI can check availability + book real appointments.
--   When null, the AI falls back to capturing the request for manual booking.
-- cal_timezone: the client's local timezone for slots/bookings.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS cal_event_type_id text,
  ADD COLUMN IF NOT EXISTS cal_timezone       text DEFAULT 'America/Chicago';
