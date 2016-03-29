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

import org.apache.bcel.classfile.Constant;
import org.apache.bcel.classfile.ConstantPool;
import org.apache.bcel.classfile.EmptyVisitor;
import org.apache.bcel.classfile.JavaClass;
import org.apache.bcel.classfile.Method;
import org.apache.bcel.generic.ConstantPoolGen;
import org.apache.bcel.generic.MethodGen;

/**
 * The simplest of class visitors, invokes the method visitor class for each
 * method found.
 */
public class ClassVisitor extends EmptyVisitor {

    private JavaClass clazz;
    private ConstantPoolGen constants;
    //private String classReferenceFormat;
    
    //private File classOutputFile;
    //private File methodOutputFile;
    
    //private BufferedWriter classOutputWriter;
    //private BufferedWriter methodOutputWriter;
    private Map<String, List<String>> classDepMap;
    private Map<String, List<String>> methodDepMap;
    private List<Method2MethodMapping> methodList;
    
    private Map<String, List<String>> classMethodRelMap;
    
    public ClassVisitor(JavaClass jc, Map<String, List<String>> classDepMap, 
    				Map<String, List<String>> methodDepMap, 
    				List<Method2MethodMapping> methodList,
    				Map<String, List<String>> classMethodRelMap) {
        clazz = jc;
        constants = new ConstantPoolGen(clazz.getConstantPool());
        //classReferenceFormat = "C:" + clazz.getClassName() + " %s";
        //classReferenceFormat = clazz.getClassName() + " ===> " + "%s";
        
        //classOutputWriter = classOutputW;
        //methodOutputWriter = methodOutputW;
        this.classDepMap = classDepMap;
        this.methodDepMap = methodDepMap;
        this.methodList = methodList;
        
        this.classMethodRelMap = classMethodRelMap;
        
    }

    public void visitJavaClass(JavaClass jc) {
        jc.getConstantPool().accept(this);
        Method[] methods = jc.getMethods();
        for (int i = 0; i < methods.length; i++){
            methods[i].accept(this);
        }
    }

    public void visitConstantPool(ConstantPool constantPool) {
        for (int i = 0; i < constantPool.getLength(); i++) {
        	Constant constant = constantPool.getConstant(i);
            if (constant == null)
                continue;
            if (constant.getTag() == 7) {
                String referencedClass = 
                    constantPool.constantToString(constant);
                //String output = String.format(classReferenceFormat,
                  //      referencedClass);
                //System.out.println(output);
                /*try {
					classOutputWriter.write(output);
					classOutputWriter.newLine();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}*/
                String className = clazz.getClassName();
                List<String> deps = classDepMap.get(className);
                if(deps == null) {
                	deps = new ArrayList<String>();
                	classDepMap.put(className, deps);
                }
                deps.add(referencedClass);
            }
        }
    }
    
    public void visitMethod(Method method) {
        MethodGen mg = new MethodGen(method, clazz.getClassName(), constants);
        //MethodVisitor visitor = new MethodVisitor(mg, clazz, methodOutputWriter);
        MethodVisitor visitor = new MethodVisitor(mg, clazz, methodDepMap, methodList,
        											classMethodRelMap);
        visitor.start(); 
    }

    public void start() {
        visitJavaClass(clazz);
    }
}
