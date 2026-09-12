/* =========================================================
   SPHP API LAYER
   Smart Public Health Portal

   IMPORTANT:
   جميع صفحات النظام مستقبلاً يجب أن تتعامل مع هذا الملف
   بدل الوصول المباشر إلى localStorage.

   Local Mode  -> localStorage
   Server Mode -> Hospital API
   ========================================================= */


   (function(){

    "use strict";
    
    
    /* =========================================================
       CONFIG
    ========================================================= */
    
    const CONFIG =
        window.SPHP_CONFIG || {
    
            dataMode:
                "local",
    
            apiBaseUrl:
                "",
    
            requestTimeoutMs:
                15000,
    
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
    
        return JSON.parse(
            JSON.stringify(
                value
            )
        );
    
    }
    
    
    function generateId(prefix){
    
        const now =
            new Date();
    
    
        const time =
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
            time +
            "-" +
            random
        );
    
    }
    
    
    function nowISO(){
    
        return new Date()
        .toISOString();
    
    }
    
    
    /* =========================================================
       LOCAL STORAGE HELPERS
    ========================================================= */
    
    function localReadArray(
        key
    ){
    
        try{
    
            const value =
                JSON.parse(
                    localStorage.getItem(
                        key
                    ) || "[]"
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
    
        localStorage.setItem(
    
            key,
    
            JSON.stringify(
                Array.isArray(value)
                ? value
                : []
            )
    
        );
    
    }
    
    
    function localReadObject(
        key
    ){
    
        try{
    
            const value =
                JSON.parse(
                    localStorage.getItem(
                        key
                    ) || "{}"
                );
    
    
            return (
                value &&
                typeof value ===
                "object" &&
                !Array.isArray(value)
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
    
        localStorage.setItem(
    
            key,
    
            JSON.stringify(
                value || {}
            )
    
        );
    
    }
    
    
    /* =========================================================
       SERVER REQUEST
    ========================================================= */
    
    async function serverRequest(
        path,
        options
    ){
    
        if(
            !CONFIG.apiBaseUrl
        ){
    
            throw new Error(
                "SPHP API Base URL is not configured."
            );
    
        }
    
    
        const controller =
            new AbortController();
    
    
        const timeout =
            setTimeout(
                function(){
    
                    controller.abort();
    
                },
                CONFIG.requestTimeoutMs || 15000
            );
    
    
        try{
    
            const response =
                await fetch(
    
                    CONFIG.apiBaseUrl +
                    path,
    
                    {
    
                        method:
                            options?.method ||
                            "GET",
    
                        headers: {
    
                            "Content-Type":
                                "application/json",
    
                            ...(
                                options?.headers ||
                                {}
                            )
    
                        },
    
                        credentials:
                            "include",
    
                        body:
                            options?.body !==
                            undefined
    
                            ? JSON.stringify(
                                options.body
                            )
    
                            : undefined,
    
                        signal:
                            controller.signal
    
                    }
    
                );
    
    
            if(
                !response.ok
            ){
    
                throw new Error(
                    "Server request failed: " +
                    response.status
                );
    
            }
    
    
            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";
    
    
            if(
                contentType.includes(
                    "application/json"
                )
            ){
    
                return await response.json();
    
            }
    
    
            return null;
    
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
    
        const record = {
    
            id:
                generateId(
                    "AUD"
                ),
    
            timestamp:
                nowISO(),
    
            action:
                action,
    
            entityType:
                entityType,
    
            entityId:
                entityId || "",
    
            details:
                details || {}
    
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
                    "Audit server error:",
                    error
                );
    
            }
    
    
            return record;
    
        }
    
    
        const key =
            CONFIG.storageKeys.auditLog;
    
    
        const list =
            localReadArray(
                key
            );
    
    
        list.unshift(
            record
        );
    
    
        localWriteArray(
            key,
            list
        );
    
    
        return record;
    
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
                    !id
                ){
    
                    return null;
    
                }
    
    
                if(
                    CONFIG.dataMode ===
                    "server"
                ){
    
                    return await serverRequest(
    
                        apiPath +
                        "/" +
                        encodeURIComponent(
                            id
                        )
    
                    );
    
                }
    
    
                const list =
                    localReadArray(
                        storageKey
                    );
    
    
                const found =
                    list.find(
                        item =>
                            item &&
                            item.id === id
                    );
    
    
                return found
                    ? cloneData(found)
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
                        generateId(
                            idPrefix
                        );
    
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
    
    
                    return result;
    
                }
    
    
                const list =
                    localReadArray(
                        storageKey
                    );
    
    
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
                    !id
                ){
    
                    throw new Error(
                        "Record ID is required."
                    );
    
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
                                id
                            ),
    
                            {
    
                                method:
                                    "PUT",
    
                                body: {
    
                                    ...cloneData(
                                        changes || {}
                                    ),
    
                                    updatedAt:
                                        nowISO()
    
                                }
    
                            }
    
                        );
    
    
                    await writeAudit(
    
                        "UPDATE",
    
                        entityType,
    
                        id,
    
                        {
    
                            fields:
                                Object.keys(
                                    changes ||
                                    {}
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
                        item =>
                            item &&
                            item.id === id
                    );
    
    
                if(
                    index <
                    0
                ){
    
                    throw new Error(
                        "Record not found: " +
                        id
                    );
    
                }
    
    
                const oldRecord =
                    list[
                        index
                    ];
    
    
                const newRecord = {
    
                    ...oldRecord,
    
                    ...cloneData(
                        changes || {}
                    ),
    
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
    
                    id,
    
                    {
    
                        fields:
                            Object.keys(
                                changes ||
                                {}
                            )
    
                    }
    
                );
    
    
                return cloneData(
                    newRecord
                );
    
            },
    
    
            async upsert(data){
    
                if(
                    !data
                ){
    
                    throw new Error(
                        "Data is required."
                    );
    
                }
    
    
                if(
                    data.id
                ){
    
                    const existing =
                        await this.getById(
                            data.id
                        );
    
    
                    if(existing){
    
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
                    !id
                ){
    
                    return false;
    
                }
    
    
                if(
                    CONFIG.dataMode ===
                    "server"
                ){
    
                    await serverRequest(
    
                        apiPath +
                        "/" +
                        encodeURIComponent(
                            id
                        ),
    
                        {
    
                            method:
                                "DELETE"
    
                        }
    
                    );
    
    
                    await writeAudit(
    
                        "DELETE",
    
                        entityType,
    
                        id,
    
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
                        item =>
                            item &&
                            item.id !== id
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
    
                    id,
    
                    {}
    
                );
    
    
                return true;
    
            }
    
        };
    
    }
    
    
    /* =========================================================
       SERVICES
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
                "NOT",
    
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
    
    
    /* =========================================================
       SETTINGS SERVICE
    ========================================================= */
    
    const settingsService = {
    
    
        async getReportSettings(){
    
            if(
                CONFIG.dataMode ===
                "server"
            ){
    
                return await serverRequest(
                    "/settings/report"
                );
    
            }
    
    
            return cloneData(
    
                localReadObject(
                    CONFIG.storageKeys.reportSettings
                )
    
            );
    
        },
    
    
        async saveReportSettings(
            data
        ){
    
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
    
    
                return result;
    
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
    
                return await serverRequest(
                    "/settings/smart-baseline"
                );
    
            }
    
    
            return cloneData(
    
                localReadObject(
                    CONFIG.storageKeys.smartBaseline
                )
    
            );
    
        },
    
    
        async saveSmartBaseline(
            data
        ){
    
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
    
    
                return result;
    
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
    
        }
    
    };
    
    
    /* =========================================================
       COMPATIBILITY FUNCTIONS
    
       هذه تبقي الصفحات القديمة شغالة الآن.
       ========================================================= */
    
    window.getPublicHealthNotifications =
        async function(){
    
            return await notifications.getAll();
    
        };
    
    
    window.savePublicHealthNotification =
        async function(
            notification
        ){
    
            if(
                notification &&
                notification.id
            ){
    
                const existing =
                    await notifications.getById(
                        notification.id
                    );
    
    
                if(existing){
    
                    return await notifications.update(
    
                        notification.id,
    
                        notification
    
                    );
    
                }
    
            }
    
    
            return await notifications.create(
                notification
            );
    
        };
    
    
    window.getRapidScreeningRecords =
        async function(){
    
            return await rapidScreenings.getAll();
    
        };
    
    
    window.saveRapidScreeningRecord =
        async function(
            record
        ){
    
            return await rapidScreenings.upsert(
                record
            );
    
        };
    
    
    window.getSmartScreeningRecords =
        async function(){
    
            return await smartScreenings.getAll();
    
        };
    
    
    window.saveSmartScreeningRecord =
        async function(
            record
        ){
    
            return await smartScreenings.upsert(
                record
            );
    
        };
    
    
    window.getEmployeeScreeningRecords =
        async function(){
    
            return await employeeScreenings.getAll();
    
        };
    
    
    window.saveEmployeeScreeningRecord =
        async function(
            record
        ){
    
            return await employeeScreenings.upsert(
                record
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
    
        settings:
            settingsService,
    
        audit:
            auditService,
    
        helpers: {
    
            generateId:
                generateId,
    
            nowISO:
                nowISO
    
        }
    
    };
    
    
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