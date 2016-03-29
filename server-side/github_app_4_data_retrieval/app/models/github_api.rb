require_relative 'github_data'

class GithubApi 
	include HTTParty	

	format :json

	def self.search (owner="square", repo="retrofit", page="1", state="all")
	
		client_id="c1b241798968e6e512e7"
		client_secret="5b1f08515c050136b7c042cbf08ef42c002f02c0"

		base_uri_rest = "https://api.github.com/repos/" + owner +"/" + repo + "/pulls" 		
		json_output = get(base_uri_rest, query: {
				"state" => state,
				"client_id" => client_id,
				"client_secret" => client_secret,
				"per_page" => "100",
				"page" => page		
				})

		puts json_output

	    @github_data_arr = Array.new		
		@tags = JSON.parse(json_output.body)
		@tags.each do |item| 
			g1 = GithubData.new
			g1.title = item["title"]
			g1.number = item["number"]
			g1.state = item["state"]
			g1.files = []
			@github_data_arr.push(g1)
			#puts g1 
		end

		@github_data_arr.each do |d|
			pull_req_data = get(base_uri_rest + "/" + d.number.to_s + "/files", query: {
				"client_id" => client_id,
				"client_secret" => client_secret,
                                "per_page" => "100"
				})

			@pull_rd = JSON.parse(pull_req_data.body)
			@pull_rd.each do |e|
				d.files.push(e["filename"])
			end	
		end	

		@github_data_arr.each do |d1|
			puts d1.title
			puts d1.number
			puts d1.state
			puts d1.files
			puts "----------------------"
		end
		
		@github_data_arr.each do |d1|
                        @gp1 = GithubPullrequest.new(title: d1.title, number: d1.number, state: d1.state, project_name: repo, project_owner: owner)  
		        @gp1.save 
			d1.files.each do |f|
				@gp1.github_files.create!(filename: f)
			end
                end	
	end

	
end

