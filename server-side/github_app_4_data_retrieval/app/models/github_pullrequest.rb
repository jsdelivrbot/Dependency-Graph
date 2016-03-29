class GithubPullrequest < ActiveRecord::Base
	has_many :github_files
end
