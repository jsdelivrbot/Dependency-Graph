class FixColumnName < ActiveRecord::Migration
  def change
	rename_column :github_files, :github_pullrequests_id, :github_pullrequest_id
  end
end
