// Load the http module to create an http server
var http = require('http');

// Load the WordNet module for later dictionary lookups
var WordNet = require('node-wordnet');
var wordNet = new WordNet();

//array to hold raw input
var raw = {};
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
                //make sure the existing words haven't changed
                var temp = a.split(" ");
                /*console.log("Raw: \n" + raw);
                console.log("Temp: \n" + temp);
                for(var i = 0; i < raw.length; i++) {
                    if(temp[i] !== raw[i]) {
                            console.log("SOMETHINGS CHANGED");
                    };
                };*/

                //populated interpretted using temp array
                interpretted = new Array(temp.length-1);
                console.log("temp: " + temp);
                for(var i = 0; i < temp.length-1; i++) {
                    synonymize(temp[i], function(result) {
                        interpretted[i] = result;
                        console.log(interpretted[i]);
                    });
                    console.log(interpretted[i]);
                };
                console.log("interpretted: " + interpretted);

                //convert interpretted to a printable string
                var interprettedStr = "";
                for(word in interpretted) {
                    interprettedStr = word + " ";
                };

                var result = interprettedStr;

                /*synonymize(a, function(result) {
                    console.log(result);
                });*/
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

function synonymize(word, callback) {
    var synonym = word;
    var synonyms = new Array();
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
        if(synonyms[0] === undefined) {
            return;
        }
        synonym = synonyms[Math.floor(Math.random() * synonyms.length)].replace("_", " ");
        callback(synonym);
    });
};
