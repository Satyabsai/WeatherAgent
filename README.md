-- install
npm install

-- Run the Backend first
node indexCustom.mjs

-- Run Web chat 
Open a new terminal [as other terminal will run backend code]
node_modules/.bin/teamsapptester
-- this is default web browser by MS

Code- IndexCustom.mjs
What it does --- first calls echo then it calls API/Message to call weather with my default Login to get weather .

NOTE --*** Chat looks for Weather in the text and takes anything after that to search for that city to get details
Example - Weather in Hyderabad. [0] is mentioned in ECho talks about  first chat then ti willbe [1] etc...

Also If you wan to call chat from Postman you can use the Request from right window under 201 call and use that payload  as call(http://localhost:3978/api/messages)

Here is complete curl 
curl --location 'http://localhost:3978/api/messages' \
--header 'Content-Type: application/json' \
--data '{
  "type": "message",
  "text": "Postman Weather in London",
  "inputHint": "acceptingInput",
  "channelId": "msteams",
  "locale": "en-US",
  "serviceUrl": "http://localhost:56150/_connector",
  "conversation": {
    "conversationType": "personal",
    "tenantId": "00000000-0000-0000-0000-0000000000001",
    "id": "3806094b-1ce5-44e3-9832-cb830837ada0"
  },
  "from": {
    "id": "00000000-0000-0000-0000-00000000000011",
    "name": "Test Bot"
  },
  "recipient": {
    "id": "user-id-0",
    "name": "Alex Wilber",
    "aadObjectId": "00000000-0000-0000-0000-0000000000020"
  },
  "replyToId": "354c9e32-dc28-4b54-893f-f5c54bbe73b9"
}'
