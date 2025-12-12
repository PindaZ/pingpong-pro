export const MOCK_USERS = [
    {
        id: "1",
        name: "Alex 'The Smash' Chen",
        role: "ADMIN",
        elo: 1450,
        avatar: "https://i.pravatar.cc/150?u=1",
        wins: 42,
        losses: 12,
    },
    {
        id: "2",
        name: "Sarah Jenkins",
        role: "USER",
        elo: 1320,
        avatar: "https://i.pravatar.cc/150?u=2",
        wins: 28,
        losses: 15,
    },
    {
        id: "3",
        name: "Mike Ross",
        role: "USER",
        elo: 1200,
        avatar: "https://i.pravatar.cc/150?u=3",
        wins: 10,
        losses: 8,
    },
    {
        id: "4",
        name: "Jessica Pearson",
        role: "SUPERADMIN",
        elo: 1600,
        avatar: "https://i.pravatar.cc/150?u=4",
        wins: 80,
        losses: 5,
    },
];

export const MOCK_MATCHES = [
    {
        id: "m1",
        player1: MOCK_USERS[0],
        player2: MOCK_USERS[1],
        winnerId: "1",
        score: [
            { p1: 11, p2: 8 },
            { p1: 9, p2: 11 },
            { p1: 11, p2: 5 },
        ],
        date: "2023-10-25T14:30:00Z",
        status: "VALIDATED",
    },
    {
        id: "m2",
        player1: MOCK_USERS[3],
        player2: MOCK_USERS[2],
        winnerId: null, // Pending
        score: [
            { p1: 11, p2: 6 },
            { p1: 12, p2: 10 },
        ],
        date: "2023-10-26T09:15:00Z",
        status: "PENDING",
    },
    {
        id: "m3",
        player1: MOCK_USERS[1],
        player2: MOCK_USERS[2],
        winnerId: "2",
        score: [
            { p1: 11, p2: 4 },
            { p1: 11, p2: 7 },
        ],
        date: "2023-10-24T18:00:00Z",
        status: "VALIDATED",
    },
];

export const MOCK_TOURNAMENTS = [
    {
        id: "t1",
        name: "Winter Office Cup 2023",
        startDate: "2023-11-01",
        endDate: "2023-11-15",
        participants: 16,
        status: "UPCOMING",
    },
    {
        id: "t2",
        name: "Summer Slam",
        startDate: "2023-07-01",
        endDate: "2023-07-15",
        participants: 32,
        status: "COMPLETED",
        winner: MOCK_USERS[3],
    },
];
