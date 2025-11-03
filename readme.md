# WIT-Calendar

## Broad Idea/Scope
Generate a calendar invite/import classes into the user's calendar (including end date, frequency, etc)

## Getting the data
Chrome Extension to nab the data

("private" data taken only from here: https://selfservice.wit.edu/StudentRegistrationSsb/ssb/classRegistration/getRegistrationEvents?termFilter=)

All other data can be gathered via *public* APIs.

## Creating the Calendar
There's two main ways to do this, we can at least do #1, but ideally both.

1. Generate an ICS file. Compatible with basically all calendars - Only issue is that it's slightly annoying to import to most Calendars outside of an email
   - Allow for generating an ICS per class/only importing specific classes
2. Google Calendar API, directly add the events - This would allow a more direct google integration, but is obviously only for google calendar

On top of this, we need a server to host the calendar URL (and for updating).

## Setup
See instructions for setting up the extension [here](https://github.com/WITCodingClub/calendar/blob/main/client/README.md).
See instructions for setting up the backend [here](https://github.com/jaspermayone/witcc-calendar-backend/blob/main/README.md).