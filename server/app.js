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

let orders = {};
let queue = [];

function addOrder(mode, file, artifact, preset) {
  const id = uuidv4();
  // success case, the file was saved
  orders[id] = {
    mode,
    status: 'queue',
    artifact,
    preset,
    filename: file.filename
  };
  queue.push(id);
  return id;
}

function processQueue(){
  if (queue.length > 0) {
    const order_id = queue.shift();
    console.log("Processing " + order_id);
    orders[order_id].status = 'processing';
    delete orders[order_id].position_in_queue;

    const relative_order_dir_path = 'processed_files/' + order_id;
    var promise = spawn('python3',
                  ['./scripts/process_audio.py',
                  orders[order_id].artifact,
                  orders[order_id].preset,
                  __dirname + '/uploads/' + orders[order_id].filename,
                  __dirname + '/processed_files/' + [order_id]]);

    var childProcess = promise.childProcess;
    console.log('[spawn] childProcess.pid: ', childProcess.pid);

    childProcess.stdout.on('data', function (data) {
      console.log('[spawn] stdout: ', data.toString());
    });
    childProcess.stderr.on('data', function (data) {
      console.log('[spawn] stderr: ', data.toString());
    });

    promise.then(function () {
        console.log('[spawn] done!');
        orders[order_id].processed_file = currentDomain + '/' + relative_order_dir_path + '/output.mp3';
        orders[order_id].status = 'done';
        processQueue();
      })
      .catch(function (err) {
        console.error('[spawn] ERROR: ', err);
        orders[order_id].status = 'error';
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

app.get('/orders', (req, res) => res.status(200).json({'orders': orders}));

app.get('/queue', (req, res) => res.status(200).json(queue));

app.post('/order', upload.single('file'), (req, res, next) => {
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
  if (!req.file) {
    return next({ status: 400, message: 'file field is required' });
  }
  const id = addOrder(req.body.mode, req.file, req.body.artifact, req.body.preset);
  res.status(200).json({ id, success: true });
});

app.get('/order/:id', (req, res) => {
  const result = orders[req.params.id]; // TODO verify if req.params.id exist
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
