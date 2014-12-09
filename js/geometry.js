////////////////    helper functions    //////////////

// Compute the height of a paper on the fringe, depending on the zoom level and whether it is selected
function fringePaperHeight(p) {
    // If the paper is not selected, its height decreases with the zoom level
    if(!p.selected)
        return 2*parameters.paperMaxRadius*parameters.compressionRatio[global.zoom];

    // If the paper is selected, its height increases with the zoom level
    var height=2*parameters.paperMaxRadius;

    if(global.zoom>=1)
        height += parameters.metadataYoffset-parameters.paperMaxRadius;

    // The height of the abstract must be computed for each paper individually
    if(global.zoom>=2)
        height += p.abstractHeight;

    // add some whitespace at the bottom to distinguish one paper from the next
    if(global.zoom>0)
        height += parameters.paperMarginBottom;

    return height;
}

// Compute X coordinate for a paper on the fringe, based on a circle
function fringePaperX(p) {
  var selectedOffset = p.selected ?  0 : parameters.paperXOffsetWhenSelected;
  return circleX(fringePaperY(p)) + selectedOffset;
}

// Return the x coordinate corresponding to a y position on the circle
function circleX(y) {
  var h = window.innerHeight;
  var centerXoffset = -parameters.fringeRadius + global.fringeApparentWidth;
  return centerXoffset + Math.sqrt(Math.pow(parameters.fringeRadius, 2) - Math.pow(h/2 - y, 2));
}

// Compute Y coordinate for a paper on the fringe
function fringePaperY(p) {
  var index = global.visibleFringe.indexOf(p);
    
  // compute the sum of the height of the papers that are above the current one in the fringe
  var offset = global.scrollOffset;
  for(var i=0; i<index; i++){
    offset += fringePaperHeight(global.visibleFringe[i])
  }

  return offset + parameters.paperMaxRadius;
}

// Compute X coordinate for the "card" (the rectangle label) of a paper on the fringe
function fringePaperXCard(p){
    return fringePaperX(p)+parameters.paperMaxRadius+parameters.titleLeftMargin;
}

// Compute Y coordinate for the "card" (the rectangle label) of a paper on the fringe
function fringePaperYCard(p){
    return fringePaperY(p)-parameters.paperMaxRadius;
}

/* Compute how many papers can be displayed on the fringe at the minimum zoom level
* When zooming in, some of these papers will get pushed outside the view, but it's fine (nice animation).
* Takes into account some space at the bottom of the fringe to show an update button. */
function maxNumberOfVisiblePapers(){
    var availableHeight=window.innerHeight-parameters.fringeBottomMargin;
    return Math.floor(availableHeight/(2*parameters.paperMaxRadius));
}

function updateFringeButtonY(){
    return window.innerHeight-parameters.fringeBottomMargin;
}

// Compute the horizontal position of the updateFringe button
function updateFringeButtonX(){
    var h=window.innerHeight;
    var centerXoffset=-parameters.fringeRadius+global.fringeApparentWidth;
    return centerXoffset+Math.sqrt(Math.pow(parameters.fringeRadius,2)-Math.pow(h/2-updateFringeButtonY(),2))+parameters.paperMaxRadius+100;
}

// Compute a node radius for the appropriate citation count supplied, up to a certain max radius
// So far I'm interpolating with a sqrt, to emphasize the differences between 0 citations and a few
function radius(p, outer){

    var externalLarger = isExternalRelativelyLargerThanInternal(p);
    var representingExternal= (externalLarger == outer);
    var count=representingExternal? p.citation_count/parameters.externalCitationCountCutoff
     : p.citations.length/parameters.internalCitationCountCutoff;

    return Math.min(parameters.paperMaxRadius, parameters.paperMaxRadius*count);
}

function maxRadius(p){
    return Math.max(radius(p,true), radius(p,false));
}

// Return a random color from the set of tag colors
function randomColor(){
    var keys=Object.keys(colors.tags);
    return colors.tags[keys[ keys.length * Math.random() << 0]];
}

function colorFromUpvoters(n){
    if(n>5)
        return colors.tags[4];
    return colors.tags[n-1];  // between 1..4
}

function fringePaperOuterColor(p) {
    var base=colorFromUpvoters(p.upvoters);
    //console.log(global.papers[doi].citations.length/internalCitationCountCutoff + " " +global.papers[doi].citation_count/externalCitationCountCutoff)
    if(!isExternalRelativelyLargerThanInternal(p))
        return base;
    //console.log("outer "+shadeHexColor(base,shadingDifferenceInternalExternal))
    return shadeHexColor(base,colors.shadingDifferenceInternalExternal);
}

function fringePaperInnerColor(p) {
    var base=colorFromUpvoters(p.upvoters);
    if(isExternalRelativelyLargerThanInternal(p)){
        //console.log("internal "+base)       
        return base;
    }
    return shadeHexColor(base,colors.shadingDifferenceInternalExternal);
}

function isExternalRelativelyLargerThanInternal(p){
    return p.citation_count/parameters.externalCitationCountCutoff
    > p.citations.length/parameters.internalCitationCountCutoff;
}