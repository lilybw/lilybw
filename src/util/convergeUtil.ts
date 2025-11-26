export const convergeToArray = <T>(e: undefined | null | T | T[]): T[] => {
    if (!e || e === null) {
        return [];
    }

    return Array.isArray(e) ? e : [e];
}