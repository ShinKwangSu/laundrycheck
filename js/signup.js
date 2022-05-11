const nameEl = document.querySelector('#name')
const idEl = document.querySelector('#id')
const pwEl = document.querySelector('#pw')
const pwCheckEl = document.querySelector('#pw-check')
const phoneEl = document.querySelector('#phone')
const btnEl = document.querySelector('button')
const spanEl = document.querySelector('span')
const form = document.querySelector('form')

function pwCheck() {
  if (pwEl.value != "" && pwCheckEl.value != "") {
    if (pwEl.value == pwCheckEl.value) {
      spanEl.classList.remove('different')
      spanEl.textContent = '비밀번호가 일치합니다.'
      return true
    }
    else if (pwEl.value != pwCheckEl.value) {
      spanEl.classList.add('different')
      spanEl.textContent = '비밀번호가 일치하지 않습니다.'
      return false
    }
  }
  else if (pwEl.value == "" || pwCheckEl.value == "") {
    spanEl.textContent = ''
  }
}

// 한글 입력 방지 -> 한글은 삭제
idEl.onkeyup = function() {
  var v = this.value;
  this.value = v.replace(/[^a-z0-9]/gi, '');
}

phoneEl.onkeyup = function() {
  var regexp = /[^0-9]/gi;
  this.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}

// submit(회원가입 버튼) 시 유효성 체크
// 추가적으로 비밀번호의 길이나 특수문자 포함 여부 등의 기능 넣을지 의논
function createId() {
  if (nameEl.value == "") {
    nameEl.nextElementSibling.classList.add('warning')
    setTimeout(function() {
      nameEl.nextElementSibling.classList.remove('warning')
    }, 1500)
  }
  else if (idEl.value == "") {
    idEl.nextElementSibling.classList.add('warning')
    setTimeout(function() {
      idEl.nextElementSibling.classList.remove('warning')
    }, 1500)
  }
  else if (pwEl.value == "") {
    pwEl.nextElementSibling.classList.add('warning')
    setTimeout(function() {
      pwEl.nextElementSibling.classList.remove('warning')
    }, 1500)
  }
  else if (pwCheckEl.value == "") {
    pwCheckEl.nextElementSibling.classList.add('warning')
    setTimeout(function() {
      pwCheckEl.nextElementSibling.classList.remove('warning')
    }, 1500)
  }
  else if (phoneEl.value == "") {
    phoneEl.nextElementSibling.classList.add('warning')
    setTimeout(function() {
      phoneEl.nextElementSibling.classList.remove('warning')
    }, 1500)
  }
  else if (pwCheck()){
    form.submit()
  }
}

/*
// 상황별 입력 제한
window.onload = function(){
  engAndNumberFunc(document.getElementById("id"));
  onlyNumberFunc(document.getElementById("phone1"));
  onlyNumberFunc(document.getElementById("phone2"));
  onlyNumberFunc(document.getElementById("phone3"));
  onlyKorFunc(document.getElementById("name"));
  onlyEngFunc(document.getElementById("location"));
}

//영문, 숫자만 입력가능한 keyup 이벤트 함수
function engAndNumberFunc(t){
  var regexp = /[^a-z0-9]/gi;
  t.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}

//숫자만 입력가능한 keyup 이벤트 함수
function onlyNumberFunc(t){
  var regexp = /[^0-9]/gi;
  t.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}

//영문만 입력가능한 keyup 이벤트 함수
function onlyEngFunc(t){
  var regexp = /[^a-z]/gi;
  t.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}

//한글만 입력가능한 keyup 이벤트 함수
function onlyKorFunc(t){
  var regexp = /[a-z0-9]|[ \[\]{}()<>?|`~!@#$%^&*-_+=,.;:\"'\\]/g;
  t.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}

//한글, 숫자만 입력가능한 keyup 이벤트 함수
function korAndNumberFunc(t){
  var regexp = /[^ㄱ-ㅎ가-힣0-9]/gi;
  t.onkeyup = function(e){
    var v = this.value;
    this.value = v.replace(regexp,'');
  }
}
*/