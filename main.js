var about = document.getElementById("about");
var dwp = document.getElementById("dwp");
var music = document.getElementById("music");
var sample = document.getElementById("sample");
var vid = document.getElementById("vid");
var dfs = document.getElementById("dfs");
var dps = document.getElementById("dps");

var ddf = document.getElementById("ddf");
var ddp = document.getElementById("ddp");
var mdf = document.getElementById("mdf");
var mdp = document.getElementById("mdp");
var vdw = document.getElementById("vdw");
var vtw = document.getElementById("vtw");
var mona = document.getElementById("mona");

function myfun(){
  if (about.style.display === "block"){
    about.style.display = "none";
  }
  else {
    about.style.display = "block";
  }
}

function home(){
  about.style.display = "none";
}

function downloa(){
  about.style.display = "none";
}

function sam() {
  if (dwp.style.display === "none") {
    dwp.style.display = "none";
    dwp.style.display = "none";
    dfs.style.display = "block";
    dps.style.display = "none";
    music.style.display = "none";
  }
  else {
    dwp.style.display = "none";
    vid.style.display = "none";
    dfs.style.display = "block";
    dps.style.display = "none";
    music.style.display = "none";
  }
}
function pay() {
  if (dwp.style.display === "none") {
    dwp.style.display = "none";
    vid.style.display = "none";
    dps.style.display = "block";
    dfs.style.display = "none";
    music.style.display = "none";
  }
  else {
    dwp.style.display = "none";
    vid.style.display = "none";
    dps.style.display = "block";
    dfs.style.display = "none";
    music.style.display = "none";
  }
}

function dfre() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "block";
    ddp.style.display = "none";
    music.style.display = "none";
  }
  else {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "block";
    ddp.style.display = "none";
    music.style.display = "none";
  }
}
function dpay() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "block";
    ddf.style.display = "none";
    music.style.display = "none";
  }
  else {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "block";
    ddf.style.display = "none";
    music.style.display = "none";
  }
}

function mfre() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    music.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "none";
    ddp.style.display = "none";
    mdf.style.display = "block";
    dwp.style.display = "none";
    mdp.style.display = "none";
  }
  else {
    sample.style.display = "none";
    music.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "none";
    ddp.style.display = "none";
    mdf.style.display = "block";
    dwp.style.display = "none";
    mdp.style.display = "none";
  }
}

function mpay() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    music.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "none";
    ddf.style.display = "none";
    dwp.style.display = "none";
    mdf.style.display = "none";
    mdp.style.display = "block";
  }
  else {
    sample.style.display = "none";
    music.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "none";
    ddf.style.display = "none";
    dwp.style.display = "none";
    mdf.style.display = "none";
    mdp.style.display = "block";
    
  }
}


function yov() {
  if (sample.style.display === "none") {
    
    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "block";
    vtw.style.display = "none";
    music.style.display = "none";
  }
  else {
    
    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "block";
    vtw.style.display = "none";
    music.style.display = "none";
  }
}
function ont() {
  if (sample.style.display === "none") {

    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "none";
    vtw.style.display = "block";
  }
  else {

    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "none";
    vtw.style.display = "block";
  }
}

function canc(){
  if (dfs.style.display === "block") {
    dfs.style.display = "none";
    dps.style.display = "none";
    dwp.style.display = "block";
    vid.style.display = "block";
    music.style.display = "block";
  }
  else {
    dfs.style.display = "none";
    dps.style.display = "none";
    dwp.style.display = "block";
    vid.style.display = "block";
    music.style.display = "block";
  }
}

function canci() {
  if (ddf.style.display === "block") {
    ddf.style.display = "none";
    dwp.style.top = "33%";
    ddp.style.display = "none";
    sample.style.display = "block";
    vid.style.display = "block";
    music.style.display = "block";
  }
  else {
    ddf.style.display = "none";
    dwp.style.top = "33%";
    ddp.style.display = "none";
    sample.style.display = "block";
    vid.style.display = "block";
    music.style.display = "block";
  }
}
function canl() {
  if (mdf.style.display === "block") {
    mdf.style.display = "none";
    mdp.style.display = "none";
    
    
   sample.style.display = "block";
   dwp.style.display = "block";
   vid.style.display = "block";
   music.style.top = "50%";
   
  }
  else {
    mdf.style.display = "none";
    mdp.style.display = "none";
    
     sample.style.display = "block";
     vid.style.display = "block";
     dwp.style.display = "block";
     music.style.top = "50%";
  
  }
}

function canco() {
  if (vdw.style.display === "block") {
    vdw.style.display = "none";
    vtw.style.display = "none";
   sample.style.display = "block";
   dwp.style.display = "block";
   vid.style.top = "67%";
   music.style.display = "block";
   
  }
  else {
    vdw.style.display = "none";
    vtw.style.display = "none";
     sample.style.display = "block";
     dwp.style.display = "block";
     vid.style.top = "67%";
     music.style.display = "block";
  
  }
}


function aboca(){
  about.style.display = "none";
}
const search = document.getElementById("search");
const moon = document.getElementById("moon");
const close = document.getElementById("close");
function darkmode() {
  const wasDarkmode = localStorage.getItem("darkmode") === "true";
  
  localStorage.setItem("darkmode", !wasDarkmode); 
  
  const element = document.body;
  
  document.body.classList.toggle("dark-mode", !wasDarkmode);
  if (document.body.classList.contains("dark-mode", !wasDarkmode)) {
    moon.src = "sun.png";
    search.src = "search.png";
    close.src = "close.png";
  } else {
    moon.src = "moon.svg";
    search.src = "search.svg";
    close.src = "";
  }
}

function onload(){
  document.body.classList.toggle("dark-mode",localStorage.getItem("darkmode") === "true");
  
    if (document.body.classList.contains("dark-mode",localStorage.getItem("darkmode") === "true")) {
      moon.src = "sun.png";
      search.src = "search.png";
    } else {
      moon.src = "moon.svg";
      search.src = "search.svg";
    }
}

var sbar = document.querySelector(".sea");
var body = document.querySelector(".container");
function sea(){
  if (sbar.style.display === "block") {
      sbar.style.display = "block";
      lov.style.position = "fixed";
      
  } else {
    sbar.style.display = "block";
    lov.style.position = "fixed";
    
  }
}
function cl(){
  if (sbar.style.display === "none") {
     sbar.style.display = "none";
     sear.style.display = "none";
    body.style.position = "absolute";
    lov.style.position = "absolute";
   
  } else {
     sbar.style.display = "none";
     sear.style.display = "none";
     body.style.position = "absolute";
    lov.style.position = "absolute";
  }
}