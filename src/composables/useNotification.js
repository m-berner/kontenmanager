import { useConstant } from '@/composables/useConstant';
const { CONS } = useConstant();
export const useNotification = () => {
    const notice = async (messages) => {
        const msg = messages.join('\n');
        const notificationOption = {
            type: 'basic',
            iconUrl: 'assets/icon16.png',
            title: 'KontenManager',
            message: msg
        };
        await browser.notifications.create(notificationOption);
    };
    const log = (msg, mode) => {
        const localDebug = localStorage.getItem(CONS.STORAGE.PROPS.DEBUG);
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                console.info(msg, mode?.info);
            }
            else if (mode?.warn !== undefined) {
                console.warn(msg, mode?.warn);
            }
            else if (mode?.error !== undefined) {
                console.error(msg, mode?.error);
            }
            else {
                console.log(msg);
            }
        }
    };
    return {
        notice,
        log
    };
};
