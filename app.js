const form = document.querySelector(".employee-form");

const employeeName = document.querySelector("#empname");
const requestId = document.querySelector("#requestid");
const documentType = document.querySelector("#documenttype");
const submissionDate = document.querySelector("#subdate");
const documentFile = document.querySelector("#document");
const consent = document.querySelector("#consent");

const validationArea = document.querySelector(".validation-area");
const fileName = document.querySelector("#file-name");
const submitButton = form.querySelector("button[type='submit']");

let isSubmitting = false;


const documentTypes = [
    {
        value: "passport",
        label: "Passport"
    },
    {
        value: "pan",
        label: "PAN Card"
    },
    {
        value: "resume",
        label: "Resume"
    },
    {
        value: "address-proof",
        label: "Address Proof"
    }
];


function loadDocumentTypes() {
    documentType.innerHTML =
        '<option value="">Select Document Type</option>';

    documentTypes.forEach(function(type) {
        const option = document.createElement("option");

        option.value = type.value;
        option.textContent = type.label;

        documentType.appendChild(option);
    });
}


documentFile.addEventListener("change", function() {
    if (documentFile.files.length > 0) {
        fileName.textContent =
            "Selected file: " + documentFile.files[0].name;
    } else {
        fileName.textContent = "";
    }
});


function validateForm() {
    let isValid = true;

    clearErrors();

    if (employeeName.value.trim() === "") {
        showError(employeeName, "Employee Name is required.");
        isValid = false;
    }

    if (requestId.value.trim() === "") {
        showError(requestId, "Request ID is required.");
        isValid = false;
    }

    if (documentType.value === "") {
        showError(documentType, "Please select a document type.");
        isValid = false;
    }

    if (submissionDate.value === "") {
        showError(submissionDate, "Submission Date is required.");
        isValid = false;
    }

    if (documentFile.files.length === 0) {
        showError(documentFile, "Please upload a document.");
        isValid = false;
    }

    if (!consent.checked) {
        showError(consent, "You must confirm the information.");
        isValid = false;
    }

    return isValid;
}


function showError(field, message) {
    const error = document.createElement("p");

    error.className = "field-error";
    error.textContent = message;

    field.parentElement.appendChild(error);
}


function clearErrors() {
    const errors = document.querySelectorAll(".field-error");

    errors.forEach(function(error) {
        error.remove();
    });
}


function buildSubmissionPayload() {
    return {
        employeeName: employeeName.value.trim(),
        requestId: requestId.value.trim(),
        documentType: documentType.value,
        submissionDate: submissionDate.value,
        documentName: documentFile.files[0].name,
        consent: consent.checked
    };
}


// ---- UI state renderers -------------------------------------------------

function renderLoadingState() {
    validationArea.innerHTML =
        '<p class="status status-loading">Submitting your documents&hellip; please wait.</p>';
}

function renderSuccessState(record) {
    validationArea.innerHTML = `
        <strong>Submission Successful</strong>
        <p class="status status-success">Your request was received (ID: ${record.id}).</p>
        <p>Employee Name: ${record.employeeName}</p>
        <p>Request ID: ${record.requestId}</p>
        <p>Document Type: ${record.documentType}</p>
        <p>Submission Date: ${record.submissionDate}</p>
        <p>Document: ${record.documentName}</p>
    `;
}

function renderValidationErrorState(message, fieldErrors) {
    validationArea.innerHTML =
        '<p class="status status-error">' + message + '</p>';

    if (fieldErrors) {
        const fieldToInput = {
            employeeName: employeeName,
            requestId: requestId,
            documentType: documentType,
            submissionDate: submissionDate,
            documentFile: documentFile
        };

        Object.keys(fieldErrors).forEach(function(key) {
            const input = fieldToInput[key];
            if (input) {
                showError(input, fieldErrors[key]);
            }
        });
    }
}

function renderServerErrorState(message) {
    validationArea.innerHTML =
        '<p class="status status-error">' + message + '</p>';
}

function renderNetworkErrorState() {
    validationArea.innerHTML =
        '<p class="status status-error">Could not reach the server. Check your connection and try again.</p>';
}


// ---- Submission -----------------------------------------------------------

async function submitToServer(payload) {
    const url = CONFIG.API_BASE_URL + CONFIG.SUBMISSIONS_ENDPOINT;

    const controller = new AbortController();
    const timeout = setTimeout(function() {
        controller.abort();
    }, CONFIG.REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            data = null;
        }

        if (response.ok) {
            renderSuccessState(data);
            return;
        }

        if (response.status === 400 || response.status === 422) {
            renderValidationErrorState(
                (data && data.message) || "The server rejected some of the submitted data.",
                data && data.fields
            );
            return;
        }

        if (response.status === 401) {
            renderServerErrorState(
                (data && data.message) || "You are not authorized. Please sign in again."
            );
            return;
        }

        if (response.status === 404) {
            renderServerErrorState(
                (data && data.message) || "The submissions service could not be found."
            );
            return;
        }

        if (response.status === 409) {
            renderValidationErrorState(
                (data && data.message) || "This Request ID has already been submitted.",
                { requestId: "Please use a unique Request ID." }
            );
            return;
        }

        // Any other non-2xx (typically 5xx).
        renderServerErrorState(
            (data && data.message) || "The server encountered an error. Please try again later."
        );
    } catch (error) {
        clearTimeout(timeout);

        if (error.name === "AbortError") {
            renderServerErrorState("The request timed out. Please try again.");
        } else {
            // fetch() rejects with a TypeError on network failure (offline, DNS, CORS, etc.)
            renderNetworkErrorState();
        }
    }
}


form.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    const isValid = validateForm();

    if (!isValid) {
        validationArea.innerHTML =
            '<p class="status status-error">Please correct the errors above.</p>';
        return;
    }

    const payload = buildSubmissionPayload();

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    renderLoadingState();

    await submitToServer(payload);

    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
});


form.addEventListener("reset", function() {
    setTimeout(function() {
        clearErrors();

        fileName.textContent = "";

        validationArea.innerHTML =
            "<p>Fields marked with * are required.</p>";
    }, 0);
});


loadDocumentTypes();