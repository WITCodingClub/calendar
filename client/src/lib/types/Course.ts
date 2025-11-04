import { type Term } from './Term';
import { type Professor } from './Professor';
import { type MeetingTime } from './MeetingTime';

export interface Course {
    title: string;
    course_number: number;
    schedule_type: string;
    term: Term;
    professor: Professor;
    meeting_times: MeetingTime[];
}