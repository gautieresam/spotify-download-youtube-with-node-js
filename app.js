/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more inrformation, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

    var express = require('express'); // Express web server framework
    var request = require('request'); // "Request" library
    var cors = require('cors');
    var querystring = require('querystring');
    var cookieParser = require('cookie-parser');

    var client_id = ''; // Your client id
    var client_secret = ''; // Your secret
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
        exec('spotdl --playlist='+urlSpotify, (err, stdout, stderr) => {
            if (err) {
                console.error(err)
            } else {
    
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                reponseBash = `${stderr}`; 
                console.log(reponseBash);

    const nameFileDl = reponseBash.split(' '); // INFO: Writing 12 tracks to birthday-bob-sinclar.txt
    const sansLePointTxtnameFileDl= nameFileDl[5].split('.');
    var numeroUniquePlaylist = generateRandomString(20);
    var sansLePointTxtnameFileDlavecNumero=numeroUniquePlaylist;
    sansLePointTxtnameFileDlavecNumero=sansLePointTxtnameFileDlavecNumero.concat(sansLePointTxtnameFileDl[0]);
    copierColler(nameFileDl[5],numeroUniquePlaylist);
    creationRepertoirePlaylist(sansLePointTxtnameFileDlavecNumero);
    downloadMusicPlaylist(sansLePointTxtnameFileDlavecNumero);

    function downloadMusicPlaylist(fileName){
    
        exec('spotdl --folder ./playlists/'+fileName+' --list=./list/'+fileName+'.txt', (err, stdout, stderr) => {
           
            if (err) {
                console.error(err)
            } else {
                
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                createZip(fileName);
                console.log("envoyer mail");
                envoyerMail();
                SupprimerLaPlaylistDuRepertoire(fileName);
                supprimerLeFichierTxt(fileName); 
            }
        });
    }



    function supprimerLeFichierTxt(fileName){
        
        // Etape 1 : suppresion dans le repertoire list  
        console.log("Supprimer le fichier txt dans list")
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
            } else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        }); 
    }

    function copierColler(nameFile,numeroUnique){

        console.log(numeroUnique)
        console.log(nameFile)
    
        var currentPath ="";
        var newPath ="";

        // Enlever le retour chariot le remplacer par un espace 
        var nameFile2=nameFile.replace(/\n|\r|(\n\r)/g,' ');
        var nameFile=nameFile2;
        
        // Diviser le namefile par le caractere espace 
        nameFile2 = nameFile.split(' '); // INFO: Writing 12 tracks to birthday-bob-sinclar.txt
        
        // Recuperer que le nom sans l'espace : exemple a.txt<espace> 
        nameFile=nameFile2[0];

        // Creation de la source avec le numero unique 
        var src = currentPath.concat(nameFile);
        var tmp = newPath.concat("./list/");
        var tmpDest = tmp.concat(numeroUnique);

        var dest = tmpDest.concat(nameFile);

        // Affichage 
        console.log('currentPath :'+src);
        console.log('newPath :'+ dest);

        // Deplacement des fichiers 
        var moveFile = require('move-file');

        (async () => {
        await moveFile(src, dest);
        console.log('The file has been moved');
        })();

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
            text: 'Votre télèchargement est prêt ! Voici le lien ! 192.168.1.6:8888/'+lienUser+'.zip',
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
