var configs = require('./configs.js');

var Cluster = require('cluster2');

var express = require('express');
var app;

var Cleaner = require('./Cleaner.js');

var events = require('events');
var eventEmitter;

var replyToRequest = function (response, data)
{
    switch (data.format)
    {
        case "text":
        {
            response.writeHead(data.code, {'Content-Type': 'text/plain'});
            response.end(data.message.result.toString());

            break;
        }
        case "html":
        {
            response.writeHead(data.code, {'Content-Type': 'text/html'});
            response.end(data.message.result.toString());

            break;
        }
        default:
        {
            response.writeHead(data.code, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(data.message));

            break;
        }
    }
};

var handleRequest = function (response, data, cb) {

    var result = {code: 400, message: '', format: data.format || "json"};

    if (data.hasOwnProperty("src") && (!(data.src instanceof Array)))
    {
        data.src = [ data.src ];
    }
    else if (data.hasOwnProperty("src[]") && (!(data.src instanceof Array)))
    {
        data.src = [ data["src[]"] ];
    }
    else result.message = 'No parameter source specified.';

    if (data.src !== undefined)
    {
        var cleaner = new Cleaner(data.tags);
        var parserResult = cleaner.start(data.src);

        if (parserResult.error === false)
            result.code = 200;

        result.message = parserResult;
    }

    cb(response, result);
};

var postCB = function (request, response)
{   
    handleRequest(response, request.body, replyToRequest);
};

var getCB = function(request, response)
{
    handleRequest(response, request.query, replyToRequest);
};

app = express();
app.use(express.bodyParser());
app.get('/', getCB);
app.post('/', postCB);
// app.listen(20000);

var c = new Cluster({
    port: configs.http.port(),
    cluster: configs.http.cluster(),
    pids: configs.http.pids(),
    monPort: configs.http.monitorPort(),
    connThreshold: configs.http.connectionThreshold(),
});

c.listen(function(cb) {
    cb(app);
});
