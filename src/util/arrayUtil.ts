
export const appendMutatedCopy = <T>(arr: T[], mutator: (t: T) => T) => {
    return [...arr, ...arr.map(mutator)];
}

export const convergeToArray = <T>(e: undefined | null | T | T[]): T[] => {
    if (!e || e === null) {
        return [];
    }

    return Array.isArray(e) ? e : [e];
}