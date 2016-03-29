'use strict';

var svg, tooltip, biHiSankey, path, defs, colorScale, highlightColorScale, isTransitioning;

var OPACITY = {
    NODE_DEFAULT: 0.9,
    NODE_FADED: 0.1,
    NODE_HIGHLIGHT: 0.8,
    LINK_DEFAULT: 0.6,
    LINK_FADED: 0.05,
    LINK_HIGHLIGHT: 0.9
  },
  TYPES = ["package", "class", "method", "constant", "interface"],
  TYPE_COLORS = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"],
  TYPE_HIGHLIGHT_COLORS = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494"],
  LINK_COLOR = "#b3b3b3",
  INFLOW_COLOR = "#2E86D1",
  OUTFLOW_COLOR = "#D63028",
  NODE_WIDTH = 36,
  COLLAPSER = {
    RADIUS: NODE_WIDTH / 2,
    SPACING: 2
  },
  OUTER_MARGIN = 10,
  MARGIN = {
    TOP: 2 * (COLLAPSER.RADIUS + OUTER_MARGIN),
    RIGHT: OUTER_MARGIN,
    BOTTOM: OUTER_MARGIN,
    LEFT: OUTER_MARGIN
  },
  TRANSITION_DURATION = 400,
  HEIGHT = 768 - MARGIN.TOP - MARGIN.BOTTOM,
  WIDTH = 1080 - MARGIN.LEFT - MARGIN.RIGHT,
  LAYOUT_INTERATIONS = 32,
  REFRESH_INTERVAL = 7000;

var formatNumber = function (d) {
  var numberFormat = d3.format(",.0f"); // zero decimal places
  return "£" + numberFormat(d);
},

formatFlow = function (d) {
  var flowFormat = d3.format(",.0f"); // zero decimal places with sign
  return "£" + flowFormat(Math.abs(d)) + (d < 0 ? " CR" : " DR");
},

// Used when temporarily disabling user interractions to allow animations to complete
disableUserInterractions = function (time) {
  isTransitioning = true;
  setTimeout(function(){
    isTransitioning = false;
  }, time);
},

hideTooltip = function () {
  return tooltip.transition()
    .duration(TRANSITION_DURATION)
    .style("opacity", 0);
},

showTooltip = function () {
  return tooltip
    .style("left", d3.event.pageX + "px")
    .style("top", d3.event.pageY + 15 + "px")
    .transition()
      .duration(TRANSITION_DURATION)
      .style("opacity", 1);
};

colorScale = d3.scale.ordinal().domain(TYPES).range(TYPE_COLORS),
highlightColorScale = d3.scale.ordinal().domain(TYPES).range(TYPE_HIGHLIGHT_COLORS),

svg = d3.select("#chart").append("svg")
        .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
        .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
      .append("g")
        .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")");

svg.append("g").attr("id", "links");
svg.append("g").attr("id", "nodes");
svg.append("g").attr("id", "collapsers");

tooltip = d3.select("#chart").append("div").attr("id", "tooltip");

tooltip.style("opacity", 0)
    .append("p")
      .attr("class", "value");

biHiSankey = d3.biHiSankey();

// Set the biHiSankey diagram properties
biHiSankey
  .nodeWidth(NODE_WIDTH)
  .nodeSpacing(10)
  .linkSpacing(4)
  .arrowheadScaleFactor(0.5) // Specifies that 0.5 of the link's stroke WIDTH should be allowed for the marker at the end of the link.
  .size([WIDTH, HEIGHT]);

path = biHiSankey.link().curvature(0.45);

defs = svg.append("defs");

defs.append("marker")
  .style("fill", LINK_COLOR)
  .attr("id", "arrowHead")
  .attr("viewBox", "0 0 6 10")
  .attr("refX", "1")
  .attr("refY", "5")
  .attr("markerUnits", "strokeWidth")
  .attr("markerWidth", "1")
  .attr("markerHeight", "1")
  .attr("orient", "auto")
  .append("path")
    .attr("d", "M 0 0 L 1 0 L 6 5 L 1 10 L 0 10 z");

defs.append("marker")
  .style("fill", OUTFLOW_COLOR)
  .attr("id", "arrowHeadInflow")
  .attr("viewBox", "0 0 6 10")
  .attr("refX", "1")
  .attr("refY", "5")
  .attr("markerUnits", "strokeWidth")
  .attr("markerWidth", "1")
  .attr("markerHeight", "1")
  .attr("orient", "auto")
  .append("path")
    .attr("d", "M 0 0 L 1 0 L 6 5 L 1 10 L 0 10 z");

defs.append("marker")
  .style("fill", INFLOW_COLOR)
  .attr("id", "arrowHeadOutlow")
  .attr("viewBox", "0 0 6 10")
  .attr("refX", "1")
  .attr("refY", "5")
  .attr("markerUnits", "strokeWidth")
  .attr("markerWidth", "1")
  .attr("markerHeight", "1")
  .attr("orient", "auto")
  .append("path")
    .attr("d", "M 0 0 L 1 0 L 6 5 L 1 10 L 0 10 z");

function update () {
  var link, linkEnter, node, nodeEnter, collapser, collapserEnter;

  function dragmove(node) {
    node.x = Math.max(0, Math.min(WIDTH - node.width, d3.event.x));
    node.y = Math.max(0, Math.min(HEIGHT - node.height, d3.event.y));
    d3.select(this).attr("transform", "translate(" + node.x + "," + node.y + ")");
    biHiSankey.relayout();
    svg.selectAll(".node").selectAll("rect").attr("height", function (d) { return d.height; });
    link.attr("d", path);
  }

  function containChildren(node) {
    node.children.forEach(function (child) {
      child.state = "contained";
      child.parent = this;
      child._parent = null;
      containChildren(child);
    }, node);
  }

  function expand(node) {
    node.state = "expanded";
    node.children.forEach(function (child) {
      child.state = "collapsed";
      child._parent = this;
      child.parent = null;
      containChildren(child);
    }, node);
  }

  function collapse(node) {
    node.state = "collapsed";
    containChildren(node);
  }

  function restoreLinksAndNodes() {
    link
      .style("stroke", LINK_COLOR)
      .style("marker-end", function () { return 'url(#arrowHead)'; })
      .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", OPACITY.LINK_DEFAULT);

    node
      .selectAll("rect")
        .style("fill", function (d) {
          d.color = colorScale(d.type.replace(/ .*/, ""));
          return d.color;
        })
        .style("stroke", function (d) {
          return d3.rgb(colorScale(d.type.replace(/ .*/, ""))).darker(0.1);
        })
        .style("fill-opacity", OPACITY.NODE_DEFAULT);

    node.filter(function (n) { return n.state === "collapsed"; })
      .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", OPACITY.NODE_DEFAULT);
  }

  function showHideChildren(node) {
    disableUserInterractions(2 * TRANSITION_DURATION);
    hideTooltip();
    if (node.state === "collapsed") { expand(node); }
    else { collapse(node); }

    biHiSankey.relayout();
    update();
    link.attr("d", path);
    restoreLinksAndNodes();
  }

  function highlightConnected(g) {
    link.filter(function (d) { return d.source === g; })
      .style("marker-end", function () { return 'url(#arrowHeadInflow)'; })
      .style("stroke", OUTFLOW_COLOR)
      .style("opacity", OPACITY.LINK_DEFAULT);

    link.filter(function (d) { return d.target === g; })
      .style("marker-end", function () { return 'url(#arrowHeadOutlow)'; })
      .style("stroke", INFLOW_COLOR)
      .style("opacity", OPACITY.LINK_DEFAULT);
  }

  function fadeUnconnected(g) {
    link.filter(function (d) { return d.source !== g && d.target !== g; })
      .style("marker-end", function () { return 'url(#arrowHead)'; })
      .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", OPACITY.LINK_FADED);

    node.filter(function (d) {
      return (d.name === g.name) ? false : !biHiSankey.connected(d, g);
    }).transition()
      .duration(TRANSITION_DURATION)
      .style("opacity", OPACITY.NODE_FADED);
  }

  link = svg.select("#links").selectAll("path.link")
    .data(biHiSankey.visibleLinks(), function (d) { return d.id; });

  link.transition()
    .duration(TRANSITION_DURATION)
    .style("stroke-WIDTH", function (d) { return Math.max(1, d.thickness); })
    .attr("d", path)
    .style("opacity", OPACITY.LINK_DEFAULT);


  link.exit().remove();


  linkEnter = link.enter().append("path")
    .attr("class", "link")
    .style("fill", "none");

  linkEnter.on('mouseenter', function (d) {
    if (!isTransitioning) {
      showTooltip().select(".value").text(function () {
        if (d.direction > 0) {
          return d.source.name + " calls/depends on " + d.target.name + "\n" + formatNumber(d.value);
        }
        return d.target.name + " calls/depends on " + d.source.name + "\n" + formatNumber(d.value);
      });

      d3.select(this)
        .style("stroke", LINK_COLOR)
        .transition()
          .duration(TRANSITION_DURATION / 2)
          .style("opacity", OPACITY.LINK_HIGHLIGHT);
    }
  });

  linkEnter.on('mouseleave', function () {
    if (!isTransitioning) {
      hideTooltip();

      d3.select(this)
        .style("stroke", LINK_COLOR)
        .transition()
          .duration(TRANSITION_DURATION / 2)
          .style("opacity", OPACITY.LINK_DEFAULT);
    }
  });

  linkEnter.sort(function (a, b) { return b.thickness - a.thickness; })
    .classed("leftToRight", function (d) {
      return d.direction > 0;
    })
    .classed("rightToLeft", function (d) {
      return d.direction < 0;
    })
    .style("marker-end", function () {
      return 'url(#arrowHead)';
    })
    .style("stroke", LINK_COLOR)
    .style("opacity", 0)
    .transition()
      .delay(TRANSITION_DURATION)
      .duration(TRANSITION_DURATION)
      .attr("d", path)
      .style("stroke-WIDTH", function (d) { return Math.max(1, d.thickness); })
      .style("opacity", OPACITY.LINK_DEFAULT);


  node = svg.select("#nodes").selectAll(".node")
      .data(biHiSankey.collapsedNodes(), function (d) { return d.id; });


  node.transition()
    .duration(TRANSITION_DURATION)
    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
    .style("opacity", OPACITY.NODE_DEFAULT)
    .select("rect")
      .style("fill", function (d) {
        d.color = colorScale(d.type.replace(/ .*/, ""));
        return d.color;
      })
      .style("stroke", function (d) { return d3.rgb(colorScale(d.type.replace(/ .*/, ""))).darker(0.1); })
      .style("stroke-WIDTH", "1px")
      .attr("height", function (d) { return d.height; })
      .attr("width", biHiSankey.nodeWidth());


  node.exit()
    .transition()
      .duration(TRANSITION_DURATION)
      .attr("transform", function (d) {
        var collapsedAncestor, endX, endY;
        collapsedAncestor = d.ancestors.filter(function (a) {
          return a.state === "collapsed";
        })[0];
        endX = collapsedAncestor ? collapsedAncestor.x : d.x;
        endY = collapsedAncestor ? collapsedAncestor.y : d.y;
        return "translate(" + endX + "," + endY + ")";
      })
      .remove();


  nodeEnter = node.enter().append("g").attr("class", "node");

  nodeEnter
    .attr("transform", function (d) {
      var startX = d._parent ? d._parent.x : d.x,
          startY = d._parent ? d._parent.y : d.y;
      return "translate(" + startX + "," + startY + ")";
    })
    .style("opacity", 1e-6)
    .transition()
      .duration(TRANSITION_DURATION)
      .style("opacity", OPACITY.NODE_DEFAULT)
      .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodeEnter.append("text");
  nodeEnter.append("rect")
    .style("fill", function (d) {
      d.color = colorScale(d.type.replace(/ .*/, ""));
      return d.color;
    })
    .style("stroke", function (d) {
      return d3.rgb(colorScale(d.type.replace(/ .*/, ""))).darker(0.1);
    })
    .style("stroke-WIDTH", "1px")
    .attr("height", function (d) { return d.height; })
    .attr("width", biHiSankey.nodeWidth());

  node.on("mouseenter", function (g) {
    if (!isTransitioning) {
      restoreLinksAndNodes();
      highlightConnected(g);
      fadeUnconnected(g);

      d3.select(this).select("rect")
        .style("fill", function (d) {
          d.color = d.netFlow > 0 ? INFLOW_COLOR : OUTFLOW_COLOR;
          return d.color;
        })
        .style("stroke", function (d) {
          return d3.rgb(d.color).darker(0.1);
        })
        .style("fill-opacity", OPACITY.LINK_DEFAULT);

      tooltip
        .style("left", g.x + MARGIN.LEFT + "px")
        .style("top", g.y + g.height + MARGIN.TOP + 15 + "px")
        .transition()
          .duration(TRANSITION_DURATION)
          .style("opacity", 1).select(".value")
          .text(function () {
            var additionalInstructions = g.children.length ? "\n(Double click to expand class)" : "";
            return "\nType: " + g.type +"\nFull Signature: " + g.full_name + additionalInstructions;
          });
    }
  });

  node.on("mouseleave", function () {
    if (!isTransitioning) {
      hideTooltip();
      restoreLinksAndNodes();
    }
  });

  node.filter(function (d) { return d.children.length; })
    .on("dblclick", showHideChildren);

  // allow nodes to be dragged to new positions
  node.call(d3.behavior.drag()
    .origin(function (d) { return d; })
    .on("dragstart", function () { this.parentNode.appendChild(this); })
    .on("drag", dragmove));

  // add in the text for the nodes
  node.filter(function (d) { return d.value !== 0; })
    .select("text")
      .attr("x", -6)
      .attr("y", function (d) { return d.height / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function (d) { return d.name; })
    .filter(function (d) { return d.x < WIDTH / 2; })
      .attr("x", 6 + biHiSankey.nodeWidth())
      .attr("text-anchor", "start");


  collapser = svg.select("#collapsers").selectAll(".collapser")
    .data(biHiSankey.expandedNodes(), function (d) { return d.id; });


  collapserEnter = collapser.enter().append("g").attr("class", "collapser");

  collapserEnter.append("circle")
    .attr("r", COLLAPSER.RADIUS)
    .style("fill", function (d) {
      d.color = colorScale(d.type.replace(/ .*/, ""));
      return d.color;
    });

  collapserEnter
    .style("opacity", OPACITY.NODE_DEFAULT)
    .attr("transform", function (d) {
      return "translate(" + (d.x + d.width / 2) + "," + (d.y + COLLAPSER.RADIUS) + ")";
    });

  collapserEnter.on("dblclick", showHideChildren);

  collapser.select("circle")
    .attr("r", COLLAPSER.RADIUS);

  collapser.transition()
    .delay(TRANSITION_DURATION)
    .duration(TRANSITION_DURATION)
    .attr("transform", function (d, i) {
      return "translate("
        + (COLLAPSER.RADIUS + i * 2 * (COLLAPSER.RADIUS + COLLAPSER.SPACING))
        + ","
        + (-COLLAPSER.RADIUS - OUTER_MARGIN)
        + ")";
    });

  collapser.on("mouseenter", function (g) {
    if (!isTransitioning) {
      showTooltip().select(".value")
        .text(function () {
          return g.name + "\n(Double click to collapse)";
        });

      var highlightColor = highlightColorScale(g.type.replace(/ .*/, ""));

      d3.select(this)
        .style("opacity", OPACITY.NODE_HIGHLIGHT)
        .select("circle")
          .style("fill", highlightColor);

      node.filter(function (d) {
        return d.ancestors.indexOf(g) >= 0;
      }).style("opacity", OPACITY.NODE_HIGHLIGHT)
        .select("rect")
          .style("fill", highlightColor);
    }
  });

  collapser.on("mouseleave", function (g) {
    if (!isTransitioning) {
      hideTooltip();
      d3.select(this)
        .style("opacity", OPACITY.NODE_DEFAULT)
        .select("circle")
          .style("fill", function (d) { return d.color; });

      node.filter(function (d) {
        return d.ancestors.indexOf(g) >= 0;
      }).style("opacity", OPACITY.NODE_DEFAULT)
        .select("rect")
          .style("fill", function (d) { return d.color; });
    }
  });

  collapser.exit().remove();

}

var exampleNodes = [{"type":"package","id":"DEFAULT","parent":null,"number":"0","name":"DEFAULT","full_name":"DEFAULT"}, {"type":"class","id":"StoreImpl","parent":"DEFAULT","number":"0","name":"StoreImpl","full_name":"StoreImpl"}, {"type":"method","id":"StoreImpl:<init>","parent":"StoreImpl","number":"0","name":"<init>","full_name":"StoreImpl:<init>"}, {"type":"method","id":"StoreImpl:addItemToCart","parent":"StoreImpl","number":"0","name":"addItemToCart","full_name":"StoreImpl:addItemToCart"}, {"type":"method","id":"StoreImpl:addItemToStore","parent":"StoreImpl","number":"0","name":"addItemToStore","full_name":"StoreImpl:addItemToStore"}, {"type":"method","id":"StoreImpl:getCartItems","parent":"StoreImpl","number":"0","name":"getCartItems","full_name":"StoreImpl:getCartItems"}, {"type":"method","id":"StoreImpl:getCartTotal","parent":"StoreImpl","number":"0","name":"getCartTotal","full_name":"StoreImpl:getCartTotal"}, {"type":"package","id":"java.util","parent":null,"number":"0","name":"java.util","full_name":"java.util"}, {"type":"class","id":"java.util.ArrayList","parent":"java.util","number":"0","name":".ArrayList","full_name":"java.util.ArrayList"}, {"type":"method","id":"java.util.ArrayList:<init>","parent":"java.util.ArrayList","number":"0","name":"<init>","full_name":"java.util.ArrayList:<init>"}, {"type":"package","id":"org.junit","parent":null,"number":"0","name":"org.junit","full_name":"org.junit"}, {"type":"class","id":"org.junit.Assert","parent":"org.junit","number":"0","name":".Assert","full_name":"org.junit.Assert"}, {"type":"method","id":"org.junit.Assert:assertEquals","parent":"org.junit.Assert","number":"0","name":"assertEquals","full_name":"org.junit.Assert:assertEquals"}, {"type":"package","id":"java.lang","parent":null,"number":"0","name":"java.lang","full_name":"java.lang"}, {"type":"class","id":"java.lang.Object","parent":"java.lang","number":"0","name":".Object","full_name":"java.lang.Object"}, {"type":"method","id":"java.lang.Object:<init>","parent":"java.lang.Object","number":"0","name":"<init>","full_name":"java.lang.Object:<init>"}, {"type":"class","id":"java.util.Map","parent":"java.util","number":"0","name":".Map","full_name":"java.util.Map"}, {"type":"method","id":"java.util.Map:containsKey","parent":"java.util.Map","number":"0","name":"containsKey","full_name":"java.util.Map:containsKey"}, {"type":"method","id":"java.util.Map:put","parent":"java.util.Map","number":"0","name":"put","full_name":"java.util.Map:put"}, {"type":"method","id":"java.util.Map:get","parent":"java.util.Map","number":"0","name":"get","full_name":"java.util.Map:get"}, {"type":"class","id":"LineItemImpl","parent":"DEFAULT","number":"0","name":"LineItemImpl","full_name":"LineItemImpl"}, {"type":"method","id":"LineItemImpl:<init>","parent":"LineItemImpl","number":"0","name":"<init>","full_name":"LineItemImpl:<init>"}, {"type":"class","id":"Store","parent":"DEFAULT","number":"0","name":"Store","full_name":"Store"}, {"type":"method","id":"Store:getCartItems","parent":"Store","number":"0","name":"getCartItems","full_name":"Store:getCartItems"}, {"type":"method","id":"Store:getCartTotal","parent":"Store","number":"0","name":"getCartTotal","full_name":"Store:getCartTotal"}, {"type":"method","id":"Store:addItemToCart","parent":"Store","number":"0","name":"addItemToCart","full_name":"Store:addItemToCart"}, {"type":"method","id":"Store:addItemToStore","parent":"Store","number":"0","name":"addItemToStore","full_name":"Store:addItemToStore"}, {"type":"class","id":"java.util.List","parent":"java.util","number":"0","name":".List","full_name":"java.util.List"}, {"type":"method","id":"java.util.List:add","parent":"java.util.List","number":"0","name":"add","full_name":"java.util.List:add"}, {"type":"method","id":"java.util.List:size","parent":"java.util.List","number":"0","name":"size","full_name":"java.util.List:size"}, {"type":"method","id":"java.util.List:toArray","parent":"java.util.List","number":"0","name":"toArray","full_name":"java.util.List:toArray"}, {"type":"method","id":"java.util.List:iterator","parent":"java.util.List","number":"0","name":"iterator","full_name":"java.util.List:iterator"}, {"type":"package","id":"java.io","parent":null,"number":"0","name":"java.io","full_name":"java.io"}, {"type":"class","id":"java.io.PrintStream","parent":"java.io","number":"0","name":".PrintStream","full_name":"java.io.PrintStream"}, {"type":"method","id":"java.io.PrintStream:println","parent":"java.io.PrintStream","number":"0","name":"println","full_name":"java.io.PrintStream:println"}, {"type":"class","id":"java.util.HashMap","parent":"java.util","number":"0","name":".HashMap","full_name":"java.util.HashMap"}, {"type":"method","id":"java.util.HashMap:<init>","parent":"java.util.HashMap","number":"0","name":"<init>","full_name":"java.util.HashMap:<init>"}, {"type":"class","id":"java.util.Iterator","parent":"java.util","number":"0","name":".Iterator","full_name":"java.util.Iterator"}, {"type":"method","id":"java.util.Iterator:next","parent":"java.util.Iterator","number":"0","name":"next","full_name":"java.util.Iterator:next"}, {"type":"method","id":"java.util.Iterator:hasNext","parent":"java.util.Iterator","number":"0","name":"hasNext","full_name":"java.util.Iterator:hasNext"}, {"type":"class","id":"java.lang.Double","parent":"java.lang","number":"0","name":".Double","full_name":"java.lang.Double"}, {"type":"method","id":"java.lang.Double:valueOf","parent":"java.lang.Double","number":"0","name":"valueOf","full_name":"java.lang.Double:valueOf"}, {"type":"method","id":"java.lang.Double:doubleValue","parent":"java.lang.Double","number":"0","name":"doubleValue","full_name":"java.lang.Double:doubleValue"}, {"type":"class","id":"TestStore","parent":"DEFAULT","number":"0","name":"TestStore","full_name":"TestStore"}, {"type":"method","id":"TestStore:<init>","parent":"TestStore","number":"0","name":"<init>","full_name":"TestStore:<init>"}, {"type":"method","id":"TestStore:testEmptyCart","parent":"TestStore","number":"0","name":"testEmptyCart","full_name":"TestStore:testEmptyCart"}, {"type":"method","id":"TestStore:testAddToCart_StoreEmpty","parent":"TestStore","number":"0","name":"testAddToCart_StoreEmpty","full_name":"TestStore:testAddToCart_StoreEmpty"}, {"type":"method","id":"TestStore:testAddToCart1","parent":"TestStore","number":"0","name":"testAddToCart1","full_name":"TestStore:testAddToCart1"}, {"type":"method","id":"TestStore:testAddToCart2","parent":"TestStore","number":"0","name":"testAddToCart2","full_name":"TestStore:testAddToCart2"}, {"type":"class","id":"java.lang.Exception","parent":"java.lang","number":"0","name":".Exception","full_name":"java.lang.Exception"}, {"type":"method","id":"java.lang.Exception:<init>","parent":"java.lang.Exception","number":"0","name":"<init>","full_name":"java.lang.Exception:<init>"}, {"type":"class","id":"ItemNotFoundException","parent":"DEFAULT","number":"0","name":"ItemNotFoundException","full_name":"ItemNotFoundException"}, {"type":"method","id":"ItemNotFoundException:<init>","parent":"ItemNotFoundException","number":"0","name":"<init>","full_name":"ItemNotFoundException:<init>"}, {"type":"class","id":"LineItem","parent":"DEFAULT","number":"0","name":"LineItem","full_name":"LineItem"}, {"type":"method","id":"LineItem:getName","parent":"LineItem","number":"0","name":"getName","full_name":"LineItem:getName"}, {"type":"method","id":"LineItem:getQuantity","parent":"LineItem","number":"0","name":"getQuantity","full_name":"LineItem:getQuantity"}]

var exampleLinks = [{"source":"StoreImpl:addItemToCart","target":"java.util.Map:containsKey","value":"1"}, {"source":"StoreImpl:addItemToCart","target":"java.io.PrintStream:println","value":"1"}, {"source":"StoreImpl:addItemToCart","target":"LineItemImpl:<init>","value":"1"}, {"source":"StoreImpl:addItemToCart","target":"java.util.List:add","value":"1"}, {"source":"LineItemImpl:<init>","target":"java.lang.Object:<init>","value":"1"}, {"source":"StoreImpl:<init>","target":"java.lang.Object:<init>","value":"1"}, {"source":"StoreImpl:<init>","target":"java.util.HashMap:<init>","value":"1"}, {"source":"StoreImpl:<init>","target":"java.util.ArrayList:<init>","value":"1"}, {"source":"TestStore:testEmptyCart","target":"StoreImpl:<init>","value":"1"}, {"source":"TestStore:testEmptyCart","target":"Store:getCartItems","value":"1"}, {"source":"TestStore:testEmptyCart","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testEmptyCart","target":"Store:getCartTotal","value":"1"}, {"source":"TestStore:testEmptyCart","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"StoreImpl:addItemToStore","target":"java.lang.Double:valueOf","value":"1"}, {"source":"StoreImpl:addItemToStore","target":"java.util.Map:put","value":"1"}, {"source":"StoreImpl:getCartItems","target":"java.util.List:size","value":"1"}, {"source":"StoreImpl:getCartItems","target":"java.util.List:toArray","value":"1"}, {"source":"TestStore:testAddToCart1","target":"StoreImpl:<init>","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:getCartItems","value":"1"}, {"source":"TestStore:testAddToCart1","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testAddToCart1","target":"Store:getCartTotal","value":"1"}, {"source":"TestStore:testAddToCart1","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testAddToCart2","target":"StoreImpl:<init>","value":"1"}, {"source":"TestStore:testAddToCart2","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart2","target":"Store:addItemToStore","value":"1"}, {"source":"TestStore:testAddToCart2","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart2","target":"Store:getCartItems","value":"1"}, {"source":"TestStore:testAddToCart2","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testAddToCart2","target":"Store:getCartTotal","value":"1"}, {"source":"TestStore:testAddToCart2","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"StoreImpl:<init>","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"Store:addItemToCart","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"Store:getCartItems","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"Store:getCartTotal","value":"1"}, {"source":"TestStore:testAddToCart_StoreEmpty","target":"org.junit.Assert:assertEquals","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"java.util.List:iterator","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"java.util.Iterator:next","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"LineItem:getName","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"java.util.Map:get","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"java.lang.Double:doubleValue","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"LineItem:getQuantity","value":"1"}, {"source":"StoreImpl:getCartTotal","target":"java.util.Iterator:hasNext","value":"1"}, {"source":"TestStore:<init>","target":"java.lang.Object:<init>","value":"1"}, {"source":"ItemNotFoundException:<init>","target":"java.lang.Exception:<init>","value":"1"}]

biHiSankey
  .nodes(exampleNodes)
  .links(exampleLinks)
  .initializeNodes(function (node) {
    node.state = node.parent ? "contained" : "collapsed";
  })
  .layout(LAYOUT_INTERATIONS);

disableUserInterractions(2 * TRANSITION_DURATION);

update();