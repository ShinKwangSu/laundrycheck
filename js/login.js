let idEl = document.querySelector('#id')
let pwEl = document.querySelector('#pw')
let btnEl = document.querySelector('button')

btnEl.addEventListener('click', function() {
  if (idEl.value == "") {
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
})