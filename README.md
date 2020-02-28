# WebNFC

Open source NFC Reader & Writer. Read and write NFC tags online, and offline.
You can find this tool online at: [WebNFC.app](https://webnfc.app/)

## About

This repository aims to allow everyone to read and write NFC tags.
It is built using very basic HTML, CSS and JavaScript.
With service worker, this application can be installed to user's device homescreen, and be used offline.
It is built according to current web application standards and scores 100% in all categories of Chrome Lighthouse audits.

## Usage 

1. `git clone https://github.com/codemysoul/webnfc.git`
2. `cd webnfc`
3. `npm i`
4. `npm run start`

It is recommended to use remote debugging while building on top of this repository. Find details from [here](https://developers.google.com/web/tools/chrome-devtools/remote-debugging)

## Note about Google Analytics

This repo includes Google Analytics for event tracking. To remove analytics, remove lines 153-157 from `index.html` -file and line 57-60 from `service-worker.js` -file.