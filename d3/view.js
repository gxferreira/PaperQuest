 /*
* Creates, draw and specify interaction for the Fringe
*/

// To create a class with static methods (basically, a namespace)
var view = (function () {

var leftViewClipPath;
var menuTimeout = null;
var fringeSliderToggle = true;

// Except for the (static) background elements, everything is computed on-the-fly
function initializeVis(){
  createStaticElements();
  updateVis(0);   //don't animate at creation
}

// Update the vis, with different animation speeds. If animate=0, no animation.
function updateVis(animate){
  computeVisibleFringe();
  drawStaticElements(animate);
  manageDynamicElements(animate);
  bindListeners();
}

// Update fringe and animate the change
function updateFringe() {
  // Manage the menu
  if (menuTimeout) {
    window.clearTimeout(menuTimeout);
  }
  hideMenu();

  algorithm.updateFringe();
  updateVis(1);
  // the updateFringe button becomes useless until new papers are (de)selected
  d3.select("#updateFringe").attr("disabled","disabled");
}

//////////////////  Drawing functions   ///////////////////////

// Given the current windows dimensions, which papers can be displayed on the Fringe?
function computeVisibleFringe(){
  global.visibleFringe = P.sortedFringe().slice(0,maxNumberOfVisiblePapers());
}

function manageDynamicElements(animate){
    return view.manageDynamicElements(animate);
}

// Create some svg elements, once and for all
function createStaticElements(){
  
/*  // white pannel at the bottom of the fringe  -- probably useless
  svg.append("rect")
  .attr("id","bottomPane")*/

  // toread
  svg.append("circle")
    .attr("id","toread")

  var arc = d3.svg.arc()
    .innerRadius(parameters.fringeRadius - 2)
    .outerRadius(parameters.fringeRadius + 2)
    .startAngle(0)
    .endAngle(3);

  svg.append("g")
    .attr("id", "fringe-separator")
    .append("path")
    .attr("d", arc);

  // core
  svg.append("rect")
    .attr("id","core");

  // controls
  d3.select("body").append("span")
    .attr("id", "fringe-slider-toggle")
    .attr("onclick", "view.toggleFringeSlider()")
    .classed("icon-tab", true)

  d3.select("body").append("button")
    .attr("id","updateFringe")
    .attr("class","visControl")
    .text("Update fringe")
    .attr("onclick","view.updateFringe()")
    .attr("disabled","disabled");   // there's nothing to update when the fringe has just been created

    d3.select("body").append("label")
    .attr("id","updateFringeAutomatically")
    .attr("class","visControl")
    .append("input")
    .attr("type","checkbox")
    .attr("onclick","global.updateAutomatically=!global.updateAutomatically; view.updateFringe()")
    d3.select("#updateFringeAutomatically")
    .append("span")
    .text(" automatically")

  svg.append("rect")
    .attr("id", "core-separator");

  // clipping path for the left side views
  leftViewClipPath = svg.append("clipPath")
    .attr("id", "left-views")
    .append("circle");

  svg.append("g")
    .attr("id", "core-papers");

  svg.append("g")
    .attr("id", "toread-papers");

  svg.append("g")
    .attr("id","fringe-papers");
}

// draw the static elements at their appropriate positions
function drawStaticElements(animate){

    // Create one transition and apply to all the elements
    t0=function(elem){
      return elem.transition().duration(parameters.fringePapersPositionTransitionDuration[animate])
        .ease(parameters.fringePapersTransitionEasing)
    }

/*    d3.select("#bottomPane")
    .style("fill","white")
    .attr("x", circleX(updateFringeButtonY())+parameters.paperMaxRadius)
    .attr("y", updateFringeButtonY())
    .attr("width", window.innerWidth)
    .attr("height", parameters.fringeBottomMargin)*/

    t0(d3.select("#updateFringe"))
    .style("top",updateFringeButtonY()+"px")
    .style("left",updateFringeButtonX()+"px")

    t0(d3.select("#updateFringeAutomatically"))
    .style("top",updateFringeButtonY()+8+"px")
    .style("left",updateFringeButtonX()+150+"px")

    // toread
    t0(d3.select("#toread"))
    .attr("cx", -parameters.fringeRadius + global.fringeApparentWidth)
    .attr("cy","50%")
    .attr("r",parameters.fringeRadius)
    .style("fill",colors.toread)
    .style("stroke",colors.toreadBorder)
    .style("stroke-width",2)

  t0(leftViewClipPath)
    .attr("cx",-parameters.fringeRadius + global.fringeApparentWidth)
    .attr("cy","50%")
    .attr("r",parameters.fringeRadius);

  // core
  var core = t0(d3.select("#core"))
    .attr("x", 0)
    .attr("y", global.toReadHeight)
    .attr("width", global.fringeApparentWidth)
    .attr("height", window.innerHeight - global.toReadHeight)
    .attr("clip-path", "url(#left-views)")
    .style("fill",colors.core);

  // coreSeparator (no transition)
  var dragCore = d3.behavior.drag()
    .on("drag", function(d, i) {
      global.toReadHeight = d3.event.y;
      d3.select(this).attr("y", d3.event.y);
      core.attr("y", global.toReadHeight);
      core.attr("height", window.innerHeight - global.toReadHeight);
      updateVis(0);
    });

  d3.select("#core-separator")
    .attr("x", 0)
    .attr("y", global.toReadHeight)
    .attr("width", window.innerWidth)
    .attr("height", 5)
    .attr("clip-path", "url(#left-views)")
    .style("fill", colors.coreDivisor)
    .style("stroke", colors.coreDivisor)
    .style("fill-opacity", 0.5)
    .call(dragCore);

  // fringeSeparator
  t0(d3.select("#fringe-separator"))
    .attr("transform", "translate(" + (-parameters.fringeRadius + global.fringeApparentWidth) + "," + (window.innerHeight / 2) + ")")
    .style("fill", colors.toreadBorder)

  var dragFringe = d3.behavior.drag()
    .on("drag", function(d, i) {
      var x = d3.event.x;
      // Clamp new apparent width;
      x = (x < parameters.fringeApparentWidthMin) ? parameters.fringeApparentWidthMin : x;
      x = (x > (window.innerWidth - d3.select("#sidebar")[0][0].offsetWidth - parameters.fringeRightPadding)) ? (window.innerWidth - d3.select("#sidebar")[0][0].offsetWidth - parameters.fringeRightPadding) : x;
      global.fringeApparentWidth = x;
      updateVis(0);
    });

    d3.select("#fringe-separator")
    .call(dragFringe);
}


// Specify interaction
function bindListeners(){

/*  ---- Kinda deprecated - the glyph shadow highlighting is done below... 
    d3.selectAll(".shadowOnHover")
    .on("mouseover",function() {
        d3.select(this).attr("filter","url(#drop-shadow)")
    })
    .on("mouseleave",function() {
        d3.select(this).attr("filter","none")
    })*/


  ////////////////////////////////////////////////////////////////////////////////
  // Listeners for the papers contextual menu
  d3.select("#paper-menu")
    .on("mouseenter", function() {
      if (menuTimeout) {
        window.clearTimeout(menuTimeout);  // Don't hide the menu if it's being used
      }

      // Keep the node highlighted while using the menu.  Have to use
      // document.getElementById because the id (the DOI) contains
      // dots and d3 chokes
      var selection = d3.select(document.getElementById(global.activePaper.doi)).select(".zoom0");
      selection.select(".internalCitationsCircle").attr("filter","url(#drop-shadow)")
      selection.select(".externalCitationsCircle").attr("filter","url(#drop-shadow)")
      selection.select(".title").classed("highlighted",true)    // add class
      selection.select(".card")
        .classed("highlighted",true)
        .attr("width", function(p) { return d3.select(this.parentNode).select(".title").node().getComputedTextLength();} )
    })

    .on("mouseleave", function() {
      menuTimeout = window.setTimeout(function() {
        hideMenu();
      }, 150);  // Set a smaller timeout to hide the menu

      // Remove highlighting from the node.  We use
      // document.getElementById because the id (the DOI) has dots and
      // d3 chokes.
      if (global.activePaper) {
        removeHighlighting(global.activePaper);
      }
    });

  d3.selectAll("#paper-menu .click")
    .on("mousedown", function() {
      d3.select(this).classed("active", true);
    })
    .on("mouseup", function() {
      d3.select(this).classed("active", false);
    });

  d3.selectAll("#paper-menu .toggle")
    .on("mousedown", function() {
      // TODO: Temporary toggle mockup.  Eventually these should be
      // mapped to paper state, particularly the starred icon.
      var selection = d3.select(this);
      if (this.className.indexOf("active") > -1) {
        selection.classed("active", false);
      } else {
        selection.classed("active", true);
      }
    });

  // Move a paper to the to-read list
  d3.select("#menu-toread")
    .on("mousedown", function() {
      d3.select(this).classed("active", true);
    })
    .on("mouseup", function() {
      d3.select(this).classed("active", false);
      global.activePaper.moveTo("toread");
      if (!global.activePaper.selected) {
        // New interesting paper, fringe should recompute.
        userData.addNewInteresting(global.activePaper);
        // Enable or disable the updateFringe button.
        updateUpdateFringeButton();
      }
      global.activePaper.selected = false;
      
      removeHighlighting(global.activePaper);
      hideMenu();
      doAutomaticFringeUpdate();
      updateVis(2);
    });

  // Move a paper to the fringe
  d3.select("#menu-tofringe")
    .on("mousedown", function() {
      d3.select(this).classed("active", true);
    })
    .on("mouseup", function() {
      d3.select(this).classed("active", false);
      global.activePaper.moveTo("fringe");
      // Return the active paper to the fringe as an unselected paper, should recompute the fringe.
      userData.removeInteresting(global.activePaper);
      // Enable or disable the updateFringe button.
      updateUpdateFringeButton();
      global.activePaper.selected = false;
      removeHighlighting(global.activePaper);
      hideMenu();
      doAutomaticFringeUpdate();
      updateVis(2);
    });

  // Move a paper to the core
  d3.select("#menu-tocore")
    .on("mousedown", function() {
      d3.select(this).classed("active", true);
    })
    .on("mouseup", function() {
      d3.select(this).classed("active", false);
      if (global.activePaper.fringe && !global.activePaper.selected) {
        // Add to the interesting papers and recompute the fringe
        userData.addNewInteresting(global.activePaper);
        // Enable or disable the updateFringe button.
        updateUpdateFringeButton();
      }
      global.activePaper.moveTo("core");
      global.activePaper.selected = false;
      removeHighlighting(global.activePaper);
      hideMenu();
      doAutomaticFringeUpdate();
      updateVis(2);
    });

  // Show/hide paper menus
  d3.selectAll("g.paper")
    .on("mouseover", function() {
      var p = P(this.id);

      if (menuTimeout) {
        window.clearTimeout(menuTimeout);
        menuTimeout = null;
        hideMenu();
      }

      // Record interactive paper
      global.activePaper = p;
      showMenu(p);
    })

    .on("mouseleave", function() {
      // We don't remove the menu right away, so the user has time to get to it.
      menuTimeout = window.setTimeout(function() {
        hideMenu();
      }, 1000);
    });



  ////////////////////////////////////////////////////////////////////////////////
  // Listeners for papers in the fringe

  // highlight nodes and titles
  d3.selectAll(".zoom0")
    .on("mouseover",function() {
      var selection = d3.select(this);
      selection.select(".internalCitationsCircle").attr("filter","url(#drop-shadow)")
      selection.select(".externalCitationsCircle").attr("filter","url(#drop-shadow)")
      selection.select(".title").classed("highlighted",true)    // add class
      selection.select(".card")
        .classed("highlighted",true)
        .attr("width", function(p) { return d3.select(this.parentNode).select(".title").node().getComputedTextLength();} )
    })

    .on("mouseleave",function() {
      // remove shadow
      d3.select(this).select(".internalCitationsCircle").attr("filter","none")
      d3.select(this).select(".externalCitationsCircle").attr("filter","none")

      // keep the selected elements highlighted
      var nonSelectedOnly=d3.select(this)
        .filter(function(){ 
          // this is ugly as hell, but I don't know how to access d cleanly...
          var res;
          d3.select(this).each(function(p) {
            res=!p.selected;
          })
            return res;
        })
      nonSelectedOnly.select(".title").classed("highlighted",false)     // remove class
      nonSelectedOnly.select(".card").classed("highlighted",false)     // remove class
    })

    // clicking papers on the fringe translates them to the left
    .on("mousedown",function() {
      var paper=d3.select(this);
      paper.each(function(p) {
        // Clicking on papers when not in the fringe does nothing.
        if (!p.fringe) {
          return;
        }

        p.selected = !p.selected;

        // Add or remove the paper to the list that will update the fringe
        if(p.selected)
          userData.addNewInteresting(p);
        else
          userData.removeInteresting(p);

        // Enable or disable the updateFringe button, if new papers have been (de)selected
        updateUpdateFringeButton();

        // Update the vis to move the selected papers left or right
        // (using different animation speeds depending on the zoom level, just because it's pretty)
        switch(global.zoom){
        case 0:
          updateVis(4);
          break;
        case 1:
          updateVis(3);
          break;
        case 2:
          updateVis(2);
          break;

        }
      });

      // Reposition the menu
      showMenu(global.activePaper);
    })

    // After (de)selecting a paper, update the fringe if updateAutomatically is true
    .on("mouseup",function(){
      var paper=d3.select(this);
      paper.each(function(p) {
        if (p.fringe) {   // Only do automatic updating when click fringe papers.
          doAutomaticFringeUpdate();
        }
      });
    })

    // detect zoom in and out
    svg.on("wheel",function(){

        // Do nothing if it is a browser zoom (ctrl+wheel)
        if(d3.event.ctrlKey)
            return;

        // compute the new zoom level
        if(d3.event.deltaY>0){
            if(global.zoom<2)
                global.zoom++;
            else
                global.scrollOffset-=parameters.amountOfVerticalScrolling;
            // if the user keeps scrolling down, this will be interpreted as a scrolling down
        }
        else{
            if(global.scrollOffset<0)
                global.scrollOffset+=parameters.amountOfVerticalScrolling;
            else{
                if(global.zoom>0)
                    global.zoom--;
            }
        }
        console.log("zoom: "+global.zoom)

        // Update the view (quickly), to take into account the new heights of the selected papers
        view.updateVis(2);
    })

}


function showMenu(p) {
  buildMenu(p);
  
  d3.select("#paper-menu")
    .style("left", (p.x - parameters.menuOffset) + "px")
    .style("top", (p.y - parameters.paperMaxRadius) + "px")
    .style("display", "block")
    .transition()
    .duration(200)
    .style("opacity", 1)
}

function hideMenu() {
  // Clear interactive paper
  global.activePaper = null;
  d3.select("#paper-menu")
    .transition()
    .duration(150)
    .style("opacity", 0)
    .each("end", function() { d3.select(this).style("display", "none"); });
  // TODO: This eventually won't be necessary, the buttons should be
  // mapped to the paper's state.
  // Clear all active buttons
  d3.selectAll("#paper-menu .toggle").each(function() {
    d3.select(this).classed("active", false);
  });
}

function buildMenu(p) {
  var menu = d3.select("#paper-menu");
  function hideOption(id) { menu.select("#" + id).style("display", "none"); }
  function showOption(id) { menu.select("#" + id).style("display", "block"); }

  ["menu-remove", "menu-star", "menu-tocore", "menu-tofringe", "menu-toread", "menu-links", "menu-expand"].forEach(hideOption);

  if (p.core) {
  } else if(p.toread) {
    ["menu-tofringe", "menu-tocore"].forEach(showOption);
  } else if (p.fringe) {
    ["menu-toread", "menu-tocore"].forEach(showOption);
  }
}

function removeHighlighting(p) {
  // Only remove highlighting of non-selected papers.
  if (!p.selected) {
    var selection = d3.select(document.getElementById(p.doi)).select(".zoom0");
    selection.select(".internalCitationsCircle").attr("filter","none")
    selection.select(".externalCitationsCircle").attr("filter","none")
    selection.select(".title").classed("highlighted", false);
    selection.select(".card").classed("highlighted", false);
  }
}

function updateUpdateFringeButton() {
  if((userData.newInterestingPapers.length>0 || userData.newUninterestingPapers.length>0) && !global.updateAutomatically)
    d3.select("#updateFringe").attr("disabled",null);
  else
    d3.select("#updateFringe").attr("disabled","disabled");
}

function doAutomaticFringeUpdate() {
  if(!global.updateAutomatically)
    return;

  // We have to make sure that the animation for "selected" is finished   
  if(!global.animationRunning)
    updateFringe();
  else    
    global.animationWaiting = true; // otherwise we wait for it to end
}


function toggleFringeSlider() {
  fringeSliderToggle = !fringeSliderToggle;
  if (fringeSliderToggle) {
    global.fringeApparentWidth = (window.innerWidth - d3.select("#sidebar")[0][0].offsetWidth - parameters.fringeRightPadding);
  } else {
    global.fringeApparentWidth = parameters.fringeApparentWidthMin;
  }
  updateVis(1);
}


///////////////     Define public static methods, and return    /////////////

var view = {};

view.initializeVis=initializeVis;
view.updateVis=updateVis;
view.updateFringe=updateFringe;
view.toggleFringeSlider = toggleFringeSlider;

return view;

})();
