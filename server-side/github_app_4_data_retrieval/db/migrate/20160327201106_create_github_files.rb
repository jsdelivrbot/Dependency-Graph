class CreateGithubFiles < ActiveRecord::Migration
  def change
    create_table :github_files do |t|
      t.text :filename
      t.references :github_pullrequests, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
