// import crypto from "crypto";

// 서버를 만들기 위한  기본 세팅 3줄
const express = require('express')
const req = require('express/lib/request')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
// app.use(express.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.set('view engine', 'ejs')
require('dotenv').config()

// css 사용하려면
app.use('/public', express.static('public'))

var db
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function(error, client) {
  // 연결되면 할일
  if (error) return console.log(error)

  db = client.db('laundrycheck')

  app.listen(process.env.PORT, function() {
    console.log('listening on 8080')
  })
})

// 로그인
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// app.use() -> 미들웨어
// 웹서버는 요청-응답해주는 머신
// 미들웨어 : 요청-응답 중간에 뭔가 실행되는 코드
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

app.get('/login', function(req, res) {
  res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), function(req, res) {
  console.log('로그인 성공')
  res.redirect('/')
})

app.get('/fail', function(req, res) {
  res.redirect('/login')
  console.log('로그인 실패')
})

// 인증하는 방법을 Strategy라 칭함
// done() 함수의 파라미터는 3개가 올 수 있다.
// done(서버에러, 성공시사용자DB데이터, 에러메시지)
// 서버에러는 보통 ``if (에러) return done(에러)`` 이걸로 처리 가능하기에 null
// 성공시DB사용자데이터는 성공시 결과.  만약 아이디 비번이 틀리다면 false
// 에러메시지는 에러메시지

// 현재 코드는 보안이 쓰레기 비번 암호화 해야함
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번)
  db.collection('customer').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}))

// 세션 데이터 만들기

// id를 이용해서 세션을 저장시킴(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.id)
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요(마이페이지 접속 시 발동)
// deserializeUser() => 로그인 한 유저의 세션 아이디를 바탕으로 개인정보를 DB에서 찾는 역할
passport.deserializeUser(function (아이디, done) {  // 아이디는 위에 있는 user.id랑 같음
  db.collection('customer').findOne({id : 아이디}, function(에러, 결과) {
    done(null, 결과)
  })
}); 

// 회원가입
app.get('/signup', function(req, res) {
  res.render('signup.ejs')
})

app.post('/signup', function(req, res) {
  db.collection('customer').insertOne( { name: req.body.name, id: req.body.id, pw: req.body.pw, phone: req.body.phone }, function(error, result) {
    res.redirect('/login')
  })
})

// 로그인 후 세션이 있으면 req.user가 항상 있음
function 로그인했니(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.render('loginreq.ejs')
  }
}

// 메인페이지 이동
app.get('/', function(req, res) {
  res.render('index.ejs')
})

// 기기 현황 페이지 이동
app.get('/macStatus', function(req, res) {
  res.render('macstatus.ejs')
})

// 유의사항 페이지 이동
app.get('/caution', function(req, res) {
  res.render('caution.ejs')
})

// 웨이팅 등록 페이지 이동
app.get('/wait', 로그인했니, function(req, res) {
  console.log(req.user);

    //DB에서 데이터 꺼내기 - DB.counter 내의 대기인원수를 찾음
    db.collection('counter').findOne({name : '대기인원수'}, function(에러, 결과){
        console.log("/wait 대기인원수 : " + 결과.totalWait) //결과.totalWait = 대기인원수
        
        //찾은 데이터를 wait.ejs 안에 넣기
        //req.user를 사용자라는 이름으로, 결과를 counters라는 이름으로 보내기
        res.render('wait.ejs', {사용자 : req.user, counters : 결과})
    })
})

app.post('/wait', 로그인했니, function(req, res){
  //db에서 데이터 꺼내기 - db.counter에서 name이 대기인원수인 데이터 찾기
  db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과1){
    var 대기인원수 = 결과1.totalWait
    var 대기사용수 = 결과1.totalUse

    //db.waitinfo에 로그인한 유저의 id를 찾아서..
    db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과2){
      if(에러) return done(에러)

      //로그인한 유저가 waitinfo에 없거나 이전에 사용한 사람이라면.. 웨이팅 신청 가능으로 db에.waitinfo에 저장
      if(결과2 == null || 결과2.isUseWait == true) {
        //db 저장 - 웨이팅 신청 가능으로 db에.waitinfo에 저장 (_id : 총대기인원수+1로 새로운 데이터를 저장)
        db.collection('waitinfo').insertOne( {_id : 대기인원수 + 1, myNumber : 대기인원수 + 1,
          userid : req.user.id, wmac : 0, isUseWait : false} , function(에러, 결과){
          console.log('대기인원 데이터 저장완료');
    
          //db 수정 - db.counter 내의 totalWait이라는 항목도 +1 증가(총대기인원수+1)
          //operator 종류 : $set(변경), $inc(증가), $min(기존값보다 적을 때만 변경), $rename(key값 이름변경)
          db.collection('counter').updateOne({name: '대기인원수'}, {$inc: {totalWait:1} }, function(에러, 결과){
            if(에러){return console.log(에러)}
          })
        }) 
        res.redirect('/waitsuccess')
        console.log('웨이팅 신청성공')
      }
      else {
        res.redirect('/waitfail')
        console.log('웨이팅 신청실패')
      }
    })    
  })
})

// 웨이팅 확인 페이지 이동
app.get('/waitcheck', 로그인했니, function(req, res) {
  console.log(req.user)

  //db.waitinfo에 로그인한 유저의 id를 찾아서..
  db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과) {
      
    //로그인한 유저가 waitinfo에 없다면..
    if(결과 == null) {
      res.redirect('/waitrequest')
      console.log('웨이팅 신청 안하고 waitcheck한 경우');

      return
    }

    var 웨이팅사용여부 = 결과.isUseWait

    //사용한 회원 관리
    //웨이팅을 사용했다면.. 
    if(웨이팅사용여부){
      //db.counter 내의 totalWait -1 감소(대기인원수-1)
      db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalWait:-1} }, function(에러1, 결과) {
        if(에러1){return console.log(에러1)}

        //db.counter 내의 totalUse +1 증가(대기사용수+1)
        db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalUse:1} }, function(에러2, 결과) {
          if(에러2){return console.log(에러2)}

        })
      })

      res.redirect('/awaituse')
      console.log('웨이팅 사용 후 확인')

      //db.counter 내의 totalUse +1 증가(대기사용수+1)
      /*db.collection('counter').updateOne({name: '대기사용수'}, {$inc: {totalUse:1} }, function(에러, 결과){
          if(에러){return console.log(에러)}
      })
      res.redirect('/aftercheck')
      console.log('웨이팅 사용 후 확인');*/
    }
    else{
      res.redirect('/bwaituse')
      console.log('웨이팅 사용 전 확인')
    }
  })
})

// 웨이팅 신청 실패하면 뿌려주는 페이지
app.get('/waitalready', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('waitalready.ejs')
})

// 웨이팅 신청 성공하면 뿌려주는 페이지
app.get('/waitsuccess', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('waitsuccess.ejs')
})

// 웨이팅 등록하고 기기 작동시키기 전
// 본인 대기번호와 앞에 몊명 남았는지 확인 가능
app.get('/bwaituse', 로그인했니, function(req, res) {
  console.log(req.user)

  //db.waitinfo에 로그인한 유저의 id 찾기
  db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과1){
    var myNumber = 결과1.myNumber
    console.log("/bwaituse 본인웨이팅번호 : " + myNumber)

    //db.counter에서 name이 대기인원수인 데이터 찾기
    db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과2){
      var totalWait = 결과2.totalWait
      var totalUse = 결과2.totalUse
      var left = myNumber - totalUse - 1

      console.log("/bwaituse 대기인원수 : " + totalWait)
      console.log("/bwaituse 대기사용수 : " + totalUse)
      console.log("/bwaituse 앞에남은인원수 : " + left)

      //찾은 데이터를 beforecheck.ejs 안에 넣기
      //req.user를 사용자라는 이름으로 보내기
      res.render('bwaituse.ejs', {사용자 : req.user, 본인웨이팅번호 : 결과1, 대기사용수 : 결과2})
    })
  })
})

// 웨이팅 등록하고 기기 작동시킨 후
// 
app.get('/awaituse', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('awaituse.ejs')
})

// 웨이팅 등록 안하고 웨이팅 확인하면
app.get('/waitreq', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('waitreq.ejs')
})