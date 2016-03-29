class CreateGithubPullrequests < ActiveRecord::Migration
  def change
    create_table :github_pullrequests do |t|
      t.string :title
      t.string :number
      t.string :state

      t.timestamps null: false
    end
  end
end
