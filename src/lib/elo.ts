export interface GameScore {
    scoreWinner: number;
    scoreLoser: number;
}

export function calculateElo(
    winnerElo: number,
    loserElo: number,
    games: GameScore[] = []
): { newWinnerElo: number; newLoserElo: number; eloChange: number } {
    let baseKFactor = 32;

    // Dynamic ELO: Adjust K-factor based on dominance
    if (games.length > 0) {
        let totalWinnerPoints = 0;
        let totalLoserPoints = 0;

        games.forEach(g => {
            totalWinnerPoints += g.scoreWinner;
            totalLoserPoints += g.scoreLoser;
        });

        const pointRatio = totalLoserPoints > 0 ? totalWinnerPoints / totalLoserPoints : totalWinnerPoints;

        // If point ratio is very high (e.g. > 2.0 like 11-5 average), increase K up to max 48
        // If it was a tight struggle (e.g. < 1.2 like 12-10 average), reduce K down to 24
        if (pointRatio > 2.0) {
            baseKFactor = 48; // Domination
        } else if (pointRatio > 1.5) {
            baseKFactor = 40; // Solid win
        } else if (pointRatio < 1.2) {
            baseKFactor = 24; // Struggle
        }
    }

    // Calculate expected score for winner
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

    // Calculate expected score for loser
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    // Actual scores
    const actualWinner = 1;
    const actualLoser = 0;

    // Calculate new ELOs
    const eloChange = Math.round(baseKFactor * (actualWinner - expectedWinner));

    const newWinnerElo = winnerElo + eloChange;
    const newLoserElo = loserElo - eloChange;

    return {
        newWinnerElo,
        newLoserElo,
        eloChange,
    };
}
