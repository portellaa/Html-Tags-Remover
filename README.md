HTML Cleaner
=================

<p>A service in NodeJS that allows you to specify a custom array of tags to be removed from a text, usually an HTML page.<br />As been added to, the ability of remove tags but leave the text inside them. It can be useful if you need to grab the title, images and description from a webpage.</p><p>This service can works in cluster mode, that uses more than just one processor and can be defined on the configs file and in single mode, where only one instance running at one processor.</p><p>Uses package.json to solve all dependencies.</p><p><b>New configuration</b> to personalize the working mode of the service.

<h2>HTTP Methods</h2>
<ul>
<li><b>POST</b> - the information can be provided as form-data or json</li>
<li><b>GET</b> - the information should be provided as simple arguments</li>
</ul>

<h2>Input</h2>
Parameters accepted by the service
<ul>
<li><strong>tags</strong> - A dictionary of tags that will be used to apply on the provided html page.<br />Possible uses of <b>tags</b> parameter:
<ul>
<li><b>no tags specified</b> - all tags removed from the html, only text remains.
</li>
<li><b>dictionary</b> - key that matches the html tag and the value a dictionary with some specific keys that works as a rules to be applied to match the key. (some examples will be provided later)</li>
</ul>
<li><strong>src</strong> - The html page (raw data, not url) to be cleanned.
<ul>
<li><b>single</b> - an unique html page</li> 
<li><b>array</b> - multiple html pages</li>
</ul>
</li>
<li><b>url</b> - the url that will be used to retrieve the html
<ul>
<li><b>single</b> - an unique url</li>
</ul>
</li>
<li><b>format</b> - the format that should be used in the output
<ul>
<li><b>json</b> - result will be outputed in json</li>
<li><b>text</b> - result will be outputed in simple text</li>
<li><b>html</b> - result will be outputed in html. Useful to be shown in a browser</li>
</ul>
</ul>

<h2>Libraries</h2>
<ul>
<li><b>cluster2</b> - Used to run the service in all the processors available on the machine</li>
<li><b>express</b> - Used to handle the http server and all the requests</li>
<li><b>htmlparser2</b> - Used to parse the DOM and handle the html tags and attributes</li>
</ul>

<h2>TODO</h2>
<ul>
<li><b style="font-size: x-large;">Work on configs to better customization of service</b></li>
<li><b style="font-size: x-large;">Finish and complete documentation aka Readme</b></li>
<li><b style="font-size: x-large;">Improve performance</b></li>
</ul>