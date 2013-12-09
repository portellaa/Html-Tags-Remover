var configs = require('./configs.js');

var Cluster = require('cluster2');

var http = require('http');
var express = require('express');
var app;

var Cleaner = require('./Cleaner.js');

var events = require('events');
var eventEmitter;

var replyToRequest = function (response, data, encoding)
{
    encoding = encoding || "utf8"

    switch (data.format)
    {
        case "text":
        {
            var finalResult = data.message;
            
            if (data.message.hasOwnProperty("result"))
                finalResult = data.message.result;

            response.writeHead(data.code, {'Content-Type': 'text/plain;charset=' + encoding});
            response.end(finalResult);

            break;
        }
        case "html":
        {
            var finalResult = data.message;
            
            if (data.message.hasOwnProperty("result"))
                finalResult = data.message.result;
            
            response.writeHead(data.code, {'Content-Type': 'text/html;charset=' + encoding});
            response.end(finalResult.toString());

            break;
        }
        default:
        {
            response.writeHead(data.code, {'Content-Type': 'application/json;charset=' + encoding});
            response.end(JSON.stringify(data.message));

            break;
        }
    }
};

var handleRequest = function (response, data, cb) {

    var result = {code: 400, message: 'No parameters specified.', format: data.format || "json"};
    var cleaner = new Cleaner({"tags": data.tags, "clean": data.clean});

    console.log(data);
    console.log("Src is instanceof array: ", (data["src"] instanceof Array));
    console.log("Src[] is instanceof array: ", (data["src[]"] instanceof Array));

    console.log("Src typeof: ", (typeof(data["src"])));

    if (data.hasOwnProperty("src") && (!(data.src instanceof Array)))
    {
        data.src = [ data.src ];

        sendToCleaner(response, cleaner, data, cb);
    }
    else if (data.hasOwnProperty("src") && (data["src"] instanceof Array))
    {
        // data.src = data["src"];

        sendToCleaner(response, cleaner, data, cb);
    }
    else if (data.hasOwnProperty("src[]") && (data["src[]"] instanceof Array))
    {
        data.src = data["src[]"];

        sendToCleaner(response, cleaner, data, cb);
    }
    else if (data.hasOwnProperty("url") && (!(data.url instanceof Array)))
    {
        getHTMLFromURL(response, cleaner, data, cb);
    }
    else if ((data.hasOwnProperty("url") || data.hasOwnProperty("url[]")) && ((data.url instanceof Array)))
    {
        cb(response, {code: 400, message: 'Not supported yet.', format: data.format || "json"});
        // for (var i = 0; i < data["url"].length; i++)
        //     getHTMLFromURL(response, cleaner, data["url"][i], cb);
    }
    else
    {
        cb(response, result);
    }
    
};

var sendToCleaner = function(response, cleaner, data, cb, encoding)
{
    var result = {code: 400, message: 'No src to process.', format: data.format || "json"};

    if (data.src !== undefined)
    {
        var parserResult = cleaner.start(data.src);

        if (parserResult.error === false)
            result.code = 200;

        result.message = parserResult;
    }

    cb(response, result, encoding);
};

var postCB = function (request, response)
{   
    handleRequest(response, request.body, replyToRequest);
};

var getCB = function(request, response)
{
    handleRequest(response, request.query, replyToRequest);
};

var getHTMLFromURL = function(response, cleaner, data, cb)
{
    console.log("Getting RAW from: ", data.url);
    http.get(data.url, function(res) {

        console.log("Got response: " + res.statusCode);

        if (res.statusCode !== 200)
        {
            cb(response, {code: 400, message: 'No src to process.', format: data.format || "json"});
            return;
        }

        var encoding = 'utf8';
        var headers = res.headers;
        if (headers.hasOwnProperty("content-type"))
        {
            var patt = new RegExp("charset=(.*)","i");
            var charset = patt.exec(headers["content-type"]);
            console.log("charset: ", charset[1]);
        }
        res.setEncoding(encoding);
        
        var finalData = "";
        res.on("data", function(data) {
            finalData += data;
        });

        res.on("end", function() {
            data.src = finalData;
            sendToCleaner(response, cleaner, data, cb, encoding);
            // cb(response, {code: 200, message: finalData, format: data.format || "text"})
        });

    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        cb(response, {code: 400, message: e.message, format: data.format || "json"});
    });

    return;
};

app = express();
app.use(express.bodyParser());
app.get('/', getCB);
app.post('/', postCB);

console.log("Server running mode: " + configs.runMode());
if (configs.runMode() === 0)
{
 app.listen(configs.http.port());
}
else
{
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
}
