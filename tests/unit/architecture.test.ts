/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {readdirSync, readFileSync, statSync} from "node:fs";
import path from "node:path";
import ts from "typescript";

function walkFiles(rootDir: string, exts: string[]): string[] {
    const out: string[] = [];

    function walk(dir: string) {
        for (const entry of readdirSync(dir)) {
            const full = path.join(dir, entry);
            const st = statSync(full);
            if (st.isDirectory()) {
                walk(full);
                continue;
            }
            if (exts.some((e) => full.endsWith(e))) out.push(full);
        }
    }

    walk(rootDir);
    return out;
}

function norm(p: string) {
    return p.replace(/\\/g, "/");
}

function isTestFile(file: string) {
    return file.endsWith(".test.ts") || file.endsWith(".spec.ts");
}

function extractVueScripts(vueText: string): string[] {
    const scripts: string[] = [];
    const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    for (const m of vueText.matchAll(re)) {
        scripts.push(m[1] ?? "");
    }
    return scripts;
}

function getImportSpecifiers(text: string, fileName: string): string[] {
    const sf = ts.createSourceFile(
        fileName,
        text,
        ts.ScriptTarget.ESNext,
        /*setParentNodes*/ false,
        fileName.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX
    );

    const out: string[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
            const spec = node.moduleSpecifier;
            if (ts.isStringLiteral(spec)) out.push(spec.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return out;
}

function getAllImports(file: string, text: string): string[] {
    if (file.endsWith(".vue")) {
        return extractVueScripts(text).flatMap((s, idx) =>
            getImportSpecifiers(s, `${file}::script${idx}`)
        );
    }
    return getImportSpecifiers(text, file);
}

describe("Architecture", () => {
    it("UI code must not import concrete services (except types)", () => {
        const uiRoots = ["src/adapters/primary/components", "src/adapters/primary/views", "src/adapters/primary/composables", "src/adapters/primary/plugins"];
        const bad: string[] = [];

        for (const root of uiRoots) {
            for (const file of walkFiles(root, [".ts", ".vue"])) {
                if (isTestFile(file)) continue;
                const text = readFileSync(file, "utf8");

                for (const spec of getAllImports(file, text)) {
                    if (!spec.startsWith("@/adapters/secondary/")) continue;
                    const servicePath = spec.slice("@/adapters/secondary/".length);
                    if (servicePath === "types") continue;
                    bad.push(`${norm(file)} -> ${spec}`);
                }
            }
        }

        expect(bad, bad.join("\n")).toEqual([]);
    });

    it("Only entrypoints/services may import the DI container", () => {
        const files = walkFiles("src", [".ts", ".vue"]);
        const bad: string[] = [];

        for (const file of files) {
            if (isTestFile(file)) continue;
            const text = readFileSync(file, "utf8");
            if (!getAllImports(file, text).includes("@/adapters/container")) continue;

            const n = norm(file);
            if (
                n.startsWith("src/adapters/container") ||
                n.startsWith("src/adapters/secondary/") ||
                n.startsWith("src/adapters/primary/entrypoints/") ||
                n.startsWith("tests/unit/")
            ) {
                continue;
            }

            bad.push(n);
        }

        expect(bad, bad.join("\n")).toEqual([]);
    });

    it("Usecases must not import Vue/Pinia/stores", () => {
        const files = walkFiles("src/app/usecases", [".ts"]);
        const bad: string[] = [];

        for (const file of files) {
            const text = readFileSync(file, "utf8");
            const n = norm(file);

            if (/\bfrom\s+["']vue["']/.test(text)) bad.push(`${n} imports vue`);
            if (/\bfrom\s+["']pinia["']/.test(text)) bad.push(`${n} imports pinia`);
            if (/from\s+["']@\/app\/stores\//.test(text)) bad.push(`${n} imports stores`);
        }

        expect(bad, bad.join("\n")).toEqual([]);
    });
});
