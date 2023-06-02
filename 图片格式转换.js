const fs = require('fs');
const mineType = require("mime-types");
// url为图片在本地的存储路径
function imgToBase64(url) {
	try {
		let imgurl = url;
		let imageData = fs.readFileSync(imgurl); //从根目录访问
		if (!imageData) return "";
		let bufferData = Buffer.from(imageData).toString("base64");
		let base64 = "data:" + mineType.lookup(imgurl) + ";base64," + bufferData;
		return base64;
	} catch (error) {
		return "";
	}
}