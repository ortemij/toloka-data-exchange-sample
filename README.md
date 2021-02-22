# Toloka Data Exchange Sample

This guide is designed to explain how a client of Toloka can establish a data exchange process to store none of the meaningful data on Toloka's side and keep both task data and results on their side.

## Basic concept
The meaningful data is stored on the client's server-side — Toloka stores only reference (keys) to it. When a toloker opens task UI in their web-browser, a direct request goes to the client's server, which checks permissions and serves the content. Before submitting a task, another request goes to the client's server, and the task result is stored there in exchange for a reference key. This key is set as a task result and stored in Toloka.

## Toloka settings
To set up a project, look at [toloka](https://github.com/ortemij/toloka-data-exchange-sample/tree/main/toloka) folder inside the repo. Copy-paste `html.hbs` and `js.js` files content to corresponding fields of interface setup stage. Set data specification as follows: `input_key` required string input-field, `output_key` required string output-field. Toloka will store the mentioned above references to the data there.

## Server
The server is responsible for serving tasks content and storing labeling results. In this example, we implemented the server as a simple Node.js application on Express, look at [server.js](https://github.com/ortemij/toloka-data-exchange-sample/tree/main/server.js). For instance, we deployed it to Heroku. To get more details, please visit official documentation [here](https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true).

## Data
For this example, the data is three images stored on a [filesystem](https://github.com/ortemij/toloka-data-exchange-sample/tree/main/data) of the server and accessible with corresponding keys: `"0950a1"`, `"a38c4e"`, `"ea9ee6"`. For testing purposes, one more image is available with the key `"undefined"`.
To run tasks with these data, set up a pool in the Toloka project and upload [an example file](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/toloka/example.tsv) which contains three lines for three tasks with given keys.

## How it works step-by-step
1. A toloker comes to Toloka and assigns a task from the project, for instance, one with `"input_key": "0950a1"`.
2. Toloka backend sends this data to the toloker's web-browser.
3. The web-browser renders the interface and executes [`Task::onRender()`](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/toloka/js.js#L7-L16); an URL for the image is changed to `${deployUrl}/data/0950a1?assignmentId=${assignmentId}`, where `${deployUrl}` is replaced to the real host of the server and `${assignmentId}` to the real `assignmentId` associated for this toloker+task pair and unique in the platform; the web-browser sends a request to the URL.
4. The server receives the request and handles it calling a handler set for [`app.get('/data/:requestedKey', (req, res) => { ... })`](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L27-L74); in testing mode with `assignmentId=undefined` passed, the content of `undefined.jpg` will be [served back](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L31-L35), otherwise a verification process starts
5. The server [calls Toloka API](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L37-L43) and asks for information by given assignment ID; if the request is successful, the server checks [whether the assignment is active](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L49-L54), it means that a toloker needs the content for doing their task; after that the server checks [whether the assignment contains a task with the given key](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L56-L59); only if all these checks passed, [the requested content is served back](https://github.com/ortemij/toloka-data-exchange-sample/blob/main/server.js#L65-L66).
6. 
