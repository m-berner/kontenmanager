import { type I18n } from 'vue-i18n';
import deDE from '@/locales/de-DE.json';
type MessageSchema = typeof deDE;
interface II18n {
    i18n: I18n<{
        'de-DE': MessageSchema;
        'en-US': MessageSchema;
    }>;
}
declare const i18nConfig: II18n;
export default i18nConfig;
//# sourceMappingURL=i18n.d.ts.map