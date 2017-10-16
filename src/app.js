const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const superagent = require('superagent');
const cheerio = require('cheerio');

const STATUS_USER_ERROR = 422;

const myFillArr = [];
const myUrls = [];
const textsArr = [];

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());

server.get('/', (req, res) => {
  const url = 'https://www.poemhunter.com/william-shakespeare/poems/';
  superagent
    .get(url)
    .query()
    .end((err, response) => {
      if (err) {
        res.json({
          confirmation: 'fail',
          message: err
        });
        return;
      }

      $ = cheerio.load(response.text);
      $('td').each((i, elem) => {
        let className = elem.attribs.class;
        if (className === 'title') {
          myFillArr.push(elem);
        }
      });
      for (let i = 0; i < myFillArr.length; i++) {
        myUrls.push(myFillArr[i].children[1].attribs.href);
      }
    });

  for (let i = 2; i < 12; i++) {
    superagent
      .get(
        `https://www.poemhunter.com/william-shakespeare/poems/page-${i}/?a=a&l=3&y=`
      )
      .query()
      .end((err, response) => {
        if (err) {
          res.json({
            confirmation: 'fail',
            message: err
          });
          return;
        }

        const pageElemArr = [];

        $ = cheerio.load(response.text);
        $('td').each((k, elem) => {
          let className = elem.attribs.class;
          if (className === 'title') {
            pageElemArr.push(elem);
          }
        });
        for (let j = 0; j < pageElemArr.length; j++) {
          myUrls.push(pageElemArr[j].children[1].attribs.href);
        }
      });
  }

  res.json(myUrls);
});

server.get('/verify', (req, res) => {
  res.json({ urlLength: myUrls.length });
});

server.get('/parse', (req, res) => {
  for (let i = 0; i < myUrls.length; i++) {
    superagent
      .get(`https://www.poemhunter.com${myUrls[i]}`)
      .query()
      .end((err, response) => {
        if (err) {
          /* res.json({
            confirmation: 'fail',
            message: err
          }); */
          return;
        }

        const pageElemArr = [];

        $ = cheerio.load(response.text);
        $('div').each((k, elem) => {
          let className = elem.attribs.class;
          if (className === 'KonaBody') {
            pageElemArr.push(elem);
          }
        });
        if (pageElemArr[0].children[7]) {
          let childrenArr = pageElemArr[0].children[7].children;
          let filteredChildren = childrenArr.filter(child => {
            return child.type === 'text';
          });
          let textRes = filteredChildren.reduce((prev, curr) => {
            return prev + curr.data;
          }, '');
          if (!textsArr.includes(textRes)) {
            textsArr.push(textRes);
          }
        }
      });
  }
  res.json({ nicelyDone: 'nice!' });
});

server.get('/texts', (req, res) => {
  res.json({ texts: textsArr });
});

// TODO: your code to handle requests

server.listen(3000);
