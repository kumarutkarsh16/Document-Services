(function () {
    const realFetch = window.fetch.bind(window);
    const submissionsUrl = CONFIG.API_BASE_URL + CONFIG.SUBMISSIONS_ENDPOINT;

    const submissionStore = new Map();

    function jsonResponse(status, body) {
        return new Response(JSON.stringify(body), {
            status: status,
            headers: { "Content-Type": "application/json" }
        });
    }

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    async function handleSubmissionPost(requestBody) {
        await delay(1000 + Math.random() * 800);

        const requestId = requestBody.requestId || "";

        if (requestId === "TEST-400") {
            return jsonResponse(400, {
                error: "validation_error",
                message: "One or more fields failed server-side validation.",
                fields: {
                    documentType: "Document type is not recognized."
                }
            });
        }

        if (requestId === "TEST-401") {
            return jsonResponse(401, {
                error: "unauthorized",
                message: "Your session has expired. Please sign in again."
            });
        }

        if (requestId === "TEST-404") {
            return jsonResponse(404, {
                error: "not_found",
                message: "The submissions endpoint could not be found."
            });
        }

        if (requestId === "TEST-409") {
            return jsonResponse(409, {
                error: "conflict",
                message: "A submission with this Request ID already exists."
            });
        }

        if (requestId === "TEST-500") {
            return jsonResponse(500, {
                error: "server_error",
                message: "Something went wrong while processing your request."
            });
        }

        const id = "sub_" + Math.random().toString(36).slice(2, 10);
        const record = {
            id: id,
            status: "received",
            employeeName: requestBody.employeeName,
            requestId: requestBody.requestId,
            documentType: requestBody.documentType,
            submissionDate: requestBody.submissionDate,
            documentName: requestBody.documentName,
            createdAt: new Date().toISOString()
        };
        submissionStore.set(id, record);

        return jsonResponse(201, record);
    }

    async function handleStatusGet(id) {
        await delay(500 + Math.random() * 400);

        const record = submissionStore.get(id);

        if (!record) {
            return jsonResponse(404, {
                error: "not_found",
                message: "No submission found with id " + id
            });
        }

        return jsonResponse(200, record);
    }

    window.fetch = async function (url, options) {
        const method = (options && options.method) || "GET";

        if (url === submissionsUrl && method === "POST") {
            const body = JSON.parse(options.body);
            console.groupCollapsed("[mock-server] POST " + url);
            console.log("Request body:", body);
            const response = await handleSubmissionPost(body);
            const cloned = response.clone();
            console.log("Response status:", response.status);
            console.log("Response body:", await cloned.json());
            console.groupEnd();
            return response;
        }

        if (typeof url === "string" && url.indexOf(submissionsUrl + "/") === 0 && method === "GET") {
            const id = url.slice((submissionsUrl + "/").length);
            console.groupCollapsed("[mock-server] GET " + url);
            const response = await handleStatusGet(id);
            const cloned = response.clone();
            console.log("Response status:", response.status);
            console.log("Response body:", await cloned.json());
            console.groupEnd();
            return response;
        }

        return realFetch(url, options);
    };
})();