import { vi } from "vitest";
vi.mock("vuetify", () => ({
    useTheme: () => ({
        global: {
            name: {
                value: "ocean"
            }
        }
    })
}));
