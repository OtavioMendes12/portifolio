window.addEventListener("scroll", function(){
    let header = document.querySelector('#header-movimento')
    header.classList.toggle('rolagem',window.scrollY > 30)
})