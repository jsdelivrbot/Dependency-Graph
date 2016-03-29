var url = "http://hotelrapp-env1.me525pz7q2.us-west-2.elasticbeanstalk.com/hotels/find?ct=Toronto&st=ON&con=CA&arm=4&ard=14&ary=2016&dem=4&ded=16&dey=2016&oc=2&rescnt=1";
var representationOfDesiredState = "The cheese is old and moldy, where is the bathroom?";

var client = new XMLHttpRequest();

client.open("PUT", url, false);

client.setRequestHeader("Content-Type", "text/plain");

client.send();

if (client.status == 200)
    alert("The request succeeded!\n\nThe response representation was:\n\n" + client.responseText)
else
    alert("The request did not succeed!\n\nThe response status was: " + client.status + " " + client.statusText + ".");


var url = "http://hotelrapp-env1.me525pz7q2.us-west-2.elasticbeanstalk.com/hotels/find?ct=Toronto&st=ON&con=CA&arm=4&ard=14&ary=2016&dem=4&ded=16&dey=2016&oc=2&rescnt=1";
			var representationOfDesiredState = "The cheese is old and moldy, where is the bathroom?";

			var client = new XMLHttpRequest();

			client.open("PUT", url, false);

			client.setRequestHeader("Content-Type", "text/plain");

			client.send();

			if (client.status == 200)
				alert("The request succeeded!\n\nThe response representation was:\n\n" + client.responseText)
			else
				alert("The request did not succeed!\n\nThe response status was: " + client.status + " " + client.statusText + ".");
			}