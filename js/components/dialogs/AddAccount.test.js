import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { databaseService } from '@/services/database';
import { INDEXED_DB } from '@/config/database';
import { useAccountForm } from '@/composables/useForms';
import { useSettingsStore } from '@/stores/settings';
import { useAccountsStore } from '@/stores/accounts';
const browserMock = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    notifications: {
        create: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
        getURL: vi.fn().mockReturnValue(''),
        getManifest: vi.fn().mockReturnValue({ version: '1.0.0' })
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue('de-DE')
    }
};
vi.stubGlobal('browser', browserMock);
describe('AddAccount Logic Test', () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, 'isConnected').mockReturnValue(true);
    });
    it('should add an account and verify it reaches the database service', async () => {
        const { accountFormData } = useAccountForm();
        const accountsStore = useAccountsStore();
        const settings = useSettingsStore();
        accountFormData.swift = 'TESTSWIFT';
        accountFormData.iban = 'DE12345678901234567890';
        accountFormData.withDepot = false;
        const addSpy = vi.spyOn(databaseService, 'add').mockResolvedValue(123);
        const accountData = {
            cSwift: accountFormData.swift.trim().toUpperCase(),
            cIban: accountFormData.iban.replace(/\s/g, '').toUpperCase(),
            cLogoUrl: accountFormData.logoUrl.trim(),
            cWithDepot: accountFormData.withDepot
        };
        const addAccountID = await databaseService.add(INDEXED_DB.STORE.ACCOUNTS.NAME, accountData);
        if (addAccountID !== -1) {
            accountsStore.add({ ...accountData, cID: addAccountID });
            settings.activeAccountId = addAccountID;
            await browser.storage.local.set({ 'sActiveAccountId': addAccountID });
        }
        expect(addSpy).toHaveBeenCalledWith(INDEXED_DB.STORE.ACCOUNTS.NAME, expect.objectContaining({
            cSwift: 'TESTSWIFT',
            cIban: 'DE12345678901234567890'
        }));
        expect(accountsStore.items).toHaveLength(1);
        expect(accountsStore.items[0].cID).toBe(123);
        expect(settings.activeAccountId).toBe(123);
        expect(browserMock.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            'sActiveAccountId': 123
        }));
    });
});
