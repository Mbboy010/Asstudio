var about = document.getElementById("about");
var dwp = document.getElementById("dwp");
var sample = document.getElementById("sample");
var vid = document.getElementById("vid");
var dfs = document.getElementById("dfs");
var dps = document.getElementById("dps");
var ddf = document.getElementById("ddf");
var ddp = document.getElementById("ddp");
var vdw = document.getElementById("vdw");
var vtw = document.getElementById("vtw");

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
    vid.style.display = "none";
    dfs.style.display = "block";
    dps.style.display = "none";
  }
  else {
    dwp.style.display = "none";
    vid.style.display = "none";
    dfs.style.display = "block";
    dps.style.display = "none";
  }
}
function pay() {
  if (dwp.style.display === "none") {
    dwp.style.display = "none";
    vid.style.display = "none";
    dps.style.display = "block";
    dfs.style.display = "none";
  }
  else {
    dwp.style.display = "none";
    vid.style.display = "none";
    dps.style.display = "block";
    dfs.style.display = "none";
  }
}

function dfre() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "block";
    ddp.style.display = "none";
  }
  else {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddf.style.display = "block";
    ddp.style.display = "none";
  }
}
function dpay() {
  if (sample.style.display === "none") {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "block";
    ddf.style.display = "none";
  }
  else {
    sample.style.display = "none";
    dwp.style.top = "16%";
    vid.style.display = "none";
    ddp.style.display = "block";
    ddf.style.display = "none";
  }
}
function yov() {
  if (sample.style.display === "none") {
    
    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "block";
    vtw.style.display = "none";
  }
  else {
    
    vid.style.top = "16%";
    sample.style.display = "none";
    dwp.style.display = "none";
    vdw.style.display = "block";
    vtw.style.display = "none";
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
  }
  else {
    dfs.style.display = "none";
    dps.style.display = "none";
    dwp.style.display = "block";
    vid.style.display = "block";
  }
}

function canci() {
  if (ddf.style.display === "block") {
    ddf.style.display = "none";
    dwp.style.top = "33%";
    ddp.style.display = "none";
    sample.style.display = "block";
    vid.style.display = "block";
  }
  else {
    ddf.style.display = "none";
    dwp.style.top = "33%";
    ddp.style.display = "none";
    sample.style.display = "block";
    vid.style.display = "block";
  }
}
function canco() {
  if (vdw.style.display === "block") {
    vdw.style.display = "none";
    vtw.style.display = "none";
   sample.style.display = "block";
   dwp.style.display = "block";
   vid.style.top = "50%";
   
  }
  else {
    vdw.style.display = "none";
    vtw.style.display = "none";
     sample.style.display = "block";
     dwp.style.display = "block";
     vid.style.top = "50%";
  
  }
}
function aboca(){
  about.style.display = "none";
}
