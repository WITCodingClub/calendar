import { type RmpRating } from './RmpRating';

export interface RmpEndpointResponse {
    faculty_name: string,
    email: string,
    rmp_id: string,
    avg_rating: number
    avg_difficulty: number
    num_ratings: number,
    would_take_again_percent: number,
    rmp_ratings: RmpRating[]
}