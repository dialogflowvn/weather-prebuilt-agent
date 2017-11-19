'use strict';

// Bạn cần thực hiện các bước sau đây để lấy file chứa thông tin chứng thực theo hướng dẫn từ
// https://developers.google.com/identity/protocols/application-default-credentials
//
// Bước 1: Vào url https://console.developers.google.com/project/_/apis/credentials
// Bước 2: Từ drop-down các dự án, chọn dự án của Weather
// Bước 3: Trên trang Credentials, chọn drop-down Create credentials, sau đó chọn Service account key
// Bước 4: Từ Service account drop-down, chọn Dialogflow Integrations
// Bước 5: Mục Key type, chọn JSON, sau đó nhấn nút Create để download file chứng thực
process.env.GOOGLE_APPLICATION_CREDENTIALS = '../Weather-credentials.json'

const weatherjs = require('weather-js');
const readline = require('readline');

// Bạn có thể lấy thông tin project ID trong phần setting của Dialogflow agent
// https://dialogflow.com/docs/agents#settings
const projectId = 'weather-689a5';

const sessionId = 'weather-prebuilt-agent-session-id';

const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'User> '
});

rl.prompt();

rl.on('line', (line) => {
    var userSay = line.trim();

    if (userSay.length <= 0) {
        rl.prompt();
        return;
    }

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: userSay,
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    sessionClient
        .detectIntent(request)
        .then(responses => {
            const result = responses[0].queryResult;
            const parameters = result.parameters;

            var weatherLocationField = parameters.fields['address'];
            var weatherLocation = 'Hanoi';
            if (!!weatherLocationField && !!weatherLocationField.structValue) {
                weatherLocation = weatherLocationField.structValue.fields.city.stringValue;
            }

            var weatherUnitField = parameters.fields['unit'];
            var weatherUnit = 'C';
            if (!!weatherUnitField && weatherUnitField.stringValue.length > 0) {
                weatherUnit = weatherUnitField.stringValue;
            }

            weatherjs.find({
                    search: weatherLocation,
                    degreeType: weatherUnit
                },
                function (err, result) {
                    if (err) {
                        console.error('Bot > ERROR: ', err);
                        return false;
                    }
                    if (result.length <= 0) {
                        console.log('Bot > No data found');
                    } else {
                        let resultData = result[0].current;
                        let resultText = "It's " + resultData.skytext + " in " + weatherLocation + " (" + resultData.temperature + "˚" + weatherUnit + ")";
                        console.log('Bot > ' + resultText);
                    }

                    rl.prompt();
                });
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});
