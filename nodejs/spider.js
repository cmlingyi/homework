const https = require('https');
const cheerio = require('cheerio');
const querystring = require('querystring');
const fs = require('fs');

const api = 'https://huaban.com/explore/ocean/';
const picArr = [];
let page = 0;
const maxPage = 10;
let count = 0;
function getHTML(params) {
  page++;
  let paramsUrl = '';
  if (params) {
    paramsUrl = querystring.stringify(params);
  }
  https.get(api + '?' + paramsUrl, res => {
    res.setEncoding('utf-8');
    let data;
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      var $ = cheerio.load(data);
      var scriptStr = $('script').eq(17).html();
      var startIndex = scriptStr.indexOf('app.page["pins"] = ') + 'app.page["pins"] = '.length;
      var endIndex = scriptStr.indexOf('];', startIndex);
      var resultStr = scriptStr.slice(startIndex, endIndex + 1);
      var json = JSON.parse(resultStr);
      const len = json.length;
      const max = json[len - 1].pin_id;
      json.forEach(element => {
        const key = element.file.key;
        picArr.push(key);
      });
      const params = {
        max: max,
        limit: 20,
        wfl: 1
      };
      if (page <= maxPage) {
        console.log(`***获取第${page}页图片***`);
        getHTML(params);
      } else {
        console.log('图片获取完毕，正在下载...');
        downLoadImage();
      }
    }).on('error', e => {
      console.log('error: ' + e.message);
    });
  });
}

function downLoadImage() {
  const tag = '_fw236';
  picArr.forEach(element => {
    count++;
    let t = count;
    const url = 'https://hbimg.b0.upaiyun.com/' + element + tag;
    https.get(url, res => {
      res.setEncoding('binary');
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        fs.writeFile('./storage/' + t + '.jpeg', data, "binary", err => {
          if (err) {
            console.log(`****a.图片 ${url} 下载出错****`);
            console.log('error: ' + err.message);
          } else {
            console.log(`图片 ${url} 下载完毕`);
          }
        });
      }).on('error', e => {
        console.log(`****b.图片 ${url} 下载出错****`);
        console.log('error: ' + e.message);
      })
    })
  });
}

getHTML();