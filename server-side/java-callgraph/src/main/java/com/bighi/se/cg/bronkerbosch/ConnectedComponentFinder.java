package com.bighi.se.cg.bronkerbosch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.NoSuchElementException;
import java.util.Queue;
import java.util.Set;
import java.util.TreeMap;

public class ConnectedComponentFinder {

	public ConnectedComponentFinder() {
	}

	/*
	 * Find the connected component of a given node
	 * 
	 * @param srcNode - the node whose connected component is to be found.
	 */
	
	//this is all basically the BFS from Fakebook Reader...not much else to say
	public Set<Vertex> findCC(Vertex srcNode) {
		if (srcNode != null) {
			if (srcNode.neighbours.size() > 0) {
				Iterator<Vertex> iter = new BreadthOrderIterator(srcNode);
				Set<Vertex> neighbours = new HashSet<Vertex>();
				while (iter.hasNext()) {
					neighbours.add(iter.next());
				}
				return neighbours;
			}
		}
		throw new IllegalArgumentException();
	}

	class BreadthOrderIterator implements Iterator<Vertex> {
		Queue<Vertex> BreadthOrderQueue;
		HashSet<String> seen = new HashSet<String>();

		public BreadthOrderIterator(Vertex friend) {
			BreadthOrderQueue = new LinkedList<Vertex>();
			BreadthOrderQueue.add(friend);
			seen.add(friend.id);
		}

		@Override
		public boolean hasNext() {
			return !BreadthOrderQueue.isEmpty();
		}

		@Override
		public Vertex next() {
			if (!hasNext())
				throw new NoSuchElementException();
			Vertex temp = BreadthOrderQueue.poll();
			HashMap<Vertex, Integer> neighbours = temp.neighbours;
			HashMap<Vertex, Integer> sorted = sortHashMapByValuesD(neighbours);
			for (Vertex e : sorted.keySet()) {
				if (!seen.contains(e.id)) {
					seen.add(e.id);
					BreadthOrderQueue.add(e);
				}
			}
			return temp;
		}

		@Override
		public void remove() {
		}

		public LinkedHashMap<Vertex, Integer> sortHashMapByValuesD(HashMap<Vertex, Integer> passedMap) {
			TreeMap<Vertex, Integer> changed = new TreeMap<Vertex, Integer>();
			changed.putAll(passedMap);
			ArrayList<Vertex> mapKeys = new ArrayList<Vertex>(changed.keySet());
			ArrayList<Integer> mapValues = new ArrayList<Integer>(changed.values());
			Collections.sort(mapValues);
			Collections.reverse(mapValues);
			Collections.sort(mapKeys);
			LinkedHashMap<Vertex, Integer> sortedMap = new LinkedHashMap<Vertex, Integer>();
			Iterator<Integer> valueIt = mapValues.iterator();
			while (valueIt.hasNext()) {
				int val = valueIt.next();
				Iterator<Vertex> keyIt = mapKeys.iterator();
				while (keyIt.hasNext()) {
					Vertex key = keyIt.next();
					int comp = changed.get(key);
					if (comp==val) {
						changed.remove(key);
						mapKeys.remove(key);
						sortedMap.put(key, val);
						break;
					}
				}
			}
			return sortedMap;
		}
	}
}
