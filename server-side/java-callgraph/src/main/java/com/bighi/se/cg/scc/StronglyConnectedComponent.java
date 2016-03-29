package com.bighi.se.cg.scc;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Date 10/01/2014
 * @author Tushar Roy
 *
 * Given a directed graph, find all strongly connected components in this graph.
 * We are going to use Kosaraju's algorithm to find strongly connected component.
 *
 * Algorithm
 * Create a order of vertices by finish time in decreasing order.
 * Reverse the graph
 * Do a DFS on reverse graph by finish time of vertex and created strongly connected
 * components.
 *
 * Runtime complexity - O(V + E)
 * Space complexity - O(V)
 *
 * References
 * https://en.wikipedia.org/wiki/Strongly_connected_component
 * http://www.geeksforgeeks.org/strongly-connected-components/
 */
public class StronglyConnectedComponent {

    public List<Set<Vertex<String>>> scc(Graph<String> graph) {

        //it holds vertices by finish time in reverse order.
        Deque<Vertex<String>> stack = new ArrayDeque<Vertex<String>>();
        //holds visited vertices for DFS.
        Set<Vertex<String>> visited = new HashSet<Vertex<String>>();

        //populate stack with vertices with vertex finishing last at the top.
        for (Vertex<String> vertex : graph.getAllVertex()) {
            if (visited.contains(vertex)) {
                continue;
            }
            DFSUtil(vertex, visited, stack);
        }

        //reverse the graph.
        Graph<String> reverseGraph = reverseGraph(graph);

        //Do a DFS based off vertex finish time in decreasing order on reverse graph..
        visited.clear();
        List<Set<Vertex<String>>> result = new ArrayList<Set<Vertex<String>>>();
        while (!stack.isEmpty()) {
            Vertex<String> vertex = reverseGraph.getVertex(stack.poll().getId());
            if(visited.contains(vertex)){
                continue;
            }
            Set<Vertex<String>> set = new HashSet<Vertex<String>>();
            DFSUtilForReverseGraph(vertex, visited, set);
            result.add(set);
        }
        return result;
    }

    private Graph<String> reverseGraph(Graph<String> graph) {
        Graph<String> reverseGraph = new Graph<String>(true);
        for (Edge<String> edge : graph.getAllEdges()) {
            reverseGraph.addEdge(edge.getVertex2().getId(), edge.getVertex1()
                    .getId(), edge.getWeight());
        }
        return reverseGraph;
    }

    private void DFSUtil(Vertex<String> vertex,
            Set<Vertex<String>> visited, Deque<Vertex<String>> stack) {
        visited.add(vertex);
        for (Vertex<String> v : vertex.getAdjacentVertexes()) {
            if (visited.contains(v)) {
                continue;
            }
            DFSUtil(v, visited, stack);
        }
        stack.offerFirst(vertex);
    }

    private void DFSUtilForReverseGraph(Vertex<String> vertex,
                                        Set<Vertex<String>> visited, Set<Vertex<String>> set) {
        visited.add(vertex);
        set.add(vertex);
        for (Vertex<String> v : vertex.getAdjacentVertexes()) {
            if (visited.contains(v)) {
                continue;
            }
            DFSUtilForReverseGraph(v, visited, set);
        }
    }

    public static void main(String args[]){
        Graph<String> graph = new Graph<String>(true);
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "A");
        graph.addEdge("B", "D");
        graph.addEdge("D", "E");
        graph.addEdge("E", "F");
        graph.addEdge("F", "D");
        graph.addEdge("F", "G");

        StronglyConnectedComponent scc = new StronglyConnectedComponent();
        List<Set<Vertex<String>>> result = scc.scc(graph);

        //print the result
        /*result.forEach(set -> {
            set.forEach(v -> System.out.print(v.getId() + " "));
            System.out.println();
        });*/
        
        for(Set<Vertex<String>> resultSet: result) {
        	for(Vertex<String> v: resultSet) {
        		System.out.print(v.getId() + " ");        		
        	}
        	System.out.println();
        }
    }
}