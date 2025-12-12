export function calculateElo(
    winnerElo: number,
    loserElo: number,
    kFactor: number = 32
): { newWinnerElo: number; newLoserElo: number; eloChange: number } {
    // Calculate expected score for winner
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

    // Calculate expected score for loser
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    // Actual scores
    const actualWinner = 1;
    const actualLoser = 0;

    // Calculate new ELOs
    const eloChange = Math.round(kFactor * (actualWinner - expectedWinner));

    const newWinnerElo = winnerElo + eloChange;
    const newLoserElo = loserElo - eloChange;

    return {
        newWinnerElo,
        newLoserElo,
        eloChange,
    };
}
