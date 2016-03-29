class AddProjectOwnerToGithubData < ActiveRecord::Migration
  def change
	 add_column :github_pullrequests, :project_owner, :string
  end
end
