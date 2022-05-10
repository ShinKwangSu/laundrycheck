const nameEl = document.querySelector('#name')
const idEl = document.querySelector('#id')
const pwEl = document.querySelector('#pw')
const pwCheckEl = document.querySelector('#pw-check')
const phoneEl = document.querySelector('#phone')
const btnEl = document.querySelector('button')
const spanEl = document.querySelector('span')

// btnEl.addEventListener('click', function() {
//   if (nameEl.value == "") {
//     nameEl.nextElementSibling.classList.add('warning')
//     setTimeout(function() {
//       nameEl.nextElementSibling.classList.remove('warning')
//     }, 1500)
//   }
//   else if (idEl.value == "") {
//     idEl.nextElementSibling.classList.add('warning')
//     setTimeout(function() {
//       idEl.nextElementSibling.classList.remove('warning')
//     }, 1500)
//   }
//   else if (pwEl.value == "") {
//     pwEl.nextElementSibling.classList.add('warning')
//     setTimeout(function() {
//       pwEl.nextElementSibling.classList.remove('warning')
//     }, 1500)
//   }
//   else if (pwCheckEl.value == "") {
//     pwCheckEl.nextElementSibling.classList.add('warning')
//     setTimeout(function() {
//       pwCheckEl.nextElementSibling.classList.remove('warning')
//     }, 1500)
//   }
// })

function pwCheck() {
  if (pwEl.value != "" && pwCheckEl.value != "") {
    if (pwEl.value == pwCheckEl.value) {
      spanEl.classList.remove('different')
      spanEl.textContent = '비밀번호가 일치합니다.'
      btnEl.disabled = false
      return true
    }
    else if (pwEl.value != pwCheckEl.value) {
      spanEl.classList.add('different')
      spanEl.textContent = '비밀번호가 일치하지 않습니다.'
      btnEl.disabled = true
      return false
    }
  }
}

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
}