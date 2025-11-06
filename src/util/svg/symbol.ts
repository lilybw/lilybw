export const _DirectiveSymbols: { [key: string]: string } = {
        MoveTo: "M",
        MoveToRel: "m",
        LineTo: "L",
        LineToRel: "l",
        CurveTo: "C",
        CurveToRel: "c",
        ArcTo: "A",
        ArcToRel: "a",
        End: "Z"
    } as const;

export type DirectiveSymbol = keyof typeof _DirectiveSymbols;