import { type Building } from './Building';

export interface Location {
    building: Building;
    room: string;
}