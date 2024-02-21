window.addEventListener("scroll", function(){
    let header = document.querySelector('#header-movimento')
    header.classList.toggle('rolagem',window.scrollY > 30)
})

document.addEventListener("mousemove", function(e) {
  
    var rocket = document.querySelector(".rocket");
    rocket.style.left = e.offsetX + 'px';
    rocket.style.top = e.offsetY + 'px';
    
  });