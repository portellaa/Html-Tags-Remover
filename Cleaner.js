var htmlparser = require("htmlparser2");
var configs = require("./configs.js");

var tags;
var parser;


var finalText;
var lastTags;

var allTagsForbidden = false;
var allAttribsForbidden = false;
var clean = true;

var Cleaner = function (data)
{
	console.log("[Cleaner]: Init with data: ", data);
	if ((data === undefined) || (data === null))
	{
		this.allTagsForbidden = true;
		this.allAttribsForbidden = true;
		return;
	}

	if ((data.tags === undefined) || (data.tags === null))
	{
		console.log("[Cleaner]: Tags undefined.");
		if (((data.clean !== undefined) || (data.clean !== null)) && ((data.clean == false) || (data.clean == 'false')))
		{
			this.clean = false;
			this.tags = configs.notCleanTags();
			console.log("[Cleaner]: No tags defined and clean is false");
		}
		else return;
	}
	else
	{
		if ((data.clean !== undefined) && (data.clean !== null) && (data.clean === false))
		{
			this.clean = false;
		}
	}

	try
	{
		if((typeof this.tags) !== "object")
		{
			this.tags = JSON.parse(tags, function (key, value) {
				
				if (key == "*")
					return value;

				if (value == "*")
					return [];

				if (value.length === 0)
					return [];

				return value;
			});
		}

		if (isEmpty(this.tags))
		{
			this.tags = undefined;
			this.allTagsForbidden = true;
			this.allAttribsForbidden = true;
			return;
		}

		if (this.tags.hasOwnProperty("*"))
		{
			this.allTagsForbidden = true;
			if ((!(this.tags["*"] instanceof Array)) && (this.tags.length === 0))
			{
				this.allAttribsForbidden = true;
				return;
			}
			else if (this.tags.toString().indexOf("*") != -1)
			{
				this.allAttribsForbidden = true;
				return;
			}
			else this.allAttribsForbidden = false;
		}
		else // All Tags selected
		{
			this.allTagsForbidden = false;
			this.allAttribsForbidden = false;
		}
	}
	catch(e)
	{
		console.log("[Cleaner]: Error parsing json. Tags: ", this.tags);
		this.tags = undefined;
		this.allTagsForbidden = true;
		this.allAttribsForbidden = true;
		return;
	}

	/* Private functions */

	/**
	 * Searches for a tag attributes on the tag object
	 * @param  {String} tag name of the tag that is being searched
	 * @return {Boolean|Array}     false if the tag doesn't exists, and an array of attributes if it exists.
	 */
	this.getTagAttributes = function (tag)
	{
		var attribs = false;
		if (this.tags.hasOwnProperty(tag))
		{
			attribs = this.tags[tag];
			if (attribs instanceof Array)
				return attribs;

			if (attribs.toString().indexOf("*") != -1)
				return [];

			return false;
		}

		return false;
	};

	/**
	 * Checks if the tag and the existing attributes are forbidden
	 * @param  {[type]}  tagname Name of the tag that is being processed by the parser
	 * @param  {[type]}  attribs Object with the attributes of the tag
	 * @return {Boolean}         true if the that and attributes are forbidden
	 */
	this.isForbidden = function (tagname, tagAttribs)
	{
		// IF last tag forbidden there is no need to test this one
		if ((this.isLastTagForbidden() === true) && (this.clean === true))
			return true;

		// Find out if all tags are forbidden and attributes.
		var forbiddenAttribs = false;
		if (this.allTagsForbidden === true)
		{
			if (this.allAttribsForbidden === true)
				return true;
			else forbiddenAttribs = this.getTagAttributes("*");
		}
		
		// Get HTML element|tag forbidden attributes
		var tmpForbiddenAttribs = this.getTagAttributes(tagname);

		// Check if all HTML attributes forbidden is correctly formated
		if (forbiddenAttribs === false)
		{
			forbiddenAttribs = [];
			if (tmpForbiddenAttribs === false)
				return false;
		}

		// Check if element HTML attributes forbidden is correctly formated
		if (tmpForbiddenAttribs === false)
			tmpForbiddenAttribs = [];

		forbiddenAttribs = forbiddenAttribs.concat(tmpForbiddenAttribs);

		if (((forbiddenAttribs instanceof Array) && (forbiddenAttribs.length === 0)) || (forbiddenAttribs == "*"))
			return true;

		for (var i = 0; i < forbiddenAttribs.length; i++)
		{
			// Trying to fix bad formatted object
			if (!forbiddenAttribs[i].hasOwnProperty("operator"))
			{
				var tmpAttribs = forbiddenAttribs[i];
				forbiddenAttribs[i].operator = "or";

				if (!tmpAttribs.hasOwnProperty("attribs"))
				{
					if (tmpAttribs instanceof Array)
						forbiddenAttribs[i].attribs = tmpAttribs;
					else continue;
				}
				else forbiddenAttribs[i].attribs = tmpAttribs.attribs;
			}

			if (forbiddenAttribs[i].hasOwnProperty("attribs"))
			{
				var attribs = forbiddenAttribs[i].attribs;
				var attrib, pattern;

				if (((attribs instanceof Array) && (attribs.length === 0)) || (attribs == "*"))
					return true;

				switch(forbiddenAttribs[i].operator.toString().toLowerCase())
				{
					case "or": {

						for (attrib in attribs)
						{
							switch(attrib)
							{
								case "href":
								case "src":
								{
									try
									{
										tagAttribs[attrib] = decodeURIComponent(tagAttribs[attrib]);
									}
									catch (e)
									{
										console.log("ERROR Parsing attrb: ", e);
									}
								}
								break;
							}
							if (tagAttribs.hasOwnProperty(attrib))
							{
								// Check if use of regex is used
								// console.log("Processing attrib: ", attrib);
								pattern = /^\/(.*?)\/$/gi;
								if (pattern.test(attribs[attrib]) === true)
								{
									// console.log("Pattern. tagAttribs: ", tagAttribs[attrib], " | attribs: ", attribs[attrib]);
									pattern = new RegExp(attribs[attrib].substr(1, attribs[attrib].length - 2), "gim");
									if (pattern.test(tagAttribs[attrib]) === true)
										return true;
								}
								else
								{
									// console.log("No pattern. tagAttribs: ", tagAttribs[attrib], " | attribs: ", attribs[attrib]);
									if (tagAttribs[attrib] == attribs[attrib])
										return true;
								}
							}
						}
					}
					break;
					case "and": {
						for (attrib in attribs)
						{
							if (!tagAttribs.hasOwnProperty(attrib))
								return false;

							// Check if use of regex is introduced
							pattern = /^\/(.*?)\/$/gi;
							if (pattern.test(attribs[attrib]) === true)
							{
								pattern = new RegExp(attribs[attrib], "gim");
								if (pattern.test(tagAttribs[attrib]) === false)
									return false;
							}
							else
							{
								if (tagAttribs[attrib] !== attribs[attrib])
									return false;
							}

						}

						// return true;
						break;
					}
				}
			}
		}

		return false;
	};

	this.addLastTag = function (tagname, forbidden)
	{
		this.lastTags.push({
			tag: tagname,
			forbidden: forbidden
		});
	};

	// Text Operations
	this.openTag = function (tag, attribs)
	{
		this.finalText += '' + '<' + tag;
		
		var newAttributes = configs.newAttributes()[tag];
		console.log("[Cleaner]: tag: " + tag + " undefined");
		if (newAttributes !== undefined)
			for (var newAttrib in newAttributes)
				attribs[newAttrib] = newAttributes[newAttrib];
		
		for (var attrib in attribs)
		{
			if (attribs.hasOwnProperty(attrib))
				this.finalText += ' ' + attrib + '="' + attribs[attrib] + '"';
		}

		if (configs.specialTags().indexOf(tag) > -1)
			this.finalText += ' /';
		this.finalText += '>';
	};

	this.closeTag = function (tag)
	{
		if (configs.specialTags().indexOf(tag) > -1) return;
		
		this.finalText += '</' + tag + '>';
	};

	this.isLastTagForbidden = function ()
	{
		if (this.lastTags.length > 0)
			return this.lastTags[this.lastTags.length-1].forbidden;
		
		return false;
	};

	var context = this;

	this.parser = new htmlparser.Parser(
	{
		onopentag: function(name, attribs)
		{
			var isForbidden = context.isForbidden(name, attribs);
			context.addLastTag(name, isForbidden);
			console.log("[Cleaner]:[onopentag] -> tag: " + name + " isForbidden: " + isForbidden);

			if ((isForbidden === false) && (context.clean === true))
				context.openTag(name, attribs);
		},
		ontext: function (text)
		{
			if (((context.isLastTagForbidden() === false) && (context.clean === true)) || ((context.isLastTagForbidden() === true) && (context.clean === false)))
				context.finalText += text;
		},
		onclosetag: function (name)
		{
			if (context.lastTags.length > 0)
			{
				var lastTag = context.lastTags.pop();
				if ((lastTag.forbidden === false) && (context.clean === true))
					context.closeTag(name);
			}
		}
	});
};

Cleaner.prototype = {

	start: function (src, callback)
	{
		console.log("[Cleaner]: Starting...");
		console.log("[Cleaner]: List of tags: ", this.tags);
		if ((src === undefined) || (src === null))
			return buildResponse(true, "Error no src specified");

		if (!(src instanceof Array))
			src = [ src	];

		var result = [];
		for (var i = 0; i < src.length; i++)
		{
			this.finalText = "";
			this.lastTags = [];

			if ((this.tags === undefined) || ((this.allTagsForbidden === true) && (this.allAttribsForbidden === true)))
				result.push(strip_tags(src[i]));
			else
			{
				this.parser.write(src[i]);
				
				result.push(this.finalText);
			}
		}
		if (this.parser !== undefined)
			this.parser.end();

		if (callback === undefined)
			return buildResponse(false, result);

		callback(buildResponse(false, result));
	}
};

module.exports = Cleaner;





// Helper functions
var strip_tags = function (input, allowed) {
	allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
		commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
	
	return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
		return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
	});
};

var isEmpty = function (obj)
{
	for (var key in obj)
		if (obj.hasOwnProperty(key))
			return false;

	return true;
};

var buildResponse = function (error, result)
{
	return { "error": error, "result": result };
};
