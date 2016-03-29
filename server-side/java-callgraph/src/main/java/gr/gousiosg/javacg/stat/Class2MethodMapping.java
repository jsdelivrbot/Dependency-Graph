package gr.gousiosg.javacg.stat;

public class Class2MethodMapping {
	private String type;
	private String id;
	private String parent;
	private String number = "0";
	private String name;
	private String fullName;
	
	public Class2MethodMapping(String type, String id, String parent, 
			String number, String name, String fullName) {
		this.type = type;
		this.id = id;
		this.parent = parent;
		this.number = number;
		this.name = name;
		this.fullName = fullName;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("{");
		builder.append("\"type\":");
		builder.append("\"");
		builder.append(type);
		builder.append("\"");
		builder.append(",");
		builder.append("\"id\":");
		builder.append("\"");
		builder.append(id);
		builder.append("\"");
		builder.append(",");
		builder.append("\"parent\":");
		if(parent != null) {
			builder.append("\"");
		}
		builder.append(parent);
		if(parent != null) {
			builder.append("\"");
		}
		builder.append(",");
		builder.append("\"number\":");
		builder.append("\"");
		builder.append(number);
		builder.append("\"");
		builder.append(",");
		builder.append("\"name\":");
		builder.append("\"");
		builder.append(name);
		builder.append("\"");
		builder.append(",");
		builder.append("\"full_name\":");
		builder.append("\"");
		builder.append(fullName);
		builder.append("\"");
		builder.append("}");
		return builder.toString();
	}
	
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getParent() {
		return parent;
	}
	public void setParent(String parent) {
		this.parent = parent;
	}
	public String getNumber() {
		return number;
	}
	public void setNumber(String number) {
		this.number = number;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getFullName() {
		return fullName;
	}
	public void setFullName(String fullName) {
		this.fullName = fullName;
	}
}