/*!
* Start Bootstrap - One Page Wonder v6.0.4 (https://startbootstrap.com/theme/one-page-wonder)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-one-page-wonder/blob/master/LICENSE)
*/
//Get the button
let mybutton = document.getElementById("btn-back-to-top");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (
    document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20
  ) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
// When the user clicks on the button, scroll to the top of the document
mybutton.addEventListener("click", backToTop);

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// Animation playback controls
document.getElementById("video-globe").playbackRate = 2.0;
document.getElementById("video-originals").playbackRate = 1.0;
document.getElementById("video-wildlings").playbackRate = 1.0;
document.getElementById("video-arrivals").playbackRate = 1.0;
document.getElementById("video-universals").playbackRate = 1.0;
document.getElementById("video-super-cool").playbackRate = 2.0;
document.getElementById("video-meta-moodon").playbackRate = 2.0;
document.getElementById("video-donation-card").playbackRate = 2.0;
document.getElementById("video-merch").playbackRate = 2.0;
document.getElementById("video-rocket").playbackRate = 1.2;