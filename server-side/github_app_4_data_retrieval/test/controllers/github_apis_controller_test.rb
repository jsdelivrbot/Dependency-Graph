require 'test_helper'

class GithubApisControllerTest < ActionController::TestCase
  test "should get perform" do
    get :perform
    assert_response :success
  end

end
