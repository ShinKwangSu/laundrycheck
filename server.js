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
const cookies = require('cookie-parser');

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
const { render } = require('express/lib/response')
const connect = require('passport/lib/framework/connect')

// app.use() -> 미들웨어
// 웹서버는 요청-응답해주는 머신
// 미들웨어 : 요청-응답 중간에 뭔가 실행되는 코드
app.use(session({
  secret : '비밀코드', 
  resave : true, 
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); 

app.get('/login', function(req, res) {
  res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/login'
}), function(req, res) {
  console.log('로그인 성공')
  req.session.nickname = req.body.id
  req.session.save(function() {
    res.redirect('/')
  })
})

// app.get('/fail', function(req, res) {
//   res.redirect('/login')
//   console.log('로그인 실패')
// })

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

// 로그아웃
app.get('/logout', function(req, res) {
  req.logout()
  
  req.session.save(function () {
    res.clearCookie('connect.sid')
    res.redirect('/')
  })
})

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
    return true
  } else {
    res.render('loginreq.ejs')
  }
}

// 메인페이지 이동
app.get('/', function(req, res) {
  if (!req.session.nickname) {
    res.render('index.ejs', {session: "true"});
  }
  else {
    res.render('index.ejs', {session: "false"});
  }
  // res.render('index.ejs')
})

// 기기 현황 페이지 이동
app.get('/macStatus', function(req, res) {
  if (!req.session.nickname) {
    res.render('macstatus.ejs', {session: "true"});
  }
  else {
    res.render('macstatus.ejs', {session: "false"});
  }
  // res.render('macstatus.ejs')
})

// 유의사항 페이지 이동
app.get('/caution', function(req, res) {
  if (!req.session.nickname) {
    res.render('caution.ejs', {session: "true"});
  }
  else {
    res.render('caution.ejs', {session: "false"});
  }
  // res.render('caution.ejs')
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

/*
app.post('/wait', 로그인했니, function(req, res){
  //db에서 데이터 꺼내기 - db.counter에서 name이 대기인원수인 데이터 찾기
  db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과1){
    var 대기인원수 = 결과1.totalWait
    var 대기사용수 = 결과1.totalUse

    //db.waitinfo에 로그인한 유저의 id를 찾아서.. --------> find()로 변경해야할듯 
    db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과2){
      if(에러) return done(에러)

      //로그인한 유저가 waitinfo에 없거나 이전에 사용한 사람이라면.. 웨이팅 신청 가능으로 db에.waitinfo에 저장
      if(결과2 == null || 결과2.isUseWait == true) {

        console.log(결과2)

        //db 저장 - 웨이팅 신청 가능으로 db에.waitinfo에 저장 (_id : 총대기인원수+1로 새로운 데이터를 저장)
        db.collection('waitinfo').insertOne( {_id : 대기인원수 + 1, myNumber : 대기인원수 + 1,
          userid : req.user.id, wmac : 0, isUseWait : false} , function(에러, 결과){
          console.log('대기인원 데이터 저장완료');
          console.log(결과);

    
          //db 수정 - db.counter 내의 totalWait이라는 항목도 +1 증가(총대기인원수+1)
          //operator 종류 : $set(변경), $inc(증가), $min(기존값보다 적을 때만 변경), $rename(key값 이름변경)
          db.collection('counter').updateOne({name: '대기인원수'}, {$inc: {totalWait:1} }, function(에러, 결과){
            if(에러){return console.log(에러)}
          })
        })

        res.redirect('/waitsuccess')
        console.log('웨이팅 신청성공')
      }
      else if (결과2.isUseWait == false) {
        res.redirect('/waitalready')
        console.log('웨이팅 신청 되어있음')
      }
    })    
  })
})*/


app.post('/wait', 로그인했니, function(req, res){
  //db에서 데이터 꺼내기 - db.counter에서 name이 대기인원수인 데이터 찾기
  db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과1){
    var 대기인원수 = 결과1.totalWait
    var 대기사용수 = 결과1.totalUse

    // ------------------- 웨이팅 등록 최초 1회 ---------------
    db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과2) {
      if(에러) return done(에러)

      //로그인한 유저가 waitinfo에 없거나 이전에 사용한 사람이라면.. 웨이팅 신청 가능으로 db에.waitinfo에 저장
      if(결과2 == null) {

        //db 저장 - 웨이팅 신청 가능으로 db에.waitinfo에 저장 (_id : 총대기인원수+1로 새로운 데이터를 저장)
        db.collection('waitinfo').insertOne( {_id : 대기인원수 + 1, myNumber : 대기인원수 + 1, userid : req.user.id, wmac : 0, isUseWait : false} , function(에러, 결과){
          console.log('대기인원 데이터 저장완료');
          console.log(결과);

    
          //db 수정 - db.counter 내의 totalWait이라는 항목도 +1 증가(총대기인원수+1)
          //operator 종류 : $set(변경), $inc(증가), $min(기존값보다 적을 때만 변경), $rename(key값 이름변경)
          db.collection('counter').updateOne({name: '대기인원수'}, {$inc: {totalWait:1} }, function(에러, 결과){
            if(에러){return console.log(에러)}
          })
        })

        res.redirect('/waitsuccess')
        console.log('웨이팅 신청 성공')
        return
      }
      else {
        console.log('웨이팅 신청 실패')
      }
    })

    //db.waitinfo에 로그인한 유저의 id를 찾아서.. --------> find()로 변경해야할듯 
    db.collection('waitinfo').find({userid : req.user.id}).toArray(function(에러, 결과2) {
      if(에러) return done(에러)

      var 찾았니
      for (let i = 0; i < 결과2.length; i++) {
        if (결과2[i].isUseWait == true) {
          찾았니 = "못찾음"
        }
        else {
          찾았니 = "찾음"
        }
      }

      //로그인한 유저가 waitinfo에 없거나 이전에 사용한 사람이라면.. 웨이팅 신청 가능으로 db에.waitinfo에 저장
      if (찾았니 == "못찾음") {

        //db 저장 - 웨이팅 신청 가능으로 db에.waitinfo에 저장 (_id : 총대기인원수+1로 새로운 데이터를 저장)
        db.collection('waitinfo').insertOne( {_id : 대기인원수 + 1, myNumber : 대기인원수 + 1, userid : req.user.id, wmac : 0, isUseWait : false} , function(에러, 결과){
          console.log('대기인원 데이터 저장완료');
          console.log(결과);

          //db 수정 - db.counter 내의 totalWait이라는 항목도 +1 증가(총대기인원수+1)
          //operator 종류 : $set(변경), $inc(증가), $min(기존값보다 적을 때만 변경), $rename(key값 이름변경)
          db.collection('counter').updateOne({name: '대기인원수'}, {$inc: {totalWait:1} }, function(에러, 결과){
            if(에러){return console.log(에러)}
            res.redirect('/waitsuccess')
            console.log('웨이팅 신청성공')
          })
        })
      }
      else if (찾았니 == "찾음") {
        res.redirect('/waitalready')
        console.log('웨이팅 신청 되어있음')
      }
    })
  })
})


// 웨이팅 확인 페이지 이동
app.get('/waitcheck', 로그인했니, function(req, res) {
  console.log(req.user)

  //db.waitinfo에 로그인한 유저의 id를 찾아서..
  db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과) {
    
    //로그인한 유저가 waitinfo에 없다면.. -> 웨이팅 신청 한 번도 안함
    if(결과 == null) {
      res.redirect('/awaituse')
      console.log('웨이팅 신청 안하고 waitcheck한 경우');

      return
    }

    var 로그인한유저 = 결과.userid
    var 웨이팅사용여부 = 결과.isUseWait

    //유저의 웨이팅 신청수에 따라..
    db.collection('waitinfo').find({userid:로그인한유저}).count(function(에러, 결과1) {
      console.log("유저의웨이팅신청수 : " + 결과1);
      var 유저의웨이팅신청수 = 결과1

      if(유저의웨이팅신청수>1){   //웨이팅 신청 재사용 유저
        console.log("유저의웨이팅신청수가 1이상으로 재사용 유저입니다.");
        //유저의 웨이팅신청 목록 중 isUseWait이 false인 것을 찾음
        db.collection('waitinfo').findOne({userid : req.user.id, isUseWait : false}, function(에러, 결과){
          res.redirect('/bwaituse')
          console.log('웨이팅 사용 전 확인')
        })
      }
      else if(유저의웨이팅신청수==1){   //웨이팅 신청 처음 사용 유저
        console.log("유저의웨이팅신청수가 1로 처음 사용 유저입니다.");
        //웨이팅을 사용여부에 따라 다른 페이지 출력
        if(웨이팅사용여부){
          res.redirect('/awaituse')
          console.log('웨이팅 사용 후 확인')
        }
        else{
          res.redirect('/bwaituse')
          console.log('웨이팅 사용 전 확인')
        }
      }
    })  
  })
})

// 웨이팅 신청이 되어있으면 뿌려주는 페이지
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

  db.collection('waitinfo').find({userid : req.user.id}).count(function(에러, 결과1){
    console.log("유저의웨이팅신청수 : " + 결과1);
    var 유저의웨이팅신청수 = 결과1

    if(유저의웨이팅신청수>1){ //웨이팅 신청 재사용 유저
      console.log("유저의웨이팅수가 1이상으로 재사용 유저입니다.");
      //유저의 웨이팅신청 목록 중 isUseWait이 false인 것을 찾음
      db.collection('waitinfo').findOne({userid : req.user.id, isUseWait : false}, function(에러, 결과2){
        var myNumber = 결과2.myNumber
        console.log("/bwaituse 본인웨이팅번호 : " + myNumber)

        //db.counter에서 name이 대기인원수인 데이터 찾기
        db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과3){
          var totalWait = 결과3.totalWait
          var totalUse = 결과3.totalUse
          var left = myNumber - totalUse - 1

          console.log("/bwaituse 대기인원수 : " + totalWait)
          console.log("/bwaituse 대기사용수 : " + totalUse)
          console.log("/bwaituse 앞에남은인원수 : " + left)

         //찾은 데이터를 bwaituse.ejs 안에 넣기
          //req.user를 사용자라는 이름으로 보내기
          res.render('bwaituse.ejs', {사용자 : req.user, 본인웨이팅번호 : 결과2, 대기사용수 : 결과3})
        })
      })
    }
    else if(유저의웨이팅신청수==1){   //웨이팅 신청 처음 사용 유저
      console.log("유저의웨이팅신청수가 1로 처음 사용 유저입니다.");

       //db.waitinfo에 로그인한 유저의 id 찾기
      db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과4){
        var myNumber = 결과4.myNumber
        console.log("/bwaituse 본인웨이팅번호 : " + myNumber)

        //db.counter에서 name이 대기인원수인 데이터 찾기
        db.collection('counter').findOne({name: '대기인원수'}, function(에러, 결과5){
          var totalWait = 결과5.totalWait
          var totalUse = 결과5.totalUse
          var left = myNumber - totalUse - 1

          console.log("/bwaituse 대기인원수 : " + totalWait)
          console.log("/bwaituse 대기사용수 : " + totalUse)
          console.log("/bwaituse 앞에남은인원수 : " + left)

          //찾은 데이터를 bwaituse.ejs 안에 넣기
          //req.user를 사용자라는 이름으로 보내기
          res.render('bwaituse.ejs', {사용자 : req.user, 본인웨이팅번호 : 결과4, 대기사용수 : 결과5})
        })
      })
    }
  })

  //db.waitinfo에 로그인한 유저의 id 찾기
  /*db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과1){
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

      //찾은 데이터를 bwaituse.ejs 안에 넣기
      //req.user를 사용자라는 이름으로 보내기
      res.render('bwaituse.ejs', {사용자 : req.user, 본인웨이팅번호 : 결과1, 대기사용수 : 결과2})
    })
  })*/
})

// 웨이팅 등록하고 기기 작동시킨 후
// 
app.get('/awaituse', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('awaituse.ejs')
})

// 마이페이지
app.get('/mypage', 로그인했니, function(req, res) {
  console.log(req.user)
  res.render('mypage.ejs', {사용자 : req.user})
})

app.post('/mypage', 로그인했니, function(req, res) {
  //유저의 웨이팅 신청수에 따라..
  /*db.collection('waitinfo').find({userid : req.user.id}).count(function(에러, 결과){
    console.log("유저의웨이팅신청수 : " + 결과);
    var 유저의웨이팅신청수 = 결과
    
    if(유저의웨이팅신청수>1){   //웨이팅 신청 재사용 유저
      console.log("유저의웨이팅신청수가 1이상으로 재사용 유저입니다.");

      //유저의 웨이팅신청 목록 중 isUseWait이 false인 것을 찾음
      db.collection('waitinfo').findOne({userid : req.user.id, isUseWait : false}, function(에러, 결과8){
        console.log("myNum 3 맞음? : " + 결과8.myNumber);
        console.log("userid qqq 맞음? : " + 결과8.userid);
        var 재사용유저아이디 = 결과8.userid;
        console.log("재사용유저아이디 qqq 맞음? : " + 재사용유저아이디);
       
        //사용버튼을 클릭했으니, 위에서 찾은 id의 isUseWait을 true로 변경
        db.collection('waitinfo').updateOne({userid : 재사용유저아이디}, { $set: {isUseWait:true} }, function(에러3, 결과9){
          if(에러3){return console.log(에러3)}
          console.log("isUseWait true로 변경됨? 안될수도있음 : " + 결과9.isUseWait);
          console.log("----------");
          
          //db.waitinfo에 로그인한 유저의 id를 찾아서..
          db.collection('waitinfo').findOne({userid : 재사용유저아이디}, function(에러, 결과1){
            var 웨이팅사용여부 = 결과1.isUseWait

            console.log("웨이팅사용여부 : " + 웨이팅사용여부);
            //사용한 회원 관리
            if(웨이팅사용여부){ //웨이팅을 사용했다면..
              //db.counter 내의 totalWait -1 감소(대기인원수-1)
              db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalWait:-1} }, function(에러1, 결과) {
              if(에러1){return console.log(에러1)}

              //db.counter 내의 totalUse +1 증가(대기사용수+1)
              db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalUse:1} }, function(에러2, 결과) {
                if(에러2){return console.log(에러2)}

                console.log("웨이팅 사용완료 버튼 클릭")
                res.redirect('/mypage')
                })
              })
            }
          })
        })
      })
    }
    else if(유저의웨이팅신청수==1){   //웨이팅 신청 처음 사용 유저
      console.log("유저의웨이팅신청수가 1로 처음 사용 유저입니다.");

      //사용버튼을 클릭했으니, db.waitinfo 내의 isUseWait을 true로 변경
      db.collection('waitinfo').updateOne({userid : req.user.id}, { $set: {isUseWait:true} }, function(에러3, 결과10){
        if(에러3){return console.log(에러3)}
        
        //db.waitinfo에 로그인한 유저의 id를 찾아서..
        db.collection('waitinfo').findOne({userid : 결과10.userid}, function(에러, 결과1){
          var 웨이팅사용여부 = 결과1.isUseWait

          console.log("웨이팅사용여부 : " + 웨이팅사용여부);
          //사용한 회원 관리
          if(웨이팅사용여부){ //웨이팅을 사용했다면..
            //db.counter 내의 totalWait -1 감소(대기인원수-1)
            db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalWait:-1} }, function(에러1, 결과) {
            if(에러1){return console.log(에러1)}

            //db.counter 내의 totalUse +1 증가(대기사용수+1)
            db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalUse:1} }, function(에러2, 결과) {
              if(에러2){return console.log(에러2)}

              console.log("웨이팅 사용완료 버튼 클릭")
              res.redirect('/mypage')
              })
            })
          }
        })
      })

    }
    else if(유저의웨이팅신청수==0){   //로그인한 유저가 waitinfo에 없다면..
      res.redirect('/awaituse')
      console.log('웨이팅 신청 안하고 waitcheck함(웨이팅신청수=0)');
      return
    }
  })*/



  //사용버튼을 클릭했으니, db.waitinfo 내의 isUseWait을 true로 변경
  db.collection('waitinfo').updateOne({userid : req.user.id}, { $set: {isUseWait:true} }, function(에러3, 결과){
    if(에러3){return console.log(에러3)}

    //db.waitinfo에 로그인한 유저의 id를 찾아서..
    db.collection('waitinfo').findOne({userid : req.user.id}, function(에러, 결과1) {
      var 웨이팅사용여부 = 결과1.isUseWait

      //로그인한 유저가 waitinfo에 없다면..
      if(결과1 == null) {
        res.redirect('/awaituse')
        console.log('웨이팅 신청 안하고 waitcheck함');
        return
      }

      console.log("웨이팅사용여부 : " + 웨이팅사용여부);
      //사용한 회원 관리
      if(웨이팅사용여부){ //웨이팅을 사용했다면..
        //db.counter 내의 totalWait -1 감소(대기인원수-1)
        db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalWait:-1} }, function(에러1, 결과) {
          if(에러1){return console.log(에러1)}

          //db.counter 내의 totalUse +1 증가(대기사용수+1)
          db.collection('counter').updateOne({name: '대기인원수'}, { $inc: {totalUse:1} }, function(에러2, 결과) {
            if(에러2){return console.log(에러2)}

            console.log("웨이팅 사용완료 버튼 클릭")
            res.redirect('/')
          })
        })
      }
    })
  })
})