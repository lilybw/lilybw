import { describe, expect, suite, test } from "vitest";
import { parseVarargs } from "./linearGradient";

suite('SVG#LinearGradient Test Suite', () => {

    describe('Parse Varargs Test Suite', () => {

        test('Handles no args', () => {
            const res = parseVarargs([]);
            expect(res).toEqual([]);
        });

        test('Handles 1 incomplete arg', () => {
            const res = parseVarargs(['color']);
            expect(res).toEqual([['color', 0]]);
        });

        test ('Handles 2 incomplete args special case A', () => {
            const res = parseVarargs(['colorA', 'colorB']);
            expect(res).toEqual([['colorA', 0], ['colorB', 100]]);
        });

        test ('Handles 2 incomplete args special case B', () => {
            const res = parseVarargs(['colorA', 30, 'colorB']);
            expect(res).toEqual([['colorA', 30], ['colorB', 100]]);
        });

        test ('Handles 2 incomplete args standard case', () => {
            const res = parseVarargs(['colorA', 'colorB', 50]);
            expect(res).toEqual([['colorA', 0], ['colorB', 50]]);
        });

        test ('Handles 2 complete args', () => {
            const res = parseVarargs(['colorA', 10, 'colorB', 50]);
            expect(res).toEqual([['colorA', 10], ['colorB', 50]]);
        });

        test ('Handles 3 incomplete args', () => {
            const res = parseVarargs(['colorA', 'colorB', 'colorC']);
            expect(res).toEqual([['colorA', 0], ['colorB', 50], ['colorC', 100]]);
        });

        test ('Handles 2 incomplete and 1 complete args A', () => {
            const res = parseVarargs(['colorA', 10, 'colorB', 'colorC']);
            expect(res).toEqual([['colorA', 10], ['colorB', 55], ['colorC', 100]]);
        });

        test ('Handles 2 incomplete and 1 complete args B', () => {
            const res = parseVarargs(['colorA', 'colorB', 20, 'colorC']);
            expect(res).toEqual([['colorA', 0], ['colorB', 20], ['colorC', 100]]);
        });

        test ('Handles 2 incomplete and 1 complete args C', () => {
            const res = parseVarargs(['colorA', 'colorB', 'colorC', 90]);
            expect(res).toEqual([['colorA', 0], ['colorB', 45], ['colorC', 90]]);
        });

        test ('Handles 2 incomplete and 1 complete args D', () => {
            const res = parseVarargs(['colorA', 'colorB', 'colorC', 50]);
            expect(res).toEqual([['colorA', 0], ['colorB', 25], ['colorC', 50]]);
        });
        
        test ('Handles 2 complete and 1 incomplete args A', () => {
            const res = parseVarargs(['colorA', 5, 'colorB', 'colorC', 55]);
            console.log(res)
            expect(res).toEqual([['colorA', 5], ['colorB', 30], ['colorC', 55]]);
        });
    });


});