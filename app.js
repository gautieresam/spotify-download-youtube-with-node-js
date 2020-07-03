
    var express = require('express'); // Express web server framework
    var request = require('request'); // "Request" library
    var cors = require('cors');
    var querystring = require('querystring');
    var cookieParser = require('cookie-parser');

    var client_id = '712d661608f94d3e916982f83b9e6f36'; // Your client id
    var client_secret = 'b1505158b78942a6b167f93f3c2a4434'; // Your secret
    var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri


    var exec = require('child_process').exec, child;
    var nodemailer = require('nodemailer');
    var moveFile = require('move-file');
    var fs = require('fs');
    var fc = require('fs-extra');
    var path = require('path');
    var archiver = require('archiver');
    var zipper = require('zip-local');
    var lienUser;

/**
*   Generates a random string containing numbers and letters
*   @param  {number} length The length of the string
*   @return {string} The generated string
*/
    var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    };

    var stateKey = 'spotify_auth_state';

    var app = express();

    app.use(express.static(__dirname + '/public'))
        .use(cors())
        .use(cookieParser());


    app.get('/login', function(req, res) {

        var state = generateRandomString(16);
        res.cookie(stateKey, state);

        // your application requests authorization
        var scope = 'user-read-private user-read-email';
        res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
    });


    app.get('/callback', function(req, res) {

        var code = req.query.code || null;
        var state = req.query.state || null;
        var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {

        res.redirect('/#' +
            querystring.stringify({
            error: 'state_mismatch'
        }));

      } else {
      res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

    request.post(authOptions, function(error, response, body) {

    if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
        refresh_token = body.refresh_token;

        var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        res.redirect('/#' +
            querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));

            } else {
                res.redirect('/#' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
            }
        });
    }
});

app.get('/refresh_token', function(req, res) {

    var refresh_token = req.query.refresh_token;
    var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    },
    json: true
    };

    request.post(authOptions, function(error, response, body) {

    if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
            'access_token': access_token
        });
    }});
});

app.get('/dlplaylist', function(req, res) {

    var refresh_token = req.query.refresh_token;
    var authOptions = {

        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
            },
        json: true
    };

    var urlSpotify = req.query.uri;
    var dataUser = req.query.dataUser;
    var lienDeDl;

    const { exec } = require('child_process');

        // Creation d'un fichier qui est dans le repertoire courant.
        // Le fichier contient la liste des musiques sous le format :
        // https://open.spotify.com/track/5csnxERQgKm1eAEvJI7NRw
        // La commande exec crée un processus fils et lance la commande spotdl.

        exec('spotdl --playlist='+urlSpotify, (err, stdout, stderr) => {
            if (err) {

                console.error(err)
                // Traiter le cas avec une erreur.

            } else {
                console.log(urlSpotify)
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                reponseBash = `${stderr}`;
                console.log(reponseBash);

                // Si il n'y a pas d'erreur spotdl retourne ceci : "NFO: Writing 12 tracks to <nomDeLaPlaylist>.txt"
                const nameFileDl = reponseBash.split(' '); // INFO: Writing 12 tracks to birthday-bob-sinclar.txt

                const sansLePointTxtnameFileDl= nameFileDl[5].split('.'); // On isole le <nomDeLaPlaylist> sans l'extension

                // Creation d'un numero unique, si 2 personnes veulent télècharger une playlist avec un même nom.
                var numeroUniquePlaylist = generateRandomString(20);



                // Création d'une variable sous le format : <numeroUnique><nomDeLaPlaylist>
                var sansLePointTxtnameFileDlavecNumero=numeroUniquePlaylist;
                sansLePointTxtnameFileDlavecNumero=sansLePointTxtnameFileDlavecNumero.concat(sansLePointTxtnameFileDl[0]);

                console.log("sansLePointTxtnameFileDlavecNumero")
                console.log(sansLePointTxtnameFileDlavecNumero);

                // Le fichier créé par spotdl est déplacé dans list
                copierColler(nameFileDl[5],numeroUniquePlaylist); // good

                // Un repertoire dans playlist va être créé.
                // Format du nom du repertoire : <numeroUnique><nomDeLaPlaylist>
                creationRepertoirePlaylist(sansLePointTxtnameFileDlavecNumero);

                // Télèchargement
                downloadMusicPlaylist(sansLePointTxtnameFileDlavecNumero);

// Revoir indentation

    function downloadMusicPlaylist(fileName){

          exec('spotdl --list=./list/'+fileName+'.txt -f ./playlists/'+fileName, (err, stdout, stderr) => {


            if (err) {
                console.log("error spotdl --folder ./playlists/.....")
                console.error(err)
            } else {

                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                createZip(fileName);
                envoyerMail();
                SupprimerLaPlaylistDuRepertoire(fileName);
                supprimerLeFichierTxt(fileName);
            }
        });
    }



    function supprimerLeFichierTxt(fileName){

        // Etape 1 : suppresion dans le repertoire list
        console.log("Supprimer le fichier txt dans list")
        console.log(fileName)
        const { exec } = require('child_process');
        exec('rm ./list/'+fileName+'.txt', (err, stdout, stderr) => {

            if (err) {
                //some err occurred
                console.error(err)
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });


    }


    function creationRepertoirePlaylist(nameFile){

        const { exec } = require('child_process');
        exec('mkdir ./playlists/'+nameFile, (err, stdout, stderr) => {

            if (err) {
                //some err occurred
                console.error(err)
                // Gérer le cas ou il y a une erreur..
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });
    }

    function copierColler(nameFile,numeroUnique){

        console.log("function copierColler")
        console.log(numeroUnique)
        console.log(nameFile)

        var currentPath ="";
        var newPath ="";

        // Enlever le retour chariot le remplacer par un espace
        var nameFile2=nameFile.replace(/\n|\r|(\n\r)/g,' ');
        var nameFile=nameFile2;

        // Diviser le namefile par le caractere espace
        nameFile2 = nameFile.split(' '); // INFO: Writing 12 tracks to birthday-bob-sinclar.txt

        // Recuperer que le nom sans l'espace : exemple a.txt.<espace>
        nameFile=nameFile2[0];

        // Il faut Enlever le point après le mot "txt"
        nameFile=nameFile2[0].substring(0,nameFile2[0].length-1);

        // Creation de la source avec le numero unique
        var src = currentPath.concat(nameFile);
        var tmp = newPath.concat("./list/");
        var tmpDest = tmp.concat(numeroUnique);

        var dest = tmpDest.concat(nameFile);

        // Affichage
        console.log('currentPath :'+src);
        console.log('newPath :'+ dest);

        const { exec } = require('child_process');
        exec('cp '+src+' '+dest, (err, stdout, stderr) => {

            if (err) {
                //some err occurred
                console.error(err)
                // Gérer le cas ou il y a une erreur..
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });

        console.log("Supprimer le fichier txt dans list")

        console.log("fileNameCopy="+src)
        exec('rm '+src, (err, stdout, stderr) => {

            if (err) {
                //some err occurred
                console.error(err)
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });



    }

    function createZip(fileName){

        var nameZip = generateRandomString(25);

        zipper.sync.zip('./playlists/'+fileName).compress().save('./public/'+nameZip+'.zip');

        lienUser=nameZip;
    }

    function envoyerMail(){

        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'spotifyappdl@gmail.com',
                pass: 'gautierspotify'
            }
        });

        var mailOptions = {
            from: 'spotifyappdl@gmail.com',
            to: 'gautieresam@gmail.com',
            subject: 'spotifyappdl votre télèchargement est prêt ! ',
            text: 'Votre télèchargement est prêt ! Voici le lien ! 192.168.1.7:8888/'+lienUser+'.zip',
        };

        transporter.sendMail(mailOptions, function(error, info){

            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                console.log(lienUser);
            }
        })

        transporter.close();
    }


    function SupprimerLaPlaylistDuRepertoire(fileName) {

        console.log("Function SupprimerLaPlaylistDuRepertoire etape 1 :")

        // Etape 1 : supprimer le contenu du repertoire dans le repertoire playlist/<mon_rep_à_supp>/*

        const { exec } = require('child_process');
        exec('rm  playlists/'+fileName+'/*', (err, stdout, stderr) => {
            if (err) {
                //some err occurred
                console.error(err)
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });

        // Etape 2 : supprimer le repertoire
        console.log("Function SupprimerLaPlaylistDuRepertoire etape 2 :")

        exec('rmdir  playlists/'+fileName, (err, stdout, stderr) => {
            if (err) {
                //some err occurred
                console.error(err)
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        });
    }

}});

    request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
            'access_token': access_token,
            'urlSpotify':urlSpotify,
        });
    }});
});

console.log('Listening on 8888');
app.listen(8888);
