const express = require('express');
const path = require('path');
const fse = require('fs-extra');
const multiparty = require('multiparty');
const bodyParser = require('body-parser');

const app = express();
const UPLOAD_DIR = path.resolve(__dirname, '.', 'target');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const extractExt = (filename) =>
  filename.slice(filename.lastIndexOf('.'), filename.length);

const createUploadedList = async (fileHash) => {
  const fileDir = path.resolve(UPLOAD_DIR, fileHash);
  return fse.existsSync(fileDir) ? await fse.readdir(fileDir) : [];
};

const pipeStream = (chunkPath, writeStream) => {
  return new Promise((resolve) => {
    const chunkReadStream = fse.createReadStream(chunkPath);
    chunkReadStream.on('end', () => {
      fse.unlinkSync(chunkPath);
      resolve();
    });
    chunkReadStream.pipe(writeStream);
  });
};

const mergeFileChunks = async (targetFilePath, fileHash, chunkSize) => {
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
  const chunkNames = await fse.readdir(chunkDir);
  // 根据分片下表排序
  chunkNames.sort((a, b) => a.split('_')[1] - b.split('_')[1]);
  console.log(targetFilePath)

  await fse.writeFileSync(targetFilePath, '');

  await Promise.all(
    chunkNames.map((chunkName, index) => {
      const chunkPath = path.resolve(chunkDir, chunkName);
      return pipeStream(
        chunkPath,
        fse.createWriteStream(targetFilePath, {
          start: index * chunkSize,
        })
      );
    })
  );

  await fse.rmdir(chunkDir);
};

// 处理跨域
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// 解析请求体
app.use(bodyParser.json());

// 验证文件是否已上传过
app.post('/verify', async (req, res) => {
  const { fileHash, fileName } = req.body;

  const ext = extractExt(fileName);
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`);

  if (fse.existsSync(filePath)) {
    res.json({
      shouldUploadFile: false,
    });
  } else {
    res.json({
      shouldUploadFile: true,
      uploadedChunks: await createUploadedList(fileHash),
    });
  }
});

// 合并文件分片
app.post('/merge', async (req, res) => {
  const { fileHash, fileName, chunkSize } = req.body;
  const ext = extractExt(fileName);
  const targetFilePath = path.resolve(UPLOAD_DIR, `${fileName}`);
  await mergeFileChunks(targetFilePath, fileHash, chunkSize);

  res.json({
    code: 0,
    msg: `file ${fileName} merged.`,
  });
});

// 上传文件分片
app.post('/kk', (req, res) => {
  const multipart = new multiparty.Form();
  console.log('我进来了')

  multipart.parse(req, async (err, fields, files) => {
    if (err) {
      return;
    }
    const [chunk] = files.chunk;
    const [hash] = fields.hash;
    const [fileHash] = fields.fileHash;
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash);

    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }

    await fse.move(chunk.path, `${chunkDir}/${hash}`, { overwrite: true });
    res.status(200).send('received file chunk');
  });
});

// 启动服务器
app.listen(5000, () => console.log('listening 8080...'));
