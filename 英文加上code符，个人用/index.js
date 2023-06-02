const fs = require('fs');
const text = fs.readFileSync('text.txt', 'utf8');

const pattern = /(^|\W)([a-zA-Z]+)($|\W)/gi; // 匹配所有单词的正则表达式
const result = text.trim().replace(pattern, '$1`$2`$3'); // $& 表示匹配到的单词
// console.log(result); // 输出：`This` `is` `a` `sample` `text` `containing` `some` `English` `words`.
fs.writeFile('text.txt', result, (err) => {
    if (err) throw err;
    console.log('文件已保存');
});