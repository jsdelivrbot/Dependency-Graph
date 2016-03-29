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
  HEIGHT = 11080 - MARGIN.TOP - MARGIN.BOTTOM,
  WIDTH = 11880 - MARGIN.LEFT - MARGIN.RIGHT,
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

var exampleNodes = [{"type":"class","id":"twitter4j.HttpClientImpl$1","parent":null,"number":"0","name":".HttpClientImpl$1","full_name":"twitter4j.HttpClientImpl$1"}, {"type":"class","id":"twitter4j.HttpClientImpl","parent":null,"number":"0","name":".HttpClientImpl","full_name":"twitter4j.HttpClientImpl"}, {"type":"class","id":"twitter4j.TwitterBaseImpl$1","parent":null,"number":"0","name":".TwitterBaseImpl$1","full_name":"twitter4j.TwitterBaseImpl$1"}, {"type":"class","id":"twitter4j.TwitterBaseImpl$2","parent":null,"number":"0","name":".TwitterBaseImpl$2","full_name":"twitter4j.TwitterBaseImpl$2"}, {"type":"class","id":"twitter4j.TwitterBaseImpl","parent":null,"number":"0","name":".TwitterBaseImpl","full_name":"twitter4j.TwitterBaseImpl"}, {"type":"class","id":"twitter4j.OEmbedRequest","parent":null,"number":"0","name":".OEmbedRequest","full_name":"twitter4j.OEmbedRequest"}, {"type":"class","id":"twitter4j.OEmbedRequest$Align","parent":null,"number":"0","name":".OEmbedRequest$Align","full_name":"twitter4j.OEmbedRequest$Align"}, {"type":"class","id":"twitter4j.DispatcherImpl$2","parent":null,"number":"0","name":".DispatcherImpl$2","full_name":"twitter4j.DispatcherImpl$2"}, {"type":"class","id":"twitter4j.DispatcherImpl$1","parent":null,"number":"0","name":".DispatcherImpl$1","full_name":"twitter4j.DispatcherImpl$1"}, {"type":"class","id":"twitter4j.DispatcherImpl","parent":null,"number":"0","name":".DispatcherImpl","full_name":"twitter4j.DispatcherImpl"}, {"type":"class","id":"twitter4j.conf.ConfigurationBase","parent":null,"number":"0","name":".ConfigurationBase","full_name":"twitter4j.conf.ConfigurationBase"}, {"type":"class","id":"twitter4j.conf.ConfigurationBase$MyHttpClientConfiguration","parent":null,"number":"0","name":".ConfigurationBase$MyHttpClientConfiguration","full_name":"twitter4j.conf.ConfigurationBase$MyHttpClientConfiguration"}, {"type":"class","id":"twitter4j.ParseUtil","parent":null,"number":"0","name":".ParseUtil","full_name":"twitter4j.ParseUtil"}, {"type":"class","id":"twitter4j.AccountSettingsJSONImpl","parent":null,"number":"0","name":".AccountSettingsJSONImpl","full_name":"twitter4j.AccountSettingsJSONImpl"}, {"type":"class","id":"twitter4j.TwitterAPIConfigurationJSONImpl","parent":null,"number":"0","name":".TwitterAPIConfigurationJSONImpl","full_name":"twitter4j.TwitterAPIConfigurationJSONImpl"}, {"type":"class","id":"twitter4j.ExtendedMediaEntityJSONImpl$Variant","parent":null,"number":"0","name":".ExtendedMediaEntityJSONImpl$Variant","full_name":"twitter4j.ExtendedMediaEntityJSONImpl$Variant"}, {"type":"class","id":"twitter4j.IDsJSONImpl","parent":null,"number":"0","name":".IDsJSONImpl","full_name":"twitter4j.IDsJSONImpl"}, {"type":"class","id":"twitter4j.TwitterObjectFactory$1","parent":null,"number":"0","name":".TwitterObjectFactory$1","full_name":"twitter4j.TwitterObjectFactory$1"}, {"type":"class","id":"twitter4j.api.HelpResources$Language","parent":null,"number":"0","name":".HelpResources$Language","full_name":"twitter4j.api.HelpResources$Language"}, {"type":"class","id":"twitter4j.ExtendedMediaEntityJSONImpl","parent":null,"number":"0","name":".ExtendedMediaEntityJSONImpl","full_name":"twitter4j.ExtendedMediaEntityJSONImpl"}, {"type":"class","id":"twitter4j.TwitterObjectFactory$2","parent":null,"number":"0","name":".TwitterObjectFactory$2","full_name":"twitter4j.TwitterObjectFactory$2"}, {"type":"class","id":"twitter4j.ResponseListImpl","parent":null,"number":"0","name":".ResponseListImpl","full_name":"twitter4j.ResponseListImpl"}, {"type":"class","id":"twitter4j.DirectMessageJSONImpl","parent":null,"number":"0","name":".DirectMessageJSONImpl","full_name":"twitter4j.DirectMessageJSONImpl"}, {"type":"class","id":"twitter4j.HashtagEntityJSONImpl","parent":null,"number":"0","name":".HashtagEntityJSONImpl","full_name":"twitter4j.HashtagEntityJSONImpl"}, {"type":"class","id":"twitter4j.MediaEntityJSONImpl$Size","parent":null,"number":"0","name":".MediaEntityJSONImpl$Size","full_name":"twitter4j.MediaEntityJSONImpl$Size"}, {"type":"class","id":"twitter4j.RateLimitStatusJSONImpl","parent":null,"number":"0","name":".RateLimitStatusJSONImpl","full_name":"twitter4j.RateLimitStatusJSONImpl"}, {"type":"class","id":"twitter4j.FriendshipJSONImpl","parent":null,"number":"0","name":".FriendshipJSONImpl","full_name":"twitter4j.FriendshipJSONImpl"}, {"type":"class","id":"twitter4j.StatusDeletionNoticeImpl","parent":null,"number":"0","name":".StatusDeletionNoticeImpl","full_name":"twitter4j.StatusDeletionNoticeImpl"}, {"type":"class","id":"twitter4j.TrendsJSONImpl","parent":null,"number":"0","name":".TrendsJSONImpl","full_name":"twitter4j.TrendsJSONImpl"}, {"type":"class","id":"twitter4j.PlaceJSONImpl","parent":null,"number":"0","name":".PlaceJSONImpl","full_name":"twitter4j.PlaceJSONImpl"}, {"type":"class","id":"twitter4j.ObjectFactory","parent":null,"number":"0","name":".ObjectFactory","full_name":"twitter4j.ObjectFactory"}, {"type":"class","id":"twitter4j.URLEntityJSONImpl","parent":null,"number":"0","name":".URLEntityJSONImpl","full_name":"twitter4j.URLEntityJSONImpl"}, {"type":"class","id":"twitter4j.LanguageJSONImpl","parent":null,"number":"0","name":".LanguageJSONImpl","full_name":"twitter4j.LanguageJSONImpl"}, {"type":"class","id":"twitter4j.api.HelpResources","parent":null,"number":"0","name":".HelpResources","full_name":"twitter4j.api.HelpResources"}, {"type":"class","id":"twitter4j.UserListJSONImpl","parent":null,"number":"0","name":".UserListJSONImpl","full_name":"twitter4j.UserListJSONImpl"}, {"type":"class","id":"twitter4j.LocationJSONImpl","parent":null,"number":"0","name":".LocationJSONImpl","full_name":"twitter4j.LocationJSONImpl"}, {"type":"class","id":"twitter4j.UserMentionEntityJSONImpl","parent":null,"number":"0","name":".UserMentionEntityJSONImpl","full_name":"twitter4j.UserMentionEntityJSONImpl"}, {"type":"class","id":"twitter4j.MediaEntityJSONImpl","parent":null,"number":"0","name":".MediaEntityJSONImpl","full_name":"twitter4j.MediaEntityJSONImpl"}, {"type":"class","id":"twitter4j.QueryResultJSONImpl","parent":null,"number":"0","name":".QueryResultJSONImpl","full_name":"twitter4j.QueryResultJSONImpl"}, {"type":"class","id":"twitter4j.UserJSONImpl","parent":null,"number":"0","name":".UserJSONImpl","full_name":"twitter4j.UserJSONImpl"}, {"type":"class","id":"twitter4j.TwitterResponseImpl","parent":null,"number":"0","name":".TwitterResponseImpl","full_name":"twitter4j.TwitterResponseImpl"}, {"type":"class","id":"twitter4j.PagableResponseListImpl","parent":null,"number":"0","name":".PagableResponseListImpl","full_name":"twitter4j.PagableResponseListImpl"}, {"type":"class","id":"twitter4j.AccountTotalsJSONImpl","parent":null,"number":"0","name":".AccountTotalsJSONImpl","full_name":"twitter4j.AccountTotalsJSONImpl"}, {"type":"class","id":"twitter4j.SavedSearchJSONImpl","parent":null,"number":"0","name":".SavedSearchJSONImpl","full_name":"twitter4j.SavedSearchJSONImpl"}, {"type":"class","id":"twitter4j.HttpResponse","parent":null,"number":"0","name":".HttpResponse","full_name":"twitter4j.HttpResponse"}, {"type":"class","id":"twitter4j.CategoryJSONImpl","parent":null,"number":"0","name":".CategoryJSONImpl","full_name":"twitter4j.CategoryJSONImpl"}, {"type":"class","id":"twitter4j.TimeZoneJSONImpl","parent":null,"number":"0","name":".TimeZoneJSONImpl","full_name":"twitter4j.TimeZoneJSONImpl"}, {"type":"class","id":"twitter4j.JSONImplFactory","parent":null,"number":"0","name":".JSONImplFactory","full_name":"twitter4j.JSONImplFactory"}, {"type":"class","id":"twitter4j.OEmbedJSONImpl","parent":null,"number":"0","name":".OEmbedJSONImpl","full_name":"twitter4j.OEmbedJSONImpl"}, {"type":"class","id":"twitter4j.HttpResponseImpl","parent":null,"number":"0","name":".HttpResponseImpl","full_name":"twitter4j.HttpResponseImpl"}, {"type":"class","id":"twitter4j.TrendJSONImpl","parent":null,"number":"0","name":".TrendJSONImpl","full_name":"twitter4j.TrendJSONImpl"}, {"type":"class","id":"twitter4j.StatusJSONImpl","parent":null,"number":"0","name":".StatusJSONImpl","full_name":"twitter4j.StatusJSONImpl"}, {"type":"class","id":"twitter4j.TwitterObjectFactory","parent":null,"number":"0","name":".TwitterObjectFactory","full_name":"twitter4j.TwitterObjectFactory"}, {"type":"class","id":"twitter4j.TwitterException","parent":null,"number":"0","name":".TwitterException","full_name":"twitter4j.TwitterException"}, {"type":"class","id":"twitter4j.RelationshipJSONImpl","parent":null,"number":"0","name":".RelationshipJSONImpl","full_name":"twitter4j.RelationshipJSONImpl"}, {"type":"class","id":"twitter4j.Query$ResultType","parent":null,"number":"0","name":".Query$ResultType","full_name":"twitter4j.Query$ResultType"}, {"type":"class","id":"twitter4j.Query$Unit","parent":null,"number":"0","name":".Query$Unit","full_name":"twitter4j.Query$Unit"}, {"type":"class","id":"twitter4j.Query","parent":null,"number":"0","name":".Query","full_name":"twitter4j.Query"}, {"type":"class","id":"twitter4j.JSONObjectType$Type","parent":null,"number":"0","name":".JSONObjectType$Type","full_name":"twitter4j.JSONObjectType$Type"}, {"type":"class","id":"twitter4j.JSONObjectType","parent":null,"number":"0","name":".JSONObjectType","full_name":"twitter4j.JSONObjectType"}, {"type":"class","id":"twitter4j.ExtendedMediaEntity$Variant","parent":null,"number":"0","name":".ExtendedMediaEntity$Variant","full_name":"twitter4j.ExtendedMediaEntity$Variant"}, {"type":"class","id":"twitter4j.ExtendedMediaEntity","parent":null,"number":"0","name":".ExtendedMediaEntity","full_name":"twitter4j.ExtendedMediaEntity"}, {"type":"class","id":"twitter4j.MediaEntity","parent":null,"number":"0","name":".MediaEntity","full_name":"twitter4j.MediaEntity"}, {"type":"class","id":"twitter4j.MediaEntity$Size","parent":null,"number":"0","name":".MediaEntity$Size","full_name":"twitter4j.MediaEntity$Size"}, {"type":"class","id":"twitter4j.StdOutLogger","parent":null,"number":"0","name":".StdOutLogger","full_name":"twitter4j.StdOutLogger"}, {"type":"class","id":"twitter4j.Logger","parent":null,"number":"0","name":".Logger","full_name":"twitter4j.Logger"}, {"type":"class","id":"twitter4j.StdOutLoggerFactory","parent":null,"number":"0","name":".StdOutLoggerFactory","full_name":"twitter4j.StdOutLoggerFactory"}, {"type":"class","id":"twitter4j.JSONArray","parent":null,"number":"0","name":".JSONArray","full_name":"twitter4j.JSONArray"}, {"type":"class","id":"twitter4j.JSONObject$1","parent":null,"number":"0","name":".JSONObject$1","full_name":"twitter4j.JSONObject$1"}, {"type":"class","id":"twitter4j.JSONTokener","parent":null,"number":"0","name":".JSONTokener","full_name":"twitter4j.JSONTokener"}, {"type":"class","id":"twitter4j.JSONObject$Null","parent":null,"number":"0","name":".JSONObject$Null","full_name":"twitter4j.JSONObject$Null"}, {"type":"class","id":"twitter4j.JSONObject","parent":null,"number":"0","name":".JSONObject","full_name":"twitter4j.JSONObject"}]

var exampleLinks = [{"source":"twitter4j.HttpClientImpl$1","target":"twitter4j.HttpClientImpl","value":"1"}, {"source":"twitter4j.HttpClientImpl","target":"twitter4j.HttpClientImpl$1","value":"1"}, {"source":"twitter4j.TwitterBaseImpl$1","target":"twitter4j.TwitterBaseImpl$2","value":"1"}, {"source":"twitter4j.TwitterBaseImpl$2","target":"twitter4j.TwitterBaseImpl","value":"1"}, {"source":"twitter4j.TwitterBaseImpl","target":"twitter4j.TwitterBaseImpl$1","value":"1"}, {"source":"twitter4j.OEmbedRequest","target":"twitter4j.OEmbedRequest$Align","value":"1"}, {"source":"twitter4j.OEmbedRequest$Align","target":"twitter4j.OEmbedRequest","value":"1"}, {"source":"twitter4j.DispatcherImpl$2","target":"twitter4j.DispatcherImpl$1","value":"1"}, {"source":"twitter4j.DispatcherImpl$1","target":"twitter4j.DispatcherImpl","value":"1"}, {"source":"twitter4j.DispatcherImpl","target":"twitter4j.DispatcherImpl$2","value":"1"}, {"source":"twitter4j.conf.ConfigurationBase","target":"twitter4j.conf.ConfigurationBase$MyHttpClientConfiguration","value":"1"}, {"source":"twitter4j.conf.ConfigurationBase$MyHttpClientConfiguration","target":"twitter4j.conf.ConfigurationBase","value":"1"}, {"source":"twitter4j.ParseUtil","target":"twitter4j.AccountSettingsJSONImpl","value":"1"}, {"source":"twitter4j.AccountSettingsJSONImpl","target":"twitter4j.TwitterAPIConfigurationJSONImpl","value":"1"}, {"source":"twitter4j.TwitterAPIConfigurationJSONImpl","target":"twitter4j.ExtendedMediaEntityJSONImpl$Variant","value":"1"}, {"source":"twitter4j.ExtendedMediaEntityJSONImpl$Variant","target":"twitter4j.IDsJSONImpl","value":"1"}, {"source":"twitter4j.IDsJSONImpl","target":"twitter4j.TwitterObjectFactory$1","value":"1"}, {"source":"twitter4j.TwitterObjectFactory$1","target":"twitter4j.api.HelpResources$Language","value":"1"}, {"source":"twitter4j.api.HelpResources$Language","target":"twitter4j.ExtendedMediaEntityJSONImpl","value":"1"}, {"source":"twitter4j.ExtendedMediaEntityJSONImpl","target":"twitter4j.TwitterObjectFactory$2","value":"1"}, {"source":"twitter4j.TwitterObjectFactory$2","target":"twitter4j.ResponseListImpl","value":"1"}, {"source":"twitter4j.ResponseListImpl","target":"twitter4j.DirectMessageJSONImpl","value":"1"}, {"source":"twitter4j.DirectMessageJSONImpl","target":"twitter4j.HashtagEntityJSONImpl","value":"1"}, {"source":"twitter4j.HashtagEntityJSONImpl","target":"twitter4j.MediaEntityJSONImpl$Size","value":"1"}, {"source":"twitter4j.MediaEntityJSONImpl$Size","target":"twitter4j.RateLimitStatusJSONImpl","value":"1"}, {"source":"twitter4j.RateLimitStatusJSONImpl","target":"twitter4j.FriendshipJSONImpl","value":"1"}, {"source":"twitter4j.FriendshipJSONImpl","target":"twitter4j.StatusDeletionNoticeImpl","value":"1"}, {"source":"twitter4j.StatusDeletionNoticeImpl","target":"twitter4j.TrendsJSONImpl","value":"1"}, {"source":"twitter4j.TrendsJSONImpl","target":"twitter4j.PlaceJSONImpl","value":"1"}, {"source":"twitter4j.PlaceJSONImpl","target":"twitter4j.ObjectFactory","value":"1"}, {"source":"twitter4j.ObjectFactory","target":"twitter4j.URLEntityJSONImpl","value":"1"}, {"source":"twitter4j.URLEntityJSONImpl","target":"twitter4j.LanguageJSONImpl","value":"1"}, {"source":"twitter4j.LanguageJSONImpl","target":"twitter4j.api.HelpResources","value":"1"}, {"source":"twitter4j.api.HelpResources","target":"twitter4j.UserListJSONImpl","value":"1"}, {"source":"twitter4j.UserListJSONImpl","target":"twitter4j.LocationJSONImpl","value":"1"}, {"source":"twitter4j.LocationJSONImpl","target":"twitter4j.UserMentionEntityJSONImpl","value":"1"}, {"source":"twitter4j.UserMentionEntityJSONImpl","target":"twitter4j.MediaEntityJSONImpl","value":"1"}, {"source":"twitter4j.MediaEntityJSONImpl","target":"twitter4j.QueryResultJSONImpl","value":"1"}, {"source":"twitter4j.QueryResultJSONImpl","target":"twitter4j.UserJSONImpl","value":"1"}, {"source":"twitter4j.UserJSONImpl","target":"twitter4j.TwitterResponseImpl","value":"1"}, {"source":"twitter4j.TwitterResponseImpl","target":"twitter4j.PagableResponseListImpl","value":"1"}, {"source":"twitter4j.PagableResponseListImpl","target":"twitter4j.AccountTotalsJSONImpl","value":"1"}, {"source":"twitter4j.AccountTotalsJSONImpl","target":"twitter4j.SavedSearchJSONImpl","value":"1"}, {"source":"twitter4j.SavedSearchJSONImpl","target":"twitter4j.HttpResponse","value":"1"}, {"source":"twitter4j.HttpResponse","target":"twitter4j.CategoryJSONImpl","value":"1"}, {"source":"twitter4j.CategoryJSONImpl","target":"twitter4j.TimeZoneJSONImpl","value":"1"}, {"source":"twitter4j.TimeZoneJSONImpl","target":"twitter4j.JSONImplFactory","value":"1"}, {"source":"twitter4j.JSONImplFactory","target":"twitter4j.OEmbedJSONImpl","value":"1"}, {"source":"twitter4j.OEmbedJSONImpl","target":"twitter4j.HttpResponseImpl","value":"1"}, {"source":"twitter4j.HttpResponseImpl","target":"twitter4j.TrendJSONImpl","value":"1"}, {"source":"twitter4j.TrendJSONImpl","target":"twitter4j.StatusJSONImpl","value":"1"}, {"source":"twitter4j.StatusJSONImpl","target":"twitter4j.TwitterObjectFactory","value":"1"}, {"source":"twitter4j.TwitterObjectFactory","target":"twitter4j.TwitterException","value":"1"}, {"source":"twitter4j.TwitterException","target":"twitter4j.RelationshipJSONImpl","value":"1"}, {"source":"twitter4j.RelationshipJSONImpl","target":"twitter4j.ParseUtil","value":"1"}, {"source":"twitter4j.Query$ResultType","target":"twitter4j.Query$Unit","value":"1"}, {"source":"twitter4j.Query$Unit","target":"twitter4j.Query","value":"1"}, {"source":"twitter4j.Query","target":"twitter4j.Query$ResultType","value":"1"}, {"source":"twitter4j.JSONObjectType$Type","target":"twitter4j.JSONObjectType","value":"1"}, {"source":"twitter4j.JSONObjectType","target":"twitter4j.JSONObjectType$Type","value":"1"}, {"source":"twitter4j.ExtendedMediaEntity$Variant","target":"twitter4j.ExtendedMediaEntity","value":"1"}, {"source":"twitter4j.ExtendedMediaEntity","target":"twitter4j.ExtendedMediaEntity$Variant","value":"1"}, {"source":"twitter4j.MediaEntity","target":"twitter4j.MediaEntity$Size","value":"1"}, {"source":"twitter4j.MediaEntity$Size","target":"twitter4j.MediaEntity","value":"1"}, {"source":"twitter4j.StdOutLogger","target":"twitter4j.Logger","value":"1"}, {"source":"twitter4j.Logger","target":"twitter4j.StdOutLoggerFactory","value":"1"}, {"source":"twitter4j.StdOutLoggerFactory","target":"twitter4j.StdOutLogger","value":"1"}, {"source":"twitter4j.JSONArray","target":"twitter4j.JSONObject$1","value":"1"}, {"source":"twitter4j.JSONObject$1","target":"twitter4j.JSONTokener","value":"1"}, {"source":"twitter4j.JSONTokener","target":"twitter4j.JSONObject$Null","value":"1"}, {"source":"twitter4j.JSONObject$Null","target":"twitter4j.JSONObject","value":"1"}, {"source":"twitter4j.JSONObject","target":"twitter4j.JSONArray","value":"1"}]

biHiSankey
  .nodes(exampleNodes)
  .links(exampleLinks)
  .initializeNodes(function (node) {
    node.state = node.parent ? "contained" : "collapsed";
  })
  .layout(LAYOUT_INTERATIONS);

disableUserInterractions(2 * TRANSITION_DURATION);

update();