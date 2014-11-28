/*
* Parameters required for building the visualization in d3.
* All the other appearance parameters are defined in CSS.
*/

var paperMinRadius = 5,
    paperMaxRadius = 15,
    paperInnerWhiteCircleRatio =.4,
    paperMarginBottom = 0,
    titleBaselineOffset = 6,  // depends on font size
    titleXOffset = 5,
    paperXOffsetWhenSelected = - (2*paperMaxRadius - titleXOffset),
    fringeBottomMargin = 2*paperMaxRadius+paperMarginBottom;

var fringePapersTransitionEasing="quad-in-out",
    fringePapersPositionTransitionDuration="1000",
    fringePapersColorTransitionDuration="500";

// Defines the dimension of each region, index by the current view (core, toread, fringe)
// The apparent width is the horizontal space that we want the region to occupy on the screen
// An appropriate offset for the x-position of the center will be computed as -radius+apparentWidth
var coreRadius = [120,120,120],
    toreadRadius = [2000,2000,2000],
    fringeRadius = [2000,2000,2000],
    coreApparentWidth = [120,120,120],
    fringeApparentWidth = [420,420,420],
    toreadApparentWidth = [420,420,fringeApparentWidth[2]-paperMaxRadius+titleXOffset];

var colors={
    // orange, green, blue, pink, darkblue
    "tags":["#F18D05","#61AE24","#00A1CB","#D70060","#113F8C"],
	// thése two colors are pretty, but probably shouldn't be used for tags (too similar)
    "turquoise":"#01A4A4",	    
	"red":"#E54028",		
    // background color of each region based on the current view
    "core":["rgb(223, 111, 95)","rgb(223, 111, 95)","rgb(223, 111, 95)"],
    "toread":["rgb(242, 222, 195)","rgb(242, 222, 195)","rgb(242, 222, 195)"], 
    "toreadBorder":["rgb(242, 210, 166)","rgb(242, 210, 166)","rgb(242, 210, 166)"]
}

var currentYear=2010;
var citationCountCutoff=150;