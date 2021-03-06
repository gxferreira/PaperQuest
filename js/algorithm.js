/* 
* Compute the fringe and the relevance scores 
*/

var algorithm = (function(){

// Initialize the relevance scores, then insert papers from Core, toRead and Selected
function generateFringe(){
	P.all(initializeConnectivityScore);
  P.interesting(initialUpdateRelevanceScores);
  computeMinMaxConnectivityScore();
}

// Insert the papers that have just been selected, and removes the ones that have been deselected (if any)
function updateFringe(){
	for(var doi in userData.queue){
		updateRelevanceScores(userData.queue[doi]);
	}
	userData.queue=[];

	computeMinMaxConnectivityScore();
}

function initialUpdateRelevanceScores(e) {
	updateRelevanceScores2(e,true);
}

function updateRelevanceScores(e) {
	updateRelevanceScores2(e,false);
}

/////////////////////	Private	functions 	////////////////////////////

function initializeConnectivityScore(p) {
	p.connectivity = 0;
}

// Update the score for all connected papers when inserting/removing a paper
// takes as input an "event" = {doi, from,  to}
function updateRelevanceScores2(e, initial){

  var pSource;
  if(initial){
  	console.log("inserting "+e.doi);
  	pSource=e;
  }
  else {
    console.log("consuming " + e.doi + " from " + e.from + " to " + e.to)
	pSource=P(e.doi);
  }

  // update both (internal) references and citations of this paper
  pSource.internalReferences().concat(pSource.internalCitations())
    .forEach(function(pTarget) {
      // if paper has never been seen before, initialize it and add it to the fringe
      if (pTarget.isNew) {
        pTarget.isNew = false;
        // Added this check because we're hard-coding initial seed
        // papers to the core.  Eventually this check should be
        // removed.
        if (!pTarget.core) {
          pTarget.fringe = true;
        }
        userData.papers[pTarget.doi] = pTarget;
        initializeConnectivityScore(pTarget);
      }

      // update relevance score of this paper
      if(initial)
      	initialUpdatePaper(pTarget, pSource.weightIndex());
      else
      	updatePaper2(pTarget, e.from, e.to);

      // remove the paper if it's no longer linked by interesting papers
      if (pTarget.connectivity <= 0) {
        pTarget.isNew = true;
        delete userData.papers[pTarget.doi];
      }
    });
}


///////////////		helper functions	/////////////////////////////

function initialUpdatePaper(pTarget, pSourceTo){
	pTarget.connectivity += parameters.weights[pSourceTo];
}

// update the target's score based on the source's paper from and to
function updatePaper2(pTarget, pSourceFrom, pSourceTo){
	pTarget.connectivity -= parameters.weights[pSourceFrom];
	pTarget.connectivity += parameters.weights[pSourceTo];
}

// Fun fact: the colors look exactly the same if we compute min and max from global.visibleFringe instead of P.fringe()...
function computeMinMaxConnectivityScore(){
	global.maxConnectivityScore=d3.max(P.fringe(), function(p) { return p.getTotalconnectivity(); })
	global.minConnectivityScore=d3.min(P.fringe(), function(p) { return p.getTotalconnectivity(); })
	// console.log("minConnectivityScore: "+global.minConnectivityScore+"  maxConnectivityScore: "+global.maxConnectivityScore)
}

///////////////     Define public static methods, and return    /////////////
	
	var algorithm={};
	algorithm.generateFringe=generateFringe;
	algorithm.updateFringe=updateFringe;
	return algorithm;

})();
