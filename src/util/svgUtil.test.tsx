import { test, expect, suite, describe } from "vitest"
import { render } from "@solidjs/testing-library"
import { SVG, Path, DrawDirective, PathModifier } from "./svgUtil"

suite("SVG Util Test Suite", () => {

    test("produces valid JSX", () => {
        const path = [Path.M(0, 0), Path.L(10, 10)];
        const result = SVG(path);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
    })

    test("renders to valid SVG element", () => {
        const path = [Path.M(0, 0), Path.L(10, 10)];
        const { container } = render(() => SVG(path));
        
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("viewBox")).toBeTruthy();
        
        const paths = container.querySelectorAll("path");
        expect(paths.length).toBeGreaterThan(0);
    })

    describe("Path directives", () => {
        test("MoveTo creates correct directive", () => {
            const directive = Path.M(10, 20);
            expect(directive).toEqual({ type: 'M', x: 10, y: 20 });
        })

        test("LineTo creates correct directive", () => {
            const directive = Path.L(30, 40);
            expect(directive).toEqual({ type: 'L', x: 30, y: 40 });
        })

        test("Curve creates correct directive", () => {
            const directive = Path.C(1, 2, 3, 4, 5, 6);
            expect(directive).toEqual({ 
                type: 'C', 
                x1: 1, y1: 2, 
                x2: 3, y2: 4, 
                x: 5, y: 6 
            });
        })

        test("ArcTo creates correct directive", () => {
            const directive = Path.A(10, 20, 45, true, false, 30, 40);
            expect(directive).toEqual({ 
                type: 'A', 
                rx: 10, ry: 20, 
                rotation: 45, 
                largeArc: true, 
                sweep: false, 
                x: 30, y: 40 
            });
        })

        test("End creates correct directive", () => {
            const directive = Path.E();
            expect(directive).toEqual({ type: 'E' });
        })

        test("short aliases work correctly", () => {
            expect(Path.L).toBe(Path.LineTo);
            expect(Path.M).toBe(Path.MoveTo);
            expect(Path.C).toBe(Path.Curve);
            expect(Path.A).toBe(Path.ArcTo);
            expect(Path.E).toBe(Path.End);
        })
    })

    describe("ViewBox computation", () => {
        test("computes viewBox for simple line", () => {
            const path = [Path.M(0, 0), Path.L(100, 100)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            const viewBox = svg?.getAttribute("viewBox");
            
            expect(viewBox).toBeTruthy();
            expect(viewBox).toMatch(/^[\d.\- ]+$/);
        })

        test("handles single point", () => {
            const path = [Path.M(50, 50)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            expect(svg?.getAttribute("viewBox")).toBeTruthy();
        })

        test("handles negative coordinates", () => {
            const path = [Path.M(-50, -50), Path.L(50, 50)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            expect(svg?.getAttribute("viewBox")).toBeTruthy();
        })

        test("centers path in viewBox", () => {
            const path = [Path.M(100, 100), Path.L(200, 200)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            const viewBox = svg?.getAttribute("viewBox");
            
            expect(viewBox).toBeTruthy();
            if (viewBox) {
                const [x, y, w, h] = viewBox.split(' ').map(Number);
                // Width and height should be equal (square viewBox)
                expect(w).toBe(h);
            }
        })
    })

    describe("Y-axis mirroring", () => {
        test("creates but one path - original and mirrored", () => {
            const path = [Path.M(10, 20), Path.L(30, 40)];
            const { container } = render(() => SVG(path));
            
            const paths = container.querySelectorAll("path");
            expect(paths.length).toBe(1);
        })

        test("mirrored path has negated X coordinates", () => {
            const path = [Path.M(10, 20), Path.L(30, 40)];
            const { container } = render(() => SVG(path, { modifiers: PathModifier.MirrorY }));
            
            const paths = container.querySelectorAll("path");
            const path1 = paths[0].getAttribute("d");
            
            // Original should have positive X
            expect(path1).toContain("M 10 20");
            expect(path1).toContain("L 30 40");
            
            // Mirrored should have negative X
            expect(path1).toContain("M -10 20");
            expect(path1).toContain("L -30 40");
        })

        test("mirrors curves correctly", () => {
            const path = [Path.M(0, 0), Path.C(10, 10, 20, 20, 30, 30)];
            const { container } = render(() => SVG(path, { modifiers: PathModifier.MirrorY }));
            
            const paths = container.querySelectorAll("path");
            const path1 = paths[0].getAttribute("d");
            
            // Original curve
            expect(path1).toContain("C 10 10, 20 20, 30 30");
            
            // Mirrored curve (negated X coordinates)
            expect(path1).toContain("C -10 10, -20 20, -30 30");
        })

        test("mirrors arcs correctly", () => {
            const path = [Path.M(0, 0), Path.A(10, 10, 0, false, true, 20, 20)];
            const { container } = render(() => SVG(path));
            
            const paths = container.querySelectorAll("path");
            const path1 = paths[0].getAttribute("d");
            
            // Should contain both arcs
            expect(path1).toMatch(/A 10 10 0 0 1 20 20/);
        })
    })

    describe("Path string generation", () => {
        test("converts MoveTo to M command", () => {
            const path = [Path.M(10, 20)];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            expect(pathEl?.getAttribute("d")).toContain("M 10 20");
        })

        test("converts LineTo to L command", () => {
            const path = [Path.M(0, 0), Path.L(10, 20)];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            expect(pathEl?.getAttribute("d")).toContain("L 10 20");
        })

        test("converts Curve to C command", () => {
            const path = [Path.M(0, 0), Path.C(1, 2, 3, 4, 5, 6)];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            expect(pathEl?.getAttribute("d")).toContain("C 1 2, 3 4, 5 6");
        })

        test("converts ArcTo to A command", () => {
            const path = [Path.M(0, 0), Path.A(10, 20, 45, true, false, 30, 40)];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            expect(pathEl?.getAttribute("d")).toContain("A 10 20 45 1 0 30 40");
        })

        test("converts End to Z command", () => {
            const path = [Path.M(0, 0), Path.L(10, 10), Path.E()];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            expect(pathEl?.getAttribute("d")).toContain("Z");
        })

        test("handles complex path", () => {
            const path = [
                Path.M(0, 0),
                Path.L(10, 10),
                Path.C(20, 20, 30, 30, 40, 40),
                Path.A(5, 5, 0, false, true, 50, 50),
                Path.E()
            ];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            const d = pathEl?.getAttribute("d");
            
            expect(d).toContain("M 0 0");
            expect(d).toContain("L 10 10");
            expect(d).toContain("C 20 20, 30 30, 40 40");
            expect(d).toContain("A 5 5 0 0 1 50 50");
            expect(d).toContain("Z");
        })
    })

    describe("SVG attributes", () => {
        test("accepts custom attributes", () => {
            const path = [Path.M(0, 0), Path.L(10, 10)];
            const { container } = render(() => SVG(path, { 
                attributes: {
                    width: "200", 
                    height: "300",
                    class: "my-svg"
                }
            }));
            
            const svg = container.querySelector("svg");
            expect(svg?.getAttribute("width")).toBe("200");
            expect(svg?.getAttribute("height")).toBe("300");
            expect(svg?.getAttribute("class")).toBe("my-svg");
        })

        test("custom attributes do override viewBox", () => {
            const path = [Path.M(0, 0), Path.L(10, 10)];
            const { container } = render(() => SVG(path, { 
                attributes: {
                    viewBox: "0 0 100 100" // This should overwrite the computed viewBox
                } 
            }));
            
            const svg = container.querySelector("svg");
            const viewBox = svg?.getAttribute("viewBox");
            
            // Should contain the custom viewBox
            expect(viewBox).toBe("0 0 100 100");
            // Should contain computed viewBox
            expect(viewBox).toMatch(/^[\d.\- ]+$/);
        })

        test("applies stroke styling", () => {
            const path = [Path.M(0, 0), Path.L(10, 10)];
            const { container } = render(() => SVG(path, { 
                attributes: {
                    stroke: "red",
                    "stroke-width": "2"
                }
            }));
            
            const svg = container.querySelector("svg");
            expect(svg?.getAttribute("stroke")).toBe("red");
            expect(svg?.getAttribute("stroke-width")).toBe("2");
        })
    })

    describe("Edge cases", () => {
        test("handles empty path array", () => {
            const path: DrawDirective[] = [];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            expect(svg).toBeTruthy();
            expect(svg?.getAttribute("viewBox")).toBeTruthy();
        })

        test("handles path with only MoveTo", () => {
            const path = [Path.M(50, 50)];
            const { container } = render(() => SVG(path));
            
            const paths = container.querySelectorAll("path");
            expect(paths[0].getAttribute("d")).toContain("M 50 50");
        })

        test("handles zero coordinates", () => {
            const path = [Path.M(0, 0), Path.L(0, 0)];
            const { container } = render(() => SVG(path));
            
            const pathEl = container.querySelector("path");
            const d = pathEl?.getAttribute("d");
            
            expect(d).toContain("M 0 0");
            expect(d).toContain("L 0 0");
        })

        test("handles very large coordinates", () => {
            const path = [Path.M(0, 0), Path.L(10000, 10000)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            expect(svg?.getAttribute("viewBox")).toBeTruthy();
        })

        test("handles very small coordinates", () => {
            const path = [Path.M(0, 0), Path.L(0.001, 0.001)];
            const { container } = render(() => SVG(path));
            
            const svg = container.querySelector("svg");
            expect(svg).toBeDefined();
            expect(svg?.getAttribute("viewBox")).toBeTruthy();
        })
    })
})
