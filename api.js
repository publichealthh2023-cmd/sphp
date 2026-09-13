/* =========================================================
   SPHP API LAYER
   Smart Public Health Portal

   Local Mode  -> localStorage
   Server Mode -> Hospital Internal API

   Version: 1.1.0
   ========================================================= */

   (function(){

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const CONFIG =
        window.SPHP_CONFIG || {

            version:
                "1.1.0",

            environment:
                "development",

            dataMode:
                "local",

            apiBaseUrl:
                "",

            requestTimeoutMs:
                15000,

            features: {

                auditLog:
                    true

            },

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


    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    function cloneData(value){

        if(
            value === undefined ||
            value === null
        ){

            return value;

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        }
        catch(error){

            console.error(
                "SPHP cloneData error:",
                error
            );

            return value;

        }

    }


    function nowISO(){

        return new Date()
        .toISOString();

    }


    function generateId(prefix){

        const now =
            new Date();


        const compactTime =
            now
            .toISOString()
            .replace(
                /[-:.TZ]/g,
                ""
            )
            .slice(
                0,
                14
            );


        const random =
            Math.floor(
                1000 +
                Math.random() *
                9000
            );


        return (
            prefix +
            "-" +
            compactTime +
            "-" +
            random
        );

    }


    function generateNotificationId(){

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            )
            .padStart(
                2,
                "0"
            );


        const random =
            Math.floor(
                1000 +
                Math.random() *
                9000
            );


        return (
            "PH-" +
            year +
            month +
            day +
            "-" +
            random
        );

    }


    function normalizeBaseUrl(url){

        return String(
            url || ""
        )
        .trim()
        .replace(
            /\/+$/,
            ""
        );

    }


    function normalizeApiPath(path){

        const value =
            String(
                path || ""
            )
            .trim();


        if(
            !value
        ){

            return "";

        }


        return value.startsWith(
            "/"
        )
        ? value
        : "/" + value;

    }


    /* =========================================================
       LOCAL STORAGE HELPERS
    ========================================================= */

    function localReadArray(key){

        try{

            const raw =
                localStorage.getItem(
                    key
                );


            if(
                !raw
            ){

                return [];

            }


            const value =
                JSON.parse(
                    raw
                );


            return Array.isArray(
                value
            )
            ? value
            : [];

        }
        catch(error){

            console.error(
                "SPHP localReadArray error:",
                key,
                error
            );


            return [];

        }

    }


    function localWriteArray(
        key,
        value
    ){

        try{

            localStorage.setItem(

                key,

                JSON.stringify(
                    Array.isArray(
                        value
                    )
                    ? value
                    : []
                )

            );


            return true;

        }
        catch(error){

            console.error(
                "SPHP localWriteArray error:",
                key,
                error
            );


            throw error;

        }

    }


    function localReadObject(key){

        try{

            const raw =
                localStorage.getItem(
                    key
                );


            if(
                !raw
            ){

                return {};

            }


            const value =
                JSON.parse(
                    raw
                );


            return (
                value &&
                typeof value ===
                "object" &&
                !Array.isArray(
                    value
                )
            )
            ? value
            : {};

        }
        catch(error){

            console.error(
                "SPHP localReadObject error:",
                key,
                error
            );


            return {};

        }

    }


    function localWriteObject(
        key,
        value
    ){

        try{

            localStorage.setItem(

                key,

                JSON.stringify(
                    value || {}
                )

            );


            return true;

        }
        catch(error){

            console.error(
                "SPHP localWriteObject error:",
                key,
                error
            );


            throw error;

        }

    }


    /* =========================================================
       SERVER REQUEST
    ========================================================= */

    async function serverRequest(
        path,
        options
    ){

        const baseUrl =
            normalizeBaseUrl(
                CONFIG.apiBaseUrl
            );


        if(
            !baseUrl
        ){

            throw new Error(
                "SPHP API Base URL is not configured."
            );

        }


        const apiPath =
            normalizeApiPath(
                path
            );


        const controller =
            new AbortController();


        const timeoutMs =
            Number(
                CONFIG.requestTimeoutMs
            )
            ||
            15000;


        const timeout =
            setTimeout(

                function(){

                    controller.abort();

                },

                timeoutMs

            );


        try{

            const requestOptions = {

                method:
                    options?.method ||
                    "GET",

                headers: {

                    "Accept":
                        "application/json",

                    ...(
                        options?.headers ||
                        {}
                    )

                },

                credentials:
                    "include",

                signal:
                    controller.signal

            };


            if(
                options?.body !==
                undefined
            ){

                requestOptions.headers[
                    "Content-Type"
                ] =
                    "application/json";


                requestOptions.body =
                    JSON.stringify(
                        options.body
                    );

            }


            const response =
                await fetch(

                    baseUrl +
                    apiPath,

                    requestOptions

                );


            let responseData =
                null;


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if(
                contentType.includes(
                    "application/json"
                )
            ){

                try{

                    responseData =
                        await response.json();

                }
                catch(error){

                    responseData =
                        null;

                }

            }


            if(
                !response.ok
            ){

                const message =
                    responseData?.message ||
                    responseData?.error ||
                    (
                        "Server request failed: " +
                        response.status
                    );


                const error =
                    new Error(
                        message
                    );


                error.status =
                    response.status;


                error.response =
                    responseData;


                throw error;

            }


            return responseData;

        }
        catch(error){

            if(
                error &&
                error.name ===
                "AbortError"
            ){

                throw new Error(
                    "SPHP request timed out."
                );

            }


            throw error;

        }
        finally{

            clearTimeout(
                timeout
            );

        }

    }


    /* =========================================================
       AUDIT LOG
    ========================================================= */

    async function writeAudit(
        action,
        entityType,
        entityId,
        details
    ){

        if(
            CONFIG.features &&
            CONFIG.features.auditLog ===
            false
        ){

            return null;

        }


        const record = {

            id:
                generateId(
                    "AUD"
                ),

            timestamp:
                nowISO(),

            action:
                action || "",

            entityType:
                entityType || "",

            entityId:
                entityId || "",

            details:
                cloneData(
                    details || {}
                )

        };


        if(
            CONFIG.dataMode ===
            "server"
        ){

            try{

                await serverRequest(

                    "/audit",

                    {

                        method:
                            "POST",

                        body:
                            record

                    }

                );

            }
            catch(error){

                console.error(
                    "SPHP audit server error:",
                    error
                );

            }


            return record;

        }


        const key =
            CONFIG.storageKeys.auditLog;


        if(
            !key
        ){

            return record;

        }


        const list =
            localReadArray(
                key
            );


        list.unshift(
            record
        );


        if(
            list.length >
            5000
        ){

            list.length =
                5000;

        }


        localWriteArray(
            key,
            list
        );


        return cloneData(
            record
        );

    }


    /* =========================================================
       GENERIC COLLECTION SERVICE
    ========================================================= */

    function createCollectionService(
        options
    ){

        const storageKey =
            options.storageKey;


        const apiPath =
            options.apiPath;


        const idPrefix =
            options.idPrefix;


        const entityType =
            options.entityType;


        const customIdGenerator =
            options.idGenerator;


        function createRecordId(){

            if(
                typeof customIdGenerator ===
                "function"
            ){

                return customIdGenerator();

            }


            return generateId(
                idPrefix
            );

        }


        return {


            async getAll(){

                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    const result =
                        await serverRequest(
                            apiPath
                        );


                    return Array.isArray(
                        result
                    )
                    ? result
                    : [];

                }


                return cloneData(
                    localReadArray(
                        storageKey
                    )
                );

            },


            async getById(id){

                if(
                    id === undefined ||
                    id === null ||
                    id === ""
                ){

                    return null;

                }


                const recordId =
                    String(
                        id
                    );


                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    return await serverRequest(

                        apiPath +
                        "/" +
                        encodeURIComponent(
                            recordId
                        )

                    );

                }


                const list =
                    localReadArray(
                        storageKey
                    );


                const found =
                    list.find(

                        function(item){

                            return (
                                item &&
                                String(
                                    item.id
                                ) ===
                                recordId
                            );

                        }

                    );


                return found
                    ? cloneData(
                        found
                    )
                    : null;

            },


            async create(data){

                const record = {

                    ...cloneData(
                        data || {}
                    )

                };


                if(
                    !record.id
                ){

                    record.id =
                        createRecordId();

                }


                if(
                    !record.createdAt
                ){

                    record.createdAt =
                        nowISO();

                }


                record.updatedAt =
                    nowISO();


                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    const result =
                        await serverRequest(

                            apiPath,

                            {

                                method:
                                    "POST",

                                body:
                                    record

                            }

                        );


                    await writeAudit(

                        "CREATE",

                        entityType,

                        result?.id ||
                        record.id,

                        {}

                    );


                    return (
                        result ||
                        cloneData(
                            record
                        )
                    );

                }


                const list =
                    localReadArray(
                        storageKey
                    );


                const exists =
                    list.some(

                        function(item){

                            return (
                                item &&
                                String(
                                    item.id
                                ) ===
                                String(
                                    record.id
                                )
                            );

                        }

                    );


                if(
                    exists
                ){

                    throw new Error(
                        "Record already exists: " +
                        record.id
                    );

                }


                list.unshift(
                    record
                );


                localWriteArray(
                    storageKey,
                    list
                );


                await writeAudit(

                    "CREATE",

                    entityType,

                    record.id,

                    {}

                );


                return cloneData(
                    record
                );

            },


            async update(
                id,
                changes
            ){

                if(
                    id === undefined ||
                    id === null ||
                    id === ""
                ){

                    throw new Error(
                        "Record ID is required."
                    );

                }


                const recordId =
                    String(
                        id
                    );


                const safeChanges =
                    cloneData(
                        changes || {}
                    );


                if(
                    safeChanges &&
                    Object.prototype.hasOwnProperty.call(
                        safeChanges,
                        "id"
                    )
                ){

                    delete safeChanges.id;

                }


                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    const result =
                        await serverRequest(

                            apiPath +
                            "/" +
                            encodeURIComponent(
                                recordId
                            ),

                            {

                                method:
                                    "PUT",

                                body: {

                                    ...safeChanges,

                                    updatedAt:
                                        nowISO()

                                }

                            }

                        );


                    await writeAudit(

                        "UPDATE",

                        entityType,

                        recordId,

                        {

                            fields:
                                Object.keys(
                                    safeChanges
                                )

                        }

                    );


                    return result;

                }


                const list =
                    localReadArray(
                        storageKey
                    );


                const index =
                    list.findIndex(

                        function(item){

                            return (
                                item &&
                                String(
                                    item.id
                                ) ===
                                recordId
                            );

                        }

                    );


                if(
                    index <
                    0
                ){

                    throw new Error(
                        "Record not found: " +
                        recordId
                    );

                }


                const oldRecord =
                    list[
                        index
                    ];


                const newRecord = {

                    ...oldRecord,

                    ...safeChanges,

                    id:
                        oldRecord.id,

                    createdAt:
                        oldRecord.createdAt ||
                        nowISO(),

                    updatedAt:
                        nowISO()

                };


                list[
                    index
                ] =
                    newRecord;


                localWriteArray(
                    storageKey,
                    list
                );


                await writeAudit(

                    "UPDATE",

                    entityType,

                    recordId,

                    {

                        fields:
                            Object.keys(
                                safeChanges
                            )

                    }

                );


                return cloneData(
                    newRecord
                );

            },


            async upsert(data){

                if(
                    !data ||
                    typeof data !==
                    "object"
                ){

                    throw new Error(
                        "Data is required."
                    );

                }


                if(
                    data.id !==
                    undefined &&
                    data.id !==
                    null &&
                    data.id !==
                    ""
                ){

                    const existing =
                        await this.getById(
                            data.id
                        );


                    if(
                        existing
                    ){

                        return await this.update(

                            data.id,

                            data

                        );

                    }

                }


                return await this.create(
                    data
                );

            },


            async remove(id){

                if(
                    id === undefined ||
                    id === null ||
                    id === ""
                ){

                    return false;

                }


                const recordId =
                    String(
                        id
                    );


                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    await serverRequest(

                        apiPath +
                        "/" +
                        encodeURIComponent(
                            recordId
                        ),

                        {

                            method:
                                "DELETE"

                        }

                    );


                    await writeAudit(

                        "DELETE",

                        entityType,

                        recordId,

                        {}

                    );


                    return true;

                }


                const list =
                    localReadArray(
                        storageKey
                    );


                const filtered =
                    list.filter(

                        function(item){

                            return !(
                                item &&
                                String(
                                    item.id
                                ) ===
                                recordId
                            );

                        }

                    );


                if(
                    filtered.length ===
                    list.length
                ){

                    return false;

                }


                localWriteArray(
                    storageKey,
                    filtered
                );


                await writeAudit(

                    "DELETE",

                    entityType,

                    recordId,

                    {}

                );


                return true;

            }

        };

    }


    /* =========================================================
       GENERIC OBJECT SETTINGS SERVICE
    ========================================================= */

    function createObjectSettingsService(
        options
    ){

        const storageKey =
            options.storageKey;


        const apiPath =
            options.apiPath;


        const entityType =
            options.entityType;


        const entityId =
            options.entityId;


        return {


            async get(){

                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    const result =
                        await serverRequest(
                            apiPath
                        );


                    return (
                        result &&
                        typeof result ===
                        "object" &&
                        !Array.isArray(
                            result
                        )
                    )
                    ? result
                    : {};

                }


                return cloneData(
                    localReadObject(
                        storageKey
                    )
                );

            },


            async save(data){

                const record = {

                    ...cloneData(
                        data || {}
                    ),

                    updatedAt:
                        nowISO()

                };


                if(
                    CONFIG.dataMode ===
                    "server"
                ){

                    const result =
                        await serverRequest(

                            apiPath,

                            {

                                method:
                                    "PUT",

                                body:
                                    record

                            }

                        );


                    await writeAudit(

                        "UPDATE",

                        entityType,

                        entityId,

                        {}

                    );


                    return (
                        result ||
                        record
                    );

                }


                localWriteObject(

                    storageKey,

                    record

                );


                await writeAudit(

                    "UPDATE",

                    entityType,

                    entityId,

                    {}

                );


                return cloneData(
                    record
                );

            }

        };

    }


    /* =========================================================
       COLLECTION SERVICES
    ========================================================= */

    const rapidScreenings =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.rapidScreenings,

            apiPath:
                "/rapid-screenings",

            idPrefix:
                "RS",

            entityType:
                "RapidScreening"

        });


    const smartScreenings =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.smartScreenings,

            apiPath:
                "/smart-screenings",

            idPrefix:
                "SCR",

            entityType:
                "SmartScreening"

        });


    const notifications =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.notifications,

            apiPath:
                "/notifications",

            idPrefix:
                "PH",

            idGenerator:
                generateNotificationId,

            entityType:
                "Notification"

        });


    const employeeScreenings =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.employeeScreenings,

            apiPath:
                "/employee-screenings",

            idPrefix:
                "EMP",

            entityType:
                "EmployeeScreening"

        });


    const foodborneOutbreaks =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.foodborneOutbreaks,

            apiPath:
                "/foodborne-outbreaks",

            idPrefix:
                "FBO",

            entityType:
                "FoodborneOutbreak"

        });


    const vaccinationCampaigns =
        createCollectionService({

            storageKey:
                CONFIG.storageKeys.vaccinationCampaigns,

            apiPath:
                "/vaccination-campaigns",

            idPrefix:
                "VAC",

            entityType:
                "VaccinationCampaign"

        });


    /* =========================================================
       OBJECT SETTINGS SERVICES
    ========================================================= */

    const vaccinationSettings =
        createObjectSettingsService({

            storageKey:
                CONFIG.storageKeys.vaccinationSettings,

            apiPath:
                "/settings/vaccination-campaign",

            entityType:
                "VaccinationCampaignSettings",

            entityId:
                "vaccination-campaign-settings"

        });


    const occupationalReportSettings =
        createObjectSettingsService({

            storageKey:
                CONFIG.storageKeys.occupationalReportSettings,

            apiPath:
                "/settings/occupational-report",

            entityType:
                "OccupationalReportSettings",

            entityId:
                "occupational-report-settings"

        });


    /* =========================================================
       EXISTING SETTINGS SERVICE
    ========================================================= */

    const settingsService = {


        async getReportSettings(){

            if(
                CONFIG.dataMode ===
                "server"
            ){

                const result =
                    await serverRequest(
                        "/settings/report"
                    );


                return (
                    result &&
                    typeof result ===
                    "object"
                )
                ? result
                : {};

            }


            return cloneData(
                localReadObject(
                    CONFIG.storageKeys.reportSettings
                )
            );

        },


        async saveReportSettings(data){

            const record = {

                ...cloneData(
                    data || {}
                ),

                updatedAt:
                    nowISO()

            };


            if(
                CONFIG.dataMode ===
                "server"
            ){

                const result =
                    await serverRequest(

                        "/settings/report",

                        {

                            method:
                                "PUT",

                            body:
                                record

                        }

                    );


                await writeAudit(

                    "UPDATE",

                    "ReportSettings",

                    "report-settings",

                    {}

                );


                return (
                    result ||
                    record
                );

            }


            localWriteObject(

                CONFIG.storageKeys.reportSettings,

                record

            );


            await writeAudit(

                "UPDATE",

                "ReportSettings",

                "report-settings",

                {}

            );


            return cloneData(
                record
            );

        },


        async getSmartBaseline(){

            if(
                CONFIG.dataMode ===
                "server"
            ){

                const result =
                    await serverRequest(
                        "/settings/smart-baseline"
                    );


                return (
                    result &&
                    typeof result ===
                    "object"
                )
                ? result
                : {};

            }


            return cloneData(
                localReadObject(
                    CONFIG.storageKeys.smartBaseline
                )
            );

        },


        async saveSmartBaseline(data){

            const record = {

                ...cloneData(
                    data || {}
                ),

                updatedAt:
                    nowISO()

            };


            if(
                CONFIG.dataMode ===
                "server"
            ){

                const result =
                    await serverRequest(

                        "/settings/smart-baseline",

                        {

                            method:
                                "PUT",

                            body:
                                record

                        }

                    );


                await writeAudit(

                    "UPDATE",

                    "SmartBaseline",

                    "smart-baseline",

                    {}

                );


                return (
                    result ||
                    record
                );

            }


            localWriteObject(

                CONFIG.storageKeys.smartBaseline,

                record

            );


            await writeAudit(

                "UPDATE",

                "SmartBaseline",

                "smart-baseline",

                {}

            );


            return cloneData(
                record
            );

        }

    };


    /* =========================================================
       AUDIT SERVICE
    ========================================================= */

    const auditService = {


        async getAll(){

            if(
                CONFIG.dataMode ===
                "server"
            ){

                const result =
                    await serverRequest(
                        "/audit"
                    );


                return Array.isArray(
                    result
                )
                ? result
                : [];

            }


            return cloneData(
                localReadArray(
                    CONFIG.storageKeys.auditLog
                )
            );

        },


        async write(
            action,
            entityType,
            entityId,
            details
        ){

            return await writeAudit(

                action,
                entityType,
                entityId,
                details

            );

        }

    };


    /* =========================================================
       COMPATIBILITY FUNCTIONS
    ========================================================= */


    /* -------------------------
       NOTIFICATIONS
    ------------------------- */

    window.getPublicHealthNotifications =
        async function(){

            return await notifications.getAll();

        };


    window.getPublicHealthNotificationById =
        async function(id){

            return await notifications.getById(
                id
            );

        };


    window.savePublicHealthNotification =
        async function(notification){

            if(
                !notification
            ){

                throw new Error(
                    "Notification data is required."
                );

            }


            return await notifications.upsert(
                notification
            );

        };


    window.updatePublicHealthNotification =
        async function(
            idOrRecord,
            changes
        ){

            if(
                idOrRecord &&
                typeof idOrRecord ===
                "object"
            ){

                if(
                    !idOrRecord.id
                ){

                    throw new Error(
                        "Notification ID is required."
                    );

                }


                return await notifications.update(

                    idOrRecord.id,

                    idOrRecord

                );

            }


            return await notifications.update(

                idOrRecord,

                changes || {}

            );

        };


    window.deletePublicHealthNotification =
        async function(id){

            return await notifications.remove(
                id
            );

        };


    /* -------------------------
       RAPID SCREENINGS
    ------------------------- */

    window.getRapidScreeningRecords =
        async function(){

            return await rapidScreenings.getAll();

        };


    window.getRapidScreeningRecordById =
        async function(id){

            return await rapidScreenings.getById(
                id
            );

        };


    window.saveRapidScreeningRecord =
        async function(record){

            return await rapidScreenings.upsert(
                record
            );

        };


    window.updateRapidScreeningRecord =
        async function(
            id,
            changes
        ){

            return await rapidScreenings.update(

                id,

                changes

            );

        };


    /* -------------------------
       SMART SCREENINGS
    ------------------------- */

    window.getSmartScreeningRecords =
        async function(){

            return await smartScreenings.getAll();

        };


    window.getSmartScreeningRecordById =
        async function(id){

            return await smartScreenings.getById(
                id
            );

        };


    window.saveSmartScreeningRecord =
        async function(record){

            return await smartScreenings.upsert(
                record
            );

        };


    window.updateSmartScreeningRecord =
        async function(
            id,
            changes
        ){

            return await smartScreenings.update(

                id,

                changes

            );

        };


    /* -------------------------
       EMPLOYEE SCREENINGS
    ------------------------- */

    window.getEmployeeScreeningRecords =
        async function(){

            return await employeeScreenings.getAll();

        };


    window.getEmployeeScreeningRecordById =
        async function(id){

            return await employeeScreenings.getById(
                id
            );

        };


    window.saveEmployeeScreeningRecord =
        async function(record){

            return await employeeScreenings.upsert(
                record
            );

        };


    window.updateEmployeeScreeningRecord =
        async function(
            id,
            changes
        ){

            return await employeeScreenings.update(

                id,

                changes

            );

        };


    /* -------------------------
       FOODBORNE OUTBREAKS
    ------------------------- */

    window.getFoodborneOutbreaks =
        async function(){

            return await foodborneOutbreaks.getAll();

        };


    window.getFoodborneOutbreakById =
        async function(id){

            return await foodborneOutbreaks.getById(
                id
            );

        };


    window.saveFoodborneOutbreak =
        async function(record){

            return await foodborneOutbreaks.upsert(
                record
            );

        };


    window.updateFoodborneOutbreak =
        async function(
            id,
            changes
        ){

            return await foodborneOutbreaks.update(

                id,

                changes

            );

        };


    /* -------------------------
       VACCINATION CAMPAIGNS
    ------------------------- */

    window.getVaccinationCampaignRecords =
        async function(){

            return await vaccinationCampaigns.getAll();

        };


    window.getVaccinationCampaignRecordById =
        async function(id){

            return await vaccinationCampaigns.getById(
                id
            );

        };


    window.saveVaccinationCampaignRecord =
        async function(record){

            return await vaccinationCampaigns.upsert(
                record
            );

        };


    window.updateVaccinationCampaignRecord =
        async function(
            id,
            changes
        ){

            return await vaccinationCampaigns.update(

                id,

                changes

            );

        };


    window.deleteVaccinationCampaignRecord =
        async function(id){

            return await vaccinationCampaigns.remove(
                id
            );

        };


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.SPHP = {

        config:
            CONFIG,

        rapidScreenings:
            rapidScreenings,

        smartScreenings:
            smartScreenings,

        notifications:
            notifications,

        employeeScreenings:
            employeeScreenings,

        foodborneOutbreaks:
            foodborneOutbreaks,

        vaccinationCampaigns:
            vaccinationCampaigns,

        vaccinationSettings:
            vaccinationSettings,

        occupationalReportSettings:
            occupationalReportSettings,

        settings:
            settingsService,

        audit:
            auditService,

        request:
            serverRequest,

        helpers: {

            generateId:
                generateId,

            generateNotificationId:
                generateNotificationId,

            nowISO:
                nowISO,

            cloneData:
                cloneData

        }

    };


    /* =========================================================
       READY EVENT
    ========================================================= */

    try{

        window.dispatchEvent(

            new CustomEvent(
                "SPHPReady",
                {

                    detail: {

                        version:
                            CONFIG.version,

                        mode:
                            CONFIG.dataMode,

                        environment:
                            CONFIG.environment

                    }

                }
            )

        );

    }
    catch(error){

        /*
          تجاهل في المتصفحات القديمة.
        */

    }


    console.log(

        "SPHP API initialized",

        {

            version:
                CONFIG.version,

            mode:
                CONFIG.dataMode,

            environment:
                CONFIG.environment

        }

    );


})();