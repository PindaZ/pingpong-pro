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

// ---------------------------------------------------------
// ADVANCED POINT-BASED ANALYTICS
// ---------------------------------------------------------

export function collectUserGames(user: UserWithMatches & { matchesAsPlayer1?: (Match & { games: any[] })[], matchesAsPlayer2?: (Match & { games: any[] })[] }) {
    const allMatches = [
        ...(user.matchesAsPlayer1 || []),
        ...(user.matchesAsPlayer2 || [])
    ].filter(m => m.status === 'VALIDATED');

    let totalPointsFor = 0;
    let totalPointsAgainst = 0;
    let totalGames = 0;
    let clutchWins = 0;
    let totalWins = 0;

    for (const match of allMatches) {
        if (!match.games) continue;
        const isPlayer1 = match.player1Id === user.id;

        for (const game of match.games) {
            const myPoints = isPlayer1 ? game.scorePlayer1 : game.scorePlayer2;
            const oppPoints = isPlayer1 ? game.scorePlayer2 : game.scorePlayer1;

            totalPointsFor += myPoints;
            totalPointsAgainst += oppPoints;
            totalGames++;

            if (myPoints > oppPoints) {
                totalWins++;
                // A clutch win is defined as winning by exactly 2 points
                if (myPoints - oppPoints === 2) {
                    clutchWins++;
                }
            }
        }
    }

    return { totalPointsFor, totalPointsAgainst, totalGames, clutchWins, totalWins };
}

export function calculateAveragePointsPerGame(stats: ReturnType<typeof collectUserGames>): number {
    if (stats.totalGames === 0) return 0;
    return Number((stats.totalPointsFor / stats.totalGames).toFixed(1));
}

export function calculatePointDifferential(stats: ReturnType<typeof collectUserGames>): number {
    return stats.totalPointsFor - stats.totalPointsAgainst;
}

export function calculateClutchFactor(stats: ReturnType<typeof collectUserGames>): number {
    if (stats.totalWins === 0) return 0;
    return Math.round((stats.clutchWins / stats.totalWins) * 100);
}
