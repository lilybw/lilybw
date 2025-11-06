const pool: string[] = [];

export const getNextHash = (): string => {
    let toReturn = pool.pop();
    if (toReturn === undefined) {
        for (let i = 0; i < 1000; i++) {
            const newHash = Math.random().toString(36).slice(2, 9);
            pool.push(newHash);
        }
        toReturn = pool.pop()!;
    }
    return toReturn;
}
