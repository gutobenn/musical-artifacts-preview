const proxy = require('express-http-proxy');
const express = require('express');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer  = require('multer');
const fs = require('fs-extra');
var spawn = require('child-process-promise').spawn;

const upload = multer({ dest: 'uploads/' });
const app = express();

express.static.mime.define({'application/octet-stream': ['mp3']});

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

const currentDomain = 'https://preview-api.musical-artifacts.com';
// Lines below are useful for dev environment. On production we use nginx.
//const currentDomain = 'http://localhost:3000'
//app.use('/processed_files', express.static('processed_files');
//app.use('/guitarix.json', express.static('guitarix.json'));

let requests = {};
let queue = [];

function addOrder(mode, filename, artifact, preset) {
  const id = uuidv4();
  requests[id] = {
    mode,
    status: 'queue',
    artifact,
    preset,
    filename
  };
  queue.push(id);
  return id;
}

function processQueue(){
  if (queue.length > 0) {
    const request_id = queue.shift();
    console.log("Processing " + request_id);
    requests[request_id].status = 'processing';
    delete requests[request_id].position_in_queue;

    const relative_request_dir_path = 'processed_files/' + request_id;
    var promise = spawn('python3',
                  ['./scripts/process_audio.py',
                  requests[request_id].artifact,
                  requests[request_id].preset,
                  __dirname + '/uploads/' + requests[request_id].filename,
                  __dirname + '/processed_files/' + [request_id]]);

    var childProcess = promise.childProcess;
    console.log('[process_audio] childProcess.pid: ', childProcess.pid);

    childProcess.stdout.on('data', function (data) {
      console.log('[process_audio] stdout: ', data.toString());
    });
    childProcess.stderr.on('data', function (data) {
      console.log('[process_audio] stderr: ', data.toString());
    });

    promise.then(function () {
        console.log('[process_audio] done!');
        requests[request_id].processed_file = currentDomain + '/' + relative_request_dir_path + '/output.mp3';
        requests[request_id].status = 'done';
        processQueue();
      })
      .catch(function (err) {
        console.error('[process_audio] ERROR: ', err);
        requests[request_id].status = 'error';
        processQueue();
      });
  } else {
    setTimeout(processQueue, 1000);
  }
}

function timeOut(ms) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, ms);
  });
}

processQueue();

app.get('/requests', (req, res) => res.status(200).json({'requests': requests}));

app.get('/queue', (req, res) => res.status(200).json(queue));

app.post('/request', upload.single('file'), (req, res, next) => {
  if (!req.body || !req.body.mode) {
    return next({ status: 400, message: 'mode field is required' });
  } else if (req.body.mode !== "guitarix") {
    return next({ status: 400, message: 'mode field must have one of the following values: guitarix' });
  }
  if (!req.body || !req.body.artifact) {
    return next({ status: 400, message: 'artifact field is required' });
  }
  if (!req.body || !req.body.preset) {
    return next({ status: 400, message: 'preset field is required' });
  }
  if (!req.file && !req.body.filename) {
    return next({ status: 400, message: 'file or filename field is required' });
  }
  const filename = req.body.filename ? req.body.filename : req.file.filename;
  const id = addOrder(req.body.mode, filename, req.body.artifact, req.body.preset);
  res.status(200).json({ id, success: true });
});

app.get('/request/:id', (req, res) => {
  const result = requests[req.params.id]; // TODO verify if req.params.id exist
  if (!result) {
    return next({ status: 404, message: 'not found' });
  }
  if (result.status === 'queue') {
    result.position_in_queue = queue.indexOf(req.params.id) + 1;
  }
  res.status(200).json(result);
});

app.use((err, req, res, next) => {
  res.status(err.status).json(err);
});

app.listen(3000, () => console.log('API server listening on port 3000!'))
