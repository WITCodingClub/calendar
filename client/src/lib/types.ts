interface Building {
    name: string;
    abbreviation: string;
}

interface Course {
    title: string;
    prefix: string;
    course_number: number;
    schedule_type: string;
    term: Term;
    professor: Professor;
    meeting_times: MeetingTime[];
}

interface Location {
    building: Building;
    room: string;
}

interface MeetingTime {
    id: number;
    begin_time: string;
    end_time: string;
    start_date: string;
    end_date: string;
    location: Location;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

interface isProcessed {
    processed: boolean;
}

interface Professor {
    first_name: string;
    last_name: string;
    email: string;
    rmp_id?: string;
}

interface ResponseData {
    ics_url: string;
    classes: Course[];
}

interface ProcessedEvents {
    classes: Course[];
}

interface Term {
    uid: number;
    season: string;
    year: number;
}

interface UserSettings {
    military_time: boolean;
    default_color_lecture: string;
    default_color_lab: string;
}

interface CurrentTerm {
    name: string;
    id: number;
}

interface NextTerm {
    name: string;
    id: number;
}

interface TermResponse {
    current_term: CurrentTerm;
    next_term: NextTerm;
}

export {
  type Building,
  type Course,
  type Location,
  type MeetingTime,
  type Professor,
  type ResponseData,
  type Term,
  type UserSettings,
  type CurrentTerm,
  type NextTerm,
  type TermResponse,
  type isProcessed,
  type ProcessedEvents
};
