package gr.gousiosg.javacg.stat;

public class Method2MethodMapping {
	private String source;
	private String target;
	private String value="0";
	
	public Method2MethodMapping(String source, String target, String value) {
		this.source = source;
		this.target = target;
		this.value = value;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("{");
		builder.append("\"source\":");
		builder.append("\"");
		builder.append(source);
		builder.append("\"");
		builder.append(",");
 		builder.append("\"target\":");
 		builder.append("\"");
 		builder.append(target);
 		builder.append("\"");
 		builder.append(","); 
 		builder.append("\"value\":");
 		builder.append("\"");
 		builder.append(value);
 		builder.append("\"");
 		builder.append("}");
		return builder.toString();
	}
	
	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	public String getTarget() {
		return target;
	}

	public void setTarget(String target) {
		this.target = target;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}
	
}
