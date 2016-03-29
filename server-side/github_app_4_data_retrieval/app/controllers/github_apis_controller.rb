class GithubApisController < ApplicationController
  def perform
	state = params[:state]
	repo = params[:repo]
	owner = params[:owner]
	page = params[:page]
	if repo.present? and owner.present? and page.present? and state.present? then	
		@resp = GithubApi.search(owner, repo, page, state)
	elsif repo.present? and owner.present? and page.present? then
		@resp = GithubApi.search(owner, repo, page)
	elsif repo.present? and owner.present? then
                @resp = GithubApi.search(owner, repo)	
	else
		@resp = GithubApi.search
	end
	render :json => @resp	
  end
end
