// Load the http module to create an http server
var http = require('http');

// Load the Q module for promises
var Q = require("q");

// Load the WordNet module for later dictionary lookups
var WordNet = require('node-wordnet');
var wordNet = new WordNet();

//array for interpretted words
var interpretted = {};

// Create a function to handle every HTTP request
function handler(req, res){

      var form = '';

      if(req.method == "GET"){
            form = '\
<!doctype html> \
<html lang="en"> \
<head> \
    <meta charset="UTF-8">  \
    <title>Form Calculator Add Example</title> \
</head> \
<body> \
<input type="text" name="A" id="A" onkeyup="test()" method="post">  \
<span id="result"> </span> \
<script> \
    function test() { \
        var a = document.getElementById("A").value; \
        \
        xmlhttp = new XMLHttpRequest(); \
        xmlhttp.onreadystatechange=function(){ \
        if(xmlhttp.readyState==4 && xmlhttp.status==200){ \
            document.getElementById("result").innerHTML=xmlhttp.responseText; \
        }; \
    }; \
    xmlhttp.open("POST","",true); \
    xmlhttp.send(a); \
    } \
    function ajax(){ \
        var a = document.getElementById("A").value; \
        var formdata = "A="+a; \
        \
        xmlhttp = new XMLHttpRequest(); \
        xmlhttp.onreadystatechange=function(){ \
        if(xmlhttp.readyState==4 && xmlhttp.status==200){ \
            document.getElementById("result").innerHTML=xmlhttp.responseText; \
        }; \
    }; \
    xmlhttp.open("POST","",true); \
    xmlhttp.send(formdata); \
    return false; \
} \
</script> \
</body> \
</html>';
          //respond
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(form);

    } else if(req.method == 'POST'){

        //read form data
        req.on('data', function(chunk) {

            //grab form data as string
            var a = chunk.toString();

            if(a.substr(a.length-1) === ' ') {
                //get user input
                var raw = a.split(" ").slice(0, -1);

                //populated interpretted using raw array
                promisesArr = new Array(raw.length);
                interpretted = new Array();

                for(var i = 0; i < raw.length; i++) {
                    promisesArr[i] = synonymize(raw[i]);
                }
                Q.allSettled(promisesArr).then(function(results) {
                    results.forEach(function(result) {
                        if(result.state === "fulfilled") {
                            interpretted.push(result.value);
                        } else {
                            interpretted.push(result.reason);
                        }
                    });

                    //convert interpretted to a printable string
                    var interprettedStr = "";
                    for(var i = 0; i < interpretted.length; i++) {
                        interprettedStr += interpretted[i] + " ";
                    };
                    var result = interprettedStr;

                    //fill in the result and form values
                    form = result.toString();

                    //update raw
                    raw = a.split(" ");

                    //respond
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(form);

                    //exit
                    return;
                });
                return;
            };

            //respond
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(form);

        });

      } else {
        res.writeHead(200);
        res.end();
      };

    };

    // Create a server that invokes the `handler` function upon receiving a request
    http.createServer(handler).listen(8000, function(err){
      if(err){
        console.log('Error starting http server');
      } else {
        console.log("Server running at http://127.0.0.1:8000/ or http://localhost:8000/");
      };
});

function synonymize(word) {
    var deferred = Q.defer();
    var synonym = word;
    var synonyms = new Array();
    //call lookup method on word
    wordNet.lookup(word,/* ERROR FLAG (not working)
        function() {
            callback(word);
        },*/
    function(results) {
        results.forEach(function(result) {
            result.synonyms.forEach(function(synonym) {
                if(synonym != word) {
                    synonyms.push(synonym);
                };
            });
        });
        //if there are no synonyms other than the word itself, pass back the word as a failure
        if(synonyms[0] === undefined) {
            deferred.reject(word);
            return deferred.promise;
        }
        //else pass back a random synonym as a success
        synonym = synonyms[Math.floor(Math.random() * synonyms.length)].replace("_", " ").replace("-", " ");
        deferred.resolve(synonym);
    });
    return deferred.promise;
};
