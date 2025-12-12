import { Match, User } from "@prisma/client";

type UserWithMatches = User & {
    matchesWon?: Match[];
    matchesAsPlayer1?: Match[];
    matchesAsPlayer2?: Match[];
};

/**
 * Calculate the number of matches won by a user
 */
export function calculateWins(user: UserWithMatches): number {
    return user.matchesWon?.length || 0;
}

/**
 * Calculate total matches played by a user
 */
export function calculateTotalMatches(user: UserWithMatches): number {
    const player1Matches = user.matchesAsPlayer1?.map(m => m.id) || [];
    const player2Matches = user.matchesAsPlayer2?.map(m => m.id) || [];
    return new Set([...player1Matches, ...player2Matches]).size;
}

/**
 * Calculate the number of matches lost by a user
 */
export function calculateLosses(user: UserWithMatches): number {
    return calculateTotalMatches(user) - calculateWins(user);
}

/**
 * Calculate win rate as a percentage (0-100)
 */
export function calculateWinRate(user: UserWithMatches): number {
    const total = calculateTotalMatches(user);
    if (total === 0) return 0;
    return Math.round((calculateWins(user) / total) * 100);
}
