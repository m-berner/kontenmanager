interface ITeleport {
    dialogName: string;
    okButton: boolean;
    visibility: boolean;
}
interface IInfos {
    exchanges: Map<string, number>;
    indexes: Map<string, number>;
    materials: Map<string, number>;
}
interface IRuntimeStore {
    activeId: number;
    teleport: ITeleport;
    infoBar: IInfos;
    exchanges: {
        curUsd: number;
        curEur: number;
    };
    optionMenuColors: Map<number, string>;
}
export declare const useRuntimeStore: import("pinia").StoreDefinition<"runtime", IRuntimeStore, {
    hasActiveBooking: (state: IRuntimeStore) => boolean;
    isDialogVisible: (state: IRuntimeStore) => boolean;
}, {
    setActiveId(value: number): void;
    setTeleport(entry: ITeleport): void;
    resetTeleport(): void;
    resetOptionsMenuColors(): void;
    openModalDialog(dialogName: string, showOkButton?: boolean): void;
    closeDialog(): void;
    toggleDialog(): void;
    updateDialogConfig(config: Partial<ITeleport>): void;
    clearBooking(): void;
    setExchangesUsd(value: number): void;
    setExchangesEur(value: number): void;
}>;
export {};
//# sourceMappingURL=runtime.d.ts.map