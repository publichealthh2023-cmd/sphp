// ============================================================
// SPHP - Data Access Layer
// طبقة الوصول إلى بيانات البوابة الذكية للصحة العامة
// ============================================================
//
// الوضع الحالي:
// LOCAL = حفظ البيانات داخل نفس المتصفح فقط.
//
// الوضع الرسمي لاحقاً:
// HOSPITAL_API = ربط النظام بخادم وقاعدة بيانات المستشفى.
//
// مهم:
// لا يتم إرسال أي بيانات إلى أي جهة خارجية في وضع LOCAL.
// ============================================================

const SPHP_CONFIG = {

    // الوضع الحالي للتجربة
    MODE: "LOCAL",

    // يوضع هنا لاحقاً رابط API الداخلي المقدم من تقنية المعلومات
    API_BASE_URL: "",

    // مهلة الاتصال بالخادم
    REQUEST_TIMEOUT: 15000
};


// ============================================================
// أدوات مساعدة
// ============================================================

function sphpGenerateId(prefix = "SPHP") {

    const now = new Date();

    const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const timePart =
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");

    const randomPart =
        Math.random().toString(36).substring(2, 7).toUpperCase();

    return `${prefix}-${datePart}-${timePart}-${randomPart}`;
}


function sphpNowISO() {
    return new Date().toISOString();
}


// ============================================================
// LOCAL STORAGE
// ============================================================

function sphpLocalGet(key) {

    try {

        const raw = localStorage.getItem(key);

        if (!raw) {
            return [];
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "SPHP local read error:",
            key,
            error
        );

        return [];
    }
}


function sphpLocalSet(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "SPHP local save error:",
            key,
            error
        );

        return false;
    }
}


// ============================================================
// API REQUEST
// سيُستخدم لاحقاً عند تركيب خادم المستشفى
// ============================================================

async function sphpApiRequest(endpoint, options = {}) {

    if (!SPHP_CONFIG.API_BASE_URL) {

        throw new Error(
            "Hospital API URL has not been configured."
        );
    }

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        SPHP_CONFIG.REQUEST_TIMEOUT
    );

    try {

        const response = await fetch(
            `${SPHP_CONFIG.API_BASE_URL}${endpoint}`,
            {
                ...options,

                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },

                signal: controller.signal
            }
        );

        if (!response.ok) {

            throw new Error(
                `API Error ${response.status}`
            );
        }

        return await response.json();

    } finally {

        clearTimeout(timeout);
    }
}


// ============================================================
// البلاغات المعدية
// ============================================================

const SPHP_NOTIFICATIONS_KEY =
    "publicHealthNotifications";


async function getPublicHealthNotifications() {

    if (SPHP_CONFIG.MODE === "LOCAL") {

        return sphpLocalGet(
            SPHP_NOTIFICATIONS_KEY
        );
    }

    return await sphpApiRequest(
        "/notifications"
    );
}


async function savePublicHealthNotification(notification) {

    if (!notification.id) {

        notification.id =
            sphpGenerateId("NOT");
    }

    if (!notification.createdAt) {

        notification.createdAt =
            sphpNowISO();
    }

    notification.updatedAt =
        sphpNowISO();


    if (SPHP_CONFIG.MODE === "LOCAL") {

        const notifications =
            sphpLocalGet(
                SPHP_NOTIFICATIONS_KEY
            );

        const existingIndex =
            notifications.findIndex(
                item => item.id === notification.id
            );

        if (existingIndex >= 0) {

            notifications[existingIndex] =
                notification;

        } else {

            notifications.unshift(
                notification
            );
        }

        sphpLocalSet(
            SPHP_NOTIFICATIONS_KEY,
            notifications
        );

        return notification;
    }


    return await sphpApiRequest(
        "/notifications",
        {
            method: "POST",
            body: JSON.stringify(
                notification
            )
        }
    );
}


// ============================================================
// الفرز الذكي
// ============================================================

const SPHP_SCREENING_KEY =
    "smartScreeningRecords";


async function getSmartScreeningRecords() {

    if (SPHP_CONFIG.MODE === "LOCAL") {

        return sphpLocalGet(
            SPHP_SCREENING_KEY
        );
    }

    return await sphpApiRequest(
        "/screenings"
    );
}


async function saveSmartScreeningRecord(record) {

    if (!record.id) {

        record.id =
            sphpGenerateId("SCR");
    }

    if (!record.createdAt) {

        record.createdAt =
            sphpNowISO();
    }

    record.updatedAt =
        sphpNowISO();


    if (SPHP_CONFIG.MODE === "LOCAL") {

        const records =
            sphpLocalGet(
                SPHP_SCREENING_KEY
            );

        const existingIndex =
            records.findIndex(
                item => item.id === record.id
            );

        if (existingIndex >= 0) {

            records[existingIndex] =
                record;

        } else {

            records.unshift(
                record
            );
        }

        sphpLocalSet(
            SPHP_SCREENING_KEY,
            records
        );

        return record;
    }


    return await sphpApiRequest(
        "/screenings",
        {
            method: "POST",
            body: JSON.stringify(record)
        }
    );
}


// ============================================================
// اختبار حالة النظام
// ============================================================

function getSPHPDataMode() {

    return {
        mode: SPHP_CONFIG.MODE,

        apiConfigured:
            Boolean(
                SPHP_CONFIG.API_BASE_URL
            ),

        timestamp:
            sphpNowISO()
    };
}


console.log(
    "SPHP Data Layer Loaded:",
    getSPHPDataMode()
);