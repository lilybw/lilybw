// @ts-nocheck

import { describe, expect, suite, test } from "vitest";
import { LinearGradient, parseVarargs } from "./linearGradient";
import { prettyFormat, render } from "@solidjs/testing-library"

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
            expect(res).toEqual([['colorA', 5], ['colorB', 30], ['colorC', 55]]);
        });
    });

    describe('LinearGradient Constructor', () => {
        
        test('Creates gradient with no stops', () => {
            const gradient = new LinearGradient();
            const element = gradient.toJSXElement('test-svg');
            const { container } = render(() => element);
            expect(container.children).toHaveLength(1);
        });

        test('Creates gradient with two color stops', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            const element = gradient.toJSXElement('test-svg');
            const { container } = render(() => element);
            console.log(container.innerHTML)
            expect(container.children).toHaveLength(3); // linearGradient + 2 stops
        });

        test('Creates gradient with explicit percentages', () => {
            const gradient = new LinearGradient('#ff0000', 0, '#00ff00', 50, '#0000ff', 100);
            const element = gradient.toJSXElement('test-svg');
            const { container } = render(() => element);
            expect(container.children).toHaveLength(4);
        });

        test('Creates gradient with mixed explicit and implicit percentages', () => {
            const gradient = new LinearGradient('#ff0000', '#00ff00', 75, '#0000ff');
            const element = gradient.toJSXElement('test-svg');
            const { container } = render(() => element);
            expect(container.children).toHaveLength(4);
        });
    });

    describe('LinearGradient Name Management', () => {
        
        test('Has default name', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            expect(gradient.getURL()).toBe('unnamed-linear-gradient');
        });

        test('Sets custom name', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.setName('my-gradient');
            expect(gradient.getURL()).toBe('my-gradient');
        });

        test('Name is reflected in JSX element ID', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.setName('custom-gradient');
            const element = gradient.toJSXElement('svg-123');
            const { container } = render(() => element);
            expect((container.firstChild as any)['id']).toBe('custom-gradient-svg-123');
        });
    });

    describe('LinearGradient Options - Angle Direction', () => {
        
        test('Defaults to 0 degrees (horizontal right)', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            const element = gradient.toJSXElement('test');
            const { container } = render(() => element);

            let firstChild = container.firstChild as any;
            expect(firstChild).toBeDefined();
            expect(firstChild).not.toBeNull();
            
            expect(firstChild['x1']).toBe('100%');
            expect(firstChild['y1']).toBe('50%');
            expect(firstChild['x2']).toBe('0%');
            expect(firstChild['y2']).toBe('50%');
        });

        test('Handles 90 degrees (vertical down)', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: 90 });
            const element = gradient.toJSXElement('test');
            const { container } = render(() => element);
            
            let firstChild = container.firstChild as any;
            expect(firstChild).toBeDefined();
            expect(firstChild).not.toBeNull();

            // At 90 degrees: cos(90°) = 0, sin(90°) = 1
            expect(firstChild['x1']).toBe('50%');
            expect(firstChild['y1']).toBe('100%');
            expect(firstChild['x2']).toBe('50%');
            expect(firstChild['y2']).toBe('0%');
        });

        test('Handles 180 degrees (horizontal left)', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: 180 });
            const element = gradient.toJSXElement('test');

            const { container } = render(() => element);
            
            let firstChild = container.firstChild as any;
            expect(firstChild).toBeDefined();
            expect(firstChild).not.toBeNull();

            
            // At 180 degrees: cos(180°) = -1, sin(180°) = 0
            expect(firstChild['x1']).toBe('0%');
            expect(firstChild['y1']).toBe('50%');
            expect(firstChild['x2']).toBe('100%');
            expect(firstChild['y2']).toBe('50%');
        });

        test('Handles 270 degrees (vertical up)', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: 270 });
            const element = gradient.toJSXElement('test');
            const { container } = render(() => element);
            
            let firstChild = container.firstChild as any;
            expect(firstChild).toBeDefined();
            expect(firstChild).not.toBeNull();

            // At 270 degrees: cos(270°) = 0, sin(270°) = -1
            expect(firstChild['x1']).toBe('50%');
            expect(firstChild['y1']).toBe('0%');
            expect(firstChild['x2']).toBe('50%');
            expect(firstChild['y2']).toBe('100%');
        });

        test('Handles 45 degrees (diagonal)', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: 45 });
            const element = gradient.toJSXElement('test');

            const { container } = render(() => element);
            
            let firstChild = container.firstChild as any;
            expect(firstChild).toBeDefined();
            expect(firstChild).not.toBeNull();

            // At 45 degrees: cos(45°) ≈ 0.707, sin(45°) ≈ 0.707
            const x1 = parseFloat(firstChild['x1']);
            const y1 = parseFloat(firstChild['y1']);
            const x2 = parseFloat(firstChild['x2']);
            const y2 = parseFloat(firstChild['y2']);
            
            expect(x1).toBeGreaterThan(85);
            expect(x1).toBeLessThan(86);
            expect(y1).toBeGreaterThan(85);
            expect(y1).toBeLessThan(86);
            expect(x2).toBeGreaterThan(14);
            expect(x2).toBeLessThan(15);
            expect(y2).toBeGreaterThan(14);
            expect(y2).toBeLessThan(15);
        });
    });

    describe('LinearGradient Options - Vector Direction', () => {
        
        test('Handles normalized vector [50, 0]', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: [50, 0] });
            const element = gradient.toJSXElement('test');
            
            expect(element.props.x1).toBe('100%');
            expect(element.props.y1).toBe('50%');
            expect(element.props.x2).toBe('0%');
            expect(element.props.y2).toBe('50%');
        });

        test('Handles normalized vector [0, 50]', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: [0, 50] });
            const element = gradient.toJSXElement('test');
            
            expect(element.props.x1).toBe('50%');
            expect(element.props.y1).toBe('100%');
            expect(element.props.x2).toBe('50%');
            expect(element.props.y2).toBe('0%');
        });

        test('Handles normalized vector [25, 25]', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: [25, 25] });
            const element = gradient.toJSXElement('test');
            
            expect(element.props.x1).toBe('75%');
            expect(element.props.y1).toBe('75%');
            expect(element.props.x2).toBe('25%');
            expect(element.props.y2).toBe('25%');
        });

        test('Handles non-normalized vector and normalizes it', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ direction: [100, 0] });
            const element = gradient.toJSXElement('test');
            
            // Should normalize [100, 0] to [50, 0]
            expect(element.props.x1).toBe('100%');
            expect(element.props.y1).toBe('50%');
            expect(element.props.x2).toBe('0%');
            expect(element.props.y2).toBe('50%');
        });
    });

    describe('LinearGradient Options - Custom Attributes', () => {
        
        test('Passes through custom SVG attributes', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.options({ 
                attributes: { 
                    gradientUnits: 'userSpaceOnUse',
                    spreadMethod: 'reflect'
                } 
            });
            const element = gradient.toJSXElement('test');
            
            expect(element.props.gradientUnits).toBe('userSpaceOnUse');
            expect(element.props.spreadMethod).toBe('reflect');
        });
    });

    describe('LinearGradient Method Chaining', () => {
        
        test('options() returns this for chaining', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            const result = gradient.options({ direction: 90 });
            expect(result).toBe(gradient);
        });

        test('Can chain setName() and options()', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.setName('my-gradient');
            gradient.options({ direction: 45 });
            
            expect(gradient.getURL()).toBe('my-gradient');
            const element = gradient.toJSXElement('test');
            expect(element.props.id).toBe('my-gradient-test');
        });
    });

    describe('LinearGradient JSX Output', () => {
        
        test('Generates correct stop elements', () => {
            const gradient = new LinearGradient('#ff0000', 25, '#00ff00', 50, '#0000ff', 75);
            const element = gradient.toJSXElement('test-svg');
            
            const stops = element.props.children;
            expect(stops).toHaveLength(3);
            expect(stops[0].props.offset).toBe('25%');
            expect(stops[0].props['stop-color']).toBe('#ff0000');
            expect(stops[1].props.offset).toBe('50%');
            expect(stops[1].props['stop-color']).toBe('#00ff00');
            expect(stops[2].props.offset).toBe('75%');
            expect(stops[2].props['stop-color']).toBe('#0000ff');
        });

        test('Includes svgId in element ID', () => {
            const gradient = new LinearGradient('#ff0000', '#0000ff');
            gradient.setName('test-gradient');
            
            const element1 = gradient.toJSXElement('svg-1');
            const element2 = gradient.toJSXElement('svg-2');
            
            expect(element1.props.id).toBe('test-gradient-svg-1');
            expect(element2.props.id).toBe('test-gradient-svg-2');
        });
    });

    describe('LinearGradient Edge Cases', () => {
        
        test('Handles single color stop', () => {
            const gradient = new LinearGradient('#ff0000');
            const element = gradient.toJSXElement('test');
            expect(element.props.children).toHaveLength(1);
        });

        test('Handles many color stops', () => {
            const gradient = new LinearGradient(
                '#ff0000', 0,
                '#ff8800', 20,
                '#ffff00', 40,
                '#00ff00', 60,
                '#0000ff', 80,
                '#8800ff', 100
            );
            const element = gradient.toJSXElement('test');
            expect(element.props.children).toHaveLength(6);
        });

        test('Handles fractional percentage values', () => {
            const gradient = new LinearGradient('#ff0000', 0.25, '#0000ff', 0.75);
            const element = gradient.toJSXElement('test');
            
            expect(element.props.children[0].props.offset).toBe('25%');
            expect(element.props.children[1].props.offset).toBe('75%');
        });
    });

});
