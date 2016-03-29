package com.bighi.se.cg.bronkerbosch;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Objects;

public class Vertex implements Comparable<Vertex>, Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	// Basic Elements
	//public String name;
	public String id;
	// The value in each k-v pair here is the weight of the edge between
	// this user and that friend.
	// Weight is defined as Math.floor(1000 / (number of mutual friends + 1))
	// where mutual friends = number of friends two users have in common in
	// the graph.
	public HashMap<Vertex, Integer> neighbours;

	public Vertex() {
		neighbours = new HashMap<Vertex, Integer>();
	}

	public Vertex(String id) {
		this();
		this.id = id;
	}
	
	@Override
	public String toString() {
		return id;
	}

	// Suitable as facebook IDs are unique
	@Override
	public int hashCode() {
		return Objects.hashCode(id);
	}

	@Override
	public int compareTo(Vertex v) {
		return this.id.compareTo(v.id);
	}
}
