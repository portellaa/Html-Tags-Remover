var specialTags = [ "img", "hr", "link", "meta", "input" ];
var tagsToAddAttributes = {
	"a" : {
		"target" : "_blank"
	}
};

exports.specialTags = function ()
{
	return specialTags;
};

exports.newAttributes = function()
{
	return tagsToAddAttributes;
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