import type { Location } from './Location';

export interface MeetingTime {
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