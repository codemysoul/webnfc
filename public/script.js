/**
 * NDEFReader and NDEFWriter objects.
 * Initialized during onload.
 */
let Reader, Writer;

/**
 * Boolean property to indicate if the user is about to write a tag.
 */
let writePending = false;

/**
 * The record user is going to write
 */
let pendingRecord;

/**
 * The scan element we display when a scan is detected
 */
const scanEl = document.getElementById('scan');

/**
 * The default element we display when no scan is active
 */
const defaultEl = document.getElementById('default');

/**
 * Title of the read tag type
 */
const scanTypeTitle = document.getElementById('scan-type-title');

/**
 * Tag message UI element
 */
const messageEl = document.getElementById('message');

/**
 * Overwrite elements
 */
const overwriteEl = document.getElementById('overwrite');
const overwriteTextEl = document.getElementById('overwrite-text');
const overwriteTextRadioEl = document.getElementById('radio-text');
const overwriteUrlRadioEl = document.getElementById('radio-url');
const overwriteUrlEl = document.getElementById('overwrite-url');
const overwritePendingText = document.getElementById('writing-text');
const overwriteCancelButton = document.getElementById('cancel-write');

/**
 * Execute on page load.
 * We make sure we have met all the requirements to be able to read and write NFC tags in users device and browser.
 * Initializes Reader and Writer, and starts listening to reads.
 */
window.onload = function () {
    /**
     * Check if the "permissions" exists in the navigator object
     */
    if ('permissions' in navigator) {
        /**
         * Check the permission status of NFC
         */
        window.navigator.permissions.query({ name: 'nfc' }).then(permissionStatus => {
            /**
             * Verify that the NDEFReader and NDEFWriter objects are available
             */
            if ('NDEFReader' in window && 'NDEFWriter' in window) {
                /**
                 * All good, ready to rock!
                 * Let's define reader and writer.
                 */
                Reader = new NDEFReader();
                Writer = new NDEFWriter();

                /**
                 * Handle the state
                 */
                const state = permissionStatus.state;

                /**
                 * If user has already granted persiommin for NFC, we can initialize the scanner
                 */
                if (state == 'granted') {
                    activateReader();
                }

                console.log('NFC permission:', state);
                handlePermissionState(state);

                /**
                 * Listen to state changes
                 */
                permissionStatus.onchange = (event) => {
                    handlePermissionState(event.target.state);
                }
            } else {
                handlePermissionState('not-supported');
            }
        }).catch(error => {
            console.log('NFC is not supported.');
            handlePermissionState('not-supported');
        })
    }

    /**
     * If "permissions" does not exist, we cannot verify that the NFC is supported by the browser
     */
    else {
        console.log('Permissions does not exist in navigator.');
        handlePermissionState('not-supported');
    }
};

/**
 * Handle permission status
 * @param {*} state https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/state - 'granted', 'denied', 'prompt'
 * We have one custom state 'not-supported'
 */
function handlePermissionState(state) {
    const status = document.getElementById('status');
    console.log('State:', state);
    if (state == 'not-supported') {
        status.innerHTML = '<p>NFC not supported</p>';
    }
    if (state == 'denied') {
        status.innerHTML = '<p>NFC permission denied</p>';
    }
    if (state == 'prompt') {
        status.innerHTML = '<button onclick="activateReader()">Enable NFC</button>';
    }
    if (state == 'granted') {
        status.innerHTML = '<p>Scanning</p>';
    }
}

/**
 * Starts the actiovation of reader
 */
async function activateReader() {
    /**
     * Asks user's permission to start scanning
     */
    try {
        await Reader.scan();
    } catch (error) {
        console.log('Error initializing reader', error);
    }

    /**
     * Listen for read events
     */
    Reader.onreading = event => {
        /**
         * If user has activated writing, we handle writing.
         */
        if (writePending) {
            return handleWrite();
        }

        /**
         * By default, we handle the read
         */
        else {
            handleRead(event);
        }
    };

    /**
     * Listen for errors on reader
     */
    Reader.onerror = event => {
        console.log("Error! Cannot read data from the NFC tag. Try a different one?", event);
        handleRead(event);
    };
}

/**
 * Handles tag writing opertaion
 */
async function handleWrite() {
    console.log('Now we should write!');
    Writer.write(pendingRecord).then(() => {
        console.log("Message written.");
        closeScan();
    }).catch(error => {
        console.log(`Write failed :-( try again: ${error}.`);
    });
}

/**
 * Handles the read operation
 * @param {*} event - The read event
 */
function handleRead(event) {
    /**
     * Reset UI when new scan is detected
     */
    resetScan();

    /**
     * Event message records array
     * https://w3c.github.io/web-nfc/#ndef-record-types
     */
    const records = event.message.records || [];

    /**
     * Unique identification number of the tag which was read
     */
    const serialNumber = event.serialNumber;

    /**
     * Loop the records
     */
    for (const record of records) {
        switch (record.recordType) {
            case "text":
                scanTypeTitle.innerText = 'Text';
                overwriteEl.classList.add('active');
                displayMessage(textTagFromRecord(record));
                break;
            case "url":
                scanTypeTitle.innerText = 'URL';
                overwriteEl.classList.add('active');
                displayMessage(urlTagFromRecord(record));
                break;
            case "empty":
                scanTypeTitle.innerText = 'Empty';
                overwriteEl.classList.add('active');
                break;
            default:
                scanTypeTitle.innerText = 'Unknown';
        }

        /**
         * For now, we are only interested in the first record of the array.
         * Let's break the loop
         */
        break;
    }

    /**
     * Reader.onerror errorHandler calls this function without record array
     */
    if (!records.length) {
        scanTypeTitle.innerText = 'Unknown';
    }

    /**
     * Display scan
     */
    defaultEl.classList.remove('active');
    scanEl.classList.add('active');
}

const textTagFromRecord = (record) => {
    const textDecoder = new TextDecoder(record.encoding);
    return textDecoder.decode(record.data);
}

const urlTagFromRecord = (record) => {
    const decoder = new TextDecoder();
    return decoder.decode(record.data);
}

function displayMessage(text) {
    if (!text.length) return resetMessage();
    messageEl.innerHTML = text;
    messageEl.classList.add('active');
}

function resetMessage() {
    messageEl.innerHTML = ''
    messageEl.classList.remove('active');
}

/**
 * Closes the UI scanEl popup
 */
function closeScan() {
    cancelWrite();
    resetScan();
    scanEl.classList.remove('active');
    defaultEl.classList.add('active');
}

/**
 * Reset overwrite option
 */
function resetScan() {
    resetMessage();
    overwriteEl.classList.remove('active');
    overwriteTextEl.value = '';
    overwriteUrlEl.value = '';
    overwriteTextEl.classList.add('active');
    overwriteTextRadioEl.checked = true;
    overwriteUrlEl.classList.remove('active');
}

/**
 * Handles displaying of content user wants to write to tag
 * @param {*} radio clicked radio button value
 */
function handleOverwriteSelection(radio) {
    overwriteTextEl.classList.remove('active');
    overwriteUrlEl.classList.remove('active');
    if (radio.value == 'text') overwriteTextEl.classList.add('active');
    if (radio.value == 'url') overwriteUrlEl.classList.add('active');
}

/**
 * Starts write operation. When called, the next read will also trigger write.
 */
function startWrite() {
    let recordToWrite;
    if (overwriteTextRadioEl.checked) {
        recordToWrite = overwriteTextEl.value;
    }

    else if (overwriteUrlRadioEl.checked) {
        recordToWrite = {
            records: [{ recordType: "url", data: getValidUrl(overwriteUrlEl.value) }]
        }
    }

    console.log('We sould write:', recordToWrite);

    pendingRecord = recordToWrite;

    writePending = true;

    overwritePendingText.classList.add('active');
    overwriteCancelButton.classList.add('active');
}

/**
 * Cancels pending write operation
 */
function cancelWrite() {
    pendingRecord = null;
    writePending = false;
    overwritePendingText.classList.remove('active');
    overwriteCancelButton.classList.remove('active');
}

/**
 * Build a right form of URL
 * @param {*} url text to build a URL from
 */
const getValidUrl = (url = "") => {
    let newUrl = decodeURIComponent(url);
    newUrl = newUrl.trim().replace(/\s/g, "");

    if (/^(:\/\/)/.test(newUrl)) {
        return `https${newUrl}`;
    }
    if (!/^(f|ht)tps?:\/\//i.test(newUrl)) {
        return `https://${newUrl}`;
    }

    return newUrl;
};

/**
 * Set up service worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}