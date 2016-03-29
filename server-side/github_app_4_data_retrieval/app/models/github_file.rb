class GithubFile < ActiveRecord::Base
  belongs_to :github_pullrequests
end
