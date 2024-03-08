window.addEventListener("scroll", function(){
    let header = document.querySelector('#header-movimento')
    header.classList.toggle('rolagem',window.scrollY > 30)
})

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

