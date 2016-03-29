package com.bighi.se.cg.bronkerbosch;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/*
 * Given a set of friends, this class will find the maximal cliques using the 
 * Bron-Kerbosch algorithm
 */
public class BronKerbosch {
    private Set<Set<Vertex>> cliques;
    public BronKerbosch(){}
    
    /*
     *  Find the maximal cliques in a given set of friends
     *
     *  @return the set of all maximal cliques (each of which is in turn a set
     *  of friends) present in the graph.
     *
     */
    
    /*public static void main (String[] args) {
    	//FakebookReader fr = new FakebookReader("50.json");
    	BronKerbosch bk = new  BronKerbosch();
    	//Set<Set<Vertex>> cliques = bk.maxCliques(fr.allFriends);
    	for(Set<Vertex> clique : cliques) {
    		System.out.println("-----");
    		for(Vertex f: clique) {
    			System.out.println(f.id);
    		}
    	}
    }*/
    
    public Set<Set<Vertex>> maxCliques(Collection<Vertex> vertexes){
        cliques = new HashSet<Set<Vertex>>();
        ArrayList<Vertex> potential_clique = new ArrayList<Vertex>();
        ArrayList<Vertex> candidates = new ArrayList<Vertex>();
        ArrayList<Vertex> already_found = new ArrayList<Vertex>();
        candidates.addAll(vertexes);
        findCliques(potential_clique,candidates,already_found);
        return cliques;
    }
    
    private void findCliques(ArrayList<Vertex> potential_clique, ArrayList<Vertex> candidates, ArrayList<Vertex> already_found) {
    	ArrayList<Vertex> candidates_array = new ArrayList<Vertex>(candidates);
        if (!end(candidates, already_found)) {
            // for each candidate_node in candidates do
            for (Vertex candidate : candidates_array) {
                ArrayList<Vertex> new_candidates = new ArrayList<Vertex>();
                ArrayList<Vertex> new_already_found = new ArrayList<Vertex>();

                // move candidate node to potential_clique
                potential_clique.add(candidate);
                candidates.remove(candidate);

                // create new_candidates by removing nodes in candidates not
                // connected to candidate node
                for (Vertex new_candidate : candidates) {
                    if (candidate.neighbours.containsKey(new_candidate))
                    {
                        new_candidates.add(new_candidate);
                    }
                }

                // create new_already_found by removing nodes in already_found
                // not connected to candidate node
                for (Vertex new_found : already_found) {
                    if (candidate.neighbours.containsKey(new_found)) {
                        new_already_found.add(new_found);
                    }
                }

                // if new_candidates and new_already_found are empty
                if (new_candidates.isEmpty() && new_already_found.isEmpty()) {
                    // potential_clique is maximal_clique
                    cliques.add(new HashSet<Vertex>(potential_clique));
                }
                else {
                    findCliques(
                        potential_clique,
                        new_candidates,
                        new_already_found);
                }

                // move candidate_node from potential_clique to already_found;
                already_found.add(candidate);
                potential_clique.remove(candidate);
            }
        }
    }
    private boolean end(ArrayList<Vertex> candidates, ArrayList<Vertex> already_found)
    {
        // if a node in already_found is connected to all nodes in candidates
        boolean end = false;
        int edgecounter;
        for (Vertex found : already_found) {
            edgecounter = 0;
            for (Vertex candidate : candidates) {
                if (found.neighbours.containsKey(candidate)) {
                    edgecounter++;
                }
            }
            if (edgecounter == candidates.size()) {
                end = true;
            }
        }
        return end;
    }
}