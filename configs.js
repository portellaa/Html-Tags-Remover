var specialTags = [ "img", "hr", "link", "meta", "input" ];
var tagsToAddAttributes = {
	"a" : {
		"target" : "_blank"
	}
};

var notCleanTags = {
	"b" : "*", 
	"br" : "*", 
	"center" : "*", 
	"h1" : "*", 
	"h2" : "*", 
	"h3" : "*", 
	"h4" : "*", 
	"h5" : "*", 
	"h6" : "*", 
	"i" : "*", 
	"li" : "*", 
	"p" : "*", 
	"span" : "*", 
	"strong" : "*"
};

var notCleanSpecialTags = [ "title", "img" ];

// Variable that defines how the process should run
// 0 - Single, no cluster is used
// 1 - Multiple, cluster is used
var runMode = 0;


exports.runMode = function ()
{
	if ((runMode < 0) || (runMode > 1))
		return 0;

	return runMode;
}

exports.specialTags = function ()
{
	return specialTags;
};

exports.newAttributes = function()
{
	return tagsToAddAttributes;
};

exports.notCleanTags = function()
{
	return notCleanTags;
};

exports.notCleanSpecialTags = function()
{
	return notCleanSpecialTags;
};

exports.http = {
	port: function ()
	{
		return 20000;
	},
	cluster: function ()
	{
		return true;
	},
	pids: function ()
	{
		return './pids';
	},
	monitorPort: function ()
	{
		return 20001;
	},
	connectionThreshold: function()
	{
		return 100;
	}
};