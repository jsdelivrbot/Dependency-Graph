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
  HEIGHT = 1080 - MARGIN.TOP - MARGIN.BOTTOM,
  WIDTH = 1880 - MARGIN.LEFT - MARGIN.RIGHT,
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
          return d.source.name + " calls/depends on " + d.target.name;
        }
        return d.target.name + " calls/depends on " + d.source.name;
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

var exampleNodes = [{"type":"class","id":"retrofit2.OkHttpCall","parent":null,"number":"0","name":".OkHttpCall","full_name":"retrofit2.OkHttpCall"}, {"type":"class","id":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody$1","parent":null,"number":"0","name":".OkHttpCall$ExceptionCatchingRequestBody$1","full_name":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody$1"}, {"type":"class","id":"retrofit2.OkHttpCall$NoContentResponseBody","parent":null,"number":"0","name":".OkHttpCall$NoContentResponseBody","full_name":"retrofit2.OkHttpCall$NoContentResponseBody"}, {"type":"class","id":"retrofit2.Retrofit$Builder","parent":null,"number":"0","name":".Retrofit$Builder","full_name":"retrofit2.Retrofit$Builder"}, {"type":"class","id":"retrofit2.Retrofit","parent":null,"number":"0","name":".Retrofit","full_name":"retrofit2.Retrofit"}, {"type":"class","id":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody","parent":null,"number":"0","name":".OkHttpCall$ExceptionCatchingRequestBody","full_name":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody"}, {"type":"class","id":"retrofit2.ServiceMethod$Builder","parent":null,"number":"0","name":".ServiceMethod$Builder","full_name":"retrofit2.ServiceMethod$Builder"}, {"type":"class","id":"retrofit2.ServiceMethod","parent":null,"number":"0","name":".ServiceMethod","full_name":"retrofit2.ServiceMethod"}, {"type":"class","id":"retrofit2.OkHttpCall$1","parent":null,"number":"0","name":".OkHttpCall$1","full_name":"retrofit2.OkHttpCall$1"}, {"type":"class","id":"retrofit2.Retrofit$1","parent":null,"number":"0","name":".Retrofit$1","full_name":"retrofit2.Retrofit$1"}, {"type":"class","id":"retrofit2.BuiltInConverters","parent":null,"number":"0","name":".BuiltInConverters","full_name":"retrofit2.BuiltInConverters"}, {"type":"class","id":"retrofit2.BuiltInConverters$ToStringConverter","parent":null,"number":"0","name":".BuiltInConverters$ToStringConverter","full_name":"retrofit2.BuiltInConverters$ToStringConverter"}, {"type":"class","id":"retrofit2.BuiltInConverters$VoidResponseBodyConverter","parent":null,"number":"0","name":".BuiltInConverters$VoidResponseBodyConverter","full_name":"retrofit2.BuiltInConverters$VoidResponseBodyConverter"}, {"type":"class","id":"retrofit2.BuiltInConverters$StreamingResponseBodyConverter","parent":null,"number":"0","name":".BuiltInConverters$StreamingResponseBodyConverter","full_name":"retrofit2.BuiltInConverters$StreamingResponseBodyConverter"}, {"type":"class","id":"retrofit2.BuiltInConverters$RequestBodyConverter","parent":null,"number":"0","name":".BuiltInConverters$RequestBodyConverter","full_name":"retrofit2.BuiltInConverters$RequestBodyConverter"}, {"type":"class","id":"retrofit2.BuiltInConverters$StringConverter","parent":null,"number":"0","name":".BuiltInConverters$StringConverter","full_name":"retrofit2.BuiltInConverters$StringConverter"}, {"type":"class","id":"retrofit2.BuiltInConverters$BufferingResponseBodyConverter","parent":null,"number":"0","name":".BuiltInConverters$BufferingResponseBodyConverter","full_name":"retrofit2.BuiltInConverters$BufferingResponseBodyConverter"}, {"type":"class","id":"retrofit2.Platform$Android$MainThreadExecutor","parent":null,"number":"0","name":".Platform$Android$MainThreadExecutor","full_name":"retrofit2.Platform$Android$MainThreadExecutor"}, {"type":"class","id":"retrofit2.Platform$IOS$MainThreadExecutor","parent":null,"number":"0","name":".Platform$IOS$MainThreadExecutor","full_name":"retrofit2.Platform$IOS$MainThreadExecutor"}, {"type":"class","id":"retrofit2.Platform$IOS","parent":null,"number":"0","name":".Platform$IOS","full_name":"retrofit2.Platform$IOS"}, {"type":"class","id":"retrofit2.Platform","parent":null,"number":"0","name":".Platform","full_name":"retrofit2.Platform"}, {"type":"class","id":"retrofit2.Platform$Java8","parent":null,"number":"0","name":".Platform$Java8","full_name":"retrofit2.Platform$Java8"}, {"type":"class","id":"retrofit2.Platform$Android","parent":null,"number":"0","name":".Platform$Android","full_name":"retrofit2.Platform$Android"}, {"type":"class","id":"retrofit2.DefaultCallAdapterFactory","parent":null,"number":"0","name":".DefaultCallAdapterFactory","full_name":"retrofit2.DefaultCallAdapterFactory"}, {"type":"class","id":"retrofit2.DefaultCallAdapterFactory$1","parent":null,"number":"0","name":".DefaultCallAdapterFactory$1","full_name":"retrofit2.DefaultCallAdapterFactory$1"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory","parent":null,"number":"0","name":".ExecutorCallAdapterFactory","full_name":"retrofit2.ExecutorCallAdapterFactory"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory$1","parent":null,"number":"0","name":".ExecutorCallAdapterFactory$1","full_name":"retrofit2.ExecutorCallAdapterFactory$1"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$1","parent":null,"number":"0","name":".ExecutorCallAdapterFactory$ExecutorCallbackCall$1$1","full_name":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$1"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall","parent":null,"number":"0","name":".ExecutorCallAdapterFactory$ExecutorCallbackCall","full_name":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$2","parent":null,"number":"0","name":".ExecutorCallAdapterFactory$ExecutorCallbackCall$1$2","full_name":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$2"}, {"type":"class","id":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1","parent":null,"number":"0","name":".ExecutorCallAdapterFactory$ExecutorCallbackCall$1","full_name":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1"}, {"type":"class","id":"retrofit2.CallAdapter$Factory","parent":null,"number":"0","name":".CallAdapter$Factory","full_name":"retrofit2.CallAdapter$Factory"}, {"type":"class","id":"retrofit2.CallAdapter","parent":null,"number":"0","name":".CallAdapter","full_name":"retrofit2.CallAdapter"}, {"type":"class","id":"retrofit2.ParameterHandler$Part","parent":null,"number":"0","name":".ParameterHandler$Part","full_name":"retrofit2.ParameterHandler$Part"}, {"type":"class","id":"retrofit2.ParameterHandler$FieldMap","parent":null,"number":"0","name":".ParameterHandler$FieldMap","full_name":"retrofit2.ParameterHandler$FieldMap"}, {"type":"class","id":"retrofit2.ParameterHandler$PartMap","parent":null,"number":"0","name":".ParameterHandler$PartMap","full_name":"retrofit2.ParameterHandler$PartMap"}, {"type":"class","id":"retrofit2.ParameterHandler$RawPart","parent":null,"number":"0","name":".ParameterHandler$RawPart","full_name":"retrofit2.ParameterHandler$RawPart"}, {"type":"class","id":"retrofit2.ParameterHandler$RelativeUrl","parent":null,"number":"0","name":".ParameterHandler$RelativeUrl","full_name":"retrofit2.ParameterHandler$RelativeUrl"}, {"type":"class","id":"retrofit2.ParameterHandler$Field","parent":null,"number":"0","name":".ParameterHandler$Field","full_name":"retrofit2.ParameterHandler$Field"}, {"type":"class","id":"retrofit2.ParameterHandler$1","parent":null,"number":"0","name":".ParameterHandler$1","full_name":"retrofit2.ParameterHandler$1"}, {"type":"class","id":"retrofit2.ParameterHandler$2","parent":null,"number":"0","name":".ParameterHandler$2","full_name":"retrofit2.ParameterHandler$2"}, {"type":"class","id":"retrofit2.ParameterHandler$Query","parent":null,"number":"0","name":".ParameterHandler$Query","full_name":"retrofit2.ParameterHandler$Query"}, {"type":"class","id":"retrofit2.ParameterHandler$QueryMap","parent":null,"number":"0","name":".ParameterHandler$QueryMap","full_name":"retrofit2.ParameterHandler$QueryMap"}, {"type":"class","id":"retrofit2.ParameterHandler$Path","parent":null,"number":"0","name":".ParameterHandler$Path","full_name":"retrofit2.ParameterHandler$Path"}, {"type":"class","id":"retrofit2.ParameterHandler$Body","parent":null,"number":"0","name":".ParameterHandler$Body","full_name":"retrofit2.ParameterHandler$Body"}, {"type":"class","id":"retrofit2.ParameterHandler","parent":null,"number":"0","name":".ParameterHandler","full_name":"retrofit2.ParameterHandler"}, {"type":"class","id":"retrofit2.ParameterHandler$Header","parent":null,"number":"0","name":".ParameterHandler$Header","full_name":"retrofit2.ParameterHandler$Header"}, {"type":"class","id":"retrofit2.Utils$GenericArrayTypeImpl","parent":null,"number":"0","name":".Utils$GenericArrayTypeImpl","full_name":"retrofit2.Utils$GenericArrayTypeImpl"}, {"type":"class","id":"retrofit2.Utils$ParameterizedTypeImpl","parent":null,"number":"0","name":".Utils$ParameterizedTypeImpl","full_name":"retrofit2.Utils$ParameterizedTypeImpl"}, {"type":"class","id":"retrofit2.Utils","parent":null,"number":"0","name":".Utils","full_name":"retrofit2.Utils"}, {"type":"class","id":"retrofit2.Utils$WildcardTypeImpl","parent":null,"number":"0","name":".Utils$WildcardTypeImpl","full_name":"retrofit2.Utils$WildcardTypeImpl"}, {"type":"class","id":"retrofit2.Converter$Factory","parent":null,"number":"0","name":".Converter$Factory","full_name":"retrofit2.Converter$Factory"}, {"type":"class","id":"retrofit2.Converter","parent":null,"number":"0","name":".Converter","full_name":"retrofit2.Converter"}, {"type":"class","id":"retrofit2.RequestBuilder","parent":null,"number":"0","name":".RequestBuilder","full_name":"retrofit2.RequestBuilder"}, {"type":"class","id":"retrofit2.RequestBuilder$ContentTypeOverridingRequestBody","parent":null,"number":"0","name":".RequestBuilder$ContentTypeOverridingRequestBody","full_name":"retrofit2.RequestBuilder$ContentTypeOverridingRequestBody"}]

var exampleLinks = [{"source":"retrofit2.OkHttpCall","target":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody$1","value":"1"}, {"source":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody$1","target":"retrofit2.OkHttpCall$NoContentResponseBody","value":"1"}, {"source":"retrofit2.OkHttpCall$NoContentResponseBody","target":"retrofit2.Retrofit$Builder","value":"1"}, {"source":"retrofit2.Retrofit$Builder","target":"retrofit2.Retrofit","value":"1"}, {"source":"retrofit2.Retrofit","target":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody","value":"1"}, {"source":"retrofit2.OkHttpCall$ExceptionCatchingRequestBody","target":"retrofit2.ServiceMethod$Builder","value":"1"}, {"source":"retrofit2.ServiceMethod$Builder","target":"retrofit2.ServiceMethod","value":"1"}, {"source":"retrofit2.ServiceMethod","target":"retrofit2.OkHttpCall$1","value":"1"}, {"source":"retrofit2.OkHttpCall$1","target":"retrofit2.Retrofit$1","value":"1"}, {"source":"retrofit2.Retrofit$1","target":"retrofit2.OkHttpCall","value":"1"}, {"source":"retrofit2.BuiltInConverters","target":"retrofit2.BuiltInConverters$ToStringConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$ToStringConverter","target":"retrofit2.BuiltInConverters$VoidResponseBodyConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$VoidResponseBodyConverter","target":"retrofit2.BuiltInConverters$StreamingResponseBodyConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$StreamingResponseBodyConverter","target":"retrofit2.BuiltInConverters$RequestBodyConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$RequestBodyConverter","target":"retrofit2.BuiltInConverters$StringConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$StringConverter","target":"retrofit2.BuiltInConverters$BufferingResponseBodyConverter","value":"1"}, {"source":"retrofit2.BuiltInConverters$BufferingResponseBodyConverter","target":"retrofit2.BuiltInConverters","value":"1"}, {"source":"retrofit2.Platform$Android$MainThreadExecutor","target":"retrofit2.Platform$IOS$MainThreadExecutor","value":"1"}, {"source":"retrofit2.Platform$IOS$MainThreadExecutor","target":"retrofit2.Platform$IOS","value":"1"}, {"source":"retrofit2.Platform$IOS","target":"retrofit2.Platform","value":"1"}, {"source":"retrofit2.Platform","target":"retrofit2.Platform$Java8","value":"1"}, {"source":"retrofit2.Platform$Java8","target":"retrofit2.Platform$Android","value":"1"}, {"source":"retrofit2.Platform$Android","target":"retrofit2.Platform$Android$MainThreadExecutor","value":"1"}, {"source":"retrofit2.DefaultCallAdapterFactory","target":"retrofit2.DefaultCallAdapterFactory$1","value":"1"}, {"source":"retrofit2.DefaultCallAdapterFactory$1","target":"retrofit2.DefaultCallAdapterFactory","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory","target":"retrofit2.ExecutorCallAdapterFactory$1","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory$1","target":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$1","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$1","target":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall","target":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$2","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1$2","target":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1","value":"1"}, {"source":"retrofit2.ExecutorCallAdapterFactory$ExecutorCallbackCall$1","target":"retrofit2.ExecutorCallAdapterFactory","value":"1"}, {"source":"retrofit2.CallAdapter$Factory","target":"retrofit2.CallAdapter","value":"1"}, {"source":"retrofit2.CallAdapter","target":"retrofit2.CallAdapter$Factory","value":"1"}, {"source":"retrofit2.ParameterHandler$Part","target":"retrofit2.ParameterHandler$FieldMap","value":"1"}, {"source":"retrofit2.ParameterHandler$FieldMap","target":"retrofit2.ParameterHandler$PartMap","value":"1"}, {"source":"retrofit2.ParameterHandler$PartMap","target":"retrofit2.ParameterHandler$RawPart","value":"1"}, {"source":"retrofit2.ParameterHandler$RawPart","target":"retrofit2.ParameterHandler$RelativeUrl","value":"1"}, {"source":"retrofit2.ParameterHandler$RelativeUrl","target":"retrofit2.ParameterHandler$Field","value":"1"}, {"source":"retrofit2.ParameterHandler$Field","target":"retrofit2.ParameterHandler$1","value":"1"}, {"source":"retrofit2.ParameterHandler$1","target":"retrofit2.ParameterHandler$2","value":"1"}, {"source":"retrofit2.ParameterHandler$2","target":"retrofit2.ParameterHandler$Query","value":"1"}, {"source":"retrofit2.ParameterHandler$Query","target":"retrofit2.ParameterHandler$QueryMap","value":"1"}, {"source":"retrofit2.ParameterHandler$QueryMap","target":"retrofit2.ParameterHandler$Path","value":"1"}, {"source":"retrofit2.ParameterHandler$Path","target":"retrofit2.ParameterHandler$Body","value":"1"}, {"source":"retrofit2.ParameterHandler$Body","target":"retrofit2.ParameterHandler","value":"1"}, {"source":"retrofit2.ParameterHandler","target":"retrofit2.ParameterHandler$Header","value":"1"}, {"source":"retrofit2.ParameterHandler$Header","target":"retrofit2.ParameterHandler$Part","value":"1"}, {"source":"retrofit2.Utils$GenericArrayTypeImpl","target":"retrofit2.Utils$ParameterizedTypeImpl","value":"1"}, {"source":"retrofit2.Utils$ParameterizedTypeImpl","target":"retrofit2.Utils","value":"1"}, {"source":"retrofit2.Utils","target":"retrofit2.Utils$WildcardTypeImpl","value":"1"}, {"source":"retrofit2.Utils$WildcardTypeImpl","target":"retrofit2.Utils$GenericArrayTypeImpl","value":"1"}, {"source":"retrofit2.Converter$Factory","target":"retrofit2.Converter","value":"1"}, {"source":"retrofit2.Converter","target":"retrofit2.Converter$Factory","value":"1"}, {"source":"retrofit2.RequestBuilder","target":"retrofit2.RequestBuilder$ContentTypeOverridingRequestBody","value":"1"}, {"source":"retrofit2.RequestBuilder$ContentTypeOverridingRequestBody","target":"retrofit2.RequestBuilder","value":"1"}]

biHiSankey
  .nodes(exampleNodes)
  .links(exampleLinks)
  .initializeNodes(function (node) {
    node.state = node.parent ? "contained" : "collapsed";
  })
  .layout(LAYOUT_INTERATIONS);

disableUserInterractions(2 * TRANSITION_DURATION);

update();