/* eslint-disable no-restricted-globals */
self.importScripts('../spark-md5.min.js');

self.onmessage = (e) => {
	const { fileChunks } = e.data;
	const spark = new self.SparkMD5.ArrayBuffer();

	// 定义一个计算进度 percentage 和计数器 count，用于计算和显示上传进度。
	let percentage = 0,
		count = 0;

	// 递归读取文件分片，计算 MD5 值
	const loadNext = (index) => {
		const reader = new FileReader();
		// 读取文件分片
		reader.readAsArrayBuffer(fileChunks[index].fileChunk);
		reader.onload = (e) => {
			// 累加计数器 count
			count++;
			// 将分片的 ArrayBuffer 数据添加到 spark 对象中
			spark.append(e.target.result);
			// 如果所有文件分片都已经读取完成，则计算 MD5 值，将结果和上传进度 percentage（设为 100）一起发送回主线程。
			if (count === fileChunks.length) {
				self.postMessage({
					percentage: 100,
					hash: spark.end(),
				});
				self.close();
			} else {
				// 如果还有文件分片未读取，则计算上传进度 percentage（按照已读取的文件分片数计算），
				// 将结果发送回主线程，并递归调用 loadNext 函数，读取下一个文件分片。
				percentage += 100 / fileChunks.length;
				self.postMessage({
					percentage,
				});

				loadNext(count);
			}
		};
	};

	loadNext(0);
};
