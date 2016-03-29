/*
 * Copyright (c) 2011 - Georgios Gousios <gousiosg@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above
 *       copyright notice, this list of conditions and the following
 *       disclaimer in the documentation and/or other materials provided
 *       with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package gr.gousiosg.javacg.stat;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

import org.apache.bcel.classfile.ClassParser;

import com.bighi.se.cg.bronkerbosch.BronKerbosch;
import com.bighi.se.cg.bronkerbosch.Vertex;
import com.bighi.se.cg.scc.Graph;
import com.bighi.se.cg.scc.StronglyConnectedComponent;

/**
 * Constructs a callgraph out of a JAR archive. Can combine multiple archives
 * into a single call graph.
 * 
 * @author Georgios Gousios <gousiosg@gmail.com>
 * 
 */
public class JCallGraph {

	public static void main(String[] args) {

		ClassParser cp;
		try {

			long millis = System.currentTimeMillis();
			// String cfileName = "class_assoc_" + millis + ".txt";
			String methodClassRelOutputfileName = "method_class_package_hierarchy_" + millis + ".json";
			String method2methodDepfileName = "method2method_dependency_" + millis + ".json";
			
			String sccClassPackageRelOutputfileName = "scc_class_package_hierarchy_" + millis + ".json";
			String sccClass2ClassDepfileName = "scc_class2class_dependency_" + millis + ".json";

			// File classOutputFile = new File(cfileName);
			File methodClassRelOutputFile = new File(methodClassRelOutputfileName);
			File method2methodDepFile = new File(method2methodDepfileName);
			
			File sccClassPackageRelOutputFile = new File(sccClassPackageRelOutputfileName);
			File sccClass2ClassDepFile = new File(sccClass2ClassDepfileName);

			// BufferedWriter classOutputWriter = new BufferedWriter(new
			// FileWriter(classOutputFile));
			BufferedWriter methodClassRelOutputWriter = new BufferedWriter(new FileWriter(methodClassRelOutputFile));
			BufferedWriter method2methodDepFileWriter = new BufferedWriter(new FileWriter(method2methodDepFile));

			BufferedWriter sccClassPackageRelOutputWriter = new BufferedWriter(new FileWriter(sccClassPackageRelOutputFile));
			BufferedWriter sccClass2ClassDepFileWriter = new BufferedWriter(new FileWriter(sccClass2ClassDepFile));

			
			Map<String, List<String>> classDepMap = new HashMap<String, List<String>>();
			Map<String, List<String>> methodDepMap = new HashMap<String, List<String>>();
			List<Method2MethodMapping> methodList = new ArrayList<Method2MethodMapping>();
			Map<String, List<String>> classMethodRelMap = new HashMap<String, List<String>>();

			for (String arg : args) {

				File f = new File(arg);

				if (!f.exists()) {
					System.err.println("Jar file " + arg + " does not exist");
				}

				JarFile jar = new JarFile(f);

				Enumeration<JarEntry> entries = jar.entries();
				while (entries.hasMoreElements()) {
					JarEntry entry = entries.nextElement();
					if (entry.isDirectory())
						continue;

					if (!entry.getName().endsWith(".class"))
						continue;

					cp = new ClassParser(arg, entry.getName());

					// ClassVisitor visitor = new ClassVisitor(cp.parse(),
					// classOutputWriter, methodOutputWriter);
					ClassVisitor visitor = new ClassVisitor(cp.parse(), classDepMap, methodDepMap, methodList,
							classMethodRelMap);
					visitor.start();
				}
				jar.close();
			}

			/* classOutputWriter.write(classDepMap.toString()); */
			// methodOutputWriter.write(methodDepMap.toString());

			String jsonFile4D3Output = createJSONFile4D3(methodDepMap);
			method2methodDepFileWriter.write(jsonFile4D3Output);

			// String jsonformat4Methods = createJSON4Methods(methodList);
			// methodOutputWriter.write(methodList.toString());

			String jsonFileMethodToClassRelations = createJSONForMethod2ClassRelations(classMethodRelMap);
			methodClassRelOutputWriter.write(jsonFileMethodToClassRelations);

			Map<String, Vertex> vertices = createMapOfVertices(classDepMap);
			
			BronKerbosch bk = new  BronKerbosch();
			Set<Set<Vertex>> cliques = bk.maxCliques(vertices.values());
			for(Set<Vertex> clique : cliques) {
				if(clique.size() <= 1) {
					continue;
				}
					
				System.out.println("-----");
				for(Vertex f: clique) {
					System.out.println(f.id);
				}
			}
			
			
			Graph<String> class2classGraph = new Graph<String>(true);
			createGraphOfMethod2Method(classDepMap, class2classGraph);
			StronglyConnectedComponent scc = new StronglyConnectedComponent();
			List<Set<com.bighi.se.cg.scc.Vertex<String>>> result = scc.scc(class2classGraph);

			//System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
			List<Class2MethodMapping> class2PackageRelationsList4SCC = new ArrayList<Class2MethodMapping>();
			for (Set<com.bighi.se.cg.scc.Vertex<String>> resultSet : result) {
				if(resultSet.size() <= 1) continue;
				createJSONForClass2PackageRelationsSCC(resultSet, class2PackageRelationsList4SCC);
				/*for (com.bighi.se.cg.scc.Vertex<String> v : resultSet) {
					System.out.print(v.getId() + "====");
				}
				System.out.println();*/
			}
			sccClassPackageRelOutputWriter.write(class2PackageRelationsList4SCC.toString());
			//System.out.println("===============================================================================================");
			String jsonFileClassToClass4SCC = createJSONForClass2ClassRelations4SCC(result);
			//System.out.println(jsonFileClassToClass4SCC);
			sccClass2ClassDepFileWriter.write(jsonFileClassToClass4SCC);

			/*
			 * classOutputWriter.flush(); classOutputWriter.close();
			 */
			methodClassRelOutputWriter.flush();
			methodClassRelOutputWriter.close();

			method2methodDepFileWriter.flush();
			method2methodDepFileWriter.close();
			
			sccClassPackageRelOutputWriter.flush();
			sccClassPackageRelOutputWriter.close();
			
			sccClass2ClassDepFileWriter.flush();
			sccClass2ClassDepFileWriter.close();
			

		} catch (IOException e) {
			System.err.println("Error while processing jar: " + e.getMessage());
			e.printStackTrace();
		}
	}

	private static String createJSONForClass2ClassRelations4SCC(List<Set<com.bighi.se.cg.scc.Vertex<String>>> result) {
		List<Method2MethodMapping> method2methodList = new ArrayList<Method2MethodMapping>();
		
		String projectName = "scribejava";
		
		for (Set<com.bighi.se.cg.scc.Vertex<String>> resultSet : result) {
			if(resultSet.size() <= 1) continue;
			/*
			 * 1 -- 2 -- 3 -- 4 .....   n-1 -- n -- 1 *****
			 */
			ArrayList<com.bighi.se.cg.scc.Vertex<String>> oneSCC = new ArrayList<com.bighi.se.cg.scc.Vertex<String>>(resultSet);
			for(int i=1;i< oneSCC.size();i++) {
				String c1 = oneSCC.get(i-1).getId();
				String c2 = oneSCC.get(i).getId();
				Method2MethodMapping m2m = new Method2MethodMapping(c1, c2, "1");
				method2methodList.add(m2m);
				System.out.println("insert into github_filenames_scc values (\"" + c2 + "\", \"" + projectName +"\");");
			}
			String c1 = oneSCC.get(oneSCC.size()-1).getId();
			String c2 = oneSCC.get(0).getId();
			Method2MethodMapping m2m = new Method2MethodMapping(c1, c2, "1");
			method2methodList.add(m2m);
			
			System.out.println("insert into github_filenames_scc values (\"" + c2 + "\", \"" + projectName +"\");");
		}
		return method2methodList.toString();
	}

	/*
	 * private static String createJSON4Methods(List<Method2MethodMapping>
	 * methodList) { StringBuilder builder = new StringBuilder();
	 * builder.append("["); builder.append(methodList); builder.append("]");
	 * return builder.toString(); }
	 */

	
	private static void createGraphOfMethod2Method(
								Map<String, List<String>> classDepMap,
								Graph<String> class2classGraph) {
		Set<String> keySet = classDepMap.keySet();

		for (String key : keySet) {
			List<String> values = classDepMap.get(key);
			for (String value : values) {
				class2classGraph.addEdge(key, value);
			}
		}
	}
	
	
	private static Map<String, Vertex> createMapOfVertices(Map<String, List<String>> classDepMap) {
		Map<String, Vertex> allVertices = new HashMap<String, Vertex>();
		
		Set<String> keySet = classDepMap.keySet();

		for (String key : keySet) {
			Vertex vparent = new Vertex(key);
			allVertices.put(key, vparent);
			List<String> values = classDepMap.get(key);
			HashMap<Vertex, Integer> neighbours = new HashMap<Vertex, Integer>();
			vparent.neighbours = neighbours;
			for (String value : values) {
				Vertex vchild = new Vertex(value);
				neighbours.put(vchild, 0);
			}
		}
		
		for (Vertex e : allVertices.values()) {
			for (Vertex inner : e.neighbours.keySet()) {
				int mutual = 0;
				Vertex inner2Vertex = allVertices.get(inner.id);
				if(inner2Vertex == null) {
					continue;
				}
				for (Vertex inner2 : inner2Vertex.neighbours.keySet()) {
					if (e.neighbours.containsKey(inner2)){
						mutual++;
					}
				}
				inner.neighbours.put(e, (int) Math.floor(1000 / (mutual + 1)));
			}
		}

		return allVertices;
	}

	private static void createJSONForClass2PackageRelationsSCC(Set<com.bighi.se.cg.scc.Vertex<String>> resultSet,
														List<Class2MethodMapping> method2ClassList) {
		// StringBuilder builder = new StringBuilder();
		// **** Set<String> packageNameSet = new HashSet<String>();
		Set<String> classNameSet = new HashSet<String>();
		//Set<String> classes = resultSet.keySet();
		Set<com.bighi.se.cg.scc.Vertex<String>> classes = resultSet;
		for (com.bighi.se.cg.scc.Vertex<String> classNameV : classes) {
			String className = classNameV.getId();
			String shortClassName = className;
			// **** String packageName = "DEFAULT";
			int idx = className.lastIndexOf('.');
			if (idx >= 0) {
				shortClassName = className.substring(idx);
				// **** packageName = className.substring(0, idx);
			}
			//System.out.println(className + " ::::: "+packageName);
			/* **** if(!packageNameSet.contains(packageName)) {
				Class2MethodMapping c2m = new Class2MethodMapping("package", packageName, null, "0", packageName, packageName);
				method2ClassList.add(c2m);
				packageNameSet.add(packageName);
			}*/
			if(!classNameSet.contains(className)) {
				// **** Class2MethodMapping c2m = new Class2MethodMapping("class", className, packageName, "0", shortClassName, className);
				Class2MethodMapping c2m = new Class2MethodMapping("class", className, null, "0", shortClassName, className);
				method2ClassList.add(c2m);
				classNameSet.add(className);
			}
		}
		//return method2ClassList.toString();
	}
	
	private static String createJSONForMethod2ClassRelations(Map<String, List<String>> classMethodRelMap) {
		// StringBuilder builder = new StringBuilder();
		Set<String> packageNameSet = new HashSet<String>();
		Set<String> classes = classMethodRelMap.keySet();
		List<Class2MethodMapping> method2ClassList = new ArrayList<Class2MethodMapping>();
		for (String className : classes) {
			String shortClassName = className;
			String packageName = "DEFAULT";
			int idx = className.lastIndexOf('.');
			if (idx >= 0) {
				shortClassName = className.substring(idx);
				packageName = className.substring(0, idx);
			}
			//System.out.println(className + " ::::: "+packageName);
			if(!packageNameSet.contains(packageName)) {
				Class2MethodMapping c2m = new Class2MethodMapping("package", packageName, null, "0", packageName, packageName);
				method2ClassList.add(c2m);
				packageNameSet.add(packageName);
			}
			Class2MethodMapping c2m = new Class2MethodMapping("class", className, packageName, "0", shortClassName, className);
			//Class2MethodMapping c2m = new Class2MethodMapping("class", className, null, "0", shortClassName, className);
			method2ClassList.add(c2m);

			List<String> methods = classMethodRelMap.get(className);
			for (String methodName : methods) {
				Class2MethodMapping c2m4method = new Class2MethodMapping("method", className + ":" + methodName,
						className, "0", methodName, className + ":" + methodName);
				method2ClassList.add(c2m4method);
			}

		}
		return method2ClassList.toString();
	}

	private static String createJSONFile4D3(Map<String, List<String>> methodDepMap) {
		Set<String> keySet = methodDepMap.keySet();

		List<Method2MethodMapping> method2methodList = new ArrayList<Method2MethodMapping>();

		for (String key : keySet) {

			List<String> values = methodDepMap.get(key);
			for (String value : values) {

				Method2MethodMapping m2m = new Method2MethodMapping(key, value, "1");
				method2methodList.add(m2m);
			}
		}

		return method2methodList.toString();
	}
	/*
	 * private static String createJSONFile4D3(Map<String, List<String>>
	 * methodDepMap) { Set<String> keySet = methodDepMap.keySet(); Set<String>
	 * allValues = new HashSet<String>(); StringBuilder builder = new
	 * StringBuilder(); for(String key: keySet) {
	 * allValues.addAll(methodDepMap.get(key)); }
	 * 
	 * builder.append("["); for(String value: allValues) {
	 * if(builder.charAt(builder.length()-1) != '[') { builder.append(","); }
	 * builder.append("{"); builder.append("\"depends\":[  ],");
	 * builder.append("\"name\":\""); builder.append(value); builder.append(
	 * "\", \"type\":\"view\""); builder.append("}"); } //Set<String>
	 * uniqueCheckSet = new HashSet<String>(); for(String key: keySet) {
	 * List<String> values = methodDepMap.get(key);
	 * if(builder.charAt(builder.length()-1) != '[') { builder.append(","); }
	 * builder.append("{"); builder.append("\"depends\":[");
	 * 
	 * for(int i=0;i<values.size();i++) { String value = values.get(i);
	 * if(key.equals(value)) { System.out.println("key and value equal"+key);
	 * continue; } //if(uniqueCheckSet.contains(key + value)) {
	 * //System.out.println("duplicate:"+key+value); //continue; //}
	 * builder.append("\""); builder.append(value); builder.append("\"");
	 * if(i<values.size()-1) { builder.append(","); }
	 * //uniqueCheckSet.add(key+value); }
	 * 
	 * if(builder.charAt(builder.length()-1) == ',') {
	 * builder.deleteCharAt(builder.length()-1); }
	 * 
	 * builder.append("],"); builder.append("\"name\":\""); builder.append(key);
	 * builder.append("\", \"type\":\"extract\""); builder.append("}");
	 * 
	 * }
	 * 
	 * builder.append("]"); return builder.toString(); }
	 */
}
