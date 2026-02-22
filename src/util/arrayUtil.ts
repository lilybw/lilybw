
export const appendMutatedCopy = <T>(arr: T[], mutator: (t: T) => T) => {
    return [...arr, ...arr.map(mutator)];
}

