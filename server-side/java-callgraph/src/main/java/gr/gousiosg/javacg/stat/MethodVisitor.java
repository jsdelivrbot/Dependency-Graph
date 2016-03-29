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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.bcel.classfile.JavaClass;
import org.apache.bcel.generic.ConstantPoolGen;
import org.apache.bcel.generic.ConstantPushInstruction;
import org.apache.bcel.generic.EmptyVisitor;
import org.apache.bcel.generic.INVOKEINTERFACE;
import org.apache.bcel.generic.INVOKESPECIAL;
import org.apache.bcel.generic.INVOKESTATIC;
import org.apache.bcel.generic.INVOKEVIRTUAL;
import org.apache.bcel.generic.Instruction;
import org.apache.bcel.generic.InstructionConstants;
import org.apache.bcel.generic.InstructionHandle;
import org.apache.bcel.generic.MethodGen;
import org.apache.bcel.generic.ReturnInstruction;

/**
 * The simplest of method visitors, prints any invoked method
 * signature for all method invocations.
 * 
 * Class copied with modifications from CJKM: http://www.spinellis.gr/sw/ckjm/
 */
public class MethodVisitor extends EmptyVisitor {

    JavaClass visitedClass;
    private MethodGen mg;
    private ConstantPoolGen cp;
    //private String format;
    
    //private BufferedWriter methodOutputWriter;
    private Map<String, List<String>> methodDepMap;
    //private List<Method2MethodMapping> methodList;
    private Map<String, List<String>> classMethodRelMap;

    public MethodVisitor(MethodGen m, JavaClass jc, Map<String, List<String>> methodDepMap, 
    		List<Method2MethodMapping> methodList, Map<String, List<String>> classMethodRelMap) {
        visitedClass = jc;
        mg = m;
        cp = mg.getConstantPool();
        //format = "M:" + visitedClass.getClassName() + ":" + mg.getName() 
          //  + " " + "(%s)%s:%s";
        //format = visitedClass.getClassName() + ":" + mg.getName() 
        //+ " ===> " + "%s:%s";
        //format = "{ from_class: " + visitedClass.getClassName() + "," + 
        	//	   "from_method:" + mg.getName() + "," + 
        		//   "to_class: %s, to_method: %s }";
        
        this.methodDepMap = methodDepMap;
        //this.methodList = methodList;
        //this.methodOutputWriter = methodOutputWriter;
        
        this.classMethodRelMap = classMethodRelMap;
    }

    public void start() {
        if (mg.isAbstract() || mg.isNative())
            return;
        for (InstructionHandle ih = mg.getInstructionList().getStart(); 
                ih != null; ih = ih.getNext()) {
            Instruction i = ih.getInstruction();
            
            if (!visitInstruction(i))
                i.accept(this);
        }
    }

    private boolean visitInstruction(Instruction i) {
        short opcode = i.getOpcode();

        return ((InstructionConstants.INSTRUCTIONS[opcode] != null)
                && !(i instanceof ConstantPushInstruction) 
                && !(i instanceof ReturnInstruction));
    }

    @Override
    public void visitINVOKEVIRTUAL(INVOKEVIRTUAL i) {
    	//String output = String.format(format,"M",i.getReferenceType(cp),i.getMethodName(cp));
    	//String output = String.format(format, i.getReferenceType(cp),i.getMethodName(cp));
    	//writeOutput(output);
    	String fromClass = visitedClass.getClassName();
    	String fromMethod = mg.getName();
    	String toClass = i.getReferenceType(cp).toString();
    	String toMethod = i.getMethodName(cp);
    	
    	addToClassToMethodMap(fromClass, fromMethod);
    	addToClassToMethodMap(toClass, toMethod);
    	
    	String key = fromClass + ":" + fromMethod;
    	String value = toClass + ":" + toMethod;
    	addToMethodMap(key, value);
    	//addToMethodList(fromClass, fromMethod, toClass, toMethod);
    }

    @Override
    public void visitINVOKEINTERFACE(INVOKEINTERFACE i) {
    	//String output = String.format(format,"I",i.getReferenceType(cp),i.getMethodName(cp));
    	//String output = String.format(format, i.getReferenceType(cp),i.getMethodName(cp));
    	//writeOutput(output);
    	String fromClass = visitedClass.getClassName();
    	String fromMethod = mg.getName();
    	String toClass = i.getReferenceType(cp).toString();
    	String toMethod = i.getMethodName(cp);
    	
       	addToClassToMethodMap(fromClass, fromMethod);
    	addToClassToMethodMap(toClass, toMethod);
    	
    	String key = fromClass + ":" + fromMethod;
    	String value = toClass + ":" + toMethod;
    	addToMethodMap(key, value);
    	//addToMethodList(fromClass, fromMethod, toClass, toMethod);
    }

    @Override
    public void visitINVOKESPECIAL(INVOKESPECIAL i) {
        //String output = String.format(format,"O",i.getReferenceType(cp),i.getMethodName(cp));
    	//String output = String.format(format, i.getReferenceType(cp),i.getMethodName(cp));
    	//writeOutput(output);
    	String fromClass = visitedClass.getClassName();
    	String fromMethod = mg.getName();
    	String toClass = i.getReferenceType(cp).toString();
    	String toMethod = i.getMethodName(cp);
    	
       	addToClassToMethodMap(fromClass, fromMethod);
    	addToClassToMethodMap(toClass, toMethod);
    	
    	String key = fromClass + ":" + fromMethod;
    	String value = toClass + ":" + toMethod;
    	addToMethodMap(key, value);
    	//addToMethodList(fromClass, fromMethod, toClass, toMethod);
    }

    @Override
    public void visitINVOKESTATIC(INVOKESTATIC i) {
    	//String output = String.format(format,"S",i.getReferenceType(cp),i.getMethodName(cp));
    	//String output = String.format(format, i.getReferenceType(cp),i.getMethodName(cp));
    	//writeOutput(output);
    	String fromClass = visitedClass.getClassName();
    	String fromMethod = mg.getName();
    	String toClass = i.getReferenceType(cp).toString();
    	String toMethod = i.getMethodName(cp);
    	
       	addToClassToMethodMap(fromClass, fromMethod);
    	addToClassToMethodMap(toClass, toMethod);
    	
    	String key = fromClass + ":" + fromMethod;
    	String value = toClass + ":" + toMethod;
    	addToMethodMap(key, value);
    	//addToMethodList(fromClass, fromMethod, toClass, toMethod);
    }
    
    private void addToMethodMap(String key, String value) {
    	 List<String> deps = methodDepMap.get(key);
         if(deps == null) {
         	deps = new ArrayList<String>();
         	methodDepMap.put(key, deps);
         }
         deps.add(value);
    }
    
    /*
    private void addToMethodList(String fromClass, String fromMethod,
    							String toClass, String toMethod) {
   	 	Method2MethodMapping m2m = new Method2MethodMapping(
   	 							fromClass, fromMethod, toClass, toMethod);
   	 	methodList.add(m2m);
    }*/
    
    private void addToClassToMethodMap(String className, String methodName) {
    	List<String> methods = classMethodRelMap.get(className);
        if(methods == null) {
        	methods = new ArrayList<String>();
        	classMethodRelMap.put(className, methods);
        }
        if(!methods.contains(methodName)){
        	methods.add(methodName);
        }
    }
    
     /*private void writeOutput(String output) {
    	//System.out.println(output);
    	try {
			methodOutputWriter.write(output);
			methodOutputWriter.newLine();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }*/
}
