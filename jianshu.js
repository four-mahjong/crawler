var express = require('express');
var url = require('url');    //解析操作URL
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var async = require('async');
var targetUrl = 'http://www.jianshu.com/';

var app = express();

app.get('/',function (req, res, next){
  superagent.get(targetUrl)
      .end(function (err, sres) {
          var topicUrls = [];
          if (err) {
              return console.error(err);
          }
          // console.log(sres.text);
          var $ = cheerio.load(sres.text);
          // 获取首页所有的链接
          $('#list-container .title a').each(function(index,element) {
            var $element = $(element);
            var href = url.resolve(targetUrl, $element.attr('href'));
              topicUrls.push(href);
          });
          // console.log(topicUrls);
          // res.send(topicUrls);

          var ep = new eventproxy;
          ep.after('topic_html',topicUrls.length,function(topics){
            topics = topics.map(function(topicPair){
              var topicUrl = topicPair[0];
              var topicHtml = topicPair[1];

              var $ = cheerio.load(topicHtml);
              return({
                title: $('.preview .title').text().trim(),
                href: topicUrl,
                author: $('.preview .author-name span').text().trim(),
                finishTime: $('.preview .author-info span').eq(3).text().trim()
              });
            });
            console.log(topics);
            res.send(topics);
          });
          topicUrls.forEach(function(topicUrl){
            superagent.get(topicUrl)
              .end(function(err, res){
                ep.emit('topic_html',[topicUrl,res.text])
              });
          });

      });
});

app.listen(3000, function (req, res) {
  console.log('app is running at port 3000');
});
