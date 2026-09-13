/* =========================================================
   SPHP - Central Configuration
   Smart Public Health Portal
   ========================================================= */

   window.SPHP_CONFIG = {

    /* -----------------------------------------------------
       SYSTEM
    ----------------------------------------------------- */

    appName: "SPHP",

    appFullName: "Smart Public Health Portal",

    version: "1.1.0",

    environment: "development",


    /* -----------------------------------------------------
       DATA MODE

       local  = GitHub / Development
       server = Hospital Internal Server
    ----------------------------------------------------- */

    dataMode: "local",


    /* -----------------------------------------------------
       SERVER API

       عند النقل للمستشفى يتغير فقط هذا الرابط.
       مثال مستقبلي:
       http://10.10.10.25/sphp/api
    ----------------------------------------------------- */

    apiBaseUrl: "",


    /* -----------------------------------------------------
       REQUEST SETTINGS
    ----------------------------------------------------- */

    requestTimeoutMs: 15000,


    /* -----------------------------------------------------
       SECURITY / SESSION
    ----------------------------------------------------- */

    session: {

        enabled: false,

        timeoutMinutes: 30

    },


    /* -----------------------------------------------------
       FEATURE FLAGS
    ----------------------------------------------------- */

    features: {

        rapidScreening: true,

        smartScreening: true,

        notifications: true,

        employeeScreening: true,

        vaccinationCampaigns: true,

        vaccinationSettings: true,

        occupationalReportSettings: true,

        reports: true,

        auditLog: true

    },


    /* -----------------------------------------------------
       STORAGE KEYS

       هذه الأسماء لا نغيرها مستقبلاً حتى نحافظ
       على التوافق مع البيانات الحالية.
    ----------------------------------------------------- */

    storageKeys: {

        rapidScreenings:
            "rapidScreeningRecords",

        smartScreenings:
            "smartScreeningRecords",

        notifications:
            "publicHealthNotifications",

        employeeScreenings:
            "employeeScreeningRecords",

        foodborneOutbreaks:
            "foodborneOutbreaks",

        vaccinationCampaigns:
            "vaccinationCampaignRecords",

        vaccinationSettings:
            "vaccinationCampaignSettings",

        occupationalReportSettings:
            "occupationalReportSettings",

        reportSettings:
            "publicHealthReportSettings",

        smartBaseline:
            "smartScreeningBaseline",

        auditLog:
            "sphpAuditLog"

    }

};