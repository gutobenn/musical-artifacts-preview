const proxy = require('express-http-proxy');
const express = require('express');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer  = require('multer');
const fs = require('fs-extra');
const { spawn } = require('child_process');

const upload = multer({ dest: 'uploads/' });
const app = express();

const currentDomain = 'http://localhost:3000'

express.static.mime.define({'application/octet-stream': ['mp3']});

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.use('/processed_files', express.static('processed_files'));
app.use('/guitarix.json', express.static('guitarix.json'));

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

async function processQueue(){
  while (order_id = queue.shift()) {
    console.log("Processing " + order_id);
    orders[order_id].status = 'processing';
    delete orders[order_id].position_in_queue;

    let relative_order_dir_path = 'processed_files/' + order_id;
    // TODO handle errors here. check success. set a timeout? include an 'error' status
      const cp = spawn('python3',
                  ['./python_scripts/process_audio.py',
                  orders[bk_order_id].artifact,
                  orders[bk_order_id].preset,
                  __dirname + '/uploads/' + orders[bk_order_id].filename,
                  __dirname + '/processed_files/' + bk_order_id]);
      cp.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
      });
      cp.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
      });
      cp.on('exit', console.log.bind(console, 'exited'));
      cp.on('close', console.log.bind(console, 'closed'));
      // TODO check exitcode
      orders[bk_order_id].processed_file = currentDomain + '/' + relative_order_dir_path + '/output.mp3';
      orders[bk_order_id].status = 'done';
    }
    lala(order_id);
  }
  setTimeout(processQueue, 1000);
}

function timeOut(ms) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, ms);
  });
}

processQueue();

app.get('/orders', (req, res) => res.status(200).json({'orders': orders}));

app.get('/queue', (req, res) => res.status(200).json(queue));

// Request processing. receive mode = midi | guitar, recebe links dos artefatos pra testar, return uuid
app.post('/order', upload.single('file'), (req, res, next) => {
  if (!req.body || !req.body.mode) {
    return next({ status: 400, message: 'mode field is required' });
  } else if (req.body.mode !== "guitar") {
    return next({ status: 400, message: 'mode field must have one of the following values: guitar' });
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
