export interface RmpRating {
    id: string;
    date: string,
    class: string,
    grade: string,
    comment: string,
    legacyId: number,
    ratingTags: string,
    isForCredit: boolean,
    clarityRating: number,
    helpfulRating: number,
    thumbsUpTotal: number,
    wouldTakeAgain: number,
    thumbsDownTotal: number,
    difficultyRating: number,
    isForOnlineClass: boolean,
    attendanceMandatory: string;
}