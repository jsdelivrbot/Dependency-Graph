package gr.gousiosg.javacg.stat;

public class Method2MethodMapping2 {
	private String fromClass;
	private String fromMethod;
	private String toClass;
	private String toMethod;
	
	public Method2MethodMapping2(String fromClass,
	 							String fromMethod,
	 							String toClass,
	 							String toMethod) {
		this.fromClass = fromClass;
		this.fromMethod = fromMethod;
		this.toClass = toClass;
		this.toMethod = toMethod;
	}
	
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("{from_class:");
		builder.append(fromClass);
		builder.append(",");
 		builder.append("from_method:");
 		builder.append(fromMethod);
 		builder.append(","); 
 		builder.append("to_class:");
 		builder.append(toClass);
 		builder.append(","); 
 		builder.append("to_method:"); 
 		builder.append(toMethod);
 		builder.append("}");
		return builder.toString();
	}
	
	public String getFromClass() {
		return fromClass;
	}
	public void setFromClass(String fromClass) {
		this.fromClass = fromClass;
	}
	public String getFromMethod() {
		return fromMethod;
	}
	public void setFromMethod(String fromMethod) {
		this.fromMethod = fromMethod;
	}
	public String getToClass() {
		return toClass;
	}
	public void setToClass(String toClass) {
		this.toClass = toClass;
	}
	public String getToMethod() {
		return toMethod;
	}
	public void setToMethod(String toMethod) {
		this.toMethod = toMethod;
	}
}
