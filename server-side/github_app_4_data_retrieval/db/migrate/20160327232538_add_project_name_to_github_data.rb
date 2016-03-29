class AddProjectNameToGithubData < ActiveRecord::Migration
  def change
	add_column :github_pullrequests, :project_name, :string
  end
end
